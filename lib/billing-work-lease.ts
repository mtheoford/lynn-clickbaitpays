import { and, eq, lte, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { billingWorkLeases, stripeEvents } from "@/db/schema";

export const BILLING_LEASE_MS = 5 * 60 * 1000;
export const MAX_BILLING_EVENT_ATTEMPTS = 12;
export type EventClaim = { id: string; token: string };
export type BillingLease = { resourceKey: string; token: string; event?: EventClaim };

export function eventClaimCondition(claim: EventClaim): SQL {
  return sql`EXISTS (SELECT 1 FROM ${stripeEvents}
    WHERE ${stripeEvents.id} = ${claim.id}
      AND ${stripeEvents.processingToken} = ${claim.token}
      AND ${stripeEvents.status} = 'processing'
      AND ${stripeEvents.leaseExpiresAt} > ${Date.now()})`;
}

export class BillingResourceBusyError extends Error {
  constructor() { super("Billing work for this resource is already in progress."); }
}
export class BillingLeaseLostError extends Error {
  constructor() { super("Billing work lease expired or was replaced."); }
}

/** Evaluate inside each mutation, so an expired worker cannot overwrite its successor. */
export function billingLeaseCondition(lease: BillingLease): SQL {
  const now = Date.now();
  const resource = sql`EXISTS (SELECT 1 FROM ${billingWorkLeases}
    WHERE ${billingWorkLeases.resourceKey} = ${lease.resourceKey}
      AND ${billingWorkLeases.token} = ${lease.token}
      AND ${billingWorkLeases.expiresAt} > ${now})`;
  if (!lease.event) return resource;
  return sql`${resource} AND ${eventClaimCondition(lease.event)}`;
}

export async function assertBillingLease(lease: BillingLease): Promise<void> {
  const db = await getDb();
  const [valid] = await db.select({ key: billingWorkLeases.resourceKey })
    .from(billingWorkLeases).where(and(eq(billingWorkLeases.resourceKey, lease.resourceKey), billingLeaseCondition(lease))).limit(1);
  if (!valid) throw new BillingLeaseLostError();
}

export async function withBillingResourceLease<T>(
  resourceKey: string,
  event: EventClaim | undefined,
  work: (lease: BillingLease) => Promise<T>,
): Promise<T> {
  const db = await getDb();
  const now = new Date();
  const lease: BillingLease = { resourceKey, token: crypto.randomUUID(), event };
  const [claimed] = await db.insert(billingWorkLeases)
    .values({ resourceKey, token: lease.token, expiresAt: new Date(now.getTime() + BILLING_LEASE_MS) })
    .onConflictDoUpdate({ target: billingWorkLeases.resourceKey,
      set: { token: lease.token, expiresAt: new Date(now.getTime() + BILLING_LEASE_MS) },
      setWhere: lte(billingWorkLeases.expiresAt, now) })
    .returning({ token: billingWorkLeases.token });
  if (!claimed) throw new BillingResourceBusyError();
  try {
    await assertBillingLease(lease);
    return await work(lease);
  } finally {
    await db.delete(billingWorkLeases).where(and(eq(billingWorkLeases.resourceKey, resourceKey), eq(billingWorkLeases.token, lease.token)));
  }
}

export function billingRetryDelayMs(attempts: number): number {
  return Math.min(6 * 60 * 60 * 1000, 60_000 * 2 ** Math.min(Math.max(attempts - 1, 0), 9));
}
