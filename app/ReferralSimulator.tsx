"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Level = {
  id: number;
  campaign: number;
  activation: number;
  earnings: number;
  referralCommission: number;
};

type Projection = {
  months: number;
  initialCost: number;
  availableBalance: number;
  withdrawable: number;
  activeCampaignValue: number;
  monthlyWithdrawalPace: number;
  referralEarned: number;
  levelSevenCount: number;
  goalCampaigns: number;
  goalProgress: number;
  campaignMix: string;
};

type ProjectionInputs = {
  accounts: number;
  startingLevel: number;
  startingCampaigns: number;
  people: number;
  referralLevel: number;
  referralCampaigns: number;
  months: number;
};

type CampaignLane = {
  level: number;
  completesOn: number;
};

type AccountState = {
  wallet: number;
  campaigns: CampaignLane[];
  activatedLevels: Set<number>;
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

const timeframes = [3, 6, 12];
const cycleDays = 19;
const clickDays = 12;

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

function simulateProjection({
  accounts,
  startingLevel,
  startingCampaigns,
  people,
  referralLevel,
  referralCampaigns,
  months,
}: ProjectionInputs): Projection {
  const starting = getLevel(startingLevel);
  const days = months * 30;
  const accountStates: AccountState[] = Array.from(
    { length: accounts },
    () => ({
      wallet: 0,
      campaigns: Array.from({ length: startingCampaigns }, (_, index) => ({
        level: startingLevel,
        completesOn: cycleDays + index * 7,
      })),
      activatedLevels: new Set([startingLevel]),
    }),
  );

  const initialCost =
    accounts *
    (starting.campaign * startingCampaigns + starting.activation);
  let referralEarned = 0;

  for (let day = 1; day <= days; day += 1) {
    const dailyReferralCommission = referralCommissionForDay(
      day,
      people,
      referralLevel,
      referralCampaigns,
    );
    referralEarned += dailyReferralCommission;
    accountStates[0].wallet += dailyReferralCommission;

    for (const account of accountStates) {
      const campaignCountBeforeCompletion = account.campaigns.length;
      const completing = account.campaigns.filter(
        (campaign) => campaign.completesOn === day,
      );

      if (completing.length > 0) {
        account.campaigns = account.campaigns.filter(
          (campaign) => campaign.completesOn !== day,
        );

        for (const campaign of completing) {
          account.wallet += getLevel(campaign.level).earnings;
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
              (account.activatedLevels.has(upgrade.id)
                ? 0
                : upgrade.activation);

            if (account.wallet + 0.0001 >= upgradeCost) {
              nextLevel = upgrade.id;
            }
          }

          const next = getLevel(nextLevel);
          const purchaseCost =
            next.campaign +
            (account.activatedLevels.has(nextLevel) ? 0 : next.activation);

          account.wallet -= purchaseCost;
          account.activatedLevels.add(nextLevel);
          account.campaigns.push({
            level: nextLevel,
            completesOn: day + cycleDays,
          });
        }
      }

      while (account.campaigns.length < 3) {
        const fillCost = starting.campaign;
        if (account.wallet + 0.0001 < fillCost) break;

        account.wallet -= fillCost;
        account.campaigns.push({
          level: startingLevel,
          completesOn: day + cycleDays,
        });
      }
    }
  }

  const allCampaigns = accountStates.flatMap((account) => account.campaigns);
  const availableBalance = accountStates.reduce(
    (total, account) => total + Math.max(0, account.wallet),
    0,
  );
  const activeCampaignValue = allCampaigns.reduce(
    (total, campaign) => total + getLevel(campaign.level).campaign,
    0,
  );
  const levelSevenCount = allCampaigns.filter(
    (campaign) => campaign.level === 7,
  ).length;
  const goalCampaigns = accounts * 3;
  const goalProgress = Math.min(
    100,
    (allCampaigns.reduce(
      (total, campaign) => total + campaign.level,
      0,
    ) /
      (goalCampaigns * 7)) *
      100,
  );

  const campaignMonthlySurplus = allCampaigns.reduce((total, campaign) => {
    const level = getLevel(campaign.level);
    return (
      total + ((level.earnings - level.campaign) * 30) / cycleDays
    );
  }, 0);
  const referralMonthlyAverage =
    people *
    referralCampaigns *
    getLevel(referralLevel).referralCommission *
    (30 / cycleDays);
  const monthlyWithdrawalPace =
    (campaignMonthlySurplus + referralMonthlyAverage) * 0.9;

  const mix = new Map<number, number>();
  for (const campaign of allCampaigns) {
    mix.set(campaign.level, (mix.get(campaign.level) ?? 0) + 1);
  }
  const campaignMix =
    Array.from(mix.entries())
      .sort(([levelA], [levelB]) => levelB - levelA)
      .map(([level, count]) => `${count}× Level ${level}`)
      .join(" · ") || "No active campaigns";

  return {
    months,
    initialCost,
    availableBalance,
    withdrawable: availableBalance * 0.9,
    activeCampaignValue,
    monthlyWithdrawalPace,
    referralEarned,
    levelSevenCount,
    goalCampaigns,
    goalProgress,
    campaignMix,
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

export default function ReferralSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [peopleInput, setPeopleInput] = useState("0");
  const [accounts, setAccounts] = useState(1);
  const [startingLevel, setStartingLevel] = useState(3);
  const [startingCampaigns, setStartingCampaigns] = useState(1);
  const [referralLevel, setReferralLevel] = useState(3);
  const [referralCampaigns, setReferralCampaigns] = useState(3);
  const [months, setMonths] = useState(3);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const people = Math.min(100, Math.max(0, Number(peopleInput) || 0));

  const projections = useMemo(
    () =>
      timeframes.map((timeframe) =>
        simulateProjection({
          accounts,
          startingLevel,
          startingCampaigns,
          people,
          referralLevel,
          referralCampaigns,
          months: timeframe,
        }),
      ),
    [
      accounts,
      startingLevel,
      startingCampaigns,
      people,
      referralLevel,
      referralCampaigns,
    ],
  );

  const projection =
    projections.find((item) => item.months === months) ?? projections[0];
  const goalProgress = projection.goalProgress;

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
        Calculate earning potential <span aria-hidden="true">↗</span>
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
              aria-label="Close earnings strategy calculator"
            >
              ×
            </button>

            <p className="eyebrow">Illustrative earnings strategy calculator</p>
            <h2 id="calculator-title">
              Build toward three Level 7 campaigns per household account.
            </h2>
            <p className="calculator-modal-intro">
              Start with your campaign plan, add referrals only if you want to,
              and see how reinvesting available value could change the path.
            </p>

            <div className="planner-no-referrals">
              <strong>✓ No referrals required</strong>
              <span>
                Your campaigns build the foundation. Direct referrals are an
                optional accelerator.
              </span>
            </div>

            <div className="planner-section">
              <div className="planner-section-heading">
                <span>01</span>
                <div>
                  <strong>Your starting point</strong>
                  <small>
                    Each account follows the same starting campaign plan.
                  </small>
                </div>
              </div>

              <div className="planner-start-grid">
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
                  label="Household accounts"
                  value={accounts}
                  options={[
                    { value: 1, label: "1" },
                    { value: 2, label: "2" },
                    { value: 3, label: "3" },
                  ]}
                  onChange={setAccounts}
                />

                <ChoiceButtons
                  label="Campaigns to start per account"
                  value={startingCampaigns}
                  options={[
                    { value: 1, label: "1" },
                    { value: 2, label: "2" },
                    { value: 3, label: "3" },
                  ]}
                  onChange={setStartingCampaigns}
                />
              </div>

              <p className="planner-start-cost">
                Estimated starting campaign purchase:{" "}
                <strong>{money.format(projection.initialCost)} USDT</strong>
                <span>Includes the starting level’s one-time activation fee.</span>
              </p>
            </div>

            <div className="planner-section">
              <div className="planner-section-heading">
                <span>02</span>
                <div>
                  <strong>Optional direct referrals</strong>
                  <small>
                    Modeled once through the primary account—not multiplied by
                    household accounts.
                  </small>
                </div>
              </div>

              <div className="planner-referral-grid">
                <label className="planner-field">
                  <span>People you personally refer</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    inputMode="numeric"
                    value={peopleInput}
                    onFocus={(event) => event.currentTarget.select()}
                    onBlur={() => {
                      if (peopleInput === "") setPeopleInput("0");
                    }}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === "") {
                        setPeopleInput("");
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
                      setPeopleInput(String(clamped));
                    }}
                  />
                </label>

                <label className="planner-field">
                  <span>Typical referral level</span>
                  <select
                    value={referralLevel}
                    onChange={(event) =>
                      setReferralLevel(Number(event.target.value))
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
                  value={referralCampaigns}
                  options={[
                    { value: 1, label: "1 campaign" },
                    { value: 3, label: "3 staggered" },
                  ]}
                  onChange={setReferralCampaigns}
                />
              </div>
            </div>

            <div className="planner-section planner-timeframe-section">
              <div className="planner-section-heading">
                <span>03</span>
                <div>
                  <strong>Choose a timeframe</strong>
                  <small>
                    Compare the balance left after continuously compounding.
                  </small>
                </div>
              </div>

              <div className="planner-timeframes">
                {projections.map((item) => (
                  <button
                    type="button"
                    key={item.months}
                    className={months === item.months ? "is-selected" : ""}
                    aria-pressed={months === item.months}
                    onClick={() => setMonths(item.months)}
                  >
                    <span>{item.months} months</span>
                    <strong>{money.format(item.withdrawable)} USDT</strong>
                    <small>potential withdrawal</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="planner-result" aria-live="polite">
              <div className="planner-result-main">
                <span>Potential withdrawal after {months} months</span>
                <strong>
                  {money.format(projection.withdrawable)}{" "}
                  <small>USDT</small>
                </strong>
                <p>
                  Available balance after the current 10% withdrawal fee, while
                  the campaigns shown below remain active.
                </p>
              </div>

              <div className="planner-result-metrics">
                <div>
                  <span>Active campaign value</span>
                  <strong>
                    {money.format(projection.activeCampaignValue)} USDT
                  </strong>
                  <small>Still working in campaigns</small>
                </div>
                <div>
                  <span>Ongoing monthly net</span>
                  <strong>
                    {money.format(projection.monthlyWithdrawalPace)} USDT
                  </strong>
                  <small>At the ending campaign mix</small>
                </div>
                <div>
                  <span>Referral commissions added</span>
                  <strong>{money.format(projection.referralEarned)} USDT</strong>
                  <small>
                    {people === 0 ? "No referrals included" : "Used to accelerate growth"}
                  </small>
                </div>
              </div>

              <div className="planner-goal">
                <div className="planner-goal-heading">
                  <div>
                    <span>Level 7 goal</span>
                    <strong>
                      {projection.levelSevenCount} of {projection.goalCampaigns}{" "}
                      campaigns
                    </strong>
                  </div>
                  <b>{Math.round(goalProgress)}%</b>
                </div>
                <div className="planner-progress" aria-hidden="true">
                  <i style={{ width: `${goalProgress}%` }} />
                </div>
                <p>{projection.campaignMix}</p>
              </div>
            </div>

            <details className="planner-assumptions">
              <summary>
                How this illustration is calculated <i aria-hidden="true">+</i>
              </summary>
              <div>
                <p>
                  The model first fills each selected household account to
                  three campaigns at the starting level. It then replaces
                  completed campaigns and upgrades one campaign at a time when
                  the available balance can cover the next level and any
                  one-time activation fee.
                </p>
                <p>
                  It uses a 12-day activity period plus a 7-day hold, published
                  campaign costs and earnings, direct-referral commissions, and
                  a 10% withdrawal fee. A month is modeled as 30 days.
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
