import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { sites } from "@/db/schema";
import {
  DEMO_SITE_SLUG,
  LEGACY_DEMO_SITE_SLUG,
  normalizeSiteSlug,
  slugFromHost,
} from "@/lib/site-routing";

export {
  formatPhoneForDisplay,
  generatedSponsorBio,
  localizeSponsorBio,
  phoneHref,
} from "@/lib/site-presentation";

export {
  DEMO_SITE_SLUG,
  isLegacyDemoSiteSlug,
  LEGACY_DEMO_SITE_SLUG,
  normalizeSiteSlug,
  siteUrl,
  slugFromHost,
  validateReferralUrl,
  validateSiteSlug,
} from "@/lib/site-routing";

export type PublicSponsorSite = {
  id: string;
  slug: string;
  displayName: string;
  initials: string;
  publicEmail: string;
  publicPhone: string;
  showEmail: boolean;
  showPhone: boolean;
  bio: string;
  referralUrl: string;
  isDemo: boolean;
  status: "pending" | "active" | "past_due" | "suspended" | "canceled" | "deleted";
};

export const defaultSponsorSite: PublicSponsorSite = {
  id: "site_lynn_theobald",
  slug: DEMO_SITE_SLUG,
  displayName: "Your Name",
  initials: "YN",
  publicEmail: "demo@proneurs.org",
  publicPhone: "0000000000",
  showEmail: false,
  showPhone: false,
  bio: "Your introduction will appear here, giving visitors a clear and welcoming way to learn about ClickBaitPays with you.",
  referralUrl: "https://clickbaitpays.me/",
  isDemo: true,
  status: "active",
};

export function growthSignupUrl(slug: string): string {
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://cbp.proneurs.org";
  const url = new URL("/get-your-site", marketingUrl);
  url.searchParams.set("source", normalizeSiteSlug(slug));
  return url.toString();
}

export async function resolveSponsorSite(
  explicitSlug?: string | null,
): Promise<PublicSponsorSite> {
  const requestHeaders = await headers();
  const requestedSlug = explicitSlug
    ? normalizeSiteSlug(explicitSlug)
    : slugFromHost(
        requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
      );

  const siteSlug =
    requestedSlug === LEGACY_DEMO_SITE_SLUG
      ? defaultSponsorSite.slug
      : requestedSlug ?? defaultSponsorSite.slug;

  try {
    const db = await getDb();
    const [site] = await db
      .select({
        id: sites.id,
        slug: sites.slug,
        displayName: sites.displayName,
        initials: sites.initials,
        publicEmail: sites.publicEmail,
        publicPhone: sites.publicPhone,
        showEmail: sites.showEmail,
        showPhone: sites.showPhone,
        bio: sites.bio,
        referralUrl: sites.referralUrl,
        isDemo: sites.isDemo,
        status: sites.status,
      })
      .from(sites)
      .where(eq(sites.slug, siteSlug))
      .limit(1);

    if (site) return site;
  } catch {
    // The hardcoded demo keeps the preview available during database cutovers.
  }
  if (siteSlug === defaultSponsorSite.slug) return defaultSponsorSite;
  return { ...defaultSponsorSite, slug: siteSlug, status: "suspended" };
}

export async function requestHostname(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    ""
  )
    .split(":")[0]
    .toLowerCase();
}

export async function requestSurface(): Promise<"marketing" | "admin" | "tenant"> {
  const hostname = await requestHostname();
  const marketingHost = new URL(
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://cbp.proneurs.org",
  ).hostname;
  if (hostname === marketingHost) return "marketing";
  if (hostname === `admin.${marketingHost}`) return "admin";
  return "tenant";
}
