"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SiteLocale } from "../lib/i18n";
import {
  calculateLevelSevenCapacity,
  cycleDays,
  levels,
  simulateStartingCampaignOptions,
  timeLabel,
  withdrawalRate,
  type ContinuationMode,
  type StrategyPathResult,
} from "./calculatorMath";

type JourneyIconName = "start" | "growth" | "continuity";

type StrategyMeta = {
  kicker: string;
  description: string;
  icon: JourneyIconName;
};

const startingCampaignOptions = [1, 2, 3] as const;

const calculatorCopy = {
  en: {
    startingCampaignMeta: {
      1: {
        kicker: "Lowest starting amount",
        description:
          "Begin with one campaign and compound its released value toward full campaign capacity.",
        icon: "start",
      },
      2: {
        kicker: "Faster modeled growth",
        description:
          "Put two campaigns to work immediately so more value reaches its first release together.",
        icon: "continuity",
      },
      3: {
        kicker: "Fastest modeled growth",
        description:
          "Use all three campaign spots today for the quickest modeled start at this level.",
        icon: "growth",
      },
    } satisfies Record<(typeof startingCampaignOptions)[number], StrategyMeta>,
    continuationLabels: {
      "wait-for-release": "Wait for released funds",
      "keep-spots-moving": "Keep your selected campaign spots moving",
    } satisfies Record<ContinuationMode, string>,
    launch: "Calculate Your Campaign Potential",
    closeAria: "Close campaign path calculator",
    eyebrow: "Campaign path calculator",
    title: "Compare starting with one, two, or three campaigns.",
    introduction:
      "Choose a campaign level, compare what each starting amount could produce, then decide whether to wait for released funds or keep your selected campaign spots moving.",
    availabilityTitle: "When campaign earnings become available",
    availabilityIntro: "Daily earnings are shown before they can be used.",
    campaignDays: "Campaign days 1–12",
    earningsAppear: "Earnings appear daily",
    earningsAppearDetail:
      "They build in the Earned Wallet while campaign days are completed, but they cannot be reused yet.",
    nextSevenDays: "Next 7 days",
    earningsHeld: "Earnings are held",
    earningsHeldDetail:
      "The seven-day hold begins only after all 12 campaign days are complete.",
    afterHold: "After the hold",
    fundsAvailable: "Funds become available",
    fundsAvailableDetail:
      "They move to Available Balance and can then be reused or withdrawn.",
    availabilityNote:
      "“About day 19” assumes one campaign day is completed each day. Missing campaign days would move the dates later.",
    fastest: "Fastest result for these choices",
    moneyNeededToday: "Money needed today",
    firstEstimatedWithdrawal: "First estimated net withdrawal",
    firstBatchRoi: "First-batch ROI",
    estimatedTime: "Estimated time to 3 Level 7 campaigns",
    averageNetAfterGoal: "Average net gain per month after the goal",
    yourCampaigns: "Your campaigns",
    referralCommissions: "Referral commissions",
    combined: "Combined",
    longTermExcess: "Long-term net excess:",
    averageAfterGoal:
      "average per month during the first 12 months after reaching three Level 7 campaigns.",
    goalTimingFollows: "Goal timing follows",
    estimatedTimeToReach: "Estimated time to reach 3 Level 7 campaigns",
    goalActiveToday: "Goal active today",
    realNumbers: "Your plan in real numbers",
    campaignsOnly: "campaigns only",
    takeFirstRelease: "If you take the first release",
    requestFirstWithdrawal: "Request the first withdrawal",
    estimatedAround: "estimated campaign withdrawal around day",
    netGain: "Net gain",
    roiInAbout: "ROI in about",
    days: "days",
    referralNetAddon: "Referral net add-on",
    combinedFirstWithdrawal: "Combined first withdrawal",
    campaignRoiExcludes: "Campaign ROI excludes",
    separateDay12Reserve: "the separate Day-12 reserve",
    and: "and",
    referralIncome: "referral income",
    keepCompounding: "If you keep compounding",
    buildCapacity: "Build to full campaign capacity",
    outsideMoneyToGoal: "Outside money used to reach the goal",
    reachGoal: "Reach 3 Level 7 campaigns",
    netSurplus: "Net surplus per completed set",
    campaignRoi: "campaign ROI",
    perCompletedSet: "per completed set",
    cadenceWithBridge:
      "new sets can start every 12 days; each releases after about 19 days",
    cadenceWithoutBridge: "each set releases after about 19 days",
    ongoingPlan: "Your ongoing plan at full campaign capacity",
    keep: "Keep",
    workingWithdraw: "working. Withdraw the net gains.",
    averageCampaignNetGain: "Average campaign net gain per month",
    averageCombinedNetGain: "Average combined net gain per month",
    campaigns: "Campaigns",
    referrals: "Referrals",
    monthlyAverageNote: "12-month total divided by 12",
    twelveMonthCampaignNetGain: "12-month campaign net gain",
    twelveMonthCombinedNetGain: "12-month combined net gain",
    afterWithdrawalFee: "After the modeled withdrawal fee",
    twelveMonthCampaignRoi: "12-month campaign cash ROI",
    gainDividedByCapital: "Campaign gain ÷ total capital working",
    totalsAssumption:
      "12-month totals count modeled releases during the 365 days after the goal; the monthly figure is the total divided by 12.",
    referralAssumptionStart:
      "Referral estimates assume the selected referrals repeat every",
    referralAssumptionEnd: "days and fund their own campaigns.",
    chooseModel: "Choose what to model",
    chooseModelDetail: "Pick your level, then add a referral example if wanted.",
    yourLevel: "Your campaign level",
    level: "Level",
    directReferrals: "Direct referrals (0 for none)",
    theirLevel: "Their campaign level",
    campaignsPerPerson: "Campaigns per person",
    referralExample: "Referral example",
    person: "person",
    people: "people",
    each: "each",
    referralsPay:
      "They pay for their own campaigns. The calculator counts only your referral commissions, modeled as available after about 19 days.",
    incomeShownSeparately:
      "Your campaign income, referral commissions, and combined total are shown separately below.",
    chooseCampaignCount: "Choose how many campaigns to start today",
    campaignCountDetailStart:
      "If the money is available today, putting it to work today produces the fastest modeled start. Compare the cost and result at Level",
    chooseAfterTwelve: "Choose what happens after 12 completed days",
    chooseAfterTwelveDetail:
      "This optional choice changes the reserve and timing, not the number of campaigns you start today.",
    afterDayTwelveChoice: "After Day 12 choice",
    noAdditionalReserve: "No additional reserve",
    waitForFunds: "Wait for released funds",
    waitForFundsDetail:
      "Add no outside money on Day 12. Start the next campaigns after value becomes available around Day 19.",
    dayTwelveReserve: "Day-12 reserve",
    optionalOutsideMoney: "Optional outside money",
    keepSpotsMoving: "Keep your selected campaign spots moving",
    keepSpotsMovingDetail:
      "Set aside one bridge reserve to replace your selected campaigns after 12 completed days. Released value then follows the modeled reinvestment schedule.",
    initialDayTwelveReserve: "Initial Day-12 reserve",
    selected: "You selected",
    selectedNoteEnd:
      "The goal timing and long-term estimates in all three cards follow this choice.",
    assumptionsSummary: "See the assumptions",
    assumptionAvailability:
      "Campaign earnings appear daily in the Earned Wallet but remain unavailable until all 12 campaign days and the following seven-day hold are complete.",
    assumptionCards:
      "The three starting cards compare one, two, or three campaigns purchased together at the selected level. One activation fee is included in each card’s money-needed-today figure.",
    assumptionContinuation:
      "“Wait for released funds” adds no replacement money on Day 12. “Keep your selected campaign spots moving” adds separate money equal to the selected campaign count times the campaign price after 12 completed days. This is a one-time bridge in the growth model; later purchases use released value.",
    assumptionGoal:
      "The displayed goal is the fastest path found by the calculator’s automatic purchase rule, not a promise of the shortest possible schedule under every purchase choice.",
    assumptionReferrals:
      "The referral estimate models the number of direct referrals entered above at the selected level and campaign count, with those campaigns starting together. Referral campaign costs are paid by the referred people and are not included in your starting amount or Day-12 reserve.",
    assumptionReferralTiming:
      "Referral timing assumption: the model treats the full direct referral commission as available after the referred campaign completes 12 days and the seven-day hold—about day 19. A separate referral-wallet release rule has not been independently verified.",
    assumptionWithdrawal:
      "Internal reinvestment does not apply the withdrawal fee. Net cash and 12-month estimates apply the modeled 10% withdrawal fee.",
    disclaimerStart:
      "Illustrative strategy only—not guaranteed earnings, financial advice, or an investment projection. Campaign availability, member activity, program rules, fees, and timing can change. Funding source and financing costs are not modeled. Review the",
    officialRules: "current official rules",
    close: "Close calculator",
  },
  fr: {
    startingCampaignMeta: {
      1: {
        kicker: "Mise de départ la plus basse",
        description:
          "Commencez avec une campagne et réinvestissez les fonds débloqués pour atteindre la capacité maximale.",
        icon: "start",
      },
      2: {
        kicker: "Croissance simulée plus rapide",
        description:
          "Lancez immédiatement deux campagnes afin que davantage de fonds soient débloqués en même temps.",
        icon: "continuity",
      },
      3: {
        kicker: "Croissance simulée la plus rapide",
        description:
          "Utilisez dès aujourd’hui les trois emplacements pour obtenir le démarrage simulé le plus rapide à ce niveau.",
        icon: "growth",
      },
    } satisfies Record<(typeof startingCampaignOptions)[number], StrategyMeta>,
    continuationLabels: {
      "wait-for-release": "Attendre le déblocage des fonds",
      "keep-spots-moving": "Maintenir actifs les emplacements sélectionnés",
    } satisfies Record<ContinuationMode, string>,
    launch: "Calculez le potentiel de vos campagnes",
    closeAria: "Fermer le calculateur de parcours des campagnes",
    eyebrow: "Calculateur de parcours des campagnes",
    title: "Comparez un départ avec une, deux ou trois campagnes.",
    introduction:
      "Choisissez un niveau, comparez ce que chaque mise de départ pourrait produire, puis décidez d’attendre le déblocage des fonds ou de maintenir actifs les emplacements sélectionnés.",
    availabilityTitle: "Quand les gains des campagnes deviennent disponibles",
    availabilityIntro: "Les gains quotidiens s’affichent avant de pouvoir être utilisés.",
    campaignDays: "Jours de campagne 1 à 12",
    earningsAppear: "Les gains s’affichent chaque jour",
    earningsAppearDetail:
      "Ils s’accumulent dans le portefeuille « Earned Wallet » au fil des jours de campagne, mais ne peuvent pas encore être réutilisés.",
    nextSevenDays: "Les 7 jours suivants",
    earningsHeld: "Les gains sont bloqués",
    earningsHeldDetail:
      "La période de blocage de sept jours ne commence qu’une fois les 12 jours de campagne terminés.",
    afterHold: "Après la période de blocage",
    fundsAvailable: "Les fonds deviennent disponibles",
    fundsAvailableDetail:
      "Ils passent dans le solde « Available Balance » et peuvent alors être réutilisés ou retirés.",
    availabilityNote:
      "« Vers le jour 19 » suppose qu’un jour de campagne est effectué chaque jour. Tout jour manqué repousserait les dates.",
    fastest: "Résultat le plus rapide avec ces choix",
    moneyNeededToday: "Somme nécessaire aujourd’hui",
    firstEstimatedWithdrawal: "Premier retrait net estimé",
    firstBatchRoi: "ROI de la première série",
    estimatedTime: "Délai estimé pour atteindre 3 campagnes de niveau 7",
    averageNetAfterGoal: "Gain net mensuel moyen après l’objectif",
    yourCampaigns: "Vos campagnes",
    referralCommissions: "Commissions de parrainage",
    combined: "Total",
    longTermExcess: "Excédent net à long terme :",
    averageAfterGoal:
      "en moyenne par mois pendant les 12 premiers mois suivant l’obtention de trois campagnes de niveau 7.",
    goalTimingFollows: "Le délai de l’objectif suit l’option",
    estimatedTimeToReach: "Délai estimé pour atteindre 3 campagnes de niveau 7",
    goalActiveToday: "Objectif atteint aujourd’hui",
    realNumbers: "Votre plan en chiffres",
    campaignsOnly: "campagnes uniquement",
    takeFirstRelease: "Si vous retirez les premiers fonds débloqués",
    requestFirstWithdrawal: "Demander le premier retrait",
    estimatedAround: "retrait de campagne estimé vers le jour",
    netGain: "Gain net",
    roiInAbout: "ROI en environ",
    days: "jours",
    referralNetAddon: "Supplément net du parrainage",
    combinedFirstWithdrawal: "Premier retrait total",
    campaignRoiExcludes: "Le ROI des campagnes exclut",
    separateDay12Reserve: "la réserve distincte du jour 12",
    and: "et",
    referralIncome: "les revenus de parrainage",
    keepCompounding: "Si vous continuez à réinvestir",
    buildCapacity: "Atteindre la capacité maximale de campagnes",
    outsideMoneyToGoal: "Fonds externes utilisés pour atteindre l’objectif",
    reachGoal: "Atteindre 3 campagnes de niveau 7",
    netSurplus: "Excédent net par série terminée",
    campaignRoi: "de ROI sur les campagnes",
    perCompletedSet: "par série terminée",
    cadenceWithBridge:
      "de nouvelles séries peuvent commencer tous les 12 jours ; chacune débloque ses fonds après environ 19 jours",
    cadenceWithoutBridge: "chaque série débloque ses fonds après environ 19 jours",
    ongoingPlan: "Votre plan continu à capacité maximale",
    keep: "Maintenez",
    workingWithdraw: "en activité. Retirez les gains nets.",
    averageCampaignNetGain: "Gain net moyen des campagnes par mois",
    averageCombinedNetGain: "Gain net total moyen par mois",
    campaigns: "Campagnes",
    referrals: "Parrainages",
    monthlyAverageNote: "Total sur 12 mois divisé par 12",
    twelveMonthCampaignNetGain: "Gain net des campagnes sur 12 mois",
    twelveMonthCombinedNetGain: "Gain net total sur 12 mois",
    afterWithdrawalFee: "Après les frais de retrait modélisés",
    twelveMonthCampaignRoi: "ROI en espèces des campagnes sur 12 mois",
    gainDividedByCapital: "Gain des campagnes ÷ capital total en activité",
    totalsAssumption:
      "Les totaux sur 12 mois comptent les déblocages simulés pendant les 365 jours suivant l’objectif ; le montant mensuel correspond au total divisé par 12.",
    referralAssumptionStart:
      "Les estimations de parrainage supposent que les filleuls sélectionnés recommencent tous les",
    referralAssumptionEnd: "jours et financent leurs propres campagnes.",
    chooseModel: "Choisissez les éléments à simuler",
    chooseModelDetail: "Sélectionnez votre niveau, puis ajoutez un exemple de parrainage si vous le souhaitez.",
    yourLevel: "Niveau de votre campagne",
    level: "Niveau",
    directReferrals: "Filleuls directs (0 si aucun)",
    theirLevel: "Niveau de leur campagne",
    campaignsPerPerson: "Campagnes par personne",
    referralExample: "Exemple de parrainage",
    person: "personne",
    people: "personnes",
    each: "par personne",
    referralsPay:
      "Ils financent leurs propres campagnes. Le calculateur ne compte que vos commissions de parrainage, considérées comme disponibles après environ 19 jours.",
    incomeShownSeparately:
      "Les revenus de vos campagnes, les commissions de parrainage et le total sont indiqués séparément ci-dessous.",
    chooseCampaignCount: "Choisissez combien de campagnes lancer aujourd’hui",
    campaignCountDetailStart:
      "Si vous disposez des fonds aujourd’hui, les mettre en activité dès maintenant produit le démarrage simulé le plus rapide. Comparez le coût et le résultat au niveau",
    chooseAfterTwelve: "Choisissez ce qui se passe après 12 jours terminés",
    chooseAfterTwelveDetail:
      "Ce choix facultatif modifie la réserve et le calendrier, mais pas le nombre de campagnes lancées aujourd’hui.",
    afterDayTwelveChoice: "Choix après le jour 12",
    noAdditionalReserve: "Aucune réserve supplémentaire",
    waitForFunds: "Attendre le déblocage des fonds",
    waitForFundsDetail:
      "N’ajoutez aucun fonds externe au jour 12. Lancez les campagnes suivantes lorsque les fonds deviennent disponibles, vers le jour 19.",
    dayTwelveReserve: "Réserve du jour 12",
    optionalOutsideMoney: "Fonds externes facultatifs",
    keepSpotsMoving: "Maintenir actifs les emplacements sélectionnés",
    keepSpotsMovingDetail:
      "Prévoyez une réserve de transition pour remplacer les campagnes sélectionnées après 12 jours terminés. Les fonds débloqués suivent ensuite le calendrier de réinvestissement simulé.",
    initialDayTwelveReserve: "Réserve initiale du jour 12",
    selected: "Vous avez sélectionné",
    selectedNoteEnd:
      "Le délai de l’objectif et les estimations à long terme des trois cartes tiennent compte de ce choix.",
    assumptionsSummary: "Voir les hypothèses",
    assumptionAvailability:
      "Les gains des campagnes s’affichent chaque jour dans le portefeuille « Earned Wallet », mais restent indisponibles jusqu’à la fin des 12 jours de campagne et de la période de blocage de sept jours qui suit.",
    assumptionCards:
      "Les trois cartes de départ comparent une, deux ou trois campagnes achetées ensemble au niveau sélectionné. Chaque montant nécessaire aujourd’hui comprend des frais d’activation uniques.",
    assumptionContinuation:
      "« Attendre le déblocage des fonds » n’ajoute aucun fonds de remplacement au jour 12. « Maintenir actifs les emplacements sélectionnés » ajoute des fonds distincts, égaux au nombre de campagnes sélectionné multiplié par le prix d’une campagne, après 12 jours terminés. Cette réserve de transition n’est utilisée qu’une fois dans le modèle de croissance ; les achats suivants utilisent les fonds débloqués.",
    assumptionGoal:
      "L’objectif affiché correspond au parcours le plus rapide trouvé par la règle d’achat automatique du calculateur ; il ne garantit pas le calendrier le plus court pour toutes les décisions d’achat possibles.",
    assumptionReferrals:
      "L’estimation de parrainage modélise le nombre de filleuls directs saisi ci-dessus, avec le niveau et le nombre de campagnes sélectionnés, toutes lancées en même temps. Les filleuls paient leurs propres campagnes ; ces coûts ne sont pas inclus dans votre mise de départ ni dans la réserve du jour 12.",
    assumptionReferralTiming:
      "Hypothèse sur le calendrier du parrainage : le modèle considère que la totalité de la commission directe devient disponible lorsque la campagne du filleul termine ses 12 jours et la période de blocage de sept jours, soit vers le jour 19. Une règle distincte de déblocage du portefeuille de parrainage n’a pas été vérifiée indépendamment.",
    assumptionWithdrawal:
      "Les réinvestissements internes ne sont pas soumis aux frais de retrait. Les estimations nettes et sur 12 mois appliquent les frais de retrait simulés de 10 %.",
    disclaimerStart:
      "Stratégie fournie à titre d’illustration uniquement : ni gains garantis, ni conseil financier, ni projection d’investissement. La disponibilité des campagnes, l’activité des membres, les règles du programme, les frais et les délais peuvent changer. La source des fonds et les coûts de financement ne sont pas modélisés. Consultez les",
    officialRules: "règles officielles en vigueur",
    close: "Fermer le calculateur",
  },
} as const;

