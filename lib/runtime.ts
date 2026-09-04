import { AsyncLocalStorage } from "node:async_hooks";
import { platformRuntimeEnv } from "@runtime-platform";
import type { SiteLocale } from "@/lib/i18n";

export type BillingQueueMessage =
  | { type?: "stripe_event"; stripeEventId: string }
  | {
      type: "welcome_email";
      siteId: string;
      deliveryId: string;
      locale?: SiteLocale;
    }
  | {
      type: "checkout_reminder";
      siteId: string;
      deliveryId: string;
      locale?: SiteLocale;
    };

export type RuntimeEnv = {
  DB?: D1Database;
  BILLING_QUEUE?: {
    send(
      message: BillingQueueMessage,
      options?: { delaySeconds?: number },
    ): Promise<unknown>;
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

const runtimeEnvStorage = new AsyncLocalStorage<RuntimeEnv>();

export function runWithRuntimeEnv<T>(
  env: RuntimeEnv,
  callback: () => T,
): T {
  return runtimeEnvStorage.run(env, callback);
}

export async function getRuntimeEnv(): Promise<RuntimeEnv> {
  const scopedEnv = runtimeEnvStorage.getStore();
  if (scopedEnv) return scopedEnv;

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
