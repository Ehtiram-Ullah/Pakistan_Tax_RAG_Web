import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxLens | Pakistan Tax Intelligence",
  description:
    "Explore Pakistani tax legislation with evidence-grounded answers, inspectable sources, and transparent Gemini model routing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
