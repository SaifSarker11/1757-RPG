import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Motion } from "@/components/site/Motion";

const display = Cormorant_Garamond({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Hanken_Grotesk({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "1757 — The Battle of Plassey", template: "%s · 1757" },
  description:
    "A real-time social-deduction game set at the Battle of Plassey. 6–15 players, 20 secret roles, five rounds of trust and betrayal.",
  openGraph: {
    title: "1757 — The Battle of Plassey",
    description: "Real-time social deduction in the Nawab's court. Who will betray Bengal?",
    images: ["/images/hero-plassey.jpg"],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#14161f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="plassey"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base-100 text-base-content"><Motion />
        {children}
      </body>
    </html>
  );
}
