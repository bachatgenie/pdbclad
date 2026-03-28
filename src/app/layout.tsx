import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDBclad — Personal Dashboard for Life",
  description: "Your second brain and life operating system. Track everything, forget nothing.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-bg-primary text-text-primary">
        {children}
      </body>
    </html>
  );
}
