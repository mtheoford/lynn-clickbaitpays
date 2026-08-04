import { and, count, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { customerSessions, magicLinkTokens, users } from "@/db/schema";
import { sendTransactionalEmail } from "@/lib/email";
import { runtimeValue } from "@/lib/runtime";
import { hashToken } from "@/lib/token";

export { hashToken } from "@/lib/token";

const SESSION_COOKIE = "proneurs_session";
const SECURE_SESSION_COOKIE = "__Host-proneurs_session";
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_MAGIC_LINKS_PER_HOUR = 5;

export type CustomerIdentity = {
  displayName: string;
  email: string;
  fullName: string | null;
};

function cookieName(): string {
  return process.env.NODE_ENV === "production" ? SECURE_SESSION_COOKIE : SESSION_COOKIE;
}

export function customerSignOutPath(): string {
  return "/api/auth/sign-out";
}

export async function getSignedInCustomer() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(cookieName())?.value;
  if (sessionToken) {
    const db = await getDb();
    const [record] = await db
      .select({ customer: users })
      .from(customerSessions)
      .innerJoin(users, eq(users.id, customerSessions.userId))
      .where(
        and(
          eq(customerSessions.tokenHash, await hashToken(sessionToken)),
          gt(customerSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (record) {
      const identity: CustomerIdentity = {
        displayName: record.customer.name,
        email: record.customer.email,
        fullName: record.customer.name,
      };
      return { identity, customer: record.customer };
    }
  }

  // Preserve the current Sites pilot login while production moves to magic links.
  const appEnv = await runtimeValue("APP_ENV");
  if (appEnv === "production" || appEnv === "staging") return null;
  const chatGPTIdentity = await getChatGPTUser();
  if (!chatGPTIdentity) return null;
  const db = await getDb();
  const [customer] = await db
    .select()
    .from(users)
    .where(eq(users.email, chatGPTIdentity.email.toLowerCase()))
    .limit(1);
  return customer ? { identity: chatGPTIdentity, customer } : null;
}

export async function requestCustomerMagicLink(
  emailInput: string,
  origin: string,
): Promise<{ accepted: true; developmentUrl?: string }> {
  const email = emailInput.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { accepted: true };

  const db = await getDb();
  const [customer] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!customer) return { accepted: true };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [recent] = await db
    .select({ total: count() })
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.userId, customer.id),
        gt(magicLinkTokens.createdAt, oneHourAgo),
      ),
    );
  if ((recent?.total ?? 0) >= MAX_MAGIC_LINKS_PER_HOUR) return { accepted: true };

  const token = randomToken();
  const now = new Date();
  await db.insert(magicLinkTokens).values({
    id: crypto.randomUUID(),
    userId: customer.id,
    tokenHash: await hashToken(token),
    expiresAt: new Date(now.getTime() + MAGIC_LINK_TTL_MS),
    createdAt: now,
  });

  const verifyUrl = new URL("/auth/verify", origin);
  verifyUrl.searchParams.set("token", token);
  await sendTransactionalEmail({
    to: customer.email,
    subject: "Sign in to manage your ProNeurs site",
    idempotencyKey: `magic-link-${customer.id}-${Math.floor(now.getTime() / 60_000)}`,
    text: `Hi ${customer.name},\n\nUse this secure link to manage your ProNeurs Personal CBP Site:\n${verifyUrl}\n\nThis link expires in 15 minutes and can be used only once.`,
    html: `<p>Hi ${escapeHtml(customer.name)},</p><p><a href="${escapeHtml(verifyUrl.toString())}">Sign in to manage your site</a></p><p>This link expires in 15 minutes and can be used only once.</p>`,
  });

  return process.env.NODE_ENV === "production"
    ? { accepted: true }
    : { accepted: true, developmentUrl: verifyUrl.toString() };
}

export async function consumeCustomerMagicLink(token: string): Promise<{
  sessionToken: string;
  expiresAt: Date;
} | null> {
  if (token.length < 32 || token.length > 256) return null;
  const db = await getDb();
  const now = new Date();
  const [claimed] = await db
    .update(magicLinkTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(magicLinkTokens.tokenHash, await hashToken(token)),
        isNull(magicLinkTokens.usedAt),
        gt(magicLinkTokens.expiresAt, now),
      ),
    )
    .returning({ userId: magicLinkTokens.userId });
  if (!claimed) return null;

  const sessionToken = randomToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(customerSessions).values({
    id: crypto.randomUUID(),
    userId: claimed.userId,
    tokenHash: await hashToken(sessionToken),
    expiresAt,
    createdAt: now,
  });
  return { sessionToken, expiresAt };
}

export async function setCustomerSessionCookie(
  sessionToken: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(cookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function revokeCustomerSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName())?.value;
  if (token) {
    const db = await getDb();
    await db
      .delete(customerSessions)
      .where(eq(customerSessions.tokenHash, await hashToken(token)));
  }
  cookieStore.delete(cookieName());
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });
}
