import { eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export async function getSignedInCustomer() {
  const identity = await getChatGPTUser();
  if (!identity) return null;

  const db = await getDb();
  const [customer] = await db
    .select()
    .from(users)
    .where(eq(users.email, identity.email.toLowerCase()))
    .limit(1);

  return customer ? { identity, customer } : null;
}

