import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestão de Dívidas",
    short_name: "Dívidas",
    description: "Sistema de gestão de dívidas e compras parceladas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#2563eb",
    icons: [
      // Chrome aceita SVG como ícone; usamos o que já existe no projeto.
      { src: "/logo_circular.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/logo_circular.png", sizes: "180x180", type: "image/png" },
      { src: "/logo_circular.png", sizes: "32x32", type: "image/png" },
      { src: "/logo_circular.png", sizes: "32x32", type: "image/png" },
    ],
  }
}


