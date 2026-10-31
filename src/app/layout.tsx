import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "@/components/arc/foundation.css";
import "./globals.css";
import { PwaRegistration } from "@/components/pwa-registration";
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
  applicationName: "Stylora",
  appleWebApp: { title: "Stylora" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
        <PwaRegistration />
      </body>
    </html>
  );
}
