import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IdeaBreeder.ai - Watch AI Evolve Startup Ideas",
  description: "A living AI that breeds and evolves startup ideas in real-time. Watch it think, see the gene pool grow, discover your next big idea.",
  openGraph: {
    title: "IdeaBreeder.ai",
    description: "Watch AI evolve startup ideas in real-time",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
