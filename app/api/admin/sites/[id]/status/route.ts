import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, sites } from "@/db/schema";
import { getAdmin } from "@/lib/admin-auth";
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
  const [site] = await db.select({ id: sites.id, status: sites.status }).from(sites).where(eq(sites.id, id)).limit(1);
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });

  const nextStatus = input.status as "active" | "suspended" | "canceled";
  const now = new Date();
  await db
    .update(sites)
    .set({ status: nextStatus, publishedAt: nextStatus === "active" ? now : undefined, updatedAt: now })
    .where(eq(sites.id, id));
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorEmail: admin.email,
    action: "site.status.changed",
    targetType: "site",
    targetId: id,
    beforeJson: JSON.stringify({ status: site.status }),
    afterJson: JSON.stringify({ status: nextStatus }),
    createdAt: now,
  });

  return NextResponse.json({ status: nextStatus });
}
