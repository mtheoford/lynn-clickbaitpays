import { NextResponse } from "next/server";
import {
  consumeCustomerMagicLink,
  isCustomerMagicLinkValid,
  recordCustomerMagicLinkRedeemed,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";
import {
  completeCustomerMagicLinkSignIn,
  inspectCustomerMagicLink,
} from "@/lib/magic-link-flow";
import { isSameOriginMutation } from "@/lib/request-security";

function invalidLinkRedirect(origin: string) {
  return NextResponse.redirect(
    new URL("/manage/sign-in?error=invalid-link", origin),
    { status: 303 },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const isValid = await inspectCustomerMagicLink(token, isCustomerMagicLinkValid);
  if (!isValid) return invalidLinkRedirect(url.origin);

  const confirmationUrl = new URL("/manage/confirm", url.origin);
  confirmationUrl.searchParams.set("token", token);
  return NextResponse.redirect(confirmationUrl, { status: 303 });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!isSameOriginMutation(request)) return invalidLinkRedirect(url.origin);

  let token = "";
  try {
    const form = await request.formData();
    const input = form.get("token");
    token = typeof input === "string" ? input : "";
  } catch {
    return invalidLinkRedirect(url.origin);
  }

  const authenticated = await completeCustomerMagicLinkSignIn(token, {
    consume: consumeCustomerMagicLink,
    setSessionCookie: setCustomerSessionCookie,
    recordAuthenticated: recordCustomerMagicLinkRedeemed,
  });
  if (!authenticated) return invalidLinkRedirect(url.origin);

  return NextResponse.redirect(new URL("/manage", url.origin), { status: 303 });
}
