import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCustomerMagicLinkValid } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmer votre connexion ProNeurs",
  robots: { index: false, follow: false },
};

export default async function FrenchCustomerSignInConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const tokenInput = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = tokenInput ?? "";
  if (!(await isCustomerMagicLinkValid(token))) {
    redirect("/fr/manage/sign-in?error=invalid-link");
  }

  return (
    <main className="marketing-page" lang="fr">
      <header className="marketing-header">
        <Link href="/fr/get-your-site" className="marketing-brand">
          <span>PN</span>
          <div><strong>ProNeurs™</strong><small>Sites CBP personnels</small></div>
        </Link>
      </header>
      <section className="marketing-builder">
        <div className="builder-copy">
          <p className="eyebrow">Accès client sécurisé</p>
          <h1>Confirmez votre connexion.</h1>
          <p>
            Sélectionnez Continuer pour ouvrir le gestionnaire de votre site. Cette
            étape supplémentaire empêche les scanners de sécurité des e-mails
            d’utiliser votre lien à usage unique avant vous.
          </p>
        </div>
        <div>
          <form className="site-signup-form" action="/auth/verify" method="post">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="locale" value="fr" />
            <p className="signup-safe-note">
              Continuez uniquement si vous avez demandé cet e-mail de connexion.
            </p>
            <button className="signup-submit" type="submit">
              Continuer vers mon site <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
