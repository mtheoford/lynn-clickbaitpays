import Link from "next/link";
import ProvisioningStatus from "@/app/get-your-site/success/ProvisioningStatus";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ihre persönliche CBP-Website wird aktiviert", robots: { index: false, follow: false } };

export default async function GermanCheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const sessionId = (await searchParams).session_id ?? "";
  return (
    <main className="checkout-success-page" lang="de"><div>
      <span className="checkout-success-mark">✓</span><p className="eyebrow">Zahlung eingegangen</p>
      <h1>Ihre persönliche Website wird aktiviert.</h1>
      <p>Stripe hat Sie sicher zu ProNeurs™ zurückgeleitet. Die Einrichtung Ihrer Website wird jetzt nach der Zahlungsbestätigung abgeschlossen. Sie erhalten Ihre öffentliche Website-Adresse und einen sicheren Verwaltungslink per E-Mail.</p>
      {sessionId ? <ProvisioningStatus sessionId={sessionId} locale="de" /> : <div className="checkout-success-actions"><Link className="join-button" href="/de/manage/sign-in">Meine Seite verwalten <i aria-hidden="true">→</i></Link><Link href="/de/get-your-site">Zurück zu den persönlichen CBP-Websites</Link></div>}
    </div></main>
  );
}
