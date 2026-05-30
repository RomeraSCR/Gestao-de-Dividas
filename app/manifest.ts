import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinanzLivre - Gestão Financeira Pessoal 100% Grátis",
    short_name: "FinanzLivre",
    description: "Sistema de gestão financeira pessoal e controle de gastos totalmente gratuito.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#2563eb",
    icons: [
      { src: "/logo_circular.png", sizes: "180x180", type: "image/png" },
      { src: "/logo_circular.png", sizes: "32x32", type: "image/png" },
    ],
  }
}


