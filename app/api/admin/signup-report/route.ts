import { getAdmin } from "@/lib/admin-auth";
import { isSameOriginMutation } from "@/lib/request-security";
import { SIGNUP_ANALYTICS_RANGE_OPTIONS, type SignupAnalyticsRange } from "@/lib/signup-page-analytics";
import { loadSignupAnalyticsReport } from "@/lib/signup-analytics-query";

export async function POST(request: Request) {
  const headers = { "cache-control": "no-store" };
  if (!isSameOriginMutation(request)) return Response.json({ error: "Request origin could not be verified." }, { status: 403, headers });
  if (!await getAdmin()) return Response.json({ error: "Not authorized." }, { status: 403, headers });
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Choose a supported report period." }, { status: 400, headers });
  }
  const range = input && typeof input === "object" && "range" in input ? input.range : undefined;
  if (!SIGNUP_ANALYTICS_RANGE_OPTIONS.some((option) => option.value === range)) {
    return Response.json({ error: "Choose a supported report period." }, { status: 400, headers });
  }
  try {
    const now = new Date();
    const report = await loadSignupAnalyticsReport(range as SignupAnalyticsRange, now);
    return Response.json({ report, generatedAt: now.toISOString() }, { headers });
  } catch {
    return Response.json({ error: "The report could not be generated. Try again." }, { status: 503, headers });
  }
}
