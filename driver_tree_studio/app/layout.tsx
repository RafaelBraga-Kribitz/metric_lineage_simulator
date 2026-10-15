import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/800.css";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESCRIPTION =
  "Driver-tree studio for KPI design: keeps definitional identities, declared elasticities and untested beliefs apart, forecasts ranges, tests relationships on your own CSV, and ranks which guess to test first.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Metric Driver-Tree Studio", template: "%s" },
  description: DESCRIPTION,
  applicationName: "Metric Driver-Tree Studio",
  authors: [{ name: "Rafael Braga-Kribitz" }],
  keywords: ["driver tree", "KPI", "Kennzahlen", "contribution margin", "value of information", "Monte Carlo", "e-commerce analytics"],
  openGraph: { type: "website", title: "Metric Driver-Tree Studio", description: DESCRIPTION, images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "Metric Driver-Tree Studio", description: DESCRIPTION, images: ["/og.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen bg-bg-app text-text-primary">
        {children}
      </body>
    </html>
  );
}
