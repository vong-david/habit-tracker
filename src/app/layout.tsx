import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habit Tracker & Wellness Dashboard",
  description: "A sleek spreadsheet-style habit tracker and wellness dashboard ready to host on Vercel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
