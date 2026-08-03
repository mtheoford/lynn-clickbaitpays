import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { sites } from "@/db/schema";
import {
  normalizeSiteSlug,
  slugFromHost,
} from "@/lib/site-routing";

export {
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
  status: "pending" | "active" | "past_due" | "suspended" | "canceled" | "deleted";
};

export const defaultSponsorSite: PublicSponsorSite = {
  id: "site_lynn_theobald",
  slug: "lynn-theobald",
  displayName: "Lynn Theobald",
  initials: "LT",
  publicEmail: "lynntheo@gmail.com",
  publicPhone: "8017170563",
  showEmail: true,
  showPhone: true,
  bio: "Questions before joining? Lynn is here to help you find the facts and take the next step with confidence.",
  referralUrl: "https://clickbaitpays.me/?ref=thinleo",
  status: "active",
};

export function growthSignupUrl(slug: string): string {
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://cbp.proneurs.org";
  const url = new URL("/get-your-site", marketingUrl);
  url.searchParams.set("source", normalizeSiteSlug(slug));
  return url.toString();
}

export async function resolveSponsorSite(): Promise<PublicSponsorSite> {
  const requestHeaders = await headers();
  const requestedSlug = slugFromHost(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  const siteSlug = requestedSlug ?? defaultSponsorSite.slug;

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
        status: sites.status,
      })
      .from(sites)
      .where(eq(sites.slug, siteSlug))
      .limit(1);

    if (site) return site;
  } catch {
    // The hardcoded Lynn profile keeps the existing preview available during cutover.
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

export function formatPhoneForDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value;
}

export function phoneHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  return `tel:${digits}`;
}
