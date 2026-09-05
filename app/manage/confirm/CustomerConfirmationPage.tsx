import Link from "next/link";
import { redirect } from "next/navigation";
import { isCustomerMagicLinkValid } from "@/lib/customer-auth";
import { localizedPath, type SiteLocale } from "@/lib/i18n";

const copy = {
  en: { brand: "Personal CBP Sites", eyebrow: "Secure customer access", title: "Confirm your sign-in.", intro: "Select Continue to open your site manager. This extra step keeps email security scanners from using your single-use link before you do.", note: "Only continue if you requested this sign-in email.", continue: "Continue to my site" },
  fr: { brand: "Sites CBP personnels", eyebrow: "Accès client sécurisé", title: "Confirmez votre connexion.", intro: "Sélectionnez Continuer pour ouvrir le gestionnaire de votre site. Cette étape supplémentaire empêche les scanners de sécurité des e-mails d’utiliser votre lien à usage unique avant vous.", note: "Continuez uniquement si vous avez demandé cet e-mail de connexion.", continue: "Continuer vers mon site" },
  de: { brand: "Persönliche CBP-Websites", eyebrow: "Sicherer Kundenzugang", title: "Bestätigen Sie Ihre Anmeldung.", intro: "Wählen Sie Weiter, um Ihre Website-Verwaltung zu öffnen. Dieser zusätzliche Schritt verhindert, dass E-Mail-Sicherheitsprogramme Ihren einmaligen Link vor Ihnen verwenden.", note: "Fahren Sie nur fort, wenn Sie diese Anmelde-E-Mail angefordert haben.", continue: "Weiter zu meiner Website" },
};
export type ConfirmationSearchParams = Promise<{ token?: string | string[] }>;

export default async function CustomerConfirmationPage({ searchParams, locale = "en" }: { searchParams: ConfirmationSearchParams; locale?: SiteLocale }) {
  const params = await searchParams;
  const tokenInput = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = tokenInput ?? "";
  if (!(await isCustomerMagicLinkValid(token))) redirect(localizedPath(locale, "/manage/sign-in?error=invalid-link"));
  const t = copy[locale];
  return (
    <main className="marketing-page" lang={locale}>
      <header className="marketing-header"><Link href={localizedPath(locale, "/get-your-site")} className="marketing-brand"><span>PN</span><div><strong>ProNeurs™</strong><small>{t.brand}</small></div></Link></header>
      <section className="marketing-builder">
        <div className="builder-copy"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></div>
        <div><form className="site-signup-form" action="/auth/verify" method="post">
          <input type="hidden" name="token" value={token} /><input type="hidden" name="locale" value={locale} />
          <p className="signup-safe-note">{t.note}</p><button className="signup-submit" type="submit">{t.continue} <span aria-hidden="true">→</span></button>
        </form></div>
      </section>
    </main>
  );
}
