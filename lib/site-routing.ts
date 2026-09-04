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

export const DEMO_SITE_SLUG = "your-name";
export const LEGACY_DEMO_SITE_SLUG = "lynn-theobald";

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

export function isLegacyDemoSiteSlug(value: string): boolean {
  return normalizeSiteSlug(value) === LEGACY_DEMO_SITE_SLUG;
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
  const normalizedSlug = normalizeSiteSlug(slug);
  const primaryDomain = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN;
  if (primaryDomain) return `https://${primaryDomain}/s/${normalizedSlug}`;

  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN;
  if (tenantDomain) return `https://${normalizedSlug}.${tenantDomain}`;

  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL;
  if (marketingUrl) return new URL(`/s/${normalizedSlug}`, marketingUrl).toString();

  return `https://${normalizedSlug}.cbp.proneurs.org`;
}

export function slugFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const baseDomain = (
    process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ?? "cbp.proneurs.org"
  ).toLowerCase();
  if (hostname.endsWith(`.${baseDomain}`)) {
    const tenantLabel = hostname.slice(0, -(baseDomain.length + 1));
    if (tenantLabel && !tenantLabel.includes(".")) return normalizeSiteSlug(tenantLabel);
  }
  const firstLabel = hostname.split(".")[0];
  if (!firstLabel.startsWith("cbp-") || firstLabel.length <= 4) return null;
  return normalizeSiteSlug(firstLabel.slice(4));
}
