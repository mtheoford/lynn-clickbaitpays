import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { generateSponsorMetadata, SponsorSitePage } from "@/app/page";
import { requestSurface } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return generateSponsorMetadata({ locale: "de" });
}

export default async function GermanHome() {
  const surface = await requestSurface();
  if (surface === "marketing") redirect("/de/get-your-site");
  if (surface === "admin") redirect("/admin");
  return <SponsorSitePage locale="de" />;
}
