import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, sites, subscriptions } from "@/db/schema";
import { getAdmin } from "@/lib/admin-auth";
import { siteStatusForSubscription } from "@/lib/billing-lifecycle";
import { isSameOriginMutation } from "@/lib/request-security";

const ALLOWED_STATUSES = new Set(["active", "suspended", "canceled"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await params;
  const input = (await request.json()) as { status?: string };
  if (!input.status || !ALLOWED_STATUSES.has(input.status)) {
    return NextResponse.json({ error: "Unsupported site status." }, { status: 400 });
  }

  const db = await getDb();
  const [site] = await db
    .select({
      id: sites.id,
      status: sites.status,
      publicationOverride: sites.publicationOverride,
      publishedAt: sites.publishedAt,
      deletionScheduledAt: sites.deletionScheduledAt,
    })
    .from(sites)
    .where(eq(sites.id, id))
    .limit(1);
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });

  const now = new Date();
  if (input.status === "active" && site.deletionScheduledAt) {
    return NextResponse.json(
      { error: "Cancel the scheduled data deletion before activating this site." },
      { status: 409 },
    );
  }
  let nextStatus: "active" | "pending" | "past_due" | "suspended" | "canceled";
  let publicationOverride: "suspended" | "canceled" | null;
  if (input.status === "active") {
    publicationOverride = null;
    const [subscription] = await db
      .select({
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.siteId, id))
      .limit(1);
    nextStatus = subscription
      ? siteStatusForSubscription(
          subscription.status as Parameters<typeof siteStatusForSubscription>[0],
          subscription.currentPeriodEnd,
          now,
        )
      : "active";
  } else {
    nextStatus = input.status as "suspended" | "canceled";
    publicationOverride = nextStatus;
  }
  await db
    .update(sites)
    .set({
      status: nextStatus,
      publicationOverride,
      publishedAt: nextStatus === "active" ? site.publishedAt ?? now : site.publishedAt,
      updatedAt: now,
    })
    .where(eq(sites.id, id));
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorEmail: admin.email,
    action: "site.status.changed",
    targetType: "site",
    targetId: id,
    beforeJson: JSON.stringify({
      status: site.status,
      publicationOverride: site.publicationOverride,
    }),
    afterJson: JSON.stringify({ status: nextStatus, publicationOverride }),
    createdAt: now,
  });

  return NextResponse.json({ status: nextStatus });
}
