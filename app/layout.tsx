import "./globals.css";
import type { Metadata } from "next";
import FontLoader from "@/components/FontLoader";
import { Inter } from 'next/font/google'; // Keep Inter for UI if needed, remove others for canvas clarity

// Keep Inter for UI consistency
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: "Cardify – Business Card Designer",
  description: "Create stunning business cards effortlessly with Cardify.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-secondary">
        <FontLoader />
        {children}
      </body>
    </html>
  );
}
