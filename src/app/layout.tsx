import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "@/components/arc/foundation.css";
import "./globals.css";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-stylora-inter",
  display: "swap",
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-stylora-serif",
  display: "swap",
});
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${instrument.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
