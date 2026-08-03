import assert from "node:assert/strict";
import test from "node:test";

import {
  getLevel,
  levels,
  monthlyReferralPotential,
  simulateCashPath,
  simulateCompoundPath,
  timeLabel,
} from "../app/calculatorMath.ts";

const noReferrals = {
  people: 0,
  referralLevel: 3,
  referralCampaigns: 1,
};

function near(actual: number, expected: number, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("uses the published Getting Started campaign table", () => {
  assert.deepEqual(
    levels.map(({ id, campaign, activation, earnings, referralCommission }) => [
      id,
      campaign,
      activation,
      earnings,
      referralCommission,
    ]),
    [
      [1, 13, 1, 17.17, 1.908],
      [2, 77, 7, 101.7, 11.3],
      [3, 150, 15, 194.4, 21.6],
      [4, 300, 30, 388.8, 43.2],
      [5, 600, 60, 777.6, 86.4],
      [6, 1200, 120, 1555.2, 172.8],
      [7, 2400, 240, 3240, 360],
    ],
  );
});

test("never spends more than the available compounding balance", () => {
  for (const startingLevel of levels.map((level) => level.id)) {
    for (const startingCampaigns of [1, 2, 3]) {
      for (const referralProfile of [
        noReferrals,
        { people: 3, referralLevel: 3, referralCampaigns: 3 },
        { people: 8, referralLevel: 6, referralCampaigns: 3 },
      ]) {
        const result = simulateCompoundPath(
          { startingLevel, startingCampaigns, ...referralProfile },
          730,
        );
        assert.ok(result.minimumWallet >= -0.0001);
        assert.ok(result.cashAvailableByDay.every((value) => value >= 0));
      }
    }
  }
});

test("keeps an already-complete Level 7 goal at the starting point", () => {
  const result = simulateCompoundPath(
    { startingLevel: 7, startingCampaigns: 3, ...noReferrals },
    365,
  );

  assert.equal(result.goalDay, 0);
  assert.equal(result.firstLevelSevenDay, 0);
  assert.equal(result.threeCampaignsDay, 0);
  near(result.cashAvailableByDay[90], 9072);
});

test("uses discrete staggered campaign releases for Start & learn", () => {
  const result = simulateCashPath(
    { startingLevel: 3, startingCampaigns: 1, ...noReferrals },
    19,
    365,
  );

  near(result.cashAvailableByDay[18], 0);
  near(result.cashAvailableByDay[19], 39.96);
  near(result.cashAvailableByDay[90], 159.84);
  near(result.cashAvailableByDay[180], 359.64);
  near(result.cashAvailableByDay[365], 759.24);
});

test("starts multiple selected campaigns one week apart", () => {
  const result = simulateCashPath(
    { startingLevel: 7, startingCampaigns: 3, ...noReferrals },
    19,
    90,
  );

  near(result.cashAvailableByDay[18], 0);
  near(result.cashAvailableByDay[19], 756);
  near(result.cashAvailableByDay[25], 756);
  near(result.cashAvailableByDay[26], 1512);
  near(result.cashAvailableByDay[32], 1512);
  near(result.cashAvailableByDay[33], 2268);
});

test("models the continuity reserve as 12-day replacement intervals", () => {
  const result = simulateCashPath(
    { startingLevel: 7, startingCampaigns: 3, ...noReferrals },
    12,
    90,
  );

  near(result.cashAvailableByDay[90], 12852);
});

test("direct-referral averages scale by people and staggered campaigns", () => {
  near(monthlyReferralPotential(5, 3, 4), 920.84);
  near(getLevel(4).referralCommission, 43.2);
});

test("formats starting, singular-day, and rounded-month milestones clearly", () => {
  assert.equal(timeLabel(0), "Starting point");
  assert.equal(timeLabel(1), "About 1 day");
  assert.equal(timeLabel(19), "About 19 days");
  assert.equal(timeLabel(91), "About 3 months");
});
