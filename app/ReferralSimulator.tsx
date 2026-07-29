"use client";

import { useMemo, useState } from "react";

type Level = {
  id: number;
  campaign: number;
  completion: number;
  commission: number;
};

const levels: Level[] = [
  { id: 1, campaign: 13, completion: 17.17, commission: 1.72 },
  { id: 2, campaign: 77, completion: 113, commission: 11.3 },
  { id: 3, campaign: 150, completion: 216, commission: 21.6 },
  { id: 4, campaign: 300, completion: 432, commission: 43.2 },
  { id: 5, campaign: 600, completion: 864, commission: 86.4 },
  { id: 6, campaign: 1200, completion: 1728, commission: 172.8 },
  { id: 7, campaign: 2400, completion: 3240, commission: 324 },
];

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ReferralSimulator() {
  const [ownLevel, setOwnLevel] = useState(3);
  const [ownCampaigns, setOwnCampaigns] = useState(1);
  const [referralPeople, setReferralPeople] = useState(0);
  const [referralLevel, setReferralLevel] = useState(3);
  const [referralCampaigns, setReferralCampaigns] = useState(1);

  const own = useMemo(() => {
    const selected = levels.find((level) => level.id === ownLevel);
    if (!selected || ownCampaigns === 0) {
      return { completion: 0, reserve: 0, surplus: 0 };
    }

    const completion = selected.completion * ownCampaigns;
    const reserve = selected.campaign * ownCampaigns;
    return { completion, reserve, surplus: completion - reserve };
  }, [ownLevel, ownCampaigns]);

  const referral = useMemo(() => {
    const selected = levels.find((level) => level.id === referralLevel);
    if (!selected || referralPeople === 0 || referralCampaigns === 0) {
      return 0;
    }
    return referralPeople * referralCampaigns * selected.commission;
  }, [referralPeople, referralLevel, referralCampaigns]);

  const combined = own.surplus + referral;

  function resetCalculator() {
    setOwnLevel(3);
    setOwnCampaigns(1);
    setReferralPeople(0);
    setReferralLevel(3);
    setReferralCampaigns(1);
  }

  return (
    <div className="referral-simulator simplified-simulator">
      <div className="simulator-heading simplified-heading">
        <div>
          <p className="eyebrow">A simpler way to model both paths</p>
          <h3>Start with your activity. Add referrals only if you want to.</h3>
          <p>
            See a campaign-only illustration first, then explore what personally
            sponsored members could add.
          </p>
        </div>
        <button
          type="button"
          className="calculator-reset-link"
          onClick={resetCalculator}
        >
          Reset example
        </button>
      </div>

      <div className="optional-path-callout">
        <strong><span aria-hidden="true">✓</span> No referrals required</strong>
        <p>
          Your own campaign activity can provide the foundation. Referrals are
          an optional accelerator that can add commission income and increase
          your potential pace—without being required to participate.
        </p>
      </div>

      <div className="simple-calculator-grid">
        <section className="simple-path-panel foundation-panel">
          <div className="simple-path-heading">
            <span>Foundation</span>
            <h4>Your campaign activity</h4>
          </div>

          <div className="simple-field-grid two-fields">
            <label>
              <span>Campaign level</span>
              <select
                value={ownLevel}
                onChange={(event) => setOwnLevel(Number(event.target.value))}
              >
                {levels.map((level) => (
                  <option value={level.id} key={level.id}>
                    Level {level.id} · {level.campaign.toLocaleString()} USDT
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Your campaigns</span>
              <select
                value={ownCampaigns}
                onChange={(event) => setOwnCampaigns(Number(event.target.value))}
              >
                <option value="1">1 campaign</option>
                <option value="2">2 campaigns</option>
                <option value="3">3 campaigns</option>
              </select>
            </label>
          </div>

          <div className="path-result">
            <span>Illustrative campaign surplus</span>
            <strong>{money.format(own.surplus)} <small>USDT</small></strong>
          </div>
        </section>

        <section className="simple-path-panel referral-panel">
          <div className="simple-path-heading">
            <span>Optional accelerator</span>
            <h4>Personally sponsored members</h4>
          </div>

          <div className="simple-field-grid three-fields">
            <label>
              <span>Members</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={referralPeople}
                onChange={(event) =>
                  setReferralPeople(
                    Math.min(100, Math.max(0, Number(event.target.value) || 0)),
                  )
                }
              />
            </label>
            <label>
              <span>Average level</span>
              <select
                value={referralLevel}
                onChange={(event) =>
                  setReferralLevel(Number(event.target.value))
                }
              >
                {levels.map((level) => (
                  <option value={level.id} key={level.id}>
                    Level {level.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Campaigns each</span>
              <select
                value={referralCampaigns}
                onChange={(event) =>
                  setReferralCampaigns(Number(event.target.value))
                }
              >
                <option value="1">1 campaign</option>
                <option value="2">2 campaigns</option>
                <option value="3">3 campaigns</option>
              </select>
            </label>
          </div>

          <div className="path-result">
            <span>Illustrative referral commissions</span>
            <strong>{money.format(referral)} <small>USDT</small></strong>
          </div>
        </section>
      </div>

      <aside className="simple-combined-result" aria-live="polite">
        <div>
          <span>Illustrative combined value per completed round</span>
          <strong>{money.format(combined)} <small>USDT</small></strong>
        </div>
        <div className="simple-result-breakdown">
          <span><b>{money.format(own.surplus)}</b> Your campaign</span>
          <i aria-hidden="true">+</i>
          <span><b>{money.format(referral)}</b> Optional referrals</span>
        </div>
      </aside>

      <details className="calculation-details">
        <summary>
          How this illustration is calculated <i aria-hidden="true">+</i>
        </summary>
        <p>
          Campaign surplus is the illustrated completion value minus the amount
          reserved to restart the same campaigns. Referral commission uses the
          stated 10% per eligible click for the average level selected. Examples
          exclude activation, withdrawal, and network fees. Program rules and
          results can change; earnings are not guaranteed.
        </p>
      </details>
    </div>
  );
}
