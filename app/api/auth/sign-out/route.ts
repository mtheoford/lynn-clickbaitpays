import { NextResponse } from "next/server";
import { revokeCustomerSession } from "@/lib/customer-auth";
import { customerAuthLocale, customerManagePath } from "@/lib/magic-link-flow";
import { isSameOriginMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  await revokeCustomerSession();
  const url = new URL(request.url);
  const locale = customerAuthLocale(url.searchParams.get("locale"));
  return NextResponse.redirect(
    new URL(customerManagePath(locale, "sign-in"), url.origin),
    { status: 303 },
  );
}
