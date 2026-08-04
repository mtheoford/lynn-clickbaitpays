import { NextResponse } from "next/server";
import {
  consumeCustomerMagicLink,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const session = await consumeCustomerMagicLink(token);
  if (!session) {
    return NextResponse.redirect(new URL("/manage/sign-in?error=invalid-link", url.origin));
  }
  await setCustomerSessionCookie(session.sessionToken, session.expiresAt);
  return NextResponse.redirect(new URL("/manage", url.origin));
}
