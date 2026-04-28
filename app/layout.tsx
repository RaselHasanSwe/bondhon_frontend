import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bondhon — Matrimony Platform",
    template: "%s | Bondhon Matrimony",
  },
  description:
    "Find your perfect life partner on Bondhon — Bangladesh's trusted matrimony platform.",
  keywords: [
    "matrimony",
    "marriage profile",
    "bride",
    "groom",
    "matchmaking",
    "Bangladesh",
  ],
  openGraph: {
    siteName: "Bondhon Matrimony",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F8F9FB] text-[#1F2937] antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
