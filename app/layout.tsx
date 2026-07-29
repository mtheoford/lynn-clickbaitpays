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

export const metadata: Metadata = {
  title: "ClickBaitPays with Lynn Theobald | Learn Before You Leap",
  description:
    "Explore ClickBaitPays with guided videos, practical resources, clear expectations, and independent sponsor support from Lynn Theobald.",
  openGraph: {
    title: "Explore ClickBaitPays with Lynn Theobald",
    description:
      "A clearer, more useful path through the videos, resources, fees, and next steps.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Explore ClickBaitPays with Lynn Theobald",
    description: "Learn the model, watch the videos, and decide with the facts in hand.",
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
