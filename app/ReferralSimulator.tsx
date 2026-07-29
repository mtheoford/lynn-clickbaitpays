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

const initialPeople = [0, 0, 1, 2, 1, 1, 0];
const initialCampaigns = [0, 0, 1, 1, 1, 1, 0];

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ReferralSimulator() {
  const [ownLevel, setOwnLevel] = useState(3);
  const [ownCampaigns, setOwnCampaigns] = useState(1);
  const [people, setPeople] = useState(initialPeople);
  const [campaigns, setCampaigns] = useState(initialCampaigns);

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
    return levels.reduce(
      (result, level, index) => {
        const sponsored = people[index];
        const activeCampaigns = campaigns[index];
        const cycleCommission =
          sponsored * activeCampaigns * level.commission;

        result.people += sponsored;
        result.campaigns += sponsored * activeCampaigns;
        result.cycle += cycleCommission;
        return result;
      },
      { people: 0, campaigns: 0, cycle: 0 },
    );
  }, [people, campaigns]);

  const combinedCycle = own.surplus + referral.cycle;
  const monthlyEquivalent = combinedCycle * (30 / 19);

  function updatePeople(index: number, value: string) {
    const next = [...people];
    next[index] = Math.min(100, Math.max(0, Number(value) || 0));
    setPeople(next);
  }

  function updateCampaigns(index: number, value: string) {
    const next = [...campaigns];
    next[index] = Math.min(3, Math.max(0, Number(value) || 0));
    setCampaigns(next);
  }

  function resetCalculator() {
    setOwnLevel(0);
    setOwnCampaigns(0);
    setPeople(levels.map(() => 0));
    setCampaigns(levels.map(() => 0));
  }

  return (
    <div className="referral-simulator">
      <div className="simulator-heading">
        <div>
          <p className="eyebrow">Model both earning paths</p>
          <h3>Your activity + your direct referrals.</h3>
          <p>
            Build a simple illustration of what your campaigns could produce
            and what personally sponsored members could add.
          </p>
        </div>
        <div className="simulator-heading-actions">
          <div className="commission-badge">
            <strong>10%</strong>
            <span>stated direct-referral commission</span>
          </div>
          <button type="button" className="reset-calculator" onClick={resetCalculator}>
            Reset all to 0
          </button>
        </div>
      </div>

      <section className="own-account-model" aria-labelledby="own-account-heading">
        <div className="stream-label">
          <span>01</span>
          <div>
            <small>Your own account</small>
            <h4 id="own-account-heading">Choose your campaign activity</h4>
          </div>
        </div>
        <label>
          <span>Campaign level</span>
          <select
            value={ownLevel}
            onChange={(event) => setOwnLevel(Number(event.target.value))}
          >
            <option value="0">Choose a level</option>
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
            <option value="0">0 campaigns</option>
            <option value="1">1 campaign</option>
            <option value="2">2 campaigns</option>
            <option value="3">3 campaigns</option>
          </select>
        </label>
        <div className="own-math">
          <span>
            <small>Illustrative completion value</small>
            <strong>{money.format(own.completion)} USDT</strong>
          </span>
          <i aria-hidden="true">−</i>
          <span>
            <small>Reserve to restart</small>
            <strong>{money.format(own.reserve)} USDT</strong>
          </span>
          <i aria-hidden="true">=</i>
          <span className="own-surplus">
            <small>Potential surplus</small>
            <strong>{money.format(own.surplus)} USDT</strong>
          </span>
        </div>
      </section>

      <div className="downline-heading">
        <div className="stream-label">
          <span>02</span>
          <div>
            <small>Your direct referrals</small>
            <h4>Build your personally sponsored group</h4>
          </div>
        </div>
        <p>Enter people at each level and the campaigns each person runs.</p>
      </div>

      <div className="simulator-layout">
        <div
          className="simulator-table"
          role="group"
          aria-label="Direct-referral assumptions by campaign level"
        >
          <div className="simulator-row simulator-labels" aria-hidden="true">
            <span>Package</span>
            <span>People</span>
            <span>Campaigns each</span>
            <span>Illustrative commission</span>
          </div>
          {levels.map((level, index) => {
            const rowTotal =
              people[index] * campaigns[index] * level.commission;
            return (
              <div className="simulator-row" key={level.id}>
                <span className="level-cell">
                  <b>L{level.id}</b>
                  <small>{level.campaign.toLocaleString()} USDT</small>
                </span>
                <label>
                  <span className="mobile-field-label">People</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={people[index]}
                    onChange={(event) => updatePeople(index, event.target.value)}
                    aria-label={`People sponsored at Level ${level.id}`}
                  />
                </label>
                <label>
                  <span className="mobile-field-label">Campaigns each</span>
                  <select
                    value={campaigns[index]}
                    onChange={(event) =>
                      updateCampaigns(index, event.target.value)
                    }
                    aria-label={`Campaigns per person at Level ${level.id}`}
                  >
                    <option value="0">0 campaigns</option>
                    <option value="1">1 campaign</option>
                    <option value="2">2 campaigns</option>
                    <option value="3">3 campaigns</option>
                  </select>
                </label>
                <strong>{money.format(rowTotal)} USDT</strong>
              </div>
            );
          })}
        </div>

        <aside className="simulator-results" aria-live="polite">
          <p>Your combined illustration</p>
          <div className="income-breakdown">
            <span>
              <small>Your campaign surplus</small>
              <strong>{money.format(own.surplus)} USDT</strong>
            </span>
            <i aria-hidden="true">+</i>
            <span>
              <small>Direct-referral commissions</small>
              <strong>{money.format(referral.cycle)} USDT</strong>
            </span>
          </div>
          <div className="result-primary">
            <span>Potential total per completed round</span>
            <strong>
              {money.format(combinedCycle)} <small>USDT</small>
            </strong>
          </div>
          <div className="result-monthly">
            <span>30-day equivalent*</span>
            <strong>{money.format(monthlyEquivalent)} USDT</strong>
          </div>
          <div className="result-stats">
            <span><b>{ownCampaigns}</b> your campaigns</span>
            <span><b>{referral.people}</b> people sponsored</span>
            <span><b>{referral.campaigns}</b> referral campaigns</span>
          </div>
          <small className="simulator-note">
            *Uses an illustrative 19-day restart cadence and presenter-stated
            package examples. Your campaign surplus subtracts the cost of
            repurchasing the same campaigns, but not activation, withdrawal, or
            network fees. Referral commission is credited per eligible click
            according to the official FAQ. Results vary and are not guaranteed.
          </small>
        </aside>
      </div>
    </div>
  );
}
