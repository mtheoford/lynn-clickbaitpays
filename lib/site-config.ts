import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { sites } from "@/db/schema";

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
  publicPhone: "80171705630",
  showEmail: true,
  showPhone: true,
  bio: "Questions before joining? Lynn is here to help you find the facts and take the next step with confidence.",
  referralUrl: "https://clickbaitpays.me/?ref=thinleo",
  status: "active",
};

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "billing",
  "cbp",
  "manage",
  "signin-with-chatgpt",
  "signout-with-chatgpt",
  "support",
  "www",
]);

export function normalizeSiteSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);
}

export function validateSiteSlug(value: string): string | null {
  const slug = normalizeSiteSlug(value);
  if (slug.length < 3) return "Choose a site name with at least three characters.";
  if (RESERVED_SLUGS.has(slug)) return "That site name is reserved. Please choose another.";
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return "Use letters, numbers, and single hyphens only.";
  }
  return null;
}

export function validateReferralUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Enter your complete ClickBaitPays referral link.";
  }

  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "clickbaitpays.me") {
    return "Use an official https://clickbaitpays.me referral link.";
  }

  if (!url.searchParams.get("ref")) {
    return "Your ClickBaitPays link must include its referral code.";
  }

  return null;
}

export function siteUrl(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ?? "proneurs.org";
  return `https://cbp-${normalizeSiteSlug(slug)}.${domain}`;
}

export function growthSignupUrl(slug: string): string {
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://cbp.proneurs.org";
  const url = new URL("/get-your-site", marketingUrl);
  url.searchParams.set("source", normalizeSiteSlug(slug));
  return url.toString();
}

export function slugFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const firstLabel = hostname.split(".")[0];
  if (!firstLabel.startsWith("cbp-") || firstLabel.length <= 4) return null;
  return normalizeSiteSlug(firstLabel.slice(4));
}

export async function resolveSponsorSite(): Promise<PublicSponsorSite> {
  const requestHeaders = await headers();
  const requestedSlug = slugFromHost(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  if (!requestedSlug || requestedSlug === defaultSponsorSite.slug) {
    return defaultSponsorSite;
  }

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
      .where(eq(sites.slug, requestedSlug))
      .limit(1);

    return site ?? { ...defaultSponsorSite, slug: requestedSlug, status: "suspended" };
  } catch {
    return { ...defaultSponsorSite, slug: requestedSlug, status: "suspended" };
  }
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
