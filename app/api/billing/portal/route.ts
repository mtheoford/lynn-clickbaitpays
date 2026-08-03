import { NextResponse } from "next/server";
import { getSignedInCustomer } from "@/lib/customer-auth";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signedIn = await getSignedInCustomer();
  if (!signedIn) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!signedIn.customer.stripeCustomerId) {
    return NextResponse.json({ error: "No active Stripe billing account was found." }, { status: 409 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: signedIn.customer.stripeCustomerId,
      return_url: `${new URL(request.url).origin}/manage`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Billing access is not configured yet." }, { status: 503 });
  }
}

