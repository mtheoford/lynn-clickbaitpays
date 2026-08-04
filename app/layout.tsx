import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
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
    default: "ClickBaitPays Replicated Sites | ProNeurs",
    template: "%s | ProNeurs",
  },
  description:
    "Personalized ClickBaitPays replicated sites with your referral link and ready-to-share marketing materials.",
  openGraph: {
    title: "ClickBaitPays Replicated Sites by ProNeurs",
    description:
      "Your custom CBP growth hub with a referral link, videos, resources, and marketing materials.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClickBaitPays Replicated Sites by ProNeurs",
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
        {children}
      </body>
    </html>
  );
}
