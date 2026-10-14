import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Embedded driver tree · Metric Driver-Tree Studio",
  description: "Read-only embedded view of a driver tree shared from Metric Driver-Tree Studio.",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
