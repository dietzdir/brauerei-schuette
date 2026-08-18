import { ImageResponse } from "next/og";

// Image metadata for Apple Touch Icon (iPhone / iPad)
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Image generation
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

        {/* Crisp Hop Cone SVG */}
        <svg
          width="106"
          height="106"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Stem */}
          <path d="M12 2v2.5" stroke="#2dd4bf" strokeWidth="2" />
          {/* Hop Scales / Blätter */}
          <path
            d="M12 4.5c3 1.2 4.8 3.6 2.4 7.2-2.4 3.6-2.4 3.6-2.4 3.6s0 0-2.4-3.6c-2.4-3.6-.6-6 2.4-7.2z"
            fill="#00A8BC"
            fillOpacity="0.75"
            stroke="#2dd4bf"
          />
          <path
            d="M7.2 8.8c-2.4 1.8-3 4.8 0 7.2 2.4 1.8 3.6 1.8 3.6 1.8s-1.2-2.4-1.8-4.8c-.6-2.4-.6-3.6-1.8-4.2z"
            fill="#00A8BC"
            fillOpacity="0.55"
            stroke="#2dd4bf"
          />
          <path
            d="M16.8 8.8c2.4 1.8 3 4.8 0 7.2-2.4 1.8-3.6 1.8-3.6 1.8s1.2-2.4 1.8-4.8c.6-2.4.6-3.6 1.8-4.2z"
            fill="#00A8BC"
            fillOpacity="0.55"
            stroke="#2dd4bf"
          />
          <path
            d="M9.6 14.5c-2.4 1.8-2.4 4.2 0 6 1.8 1.2 2.4 1.2 2.4 1.2s-.6-1.8-1.2-3.6c-.6-1.8-.6-3-1.2-3.6z"
            fill="#00A8BC"
            fillOpacity="0.4"
            stroke="#2dd4bf"
          />
          <path
            d="M14.4 14.5c2.4 1.8 2.4 4.2 0 6-1.8 1.2-2.4 1.2-2.4 1.2s.6-1.8 1.2-3.6c.6-1.8.6-3 1.2-3.6z"
            fill="#00A8BC"
            fillOpacity="0.4"
            stroke="#2dd4bf"
          />
          <path
            d="M12 18.5c1.2 1 1.8 2.5 0 3.8-1.8-1.3-1.2-2.8 0-3.8z"
            fill="#ffffff"
            stroke="#2dd4bf"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
