import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

// Shared SVG defaults for every line icon: 24-grid, no fill, currentColor stroke.
export const base = (props: IconProps) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  ...props,
});
