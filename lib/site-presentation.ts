export type SitePresentationLocale = "en" | "fr" | "de";

const demoSponsorBios: Record<SitePresentationLocale, string> = {
  en: "Your introduction will appear here, giving visitors a clear and welcoming way to learn about ClickBaitPays with you.",
  fr: "Votre présentation apparaîtra ici afin d’offrir aux visiteurs un accueil clair et convivial pour découvrir ClickBaitPays avec vous.",
  de: "Hier erscheint Ihre Vorstellung, damit Besucher ClickBaitPays gemeinsam mit Ihnen kennenlernen können.",
};

const generatedSponsorBioPatterns = [
  /^Questions before joining\? .+ is here to help you understand the information and take your next step with confidence\.$/,
  /^Questions before joining\? .+ is here to help you find the facts and take the next step with confidence\.$/,
  /^Des questions avant de vous inscrire(?:\u00a0|\u202f| )?\? .+ est à votre disposition pour vous aider à comprendre les informations et à avancer en toute confiance\.$/,
  /^Fragen vor der Anmeldung\? .+ hilft Ihnen dabei, die Informationen zu verstehen und gut informiert den nächsten Schritt zu gehen\.$/,
];

export function generatedSponsorBio(
  locale: SitePresentationLocale,
  displayName: string,
): string {
  if (locale === "de") {
    return `Fragen vor der Anmeldung? ${displayName} hilft Ihnen dabei, die Informationen zu verstehen und gut informiert den nächsten Schritt zu gehen.`;
  }
  if (locale === "fr") {
    return `Des questions avant de vous inscrire ? ${displayName} est à votre disposition pour vous aider à comprendre les informations et à avancer en toute confiance.`;
  }
  return `Questions before joining? ${displayName} is here to help you understand the information and take your next step with confidence.`;
}

/**
 * Sites currently store one bio, rather than one bio per locale. Known system
 * defaults are localized when read; sponsor-authored text is always returned
 * verbatim so switching languages never rewrites or machine-translates it.
 */
export function localizeSponsorBio(
  bio: string,
  displayName: string,
  locale: SitePresentationLocale,
): string {
  if (Object.values(demoSponsorBios).includes(bio)) {
    return demoSponsorBios[locale];
  }
  if (generatedSponsorBioPatterns.some((pattern) => pattern.test(bio))) {
    return generatedSponsorBio(locale, displayName);
  }
  return bio;
}

export function formatPhoneForDisplay(
  value: string,
  locale: SitePresentationLocale = "en",
): string {
  const digits = value.replace(/\D/g, "");

  // German numbers have variable-length area codes. Keep the sponsor's chosen
  // spacing instead of applying the fixed North American grouping.
  if (locale === "de") return value;

  if (locale === "fr") {
    if (digits.length === 10 && digits.startsWith("0")) {
      return digits.match(/.{2}/g)?.join(" ") ?? value;
    }

    let internationalDigits: string | null = null;
    if (digits.length === 11 && digits.startsWith("33")) {
      internationalDigits = digits.slice(2);
    } else if (digits.length === 13 && digits.startsWith("0033")) {
      internationalDigits = digits.slice(4);
    } else if (digits.length === 12 && digits.startsWith("330")) {
      // Accept the commonly written international form +33 (0)6….
      internationalDigits = digits.slice(3);
    }

    if (internationalDigits?.length === 9) {
      const subscriber = [
        internationalDigits.slice(0, 1),
        internationalDigits.slice(1, 3),
        internationalDigits.slice(3, 5),
        internationalDigits.slice(5, 7),
        internationalDigits.slice(7, 9),
      ].join(" ");
      return `+33 ${subscriber}`;
    }

    return value;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value;
}

export function phoneHref(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  const frenchInternationalWithTrunkPrefix = /^\+33[\s.-]*\(0\)/.test(trimmed);
  if (frenchInternationalWithTrunkPrefix && digits.startsWith("330")) {
    return `tel:+33${digits.slice(3)}`;
  }
  if (trimmed.startsWith("+") && digits) return `tel:+${digits}`;
  if (trimmed.startsWith("00") && digits.length > 2) {
    return `tel:+${digits.slice(2)}`;
  }
  return `tel:${digits}`;
}
