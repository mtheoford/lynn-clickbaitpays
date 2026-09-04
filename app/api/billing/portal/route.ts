import { NextResponse } from "next/server";
import { getSignedInCustomer } from "@/lib/customer-auth";
import { customerAuthLocale, customerManagePath } from "@/lib/magic-link-flow";
import { getStripe } from "@/lib/stripe";
import { isSameOriginMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const signedIn = await getSignedInCustomer();
  if (!signedIn) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!signedIn.customer.stripeCustomerId) {
    return NextResponse.json({ error: "No active Stripe billing account was found." }, { status: 409 });
  }

  let locale = customerAuthLocale(undefined);
  try {
    const input = (await request.json()) as { locale?: unknown };
    locale = customerAuthLocale(
      typeof input.locale === "string" ? input.locale : undefined,
    );
  } catch {
    // Older clients sent no body and continue to return to the English manager.
  }

  try {
    const stripe = await getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: signedIn.customer.stripeCustomerId,
      return_url: new URL(
        customerManagePath(locale),
        new URL(request.url).origin,
      ).toString(),
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Billing access is not configured yet." }, { status: 503 });
  }
}
