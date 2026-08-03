import { NextResponse } from "next/server";
import { revokeCustomerSession } from "@/lib/customer-auth";
import { isSameOriginMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  await revokeCustomerSession();
  return NextResponse.redirect(new URL("/manage/sign-in", request.url), { status: 303 });
}
