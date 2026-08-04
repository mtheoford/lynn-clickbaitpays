import LegalPage, { SupportContact } from "../legal-page";

export const metadata = { title: "Privacy Policy", robots: { index: true, follow: true } };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Data practices" title="Privacy Policy" summary="This policy explains the information ProNeurs uses to provide and protect Personal CBP Sites.">
      <h2>Information collected</h2>
      <p>We collect the name, email, phone number, requested site address, sponsor introduction, contact-visibility choices, and referral URL submitted during signup or account editing. We also store Stripe customer and subscription identifiers, subscription status, security and audit records, and privacy-limited page and outbound-click events.</p>
      <h2>Information not collected</h2>
      <p>We do not request or store ClickBaitPays passwords, cryptocurrency wallet keys, wallet balances, full payment-card numbers, or credit applications.</p>
      <h2>How information is used</h2>
      <p>Information is used to create and operate the requested site, authenticate customers, process subscriptions, prevent abuse, provide support, measure basic site activity, maintain audit records, and meet legal obligations.</p>
      <h2>Public information</h2>
      <p>Your display name, sponsor introduction, referral URL, and any contact fields you choose to show are published on your sponsor page. Visibility choices can be changed from the customer account.</p>
      <h2>Service providers</h2>
      <p>Cloudflare provides hosting, security, and data infrastructure. Stripe processes billing. The configured transactional-email provider delivers account messages. These providers process information under their own contracts and privacy terms.</p>
      <h2>Retention and security</h2>
      <p>We retain account information while the service is active. After an eligible deletion request is scheduled, the site remains unavailable during a 30-day recovery window and is then permanently removed by an automated process. Stripe may retain financial records, and ProNeurs may retain limited non-personal audit information, when needed for accounting, disputes, fraud prevention, or legal requirements. Access is restricted, secrets are kept outside source code, and sensitive links are short-lived and single-use.</p>
      <h2>Your choices</h2>
      <p>You may update public information and visibility choices, manage or cancel billing through Stripe, or request access, correction, or deletion of eligible personal information by contacting <SupportContact />. Subscription cancellation and data deletion are separate actions.</p>
      <p><strong>Review notice:</strong> This policy should receive qualified legal review and be updated with the final business entity, address, retention schedule, and jurisdictional notices before live launch.</p>
    </LegalPage>
  );
}
