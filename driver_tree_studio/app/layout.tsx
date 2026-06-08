import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Metric Driver-Tree Studio",
  description:
    "Honest driver-tree studio separating identities, declared assumptions, and untested beliefs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} min-h-screen bg-bg-app text-text-primary`}>
        {children}
      </body>
    </html>
  );
}
