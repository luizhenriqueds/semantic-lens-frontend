import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withRetry, type QueryResult } from "./client";

const TIMEOUT_ERROR = { message: "canceling statement due to statement timeout" };
const CONN_ERROR = { message: "fetch failed" };

function failThenSucceed<T>(error: { message: string }, succeedOn: number) {
  let call = 0;
  return vi.fn(async (): Promise<QueryResult<T>> => {
    call++;
    return call >= succeedOn ? { data: [], error: null } : { data: null, error };
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("withRetry", () => {
  it("does not retry a statement timeout by default", async () => {
    const build = failThenSucceed(TIMEOUT_ERROR, 2);
    const result = await withRetry(build);
    expect(build).toHaveBeenCalledTimes(1);
    expect(result.error).toEqual(TIMEOUT_ERROR);
  });

  it("retries a statement timeout when the caller opts in", async () => {
    const build = failThenSucceed(TIMEOUT_ERROR, 2);
    const promise = withRetry(build, { timeoutRetries: 3 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(build).toHaveBeenCalledTimes(2);
    expect(result.error).toBeNull();
  });

  it("retries other transient failures even without opting in", async () => {
    const build = failThenSucceed(CONN_ERROR, 2);
    const promise = withRetry(build);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(build).toHaveBeenCalledTimes(2);
    expect(result.error).toBeNull();
  });

  it("caps timeout retries at timeoutRetries", async () => {
    const build = vi.fn(async (): Promise<QueryResult<unknown>> => ({
      data: null,
      error: TIMEOUT_ERROR,
    }));
    const promise = withRetry(build, { timeoutRetries: 1 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(build).toHaveBeenCalledTimes(2);
    expect(result.error).toEqual(TIMEOUT_ERROR);
  });

  it("keeps the full budget for non-timeout failures when timeoutRetries is capped", async () => {
    const build = vi.fn(async (): Promise<QueryResult<unknown>> => ({
      data: null,
      error: CONN_ERROR,
    }));
    const promise = withRetry(build, { timeoutRetries: 1 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(build).toHaveBeenCalledTimes(4);
    expect(result.error).toEqual(CONN_ERROR);
  });

  it("gives up after 3 retries", async () => {
    const build = vi.fn(async (): Promise<QueryResult<unknown>> => ({
      data: null,
      error: CONN_ERROR,
    }));
    const promise = withRetry(build);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(build).toHaveBeenCalledTimes(4);
    expect(result.error).toEqual(CONN_ERROR);
  });

  it("reads a bodyless server failure as a timeout", async () => {
    const build = vi.fn(async (): Promise<QueryResult<unknown>> => ({
      data: null,
      error: { message: "" },
      status: 500,
    }));
    const promise = withRetry(build);
    await vi.runAllTimersAsync();
    expect(build).toHaveBeenCalledTimes(1);
  });

  it("reads SQLSTATE 57014 as a timeout whatever the message says", async () => {
    const build = vi.fn(async (): Promise<QueryResult<unknown>> => ({
      data: null,
      error: { message: "query cancelled", code: "57014" },
      status: 500,
    }));
    const promise = withRetry(build, { timeoutRetries: 1 });
    await vi.runAllTimersAsync();
    await promise;
    expect(build).toHaveBeenCalledTimes(2);
  });

  it("retries a gateway status even with no message", async () => {
    const build = vi.fn(async (): Promise<QueryResult<unknown>> => ({
      data: null,
      error: { message: "" },
      status: 503,
    }));
    const promise = withRetry(build);
    await vi.runAllTimersAsync();
    await promise;
    expect(build).toHaveBeenCalledTimes(4);
  });

  it("does not retry a rejected filter", async () => {
    const build = vi.fn(async (): Promise<QueryResult<unknown>> => ({
      data: null,
      error: { message: 'column "nope" does not exist', code: "42703" },
      status: 400,
    }));
    await withRetry(build, { timeoutRetries: 3 });
    expect(build).toHaveBeenCalledTimes(1);
  });
});
