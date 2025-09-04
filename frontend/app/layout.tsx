// frontend/app/layout.tsx
import "./globals.css"; // se estiver usando Tailwind

export const metadata = {
  title: "Diet App",
  description: "Aplicativo de dieta semanal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}