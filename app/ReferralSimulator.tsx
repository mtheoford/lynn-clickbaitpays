"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  clickDays,
  cycleDays,
  getLevel,
  levels,
  maximumProjectionDays,
  milestoneLabel,
  monthlyReferralPotential,
  simulateCashPath,
  simulateCompoundPath,
  timeLabel,
  withdrawalRate,
} from "./calculatorMath";

type ReferralMode = "none" | "refer3" | "custom";
type JourneyMode = "start" | "compound" | "continuity";

type HorizonResult = {
  months: number;
  cashAvailable: number;
  activeCampaignValue: number;
  recoveredPercent: number;
  differencePercent: number;
};
const horizonDays = [
  { months: 3, days: 90 },
  { months: 6, days: 180 },
  { months: 12, days: 365 },
];

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});


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

type JourneyIconName =
  | "start"
  | "growth"
  | "continuity"
  | "person"
  | "people"
  | "sliders"
  | "clock"
  | "wallet"
  | "recovered";

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
      {name === "person" && (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M6.5 20a5.5 5.5 0 0 1 11 0" />
        </>
      )}
      {name === "people" && (
        <>
          <circle cx="12" cy="7" r="2.5" />
          <circle cx="5.5" cy="10" r="2" />
          <circle cx="18.5" cy="10" r="2" />
          <path d="M8 19a4 4 0 0 1 8 0M2.5 19a3 3 0 0 1 4.8-2.4M21.5 19a3 3 0 0 0-4.8-2.4" />
        </>
      )}
      {name === "sliders" && (
        <>
          <path d="M4 6h5M15 6h5M4 12h9M17 12h3M4 18h3M11 18h9" />
          <circle cx="12" cy="6" r="2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="9" cy="18" r="2" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </>
      )}
      {name === "wallet" && (
        <>
          <path d="M4 7.5h14a2 2 0 0 1 2 2v8H6a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h10" />
          <path d="M15 11h5v4h-5a2 2 0 0 1 0-4Z" />
        </>
      )}
      {name === "recovered" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12 2.2 2.2 4.8-5" />
        </>
      )}
    </svg>
  );
}

function percent(value: number) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

