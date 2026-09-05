import Link from "next/link";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { localizedPath, type SiteLocale } from "@/lib/i18n";
import { customerSignInErrorMessage } from "@/lib/magic-link-flow";
import { runtimeValue } from "@/lib/runtime";
import SignInForm from "./SignInForm";

const copy = {
  en: {
    brand: "Personal CBP Sites", eyebrow: "Customer access", title: "Manage your personal site.",
    emailIntro: "Enter the email used during purchase. We’ll send a secure, single-use sign-in link—no password required.",
    pilotIntro: "Pilot customers can sign in securely with the ChatGPT account that uses the same email address as their purchase.",
    chatGPT: "Sign in with ChatGPT", unavailable: "Email sign-in is temporarily unavailable. Contact ProNeurs™ support for account access.", emailNote: "Use the same email address used during purchase.",
  },
  fr: {
    brand: "Sites CBP personnels", eyebrow: "Espace client", title: "Gérez votre site personnel.",
    emailIntro: "Saisissez l’adresse e-mail utilisée lors de l’achat. Nous vous enverrons un lien de connexion sécurisé et à usage unique — aucun mot de passe n’est requis.",
    pilotIntro: "Pendant la phase pilote, connectez-vous avec le compte ChatGPT qui utilise la même adresse e-mail que votre achat.",
    chatGPT: "Se connecter avec ChatGPT", unavailable: "La connexion par e-mail est momentanément indisponible. Contactez l’assistance ProNeurs™ pour accéder à votre compte.", emailNote: "Utilisez la même adresse e-mail que lors de l’achat.",
  },
  de: {
    brand: "Persönliche CBP-Websites", eyebrow: "Kundenzugang", title: "Verwalten Sie Ihre persönliche Website.",
    emailIntro: "Geben Sie die beim Kauf verwendete E-Mail-Adresse ein. Wir senden Ihnen einen sicheren Anmeldelink zur einmaligen Nutzung – ganz ohne Passwort.",
    pilotIntro: "Pilotkunden können sich mit dem ChatGPT-Konto anmelden, das dieselbe E-Mail-Adresse wie ihr Kauf verwendet.",
    chatGPT: "Mit ChatGPT anmelden", unavailable: "Die Anmeldung per E-Mail ist vorübergehend nicht verfügbar. Wenden Sie sich an den ProNeurs™-Support, um Zugang zu Ihrem Konto zu erhalten.", emailNote: "Verwenden Sie dieselbe E-Mail-Adresse wie beim Kauf.",
  },
};

export type SignInSearchParams = Promise<{ error?: string | string[] }>;

export default async function CustomerSignInPage({ searchParams, locale = "en" }: { searchParams: SignInSearchParams; locale?: SiteLocale }) {
  const params = await searchParams;
  const t = copy[locale];
  const errorMessage = customerSignInErrorMessage(params.error, locale);
  let showChatGPTPilotSignIn = false;
  let emailSignInConfigured = false;
  try {
    const [appEnv, resendApiKey, emailFrom] = await Promise.all([runtimeValue("APP_ENV"), runtimeValue("RESEND_API_KEY"), runtimeValue("EMAIL_FROM")]);
    showChatGPTPilotSignIn = appEnv !== "production" && appEnv !== "staging";
    emailSignInConfigured = Boolean(resendApiKey && emailFrom);
  } catch {
    showChatGPTPilotSignIn = true;
  }
  return (
    <main className="marketing-page customer-sign-in-page" lang={locale}>
      <header className="marketing-header"><Link href={localizedPath(locale, "/get-your-site")} className="marketing-brand"><span>PN</span><div><strong>ProNeurs™</strong><small>{t.brand}</small></div></Link></header>
      <section className="marketing-builder">
        <div className="builder-copy"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{emailSignInConfigured ? t.emailIntro : t.pilotIntro}</p></div>
        <div>
          {errorMessage ? <p className="signup-error" role="alert">{errorMessage}</p> : null}
          {emailSignInConfigured ? <SignInForm locale={locale} /> : null}
          {showChatGPTPilotSignIn ? <Link className="signup-submit" href={chatGPTSignInPath(localizedPath(locale, "/manage"))}>{t.chatGPT} <span aria-hidden="true">→</span></Link> : !emailSignInConfigured ? <p className="signup-error" role="status">{t.unavailable}</p> : null}
          {showChatGPTPilotSignIn ? <p className="signup-safe-note">{t.emailNote}</p> : null}
        </div>
      </section>
    </main>
  );
}
