import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meituan FitQuest",
  description: "A mobile-first gamified fitness prototype for university students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
