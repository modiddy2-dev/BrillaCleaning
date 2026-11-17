import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brilla Cleaner",
  applicationName: "Brilla Cleaning",
  manifest: "/cleaner.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black", title: "Brilla Cleaner" },
};

export default function CleanerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
