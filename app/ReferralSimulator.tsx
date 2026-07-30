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

const levels: Level[] = [
  {
    id: 1,
    campaign: 13,
    activation: 1,
    earnings: 17.17,
    referralCommission: 1.908,
  },
  {
    id: 2,
    campaign: 77,
    activation: 7,
    earnings: 101.7,
    referralCommission: 11.3,
  },
  {
    id: 3,
    campaign: 150,
    activation: 15,
    earnings: 194.4,
    referralCommission: 21.6,
  },
  {
    id: 4,
    campaign: 300,
    activation: 30,
    earnings: 388.8,
    referralCommission: 43.2,
  },
  {
    id: 5,
    campaign: 600,
    activation: 60,
    earnings: 777.6,
    referralCommission: 86.4,
  },
  {
    id: 6,
    campaign: 1200,
    activation: 120,
    earnings: 1555.2,
    referralCommission: 172.8,
  },
  {
    id: 7,
    campaign: 2400,
    activation: 240,
    earnings: 3240,
    referralCommission: 360,
  },
];

const cycleDays = 19;
const clickDays = 12;
const maximumProjectionDays = 365 * 20;

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

          if (wallet + 0.0001 >= upgradeCost) {
            nextLevel = upgrade.id;
          }
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

function goalMonth(day: number) {
  if (day < 0) return -1;
  if (day === 0) return 0;
  return Math.ceil(day / 30);
}

function goalTimeLabel(day: number) {
  const months = goalMonth(day);
  if (months < 0) return "Beyond this model";
  if (months === 0) return "Goal reached";
  if (months === 1) return "About 1 month";
  return `About ${months} months`;
}

function milestoneLabel(day: number) {
  const months = goalMonth(day);
  if (months < 0) return "Not reached";
  if (months === 0) return "Starting point";
  return `Month ${months}`;
}

