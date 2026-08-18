import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Handwerksbrauerei Schütte",
    short_name: "Brauerei Schütte",
    description:
      "Bestell-App der Handwerksbrauerei Schütte in Rottmersleben. Frisches Bier & Fassbrause direkt vorbestellen und abholen.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F4851",
    theme_color: "#0F4851",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
