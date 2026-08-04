import { NextResponse } from "next/server";
import { requestCustomerMagicLink } from "@/lib/customer-auth";
import { isSameOriginMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ accepted: true }, { status: 403 });
  let email = "";
  try {
    const input = (await request.json()) as { email?: string };
    email = input.email ?? "";
  } catch {
    // Use the same response for malformed and unknown requests.
  }

  try {
    await requestCustomerMagicLink(email, new URL(request.url).origin);
  } catch (error) {
    // Never disclose account existence or email-provider state.
    console.error(
      JSON.stringify({
        message: "customer magic-link request failed",
        error: error instanceof Error ? error.message : "Unknown magic-link failure",
      }),
    );
  }
  return NextResponse.json({ accepted: true });
}
