"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Level = {
  id: number;
  campaign: number;
  activation: number;
  earnings: number;
  referralCommission: number;
};

type ReferralMode = "none" | "refer3" | "custom";
type JourneyMode = "start" | "compound" | "continuity";

type CampaignLane = {
  level: number;
  completesOn: number;
};

type PathResult = {
  initialCost: number;
  threeCampaignsDay: number;
  firstLevelSevenDay: number;
  goalDay: number;
};

type PathInputs = {
  startingLevel: number;
  startingCampaigns: number;
  people: number;
  referralLevel: number;
  referralCampaigns: number;
};

type HorizonResult = {
  months: number;
  withdrawals: number;
  recoveredPercent: number;
  roiPercent: number;
};

const levels: Level[] = [
  { id: 1, campaign: 13, activation: 1, earnings: 17.17, referralCommission: 1.908 },
  { id: 2, campaign: 77, activation: 7, earnings: 101.7, referralCommission: 11.3 },
  { id: 3, campaign: 150, activation: 15, earnings: 194.4, referralCommission: 21.6 },
  { id: 4, campaign: 300, activation: 30, earnings: 388.8, referralCommission: 43.2 },
  { id: 5, campaign: 600, activation: 60, earnings: 777.6, referralCommission: 86.4 },
  { id: 6, campaign: 1200, activation: 120, earnings: 1555.2, referralCommission: 172.8 },
  { id: 7, campaign: 2400, activation: 240, earnings: 3240, referralCommission: 360 },
];

const cycleDays = 19;
const clickDays = 12;
const withdrawalRate = 0.9;
const maximumProjectionDays = 365 * 20;
const horizonDays = [
  { months: 3, days: 90 },
  { months: 6, days: 180 },
  { months: 12, days: 365 },
];

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getLevel(level: number) {
  return levels.find((item) => item.id === level) ?? levels[0];
}

function referralCommissionForDay(
  day: number,
  people: number,
  level: number,
  campaignCount: number,
) {
  if (people === 0) return 0;

  const commissionPerCampaign = getLevel(level).referralCommission;
  let dailyCommission = 0;

  for (let campaign = 0; campaign < campaignCount; campaign += 1) {
    const startsOn = campaign * 7 + 1;
    if (day < startsOn) continue;

    const cycleDay = (day - startsOn) % cycleDays;
    if (cycleDay < clickDays) {
      dailyCommission += (commissionPerCampaign / clickDays) * people;
    }
  }

  return dailyCommission;
}

function referralCashThroughDay(
  day: number,
  people: number,
  level: number,
  campaignCount: number,
) {
  if (people === 0) return 0;

  let total = 0;
  for (let currentDay = 1; currentDay <= day; currentDay += 1) {
    total += referralCommissionForDay(
      currentDay,
      people,
      level,
      campaignCount,
    );
  }
  return total * withdrawalRate;
}

function simulatePath({
  startingLevel,
  startingCampaigns,
  people,
  referralLevel,
  referralCampaigns,
}: PathInputs): PathResult {
  const starting = getLevel(startingLevel);
  const campaigns: CampaignLane[] = Array.from(
    { length: startingCampaigns },
    (_, index) => ({
      level: startingLevel,
      completesOn: cycleDays + index * 7,
    }),
  );
  const activatedLevels = new Set([startingLevel]);
  let wallet = 0;
  let threeCampaignsDay = campaigns.length === 3 ? 0 : -1;
  let firstLevelSevenDay = campaigns.some((campaign) => campaign.level === 7)
    ? 0
    : -1;
  let goalDay =
    campaigns.length === 3 &&
    campaigns.every((campaign) => campaign.level === 7)
      ? 0
      : -1;

  for (let day = 1; day <= maximumProjectionDays; day += 1) {
    wallet += referralCommissionForDay(
      day,
      people,
      referralLevel,
      referralCampaigns,
    );

    const campaignCountBeforeCompletion = campaigns.length;
    const completing = campaigns.filter(
      (campaign) => campaign.completesOn === day,
    );

    if (completing.length > 0) {
      for (const campaign of completing) {
        const index = campaigns.indexOf(campaign);
        if (index >= 0) campaigns.splice(index, 1);
        wallet += getLevel(campaign.level).earnings;
      }

      for (const campaign of completing) {
        let nextLevel = campaign.level;

        if (
          campaignCountBeforeCompletion === 3 &&
          campaign.level < levels.length
        ) {
          const upgrade = getLevel(campaign.level + 1);
          const upgradeCost =
            upgrade.campaign +
            (activatedLevels.has(upgrade.id) ? 0 : upgrade.activation);

          if (wallet + 0.0001 >= upgradeCost) nextLevel = upgrade.id;
        }

        const next = getLevel(nextLevel);
        const purchaseCost =
          next.campaign +
          (activatedLevels.has(nextLevel) ? 0 : next.activation);

        wallet -= purchaseCost;
        activatedLevels.add(nextLevel);
        campaigns.push({
          level: nextLevel,
          completesOn: day + cycleDays,
        });
      }
    }

    while (campaigns.length < 3) {
      if (wallet + 0.0001 < starting.campaign) break;

      wallet -= starting.campaign;
      campaigns.push({
        level: startingLevel,
        completesOn: day + cycleDays,
      });
    }

    if (threeCampaignsDay < 0 && campaigns.length === 3) {
      threeCampaignsDay = day;
    }
    if (
      firstLevelSevenDay < 0 &&
      campaigns.some((campaign) => campaign.level === 7)
    ) {
      firstLevelSevenDay = day;
    }
    if (
      campaigns.length === 3 &&
      campaigns.every((campaign) => campaign.level === 7)
    ) {
      goalDay = day;
      break;
    }
  }

  return {
    initialCost:
      starting.campaign * startingCampaigns + starting.activation,
    threeCampaignsDay,
    firstLevelSevenDay,
    goalDay,
  };
}

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

