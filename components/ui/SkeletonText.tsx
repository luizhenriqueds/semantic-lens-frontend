export default function SkeletonText({
  width = 120,
  height = 12,
}: {
  width?: number | string;
  height?: number;
}) {
  return (
    <span
      className="skel"
      role="status"
      aria-label="Calculando"
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: 6,
        verticalAlign: "-1px",
      }}
    />
  );
}
