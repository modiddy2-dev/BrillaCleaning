import type { Metadata, Viewport } from "next";
import { Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["500", "700", "900"], variable: "--font-cinzel" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jakarta" });

const icons = [
  { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
  { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
];

export const metadata: Metadata = {
  title: "Brilla Cleaning",
  description: "Owner and cleaner apps for Brilla Cleaning in Dubuque.",
  applicationName: "Brilla Cleaning",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  // Opaque status bar keeps the header below the notch on installed PWAs.
  appleWebApp: { capable: true, statusBarStyle: "black", title: "Brilla" },
  icons: { icon: icons, apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
};

export const viewport: Viewport = {
  themeColor: "#0c0f17",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${jakarta.variable} min-h-screen bg-dark-base font-sans text-slate-100 antialiased selection:bg-brand-500 selection:text-black`}>
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
