import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { APPEARANCE_COOKIE, appearanceAttributes, parseAppearanceCookie } from "@/lib/preferences";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Atlis",
  description: "Sistema operativo interno de Atlis.",
  icons: {
    icon: "/atlis-mark.png",
    shortcut: "/atlis-mark.png",
    apple: "/apple-touch-icon.png",
  },
  // Instalada en la pantalla de inicio, se abre como app (necesario para los avisos en iPhone).
  appleWebApp: { capable: true, title: "Atlis", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Apariencia de Ajustes (tema, acento, tamaño de texto, animaciones) desde el primer render.
  const appearance = parseAppearanceCookie((await cookies()).get(APPEARANCE_COOKIE)?.value);
  return (
    <html lang="es" className={appearance.theme === "light" ? undefined : "dark"} {...appearanceAttributes(appearance)}>
      {/* Browser extensions may add attributes such as cz-shortcut-listen before hydration. */}
      <body suppressHydrationWarning className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <Toaster theme={appearance.theme} richColors position="bottom-right" />
      </body>
    </html>
  );
}
