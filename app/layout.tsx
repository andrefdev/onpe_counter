import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONPE Tracker - Elecciones 2026",
  description: "Seguimiento en tiempo real de resultados electorales ONPE 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
