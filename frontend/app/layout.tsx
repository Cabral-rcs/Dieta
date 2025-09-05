import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Organizador de Dieta Semanal",
  description: "Planeje suas refeições com estilo e organização!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  );
}