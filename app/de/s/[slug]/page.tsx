import type { Metadata } from "next";
import { generateSponsorMetadata, SponsorSitePage } from "@/app/page";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return generateSponsorMetadata({ locale: "de", slug });
}

export default async function GermanPathTenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SponsorSitePage locale="de" slug={slug} />;
}
