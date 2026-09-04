import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateFirstRoundOutcome,
  calculateLevelSevenCapacity,
  calculateOngoingProjection,
  calculateReferralCadenceEstimates,
  calculateStrategyFunding,
  getLevel,
  levels,
  monthlyReferralPotential,
  simulateAllStrategyPaths,
  simulateCashPath,
  simulateCompoundPath,
  simulateOptimizedCompoundPath,
  simulateStartingCampaignOptions,
  simulateStrategyPath,
  timeLabel,
  withdrawalRate,
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

test("compares withdrawal and retained value over the same first round", () => {
  const outcome = calculateFirstRoundOutcome({
    startingLevel: 3,
    startingCampaigns: 2,
    ...noReferrals,
  });

  near(outcome.initialCost, 315);
  near(outcome.campaignGross, 388.8);
  near(outcome.totalGross, 388.8);
  near(outcome.netIfWithdrawn, 349.92);
  near(outcome.profitIfWithdrawn, 34.92);
  near(outcome.withdrawalRoi, 11.0857);
  near(outcome.retainedProfit, 73.8);
  near(outcome.retainedRoi, 23.4286);
  assert.equal(outcome.fullyAvailableDay, 19);
});

test("calculates the three-Level-7 destination output", () => {
  const outcome = calculateLevelSevenCapacity();

  near(outcome.initialCost, 7440);
  near(outcome.campaignValue, 7200);
  near(outcome.grossPerRelease, 9720);
  near(outcome.replacementCost, 7200);
  near(outcome.grossSurplusPerRelease, 2520);
  near(outcome.netSurplusPerRelease, 2268);
  near(outcome.netSurplusRoiPerRelease, 31.5);
  near(outcome.netIfFullyWithdrawn, 8748);
  near(outcome.monthlyNetAtReleaseRhythm, 3581.0526);
  near(outcome.continuityReserve, 7200);
  near(outcome.monthlyNetAtContinuityRhythm, 5670);
});

test("projects the first 365 days of ongoing Level 7 and referral withdrawals", () => {
  const wait = calculateOngoingProjection({
    goalDay: 0,
    activeLevelSevenStartedOn: [0, 0, 0],
    continuationMode: "wait-for-release",
    people: 3,
    referralLevel: 3,
    referralCampaigns: 3,
  });
  const keepMoving = calculateOngoingProjection({
    goalDay: 0,
    activeLevelSevenStartedOn: [0, 0, 0],
    continuationMode: "keep-spots-moving",
    people: 3,
    referralLevel: 3,
    referralCampaigns: 3,
  });

  assert.equal(wait.convention, "first-365-days-after-goal");
  assert.equal(wait.projectionStartDay, 0);
  assert.equal(wait.projectionEndDay, 365);
  assert.equal(wait.campaignCadenceDays, 19);
  assert.equal(wait.referralCadence, "release-funded");
  assert.equal(wait.campaignValueKeptCycling, 7200);
  assert.equal(wait.additionalBridgeReserve, 0);
  assert.equal(wait.committedCampaignCapital, 7200);
  assert.equal(wait.campaignLaneReleaseCount, 57);
  assert.equal(wait.equivalentThreeCampaignSetReleases, 19);
  assert.equal(wait.referralReleaseCount, 19);
  near(wait.campaignGrossSurplus, 47880);
  near(wait.campaignNetWithdrawals, 43092);
  near(wait.campaignCashRoi, 598.5);
  near(wait.referralGrossCommissions, 3693.6);
  near(wait.referralNetWithdrawals, 3324.24);
  near(wait.combinedNetWithdrawals, 46416.24);
  near(wait.averageCampaignNetPerMonth, 3591);
  near(wait.averageReferralNetPerMonth, 277.02);
  near(wait.averageCombinedNetPerMonth, 3868.02);

  assert.equal(keepMoving.campaignCadenceDays, 12);
  assert.equal(keepMoving.referralCadence, "reserve-backed");
  assert.equal(keepMoving.additionalBridgeReserve, 7200);
  assert.equal(keepMoving.committedCampaignCapital, 14400);
  assert.equal(keepMoving.campaignLaneReleaseCount, 87);
  assert.equal(keepMoving.equivalentThreeCampaignSetReleases, 29);
  assert.equal(keepMoving.referralReleaseCount, 29);
  near(keepMoving.campaignGrossSurplus, 73080);
  near(keepMoving.campaignNetWithdrawals, 65772);
  near(keepMoving.campaignCashRoi, 456.75);
  near(keepMoving.referralGrossCommissions, 5637.6);
  near(keepMoving.referralNetWithdrawals, 5073.84);
  near(keepMoving.combinedNetWithdrawals, 70845.84);
  near(keepMoving.averageCampaignNetPerMonth, 5481);
  near(keepMoving.averageReferralNetPerMonth, 422.82);
  near(keepMoving.averageCombinedNetPerMonth, 5903.82);
});

