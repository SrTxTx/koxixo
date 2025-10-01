import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthWrapper } from "@/components/auth-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Koxixo - Sistema de Pedidos",
  description: "Sistema de gestão de pedidos simples e eficiente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}