const moneyFormatters: Record<SiteLocale, Intl.NumberFormat> = {
  en: new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  fr: new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
};

const percentFormatters: Record<SiteLocale, Intl.NumberFormat> = {
  en: new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
  fr: new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
};

const integerFormatters: Record<SiteLocale, Intl.NumberFormat> = {
  en: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
  fr: new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }),
};

function ChoiceButtons({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="planner-choice">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "is-selected" : ""}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function JourneyIcon({ name }: { name: JourneyIconName }) {
  return (
    <svg
      className="journey-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "start" && <path d="M7 5v14l11-7L7 5Z" />}
      {name === "growth" && (
        <>
          <path d="m4 17 5-5 4 3 7-8" />
          <path d="M15 7h5v5" />
        </>
      )}
      {name === "continuity" && (
        <>
          <path d="M20 7v5h-5" />
          <path d="M4 17v-5h5" />
          <path d="M6.2 7.3A7 7 0 0 1 18.7 10M17.8 16.7A7 7 0 0 1 5.3 14" />
        </>
      )}
    </svg>
  );
}

function formatMoney(value: number, locale: SiteLocale) {
  return moneyFormatters[locale].format(value);
}

function percent(value: number, locale: SiteLocale) {
  const rounded = Math.round(value * 10) / 10;
  const space = locale === "fr" ? " " : "";
  return `${rounded > 0 ? "+" : ""}${percentFormatters[locale].format(rounded)}${space}%`;
}

function signedMoney(value: number, locale: SiteLocale) {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(value), locale)} USDT`;
}

function exactDayLabel(day: number, locale: SiteLocale) {
  if (day < 0) return locale === "fr" ? "Non atteint" : "Not reached";
  if (day === 0) return locale === "fr" ? "Point de départ" : "Starting point";
  return locale === "fr" ? `Jour ${day}` : `Day ${day}`;
}

function campaignLabel(count: number, locale: SiteLocale) {
  if (locale === "fr") return `campagne${count === 1 ? "" : "s"}`;
  return `campaign${count === 1 ? "" : "s"}`;
}

function startingCampaignLabel(
  count: number,
  level: number,
  locale: SiteLocale,
) {
  if (locale === "fr") {
    return `Lancez ${count} ${campaignLabel(count, locale)} de niveau ${level} aujourd’hui`;
  }
  return `Start ${count} Level ${level} ${campaignLabel(count, locale)} today`;
}

function CampaignAvailabilityTimeline({ locale }: { locale: SiteLocale }) {
  const t = calculatorCopy[locale];

  return (
    <section className="campaign-availability">
      <header>
        <strong>{t.availabilityTitle}</strong>
        <small>{t.availabilityIntro}</small>
      </header>
      <ol className="campaign-availability-steps">
        <li className="is-earning">
          <span>{t.campaignDays}</span>
          <strong>{t.earningsAppear}</strong>
          <small>{t.earningsAppearDetail}</small>
        </li>
        <li className="is-held">
          <span>{t.nextSevenDays}</span>
          <strong>{t.earningsHeld}</strong>
          <small>{t.earningsHeldDetail}</small>
        </li>
        <li className="is-available">
          <span>{t.afterHold}</span>
          <strong>{t.fundsAvailable}</strong>
          <small>{t.fundsAvailableDetail}</small>
        </li>
      </ol>
      <p>{t.availabilityNote}</p>
    </section>
  );
}

function StartingCampaignCard({
  path,
  count,
  startingLevel,
  selected,
  fastestForInputs,
  referralsIncluded,
  continuationMode,
  locale,
  onSelect,
}: {
  path: StrategyPathResult;
  count: (typeof startingCampaignOptions)[number];
  startingLevel: number;
  selected: boolean;
  fastestForInputs: boolean;
  referralsIncluded: boolean;
  continuationMode: ContinuationMode;
  locale: SiteLocale;
  onSelect: () => void;
}) {
  const t = calculatorCopy[locale];
  const meta = t.startingCampaignMeta[count];
  const goalReachedToday = path.goalDay === 0;

  return (
    <button
      type="button"
      className={`strategy-card${selected ? " is-selected" : ""}`}
      data-starting-campaigns={count}
      aria-pressed={selected}
      aria-controls="selected-strategy-detail"
      onClick={onSelect}
    >
      <span className="strategy-card__icon" aria-hidden="true">
        <JourneyIcon name={meta.icon} />
      </span>
      <span className="strategy-card__kicker">{meta.kicker}</span>
      <strong className="strategy-card__title">
        {startingCampaignLabel(count, startingLevel, locale)}
      </strong>
      <span className="strategy-card__badge-slot">
        {fastestForInputs && (
          <span className="strategy-card__fastest">
            {t.fastest}
          </span>
        )}
      </span>
      <span className="strategy-card__copy">{meta.description}</span>

      <span className="strategy-card__funding">
        <span className="strategy-card__metric">
          <span>{t.moneyNeededToday}</span>
          <strong>{formatMoney(path.neededToday, locale)} USDT</strong>
        </span>
        <span className="strategy-card__metric">
          <span>{t.firstEstimatedWithdrawal}</span>
          <strong>{formatMoney(path.firstNetWithdrawal, locale)} USDT</strong>
        </span>
        <span className="strategy-card__metric">
          <span>{t.firstBatchRoi}</span>
          <strong>{percent(path.firstBatchRoi, locale)}</strong>
        </span>
      </span>

      <span className="strategy-card__goal">
        <span>{t.estimatedTime}</span>
        <strong>{exactDayLabel(path.goalDay, locale)}</strong>
        {!goalReachedToday && <small>{timeLabel(path.goalDay, locale)}</small>}
      </span>
      {referralsIncluded ? (
        <span className="strategy-card__income-split">
          <span>{t.averageNetAfterGoal}</span>
          <span>
            <span>{t.yourCampaigns}</span>
            <strong>
              {formatMoney(path.ongoingProjection.averageCampaignNetPerMonth, locale)} USDT
            </strong>
          </span>
          <span>
            <span>{t.referralCommissions}</span>
            <strong>
              {formatMoney(path.ongoingProjection.averageReferralNetPerMonth, locale)} USDT
            </strong>
          </span>
          <span className="is-combined">
            <span>{t.combined}</span>
            <strong>
              {formatMoney(path.ongoingProjection.averageCombinedNetPerMonth, locale)} USDT
            </strong>
          </span>
        </span>
      ) : (
        <span className="strategy-card__benefit">
          <b>{t.longTermExcess}</b>{" "}
          {formatMoney(path.ongoingProjection.averageCampaignNetPerMonth, locale)} USDT{" "}
          {t.averageAfterGoal}
        </span>
      )}
      <span className="strategy-card__cadence">
        {locale === "fr" ? (
          <>{t.goalTimingFollows} « {t.continuationLabels[continuationMode]} ».</>
        ) : (
          <>{t.goalTimingFollows} “{t.continuationLabels[continuationMode]}.”</>
        )}
      </span>
    </button>
  );
}

function SelectedStrategyDetail({
  path,
  startingLevel,
  continuationMode,
  includeReferrals,
  referralPeople,
  referralLevel,
  referralCampaigns,
  locale,
}: {
  path: StrategyPathResult;
  startingLevel: number;
  continuationMode: ContinuationMode;
  includeReferrals: boolean;
  referralPeople: number;
  referralLevel: number;
  referralCampaigns: number;
  locale: SiteLocale;
}) {
  const t = calculatorCopy[locale];
  const startingCount = path.funding.startingCampaigns as 1 | 2 | 3;
  const planLabel = startingCampaignLabel(startingCount, startingLevel, locale);
  const continuationLabel = t.continuationLabels[continuationMode];
  const levelSeven = calculateLevelSevenCapacity();
  const keepsSpotsMoving = continuationMode === "keep-spots-moving";
  const ongoing = path.ongoingProjection;
  const goalReachedToday = path.goalDay === 0;
  const selectedLevel = levels[startingLevel - 1] ?? levels[0];
  const firstCampaignGross =
    selectedLevel.earnings * path.funding.startingCampaigns;
  const firstReferralGross = includeReferrals
    ? path.referralEstimates.releaseFunded.grossPerRelease
    : 0;
  const firstGrossAvailable = firstCampaignGross + firstReferralGross;
  const firstCampaignNet = path.firstNetWithdrawal;
  const firstReferralNet = firstReferralGross * withdrawalRate;
  const combinedFirstWithdrawalNet = firstGrossAvailable * withdrawalRate;
  const firstWithdrawalProfit = path.firstBatchProfit;
  const firstWithdrawalRoi = path.firstBatchRoi;

  return (
    <section
      id="selected-strategy-detail"
      className="selected-strategy-detail"
      data-starting-campaigns={startingCount}
    >
      <p className="sr-only" aria-live="polite">
        {locale === "fr"
          ? `${planLabel}, ${continuationLabel} : ${exactDayLabel(path.goalDay, locale)} pour atteindre trois campagnes de niveau 7.`
          : `${planLabel}, ${continuationLabel}: ${exactDayLabel(path.goalDay, locale)} to three Level 7 campaigns.`}
      </p>
      <header className="selected-strategy-hero">
        <h3>{planLabel}</h3>
        <p>{t.estimatedTimeToReach}</p>
        <strong>{exactDayLabel(path.goalDay, locale)}</strong>
        <small>
          {goalReachedToday
            ? t.goalActiveToday
            : timeLabel(path.goalDay, locale)}
        </small>
      </header>

      <section className="outcome-dashboard" aria-labelledby="outcome-title">
        <header className="outcome-dashboard__header">
          <h4 id="outcome-title">{t.realNumbers}</h4>
          <p>
            {locale === "fr" ? (
              <>
                {path.funding.startingCampaigns}{" "}
                {campaignLabel(path.funding.startingCampaigns, locale)} de niveau{" "}
                {startingLevel} lancée
                {path.funding.startingCampaigns === 1 ? "" : "s"} aujourd’hui ·{" "}
                {continuationLabel} · {includeReferrals
                  ? `${referralPeople} ${referralPeople === 1 ? "filleul direct" : "filleuls directs"}, avec chacun ${referralCampaigns} ${campaignLabel(referralCampaigns, locale)} de niveau ${referralLevel}`
                  : t.campaignsOnly}
              </>
            ) : (
              <>
                {path.funding.startingCampaigns} Level {startingLevel}{" "}
                {campaignLabel(path.funding.startingCampaigns, locale)} started today ·{" "}
                {continuationLabel} · {includeReferrals
                  ? `${referralPeople} direct referral${referralPeople === 1 ? "" : "s"} with ${referralCampaigns} Level ${referralLevel} ${campaignLabel(referralCampaigns, locale)} each`
                  : t.campaignsOnly}
              </>
            )}
          </p>
        </header>

        <div
          className={`outcome-choice-grid${goalReachedToday ? " is-goal-start" : ""}`}
        >
          <article className="outcome-card is-withdraw">
            <header className="outcome-card__header">
              <span aria-hidden="true">1</span>
              <div>
                <small>{t.takeFirstRelease}</small>
                <h5>{t.requestFirstWithdrawal}</h5>
              </div>
            </header>

            <strong className="outcome-card__value">
              {formatMoney(firstCampaignNet, locale)} USDT
            </strong>
            <span className="outcome-card__value-label">
              {t.estimatedAround} {cycleDays}
            </span>

            <div className="outcome-card__key-results">
              <div>
                <span>{t.netGain}</span>
                <strong>{signedMoney(firstWithdrawalProfit, locale)}</strong>
              </div>
              <div>
                <span>{t.roiInAbout} {cycleDays} {t.days}</span>
                <strong>{percent(firstWithdrawalRoi, locale)}</strong>
              </div>
            </div>

            {includeReferrals && (
              <div className="outcome-card__referral-result">
                <div>
                  <span>{t.referralNetAddon}</span>
                  <strong>+{formatMoney(firstReferralNet, locale)} USDT</strong>
                </div>
                <div>
                  <span>{t.combinedFirstWithdrawal}</span>
                  <strong>{formatMoney(combinedFirstWithdrawalNet, locale)} USDT</strong>
                </div>
              </div>
            )}

            {(path.neededByDay12 > 0 || includeReferrals) && (
              <p className="outcome-card__note">
                {t.campaignRoiExcludes}{" "}
                {path.neededByDay12 > 0 ? t.separateDay12Reserve : ""}
                {path.neededByDay12 > 0 && includeReferrals ? ` ${t.and} ` : ""}
                {includeReferrals ? t.referralIncome : ""}.
              </p>
            )}
          </article>

          <article className="outcome-card is-compound">
            <header className="outcome-card__header">
              <span aria-hidden="true">2</span>
              <div>
                <small>{t.keepCompounding}</small>
                <h5>{t.buildCapacity}</h5>
              </div>
            </header>

            <ol className="outcome-card__compound-story">
              <li>
                <span>{t.outsideMoneyToGoal}</span>
                <strong>{formatMoney(path.externalFundingByGoal, locale)} USDT</strong>
              </li>
              <li>
                <span>{t.reachGoal}</span>
                <strong>
                  {goalReachedToday
                    ? exactDayLabel(0, locale)
                    : `${exactDayLabel(path.goalDay, locale)} · ${timeLabel(path.goalDay, locale)}`}
                </strong>
              </li>
              <li>
                <span>{t.netSurplus}</span>
                <strong>{formatMoney(levelSeven.netSurplusPerRelease, locale)} USDT</strong>
                <small>
                  <b>
                    {percent(levelSeven.netSurplusRoiPerRelease, locale)} {t.campaignRoi}
                  </b>{" "}
                  {t.perCompletedSet} · {keepsSpotsMoving
                    ? t.cadenceWithBridge
                    : t.cadenceWithoutBridge}
                </small>
              </li>
            </ol>
          </article>
        </div>

        <section
          className="long-term-outcome never-stop-outcome"
          aria-labelledby="long-term-title"
        >
          <header className="long-term-outcome__header">
            <span>3 · {t.ongoingPlan}</span>
            <h4 id="long-term-title">
              {t.keep} {formatMoney(ongoing.committedCampaignCapital, locale)} USDT{" "}
              {t.workingWithdraw}
            </h4>
          </header>

          <div className="never-stop-story">
            <article className="is-average">
              <span>
                {includeReferrals
                  ? t.averageCombinedNetGain
                  : t.averageCampaignNetGain}
              </span>
              <strong>{formatMoney(ongoing.averageCombinedNetPerMonth, locale)} USDT</strong>
              {includeReferrals ? (
                <dl>
                  <div>
                    <dt>{t.campaigns}</dt>
                    <dd>{formatMoney(ongoing.averageCampaignNetPerMonth, locale)} USDT</dd>
                  </div>
                  <div>
                    <dt>{t.referrals}</dt>
                    <dd>{formatMoney(ongoing.averageReferralNetPerMonth, locale)} USDT</dd>
                  </div>
                </dl>
              ) : (
                <small>{t.monthlyAverageNote}</small>
              )}
            </article>
            <article className="is-total">
              <span>
                {includeReferrals
                  ? t.twelveMonthCombinedNetGain
                  : t.twelveMonthCampaignNetGain}
              </span>
              <strong>{formatMoney(ongoing.combinedNetWithdrawals, locale)} USDT</strong>
              {includeReferrals ? (
                <dl>
                  <div>
                    <dt>{t.campaigns}</dt>
                    <dd>{formatMoney(ongoing.campaignNetWithdrawals, locale)} USDT</dd>
                  </div>
                  <div>
                    <dt>{t.referrals}</dt>
                    <dd>{formatMoney(ongoing.referralNetWithdrawals, locale)} USDT</dd>
                  </div>
                </dl>
              ) : (
                <small>{t.afterWithdrawalFee}</small>
              )}
            </article>
            <article className="is-roi">
              <span>{t.twelveMonthCampaignRoi}</span>
              <strong>{percent(ongoing.campaignCashRoi, locale)}</strong>
              <small>{t.gainDividedByCapital}</small>
            </article>
          </div>

          <p className="outcome-assumption-note">
            {t.totalsAssumption}
            {includeReferrals && (
              <>
                {" "}{t.referralAssumptionStart} {ongoing.referralCadenceDays}{" "}
                {t.referralAssumptionEnd}
              </>
            )}
          </p>
        </section>
      </section>
    </section>
  );
}

export default function ReferralSimulator({
  locale = "en",
}: {
  locale?: SiteLocale;
}) {
  const t = calculatorCopy[locale];
  const [hasOpened, setHasOpened] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleCalculatorLinkClick(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const calculatorLink = event.target.closest<HTMLAnchorElement>(
        'a[href="#calculator"]',
      );
      if (!calculatorLink) return;

      event.preventDefault();
      setHasOpened(true);
      setIsOpen(true);
    }

    document.addEventListener("click", handleCalculatorLinkClick);
    return () =>
      document.removeEventListener("click", handleCalculatorLinkClick);
  }, []);

  if (hasOpened) {
    return (
      <ActiveReferralSimulator
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        locale={locale}
      />
    );
  }

  return (
    <div className="calculator-launch" id="calculator">
      <button
        type="button"
        className="calculator-launch-button"
        onClick={() => {
          setHasOpened(true);
          setIsOpen(true);
        }}
      >
        {t.launch} <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}

function ActiveReferralSimulator({
  isOpen,
  setIsOpen,
  locale,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  locale: SiteLocale;
}) {
  const t = calculatorCopy[locale];
  const [startingLevel, setStartingLevel] = useState(3);
  const [startingCampaigns, setStartingCampaigns] = useState(1);
  const [continuationMode, setContinuationMode] =
    useState<ContinuationMode>("wait-for-release");
  const [referralPeopleInput, setReferralPeopleInput] = useState("0");
  const [referralLevel, setReferralLevel] = useState(3);
  const [referralCampaigns, setReferralCampaigns] = useState(1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const parsedReferralPeople = Number(referralPeopleInput);
  const referralPeople = Number.isFinite(parsedReferralPeople)
    ? Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.max(0, Math.floor(parsedReferralPeople)),
      )
    : 0;
  const includeReferrals = referralPeople > 0;

  const pathsByStartingCount = useMemo(
    () =>
      simulateStartingCampaignOptions({
        startingLevel,
        continuationMode,
        people: referralPeople,
        referralLevel,
        referralCampaigns,
        referralCadence: "release-funded",
      }),
    [
      startingLevel,
      continuationMode,
      referralPeople,
      referralLevel,
      referralCampaigns,
    ],
  );
  const selectedPath = pathsByStartingCount[startingCampaigns as 1 | 2 | 3];
  const fastestGoalDay = Math.min(
    ...startingCampaignOptions.map(
      (campaignCount) => pathsByStartingCount[campaignCount].goalDay,
    ),
  );
  const selectedLevel = levels[startingLevel - 1] ?? levels[0];
  const continuityReserve = selectedLevel.campaign * startingCampaigns;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const triggerElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            "button, input, select, summary, [href], [tabindex]:not([tabindex='-1'])",
          ),
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="calculator-launch" id="calculator">
      <button
        ref={triggerRef}
        type="button"
        className="calculator-launch-button"
        onClick={() => setIsOpen(true)}
      >
        {t.launch} <span aria-hidden="true">↗</span>
      </button>

      {isOpen && (
        <div
          className="calculator-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            ref={modalRef}
            className="calculator-modal planner-modal journey-modal strategy-calculator-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calculator-title"
          >
            <button
              ref={closeRef}
              type="button"
              className="calculator-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label={t.closeAria}
            >
              ×
            </button>

            <header className="simple-calculator-header">
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 id="calculator-title">{t.title}</h2>
              <p>{t.introduction}</p>
            </header>

            <CampaignAvailabilityTimeline locale={locale} />

            <section className="simple-calculator-setup">
              <header className="simple-section-heading">
                <span>01</span>
                <div>
                  <h3>{t.chooseModel}</h3>
                  <p>{t.chooseModelDetail}</p>
                </div>
              </header>

              <div
                className={`simple-setup-grid${includeReferrals ? " has-referrals" : ""}`}
              >
                <label className="planner-field">
                  <span>{t.yourLevel}</span>
                  <select
                    value={startingLevel}
                    onChange={(event) =>
                      setStartingLevel(Number(event.target.value))
                    }
                  >
                    {levels.map((level) => (
                      <option value={level.id} key={level.id}>
                        {t.level} {level.id} · {integerFormatters[locale].format(level.campaign)} USDT
                      </option>
                    ))}
                  </select>
                </label>

                <label className="planner-field referral-count-field">
                  <span>{t.directReferrals}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={referralPeopleInput}
                    onChange={(event) =>
                      setReferralPeopleInput(event.target.value)
                    }
                    onBlur={() =>
                      setReferralPeopleInput(String(referralPeople))
                    }
                  />
                </label>

                {includeReferrals && (
                  <>
                    <div className="simple-referral-settings">
                      <label className="planner-field">
                        <span>{t.theirLevel}</span>
                        <select
                          value={referralLevel}
                          onChange={(event) =>
                            setReferralLevel(Number(event.target.value))
                          }
                        >
                          {levels.map((level) => (
                            <option value={level.id} key={level.id}>
                              {t.level} {level.id}
                            </option>
                          ))}
                        </select>
                      </label>

                      <ChoiceButtons
                        label={t.campaignsPerPerson}
                        value={referralCampaigns}
                        options={[
                          { value: 1, label: "1" },
                          { value: 2, label: "2" },
                          { value: 3, label: "3" },
                        ]}
                        onChange={setReferralCampaigns}
                      />
                    </div>

                    <div className="simple-referral-summary">
                      <div>
                        <b>{t.referralExample}</b>
                        <strong>
                          {referralPeople} {referralPeople === 1 ? t.person : t.people}
                          {" × "}
                          {referralCampaigns} {locale === "en" ? `${t.level} ${referralLevel} ` : ""}
                          {campaignLabel(referralCampaigns, locale)}{locale === "fr" ? ` de niveau ${referralLevel}` : ""}{" "}
                          {t.each}
                        </strong>
                      </div>
                      <p>{t.referralsPay}</p>
                      <small>{t.incomeShownSeparately}</small>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="strategy-comparison">
              <header className="simple-section-heading">
                <span>02</span>
                <div>
                  <h3>{t.chooseCampaignCount}</h3>
                  <p>
                    {t.campaignCountDetailStart} {startingLevel}.
                  </p>
                </div>
              </header>

              <div className="strategy-comparison-grid">
                {startingCampaignOptions.map((campaignCount) => (
                  <StartingCampaignCard
                    key={campaignCount}
                    path={pathsByStartingCount[campaignCount]}
                    count={campaignCount}
                    startingLevel={startingLevel}
                    selected={startingCampaigns === campaignCount}
                    fastestForInputs={
                      pathsByStartingCount[campaignCount].goalDay ===
                      fastestGoalDay
                    }
                    referralsIncluded={includeReferrals}
                    continuationMode={continuationMode}
                    locale={locale}
                    onSelect={() => setStartingCampaigns(campaignCount)}
                  />
                ))}
              </div>
            </section>

            <section className="continuation-choice-section">
              <header className="simple-section-heading">
                <span>03</span>
                <div>
                  <h3>{t.chooseAfterTwelve}</h3>
                  <p>{t.chooseAfterTwelveDetail}</p>
                </div>
              </header>

              <fieldset className="continuation-choice">
                <legend className="sr-only">{t.afterDayTwelveChoice}</legend>
                <button
                  type="button"
                  className={
                    continuationMode === "wait-for-release"
                      ? "is-selected"
                      : ""
                  }
                  aria-pressed={continuationMode === "wait-for-release"}
                  onClick={() => setContinuationMode("wait-for-release")}
                >
                  <span className="continuation-choice__icon" aria-hidden="true">
                    <JourneyIcon name="start" />
                  </span>
                  <span className="continuation-choice__eyebrow">
                    {t.noAdditionalReserve}
                  </span>
                  <strong>{t.waitForFunds}</strong>
                  <small>{t.waitForFundsDetail}</small>
                  <b>{t.dayTwelveReserve}: {formatMoney(0, locale)} USDT</b>
                </button>

                <button
                  type="button"
                  className={
                    continuationMode === "keep-spots-moving"
                      ? "is-selected"
                      : ""
                  }
                  aria-pressed={continuationMode === "keep-spots-moving"}
                  onClick={() => setContinuationMode("keep-spots-moving")}
                >
                  <span className="continuation-choice__icon" aria-hidden="true">
                    <JourneyIcon name="continuity" />
                  </span>
                  <span className="continuation-choice__eyebrow">
                    {t.optionalOutsideMoney}
                  </span>
                  <strong>{t.keepSpotsMoving}</strong>
                  <small>{t.keepSpotsMovingDetail}</small>
                  <b>
                    {t.initialDayTwelveReserve}: {formatMoney(continuityReserve, locale)} USDT
                  </b>
                </button>
              </fieldset>

              <p className="continuation-choice-note" aria-live="polite">
                {locale === "fr" ? (
                  <>
                    {t.selected} {startingCampaigns}{" "}
                    {campaignLabel(startingCampaigns, locale)} de niveau {startingLevel}{" "}
                    aujourd’hui et l’option « {t.continuationLabels[continuationMode]} ».
                    {" "}{t.selectedNoteEnd}
                  </>
                ) : (
                  <>
                    {t.selected} {startingCampaigns} Level {startingLevel}{" "}
                    {campaignLabel(startingCampaigns, locale)} today and “
                    {t.continuationLabels[continuationMode]}.” {t.selectedNoteEnd}
                  </>
                )}
              </p>
            </section>

            <SelectedStrategyDetail
              path={selectedPath}
              startingLevel={startingLevel}
              continuationMode={continuationMode}
              includeReferrals={includeReferrals}
              referralPeople={referralPeople}
              referralLevel={referralLevel}
              referralCampaigns={referralCampaigns}
              locale={locale}
            />

            <details className="planner-assumptions simple-assumptions">
              <summary>
                {t.assumptionsSummary} <i aria-hidden="true">+</i>
              </summary>
              <div>
                <p>{t.assumptionAvailability}</p>
                <p>{t.assumptionCards}</p>
                <p>{t.assumptionContinuation}</p>
                <p>{t.assumptionGoal}</p>
                <p>{t.assumptionReferrals}</p>
                <p>{t.assumptionReferralTiming}</p>
                <p>{t.assumptionWithdrawal}</p>
              </div>
            </details>

            <p className="calculator-modal-note">
              {t.disclaimerStart}{" "}
              <a
                href={
                  locale === "fr"
                    ? "/fr/faq"
                    : "https://clickbaitpays.me/questions.php"
                }
                {...(locale === "en"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {t.officialRules}
              </a>
              .
            </p>

            <button
              type="button"
              className="calculator-modal-done"
              onClick={() => setIsOpen(false)}
            >
              {t.close}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
