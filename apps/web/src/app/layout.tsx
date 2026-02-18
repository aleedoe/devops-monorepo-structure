import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monorepo Demo — Shared Validators",
  description: "A minimal PNPM + Turborepo monorepo demonstrating shared Zod validators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
