import LegalPage, { SupportContact } from "../legal-page";
import { policyAlternates } from "@/lib/policy-metadata";

export const metadata = { title: "Subscription Terms", robots: { index: true, follow: true }, alternates: policyAlternates("en", "terms") };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Service agreement" title="Subscription Terms" summary="These terms govern the independent website service sold by ProNeurs™. They do not govern ClickBaitPays membership or participation.">
      <h2>1. The service</h2>
      <p>ProNeurs™ provides a hosted, personalized information and referral page, account-management tools, and centrally maintained website content. ProNeurs™ is independent from ClickBaitPays and does not control ClickBaitPays accounts, campaigns, payments, withdrawals, rules, availability, or results.</p>
      <h2>2. Eligibility and account information</h2>
      <p>You must provide accurate contact information and an official referral URL you are authorized to use. You are responsible for keeping that information current and for protecting access to your email account and management links.</p>
      <h2>3. Subscription and renewal</h2>
      <p>The service is billed monthly or annually through Stripe and renews automatically until canceled. Current prices are shown before Checkout. Taxes may apply. Stripe stores and processes payment-card information; ProNeurs™ does not store full card details.</p>
      <h2>4. Cancellation</h2>
      <p>You may cancel through the Stripe customer portal. Unless law requires otherwise, the site remains available through the paid subscription period and is unpublished afterward. Cancellation does not itself delete account data. Eligible deletion requests normally receive a 30-day recovery window before permanent removal. Failed payments may receive a seven-day recovery period before suspension.</p>
      <h2>5. No performance promise</h2>
      <p>The service does not guarantee traffic, leads, referrals, acceptance into any third-party program, financial performance, or earnings. Cryptocurrency and third-party program participation involve substantial risk.</p>
      <h2>6. Content and acceptable use</h2>
      <p>You may not use the service for misleading claims, impersonation, unlawful promotion, spam, malware, unsafe redirects, or unauthorized intellectual property. ProNeurs™ may correct, suspend, or remove content or sites that violate these terms or the Acceptable Use Policy.</p>
      <h2>7. Third-party services</h2>
      <p>The site may link to ClickBaitPays, Stripe, and other independent services. Their terms, policies, availability, and conduct are their responsibility.</p>
      <h2>8. Availability and changes</h2>
      <p>ProNeurs™ may update centrally managed content, disclosures, security controls, and service features. Reasonable maintenance and events outside ProNeurs™’ control may temporarily affect availability.</p>
      <h2>9. Contact</h2>
      <p>Questions about these terms may be sent to <SupportContact />.</p>
      <p><strong>Review notice:</strong> These operating terms should receive qualified legal review before live subscriptions are enabled.</p>
    </LegalPage>
  );
}
