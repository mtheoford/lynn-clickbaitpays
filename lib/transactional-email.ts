import { runtimeValue } from "@/lib/runtime";

export type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  /** A durable delivery freezes its sender along with the rest of the payload. */
  from?: string;
};

export type TransactionalEmailResult = { providerMessageId: string | null };

export class TransactionalEmailError extends Error {
  constructor(public readonly code: string, public readonly requiresReview = false) {
    super(code);
    this.name = "TransactionalEmailError";
  }
}

/** A successful response means provider acceptance, never inbox delivery. */
export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<TransactionalEmailResult> {
  const [apiKey, configuredFrom, appEnv] = await Promise.all([
    runtimeValue("RESEND_API_KEY"), runtimeValue("EMAIL_FROM"), runtimeValue("APP_ENV"),
  ]);
  const from = input.from ?? configuredFrom;
  if (!apiKey || !from) {
    if (!appEnv || appEnv === "local" || appEnv === "development") {
      console.info(`[email:${input.idempotencyKey}] ${input.subject} -> ${input.to}`);
      return { providerMessageId: null };
    }
    throw new TransactionalEmailError("email_not_configured");
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`, "content-type": "application/json",
        "idempotency-key": input.idempotencyKey,
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // A timeout may happen after acceptance. Retrying requires the same key/body.
    throw new TransactionalEmailError("email_request_unconfirmed");
  }
  if (!response.ok) {
    let providerCode: unknown;
    try { providerCode = (await response.json() as { name?: unknown }).name; } catch { /* No raw provider text is logged. */ }
    throw new TransactionalEmailError(
      providerCode === "invalid_idempotent_request" ? "email_idempotency_conflict" : `email_provider_http_${response.status}`,
      providerCode === "invalid_idempotent_request",
    );
  }
  let body: { id?: unknown } = {};
  try { body = await response.json() as { id?: unknown }; } catch { /* Acceptance is still confirmed by the 2xx response. */ }
  return { providerMessageId: typeof body.id === "string" && body.id.length <= 200 ? body.id : null };
}

export async function retrieveEmailDeliveryEvent(providerMessageId: string): Promise<string | null> {
  const apiKey = await runtimeValue("RESEND_API_KEY");
  if (!apiKey) throw new TransactionalEmailError("email_not_configured");
  let response: Response;
  try {
    response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(providerMessageId)}`, {
      headers: { authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10_000),
    });
  } catch { throw new TransactionalEmailError("email_status_unavailable"); }
  if (!response.ok) throw new TransactionalEmailError(`email_status_http_${response.status}`);
  const body = await response.json() as { id?: unknown; last_event?: unknown };
  if (body.id !== providerMessageId) throw new TransactionalEmailError("email_status_id_mismatch");
  return typeof body.last_event === "string" ? body.last_event : null;
}