export default function ReferralSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [startingLevel, setStartingLevel] = useState(3);
  const [startingCampaigns, setStartingCampaigns] = useState(1);
  const [journeyMode, setJourneyMode] = useState<JourneyMode>("start");
  const [referralMode, setReferralMode] = useState<ReferralMode>("none");
  const [customPeopleInput, setCustomPeopleInput] = useState("3");
  const [customReferralLevel, setCustomReferralLevel] = useState(3);
  const [customReferralCampaigns, setCustomReferralCampaigns] = useState(3);
  const [householdAccounts, setHouseholdAccounts] = useState(1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);

  const customPeople = Math.min(
    100,
    Math.max(0, Number(customPeopleInput) || 0),
  );
  const referralPlan =
    referralMode === "refer3"
      ? { people: 3, level: 3, campaigns: 3 }
      : referralMode === "custom"
        ? {
            people: customPeople,
            level: customReferralLevel,
            campaigns: customReferralCampaigns,
          }
        : { people: 0, level: 3, campaigns: 1 };

  const baselinePath = useMemo(
    () =>
      simulateCompoundPath({
        startingLevel,
        startingCampaigns,
        people: 0,
        referralLevel: 3,
        referralCampaigns: 1,
      }),
    [startingLevel, startingCampaigns],
  );

  const selectedPath = useMemo(
    () =>
      simulateCompoundPath({
        startingLevel,
        startingCampaigns,
        people: referralPlan.people,
        referralLevel: referralPlan.level,
        referralCampaigns: referralPlan.campaigns,
      }),
    [
      startingLevel,
      startingCampaigns,
      referralPlan.people,
      referralPlan.level,
      referralPlan.campaigns,
    ],
  );

  const starting = getLevel(startingLevel);
  const oneRoundFunds =
    (starting.campaign * startingCampaigns + starting.activation) *
    householdAccounts;
  const continuityReserve =
    starting.campaign * startingCampaigns * householdAccounts;
  const readyToRollFunds = oneRoundFunds + continuityReserve;
  const selectedStartingFunds =
    journeyMode === "continuity" ? readyToRollFunds : oneRoundFunds;
  const firstReleaseGross =
    starting.earnings * startingCampaigns * householdAccounts;
  const firstReleaseNet = firstReleaseGross * withdrawalRate;
  const firstRoundDifference = firstReleaseNet - oneRoundFunds;
  const firstRoundReturn = (firstRoundDifference / oneRoundFunds) * 100;

  const referralMonthlyPotential = monthlyReferralPotential(
    referralPlan.people,
    referralPlan.campaigns,
    referralPlan.level,
  );
  const currentRoundNetSurplus =
    (starting.earnings - starting.campaign) *
    startingCampaigns *
    withdrawalRate *
    householdAccounts;
  const currentRoundInterval = journeyMode === "continuity" ? clickDays : cycleDays;
  const currentCampaignMonthlyPotential =
    (currentRoundNetSurplus * 30) / currentRoundInterval;
  const currentReferralMonthlyPotential =
    referralMonthlyPotential * householdAccounts;

  const levelSeven = getLevel(7);
  const levelSevenCampaignMonthlyPotential =
    ((levelSeven.earnings - levelSeven.campaign) *
      3 *
      30 *
      withdrawalRate) /
    cycleDays;
  const goalCampaignMonthlyPotential =
    levelSevenCampaignMonthlyPotential * householdAccounts;
  const goalReferralMonthlyPotential =
    referralMonthlyPotential * householdAccounts;
  const goalCombinedMonthlyPotential =
    goalCampaignMonthlyPotential + goalReferralMonthlyPotential;

  const monthsSaved =
    baselinePath.goalDay >= 0 && selectedPath.goalDay >= 0
      ? Math.max(
          0,
          Math.round((baselinePath.goalDay - selectedPath.goalDay) / 30),
        )
      : 0;

  const cashPath = useMemo(
    () =>
      simulateCashPath(
        {
          startingLevel,
          startingCampaigns,
          people: referralPlan.people,
          referralLevel: referralPlan.level,
          referralCampaigns: referralPlan.campaigns,
        },
        journeyMode === "continuity" ? clickDays : cycleDays,
      ),
    [
      startingLevel,
      startingCampaigns,
      referralPlan.people,
      referralPlan.level,
      referralPlan.campaigns,
      journeyMode,
    ],
  );

  const cashAtDay = (day: number) => {
    if (day < 0) return 0;
    const index = Math.min(day, maximumProjectionDays);
    const perAccount =
      journeyMode === "compound"
        ? selectedPath.cashAvailableByDay[index]
        : cashPath.cashAvailableByDay[index];
    return perAccount * householdAccounts;
  };

  const campaignValueAtDay = (day: number) => {
    const index = Math.min(Math.max(day, 0), maximumProjectionDays);
    const perAccount =
      journeyMode === "compound"
        ? selectedPath.campaignValueByDay[index]
        : cashPath.campaignValueByDay[index];
    return perAccount * householdAccounts;
  };

  let breakEvenDay = -1;
  for (let day = 1; day <= maximumProjectionDays; day += 1) {
    if (cashAtDay(day) + 0.0001 >= selectedStartingFunds) {
      breakEvenDay = day;
      break;
    }
  }

  const horizons: HorizonResult[] = horizonDays.map(({ months, days }) => {
    const cashAvailable = cashAtDay(days);
    return {
      months,
      cashAvailable,
      activeCampaignValue: campaignValueAtDay(days),
      recoveredPercent: (cashAvailable / selectedStartingFunds) * 100,
      differencePercent:
        ((cashAvailable - selectedStartingFunds) / selectedStartingFunds) * 100,
    };
  });

  const selectedMonthlyPotential =
    journeyMode === "compound"
      ? goalCombinedMonthlyPotential
      : currentCampaignMonthlyPotential + currentReferralMonthlyPotential;
  const householdGoalCampaigns = householdAccounts * 3;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
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
  }, [isOpen]);

  return (
    <div className="calculator-launch" id="calculator">
      <button
        ref={triggerRef}
        type="button"
        className="calculator-launch-button"
        onClick={() => setIsOpen(true)}
      >
        Explore your campaign path <span aria-hidden="true">↗</span>
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
            className={`calculator-modal planner-modal journey-modal journey-mode-${journeyMode}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calculator-title"
          >
            <button
              ref={closeRef}
              type="button"
              className="calculator-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close campaign path calculator"
            >
              ×
            </button>

            <p className="eyebrow">Your campaign journey</p>
            <h2 id="calculator-title">
              Start where you are. See where it could lead.
            </h2>

            <div className="planner-section journey-step-start">
              <div className="planner-section-heading journey-heading-split">
                <span>01</span>
                <div>
                  <strong>Choose your starting point</strong>
                </div>
                <b className="journey-reassurance">✓ Every starting point counts</b>
              </div>

              <div className="level-path-start-grid">
                <label className="planner-field">
                  <span>Starting campaign level</span>
                  <select
                    value={startingLevel}
                    onChange={(event) =>
                      setStartingLevel(Number(event.target.value))
                    }
                  >
                    {levels.map((item) => (
                      <option value={item.id} key={item.id}>
                        Level {item.id} · {item.campaign.toLocaleString()} USDT
                      </option>
                    ))}
                  </select>
                </label>

                <ChoiceButtons
                  label="Campaigns to start"
                  value={startingCampaigns}
                  options={[
                    { value: 1, label: "1 campaign" },
                    { value: 2, label: "2 campaigns" },
                    { value: 3, label: "3 campaigns" },
                  ]}
                  onChange={setStartingCampaigns}
                />
              </div>

              <div className="first-step-preview">
                <div>
                  <span>Your starting amount</span>
                  <strong>{money.format(oneRoundFunds)} USDT</strong>
                  <small>
                    {startingCampaigns === 1
                      ? "One campaign round plus level activation"
                      : "Campaigns funded up front and started one week apart"}
                  </small>
                </div>
                <i aria-hidden="true">→</i>
                <div>
                  <span>
                    {startingCampaigns === 1
                      ? "First value available"
                      : "First stagger total"}
                  </span>
                  <strong>{money.format(firstReleaseGross)} USDT</strong>
                  <small>
                    {startingCampaigns === 1
                      ? "Day 19 after activity and hold"
                      : `Released on days ${Array.from(
                          { length: startingCampaigns },
                          (_, index) => 19 + index * 7,
                        ).join(", ")}`}
                  </small>
                </div>
                <i aria-hidden="true">→</i>
                <div className="first-step-net">
                  <span>Net if withdrawn</span>
                  <strong>{money.format(firstReleaseNet)} USDT</strong>
                  <small>
                    {percent(firstRoundReturn)} versus the starting amount
                  </small>
                </div>
              </div>
            </div>

            <div className="planner-section journey-step-mode">
              <div className="planner-section-heading">
                <span>02</span>
                <div>
                  <strong>Choose your path</strong>
                </div>
              </div>

              <div className="journey-mode-cards">
                <button
                  type="button"
                  className={`journey-card-start ${journeyMode === "start" ? "is-selected" : ""}`}
                  aria-pressed={journeyMode === "start"}
                  onClick={() => setJourneyMode("start")}
                >
                  <JourneyIcon name="start" />
                  <span>Start here</span>
                  <strong>Start &amp; learn</strong>
                  <small>One round. Decide what comes next.</small>
                </button>
                <button
                  type="button"
                  className={`journey-card-compound ${journeyMode === "compound" ? "is-selected" : ""}`}
                  aria-pressed={journeyMode === "compound"}
                  onClick={() => setJourneyMode("compound")}
                >
                  <JourneyIcon name="growth" />
                  <span>Grow over time</span>
                  <strong>Build momentum</strong>
                  <small>Compound toward three Level 7 campaigns.</small>
                </button>
                <button
                  type="button"
                  className={`journey-card-continuity ${journeyMode === "continuity" ? "is-selected" : ""}`}
                  aria-pressed={journeyMode === "continuity"}
                  onClick={() => setJourneyMode("continuity")}
                >
                  <JourneyIcon name="continuity" />
                  <span>Reduce downtime</span>
                  <strong>Maintain continuity</strong>
                  <small>Prepare two rounds to reduce downtime.</small>
                </button>
              </div>
            </div>

            <div className="planner-section journey-step-referral">
              <div className="planner-section-heading">
                <span>03</span>
                <div>
                  <strong>Optional referrals</strong>
                </div>
              </div>

              <div className="referral-mode-cards">
                <button
                  type="button"
                  className={referralMode === "none" ? "is-selected" : ""}
                  aria-pressed={referralMode === "none"}
                  onClick={() => setReferralMode("none")}
                >
                  <JourneyIcon name="person" />
                  <span>Campaign only</span>
                  <strong>No referrals</strong>
                  <small>Campaigns only</small>
                </button>
                <button
                  type="button"
                  className={referralMode === "refer3" ? "is-selected" : ""}
                  aria-pressed={referralMode === "refer3"}
                  onClick={() => setReferralMode("refer3")}
                >
                  <JourneyIcon name="people" />
                  <span>Illustrative example</span>
                  <strong>Refer 3</strong>
                  <small>Level 3 · 3 staggered each</small>
                </button>
                <button
                  type="button"
                  className={referralMode === "custom" ? "is-selected" : ""}
                  aria-pressed={referralMode === "custom"}
                  onClick={() => setReferralMode("custom")}
                >
                  <JourneyIcon name="sliders" />
                  <span>Build your own</span>
                  <strong>Custom</strong>
                  <small>Choose your assumptions</small>
                </button>
              </div>

              {referralMode === "custom" && (
                <div className="planner-referral-grid custom-referral-fields">
                  <label className="planner-field">
                    <span>People you personally refer</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      inputMode="numeric"
                      value={customPeopleInput}
                      onFocus={(event) => event.currentTarget.select()}
                      onBlur={() => {
                        if (customPeopleInput === "") setCustomPeopleInput("0");
                      }}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        if (nextValue === "") {
                          setCustomPeopleInput("");
                          return;
                        }
                        const withoutLeadingZeros = nextValue.replace(
                          /^0+(?=\d)/,
                          "",
                        );
                        const clamped = Math.min(
                          100,
                          Math.max(0, Number(withoutLeadingZeros) || 0),
                        );
                        setCustomPeopleInput(String(clamped));
                      }}
                    />
                  </label>

                  <label className="planner-field">
                    <span>Typical referral level</span>
                    <select
                      value={customReferralLevel}
                      onChange={(event) =>
                        setCustomReferralLevel(Number(event.target.value))
                      }
                    >
                      {levels.map((item) => (
                        <option value={item.id} key={item.id}>
                          Level {item.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <ChoiceButtons
                    label="Their campaigns"
                    value={customReferralCampaigns}
                    options={[
                      { value: 1, label: "1 campaign" },
                      { value: 3, label: "3 staggered" },
                    ]}
                    onChange={setCustomReferralCampaigns}
                  />
                </div>
              )}
            </div>

            <details className="household-options">
              <summary>
                <span>
                  Household view
                  <small>Apply this same path to more than one household account</small>
                </span>
                <i aria-hidden="true">+</i>
              </summary>
              <div>
                <ChoiceButtons
                  label="Household accounts"
                  value={householdAccounts}
                  options={[
                    { value: 1, label: "1 account" },
                    { value: 2, label: "2 accounts" },
                    { value: 3, label: "3 accounts" },
                  ]}
                  onChange={setHouseholdAccounts}
                />
                <p>
                  The household view applies the same starting plan and referral
                  profile to each selected account. Official household account
                  rules still apply.
                </p>
              </div>
            </details>

            <div className="level-path-result journey-result" aria-live="polite">
              <div className="goal-time-result">
                <span>Estimated cash break-even on this path</span>
                <strong>{timeLabel(breakEvenDay)}</strong>
                <p>
                  Cumulative illustrated net cash available equals the selected
                  starting funds while campaigns remain active.
                </p>
              </div>

              <div className="journey-funding-metrics">
                <div className="journey-funding-start">
                  <span>Start with</span>
                  <strong>{money.format(oneRoundFunds)} USDT</strong>
                  <small>Any selected starting point is valid</small>
                </div>
                {journeyMode === "continuity" ? (
                  <div className="journey-funding-reserve">
                    <span>Continuity reserve</span>
                    <strong>{money.format(continuityReserve)} USDT</strong>
                    <small>One additional round held ready</small>
                  </div>
                ) : journeyMode === "compound" ? (
                  <div className="journey-funding-growth">
                    <span>Level 7 destination</span>
                    <strong>{householdGoalCampaigns} campaigns</strong>
                    <small>Three per household account</small>
                  </div>
                ) : (
                  <div className="journey-funding-growth">
                    <span>Optional future target</span>
                    <strong>{money.format(readyToRollFunds)} USDT</strong>
                    <small>Build toward two-round continuity later</small>
                  </div>
                )}
                <div className="journey-funding-total">
                  <span>
                    {journeyMode === "continuity"
                      ? "Ready-to-roll total"
                      : journeyMode === "compound"
                        ? "Goal timing"
                        : "First release"}
                  </span>
                  <strong>
                    {journeyMode === "continuity"
                      ? `${money.format(readyToRollFunds)} USDT`
                      : journeyMode === "compound"
                        ? timeLabel(selectedPath.goalDay)
                        : "About 19 days"}
                  </strong>
                  <small>
                    {journeyMode === "continuity"
                      ? "Two rounds plus one-time activation"
                      : journeyMode === "compound"
                        ? selectedPath.goalDay === 0
                          ? "Three Level 7 campaigns selected at the start"
                          : referralPlan.people === 0
                            ? "Campaign activity only"
                            : `${monthsSaved} ${monthsSaved === 1 ? "month" : "months"} sooner with selected referrals`
                        : "Then choose to withdraw, restart, or grow"}
                  </small>
                </div>
              </div>

              <div className="goal-monthly-heading">
                <span>
                  {journeyMode === "compound" ? "At the Level 7 goal" : "On this selected rhythm"}
                </span>
                <strong>Illustrative ongoing monthly potential</strong>
              </div>

              <div className="goal-monthly-metrics">
                <div className="campaign-potential">
                  <span>Campaigns</span>
                  <strong>
                    {money.format(
                      journeyMode === "compound"
                        ? goalCampaignMonthlyPotential
                        : currentCampaignMonthlyPotential,
                    )} USDT
                  </strong>
                  <small>30-day average after replacement and withdrawal fee</small>
                </div>
                <b aria-hidden="true">+</b>
                <div className="referral-potential">
                  <span>Direct referrals</span>
                  <strong>
                    {money.format(
                      journeyMode === "compound"
                        ? goalReferralMonthlyPotential
                        : currentReferralMonthlyPotential,
                    )} USDT
                  </strong>
                  <small>
                    {referralPlan.people === 0
                      ? "No referrals included"
                      : `${referralPlan.people} people · ${referralPlan.campaigns} ${referralPlan.campaigns === 1 ? "campaign" : "campaigns"} each`}
                  </small>
                </div>
                <b aria-hidden="true">=</b>
                <div className="combined-potential">
                  <span>Combined</span>
                  <strong>{money.format(selectedMonthlyPotential)} USDT</strong>
                  <small>Illustrative 30-day cash-availability pace</small>
                </div>
              </div>

              <div className="journey-storyline">
                {journeyMode === "compound" ? (
                  <>
                    <div className="story-campaign">
                      <i aria-hidden="true"><JourneyIcon name="start" /></i>
                      <span>{milestoneLabel(selectedPath.threeCampaignsDay)}</span>
                      <strong>Three campaigns running</strong>
                    </div>
                    <div className="story-growth">
                      <i aria-hidden="true"><JourneyIcon name="growth" /></i>
                      <span>{milestoneLabel(selectedPath.firstLevelSevenDay)}</span>
                      <strong>First Level 7 campaign</strong>
                    </div>
                    <div className="story-growth">
                      <i aria-hidden="true"><JourneyIcon name="continuity" /></i>
                      <span>{milestoneLabel(selectedPath.goalDay)}</span>
                      <strong>Three Level 7 campaigns</strong>
                    </div>
                    <div className="story-recovered">
                      <i aria-hidden="true"><JourneyIcon name="recovered" /></i>
                      <span>{timeLabel(breakEvenDay)}</span>
                      <strong>Starting funds recovered</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="story-campaign">
                      <i aria-hidden="true"><JourneyIcon name="start" /></i>
                      <span>Day 1</span>
                      <strong>{startingCampaigns} campaign{startingCampaigns === 1 ? "" : "s"} begin</strong>
                    </div>
                    <div className={journeyMode === "continuity" ? "story-reserve" : "story-activity"}>
                      <i aria-hidden="true">
                        <JourneyIcon name={journeyMode === "continuity" ? "continuity" : "clock"} />
                      </i>
                      <span>Day 12</span>
                      <strong>
                        {journeyMode === "continuity"
                          ? "Reserve can start the next round"
                          : "Campaign activity completes"}
                      </strong>
                    </div>
                    <div className="story-release">
                      <i aria-hidden="true"><JourneyIcon name="wallet" /></i>
                      <span>Day 19</span>
                      <strong>First value becomes available</strong>
                    </div>
                    <div className="story-recovered">
                      <i aria-hidden="true"><JourneyIcon name="recovered" /></i>
                      <span>{timeLabel(breakEvenDay)}</span>
                      <strong>Starting funds recovered</strong>
                    </div>
                  </>
                )}
              </div>

              <div className="return-story">
                <div className="return-story-heading">
                  <div>
                    <span>See the numbers behind your journey</span>
                    <strong>3-, 6-, and 12-month cash view</strong>
                  </div>
                  <p>
                    Campaign value stays separate and is not counted as cash recovered.
                  </p>
                </div>
                <div className="return-horizons">
                  {horizons.map((horizon) => (
                    <div className={`return-horizon return-horizon-${horizon.months}`} key={horizon.months}>
                      <span>{horizon.months} months</span>
                      <strong>{money.format(horizon.cashAvailable)} USDT</strong>
                      <small>illustrative net cash available</small>
                      <dl>
                        <div>
                          <dt>Starting funds recovered</dt>
                          <dd>{Math.round(horizon.recoveredPercent)}%</dd>
                        </div>
                        <div>
                          <dt>Cash vs. starting funds</dt>
                          <dd className={horizon.differencePercent >= 0 ? "is-positive" : "is-negative"}>
                            {percent(horizon.differencePercent)}
                          </dd>
                        </div>
                        <div>
                          <dt>Active campaign value</dt>
                          <dd>{money.format(horizon.activeCampaignValue)} USDT</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <details className="planner-assumptions">
              <summary>
                How this illustration is calculated <i aria-hidden="true">+</i>
              </summary>
              <div>
                <p>
                  The model uses published campaign costs and earnings, a
                  12-day activity period plus a 7-day hold, one-time activation
                  fees, selected direct-referral commissions, and a 10%
                  withdrawal fee.
                </p>
                <p>
                  Cash vs. starting funds equals illustrated net cash available
                  minus selected starting funds, divided by those starting
                  funds. Active campaign value is shown separately and is not
                  counted as recovered cash.
                </p>
                <p>
                  Start &amp; learn assumes campaigns restart when value becomes
                  available. Maintain continuity assumes one additional round
                  is held ready so completed campaigns can be replaced during
                  the hold period. Multiple selected campaigns are modeled one
                  week apart.
                </p>
                <p>
                  Build momentum compounds available value, fills three
                  campaigns at the starting level, and upgrades only when the
                  ledger can also replace every campaign due that day. Once
                  three Level 7 campaigns are active, later release events are
                  shown as net cash after replacement and the withdrawal fee.
                </p>
                <p>
                  Referral commissions are modeled as immediately available.
                  The official minimum, one-withdrawal-per-week limit, manual
                  request, and processing time are not used to delay the cash
                  dates shown here.
                </p>
              </div>
            </details>

            <p className="calculator-modal-note">
              Illustrative strategy only—not guaranteed earnings, financial
              advice, or an investment projection. Campaign availability,
              member activity, program rules, fees, and timing can change.
              Funding source and financing costs are not modeled; borrowed
              funds create repayment obligations regardless of campaign
              performance. Review the{" "}
              <a
                href="https://clickbaitpays.me/questions.php"
                target="_blank"
                rel="noopener noreferrer"
              >
                current official rules
              </a>
              .
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