test("counts staggered Level 7 lanes from their actual goal-day positions", () => {
  const path = simulateStartingCampaignOptions({
    startingLevel: 7,
    continuationMode: "keep-spots-moving",
    ...noReferrals,
  })[2];

  assert.equal(path.goalDay, 19);
  assert.deepEqual(
    path.steps.at(-1)?.activeCampaigns.map(
      (campaign) => campaign.startedOn,
    ),
    [12, 12, 19],
  );
  assert.equal(path.ongoingProjection.campaignLaneReleaseCount, 89);
  near(path.ongoingProjection.equivalentThreeCampaignSetReleases, 89 / 3);
  near(path.ongoingProjection.campaignNetWithdrawals, 67284);
  near(path.ongoingProjection.averageCampaignNetPerMonth, 5607);
});

test("calculates each strategy's scheduled outside funding", () => {
  assert.deepEqual(calculateStrategyFunding(3, "start-small"), {
    strategy: "start-small",
    startingCampaigns: 1,
    replacementCampaigns: 0,
    neededToday: 165,
    neededByDay12: 0,
    totalPlanned: 165,
  });
  assert.deepEqual(calculateStrategyFunding(3, "smooth-timing"), {
    strategy: "smooth-timing",
    startingCampaigns: 1,
    replacementCampaigns: 1,
    neededToday: 165,
    neededByDay12: 150,
    totalPlanned: 315,
  });
  assert.deepEqual(calculateStrategyFunding(3, "grow-fastest"), {
    strategy: "grow-fastest",
    startingCampaigns: 3,
    replacementCampaigns: 3,
    neededToday: 465,
    neededByDay12: 450,
    totalPlanned: 915,
  });
});

test("keeps the selected starting count independent from day-12 strategy funding", () => {
  assert.deepEqual(calculateStrategyFunding(3, "start-small", 2), {
    strategy: "start-small",
    startingCampaigns: 2,
    replacementCampaigns: 0,
    neededToday: 315,
    neededByDay12: 0,
    totalPlanned: 315,
  });
  assert.deepEqual(calculateStrategyFunding(3, "smooth-timing", 2), {
    strategy: "smooth-timing",
    startingCampaigns: 2,
    replacementCampaigns: 1,
    neededToday: 315,
    neededByDay12: 150,
    totalPlanned: 465,
  });
  assert.deepEqual(calculateStrategyFunding(3, "grow-fastest", 2), {
    strategy: "grow-fastest",
    startingCampaigns: 2,
    replacementCampaigns: 3,
    neededToday: 315,
    neededByDay12: 450,
    totalPlanned: 765,
  });

  assert.equal(
    calculateStrategyFunding(3, "smooth-timing", 0).startingCampaigns,
    1,
  );
  assert.equal(
    calculateStrategyFunding(3, "smooth-timing", 9).startingCampaigns,
    3,
  );
});

test("funds the selected number of day-12 replacements in the new continuation modes", () => {
  assert.deepEqual(
    calculateStrategyFunding(
      3,
      "start-small",
      2,
      "wait-for-release",
    ),
    {
      strategy: "start-small",
      startingCampaigns: 2,
      replacementCampaigns: 0,
      neededToday: 315,
      neededByDay12: 0,
      totalPlanned: 315,
    },
  );
  assert.deepEqual(
    calculateStrategyFunding(
      3,
      "start-small",
      2,
      "keep-spots-moving",
    ),
    {
      strategy: "start-small",
      startingCampaigns: 2,
      replacementCampaigns: 2,
      neededToday: 315,
      neededByDay12: 300,
      totalPlanned: 615,
    },
  );
});

