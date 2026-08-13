import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2f5d3a",
      }}
    >
      {/* Nudged down in y: the mark's ink centres on 21.375, not on the viewBox's 24. */}
      <svg width="134" height="134" viewBox="0 0 48 48">
        <g transform="translate(0 2.625)" fill="#fbfcfb">
          <g
            fill="none"
            stroke="#fbfcfb"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 11H6v26h5" />
            <path d="M37 11h5v26h-5" />
          </g>
          <rect x="14.5" y="26" width="5" height="7" rx="2.5" />
          <rect x="21.5" y="21" width="5" height="12" rx="2.5" />
          <rect x="28.5" y="4" width="5" height="29" rx="2.5" />
        </g>
      </svg>
    </div>,
    size,
  );
}
