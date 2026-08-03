import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, sites, users } from "@/db/schema";
import { getAdmin } from "@/lib/admin-auth";
import { validateReferralUrl } from "@/lib/site-config";
import { isSameOriginMutation } from "@/lib/request-security";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const { id } = await params;
  const input = (await request.json()) as {
    displayName?: string;
    loginEmail?: string;
    publicEmail?: string;
    publicPhone?: string;
    bio?: string;
    referralUrl?: string;
    showEmail?: boolean;
    showPhone?: boolean;
  };
  const displayName = input.displayName?.trim() ?? "";
  const loginEmail = input.loginEmail?.trim().toLowerCase() ?? "";
  const publicEmail = input.publicEmail?.trim().toLowerCase() ?? "";
  const publicPhone = input.publicPhone?.trim() ?? "";
  const bio = input.bio?.trim() ?? "";
  const referralUrl = input.referralUrl?.trim() ?? "";

  if (displayName.length < 2 || displayName.length > 80) return NextResponse.json({ error: "Enter a valid display name." }, { status: 400 });
  if (!EMAIL_PATTERN.test(loginEmail) || !EMAIL_PATTERN.test(publicEmail)) return NextResponse.json({ error: "Enter valid login and public email addresses." }, { status: 400 });
  if (publicPhone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid public phone number." }, { status: 400 });
  if (bio.length < 20 || bio.length > 400) return NextResponse.json({ error: "Keep the introduction between 20 and 400 characters." }, { status: 400 });
  const referralError = validateReferralUrl(referralUrl);
  if (referralError) return NextResponse.json({ error: referralError }, { status: 400 });

  const db = await getDb();
  const [site] = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });
  const [existingEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, loginEmail)).limit(1);
  if (existingEmail && existingEmail.id !== site.userId) return NextResponse.json({ error: "That login email already belongs to another account." }, { status: 409 });

  const now = new Date();
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CB";
  const [beforeUser] = await db.select().from(users).where(eq(users.id, site.userId)).limit(1);
  await db.update(users).set({ email: loginEmail, name: displayName, phone: publicPhone, updatedAt: now }).where(eq(users.id, site.userId));
  await db.update(sites).set({ displayName, initials, publicEmail, publicPhone, bio, referralUrl, showEmail: Boolean(input.showEmail), showPhone: Boolean(input.showPhone), updatedAt: now }).where(eq(sites.id, id));
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorEmail: admin.email,
    action: "site.profile.admin_updated",
    targetType: "site",
    targetId: id,
    beforeJson: JSON.stringify({ loginEmail: beforeUser?.email, displayName: site.displayName, publicEmail: site.publicEmail, publicPhone: site.publicPhone, bio: site.bio, referralUrl: site.referralUrl, showEmail: site.showEmail, showPhone: site.showPhone }),
    afterJson: JSON.stringify({ loginEmail, displayName, publicEmail, publicPhone, bio, referralUrl, showEmail: Boolean(input.showEmail), showPhone: Boolean(input.showPhone) }),
    createdAt: now,
  });
  return NextResponse.json({ saved: true });
}
