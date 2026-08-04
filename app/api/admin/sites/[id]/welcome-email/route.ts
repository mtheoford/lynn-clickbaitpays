import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, sites } from "@/db/schema";
import { getAdmin } from "@/lib/admin-auth";
import { enqueueWelcomeEmail } from "@/lib/email";
import { isSameOriginMutation } from "@/lib/request-security";

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
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await params;
  const db = await getDb();
  const [site] = await db
    .select({ id: sites.id, status: sites.status })
    .from(sites)
    .where(eq(sites.id, id))
    .limit(1);
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });
  if (site.status === "pending" || site.status === "deleted") {
    return NextResponse.json(
      { error: "The site must be provisioned before sending its welcome email." },
      { status: 409 },
    );
  }

  const delivery = await enqueueWelcomeEmail(id);
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorEmail: admin.email,
    action: "site.welcome_email.queued",
    targetType: "site",
    targetId: id,
    afterJson: JSON.stringify({ delivery }),
    createdAt: new Date(),
  });

  return NextResponse.json({ delivery });
}
