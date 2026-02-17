import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codex Seat Meter",
  description: "Multi-seat Codex usage monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-0 text-zinc-300 antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