export default function ReferralSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [startingLevel, setStartingLevel] = useState(3);
  const [startingCampaigns, setStartingCampaigns] = useState(1);
  const [referralMode, setReferralMode] =
    useState<ReferralMode>("none");
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

  const baselineMonths = goalMonth(baselinePath.goalDay);
  const selectedMonths = goalMonth(selectedPath.goalDay);
  const monthsSaved =
    baselineMonths >= 0 && selectedMonths >= 0
      ? Math.max(0, baselineMonths - selectedMonths)
      : 0;
  const levelSeven = getLevel(7);
  const campaignMonthlyPotential =
    ((levelSeven.earnings - levelSeven.campaign) * 3 * 30 * 0.9) /
    cycleDays;
  const referralMonthlyPotential =
    (referralPlan.people *
      referralPlan.campaigns *
      getLevel(referralPlan.level).referralCommission *
      30 *
      0.9) /
    cycleDays;
  const householdCampaignPotential =
    campaignMonthlyPotential * householdAccounts;
  const householdReferralPotential =
    referralMonthlyPotential * householdAccounts;
  const combinedMonthlyPotential =
    householdCampaignPotential + householdReferralPotential;
  const householdGoalCampaigns = householdAccounts * 3;
  const startingCost =
    selectedPath.initialCost * householdAccounts;

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
        Calculate your Level 7 path <span aria-hidden="true">↗</span>
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
            className="calculator-modal planner-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calculator-title"
          >
            <button
              ref={closeRef}
              type="button"
              className="calculator-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Level 7 path calculator"
            >
              ×
            </button>

            <p className="eyebrow">Illustrative compounding path</p>
            <h2 id="calculator-title">
              How quickly could you reach three Level 7 campaigns?
            </h2>
            <p className="calculator-modal-intro">
              Choose where you begin. The calculator keeps three campaigns
              running, compounds available value, and upgrades one campaign at
              a time until the Level 7 goal is reached.
            </p>

            <div className="planner-no-referrals">
              <strong>✓ Referrals remain optional</strong>
              <span>
                Compare the campaign-only path with the additional speed and
                monthly potential direct referrals could add.
              </span>
            </div>

            <div className="planner-section">
              <div className="planner-section-heading">
                <span>01</span>
                <div>
                  <strong>Where are you starting?</strong>
                  <small>
                    We’ll estimate how long it could take to grow from your
                    starting point to three Level 7 campaigns.
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

              <p className="planner-start-cost">
                Estimated starting campaign purchase:{" "}
                <strong>{money.format(startingCost)} USDT</strong>
                <span>
                  Includes the starting level’s one-time activation fee
                  {householdAccounts > 1 ? " for each household account" : ""}.
                </span>
              </p>
            </div>

            <div className="planner-section">
              <div className="planner-section-heading">
                <span>02</span>
                <div>
                  <strong>Add a referral accelerator—or don’t</strong>
                  <small>
                    The Refer 3 example is ready to use; custom remains
                    available.
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
                  <span>Recommended example</span>
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
                        if (customPeopleInput === "") {
                          setCustomPeopleInput("0");
                        }
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
                  <small>
                    Apply this same plan to more than one household account
                  </small>
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
                  profile to each selected account. The combined goal becomes{" "}
                  {householdGoalCampaigns} Level 7 campaigns.
                </p>
              </div>
            </details>

            <div className="level-path-result" aria-live="polite">
              <div className="goal-time-result">
                <span>Estimated time to the Level 7 goal</span>
                <strong>{goalTimeLabel(selectedPath.goalDay)}</strong>
                <p>
                  Three Level 7 campaigns per account ·{" "}
                  {householdGoalCampaigns} campaigns in this view
                </p>
              </div>

              <div className="path-comparison">
                <div>
                  <span>Campaign-only path</span>
                  <strong>{goalTimeLabel(baselinePath.goalDay)}</strong>
                  <small>No referral commissions included</small>
                </div>
                <i aria-hidden="true">→</i>
                <div className="accelerated-path">
                  <span>Your selected path</span>
                  <strong>{goalTimeLabel(selectedPath.goalDay)}</strong>
                  <small>
                    {referralPlan.people === 0
                      ? "Campaign activity only"
                      : `${monthsSaved} ${monthsSaved === 1 ? "month" : "months"} sooner in this illustration`}
                  </small>
                </div>
              </div>

              <div className="goal-monthly-heading">
                <span>At the goal</span>
                <strong>Illustrative ongoing monthly potential</strong>
              </div>

              <div className="goal-monthly-metrics">
                <div>
                  <span>Campaigns</span>
                  <strong>
                    {money.format(householdCampaignPotential)} USDT
                  </strong>
                  <small>
                    After campaign replacement and withdrawal fee
                  </small>
                </div>
                <b aria-hidden="true">+</b>
                <div>
                  <span>Direct referrals</span>
                  <strong>
                    {money.format(householdReferralPotential)} USDT
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
                  <strong>{money.format(combinedMonthlyPotential)} USDT</strong>
                  <small>Illustrative monthly withdrawal pace</small>
                </div>
              </div>

              <div className="goal-timeline">
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
              </div>
            </div>

            <details className="planner-assumptions">
              <summary>
                How this illustration is calculated <i aria-hidden="true">+</i>
              </summary>
              <div>
                <p>
                  Available campaign value and selected direct-referral
                  commissions are continuously compounded. The model fills
                  three campaigns at the starting level, then upgrades one
                  campaign at a time while maintaining the other active
                  campaigns.
                </p>
                <p>
                  It uses a 12-day activity period plus a 7-day hold, published
                  campaign costs and earnings, one-time activation fees,
                  direct-referral commissions, and a 10% withdrawal fee.
                </p>
              </div>
            </details>

            <p className="calculator-modal-note">
              Illustrative strategy only—not guaranteed earnings or an
              investment projection. Campaign availability, member activity,
              program rules, fees, and timing can change. Household accounts
              remain subject to the{" "}
              <a
                href="https://clickbaitpays.me/questions.php"
                target="_blank"
                rel="noopener noreferrer"
              >
                official account rules
              </a>
              .
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
