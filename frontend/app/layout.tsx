import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus INPT",
  description: "Assistant universitaire intelligent pour les étudiants de l'INPT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
