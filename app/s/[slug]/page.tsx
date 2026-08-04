import type { Metadata } from "next";
import { SponsorSitePage } from "@/app/page";
import { resolveSponsorSite } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await resolveSponsorSite(slug);
  return {
    title: `Join ClickBaitPays with ${site.displayName}`,
    description: `Explore ClickBaitPays and get started with independent sponsor ${site.displayName}.`,
    robots: { index: false, follow: true },
    openGraph: {
      title: `Join ClickBaitPays with ${site.displayName}`,
      description: `A clear, independent sponsor guide from ${site.displayName}.`,
      type: "website",
      images: [{ url: "/og.png", width: 1536, height: 1024 }],
    },
  };
}

export default async function PathTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SponsorSitePage slug={slug} />;
}
