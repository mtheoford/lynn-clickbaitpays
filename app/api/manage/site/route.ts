import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, sites, users } from "@/db/schema";
import { getSignedInCustomer } from "@/lib/customer-auth";
import { validateReferralUrl } from "@/lib/site-config";
import { isSameOriginMutation } from "@/lib/request-security";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const signedIn = await getSignedInCustomer();
  if (!signedIn) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const input = (await request.json()) as {
    displayName?: string;
    publicEmail?: string;
    publicPhone?: string;
    bio?: string;
    referralUrl?: string;
    showEmail?: boolean;
    showPhone?: boolean;
  };
  const displayName = input.displayName?.trim() ?? "";
  const publicEmail = input.publicEmail?.trim().toLowerCase() ?? "";
  const publicPhone = input.publicPhone?.trim() ?? "";
  const bio = input.bio?.trim() ?? "";
  const referralUrl = input.referralUrl?.trim() ?? "";

  if (displayName.length < 2 || displayName.length > 80) return NextResponse.json({ error: "Enter a valid display name." }, { status: 400 });
  if (!EMAIL_PATTERN.test(publicEmail)) return NextResponse.json({ error: "Enter a valid public email address." }, { status: 400 });
  if (publicPhone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid public phone number." }, { status: 400 });
  if (bio.length < 20 || bio.length > 400) return NextResponse.json({ error: "Keep your introduction between 20 and 400 characters." }, { status: 400 });
  const referralError = validateReferralUrl(referralUrl);
  if (referralError) return NextResponse.json({ error: referralError }, { status: 400 });

  const db = await getDb();
  const [site] = await db.select().from(sites).where(eq(sites.userId, signedIn.customer.id)).limit(1);
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });
  const now = new Date();
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CB";

  await db.update(users).set({ name: displayName, phone: publicPhone, updatedAt: now }).where(eq(users.id, signedIn.customer.id));
  await db.update(sites).set({
    displayName,
    initials,
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
    beforeJson: JSON.stringify({ displayName: site.displayName, publicEmail: site.publicEmail, publicPhone: site.publicPhone, bio: site.bio, referralUrl: site.referralUrl, showEmail: site.showEmail, showPhone: site.showPhone }),
    afterJson: JSON.stringify({ displayName, publicEmail, publicPhone, bio, referralUrl, showEmail: Boolean(input.showEmail), showPhone: Boolean(input.showPhone) }),
    createdAt: now,
  });

  return NextResponse.json({ saved: true });
}
