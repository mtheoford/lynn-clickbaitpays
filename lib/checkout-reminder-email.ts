import type { SiteLocale } from "./i18n.ts";

export type CheckoutReminderEmailContent = {
  subject: string;
  text: string;
  html: string;
};

type CheckoutReminderEmailInput = {
  name: string;
  siteAddress: string;
  checkoutUrl: string;
  supportEmail: string;
  manageUrl?: string;
  locale?: SiteLocale;
};

export function buildCheckoutReminderEmail(
  input: CheckoutReminderEmailInput,
): CheckoutReminderEmailContent {
  if (input.locale === "fr") return buildFrenchCheckoutReminderEmail(input);
  if (input.locale === "de") return buildGermanCheckoutReminderEmail(input);

  const subject = "Finish setting up your ProNeurs Personal CBP Site";
  const completedCheckoutText = input.manageUrl
    ? `If you already completed checkout, you can sign in to manage your site: ${input.manageUrl}`
    : "If you already completed checkout, you can ignore this email.";
  const completedCheckoutHtml = input.manageUrl
    ? `<p>If you already completed checkout, you can <a href="${escapeHtml(input.manageUrl)}" style="color:#2ee7f2">sign in to manage your site</a>.</p>`
    : "<p>If you already completed checkout, you can ignore this email.</p>";
  const text = `Hi ${input.name},

Your site address, ${input.siteAddress}, is reserved, but your checkout is not complete.

Finish secure checkout with Stripe:
${input.checkoutUrl}

Once Stripe confirms your payment, your site will activate automatically. Your selected site address is reserved for 24 hours from when you started.

${completedCheckoutText} Need help? Email ${input.supportEmail}.

ProNeurs provides an independent website service and does not guarantee traffic, referrals, participation, or earnings.`;

  const html = `
    <div style="margin:0;background:#080b14;padding:32px 16px;color:#f5f7ff;font-family:Arial,sans-serif">
      <div style="max-width:620px;margin:0 auto;border:1px solid #242b41;border-radius:18px;background:#101522;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#121b30,#0c2530)">
          <p style="margin:0 0 10px;color:#2ee7f2;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">ProNeurs Personal CBP Sites</p>
          <h1 style="margin:0;color:#fff;font-size:28px;line-height:1.2">Your site is almost ready.</h1>
        </div>
        <div style="padding:30px 32px;color:#cbd2e7;font-size:16px;line-height:1.65">
          <p style="margin-top:0">Hi ${escapeHtml(input.name)},</p>
          <p>Your site address, <strong style="color:#fff">${escapeHtml(input.siteAddress)}</strong>, is reserved, but your checkout is not complete.</p>
          <p style="margin:26px 0"><a href="${escapeHtml(input.checkoutUrl)}" style="display:inline-block;border-radius:9px;background:#2ee7f2;padding:13px 20px;color:#071015;font-weight:700;text-decoration:none">Finish secure checkout</a></p>
          <p>Once Stripe confirms your payment, your site will activate automatically. Your selected site address is reserved for 24 hours from when you started.</p>
          ${completedCheckoutHtml}
          <p>Need help? <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#2ee7f2">Email ${escapeHtml(input.supportEmail)}</a>.</p>
          <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #29324b;color:#818ba8;font-size:12px">ProNeurs provides an independent website service and does not guarantee traffic, referrals, participation, or earnings.</p>
        </div>
      </div>
    </div>`;

  return { subject, text, html };
}

function buildFrenchCheckoutReminderEmail(
  input: CheckoutReminderEmailInput,
): CheckoutReminderEmailContent {
  const subject = "Terminez la configuration de votre site CBP personnel ProNeurs";
  const completedCheckoutText = input.manageUrl
    ? `Si vous avez déjà terminé le paiement, connectez-vous pour gérer votre site : ${input.manageUrl}`
    : "Si vous avez déjà terminé le paiement, vous pouvez ignorer cet e-mail.";
  const completedCheckoutHtml = input.manageUrl
    ? `<p>Si vous avez déjà terminé le paiement, vous pouvez <a href="${escapeHtml(input.manageUrl)}" style="color:#2ee7f2">vous connecter pour gérer votre site</a>.</p>`
    : "<p>Si vous avez déjà terminé le paiement, vous pouvez ignorer cet e-mail.</p>";
  const text = `Bonjour ${input.name},

L’adresse de votre site, ${input.siteAddress}, est réservée, mais votre paiement n’est pas terminé.

Terminez le paiement sécurisé avec Stripe :
${input.checkoutUrl}

Une fois votre paiement confirmé par Stripe, votre site sera activé automatiquement. L’adresse choisie reste réservée pendant 24 heures à compter du début de votre inscription.

${completedCheckoutText} Besoin d’aide ? Écrivez-nous à ${input.supportEmail}.

ProNeurs fournit un service de site web indépendant et ne garantit ni trafic, ni parrainages, ni participation, ni revenus.`;

  const html = `
    <div lang="fr" style="margin:0;background:#080b14;padding:32px 16px;color:#f5f7ff;font-family:Arial,sans-serif">
      <div style="max-width:620px;margin:0 auto;border:1px solid #242b41;border-radius:18px;background:#101522;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#121b30,#0c2530)">
          <p style="margin:0 0 10px;color:#2ee7f2;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Sites CBP personnels ProNeurs</p>
          <h1 style="margin:0;color:#fff;font-size:28px;line-height:1.2">Votre site est presque prêt.</h1>
        </div>
        <div style="padding:30px 32px;color:#cbd2e7;font-size:16px;line-height:1.65">
          <p style="margin-top:0">Bonjour ${escapeHtml(input.name)},</p>
          <p>L’adresse de votre site, <strong style="color:#fff">${escapeHtml(input.siteAddress)}</strong>, est réservée, mais votre paiement n’est pas terminé.</p>
          <p style="margin:26px 0"><a href="${escapeHtml(input.checkoutUrl)}" style="display:inline-block;border-radius:9px;background:#2ee7f2;padding:13px 20px;color:#071015;font-weight:700;text-decoration:none">Terminer le paiement sécurisé</a></p>
          <p>Une fois votre paiement confirmé par Stripe, votre site sera activé automatiquement. L’adresse choisie reste réservée pendant 24 heures à compter du début de votre inscription.</p>
          ${completedCheckoutHtml}
          <p>Besoin d’aide ? <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#2ee7f2">Écrivez-nous à ${escapeHtml(input.supportEmail)}</a>.</p>
          <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #29324b;color:#818ba8;font-size:12px">ProNeurs fournit un service de site web indépendant et ne garantit ni trafic, ni parrainages, ni participation, ni revenus.</p>
        </div>
      </div>
    </div>`;

  return { subject, text, html };
}

