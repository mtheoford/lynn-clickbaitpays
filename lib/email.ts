import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { sites, users } from "@/db/schema";
import { getRuntimeEnv, runtimeValue } from "@/lib/runtime";
import { siteUrl } from "@/lib/site-config";
import { buildWelcomeEmail } from "@/lib/welcome-email";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export async function sendTransactionalEmail(input: EmailInput): Promise<void> {
  const [apiKey, from, appEnv] = await Promise.all([
    runtimeValue("RESEND_API_KEY"),
    runtimeValue("EMAIL_FROM"),
    runtimeValue("APP_ENV"),
  ]);

  if (!apiKey || !from) {
    if (!appEnv || appEnv === "local" || appEnv === "development") {
      console.info(`[email:${input.idempotencyKey}] ${input.subject} -> ${input.to}`);
      return;
    }
    throw new Error("Transactional email is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Transactional email failed (${response.status}): ${detail}`);
  }
}

export async function sendWelcomeEmail(input: {
  email: string;
  name: string;
  publicUrl: string;
  manageUrl: string;
  siteId: string;
  deliveryId?: string;
}) {
  const supportEmail =
    (await runtimeValue("NEXT_PUBLIC_SUPPORT_EMAIL")) || "support@proneurs.org";
  const content = buildWelcomeEmail({
    name: input.name,
    publicUrl: input.publicUrl,
    manageUrl: input.manageUrl,
    supportEmail,
  });
  await sendTransactionalEmail({
    to: input.email,
    subject: content.subject,
    idempotencyKey: input.deliveryId ?? `welcome-${input.siteId}`,
    text: content.text,
    html: content.html,
  });
}

export async function deliverWelcomeEmailForSite(
  siteId: string,
  deliveryId = `welcome-${siteId}`,
): Promise<void> {
  const db = await getDb();
  const [account] = await db
    .select({ email: users.email, name: users.name, slug: sites.slug })
    .from(users)
    .innerJoin(sites, eq(sites.userId, users.id))
    .where(and(eq(sites.id, siteId), ne(sites.status, "deleted")))
    .limit(1);
  if (!account) throw new Error("Welcome email account was not found.");

  const marketingUrl =
    (await runtimeValue("NEXT_PUBLIC_MARKETING_URL")) || "https://cbp.proneurs.org";
  await sendWelcomeEmail({
    email: account.email,
    name: account.name,
    publicUrl: siteUrl(account.slug),
    manageUrl: new URL("/manage", marketingUrl).toString(),
    siteId,
    deliveryId,
  });
}

export async function enqueueWelcomeEmail(
  siteId: string,
  deliveryId = `welcome-${siteId}-${crypto.randomUUID()}`,
): Promise<"queued" | "sent"> {
  const env = await getRuntimeEnv();
  if (env.BILLING_QUEUE) {
    await env.BILLING_QUEUE.send({ type: "welcome_email", siteId, deliveryId });
    return "queued";
  }
  await deliverWelcomeEmailForSite(siteId, deliveryId);
  return "sent";
}