test("compares one, two, and three starts with user-facing outcome fields", () => {
  const wait = simulateStartingCampaignOptions({
    startingLevel: 3,
    continuationMode: "wait-for-release",
    ...noReferrals,
  });
  const keepMoving = simulateStartingCampaignOptions({
    startingLevel: 3,
    continuationMode: "keep-spots-moving",
    ...noReferrals,
  });

  assert.deepEqual(
    [wait[1].goalDay, wait[2].goalDay, wait[3].goalDay],
    [323, 266, 228],
  );
  assert.deepEqual(
    [keepMoving[1].goalDay, keepMoving[2].goalDay, keepMoving[3].goalDay],
    [266, 209, 183],
  );

  for (const count of [1, 2, 3] as const) {
    const neededToday = 150 * count + 15;
    const firstNetWithdrawal = 194.4 * count * withdrawalRate;
    const expectedRoi =
      ((firstNetWithdrawal - neededToday) / neededToday) * 100;

    near(wait[count].neededToday, neededToday);
    near(wait[count].neededByDay12, 0);
    near(keepMoving[count].neededByDay12, 150 * count);
    near(wait[count].firstNetWithdrawal, firstNetWithdrawal);
    near(keepMoving[count].firstNetWithdrawal, firstNetWithdrawal);
    near(wait[count].firstBatchRoi, expectedRoi);
    near(keepMoving[count].firstBatchRoi, expectedRoi);
    near(wait[count].longTermNetExcessPer30Days, 3581.0526);
    near(keepMoving[count].longTermNetExcessPer30Days, 5670);
  }
});

test("uses the selected count for the initial purchase, first release, and cash ROI", () => {
  const result = simulateStrategyPath({
    startingLevel: 3,
    startingCampaigns: 2,
    strategy: "smooth-timing",
    ...noReferrals,
  });
  const initial = result.steps[0];
  const day12 = result.steps.find((step) => step.day === 12);
  const day19 = result.steps.find((step) => step.day === 19);

  assert.deepEqual(initial.purchasedCampaigns, [3, 3]);
  assert.deepEqual(initial.activationFeesPaid, [3]);
  near(initial.externalContribution, 315);
  near(initial.purchaseCost, 315);
  assert.equal(initial.activeCampaigns.length, 2);

  assert.ok(day12);
  assert.deepEqual(day12.retiredCampaigns, [3, 3]);
  near(day12.externalContribution, 150);
  assert.deepEqual(day12.purchasedCampaigns, [3]);

  assert.ok(day19);
  assert.deepEqual(day19.releasedCampaigns, [3, 3]);
  near(day19.ownReleaseGross, 388.8);

  const firstWithdrawalNet = day19.ownReleaseGross * withdrawalRate;
  near(firstWithdrawalNet, 349.92);
  near(
    ((firstWithdrawalNet - result.neededToday) / result.neededToday) * 100,
    11.0857,
  );
});

test("changes every strategy path when the selected starting count changes", () => {
  const expectedLevelThreeGoalDays = {
    1: [323, 266, 221],
    2: [266, 228, 195],
    3: [228, 209, 183],
  } as const;

  for (const startingCampaigns of [1, 2, 3] as const) {
    const paths = simulateAllStrategyPaths({
      startingLevel: 3,
      startingCampaigns,
      ...noReferrals,
    });
    assert.deepEqual(
      [
        paths["start-small"].goalDay,
        paths["smooth-timing"].goalDay,
        paths["grow-fastest"].goalDay,
      ],
      expectedLevelThreeGoalDays[startingCampaigns],
    );

    for (const result of Object.values(paths)) {
      assert.equal(result.funding.startingCampaigns, startingCampaigns);
      assert.equal(
        result.steps[0].purchasedCampaigns.length,
        startingCampaigns,
      );
      near(
        result.steps.reduce(
          (total, step) => total + step.externalContribution,
          0,
        ),
        result.totalPlanned,
      );
    }
  }
});

