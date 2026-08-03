import Stripe from "stripe";
import { NextResponse } from "next/server";
import { registerStripeEvent } from "@/lib/stripe-events";
import { getStripe, stripeConfig } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const { webhookSecret } = await stripeConfig();
  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook verification is not configured." },
      { status: 400 },
    );
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    const stripe = await getStripe();
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    const result = await registerStripeEvent(event);
    return NextResponse.json({ received: true, ...result }, { status: result.queued ? 202 : 200 });
  } catch {
    // Stripe will retry non-2xx responses. Do not expose internal details.
    return NextResponse.json({ error: "Webhook registration failed." }, { status: 500 });
  }
}
