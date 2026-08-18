import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TRACE — Programming Lab & Assessment Platform",
    short_name: "TRACE",
    description:
      "Trace the work, not the screen. TRACE is a programming lab platform for practical authoring, automated test execution, and process-aware teacher review.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0d14",
    theme_color: "#0a0d14",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
