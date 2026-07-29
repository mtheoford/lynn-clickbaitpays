"use client";

import { useMemo, useState } from "react";

type Level = {
  id: number;
  campaign: number;
  commission: number;
};

const levels: Level[] = [
  { id: 1, campaign: 13, commission: 1.72 },
  { id: 2, campaign: 77, commission: 11.3 },
  { id: 3, campaign: 150, commission: 21.6 },
  { id: 4, campaign: 300, commission: 43.2 },
  { id: 5, campaign: 600, commission: 86.4 },
  { id: 6, campaign: 1200, commission: 172.8 },
  { id: 7, campaign: 2400, commission: 324 },
];

const initialPeople = [0, 0, 1, 2, 1, 1, 0];
const initialCampaigns = [1, 1, 1, 1, 1, 1, 1];

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ReferralSimulator() {
  const [people, setPeople] = useState(initialPeople);
  const [campaigns, setCampaigns] = useState(initialCampaigns);

  const totals = useMemo(() => {
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

  const monthlyEquivalent = totals.cycle * (30 / 19);

  function updatePeople(index: number, value: string) {
    const next = [...people];
    next[index] = Math.min(100, Math.max(0, Number(value) || 0));
    setPeople(next);
  }

  function updateCampaigns(index: number, value: string) {
    const next = [...campaigns];
    next[index] = Math.min(3, Math.max(1, Number(value) || 1));
    setCampaigns(next);
  }

  return (
    <div className="referral-simulator">
      <div className="simulator-heading">
        <div>
          <p className="eyebrow">Try the direct-referral model</p>
          <h3>What could your sponsor network produce?</h3>
          <p>
            Enter how many people you personally sponsor at each level and how
            many campaigns each person runs.
          </p>
        </div>
        <div className="commission-badge">
          <strong>10%</strong>
          <span>stated direct-referral commission</span>
        </div>
      </div>

      <div className="simulator-layout">
        <div className="simulator-table" role="group" aria-label="Referral assumptions by campaign level">
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
          <p>Your illustrative scenario</p>
          <div className="result-primary">
            <span>Per completed campaign round</span>
            <strong>{money.format(totals.cycle)} <small>USDT</small></strong>
          </div>
          <div className="result-monthly">
            <span>30-day equivalent*</span>
            <strong>{money.format(monthlyEquivalent)} USDT</strong>
          </div>
          <div className="result-stats">
            <span><b>{totals.people}</b> people sponsored</span>
            <span><b>{totals.campaigns}</b> active campaigns</span>
          </div>
          <div className="result-path">
            <span>You sponsor</span>
            <i aria-hidden="true">→</i>
            <span>They click</span>
            <i aria-hidden="true">→</i>
            <span>10% credits</span>
          </div>
          <small className="simulator-note">
            *Uses a 19-day campaign restart cadence and presenter-stated package
            examples. The official FAQ says referral commission is credited per
            eligible click. Results vary and are not guaranteed.
          </small>
        </aside>
      </div>
    </div>
  );
}
