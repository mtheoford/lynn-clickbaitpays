import { runtimeValue } from "@/lib/runtime";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export async function sendTransactionalEmail(input: EmailInput): Promise<void> {
  const [apiKey, from, appEnv] = await Promise.all([
    runtimeValue("RESEND_API_KEY"),
    runtimeValue("EMAIL_FROM"),
    runtimeValue("APP_ENV"),
  ]);

  if (!apiKey || !from) {
    if (!appEnv || appEnv === "local" || appEnv === "development") {
      console.info(`[email:${input.idempotencyKey}] ${input.subject} -> ${input.to}`);
      return;
    }
    throw new Error("Transactional email is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Transactional email failed (${response.status}): ${detail}`);
  }
}

export async function sendWelcomeEmail(input: {
  email: string;
  name: string;
  publicUrl: string;
  manageUrl: string;
  siteId: string;
}) {
  await sendTransactionalEmail({
    to: input.email,
    subject: "Your ProNeurs Personal CBP Site is ready",
    idempotencyKey: `welcome-${input.siteId}`,
    text: `Hi ${input.name},\n\nYour personal sharing site is ready: ${input.publicUrl}\n\nManage your page: ${input.manageUrl}\n\nProNeurs provides an independent website service and does not guarantee traffic, referrals, participation, or earnings.`,
    html: `<p>Hi ${escapeHtml(input.name)},</p><p>Your personal sharing site is ready:</p><p><a href="${escapeHtml(input.publicUrl)}">${escapeHtml(input.publicUrl)}</a></p><p><a href="${escapeHtml(input.manageUrl)}">Manage your page</a></p><p><small>ProNeurs provides an independent website service and does not guarantee traffic, referrals, participation, or earnings.</small></p>`,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });
}