function buildGermanCheckoutReminderEmail(
  input: CheckoutReminderEmailInput,
): CheckoutReminderEmailContent {
  const subject = "Schließen Sie die Einrichtung Ihrer persönlichen CBP-Website von ProNeurs ab";
  const completedCheckoutText = input.manageUrl
    ? `Wenn Sie die Zahlung bereits abgeschlossen haben, können Sie sich anmelden und Ihre Website verwalten: ${input.manageUrl}`
    : "Wenn Sie die Zahlung bereits abgeschlossen haben, können Sie diese E-Mail ignorieren.";
  const completedCheckoutHtml = input.manageUrl
    ? `<p>Wenn Sie die Zahlung bereits abgeschlossen haben, können Sie sich <a href="${escapeHtml(input.manageUrl)}" style="color:#2ee7f2">anmelden und Ihre Website verwalten</a>.</p>`
    : "<p>Wenn Sie die Zahlung bereits abgeschlossen haben, können Sie diese E-Mail ignorieren.</p>";
  const text = `Guten Tag ${input.name},

Ihre Website-Adresse ${input.siteAddress} ist reserviert, aber Ihre Zahlung ist noch nicht abgeschlossen.

Schließen Sie die sichere Zahlung über Stripe ab:
${input.checkoutUrl}

Sobald Stripe Ihre Zahlung bestätigt, wird Ihre Website automatisch aktiviert. Die gewählte Website-Adresse ist ab Beginn Ihrer Anmeldung 24 Stunden lang reserviert.

${completedCheckoutText} Benötigen Sie Hilfe? Schreiben Sie an ${input.supportEmail}.

ProNeurs bietet einen unabhängigen Website-Service an und garantiert weder Besucherzahlen noch Empfehlungen, Teilnahmen oder Einnahmen.`;

  const html = `
    <div lang="de" style="margin:0;background:#080b14;padding:32px 16px;color:#f5f7ff;font-family:Arial,sans-serif">
      <div style="max-width:620px;margin:0 auto;border:1px solid #242b41;border-radius:18px;background:#101522;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#121b30,#0c2530)">
          <p style="margin:0 0 10px;color:#2ee7f2;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Persönliche CBP-Websites von ProNeurs</p>
          <h1 style="margin:0;color:#fff;font-size:28px;line-height:1.2">Ihre Website ist fast bereit.</h1>
        </div>
        <div style="padding:30px 32px;color:#cbd2e7;font-size:16px;line-height:1.65">
          <p style="margin-top:0">Guten Tag ${escapeHtml(input.name)},</p>
          <p>Ihre Website-Adresse <strong style="color:#fff">${escapeHtml(input.siteAddress)}</strong> ist reserviert, aber Ihre Zahlung ist noch nicht abgeschlossen.</p>
          <p style="margin:26px 0"><a href="${escapeHtml(input.checkoutUrl)}" style="display:inline-block;border-radius:9px;background:#2ee7f2;padding:13px 20px;color:#071015;font-weight:700;text-decoration:none">Sichere Zahlung abschließen</a></p>
          <p>Sobald Stripe Ihre Zahlung bestätigt, wird Ihre Website automatisch aktiviert. Die gewählte Website-Adresse ist ab Beginn Ihrer Anmeldung 24 Stunden lang reserviert.</p>
          ${completedCheckoutHtml}
          <p>Benötigen Sie Hilfe? <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#2ee7f2">Schreiben Sie an ${escapeHtml(input.supportEmail)}</a>.</p>
          <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #29324b;color:#818ba8;font-size:12px">ProNeurs bietet einen unabhängigen Website-Service an und garantiert weder Besucherzahlen noch Empfehlungen, Teilnahmen oder Einnahmen.</p>
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