test("uses selected Level 7 count in goal funding and projected exit ROI", () => {
  const result = simulateStrategyPath({
    startingLevel: 7,
    startingCampaigns: 2,
    strategy: "grow-fastest",
    ...noReferrals,
  });

  near(result.neededToday, 5040);
  near(result.neededByDay12, 7200);
  near(result.totalPlanned, 12240);
  assert.equal(result.goalDay, 12);
  near(result.externalFundingByGoal, 12240);
  assert.equal(result.projectedExitDay, 31);
  near(result.projectedExitNet, 14580);
  near(result.projectedExitRoi, 19.1176);
});

test("treats a Level 7 day-12 reserve as optional after the goal is reached", () => {
  const result = simulateStrategyPath({
    startingLevel: 7,
    strategy: "grow-fastest",
    ...noReferrals,
  });

  assert.equal(result.goalDay, 0);
  near(result.neededToday, 7440);
  near(result.neededByDay12, 7200);
  near(result.totalPlanned, 14640);
  near(result.externalFundingByGoal, 7440);
  assert.equal(result.projectedExitDay, 19);
  near(result.projectedExitNet, 8748);
  near(result.projectedExitRoi, 17.5806);
});

test("keeps campaign earnings locked after slots reopen on day 12", () => {
  const result = simulateStrategyPath({
    startingLevel: 3,
    strategy: "smooth-timing",
    ...noReferrals,
  });
  const day12 = result.steps.find((step) => step.day === 12);
  const day19 = result.steps.find((step) => step.day === 19);

  assert.ok(day12);
  assert.deepEqual(day12.retiredCampaigns, [3]);
  assert.deepEqual(day12.releasedCampaigns, []);
  near(day12.ownReleaseGross, 0);
  near(day12.externalContribution, 150);
  near(day12.availableBeforePurchase, 150);
  near(day12.purchaseCost, 150);
  near(day12.walletAfterPurchase, 0);
  assert.deepEqual(day12.purchasedCampaigns, [3]);
  assert.equal(day12.activeCampaigns[0]?.startedOn, 12);
  assert.equal(day12.lockedCampaigns[0]?.releasesOn, 19);

  assert.ok(day19);
  assert.deepEqual(day19.releasedCampaigns, [3]);
  near(day19.ownReleaseGross, 194.4);
  near(day19.referralReleaseGross, 0);
  near(day19.availableBeforePurchase, 194.4);
  assert.equal(result.firstAvailableDay, 19);
});

test("models deterministic event paths for all three strategies", () => {
  const paths = simulateAllStrategyPaths({
    startingLevel: 3,
    ...noReferrals,
  });

  assert.deepEqual(
    [
      paths["start-small"].goalDay,
      paths["smooth-timing"].goalDay,
      paths["grow-fastest"].goalDay,
    ],
    [323, 266, 183],
  );
  assert.deepEqual(
    [
      paths["start-small"].firstThreeCampaignsDay,
      paths["smooth-timing"].firstThreeCampaignsDay,
      paths["grow-fastest"].firstThreeCampaignsDay,
    ],
    [19, 19, 0],
  );
  assert.deepEqual(
    [
      paths["start-small"].firstLevelSevenDay,
      paths["smooth-timing"].firstLevelSevenDay,
      paths["grow-fastest"].firstLevelSevenDay,
    ],
    [247, 209, 126],
  );

  for (const result of Object.values(paths)) {
    assert.ok(result.goalWallet >= 0);
    near(result.goalCampaignValue, 7200);
    assert.ok(result.goalInternalValue >= result.goalCampaignValue);
    assert.ok(result.projectedExitDay > result.goalDay);
    assert.ok(result.projectedExitNet > 0);
    assert.ok(
      result.steps.every((step) => step.activeCampaigns.length <= 3),
    );
    near(
      result.steps.reduce(
        (total, step) => total + step.externalContribution,
        0,
      ),
      result.totalPlanned,
    );
  }
});

