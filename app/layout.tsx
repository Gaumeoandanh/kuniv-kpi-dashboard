import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K-UNIV KPI Dashboard",
  description: "Internal KPI dashboard for K-UNIV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
