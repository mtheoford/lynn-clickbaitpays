export type WelcomeEmailContent = {
  subject: string;
  text: string;
  html: string;
};

type WelcomeEmailInput = {
  name: string;
  publicUrl: string;
  manageUrl: string;
  supportEmail: string;
};

export function buildWelcomeEmail(input: WelcomeEmailInput): WelcomeEmailContent {
  const subject = "Your ProNeurs Personal CBP Site is ready";
  const text = `Hi ${input.name},

Your personal ClickBaitPays sharing site is live:
${input.publicUrl}

HOW TO EDIT YOUR SITE
1. Open your management page: ${input.manageUrl}
2. Enter the same email address you used during purchase.
3. Open the secure, single-use sign-in link we email you. It expires after 15 minutes.
4. Update your display name, public email, phone number, referral link, sponsor introduction, or contact visibility.
5. Select Save changes, then use View public page to confirm your updates.

From your management page you can also copy and share your site address, download its QR code, review basic visitor activity, and open Stripe to manage billing.

Keep this email for future reference. Whenever you return to ${input.manageUrl}, you can request a new secure sign-in link—there is no password to remember.

Need help? Email ${input.supportEmail}.

ProNeurs provides an independent website service and does not guarantee traffic, referrals, participation, or earnings.`;

  const html = `
    <div style="margin:0;background:#080b14;padding:32px 16px;color:#f5f7ff;font-family:Arial,sans-serif">
      <div style="max-width:620px;margin:0 auto;border:1px solid #242b41;border-radius:18px;background:#101522;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#121b30,#0c2530)">
          <p style="margin:0 0 10px;color:#2ee7f2;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">ProNeurs Personal CBP Sites</p>
          <h1 style="margin:0;color:#fff;font-size:28px;line-height:1.2">Your personal site is ready.</h1>
        </div>
        <div style="padding:30px 32px;color:#cbd2e7;font-size:16px;line-height:1.65">
          <p style="margin-top:0">Hi ${escapeHtml(input.name)},</p>
          <p>Your personal ClickBaitPays sharing site is now live.</p>
          <p style="margin:26px 0"><a href="${escapeHtml(input.publicUrl)}" style="display:inline-block;border-radius:9px;background:#2ee7f2;padding:13px 20px;color:#071015;font-weight:700;text-decoration:none">View your live site</a></p>
          <div style="margin:28px 0;padding:22px;border:1px solid #29324b;border-radius:12px;background:#0b101c">
            <h2 style="margin:0 0 16px;color:#fff;font-size:20px">How to edit your information</h2>
            <ol style="margin:0;padding-left:22px">
              <li style="margin-bottom:10px"><a href="${escapeHtml(input.manageUrl)}" style="color:#2ee7f2;font-weight:700">Open your management page</a>.</li>
              <li style="margin-bottom:10px">Enter the same email address you used during purchase.</li>
              <li style="margin-bottom:10px">Open the secure, single-use sign-in link we email you. It expires after 15 minutes.</li>
              <li style="margin-bottom:10px">Update your contact details, referral link, sponsor introduction, or visibility settings.</li>
              <li>Select <strong style="color:#fff">Save changes</strong>, then view your public page to confirm the update.</li>
            </ol>
          </div>
          <p>Your dashboard also lets you share your address, download a QR code, review basic visitor activity, and manage billing through Stripe.</p>
          <p><strong style="color:#fff">No password is required.</strong> Return to <a href="${escapeHtml(input.manageUrl)}" style="color:#2ee7f2">your management page</a> whenever you need a fresh sign-in link.</p>
          <p>Need help? <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#2ee7f2">Email ${escapeHtml(input.supportEmail)}</a>.</p>
          <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #29324b;color:#818ba8;font-size:12px">ProNeurs provides an independent website service and does not guarantee traffic, referrals, participation, or earnings.</p>
        </div>
      </div>
    </div>`;

  return { subject, text, html };
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
