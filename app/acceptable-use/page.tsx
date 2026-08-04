import LegalPage, { SupportContact } from "../legal-page";

export const metadata = { title: "Acceptable Use Policy", robots: { index: true, follow: true } };

export default function AcceptableUsePage() {
  return (
    <LegalPage eyebrow="Content standards" title="Acceptable Use Policy" summary="Personal CBP Sites must be truthful, lawful, secure, and consistent with centrally managed disclosures.">
      <h2>Allowed use</h2>
      <p>The service may be used to share approved educational information, your authorized referral URL, accurate contact information, and a factual sponsor introduction.</p>
      <h2>Prohibited use</h2>
      <ul>
        <li>Guaranteed, typical, passive, daily, retirement, or income-replacement claims without approved substantiation.</li>
        <li>False testimonials, fabricated results, impersonation, or misrepresentation of affiliation.</li>
        <li>Spam, purchased-list messaging, automated abuse, deceptive redirects, phishing, malware, or unsafe links.</li>
        <li>Collection of passwords, wallet keys, balances, identity documents, or payment-card data.</li>
        <li>Illegal activity, sanctions evasion, infringement, harassment, or discriminatory content.</li>
        <li>Removing or obscuring centrally managed risk, affiliate, privacy, or independent-site disclosures.</li>
      </ul>
      <h2>Enforcement</h2>
      <p>ProNeurs™ may correct content, disable links, suspend a site, or terminate service when reasonably necessary to protect visitors, providers, or the business. Urgent concerns may be reported to <SupportContact />.</p>
    </LegalPage>
  );
}
