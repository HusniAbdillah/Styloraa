import type { Metadata } from "next";
import "@/components/arc/foundation.css";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Stylora — Personal style studio",
    template: "%s | Stylora",
  },
  description: "A wardrobe and personal-style exploration space.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
