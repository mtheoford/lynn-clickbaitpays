import Stripe from "stripe";
import { runtimeValue } from "@/lib/runtime";

export type BillingPlan = "monthly" | "annual";

export async function stripeConfig() {
  return {
    secretKey: await runtimeValue("STRIPE_SECRET_KEY"),
    webhookSecret: await runtimeValue("STRIPE_WEBHOOK_SECRET"),
    monthlyPrice: await runtimeValue("STRIPE_PRICE_MONTHLY"),
    annualPrice: await runtimeValue("STRIPE_PRICE_ANNUAL"),
  };
}

export async function getStripe(): Promise<Stripe> {
  const { secretKey } = await stripeConfig();
  if (!secretKey) throw new Error("Stripe billing is not configured.");
  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function priceForPlan(plan: BillingPlan): Promise<string> {
  const config = await stripeConfig();
  const price = plan === "annual" ? config.annualPrice : config.monthlyPrice;
  if (!price) throw new Error(`Stripe ${plan} pricing is not configured.`);
  return price;
}

export async function isBillingConfigured(): Promise<boolean> {
  const config = await stripeConfig();
  return Boolean(config.secretKey && config.monthlyPrice && config.annualPrice);
}
