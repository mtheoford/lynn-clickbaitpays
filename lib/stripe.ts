import Stripe from "stripe";

export type BillingPlan = "monthly" | "annual";

export function stripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    monthlyPrice: process.env.STRIPE_PRICE_MONTHLY ?? "",
    annualPrice: process.env.STRIPE_PRICE_ANNUAL ?? "",
  };
}

export function getStripe(): Stripe {
  const { secretKey } = stripeConfig();
  if (!secretKey) throw new Error("Stripe billing is not configured.");
  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function priceForPlan(plan: BillingPlan): string {
  const config = stripeConfig();
  const price = plan === "annual" ? config.annualPrice : config.monthlyPrice;
  if (!price) throw new Error(`Stripe ${plan} pricing is not configured.`);
  return price;
}

export function isBillingConfigured(): boolean {
  const config = stripeConfig();
  return Boolean(config.secretKey && config.monthlyPrice && config.annualPrice);
}

