import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Sniplink - AI-Powered URL Shortener",
  description:
    "Shorten URLs, track clicks, and get AI-powered marketing insights with Sniplink.",
};

export const viewport: Viewport = {
  themeColor: "#0A7CFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
