"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { DEFAULT_SITE_LOCALE, type SiteLocale } from "@/lib/i18n";

type Testimonial = {
  name: string;
  quote: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
};

const englishTestimonials: Testimonial[] = [
  {
    name: "Brady White",
    quote:
      "I received my 2nd withdrawal today and it was as smooth as silk.",
    image: "/testimonials/brady-white.png",
    imageWidth: 1246,
    imageHeight: 280,
    imageAlt:
      "Original community message from Brady White describing a smooth second withdrawal.",
  },
  {
    name: "Pamela Baden",
    quote:
      "Today was my first day of clicking and it was easy, delightful, and I look forward to my next clicking adventure tomorrow!",
    image: "/testimonials/pamela-baden.png",
    imageWidth: 1248,
    imageHeight: 378,
    imageAlt:
      "Original community message from Pamela Baden describing her first day using ClickBaitPays.",
  },
  {
    name: "Roger Mitchell",
    quote:
      "Just made 3rd successful withdrawal at 11pm Panama time; it took just 25 minutes to hit my Exodus wallet.",
    image: "/testimonials/roger-mitchell.png",
    imageWidth: 1128,
    imageHeight: 302,
    imageAlt:
      "Original community message from Roger Mitchell reporting his third withdrawal.",
  },
  {
    name: "Community member",
    quote:
      "I requested a withdrawal from ClickBaitPays, and 33 minutes later the funds were in my personal wallet. Fast. Smooth. Paid.",
    image: "/testimonials/withdrawal-proof-member.png",
    imageWidth: 1138,
    imageHeight: 696,
    imageAlt:
      "Original anonymous community message reporting that a withdrawal reached a personal wallet in 33 minutes.",
  },
  {
    name: "Dan Dupey",
    quote:
      "I just received my email that my new withdrawal went through smoothly.",
    image: "/testimonials/dan-dupey.png",
    imageWidth: 1132,
    imageHeight: 416,
    imageAlt:
      "Original community message from Dan Dupey thanking the team after receiving a withdrawal email.",
  },
  {
    name: "New Zealand member",
    quote:
      "Put in the withdrawal request at 10pm last night NZ time and it was in my Exodus when I woke up this morning at 7am.",
    image: "/testimonials/new-zealand-member.png",
    imageWidth: 1156,
    imageHeight: 364,
    imageAlt:
      "Original community message from a New Zealand member describing an overnight withdrawal.",
  },
  {
    name: "Michael C. Parker",
    quote:
      "I received my first withdrawal today—received it in a few hours; can’t believe it.",
    image: "/testimonials/michael-c-parker.png",
    imageWidth: 1034,
    imageHeight: 308,
    imageAlt:
      "Original community message from Michael C. Parker describing his first withdrawal.",
  },
  {
    name: "Richard",
    quote:
      "Withdrawn and paid within 5 hours. Withdrawal amount: USDT 875.00. Net paid: USDT 787.50.",
    image: "/testimonials/richard.png",
    imageWidth: 1162,
    imageHeight: 338,
    imageAlt:
      "Original community message from Richard listing a withdrawal amount, fee, and net payment.",
  },
];

