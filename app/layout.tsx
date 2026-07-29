import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "lynn-clickbaitpays.theoford.chatgpt.site";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "Join ClickBaitPays with Lynn Theobald",
    description:
      "Explore ClickBaitPays campaign strategies, model illustrative direct-referral commissions, and get started with Lynn Theobald.",
    openGraph: {
      title: "Join ClickBaitPays with Lynn Theobald",
      description:
        "See the three-campaign rhythm and model illustrative direct-referral commissions.",
      type: "website",
      images: [{ url: socialImage, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Join ClickBaitPays with Lynn Theobald",
      description: "Campaign rhythm and referral potential, explained in plain English.",
      images: [socialImage],
    },
  };
}

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
