import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import FabSupport from "@/components/fab-support";
import ColorfulCursorTrail from "@/components/CursorTrail";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "InternHunt — Curated internships & jobs, one feed",
  description:
    "The internship and job feed that filters the noise. Hand-checked listings, live, for ₹49 / 7 days.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${inter.variable}`}>
        <ColorfulCursorTrail />
        {children}
        <FabSupport />
      </body>
    </html>
  );
}