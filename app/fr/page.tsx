import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { generateSponsorMetadata, SponsorSitePage } from "@/app/page";
import { requestSurface } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return generateSponsorMetadata({ locale: "fr" });
}

export default async function FrenchHome() {
  const surface = await requestSurface();
  if (surface === "marketing") redirect("/fr/get-your-site");
  if (surface === "admin") redirect("/admin");
  return <SponsorSitePage locale="fr" />;
}