test("evaluates available cash when grow-fastest slots reopen", () => {
  const result = simulateStrategyPath({
    startingLevel: 3,
    strategy: "grow-fastest",
    ...noReferrals,
  });
  const day24 = result.steps.find((step) => step.day === 24);

  assert.ok(day24);
  near(day24.availableBeforePurchase, 583.2);
  assert.ok(day24.affordablePurchaseOptions > 0);
  assert.equal(day24.purchaseDecision, "wait");
  assert.deepEqual(day24.purchasedCampaigns, []);
  assert.equal(result.goalDay, 183);
});

test("keeps start-small on an undominated synchronized release route", () => {
  const expectedGoalDays = [551, 361, 323, 266, 209, 152, 76];

  for (const level of levels) {
    const result = simulateStrategyPath({
      startingLevel: level.id,
      strategy: "start-small",
      ...noReferrals,
    });
    assert.equal(result.goalDay, expectedGoalDays[level.id - 1]);
    assert.ok(
      result.steps
        .filter(
          (step) =>
            step.retiredCampaigns.length > 0 &&
            step.releasedCampaigns.length === 0 &&
            step.referralReleaseGross === 0 &&
            step.externalContribution === 0,
        )
        .every((step) => step.purchasedCampaigns.length === 0),
    );
  }
});

test("charges each level activation once across an event path", () => {
  for (const strategy of [
    "start-small",
    "smooth-timing",
    "grow-fastest",
  ] as const) {
    const result = simulateStrategyPath({
      startingLevel: 3,
      strategy,
      ...noReferrals,
    });
    const activated = new Set<number>();

    for (const step of result.steps) {
      let expectedPurchaseCost = 0;
      const expectedActivations: number[] = [];
      for (const level of step.purchasedCampaigns) {
        expectedPurchaseCost += getLevel(level).campaign;
        if (!activated.has(level)) {
          activated.add(level);
          expectedPurchaseCost += getLevel(level).activation;
          expectedActivations.push(level);
        }
      }
      near(step.purchaseCost, expectedPurchaseCost);
      assert.deepEqual(step.activationFeesPaid, expectedActivations);
    }
  }
});

test("releases referral credit only on the modeled cadence", () => {
  const estimates = calculateReferralCadenceEstimates({
    people: 3,
    level: 3,
    campaignsPerPerson: 3,
  });

  assert.equal(estimates.firstAvailableDay, 19);
  near(estimates.releaseFunded.grossPerRelease, 194.4);
  near(estimates.releaseFunded.netPerRelease, 174.96);
  near(estimates.releaseFunded.monthlyNet, 276.2526);
  near(estimates.reserveBacked.grossPerRelease, 194.4);
  near(estimates.reserveBacked.netPerRelease, 174.96);
  near(estimates.reserveBacked.monthlyNet, 437.4);

  const releaseFunded = simulateStrategyPath({
    startingLevel: 3,
    strategy: "start-small",
    people: 3,
    referralLevel: 3,
    referralCampaigns: 3,
  });
  const day12 = releaseFunded.steps.find((step) => step.day === 12);
  const day19 = releaseFunded.steps.find((step) => step.day === 19);
  const day31 = releaseFunded.steps.find((step) => step.day === 31);
  assert.ok(day12 && day19 && day31);
  near(day12.referralReleaseGross, 0);
  near(day19.referralReleaseGross, 194.4);
  near(day19.availableBeforePurchase, 388.8);
  near(day31.referralReleaseGross, 0);

  const reserveBacked = simulateStrategyPath({
    startingLevel: 3,
    strategy: "start-small",
    people: 3,
    referralLevel: 3,
    referralCampaigns: 3,
    referralCadence: "reserve-backed",
  });
  const reserveDay31 = reserveBacked.steps.find(
    (step) => step.day === 31,
  );
  assert.ok(reserveDay31);
  near(reserveDay31.referralReleaseGross, 194.4);
});

test("scales referral estimates to any entered direct-referral count", () => {
  const estimates = calculateReferralCadenceEstimates({
    people: 7,
    level: 5,
    campaignsPerPerson: 2,
  });

  assert.equal(estimates.people, 7);
  near(estimates.releaseFunded.grossPerRelease, 1209.6);
  near(estimates.releaseFunded.netPerRelease, 1088.64);
});

