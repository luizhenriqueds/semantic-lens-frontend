// Split out of sections.tsx so the client sections can share the placeholder without pulling the
// server-only data layer into the browser bundle.

export function BlockSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div className="infoblock" aria-hidden="true">
      <div className="skel" style={{ height, borderRadius: 12 }} />
    </div>
  );
}

export function InlineSkeleton({ width = 90, height = 22 }: { width?: number; height?: number }) {
  return (
    <span className="skel" style={{ display: "inline-block", width, height }} aria-hidden="true" />
  );
}
