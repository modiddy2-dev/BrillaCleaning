import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brilla Owner",
  applicationName: "Brilla Cleaning",
  manifest: "/owner.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Brilla Owner" },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
