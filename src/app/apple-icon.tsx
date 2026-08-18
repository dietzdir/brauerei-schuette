import { ImageResponse } from "next/og";

// Image metadata for Apple Touch Icon (iPhone / iPad)
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #145863 0%, #082c32 100%)",
        }}
      >
        {/* Subtle decorative inner ring */}
        <div
          style={{
            position: "absolute",
            width: "154px",
            height: "154px",
            borderRadius: "40px",
            border: "2px solid rgba(0, 168, 188, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        {/* Lucide Beer Icon in High-Resolution Vector */}
        <svg
          width="104"
          height="104"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Handle */}
          <path d="M17 11h1a3 3 0 0 1 0 6h-1" stroke="#2dd4bf" strokeWidth="2" />
          {/* Glass Inner Beer Lines */}
          <path d="M9 12v6" stroke="#f59e0b" strokeWidth="1.6" />
          <path d="M13 12v6" stroke="#f59e0b" strokeWidth="1.6" />
          {/* Foam / Schaumkrone */}
          <path
            d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 3 11 3s2 .5 3 .5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="1.6"
          />
          {/* Glass Mug Body */}
          <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" stroke="#ffffff" strokeWidth="1.8" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
