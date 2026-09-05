import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, sites, users } from "@/db/schema";
import { getSignedInCustomer } from "@/lib/customer-auth";
import { validateReferralUrl } from "@/lib/site-config";
import { resolveSiteIdentity } from "@/lib/site-identity";
import { isSameOriginMutation } from "@/lib/request-security";
import { billingLocale } from "@/lib/checkout-localization";
import { localizedCustomerError } from "@/lib/customer-messages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const signedIn = await getSignedInCustomer();
  if (!signedIn) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const input = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    displayNameType?: string;
    publicEmail?: string;
    publicPhone?: string;
    bio?: string;
    referralUrl?: string;
    showEmail?: boolean;
    showPhone?: boolean;
    locale?: string;
  };
  const locale = billingLocale(input.locale);
  function error(message: string, status = 400) {
    return NextResponse.json({ error: localizedCustomerError(message, locale) }, { status });
  }
  const identityResult = resolveSiteIdentity(input);
  if (!identityResult.identity) return error(identityResult.error);
  const identity = identityResult.identity;
  const publicEmail = input.publicEmail?.trim().toLowerCase() ?? "";
  const publicPhone = input.publicPhone?.trim() ?? "";
  const bio = input.bio?.trim() ?? "";
  const referralUrl = input.referralUrl?.trim() ?? "";

  if (!EMAIL_PATTERN.test(publicEmail)) return error("Enter a valid public email address.");
  if (publicPhone.replace(/\D/g, "").length < 10) return error("Enter a valid public phone number.");
  if (bio.length < 20 || bio.length > 400) return error("Keep your introduction between 20 and 400 characters.");
  const referralError = validateReferralUrl(referralUrl);
  if (referralError) return error(referralError);

  const db = await getDb();
  const [site] = await db.select().from(sites).where(eq(sites.userId, signedIn.customer.id)).limit(1);
  if (!site) return error("Site not found.", 404);
  const now = new Date();

  await db.update(users).set({
    name: identity.fullName,
    firstName: identity.firstName,
    lastName: identity.lastName,
    phone: publicPhone,
    updatedAt: now,
  }).where(eq(users.id, signedIn.customer.id));
  await db.update(sites).set({
    displayName: identity.displayName,
    companyName: identity.companyName,
    displayNameType: identity.displayNameType,
    initials: identity.initials,
    publicEmail,
    publicPhone,
    bio,
    referralUrl,
    showEmail: Boolean(input.showEmail),
    showPhone: Boolean(input.showPhone),
    updatedAt: now,
  }).where(eq(sites.id, site.id));
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorEmail: signedIn.identity.email,
    action: "site.profile.updated",
    targetType: "site",
    targetId: site.id,
    beforeJson: JSON.stringify({ displayName: site.displayName, companyName: site.companyName, displayNameType: site.displayNameType, publicEmail: site.publicEmail, publicPhone: site.publicPhone, bio: site.bio, referralUrl: site.referralUrl, showEmail: site.showEmail, showPhone: site.showPhone }),
    afterJson: JSON.stringify({ displayName: identity.displayName, companyName: identity.companyName, displayNameType: identity.displayNameType, publicEmail, publicPhone, bio, referralUrl, showEmail: Boolean(input.showEmail), showPhone: Boolean(input.showPhone) }),
    createdAt: now,
  });

  return NextResponse.json({ saved: true });
}
