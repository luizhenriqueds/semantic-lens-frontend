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
      {/* 120, not 134: this mark's ink is wider than the one it replaced. */}
      <svg width="120" height="120" viewBox="0 0 48 48">
        <path
          d="M25 9H15a9 9 0 0 0-9 9v14a9 9 0 0 0 9 9h18a9 9 0 0 0 9-9v-14"
          fill="none"
          stroke="#fbfcfb"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="#fbfcfb">
          <rect x="12.5" y="27" width="5" height="7" rx="2.5" />
          <rect x="21.75" y="22" width="5" height="12" rx="2.5" />
          <rect x="31" y="5" width="5" height="29" rx="2.5" />
        </g>
      </svg>
    </div>,
    size,
  );
}
