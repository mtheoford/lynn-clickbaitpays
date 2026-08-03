import { platformRuntimeEnv } from "@runtime-platform";

export type BillingQueueMessage = {
  stripeEventId: string;
};

export type RuntimeEnv = {
  DB?: D1Database;
  BILLING_QUEUE?: {
    send(message: BillingQueueMessage): Promise<unknown>;
  };
  APP_ENV?: string;
  ADMIN_EMAILS?: string;
  CF_ACCESS_AUD?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_MONTHLY?: string;
  STRIPE_PRICE_ANNUAL?: string;
  [key: string]: unknown;
};

export async function getRuntimeEnv(): Promise<RuntimeEnv> {
  const runtime = await platformRuntimeEnv();
  return runtime && typeof runtime === "object"
    ? (runtime as RuntimeEnv)
    : {};
}

export async function runtimeValue(name: keyof RuntimeEnv): Promise<string> {
  const runtime = await getRuntimeEnv();
  const bound = runtime[name];
  if (typeof bound === "string") return bound;
  return process.env[String(name)] ?? "";
}
