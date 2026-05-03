import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Bondhon — Premium Matrimony",
    template: "%s | Bondhon Matrimony",
  },
  description:
    "Find your perfect life partner on Bondhon — Bangladesh's most trusted premium matrimony platform.",
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
