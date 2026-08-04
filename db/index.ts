import { drizzle } from "drizzle-orm/d1";
import { getRuntimeEnv } from "@/lib/runtime";
import * as schema from "./schema";

export async function getDb() {
  const env = await getRuntimeEnv();
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Configure the binding in the active deployment environment before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
