import { and, eq, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { sites, subscriptions, users } from "@/db/schema";

export async function purgeExpiredCheckoutReservations(now = new Date()): Promise<number> {
  const db = await getDb();
  const expired = await db
    .select({ siteId: sites.id, userId: sites.userId })
    .from(sites)
    .leftJoin(subscriptions, eq(subscriptions.siteId, sites.id))
    .innerJoin(users, eq(users.id, sites.userId))
    .where(
      and(
        eq(sites.status, "pending"),
        or(isNull(sites.reservationExpiresAt), lte(sites.reservationExpiresAt, now)),
        isNull(subscriptions.id),
        isNull(users.stripeCustomerId),
      ),
    );

  let purged = 0;
  for (const item of expired) {
    const deleted = await db
      .delete(sites)
      .where(
        and(
          eq(sites.id, item.siteId),
          eq(sites.status, "pending"),
          or(isNull(sites.reservationExpiresAt), lte(sites.reservationExpiresAt, now)),
        ),
      )
      .returning({ id: sites.id });
    if (deleted.length === 0) continue;

    purged += 1;
    const [remainingSite] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.userId, item.userId))
      .limit(1);
    if (!remainingSite) {
      await db
        .delete(users)
        .where(and(eq(users.id, item.userId), isNull(users.stripeCustomerId)));
    }
  }

  return purged;
}