test("validates every level, starting count, and continuation mode", () => {
  const capacity = calculateLevelSevenCapacity();

  for (const level of levels) {
    for (const continuationMode of [
      "wait-for-release",
      "keep-spots-moving",
    ] as const) {
      const withoutReferrals = simulateStartingCampaignOptions({
        startingLevel: level.id,
        continuationMode,
        ...noReferrals,
      });
      const withReferrals = simulateStartingCampaignOptions({
        startingLevel: level.id,
        continuationMode,
        people: 3,
        referralLevel: 3,
        referralCampaigns: 3,
      });
      let previousGoalDay = Number.POSITIVE_INFINITY;

      for (const count of [1, 2, 3] as const) {
        const result = withoutReferrals[count];
        const expectedToday = level.campaign * count + level.activation;
        const expectedDay12 =
          continuationMode === "keep-spots-moving"
            ? level.campaign * count
            : 0;
        const expectedFirstNet =
          level.earnings * count * withdrawalRate;
        const expectedFirstProfit = expectedFirstNet - expectedToday;
        const expectedLongTerm =
          continuationMode === "keep-spots-moving"
            ? capacity.monthlyNetAtContinuityRhythm
            : capacity.monthlyNetAtReleaseRhythm;

        assert.equal(result.continuationMode, continuationMode);
        assert.equal(result.funding.startingCampaigns, count);
        assert.equal(result.funding.replacementCampaigns,
          continuationMode === "keep-spots-moving" ? count : 0,
        );
        near(result.neededToday, expectedToday);
        near(result.neededByDay12, expectedDay12);
        near(result.totalPlanned, expectedToday + expectedDay12);
        near(result.firstNetWithdrawal, expectedFirstNet);
        near(result.firstBatchProfit, expectedFirstProfit);
        near(
          result.firstBatchRoi,
          (expectedFirstProfit / expectedToday) * 100,
        );
        near(result.longTermNetExcessPer30Days, expectedLongTerm);
        assert.ok(result.goalDay <= previousGoalDay);
        assert.ok(withReferrals[count].goalDay <= result.goalDay);
        previousGoalDay = result.goalDay;

        const ongoing = result.ongoingProjection;
        assert.equal(ongoing.projectionStartDay, result.goalDay);
        assert.equal(ongoing.projectionEndDay, result.goalDay + 365);
        assert.equal(ongoing.campaignValueKeptCycling, 7200);
        assert.equal(
          ongoing.additionalBridgeReserve,
          continuationMode === "keep-spots-moving" ? 7200 : 0,
        );
        assert.equal(
          ongoing.campaignCadenceDays,
          continuationMode === "keep-spots-moving" ? 12 : 19,
        );
        assert.equal(
          ongoing.referralCadenceDays,
          continuationMode === "keep-spots-moving" ? 12 : 19,
        );
        assert.equal(ongoing.referralReleaseCount, 0);
        near(ongoing.referralGrossCommissions, 0);
        near(ongoing.referralNetWithdrawals, 0);
        near(
          ongoing.campaignNetWithdrawals,
          ongoing.campaignLaneReleaseCount * 840 * withdrawalRate,
        );
        near(
          ongoing.averageCombinedNetPerMonth,
          ongoing.combinedNetWithdrawals / 12,
        );
        if (continuationMode === "wait-for-release") {
          assert.equal(ongoing.campaignLaneReleaseCount, 57);
        } else {
          assert.ok(
            ongoing.campaignLaneReleaseCount >= 87 &&
              ongoing.campaignLaneReleaseCount <= 90,
          );
        }

        const externalFundingThroughGoal = result.steps.reduce(
          (total, step) => total + step.externalContribution,
          0,
        );
        near(result.externalFundingByGoal, externalFundingThroughGoal);
        near(
          result.externalFundingByGoal,
          expectedToday + (result.goalDay >= 12 ? expectedDay12 : 0),
        );

        const activations = result.steps.flatMap(
          (step) => step.activationFeesPaid,
        );
        assert.equal(new Set(activations).size, activations.length);
        assert.ok(result.projectedExitDay >= result.goalDay);
        assert.deepEqual(
          result.steps.at(-1)?.activeCampaigns.map(
            (campaign) => campaign.level,
          ),
          [7, 7, 7],
        );

        if (
          continuationMode === "keep-spots-moving" &&
          !(level.id === 7 && count === 3)
        ) {
          const day12 = result.steps.find((step) => step.day === 12);
          assert.ok(day12);
          near(day12.externalContribution, expectedDay12);
          assert.deepEqual(
            day12.purchasedCampaigns.slice(0, count),
            Array.from({ length: count }, () => level.id),
          );
        }
      }
    }
  }
});