function monthNumber(day: number) {
  if (day < 0) return -1;
  if (day === 0) return 0;
  return Math.ceil(day / 30);
}

function timeLabel(day: number) {
  if (day < 0) return "Beyond this model";
  if (day === 0) return "Starting point";
  if (day <= 45) return `About ${day} days`;
  const months = monthNumber(day);
  return `About ${months} ${months === 1 ? "month" : "months"}`;
}

function milestoneLabel(day: number) {
  const months = monthNumber(day);
  if (months < 0) return "Not reached";
  if (months === 0) return "Starting point";
  return `Month ${months}`;
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
      simulatePath({
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
      simulatePath({
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

  const referralMonthlyPotential =
    (referralPlan.people *
      referralPlan.campaigns *
      getLevel(referralPlan.level).referralCommission *
      30 *
      withdrawalRate) /
    cycleDays;
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

  const monthsSaved = Math.max(
    0,
    monthNumber(baselinePath.goalDay) - monthNumber(selectedPath.goalDay),
  );

  const cashPathWithdrawalAtDay = (day: number) => {
    const rounds =
      day < cycleDays
        ? 0
        : Math.floor((day - cycleDays) / currentRoundInterval) + 1;
    const ownCash = rounds * currentRoundNetSurplus;
    const referralCash =
      referralCashThroughDay(
        day,
        referralPlan.people,
        referralPlan.level,
        referralPlan.campaigns,
      ) * householdAccounts;
    return ownCash + referralCash;
  };

  const compoundWithdrawalStartDay =
    selectedPath.goalDay < 0 ? -1 : selectedPath.goalDay + cycleDays;
  const compoundWithdrawalAtDay = (day: number) => {
    if (compoundWithdrawalStartDay < 0 || day <= compoundWithdrawalStartDay) {
      return 0;
    }
    return (
      ((day - compoundWithdrawalStartDay) / 30) *
      goalCombinedMonthlyPotential
    );
  };

  const withdrawalAtDay =
    journeyMode === "compound"
      ? compoundWithdrawalAtDay
      : cashPathWithdrawalAtDay;

  let breakEvenDay = -1;
  for (let day = 1; day <= maximumProjectionDays; day += 1) {
    if (withdrawalAtDay(day) + 0.0001 >= selectedStartingFunds) {
      breakEvenDay = day;
      break;
    }
  }

  const horizons: HorizonResult[] = horizonDays.map(({ months, days }) => {
    const withdrawals = withdrawalAtDay(days);
    return {
      months,
      withdrawals,
      recoveredPercent: (withdrawals / selectedStartingFunds) * 100,
      roiPercent:
        ((withdrawals - selectedStartingFunds) / selectedStartingFunds) * 100,
    };
  });

  const selectedMonthlyPotential =
    journeyMode === "compound"
      ? goalCombinedMonthlyPotential
      : currentCampaignMonthlyPotential + currentReferralMonthlyPotential;
  const householdGoalCampaigns = householdAccounts * 3;
  const activeCampaignValue =
    journeyMode === "compound"
      ? levelSeven.campaign * householdGoalCampaigns
      : starting.campaign * startingCampaigns * householdAccounts;

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
            className="calculator-modal planner-modal journey-modal"
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
            <p className="calculator-modal-intro">
              One campaign at any level is a valid beginning. Choose a starting
              point, then compare ways to learn, grow, or build greater
              continuity over time.
            </p>

            <div className="planner-no-referrals journey-welcome">
              <strong>✓ Every starting point counts</strong>
              <span>
                Referrals and a two-round reserve remain optional. You can begin
                with one campaign, learn the process, and decide what comes next.
              </span>
            </div>

            <div className="planner-section">
              <div className="planner-section-heading">
                <span>01</span>
                <div>
                  <strong>Choose a starting point that fits you</strong>
                  <small>
                    Start at any level with one, two, or three campaigns.
                  </small>
                </div>
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
                  <small>One campaign round plus level activation</small>
                </div>
                <i aria-hidden="true">→</i>
                <div>
                  <span>First value available</span>
                  <strong>{money.format(firstReleaseGross)} USDT</strong>
                  <small>After the illustrated 12-day activity + 7-day hold</small>
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

            <div className="planner-section">
              <div className="planner-section-heading">
                <span>02</span>
                <div>
                  <strong>Choose the story you want to explore</strong>
                  <small>
                    There is no wrong-sized beginning. You can change paths as
                    your confidence and goals grow.
                  </small>
                </div>
              </div>

              <div className="journey-mode-cards">
                <button
                  type="button"
                  className={journeyMode === "start" ? "is-selected" : ""}
                  aria-pressed={journeyMode === "start"}
                  onClick={() => setJourneyMode("start")}
                >
                  <span>Start here</span>
                  <strong>Start &amp; learn</strong>
                  <small>
                    Fund one round, experience the process, then choose whether
                    to withdraw, restart, or grow.
                  </small>
                </button>
                <button
                  type="button"
                  className={journeyMode === "compound" ? "is-selected" : ""}
                  aria-pressed={journeyMode === "compound"}
                  onClick={() => setJourneyMode("compound")}
                >
                  <span>Grow over time</span>
                  <strong>Build momentum</strong>
                  <small>
                    Compound available value toward three Level 7 campaigns.
                    No additional reserve is assumed.
                  </small>
                </button>
                <button
                  type="button"
                  className={journeyMode === "continuity" ? "is-selected" : ""}
                  aria-pressed={journeyMode === "continuity"}
                  onClick={() => setJourneyMode("continuity")}
                >
                  <span>Reduce downtime</span>
                  <strong>Maintain continuity</strong>
                  <small>
                    Prepare two rounds so the next campaign can begin while the
                    prior value is in hold.
                  </small>
                </button>
              </div>

              <div className="journey-path-explainer" aria-live="polite">
                {journeyMode === "start" && (
                  <>
                    <strong>One round is enough to begin.</strong>
                    <p>
                      When value becomes available, you can withdraw it, use it
                      to restart the same campaign, or begin building toward a
                      larger plan.
                    </p>
                  </>
                )}
                {journeyMode === "compound" && (
                  <>
                    <strong>Let the starting point grow into the bigger vision.</strong>
                    <p>
                      This path keeps available value working, fills three
                      campaigns, and upgrades one campaign at a time until the
                      Level 7 goal is reached.
                    </p>
                  </>
                )}
                {journeyMode === "continuity" && (
                  <>
                    <strong>One round starts. The second helps maintain momentum.</strong>
                    <p>
                      The continuity reserve is not another active campaign. It
                      remains available to replace completed campaigns while
                      prior value finishes its hold.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="planner-section">
              <div className="planner-section-heading">
                <span>03</span>
                <div>
                  <strong>Add a referral accelerator—or don’t</strong>
                  <small>
                    Referrals are never required. Compare the independent path
                    with the additional pace direct referrals could add.
                  </small>
                </div>
              </div>

              <div className="referral-mode-cards">
                <button
                  type="button"
                  className={referralMode === "none" ? "is-selected" : ""}
                  aria-pressed={referralMode === "none"}
                  onClick={() => setReferralMode("none")}
                >
                  <span>Campaign only</span>
                  <strong>No referrals</strong>
                  <small>See the independent baseline</small>
                </button>
                <button
                  type="button"
                  className={referralMode === "refer3" ? "is-selected" : ""}
                  aria-pressed={referralMode === "refer3"}
                  onClick={() => setReferralMode("refer3")}
                >
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
                  <span>Build your own</span>
                  <strong>Custom</strong>
                  <small>Choose people, level, and activity</small>
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
                  Cash break-even means cumulative illustrated net withdrawals
                  equal the selected starting funds while campaigns remain in
                  the modeled rhythm.
                </p>
              </div>

              <div className="journey-funding-metrics">
                <div>
                  <span>Start with</span>
                  <strong>{money.format(oneRoundFunds)} USDT</strong>
                  <small>Any selected starting point is valid</small>
                </div>
                {journeyMode === "continuity" ? (
                  <div>
                    <span>Continuity reserve</span>
                    <strong>{money.format(continuityReserve)} USDT</strong>
                    <small>One additional round held ready</small>
                  </div>
                ) : journeyMode === "compound" ? (
                  <div>
                    <span>Level 7 destination</span>
                    <strong>{householdGoalCampaigns} campaigns</strong>
                    <small>Three per household account</small>
                  </div>
                ) : (
                  <div>
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
                        ? referralPlan.people === 0
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
                <div>
                  <span>Campaigns</span>
                  <strong>
                    {money.format(
                      journeyMode === "compound"
                        ? goalCampaignMonthlyPotential
                        : currentCampaignMonthlyPotential,
                    )} USDT
                  </strong>
                  <small>After campaign replacement and withdrawal fee</small>
                </div>
                <b aria-hidden="true">+</b>
                <div>
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
                  <small>Illustrative monthly withdrawal pace</small>
                </div>
              </div>

              <div className="journey-storyline">
                {journeyMode === "compound" ? (
                  <>
                    <div>
                      <i aria-hidden="true">1</i>
                      <span>{milestoneLabel(selectedPath.threeCampaignsDay)}</span>
                      <strong>Three campaigns running</strong>
                    </div>
                    <div>
                      <i aria-hidden="true">2</i>
                      <span>{milestoneLabel(selectedPath.firstLevelSevenDay)}</span>
                      <strong>First Level 7 campaign</strong>
                    </div>
                    <div>
                      <i aria-hidden="true">3</i>
                      <span>{milestoneLabel(selectedPath.goalDay)}</span>
                      <strong>Three Level 7 campaigns</strong>
                    </div>
                    <div>
                      <i aria-hidden="true">4</i>
                      <span>{timeLabel(breakEvenDay)}</span>
                      <strong>Starting funds recovered</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <i aria-hidden="true">1</i>
                      <span>Day 1</span>
                      <strong>{startingCampaigns} campaign{startingCampaigns === 1 ? "" : "s"} begin</strong>
                    </div>
                    <div>
                      <i aria-hidden="true">2</i>
                      <span>Day 12</span>
                      <strong>
                        {journeyMode === "continuity"
                          ? "Reserve can start the next round"
                          : "Campaign activity completes"}
                      </strong>
                    </div>
                    <div>
                      <i aria-hidden="true">3</i>
                      <span>Day 19</span>
                      <strong>First value becomes available</strong>
                    </div>
                    <div>
                      <i aria-hidden="true">4</i>
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
                    Active campaign value kept separate: {money.format(activeCampaignValue)} USDT.
                  </p>
                </div>
                <div className="return-horizons">
                  {horizons.map((horizon) => (
                    <div key={horizon.months}>
                      <span>{horizon.months} months</span>
                      <strong>{money.format(horizon.withdrawals)} USDT</strong>
                      <small>illustrative net withdrawals</small>
                      <dl>
                        <div>
                          <dt>Starting funds recovered</dt>
                          <dd>{Math.round(horizon.recoveredPercent)}%</dd>
                        </div>
                        <div>
                          <dt>Cash ROI</dt>
                          <dd className={horizon.roiPercent >= 0 ? "is-positive" : ""}>
                            {percent(horizon.roiPercent)}
                          </dd>
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
                  Cash ROI equals illustrated net withdrawals minus selected
                  starting funds, divided by those starting funds. Active
                  campaign value is shown separately and is not counted as cash
                  recovered.
                </p>
                <p>
                  Start &amp; learn assumes campaigns restart when value becomes
                  available. Maintain continuity assumes one additional round
                  is held ready so completed campaigns can be replaced during
                  the hold period.
                </p>
                <p>
                  Build momentum compounds available value, fills three
                  campaigns at the starting level, and upgrades one campaign at
                  a time until the Level 7 goal is reached.
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
