import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, sites, subscriptions } from "@/db/schema";
import { getAdmin } from "@/lib/admin-auth";
import {
  accountDeletionDate,
  subscriptionAllowsDataDeletion,
} from "@/lib/billing-lifecycle";
import { isSameOriginMutation } from "@/lib/request-security";

type DeletionAction = "schedule" | "cancel";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Request origin could not be verified." },
      { status: 403 },
    );
  }
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = await params;
  const input = (await request.json()) as { action?: DeletionAction };
  if (input.action !== "schedule" && input.action !== "cancel") {
    return NextResponse.json({ error: "Unsupported deletion action." }, { status: 400 });
  }

  const db = await getDb();
  const [account] = await db
    .select({
      status: sites.status,
      publicationOverride: sites.publicationOverride,
      deletionScheduledAt: sites.deletionScheduledAt,
      plan: subscriptions.plan,
      subscriptionStatus: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(sites)
    .leftJoin(subscriptions, eq(subscriptions.siteId, sites.id))
    .where(eq(sites.id, id))
    .limit(1);
  if (!account) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const now = new Date();
  if (input.action === "schedule") {
    if (
      !subscriptionAllowsDataDeletion(
        account.subscriptionStatus,
        account.plan,
        account.currentPeriodEnd,
        now,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Cancel this subscription in Stripe and wait for the paid period to end before scheduling data deletion.",
        },
        { status: 409 },
      );
    }

    const deletionScheduledAt = accountDeletionDate(now);
    await db
      .update(sites)
      .set({
        status: "canceled",
        publicationOverride: "canceled",
        deletionScheduledAt,
        updatedAt: now,
      })
      .where(eq(sites.id, id));
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorEmail: admin.email,
      action: "site.data_deletion.scheduled",
      targetType: "site",
      targetId: id,
      beforeJson: JSON.stringify({
        status: account.status,
        publicationOverride: account.publicationOverride,
        deletionScheduledAt: account.deletionScheduledAt,
      }),
      afterJson: JSON.stringify({
        status: "canceled",
        publicationOverride: "canceled",
        deletionScheduledAt,
      }),
      createdAt: now,
    });
    return NextResponse.json({ deletionScheduledAt: deletionScheduledAt.toISOString() });
  }

  if (!account.deletionScheduledAt) {
    return NextResponse.json({ error: "No data deletion is scheduled." }, { status: 409 });
  }

  await db
    .update(sites)
    .set({ deletionScheduledAt: null, updatedAt: now })
    .where(eq(sites.id, id));
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorEmail: admin.email,
    action: "site.data_deletion.canceled",
    targetType: "site",
    targetId: id,
    beforeJson: JSON.stringify({ deletionScheduledAt: account.deletionScheduledAt }),
    afterJson: JSON.stringify({ deletionScheduledAt: null }),
    createdAt: now,
  });
  return NextResponse.json({ deletionScheduledAt: null });
}
