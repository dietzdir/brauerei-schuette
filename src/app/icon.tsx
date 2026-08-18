import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #145863 0%, #082c32 100%)",
          borderRadius: "6px",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Stem */}
          <path d="M12 2v2" stroke="#2dd4bf" strokeWidth="2.5" />
          {/* Hop Scales */}
          <path d="M12 4c2.5 1 4 3 2 6-2 3-2 3-2 3s0 0-2-3c-2-3-.5-5 2-6z" fill="#00A8BC" fillOpacity="0.6" stroke="#2dd4bf" />
          <path d="M8 8c-2 1.5-2.5 4 0 6 2 1.5 3 1.5 3 1.5s-1-2-1.5-4c-.5-2-.5-3-1.5-3.5z" fill="#00A8BC" fillOpacity="0.4" stroke="#2dd4bf" />
          <path d="M16 8c2 1.5 2.5 4 0 6-2 1.5-3 1.5-3 1.5s1-2 1.5-4c.5-2 .5-3 1.5-3.5z" fill="#00A8BC" fillOpacity="0.4" stroke="#2dd4bf" />
          <path d="M10 13c-2 1.5-2 3.5 0 5 1.5 1 2 1 2 1s-.5-1.5-1-3c-.5-1.5-.5-2.5-1-3z" fill="#00A8BC" fillOpacity="0.3" stroke="#2dd4bf" />
          <path d="M14 13c2 1.5 2 3.5 0 5-1.5 1-2 1-2 1s.5-1.5 1-3c.5-1.5.5-2.5 1-3z" fill="#00A8BC" fillOpacity="0.3" stroke="#2dd4bf" />
          <path d="M12 17c1 .8 1.5 2 0 3-1.5-1-1-2.2 0-3z" fill="#ffffff" stroke="#2dd4bf" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
