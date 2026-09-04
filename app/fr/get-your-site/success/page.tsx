import Link from "next/link";
import ProvisioningStatus from "@/app/get-your-site/success/ProvisioningStatus";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activation de votre site CBP personnalisé",
  robots: { index: false, follow: false },
};

export default async function FrenchCheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sessionId = (await searchParams).session_id ?? "";
  return (
    <main className="checkout-success-page" lang="fr">
      <div>
        <span className="checkout-success-mark">✓</span>
        <p className="eyebrow">Paiement reçu</p>
        <h1>Votre site personnalisé est en cours d’activation.</h1>
        <p>
          Stripe vous a ramené en toute sécurité vers ProNeurs™. La confirmation de paiement
          signée termine maintenant la configuration de votre site. Vous recevrez par courriel
          l’adresse publique et le lien sécurisé pour gérer votre site.
        </p>
        {sessionId ? (
          <ProvisioningStatus sessionId={sessionId} locale="fr" />
        ) : (
          <div className="checkout-success-actions">
            <Link className="join-button" href="/fr/manage/sign-in">
              Gérer ma page <i aria-hidden="true">→</i>
            </Link>
            <Link href="/fr/get-your-site">Retourner aux sites CBP personnalisés</Link>
          </div>
        )}
      </div>
    </main>
  );
}
