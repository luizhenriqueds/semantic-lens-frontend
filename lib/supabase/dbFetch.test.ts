import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Read at module load, so set before the import.
process.env.DB_MAX_CONCURRENCY = "2";
process.env.DB_QUEUE_TIMEOUT_MS = "1000";
process.env.DB_TIMEOUT_MS = "5000";

const { dbFetch, dbPoolStats } = await import("./dbFetch");

let release: Array<() => void> = [];

function hangingFetch() {
  return vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        release.push(() => resolve(new Response("{}", { status: 200 })));
      }),
  );
}

beforeEach(() => {
  release = [];
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("dbFetch", () => {
  it("holds requests past the limit until a permit frees up", async () => {
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const all = [1, 2, 3].map((i) => dbFetch(`http://db.test/rest/v1/t${i}`));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(dbPoolStats()).toMatchObject({ inFlight: 2, queued: 1 });

    release[0]();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    release.forEach((r) => r());
    await Promise.all(all);
    expect(dbPoolStats()).toMatchObject({ inFlight: 0, queued: 0 });

    vi.unstubAllGlobals();
  });

  it("releases its permit when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET");
      }),
    );

    await expect(dbFetch("http://db.test/rest/v1/t")).rejects.toThrow("ECONNRESET");
    expect(dbPoolStats()).toMatchObject({ inFlight: 0, queued: 0 });

    vi.unstubAllGlobals();
  });

  it("rejects a caller that waits longer than the queue budget", async () => {
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const held = [dbFetch("http://db.test/a"), dbFetch("http://db.test/b")];
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await expect(dbFetch("http://db.test/c")).rejects.toThrow(/db queue timeout/);

    release.forEach((r) => r());
    await Promise.all(held);
    expect(dbPoolStats()).toMatchObject({ inFlight: 0, queued: 0 });

    vi.unstubAllGlobals();
  });
});
