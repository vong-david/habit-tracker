import type { Metadata } from "next";
import { Kantumruy_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kantumruy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Habit Tracker - កម្មវិធីតាមដានទម្លាប់ និងសុខភាព",
  description: "កម្មវិធីតាមដានទម្លាប់ប្រចាំថ្ងៃ និងសុខភាពទូទៅ បែប Spreadsheet ទំនើប ងាយស្រួលប្រើលើទូរស័ព្ទ និងកុំព្យូទ័រ។",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km" className="dark">
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </head>
      <body className={`${kantumruy.className} min-h-screen antialiased selection:bg-emerald-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