const frenchTestimonials: Testimonial[] = [
  {
    name: "Brady White",
    quote:
      "J’ai reçu aujourd’hui mon deuxième retrait, et tout s’est déroulé sans le moindre problème.",
    image: "/testimonials/brady-white.png",
    imageWidth: 1246,
    imageHeight: 280,
    imageAlt:
      "Capture en anglais du message original de Brady White au sujet de son deuxième retrait, effectué sans difficulté.",
  },
  {
    name: "Pamela Baden",
    quote:
      "Aujourd’hui, c’était mon premier jour à cliquer. C’était facile et agréable, et j’ai hâte de recommencer demain !",
    image: "/testimonials/pamela-baden.png",
    imageWidth: 1248,
    imageHeight: 378,
    imageAlt:
      "Capture en anglais du message original de Pamela Baden au sujet de sa première journée sur ClickBaitPays.",
  },
  {
    name: "Roger Mitchell",
    quote:
      "Je viens d’effectuer mon troisième retrait avec succès à 23 h, heure du Panama ; il n’a fallu que 25 minutes pour qu’il arrive dans mon portefeuille Exodus.",
    image: "/testimonials/roger-mitchell.png",
    imageWidth: 1128,
    imageHeight: 302,
    imageAlt:
      "Capture en anglais du message original de Roger Mitchell signalant son troisième retrait.",
  },
  {
    name: "Membre de la communauté",
    quote:
      "J’ai demandé un retrait à ClickBaitPays et, 33 minutes plus tard, les fonds étaient dans mon portefeuille personnel. Rapide. Simple. Payé.",
    image: "/testimonials/withdrawal-proof-member.png",
    imageWidth: 1138,
    imageHeight: 696,
    imageAlt:
      "Capture en anglais du message original d’un membre anonyme indiquant qu’un retrait est arrivé dans son portefeuille personnel en 33 minutes.",
  },
  {
    name: "Dan Dupey",
    quote:
      "Je viens de recevoir l’e-mail confirmant que mon nouveau retrait s’est déroulé sans problème.",
    image: "/testimonials/dan-dupey.png",
    imageWidth: 1132,
    imageHeight: 416,
    imageAlt:
      "Capture en anglais du message original de Dan Dupey remerciant l’équipe après avoir reçu un e-mail concernant son retrait.",
  },
  {
    name: "Membre de Nouvelle-Zélande",
    quote:
      "J’ai demandé le retrait hier soir à 22 h, heure de Nouvelle-Zélande, et il était dans mon portefeuille Exodus à mon réveil ce matin à 7 h.",
    image: "/testimonials/new-zealand-member.png",
    imageWidth: 1156,
    imageHeight: 364,
    imageAlt:
      "Capture en anglais du message original d’un membre de Nouvelle-Zélande au sujet d’un retrait arrivé pendant la nuit.",
  },
  {
    name: "Michael C. Parker",
    quote:
      "J’ai reçu mon premier retrait aujourd’hui, en quelques heures seulement ; je n’arrive pas à y croire.",
    image: "/testimonials/michael-c-parker.png",
    imageWidth: 1034,
    imageHeight: 308,
    imageAlt:
      "Capture en anglais du message original de Michael C. Parker au sujet de son premier retrait.",
  },
  {
    name: "Richard",
    quote:
      "Retrait effectué et payé en moins de cinq heures. Montant du retrait : 875,00 USDT. Montant net versé : 787,50 USDT.",
    image: "/testimonials/richard.png",
    imageWidth: 1162,
    imageHeight: 338,
    imageAlt:
      "Capture en anglais du message original de Richard indiquant le montant du retrait, les frais et le montant net versé.",
  },
];

const germanTestimonials: Testimonial[] = englishTestimonials.map((testimonial, index) => ({
  ...testimonial,
  ...[
    { name: "Brady White", quote: "Ich habe heute meine zweite Auszahlung erhalten, und alles lief reibungslos.", imageAlt: "Englischer Originalbeitrag von Brady White über seine reibungslose zweite Auszahlung." },
    { name: "Pamela Baden", quote: "Heute war mein erster Tag mit den Klicks. Es war einfach und hat Spaß gemacht, und ich freue mich auf meine nächste Klickrunde morgen!", imageAlt: "Englischer Originalbeitrag von Pamela Baden über ihren ersten Tag bei ClickBaitPays." },
    { name: "Roger Mitchell", quote: "Gerade meine dritte erfolgreiche Auszahlung um 23 Uhr Panama-Zeit erhalten. Es dauerte nur 25 Minuten, bis sie in meiner Exodus-Wallet ankam.", imageAlt: "Englischer Originalbeitrag von Roger Mitchell über seine dritte Auszahlung." },
    { name: "Mitglied der Community", quote: "Ich habe bei ClickBaitPays eine Auszahlung beantragt, und 33 Minuten später war das Guthaben in meiner persönlichen Wallet. Schnell. Reibungslos. Ausgezahlt.", imageAlt: "Englischer Originalbeitrag eines anonymen Mitglieds über eine Auszahlung, die nach 33 Minuten in seiner persönlichen Wallet ankam." },
    { name: "Dan Dupey", quote: "Ich habe gerade die E-Mail erhalten, dass meine neue Auszahlung problemlos abgewickelt wurde.", imageAlt: "Englischer Originalbeitrag von Dan Dupey, der sich nach der E-Mail zu seiner Auszahlung beim Team bedankt." },
    { name: "Mitglied aus Neuseeland", quote: "Ich habe gestern Abend um 22 Uhr neuseeländischer Zeit die Auszahlung beantragt. Als ich heute Morgen um 7 Uhr aufwachte, war sie in meiner Exodus-Wallet.", imageAlt: "Englischer Originalbeitrag eines Mitglieds aus Neuseeland über eine Auszahlung über Nacht." },
    { name: "Michael C. Parker", quote: "Ich habe heute meine erste Auszahlung erhalten – nach nur wenigen Stunden. Ich kann es kaum glauben.", imageAlt: "Englischer Originalbeitrag von Michael C. Parker über seine erste Auszahlung." },
    { name: "Richard", quote: "Innerhalb von 5 Stunden ausgezahlt. Auszahlungsbetrag: 875,00 USDT. Netto ausgezahlt: 787,50 USDT.", imageAlt: "Englischer Originalbeitrag von Richard mit Auszahlungsbetrag, Gebühr und Nettobetrag." },
  ][index],
}));