test("never lets optional referral cash delay a strategy goal", () => {
  const strategies = [
    "start-small",
    "smooth-timing",
    "grow-fastest",
  ] as const;

  for (const startingLevel of levels) {
    for (const startingCampaigns of [1, 2, 3]) {
      for (const strategy of strategies) {
        const withoutReferrals = simulateStrategyPath({
          startingLevel: startingLevel.id,
          startingCampaigns,
          strategy,
          ...noReferrals,
        });
        for (const referralLevel of levels) {
          for (const referralCampaigns of [1, 2, 3]) {
            const withReferrals = simulateStrategyPath({
              startingLevel: startingLevel.id,
              startingCampaigns,
              strategy,
              people: 3,
              referralLevel: referralLevel.id,
              referralCampaigns,
            });
            assert.ok(
              withReferrals.goalDay <= withoutReferrals.goalDay,
              [
                `Level ${startingLevel.id}`,
                `${startingCampaigns} starting campaign(s)`,
                strategy,
                `referral Level ${referralLevel.id}`,
                `${referralCampaigns} campaign(s)`,
                `${withReferrals.goalDay} > ${withoutReferrals.goalDay}`,
              ].join(" | "),
            );
          }
        }
      }
    }
  }
});

test("keeps starting-campaign and referral-count goal days non-increasing", () => {
  const strategies = [
    "start-small",
    "smooth-timing",
    "grow-fastest",
  ] as const;
  const referralCadences = [
    "release-funded",
    "reserve-backed",
  ] as const;

  for (const startingLevel of levels) {
    for (const strategy of strategies) {
      for (const referralCadence of referralCadences) {
        for (const referralLevel of levels) {
          for (const referralCampaigns of [1, 2, 3]) {
            let previousGoalDays: number[] | undefined;
            for (const people of [0, 1, 2, 3, 7]) {
              const goalDays = [1, 2, 3].map(
                (startingCampaigns) =>
                  simulateStrategyPath({
                    startingLevel: startingLevel.id,
                    startingCampaigns,
                    strategy,
                    people,
                    referralLevel: referralLevel.id,
                    referralCampaigns,
                    referralCadence,
                  }).goalDay,
              );

              assert.ok(
                goalDays[1] <= goalDays[0] &&
                  goalDays[2] <= goalDays[1],
                [
                  `Level ${startingLevel.id}`,
                  strategy,
                  referralCadence,
                  `${people} referral(s)`,
                  `referral Level ${referralLevel.id}`,
                  `${referralCampaigns} campaign(s)`,
                  `goal days ${goalDays.join(" > ")}`,
                ].join(" | "),
              );

              if (previousGoalDays) {
                const priorGoalDays = previousGoalDays;
                assert.ok(
                  goalDays.every(
                    (goalDay, index) =>
                      goalDay <= priorGoalDays[index],
                  ),
                  [
                    `Level ${startingLevel.id}`,
                    strategy,
                    referralCadence,
                    `referral Level ${referralLevel.id}`,
                    `${referralCampaigns} campaign(s)`,
                    `referral-count goal days ${priorGoalDays.join(",")} -> ${goalDays.join(",")}`,
                  ].join(" | "),
                );
              }
              previousGoalDays = goalDays;
            }
          }
        }
      }
    }
  }
});

