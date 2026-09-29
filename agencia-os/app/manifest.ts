import type { MetadataRoute } from "next";

// Permite instalar la app en la pantalla de inicio: en iPhone es imprescindible
// para recibir avisos push. Los colores del manifiesto tienen que ser literales:
// son --bg de app/globals.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atlis",
    short_name: "Atlis",
    description: "Sistema operativo interno de Atlis.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c0e",
    theme_color: "#0b0c0e",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
