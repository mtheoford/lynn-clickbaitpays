import { isSiteLocale, localizedPath, type SiteLocale } from "./i18n.ts";

export function billingLocale(value: unknown): SiteLocale {
  return typeof value === "string" && isSiteLocale(value) ? value : "en";
}

export function checkoutLocalization(input: {
  origin: string;
  locale: SiteLocale;
  slug: string;
  siteId: string;
  userId: string;
  plan: "monthly" | "annual";
  sourceSlug: string;
}) {
  const checkoutBasePath = localizedPath(input.locale, "/get-your-site");
  const cancelParams = new URLSearchParams({ checkout: "canceled", site: input.slug });
  if (input.sourceSlug) cancelParams.set("source", input.sourceSlug);
  const metadata = {
    siteId: input.siteId,
    userId: input.userId,
    plan: input.plan,
    sourceSlug: input.sourceSlug,
    locale: input.locale,
  };
  return {
    locale: input.locale === "en" ? "auto" as const : input.locale,
    success_url: `${input.origin}${checkoutBasePath}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}${checkoutBasePath}?${cancelParams}`,
    metadata,
    subscription_data: { metadata: { ...metadata } },
  };
}

export function localizedPublicUrl(publicUrl: string, locale: SiteLocale): string {
  if (locale === "en") return publicUrl;
  const url = new URL(publicUrl);
  url.pathname = localizedPath(locale, url.pathname);
  return url.toString();
}

export function checkoutToResume(
  session: {
    status: string | null;
    url: string | null;
    metadata: Record<string, string> | null;
  },
  expected: {
    locale: SiteLocale;
    siteId: string;
    userId: string;
    plan: "monthly" | "annual";
    sourceSlug: string;
  },
): { url: string; locale: SiteLocale } | null {
  if (session.status !== "open" || !session.url || !session.metadata) return null;
  const locale = billingLocale(session.metadata.locale);
  if (
    session.metadata.siteId !== expected.siteId ||
    session.metadata.userId !== expected.userId ||
    session.metadata.plan !== expected.plan ||
    session.metadata.sourceSlug !== expected.sourceSlug
  ) return null;

  // Resume the matching payment instead of creating another payable session
  // or reusing its idempotency key with changed language/return parameters.
  // This also preserves pending payments created by earlier releases.
  return { url: session.url, locale };
}
