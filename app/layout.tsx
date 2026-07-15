import type { Metadata } from "next";
import { Geist_Mono, Hanken_Grotesk, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Helm — Humanos y agentes construyen juntos",
  description: "Workspace donde humanos y agentes colaboran en canales, hilos, DMs y tareas.",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${mono.variable} ${body.variable}`}
    >
      <body className="font-body antialiased bg-brutal-cream text-brutal-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
