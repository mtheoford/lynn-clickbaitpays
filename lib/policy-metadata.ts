import type { Metadata } from "next";
import type { SiteLocale } from "./i18n";

export type PolicyPagePath = "terms" | "privacy" | "refund-policy" | "acceptable-use" | "affiliate-disclosure" | "faq";

/** Only advertise equivalent pages hosted by this application. */
export function policyAlternates(locale: SiteLocale, path: PolicyPagePath): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {
    "fr-FR": `/fr/${path}`,
    "de-DE": `/de/${path}`,
  };
  // The official English FAQ is an external source, not a reciprocal site page.
  if (path !== "faq") languages["en-US"] = `/${path}`;
  return {
    canonical: locale === "en" ? `/${path}` : `/${locale}/${path}`,
    languages,
  };
}