const testimonialUi = {
  en: {
    previous: "Previous member stories",
    next: "Next member stories",
    disclosure:
      "These are individual member comments shared in a community channel. ProNeurs has not independently verified every statement, and the experiences shown do not establish typical earnings or withdrawal timing. Results vary; earnings and withdrawals are not guaranteed.",
  },
  fr: {
    previous: "Témoignages précédents",
    next: "Témoignages suivants",
    disclosure:
      "Ces commentaires individuels ont été partagés par des membres dans un espace communautaire. ProNeurs n’a pas vérifié chaque déclaration de façon indépendante, et les expériences présentées ne reflètent pas nécessairement des gains ou des délais de retrait habituels. Les résultats varient ; les gains et les retraits ne sont pas garantis. Les captures originales sont en anglais et les citations affichées sont des traductions françaises.",
  },
  de: {
    previous: "Vorherige Erfahrungsberichte",
    next: "Nächste Erfahrungsberichte",
    disclosure: "Dies sind einzelne Kommentare von Mitgliedern aus einem Community-Kanal. ProNeurs hat nicht jede Aussage unabhängig überprüft. Die gezeigten Erfahrungen belegen weder typische Einnahmen noch übliche Auszahlungszeiten. Ergebnisse können unterschiedlich ausfallen; Einnahmen und Auszahlungen sind nicht garantiert. Die Original-Screenshots sind auf Englisch, die angezeigten Zitate sind deutsche Übersetzungen.",
  },
} satisfies Record<SiteLocale, object>;

const AUTO_ADVANCE_MS = 7200;
const SCROLL_DURATION_MS = 1600;

function cardStep(track: HTMLDivElement) {
  const card = track.querySelector<HTMLElement>(".testimonial-card");
  if (!card) return 0;
  const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
  return card.offsetWidth + gap;
}

function animateTrackScroll(
  track: HTMLDivElement,
  target: number,
  onComplete?: () => void,
) {
  const start = track.scrollLeft;
  const distance = target - start;
  const startedAt = window.performance.now();
  const previousSnapType = track.style.scrollSnapType;
  let frame = 0;
  let cancelled = false;

  track.style.scrollSnapType = "none";

  const animate = (now: number) => {
    if (cancelled) return;
    const progress = Math.min((now - startedAt) / SCROLL_DURATION_MS, 1);
    const eased =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    track.scrollLeft = start + distance * eased;

    if (progress < 1) {
      frame = window.requestAnimationFrame(animate);
      return;
    }

    track.scrollLeft = target;
    track.style.scrollSnapType = previousSnapType;
    onComplete?.();
  };

  frame = window.requestAnimationFrame(animate);

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame);
    track.style.scrollSnapType = previousSnapType;
  };
}

