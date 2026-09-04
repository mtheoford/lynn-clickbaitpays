import { NextResponse } from "next/server";
import {
  consumeCustomerMagicLink,
  isCustomerMagicLinkValid,
  recordCustomerMagicLinkRedeemed,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";
import {
  completeCustomerMagicLinkSignIn,
  customerAuthLocale,
  customerManagePath,
  inspectCustomerMagicLink,
} from "@/lib/magic-link-flow";
import { isSameOriginMutation } from "@/lib/request-security";

function invalidLinkRedirect(origin: string, locale: "en" | "fr" = "en") {
  const destination = new URL(customerManagePath(locale, "sign-in"), origin);
  destination.searchParams.set("error", "invalid-link");
  return NextResponse.redirect(
    destination,
    { status: 303 },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = customerAuthLocale(url.searchParams.get("locale"));
  const token = url.searchParams.get("token") ?? "";
  const isValid = await inspectCustomerMagicLink(token, isCustomerMagicLinkValid);
  if (!isValid) return invalidLinkRedirect(url.origin, locale);

  const confirmationUrl = new URL(customerManagePath(locale, "confirm"), url.origin);
  confirmationUrl.searchParams.set("token", token);
  return NextResponse.redirect(confirmationUrl, { status: 303 });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let locale = customerAuthLocale(url.searchParams.get("locale"));
  if (!isSameOriginMutation(request)) return invalidLinkRedirect(url.origin, locale);

  let token = "";
  try {
    const form = await request.formData();
    const input = form.get("token");
    token = typeof input === "string" ? input : "";
    const localeInput = form.get("locale");
    locale = customerAuthLocale(
      typeof localeInput === "string" ? localeInput : undefined,
    );
  } catch {
    return invalidLinkRedirect(url.origin, locale);
  }

  const authenticated = await completeCustomerMagicLinkSignIn(token, {
    consume: consumeCustomerMagicLink,
    setSessionCookie: setCustomerSessionCookie,
    recordAuthenticated: recordCustomerMagicLinkRedeemed,
  });
  if (!authenticated) return invalidLinkRedirect(url.origin, locale);

  return NextResponse.redirect(
    new URL(customerManagePath(locale), url.origin),
    { status: 303 },
  );
}
