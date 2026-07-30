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
  title: "Join ClickBaitPays with Lynn Theobald",
  description:
    "Explore ClickBaitPays campaign strategies, model illustrative direct-referral commissions, and get started with Lynn Theobald.",
  openGraph: {
    title: "Join ClickBaitPays with Lynn Theobald",
    description:
      "See the three-campaign rhythm and model illustrative direct-referral commissions.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Join ClickBaitPays with Lynn Theobald",
    description:
      "Campaign rhythm and referral potential, explained in plain English.",
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
