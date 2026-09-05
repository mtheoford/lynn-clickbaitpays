import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Manrope } from "next/font/google";
import DocumentLocale from "./DocumentLocale";
import SiteCopyright from "./SiteCopyright";
import LanguageSelector from "./LanguageSelector";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://mtheoford.github.io/lynn-clickbaitpays/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ClickBaitPays Replicated Sites | ProNeurs™",
    template: "%s | ProNeurs™",
  },
  description:
    "Personalized ClickBaitPays replicated sites with your referral link and ready-to-share marketing materials.",
  icons: {
    icon: [{ url: "/cbp-mark.png", type: "image/png", sizes: "256x256" }],
    shortcut: "/cbp-mark.png",
    apple: [{ url: "/cbp-mark.png", type: "image/png", sizes: "256x256" }],
  },
  openGraph: {
    title: "ClickBaitPays Replicated Sites by ProNeurs™",
    description:
      "Your custom CBP growth hub with a referral link, videos, resources, and marketing materials.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClickBaitPays Replicated Sites by ProNeurs™",
    description:
      "Your personalized ClickBaitPays replicated site—ready to share.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${manrope.variable}`}
      >
        <DocumentLocale />
        <Suspense fallback={<div className="language-banner-placeholder" aria-hidden="true" />}>
          <LanguageSelector />
        </Suspense>
        {children}
        <SiteCopyright />
      </body>
    </html>
  );
}
