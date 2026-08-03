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
  "https://lynn-clickbaitpays.theoford.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Personal CBP Sites | ProNeurs",
    template: "%s | ProNeurs",
  },
  description:
    "Professional, personalized ClickBaitPays sponsor pages from ProNeurs.",
  openGraph: {
    title: "Personal CBP Sites by ProNeurs",
    description:
      "A professional ClickBaitPays sponsor page with your referral link and contact information.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal CBP Sites by ProNeurs",
    description:
      "Your professional, personalized ClickBaitPays sharing page.",
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
