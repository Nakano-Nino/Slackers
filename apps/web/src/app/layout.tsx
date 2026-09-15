import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slackers | Fullstack Next.js & Node.js",
  description: "Fullstack collaborative messaging web application built with Next.js and Node.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-neutral-950 text-neutral-100">{children}</body>
    </html>
  );
}