export default function TestimonialGallery({
  locale = DEFAULT_SITE_LOCALE,
}: {
  locale?: SiteLocale;
}) {
  const testimonials =
    locale === "fr" ? frenchTestimonials : locale === "de" ? germanTestimonials : englishTestimonials;
  const loopedTestimonials = [...testimonials, ...testimonials.slice(0, 3)];
  const ui = testimonialUi[locale];
  const trackRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const cancelScrollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const section = galleryRef.current?.closest<HTMLElement>(".testimonial-section");
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    section.classList.add("testimonial-reveal-ready");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        section.classList.add("testimonial-entered");
        observer.disconnect();
      },
      { threshold: 0.18 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      section.classList.remove("testimonial-reveal-ready", "testimonial-entered");
    };
  }, [locale]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interactionSurface =
      track.closest<HTMLElement>(".testimonial-carousel-shell") ?? track;

    let paused = false;
    const advance = () => {
      if (paused || document.hidden) return;
      const step = cardStep(track);
      if (!step) return;

      const current = Math.round(track.scrollLeft / step);
      const next = Math.min(current + 1, testimonials.length);
      cancelScrollRef.current?.();
      cancelScrollRef.current = animateTrackScroll(track, next * step, () => {
        cancelScrollRef.current = null;
        if (next === testimonials.length) {
          track.scrollTo({ left: 0, behavior: "auto" });
        }
      });
    };

    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };

    interactionSurface.addEventListener("mouseenter", pause);
    interactionSurface.addEventListener("mouseleave", resume);
    interactionSurface.addEventListener("focusin", pause);
    interactionSurface.addEventListener("focusout", resume);
    interactionSurface.addEventListener("pointerdown", pause);
    window.addEventListener("pointerup", resume);

    const interval = window.setInterval(advance, AUTO_ADVANCE_MS);

    return () => {
      window.clearInterval(interval);
      cancelScrollRef.current?.();
      cancelScrollRef.current = null;
      interactionSurface.removeEventListener("mouseenter", pause);
      interactionSurface.removeEventListener("mouseleave", resume);
      interactionSurface.removeEventListener("focusin", pause);
      interactionSurface.removeEventListener("focusout", resume);
      interactionSurface.removeEventListener("pointerdown", pause);
      window.removeEventListener("pointerup", resume);
    };
  }, [locale, testimonials]);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const step = cardStep(track);
    if (!step) return;

    let current = Math.round(track.scrollLeft / step);

    if (direction === 1 && current >= testimonials.length) {
      track.scrollTo({ left: 0, behavior: "auto" });
      current = 0;
    }

    if (direction === -1 && current <= 0) {
      track.scrollTo({ left: testimonials.length * step, behavior: "auto" });
      current = testimonials.length;
    }

    const target = (current + direction) * step;
    cancelScrollRef.current?.();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      track.scrollTo({ left: target, behavior: "auto" });
      cancelScrollRef.current = null;
      return;
    }

    cancelScrollRef.current = animateTrackScroll(track, target, () => {
      cancelScrollRef.current = null;
    });
  }

  return (
    <div className="testimonial-gallery" ref={galleryRef}>
      <div className="testimonial-carousel-shell">
        <button
          className="testimonial-arrow testimonial-arrow-previous"
          type="button"
          onClick={() => move(-1)}
          aria-label={ui.previous}
        >
          ←
        </button>

        <div className="testimonial-track" ref={trackRef} aria-live="off">
          {loopedTestimonials.map((testimonial, index) => {
            const isLoopClone = index >= testimonials.length;
            return (
              <article
                className="testimonial-card"
                key={`${testimonial.name}-${index}`}
                aria-hidden={isLoopClone || undefined}
              >
                <div className="testimonial-image">
                  <Image
                    src={testimonial.image}
                    alt={isLoopClone ? "" : testimonial.imageAlt}
                    width={testimonial.imageWidth}
                    height={testimonial.imageHeight}
                    sizes="(max-width: 680px) 88vw, (max-width: 980px) 50vw, 390px"
                  />
                </div>
                <blockquote>“{testimonial.quote}”</blockquote>
              </article>
            );
          })}
        </div>

        <button
          className="testimonial-arrow testimonial-arrow-next"
          type="button"
          onClick={() => move(1)}
          aria-label={ui.next}
        >
          →
        </button>
      </div>

      <p className="testimonial-disclosure">{ui.disclosure}</p>
    </div>
  );
}
