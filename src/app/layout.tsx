import type { Metadata } from "next";
import "@/components/arc/foundation.css";
import "./globals.css";
import { PwaRegistration } from "@/components/pwa-registration";
export const metadata: Metadata = {
  title: {
    default: "Stylora — Personal style studio",
    template: "%s | Stylora",
  },
  description: "A wardrobe and personal-style exploration space.",
  robots: { index: false, follow: false },
  applicationName: "Stylora",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
