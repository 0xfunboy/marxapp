import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap"
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-secondary",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Marxapp v0.1",
  description: "Didactic simulator for redistribution and essential services access"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceSans.variable}`}>{children}</body>
    </html>
  );
}