test("replays smaller referral schedules at known heuristic boundaries", () => {
  for (const {
    startingLevel,
    startingCampaigns,
    strategy,
    referralLevel,
    referralCampaigns,
    referralCadence,
    people,
  } of [
    {
      startingLevel: 3,
      startingCampaigns: 3,
      strategy: "grow-fastest",
      referralLevel: 1,
      referralCampaigns: 3,
      referralCadence: "release-funded",
      people: [19, 20],
    },
    {
      startingLevel: 4,
      startingCampaigns: 1,
      strategy: "grow-fastest",
      referralLevel: 3,
      referralCampaigns: 1,
      referralCadence: "release-funded",
      people: [15, 16],
    },
    {
      startingLevel: 4,
      startingCampaigns: 2,
      strategy: "smooth-timing",
      referralLevel: 3,
      referralCampaigns: 1,
      referralCadence: "release-funded",
      people: [12, 13],
    },
    {
      startingLevel: 1,
      startingCampaigns: 1,
      strategy: "start-small",
      referralLevel: 2,
      referralCampaigns: 1,
      referralCadence: "reserve-backed",
      people: [1, 2],
    },
  ] as const) {
    const goalDays = people.map(
      (referralPeople) =>
        simulateStrategyPath({
          startingLevel,
          startingCampaigns,
          strategy,
          people: referralPeople,
          referralLevel,
          referralCampaigns,
          referralCadence,
        }).goalDay,
    );
    assert.ok(goalDays[1] <= goalDays[0]);
  }
});

test("keeps very large referral counts finite and on the earliest path", () => {
  for (const people of [1_000_000, Number.MAX_SAFE_INTEGER]) {
    const paths = simulateAllStrategyPaths({
      startingLevel: 1,
      startingCampaigns: 3,
      people,
      referralLevel: 1,
      referralCampaigns: 1,
      referralCadence: "release-funded",
    });

    assert.deepEqual(
      [
        paths["start-small"].goalDay,
        paths["smooth-timing"].goalDay,
        paths["grow-fastest"].goalDay,
      ],
      [19, 24, 24],
    );
    assert.ok(
      Object.values(paths).every(
        (path) =>
          Number.isFinite(path.projectedExitNet) &&
          Number.isFinite(path.projectedExitRoi),
      ),
    );
  }
});

test("finds the earliest synchronized compound route from two Level 3 campaigns", () => {
  const outcome = simulateOptimizedCompoundPath({
    startingLevel: 3,
    startingCampaigns: 2,
    ...noReferrals,
  });

  assert.equal(outcome.goalDay, 266);
  assert.equal(outcome.firstThreeCampaignsDay, 19);
  assert.equal(outcome.firstLevelSevenDay, 190);
  near(outcome.goalWallet, 1740.74);
  near(outcome.goalCampaignValue, 7200);
  near(outcome.goalInternalValue, 8940.74);
  assert.equal(outcome.projectedExitDay, 285);
  near(outcome.projectedExitNet, 10314.666);
  near(outcome.projectedExitRoi, 3174.4971);
  assert.deepEqual(outcome.steps.at(-1)?.campaigns, [7, 7, 7]);
  assert.ok(outcome.steps.every((step) => step.walletAfterPurchase >= 0));
});

test("handles common optimized compound milestones", () => {
  for (const [startingLevel, startingCampaigns, expectedGoalDay] of [
    [7, 3, 0],
    [7, 2, 38],
    [6, 3, 57],
    [3, 3, 228],
    [2, 1, 361],
    [1, 1, 551],
  ] as const) {
    const outcome = simulateOptimizedCompoundPath({
      startingLevel,
      startingCampaigns,
      ...noReferrals,
    });
    assert.equal(outcome.goalDay, expectedGoalDay);
  }
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
  assert.equal(timeLabel(-1, "fr"), "Au-delà de cette simulation");
  assert.equal(timeLabel(0, "fr"), "Point de départ");
  assert.equal(timeLabel(1, "fr"), "Environ 1 jour");
  assert.equal(timeLabel(19, "fr"), "Environ 19 jours");
  assert.equal(timeLabel(91, "fr"), "Environ 3 mois");
});
