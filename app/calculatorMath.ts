export type Level = {
  id: number;
  campaign: number;
  activation: number;
  earnings: number;
  referralCommission: number;
};

export type PathInputs = {
  startingLevel: number;
  startingCampaigns: number;
  people: number;
  referralLevel: number;
  referralCampaigns: number;
};

type CampaignLane = {
  level: number;
  availableOn: number;
};

export type CompoundPathResult = {
  initialCost: number;
  threeCampaignsDay: number;
  firstLevelSevenDay: number;
  goalDay: number;
  cashAvailableByDay: number[];
  campaignValueByDay: number[];
  minimumWallet: number;
};

export type FirstRoundOutcome = {
  initialCost: number;
  fullyAvailableDay: number;
  campaignGross: number;
  referralGross: number;
  totalGross: number;
  netIfWithdrawn: number;
  profitIfWithdrawn: number;
  withdrawalRoi: number;
  retainedProfit: number;
  retainedRoi: number;
};

export type LevelSevenCapacity = {
  campaignCount: number;
  campaignValue: number;
  activationCost: number;
  initialCost: number;
  grossPerRelease: number;
  replacementCost: number;
  grossSurplusPerRelease: number;
  netSurplusPerRelease: number;
  /** Net surplus divided by replacement capital for one completed set. */
  netSurplusRoiPerRelease: number;
  netIfFullyWithdrawn: number;
  monthlyNetAtReleaseRhythm: number;
  continuityReserve: number;
  monthlyNetAtContinuityRhythm: number;
};

export type OptimizedCompoundStep = {
  round: number;
  day: number;
  campaigns: number[];
  availableBeforePurchase: number;
  purchaseCost: number;
  walletAfterPurchase: number;
};

export type OptimizedCompoundPathResult = {
  initialCost: number;
  goalDay: number;
  firstThreeCampaignsDay: number;
  firstLevelSevenDay: number;
  goalWallet: number;
  goalCampaignValue: number;
  goalInternalValue: number;
  projectedExitDay: number;
  projectedExitNet: number;
  projectedExitRoi: number;
  steps: OptimizedCompoundStep[];
};

export type CampaignStrategy =
  | "start-small"
  | "smooth-timing"
  | "grow-fastest";

/**
 * Controls what happens when the campaigns started today finish their
 * 12 active days. Waiting uses only released program value. Keeping the
 * selected spots moving adds one campaign price per selected spot on day 12.
 */
export type ContinuationMode =
  | "wait-for-release"
  | "keep-spots-moving";

export type ReferralCadence = "release-funded" | "reserve-backed";

export type StrategyFunding = {
  strategy: CampaignStrategy;
  startingCampaigns: number;
  replacementCampaigns: number;
  neededToday: number;
  neededByDay12: number;
  totalPlanned: number;
};

export type ReferralCadenceEstimate = {
  cadence: ReferralCadence;
  intervalDays: number;
  grossPerRelease: number;
  netPerRelease: number;
  monthlyGross: number;
  monthlyNet: number;
};

export type ReferralCadenceEstimates = {
  people: number;
  level: number;
  campaignsPerPerson: number;
  firstAvailableDay: number;
  releaseFunded: ReferralCadenceEstimate;
  reserveBacked: ReferralCadenceEstimate;
};

export type OngoingProjection = {
  /** A literal 365-day window immediately after the modeled goal day. */
  convention: "first-365-days-after-goal";
  projectionStartDay: number;
  projectionEndDay: number;
  projectionDays: 365;
  continuationMode: ContinuationMode;
  campaignCadenceDays: number;
  referralCadence: ReferralCadence;
  referralCadenceDays: number;
  /** Campaign purchase value retained for the next three Level 7 campaigns. */
  campaignValueKeptCycling: number;
  /** Separate bridge required to restart all three slots after day 12. */
  additionalBridgeReserve: number;
  /** Total campaign capital kept working across campaigns and any bridge. */
  committedCampaignCapital: number;
  /** Number of individual Level 7 campaign releases inside the window. */
  campaignLaneReleaseCount: number;
  /** Lane releases divided by three; may be fractional for a staggered goal. */
  equivalentThreeCampaignSetReleases: number;
  referralReleaseCount: number;
  campaignGrossSurplus: number;
  campaignNetWithdrawals: number;
  /** 12-month campaign net withdrawals divided by committed campaign capital. */
  campaignCashRoi: number;
  referralGrossCommissions: number;
  referralNetWithdrawals: number;
  combinedNetWithdrawals: number;
  averageCampaignNetPerMonth: number;
  averageReferralNetPerMonth: number;
  averageCombinedNetPerMonth: number;
};

export type OngoingProjectionInputs = {
  goalDay: number;
  activeLevelSevenStartedOn: number[];
  continuationMode: ContinuationMode;
  people?: number;
  referralLevel?: number;
  referralCampaigns?: number;
};

export type StrategyPathInputs = {
  startingLevel: number;
  /** Campaigns purchased at the selected level on day 0. */
  startingCampaigns?: number;
  strategy: CampaignStrategy;
  /**
   * Preferred replacement contract. When omitted, the legacy strategy's
   * 0/1/3 day-12 funding behavior is retained for existing callers.
   */
  continuationMode?: ContinuationMode;
  people?: number;
  referralLevel?: number;
  referralCampaigns?: number;
  referralCadence?: ReferralCadence;
};

export type StrategyCampaignSnapshot = {
  level: number;
  startedOn: number;
  retiresOn: number;
  releasesOn: number;
};

export type StrategyEventStep = {
  day: number;
  label: string;
  externalContribution: number;
  retiredCampaigns: number[];
  releasedCampaigns: number[];
  ownReleaseGross: number;
  referralReleaseGross: number;
  availableBeforePurchase: number;
  purchasedCampaigns: number[];
  activationFeesPaid: number[];
  purchaseCost: number;
  walletAfterPurchase: number;
  affordablePurchaseOptions: number;
  purchaseDecision: "fixed" | "purchase" | "wait" | "no-open-slot";
  activeCampaigns: StrategyCampaignSnapshot[];
  lockedCampaigns: StrategyCampaignSnapshot[];
};

export type StrategyPathResult = {
  strategy: CampaignStrategy;
  continuationMode: ContinuationMode;
  funding: StrategyFunding;
  neededToday: number;
  neededByDay12: number;
  totalPlanned: number;
  firstAvailableDay: number;
  /** Net value of the campaigns started today if their first release is withdrawn. */
  firstNetWithdrawal: number;
  /** First net withdrawal less the day-0 campaign and activation cost. */
  firstBatchProfit: number;
  /** Cash ROI of the day-0 batch, excluding optional referrals and day-12 reserves. */
  firstBatchRoi: number;
  /**
   * @deprecated Smoothed 30-day steady-state rate. Use ongoingProjection for
   * the actual first 365 days after the goal.
   */
  longTermNetExcessPer30Days: number;
  ongoingProjection: OngoingProjection;
  firstThreeCampaignsDay: number;
  firstLevelSevenDay: number;
  goalDay: number;
  goalWallet: number;
  goalCampaignValue: number;
  goalLockedValue: number;
  goalInternalValue: number;
  externalFundingByGoal: number;
  /** @deprecated Full-exit illustration retained for compatibility. */
  projectedExitDay: number;
  /** @deprecated Full-exit illustration retained for compatibility. */
  projectedExitGross: number;
  /** @deprecated Full-exit illustration retained for compatibility. */
  projectedExitNet: number;
  /** @deprecated Full-exit illustration retained for compatibility. */
  projectedExitRoi: number;
  referralEstimates: ReferralCadenceEstimates;
  steps: StrategyEventStep[];
};

export type StartingCampaignOptionInputs = Omit<
  StrategyPathInputs,
  "startingCampaigns" | "strategy"
> & {
  continuationMode: ContinuationMode;
};

export type StartingCampaignOptions = Record<1 | 2 | 3, StrategyPathResult>;

export const levels: Level[] = [
  { id: 1, campaign: 13, activation: 1, earnings: 17.17, referralCommission: 1.908 },
  { id: 2, campaign: 77, activation: 7, earnings: 101.7, referralCommission: 11.3 },
  { id: 3, campaign: 150, activation: 15, earnings: 194.4, referralCommission: 21.6 },
  { id: 4, campaign: 300, activation: 30, earnings: 388.8, referralCommission: 43.2 },
  { id: 5, campaign: 600, activation: 60, earnings: 777.6, referralCommission: 86.4 },
  { id: 6, campaign: 1200, activation: 120, earnings: 1555.2, referralCommission: 172.8 },
  { id: 7, campaign: 2400, activation: 240, earnings: 3240, referralCommission: 360 },
];

export const cycleDays = 19;
export const clickDays = 12;
export const withdrawalRate = 0.9;
export const maximumProjectionDays = 365 * 20;

const epsilon = 0.0001;
const centsPerUsdt = 100;

function toCents(value: number) {
  return Math.round(value * centsPerUsdt);
}

function fromCents(value: number) {
  return value / centsPerUsdt;
}

export function getLevel(level: number) {
  return levels.find((item) => item.id === level) ?? levels[0];
}

export function referralCommissionForDay(
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

export function referralCashThroughDay(
  day: number,
  people: number,
  level: number,
  campaignCount: number,
) {
  return (
    referralGrossThroughDay(day, people, level, campaignCount) *
    withdrawalRate
  );
}

export function referralGrossThroughDay(
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
  return total;
}

/**
 * Compares the two first-round choices on the same elapsed time and starting
 * cost. Starting campaigns use the synchronized release convention used by
 * the compounding roadmap; selected referral commissions are included through
 * that first release day.
 */
export function calculateFirstRoundOutcome({
  startingLevel,
  startingCampaigns,
  people,
  referralLevel,
  referralCampaigns,
}: PathInputs): FirstRoundOutcome {
  const starting = getLevel(startingLevel);
  const initialCost =
    starting.campaign * startingCampaigns + starting.activation;
  const fullyAvailableDay = cycleDays;
  const campaignGross = starting.earnings * startingCampaigns;
  const referralGross = referralGrossThroughDay(
    fullyAvailableDay,
    people,
    referralLevel,
    referralCampaigns,
  );
  const totalGross = campaignGross + referralGross;
  const netIfWithdrawn = totalGross * withdrawalRate;
  const profitIfWithdrawn = netIfWithdrawn - initialCost;
  const retainedProfit = totalGross - initialCost;

  return {
    initialCost,
    fullyAvailableDay,
    campaignGross,
    referralGross,
    totalGross,
    netIfWithdrawn,
    profitIfWithdrawn,
    withdrawalRoi: (profitIfWithdrawn / initialCost) * 100,
    retainedProfit,
    retainedRoi: (retainedProfit / initialCost) * 100,
  };
}

/** Ongoing output once all three campaign slots are running at Level 7. */
export function calculateLevelSevenCapacity(
  campaignCount = 3,
): LevelSevenCapacity {
  const levelSeven = getLevel(7);
  const campaignValue = levelSeven.campaign * campaignCount;
  const grossPerRelease = levelSeven.earnings * campaignCount;
  const grossSurplusPerRelease = grossPerRelease - campaignValue;
  const netSurplusPerRelease = grossSurplusPerRelease * withdrawalRate;

  return {
    campaignCount,
    campaignValue,
    activationCost: levelSeven.activation,
    initialCost: campaignValue + levelSeven.activation,
    grossPerRelease,
    replacementCost: campaignValue,
    grossSurplusPerRelease,
    netSurplusPerRelease,
    netSurplusRoiPerRelease:
      (netSurplusPerRelease / campaignValue) * 100,
    netIfFullyWithdrawn: grossPerRelease * withdrawalRate,
    monthlyNetAtReleaseRhythm:
      (netSurplusPerRelease * 30) / cycleDays,
    continuityReserve: campaignValue,
    monthlyNetAtContinuityRhythm:
      (netSurplusPerRelease * 30) / clickDays,
  };
}

type PortfolioOption = {
  key: string;
  campaigns: number[];
  campaignCostCents: number;
  earningsCents: number;
  activationMask: number;
};

type CompoundSearchState = {
  portfolio: PortfolioOption;
  activatedMask: number;
  walletCents: number;
  steps: OptimizedCompoundStep[];
};

function levelMask(level: number) {
  return 1 << (level - 1);
}

function buildPortfolioOptions() {
  const options: PortfolioOption[] = [];

  function addCampaigns(startIndex: number, remaining: number, chosen: Level[]) {
    if (chosen.length > 0) {
      const campaigns = chosen.map((level) => level.id);
      options.push({
        key: campaigns.join("-"),
        campaigns,
        campaignCostCents: chosen.reduce(
          (total, level) => total + toCents(level.campaign),
          0,
        ),
        earningsCents: chosen.reduce(
          (total, level) => total + toCents(level.earnings),
          0,
        ),
        activationMask: chosen.reduce(
          (mask, level) => mask | levelMask(level.id),
          0,
        ),
      });
    }

    if (remaining === 0) return;
    for (let index = startIndex; index < levels.length; index += 1) {
      chosen.push(levels[index]);
      addCampaigns(index, remaining - 1, chosen);
      chosen.pop();
    }
  }

  addCampaigns(0, 3, []);
  return options;
}

const portfolioOptions = buildPortfolioOptions();
const goalPortfolioKey = "7-7-7";
const strategyMaskCount = 1 << levels.length;
const strategyStateCount = portfolioOptions.length * strategyMaskCount;
const portfolioIndexByKey = new Map(
  portfolioOptions.map((portfolio, index) => [portfolio.key, index]),
);
const goalPortfolioIndex = portfolioIndexByKey.get(goalPortfolioKey) ?? -1;

function activationCostCents(mask: number) {
  return levels.reduce(
    (total, level) =>
      mask & levelMask(level.id)
        ? total + toCents(level.activation)
        : total,
    0,
  );
}

const strategyTransitionCosts = new Int32Array(
  strategyMaskCount * portfolioOptions.length,
);
const strategyTransitionStates = new Uint16Array(
  strategyMaskCount * portfolioOptions.length,
);

for (let activatedMask = 0; activatedMask < strategyMaskCount; activatedMask += 1) {
  const transitionOffset = activatedMask * portfolioOptions.length;
  for (
    let portfolioIndex = 0;
    portfolioIndex < portfolioOptions.length;
    portfolioIndex += 1
  ) {
    const portfolio = portfolioOptions[portfolioIndex];
    const nextActivatedMask = activatedMask | portfolio.activationMask;
    strategyTransitionCosts[transitionOffset + portfolioIndex] =
      portfolio.campaignCostCents +
      activationCostCents(portfolio.activationMask & ~activatedMask);
    strategyTransitionStates[transitionOffset + portfolioIndex] =
      portfolioIndex * strategyMaskCount + nextActivatedMask;
  }
}

type EventCampaign = {
  level: number;
  startedOn: number;
};

type StrategyPurchaseChoice = {
  portfolio: PortfolioOption;
  activatedMask: number;
  newActivationMask: number;
  purchaseCostCents: number;
  reachesGoal: boolean;
  levelSevenCount: number;
};

type SynchronizedStrategyPlan = {
  purchasesByDay: Map<number, PortfolioOption>;
};

type StrategyDecisionPoint = {
  day: number;
  affordablePurchases: StrategyPurchaseChoice[];
  chosenPortfolioKey?: string;
};

type StrategySimulationOptions = {
  allocationMode?: "cash-entry-only" | "eager";
  purchaseSchedule?: ReadonlyMap<number, string>;
  allowGoalOverride?: boolean;
  override?: {
    day: number;
    portfolioKey?: string;
  };
  onDecision?: (decision: StrategyDecisionPoint) => void;
};

function isBetterStrategyPurchase(
  candidate: StrategyPurchaseChoice,
  current: StrategyPurchaseChoice | undefined,
) {
  if (!current) return true;
  if (candidate.reachesGoal !== current.reachesGoal) {
    return candidate.reachesGoal;
  }
  if (
    candidate.portfolio.earningsCents !==
    current.portfolio.earningsCents
  ) {
    return (
      candidate.portfolio.earningsCents >
      current.portfolio.earningsCents
    );
  }
  if (candidate.levelSevenCount !== current.levelSevenCount) {
    return candidate.levelSevenCount > current.levelSevenCount;
  }
  if (
    candidate.portfolio.campaigns.length !==
    current.portfolio.campaigns.length
  ) {
    return (
      candidate.portfolio.campaigns.length >
      current.portfolio.campaigns.length
    );
  }
  if (candidate.purchaseCostCents !== current.purchaseCostCents) {
    return candidate.purchaseCostCents < current.purchaseCostCents;
  }
  return candidate.portfolio.key < current.portfolio.key;
}

/**
 * Exact dynamic program for the release-funded start-small strategy. Since
 * its only new cash arrives on synchronized 19-day releases, every eligible
 * purchase is also synchronized. For each portfolio/activation-mask pair we
 * retain only the greatest wallet; a smaller wallet in the same state cannot
 * produce an earlier goal. Typed arrays keep this exhaustive candidate fast
 * enough to run after the user asks for the projection.
 */
function buildSynchronizedStartSmallPlan(
  startingLevel: number,
  startingCampaigns: number,
  referralReleaseCents: number,
  maximumDays: number,
): SynchronizedStrategyPlan | undefined {
  const initialPortfolioKey = Array.from(
    { length: startingCampaigns },
    () => startingLevel,
  ).join("-");
  const initialPortfolioIndex = portfolioIndexByKey.get(initialPortfolioKey);
  if (initialPortfolioIndex === undefined || goalPortfolioIndex < 0) {
    return undefined;
  }

  const initialMask = levelMask(startingLevel);
  const initialState =
    initialPortfolioIndex * strategyMaskCount + initialMask;
  let wallets = new Float64Array(strategyStateCount);
  wallets.fill(-1);
  wallets[initialState] = 0;
  const parents: Int16Array[] = [];
  const maximumRounds = Math.floor(maximumDays / cycleDays);

  for (let round = 1; round <= maximumRounds; round += 1) {
    const nextWallets = new Float64Array(strategyStateCount);
    nextWallets.fill(-1);
    const roundParents = new Int16Array(strategyStateCount);
    roundParents.fill(-1);

    for (let state = 0; state < strategyStateCount; state += 1) {
      const walletCents = wallets[state];
      if (walletCents < 0) continue;

      const currentPortfolioIndex = Math.floor(
        state / strategyMaskCount,
      );
      const activatedMask = state & (strategyMaskCount - 1);
      const availableCents =
        walletCents +
        portfolioOptions[currentPortfolioIndex].earningsCents +
        referralReleaseCents;
      const transitionOffset = activatedMask * portfolioOptions.length;

      for (
        let portfolioIndex = 0;
        portfolioIndex < portfolioOptions.length;
        portfolioIndex += 1
      ) {
        const transitionIndex = transitionOffset + portfolioIndex;
        const purchaseCostCents =
          strategyTransitionCosts[transitionIndex];
        if (purchaseCostCents > availableCents) continue;

        const nextState = strategyTransitionStates[transitionIndex];
        const nextWalletCents = availableCents - purchaseCostCents;
        if (nextWallets[nextState] >= nextWalletCents) continue;

        nextWallets[nextState] = nextWalletCents;
        roundParents[nextState] = state;
      }
    }

    parents.push(roundParents);
    let bestGoalState = -1;
    let bestGoalWallet = -1;
    const goalStateOffset = goalPortfolioIndex * strategyMaskCount;
    for (let mask = 0; mask < strategyMaskCount; mask += 1) {
      const state = goalStateOffset + mask;
      if (nextWallets[state] > bestGoalWallet) {
        bestGoalWallet = nextWallets[state];
        bestGoalState = state;
      }
    }

    if (bestGoalState >= 0) {
      const purchasesByDay = new Map<number, PortfolioOption>();
      let state = bestGoalState;
      for (let planRound = round; planRound >= 1; planRound -= 1) {
        const portfolioIndex = Math.floor(state / strategyMaskCount);
        purchasesByDay.set(
          planRound * cycleDays,
          portfolioOptions[portfolioIndex],
        );
        state = parents[planRound - 1][state];
      }
      return { purchasesByDay };
    }

    wallets = nextWallets;
  }

  return undefined;
}

const strategyHeuristicPathCache = new Map<string, StrategyPathResult>();

function normalizedCount(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value ?? fallback));
}

function normalizedReferralCampaigns(value: number | undefined) {
  return Math.min(3, Math.max(1, normalizedCount(value, 1)));
}

function normalizedStartingCampaigns(
  value: number | undefined,
  fallback: number,
) {
  return Math.min(3, Math.max(1, normalizedCount(value, fallback)));
}

function levelsInMask(mask: number) {
  return levels
    .filter((level) => mask & levelMask(level.id))
    .map((level) => level.id);
}

function isCampaignActive(campaign: EventCampaign, day: number) {
  return day < campaign.startedOn + clickDays;
}

function campaignSnapshot(
  campaign: EventCampaign,
): StrategyCampaignSnapshot {
  return {
    level: campaign.level,
    startedOn: campaign.startedOn,
    retiresOn: campaign.startedOn + clickDays,
    releasesOn: campaign.startedOn + cycleDays,
  };
}

function sortedCampaignSnapshots(campaigns: EventCampaign[]) {
  return campaigns
    .map(campaignSnapshot)
    .sort(
      (left, right) =>
        left.startedOn - right.startedOn || left.level - right.level,
    );
}

export function calculateStrategyFunding(
  level: number,
  strategy: CampaignStrategy,
  selectedStartingCampaigns?: number,
  continuationMode?: ContinuationMode,
): StrategyFunding {
  const selectedLevel = getLevel(level);
  const legacyStartingCampaigns = strategy === "grow-fastest" ? 3 : 1;
  const startingCampaigns = normalizedStartingCampaigns(
    selectedStartingCampaigns,
    legacyStartingCampaigns,
  );
  const replacementCampaigns = continuationMode
    ? continuationMode === "keep-spots-moving"
      ? startingCampaigns
      : 0
    : strategy === "start-small"
      ? 0
      : strategy === "smooth-timing"
        ? 1
        : 3;
  const neededToday =
    selectedLevel.campaign * startingCampaigns + selectedLevel.activation;
  const neededByDay12 =
    selectedLevel.campaign * replacementCampaigns;

  return {
    strategy,
    startingCampaigns,
    replacementCampaigns,
    neededToday,
    neededByDay12,
    totalPlanned: neededToday + neededByDay12,
  };
}

export function calculateReferralCadenceEstimates({
  people = 0,
  level = 3,
  campaignsPerPerson = 1,
}: {
  people?: number;
  level?: number;
  campaignsPerPerson?: number;
}): ReferralCadenceEstimates {
  const normalizedPeople = normalizedCount(people, 0);
  const normalizedCampaignCount = normalizedReferralCampaigns(
    campaignsPerPerson,
  );
  const selectedLevel = getLevel(level);
  const grossPerRelease =
    normalizedPeople *
    normalizedCampaignCount *
    selectedLevel.referralCommission;
  const netPerRelease = grossPerRelease * withdrawalRate;

  function cadenceEstimate(
    cadence: ReferralCadence,
    intervalDays: number,
  ): ReferralCadenceEstimate {
    return {
      cadence,
      intervalDays,
      grossPerRelease,
      netPerRelease,
      monthlyGross: (grossPerRelease * 30) / intervalDays,
      monthlyNet: (netPerRelease * 30) / intervalDays,
    };
  }

  return {
    people: normalizedPeople,
    level: selectedLevel.id,
    campaignsPerPerson: normalizedCampaignCount,
    firstAvailableDay: cycleDays,
    releaseFunded: cadenceEstimate("release-funded", cycleDays),
    reserveBacked: cadenceEstimate("reserve-backed", clickDays),
  };
}

function referralReleaseOccurs(
  day: number,
  cadence: ReferralCadence,
) {
  const interval = cadence === "reserve-backed" ? clickDays : cycleDays;
  return day >= cycleDays && (day - cycleDays) % interval === 0;
}

function referralReleaseCountBetween(
  afterDay: number,
  throughDay: number,
  cadence: ReferralCadence,
) {
  let releases = 0;
  for (let day = afterDay + 1; day <= throughDay; day += 1) {
    if (referralReleaseOccurs(day, cadence)) releases += 1;
  }
  return releases;
}

function recurringReleaseCount(
  firstReleaseDay: number,
  throughDay: number,
  cadenceDays: number,
) {
  if (firstReleaseDay > throughDay) return 0;
  return Math.floor((throughDay - firstReleaseDay) / cadenceDays) + 1;
}

/**
 * Models ongoing withdrawals without liquidating the three Level 7 campaigns.
 * The projection covers the literal 365 days after the goal. It retains 7,200
 * USDT of campaign value, withdraws only each campaign's surplus after the
 * modeled fee, and withdraws the selected referral commissions after the same
 * fee. This is deliberately a first-year-from-goal view, not a smoothed
 * steady-state annual rate.
 */
export function calculateOngoingProjection({
  goalDay,
  activeLevelSevenStartedOn,
  continuationMode,
  people = 0,
  referralLevel = 3,
  referralCampaigns = 1,
}: OngoingProjectionInputs): OngoingProjection {
  if (
    activeLevelSevenStartedOn.length !== 3 ||
    activeLevelSevenStartedOn.some(
      (startedOn) =>
        !Number.isFinite(startedOn) ||
        startedOn > goalDay ||
        startedOn + clickDays <= goalDay,
    )
  ) {
    throw new Error(
      "Ongoing projection requires three active Level 7 campaign start days.",
    );
  }

  const projectionDays = 365 as const;
  const projectionEndDay = goalDay + projectionDays;
  const campaignCadenceDays =
    continuationMode === "keep-spots-moving" ? clickDays : cycleDays;
  const referralCadence: ReferralCadence =
    continuationMode === "keep-spots-moving"
      ? "reserve-backed"
      : "release-funded";
  const referralCadenceDays =
    referralCadence === "reserve-backed" ? clickDays : cycleDays;
  const levelSeven = getLevel(7);
  const capacity = calculateLevelSevenCapacity();
  const campaignLaneReleaseCount = activeLevelSevenStartedOn.reduce(
    (total, startedOn) =>
      total +
      recurringReleaseCount(
        startedOn + cycleDays,
        projectionEndDay,
        campaignCadenceDays,
      ),
    0,
  );
  const normalizedPeople = normalizedCount(people, 0);
  const normalizedCampaignCount = normalizedReferralCampaigns(
    referralCampaigns,
  );
  const referralReleaseCount =
    normalizedPeople === 0
      ? 0
      : referralReleaseCountBetween(
          goalDay,
          projectionEndDay,
          referralCadence,
        );
  const campaignGrossSurplus =
    campaignLaneReleaseCount *
    (levelSeven.earnings - levelSeven.campaign);
  const campaignNetWithdrawals =
    campaignGrossSurplus * withdrawalRate;
  const referralGrossPerRelease =
    normalizedPeople *
    normalizedCampaignCount *
    getLevel(referralLevel).referralCommission;
  const referralGrossCommissions =
    referralReleaseCount * referralGrossPerRelease;
  const referralNetWithdrawals =
    referralGrossCommissions * withdrawalRate;
  const combinedNetWithdrawals =
    campaignNetWithdrawals + referralNetWithdrawals;
  const additionalBridgeReserve =
    continuationMode === "keep-spots-moving"
      ? capacity.continuityReserve
      : 0;
  const committedCampaignCapital =
    capacity.campaignValue + additionalBridgeReserve;

  return {
    convention: "first-365-days-after-goal",
    projectionStartDay: goalDay,
    projectionEndDay,
    projectionDays,
    continuationMode,
    campaignCadenceDays,
    referralCadence,
    referralCadenceDays,
    campaignValueKeptCycling: capacity.campaignValue,
    additionalBridgeReserve,
    committedCampaignCapital,
    campaignLaneReleaseCount,
    equivalentThreeCampaignSetReleases:
      campaignLaneReleaseCount / 3,
    referralReleaseCount,
    campaignGrossSurplus,
    campaignNetWithdrawals,
    campaignCashRoi:
      (campaignNetWithdrawals / committedCampaignCapital) * 100,
    referralGrossCommissions,
    referralNetWithdrawals,
    combinedNetWithdrawals,
    averageCampaignNetPerMonth: campaignNetWithdrawals / 12,
    averageReferralNetPerMonth: referralNetWithdrawals / 12,
    averageCombinedNetPerMonth: combinedNetWithdrawals / 12,
  };
}

/**
 * Deterministic browser-safe ranking used by reserve-timed event paths. When
 * an allocation candidate chooses to act, the affordable mix with the greatest
 * next completion value ranks first. An immediate three-Level-7 goal wins;
 * remaining ties favor more Level 7s, more occupied slots, lower cost, then a
 * stable portfolio key. This is a "fastest modeled path," not a proof of the
 * globally shortest path across every possible decision schedule.
 */
function affordableStrategyPurchases(
  walletCents: number,
  openSlots: number,
  activeLevels: number[],
  activatedMask: number,
) {
  const choices: StrategyPurchaseChoice[] = [];

  for (const portfolio of portfolioOptions) {
    if (portfolio.campaigns.length > openSlots) continue;

    const newActivationMask =
      portfolio.activationMask & ~activatedMask;
    const purchaseCostCents =
      portfolio.campaignCostCents +
      activationCostCents(newActivationMask);
    if (purchaseCostCents > walletCents) continue;

    const combinedActiveLevels = [
      ...activeLevels,
      ...portfolio.campaigns,
    ];
    const reachesGoal =
      combinedActiveLevels.length === 3 &&
      combinedActiveLevels.every((level) => level === 7);
    const levelSevenCount = portfolio.campaigns.filter(
      (level) => level === 7,
    ).length;
    const candidate: StrategyPurchaseChoice = {
      portfolio,
      activatedMask: activatedMask | portfolio.activationMask,
      newActivationMask,
      purchaseCostCents,
      reachesGoal,
      levelSevenCount,
    };

    choices.push(candidate);
  }

  return choices;
}

function chooseStrategyPurchase(
  choices: StrategyPurchaseChoice[],
) {
  let best: StrategyPurchaseChoice | undefined;
  for (const choice of choices) {
    if (isBetterStrategyPurchase(choice, best)) best = choice;
  }
  return best;
}

function limitedLookaheadPurchases(
  choices: StrategyPurchaseChoice[],
) {
  const ranked = [...choices].sort((left, right) => {
    if (isBetterStrategyPurchase(left, right)) return -1;
    if (isBetterStrategyPurchase(right, left)) return 1;
    return 0;
  });
  const selected = new Map<string, StrategyPurchaseChoice>();
  if (ranked[0]) selected.set(ranked[0].portfolio.key, ranked[0]);
  const greatestNetGrowth = choices.reduce<
    StrategyPurchaseChoice | undefined
  >((best, choice) => {
    if (!best) return choice;
    const choiceGrowth =
      choice.portfolio.earningsCents - choice.purchaseCostCents;
    const bestGrowth =
      best.portfolio.earningsCents - best.purchaseCostCents;
    return choiceGrowth > bestGrowth ? choice : best;
  }, undefined);
  if (greatestNetGrowth) {
    selected.set(greatestNetGrowth.portfolio.key, greatestNetGrowth);
  }

  return Array.from(selected.values());
}

function strategyEventLabel({
  day,
  externalContribution,
  releasedCampaigns,
  referralReleaseGross,
  purchasedCampaigns,
}: Pick<
  StrategyEventStep,
  | "day"
  | "externalContribution"
  | "releasedCampaigns"
  | "referralReleaseGross"
  | "purchasedCampaigns"
>) {
  if (day === 0) return "Initial campaign purchase";
  if (externalContribution > 0) return "Day-12 replacement contribution";
  if (releasedCampaigns.length > 0 && purchasedCampaigns.length > 0) {
    return "Campaign release and reinvestment";
  }
  if (referralReleaseGross > 0 && purchasedCampaigns.length > 0) {
    return "Referral release and reinvestment";
  }
  if (releasedCampaigns.length > 0) return "Campaign value released";
  if (referralReleaseGross > 0) return "Referral commission released";
  if (purchasedCampaigns.length > 0) return "Open slots funded";
  return "Campaign slots reopened";
}

function completeStrategyResult({
  inputs,
  funding,
  referralEstimates,
  referralCadence,
  referralReleaseCents,
  goalDay,
  firstThreeCampaignsDay,
  firstLevelSevenDay,
  walletCents,
  campaigns,
  steps,
}: {
  inputs: StrategyPathInputs;
  funding: StrategyFunding;
  referralEstimates: ReferralCadenceEstimates;
  referralCadence: ReferralCadence;
  referralReleaseCents: number;
  goalDay: number;
  firstThreeCampaignsDay: number;
  firstLevelSevenDay: number;
  walletCents: number;
  campaigns: EventCampaign[];
  steps: StrategyEventStep[];
}): StrategyPathResult {
  const continuationMode =
    inputs.continuationMode ??
    (funding.replacementCampaigns === 0
      ? "wait-for-release"
      : "keep-spots-moving");
  const startingLevel = getLevel(inputs.startingLevel);
  const firstCampaignGross =
    startingLevel.earnings * funding.startingCampaigns;
  const firstNetWithdrawal = firstCampaignGross * withdrawalRate;
  const firstBatchProfit = firstNetWithdrawal - funding.neededToday;
  const levelSevenCapacity = calculateLevelSevenCapacity();
  const longTermNetExcessPer30Days =
    continuationMode === "keep-spots-moving"
      ? levelSevenCapacity.monthlyNetAtContinuityRhythm
      : levelSevenCapacity.monthlyNetAtReleaseRhythm;
  const activeCampaigns = campaigns.filter((campaign) =>
    isCampaignActive(campaign, goalDay),
  );
  const lockedCampaigns = campaigns.filter(
    (campaign) => !isCampaignActive(campaign, goalDay),
  );
  const ongoingProjection = calculateOngoingProjection({
    goalDay,
    activeLevelSevenStartedOn: activeCampaigns
      .filter((campaign) => campaign.level === 7)
      .map((campaign) => campaign.startedOn),
    continuationMode,
    people: inputs.people,
    referralLevel: inputs.referralLevel,
    referralCampaigns: inputs.referralCampaigns,
  });
  const goalCampaignValueCents = activeCampaigns.reduce(
    (total, campaign) =>
      total + toCents(getLevel(campaign.level).campaign),
    0,
  );
  const goalLockedValueCents = lockedCampaigns.reduce(
    (total, campaign) =>
      total + toCents(getLevel(campaign.level).earnings),
    0,
  );
  const projectedExitDay = campaigns.reduce(
    (latest, campaign) =>
      Math.max(latest, campaign.startedOn + cycleDays),
    goalDay,
  );
  const futureCampaignReleaseCents = campaigns.reduce(
    (total, campaign) =>
      total + toCents(getLevel(campaign.level).earnings),
    0,
  );
  const futureReferralReleaseCents =
    referralReleaseCountBetween(
      goalDay,
      projectedExitDay,
      referralCadence,
    ) * referralReleaseCents;
  const projectedExitGrossCents =
    walletCents +
    futureCampaignReleaseCents +
    futureReferralReleaseCents;
  const projectedExitGross = fromCents(projectedExitGrossCents);
  const projectedExitNet = projectedExitGross * withdrawalRate;
  const externalFundingByGoal =
    funding.neededToday +
    (goalDay >= clickDays ? funding.neededByDay12 : 0);

  return {
    strategy: inputs.strategy,
    continuationMode,
    funding,
    neededToday: funding.neededToday,
    neededByDay12: funding.neededByDay12,
    totalPlanned: funding.totalPlanned,
    firstAvailableDay: cycleDays,
    firstNetWithdrawal,
    firstBatchProfit,
    firstBatchRoi:
      (firstBatchProfit / funding.neededToday) * 100,
    longTermNetExcessPer30Days,
    ongoingProjection,
    firstThreeCampaignsDay,
    firstLevelSevenDay,
    goalDay,
    goalWallet: fromCents(walletCents),
    goalCampaignValue: fromCents(goalCampaignValueCents),
    goalLockedValue: fromCents(goalLockedValueCents),
    goalInternalValue: fromCents(
      walletCents + goalCampaignValueCents + goalLockedValueCents,
    ),
    externalFundingByGoal,
    projectedExitDay,
    projectedExitGross,
    projectedExitNet,
    projectedExitRoi:
      ((projectedExitNet - externalFundingByGoal) /
        externalFundingByGoal) *
      100,
    referralEstimates,
    steps,
  };
}

function simulateStrategyCandidate(
  inputs: StrategyPathInputs,
  maximumDays: number,
  options: StrategySimulationOptions = {},
): StrategyPathResult | undefined {
  const startingLevel = getLevel(inputs.startingLevel);
  const people = normalizedCount(inputs.people, 0);
  const referralLevel = getLevel(inputs.referralLevel ?? 3);
  const referralCampaigns = normalizedReferralCampaigns(
    inputs.referralCampaigns,
  );
  const referralCadence =
    inputs.referralCadence ?? "release-funded";
  const funding = calculateStrategyFunding(
    startingLevel.id,
    inputs.strategy,
    inputs.startingCampaigns,
    inputs.continuationMode,
  );
  const referralEstimates = calculateReferralCadenceEstimates({
    people,
    level: referralLevel.id,
    campaignsPerPerson: referralCampaigns,
  });
  const referralReleaseCents = toCents(
    people * referralCampaigns * referralLevel.referralCommission,
  );
  const synchronizedPlan =
    funding.replacementCampaigns === 0 &&
    referralCadence === "release-funded"
      ? buildSynchronizedStartSmallPlan(
          startingLevel.id,
          funding.startingCampaigns,
          referralReleaseCents,
          maximumDays,
        )
      : undefined;
  const initialCampaigns = Array.from(
    { length: funding.startingCampaigns },
    () => startingLevel.id,
  );
  let campaigns: EventCampaign[] = initialCampaigns.map((level) => ({
    level,
    startedOn: 0,
  }));
  let activatedMask = levelMask(startingLevel.id);
  let walletCents = 0;
  let firstThreeCampaignsDay =
    funding.startingCampaigns === 3 ? 0 : -1;
  let firstLevelSevenDay = startingLevel.id === 7 ? 0 : -1;
  const initialActive = sortedCampaignSnapshots(campaigns);
  const initialStep: StrategyEventStep = {
    day: 0,
    label: "Initial campaign purchase",
    externalContribution: funding.neededToday,
    retiredCampaigns: [],
    releasedCampaigns: [],
    ownReleaseGross: 0,
    referralReleaseGross: 0,
    availableBeforePurchase: funding.neededToday,
    purchasedCampaigns: initialCampaigns,
    activationFeesPaid: [startingLevel.id],
    purchaseCost: funding.neededToday,
    walletAfterPurchase: 0,
    affordablePurchaseOptions: 0,
    purchaseDecision: "fixed",
    activeCampaigns: initialActive,
    lockedCampaigns: [],
  };
  const steps: StrategyEventStep[] = [initialStep];

  if (
    initialCampaigns.length === 3 &&
    initialCampaigns.every((level) => level === 7)
  ) {
    return completeStrategyResult({
      inputs,
      funding,
      referralEstimates,
      referralCadence,
      referralReleaseCents,
      goalDay: 0,
      firstThreeCampaignsDay,
      firstLevelSevenDay,
      walletCents,
      campaigns,
      steps,
    });
  }

  for (let day = 1; day <= maximumDays; day += 1) {
    const retired = campaigns.filter(
      (campaign) => campaign.startedOn + clickDays === day,
    );
    const released = campaigns.filter(
      (campaign) => campaign.startedOn + cycleDays === day,
    );
    const ownReleaseCents = released.reduce(
      (total, campaign) =>
        total + toCents(getLevel(campaign.level).earnings),
      0,
    );
    if (released.length > 0) {
      campaigns = campaigns.filter(
        (campaign) => campaign.startedOn + cycleDays !== day,
      );
      walletCents += ownReleaseCents;
    }

    const referralReleaseGrossCents =
      referralReleaseCents > 0 &&
      referralReleaseOccurs(day, referralCadence)
        ? referralReleaseCents
        : 0;
    walletCents += referralReleaseGrossCents;

    const externalContributionCents =
      day === clickDays ? toCents(funding.neededByDay12) : 0;
    walletCents += externalContributionCents;

    const isEvent =
      retired.length > 0 ||
      released.length > 0 ||
      referralReleaseGrossCents > 0 ||
      externalContributionCents > 0;
    if (!isEvent) continue;

    const availableBeforePurchaseCents = walletCents;
    const purchasedCampaigns: number[] = [];
    const activationFeesPaid: number[] = [];
    let purchaseCostCents = 0;

    if (
      day === clickDays &&
      funding.replacementCampaigns > 0
    ) {
      const replacementCostCents =
        toCents(startingLevel.campaign) *
        funding.replacementCampaigns;
      if (replacementCostCents > walletCents) {
        throw new Error("Day-12 replacement funding is insufficient.");
      }
      walletCents -= replacementCostCents;
      purchaseCostCents += replacementCostCents;
      for (
        let index = 0;
        index < funding.replacementCampaigns;
        index += 1
      ) {
        campaigns.push({ level: startingLevel.id, startedOn: day });
        purchasedCampaigns.push(startingLevel.id);
      }
    }

    const activeCampaignsBeforeChoice = campaigns.filter((campaign) =>
      isCampaignActive(campaign, day),
    );
    const openSlots = 3 - activeCampaignsBeforeChoice.length;
    const newFundsEntered =
      ownReleaseCents > 0 ||
      referralReleaseGrossCents > 0 ||
      externalContributionCents > 0;
    const affordablePurchases =
      openSlots > 0
        ? affordableStrategyPurchases(
            walletCents,
            openSlots,
            activeCampaignsBeforeChoice.map(
              (campaign) => campaign.level,
            ),
            activatedMask,
          )
        : [];
    let choice: StrategyPurchaseChoice | undefined;
    if (options.purchaseSchedule) {
      const immediateGoal = options.allowGoalOverride
        ? chooseStrategyPurchase(
            affordablePurchases.filter(
              (candidate) => candidate.reachesGoal,
            ),
          )
        : undefined;
      const scheduledPortfolioKey = options.purchaseSchedule.get(day);
      choice =
        immediateGoal ??
        (scheduledPortfolioKey
          ? affordablePurchases.find(
              (candidate) =>
                candidate.portfolio.key === scheduledPortfolioKey,
            )
          : undefined);
      if (scheduledPortfolioKey && !choice) return undefined;
    } else if (options.override?.day === day) {
      choice = options.override?.portfolioKey
        ? affordablePurchases.find(
            (candidate) =>
              candidate.portfolio.key === options.override?.portfolioKey,
          )
        : undefined;
      if (options.override?.portfolioKey && !choice) return undefined;
    } else {
      const plannedPortfolio = synchronizedPlan?.purchasesByDay.get(day);
      if (plannedPortfolio) {
        choice = affordablePurchases.find(
          (candidate) =>
            candidate.portfolio.key === plannedPortfolio.key,
        );
        if (!choice) return undefined;
      } else if (
        !synchronizedPlan &&
        (options.allocationMode === "eager" || newFundsEntered)
      ) {
        choice = chooseStrategyPurchase(affordablePurchases);
      }
    }

    if (openSlots > 0) {
      options.onDecision?.({
        day,
        affordablePurchases,
        chosenPortfolioKey: choice?.portfolio.key,
      });
    }

    if (choice) {
      walletCents -= choice.purchaseCostCents;
      purchaseCostCents += choice.purchaseCostCents;
      activatedMask = choice.activatedMask;
      activationFeesPaid.push(
        ...levelsInMask(choice.newActivationMask),
      );
      for (const level of choice.portfolio.campaigns) {
        campaigns.push({ level, startedOn: day });
        purchasedCampaigns.push(level);
      }
    }

    const activeCampaigns = campaigns.filter((campaign) =>
      isCampaignActive(campaign, day),
    );
    const lockedCampaigns = campaigns.filter(
      (campaign) => !isCampaignActive(campaign, day),
    );
    if (
      firstThreeCampaignsDay < 0 &&
      activeCampaigns.length === 3
    ) {
      firstThreeCampaignsDay = day;
    }
    if (
      firstLevelSevenDay < 0 &&
      activeCampaigns.some((campaign) => campaign.level === 7)
    ) {
      firstLevelSevenDay = day;
    }

    const partialStep: Omit<StrategyEventStep, "label"> = {
      day,
      externalContribution: fromCents(externalContributionCents),
      retiredCampaigns: retired.map((campaign) => campaign.level),
      releasedCampaigns: released.map((campaign) => campaign.level),
      ownReleaseGross: fromCents(ownReleaseCents),
      referralReleaseGross: fromCents(
        referralReleaseGrossCents,
      ),
      availableBeforePurchase: fromCents(
        availableBeforePurchaseCents,
      ),
      purchasedCampaigns,
      activationFeesPaid,
      purchaseCost: fromCents(purchaseCostCents),
      walletAfterPurchase: fromCents(walletCents),
      affordablePurchaseOptions: affordablePurchases.length,
      purchaseDecision: choice
        ? "purchase"
        : externalContributionCents > 0 &&
            funding.replacementCampaigns > 0
          ? "fixed"
        : openSlots > 0
          ? "wait"
          : "no-open-slot",
      activeCampaigns: sortedCampaignSnapshots(activeCampaigns),
      lockedCampaigns: sortedCampaignSnapshots(lockedCampaigns),
    };
    const step: StrategyEventStep = {
      ...partialStep,
      label: strategyEventLabel(partialStep),
    };
    steps.push(step);

    const reachedGoal =
      activeCampaigns.length === 3 &&
      activeCampaigns.every((campaign) => campaign.level === 7);
    if (reachedGoal) {
      return completeStrategyResult({
        inputs,
        funding,
        referralEstimates,
        referralCadence,
        referralReleaseCents,
        goalDay: day,
        firstThreeCampaignsDay,
        firstLevelSevenDay,
        walletCents,
        campaigns,
        steps,
      });
    }
  }

  return undefined;
}

function purchaseScheduleFromResult(result: StrategyPathResult) {
  const schedule = new Map<number, string>();
  for (const step of result.steps) {
    if (step.day === 0 || step.purchaseDecision !== "purchase") continue;
    const scheduledCampaigns =
      step.day === clickDays
        ? step.purchasedCampaigns.slice(
            result.funding.replacementCampaigns,
          )
        : step.purchasedCampaigns;
    if (scheduledCampaigns.length > 0) {
      schedule.set(step.day, scheduledCampaigns.join("-"));
    }
  }
  return schedule;
}

function earliestStrategyGoalDay(
  startingLevel: number,
  startingCampaigns: number,
  replacementCampaigns: number,
) {
  if (startingLevel === 7 && startingCampaigns === 3) return 0;
  return replacementCampaigns === 0 ? cycleDays : clickDays;
}

/**
 * Returns the fastest completed path among a bounded, deterministic candidate
 * set. The set includes the synchronized exact start-small route, the prior
 * cash-entry allocation, eager refill, explicit waits, and the winning schedule
 * from one fewer starting campaign with the extra released value carried in the
 * wallet. Every affordable purchase is screened; the highest-output and
 * greatest-net-growth purchases are rolled forward after a one-decision
 * deviation. This is a fastest modeled path, not a proof of the global optimum
 * across every possible multi-decision schedule.
 */
function simulateHeuristicStrategyPath(
  inputs: StrategyPathInputs,
  maximumDays = maximumProjectionDays,
): StrategyPathResult {
  const startingLevel = getLevel(inputs.startingLevel);
  const people = normalizedCount(inputs.people, 0);
  const referralLevel = getLevel(inputs.referralLevel ?? 3);
  const referralCampaigns = normalizedReferralCampaigns(
    inputs.referralCampaigns,
  );
  const referralCadence =
    inputs.referralCadence ?? "release-funded";
  const funding = calculateStrategyFunding(
    startingLevel.id,
    inputs.strategy,
    inputs.startingCampaigns,
    inputs.continuationMode,
  );
  const startingCampaigns = funding.startingCampaigns;
  const earliestGoalDay = earliestStrategyGoalDay(
    startingLevel.id,
    startingCampaigns,
    funding.replacementCampaigns,
  );
  const cacheKey = [
    startingLevel.id,
    startingCampaigns,
    inputs.strategy,
    inputs.continuationMode ?? "legacy",
    funding.replacementCampaigns,
    people,
    referralLevel.id,
    referralCampaigns,
    referralCadence,
    maximumDays,
  ].join("|");
  const cached = strategyHeuristicPathCache.get(cacheKey);
  if (cached) return cached;

  const decisions: StrategyDecisionPoint[] = [];
  const baseline = simulateStrategyCandidate(inputs, maximumDays, {
    allocationMode: "cash-entry-only",
    onDecision: (decision) => decisions.push(decision),
  });
  if (!baseline) {
    throw new Error(
      "Three Level 7 campaigns were not reached within the event model.",
    );
  }

  let best = baseline;
  if (baseline.goalDay > 0 && funding.replacementCampaigns > 0) {
    const eager = simulateStrategyCandidate(inputs, maximumDays, {
      allocationMode: "eager",
    });
    if (eager && eager.goalDay < best.goalDay) best = eager;

    for (const decision of decisions) {
      const alternatives: Array<StrategyPurchaseChoice | undefined> = [
        undefined,
        ...limitedLookaheadPurchases(decision.affordablePurchases),
      ];
      for (const alternative of alternatives) {
        if (
          alternative?.portfolio.key === decision.chosenPortfolioKey ||
          (!alternative && !decision.chosenPortfolioKey)
        ) {
          continue;
        }
        const candidate = simulateStrategyCandidate(inputs, maximumDays, {
          allocationMode: "cash-entry-only",
          override: {
            day: decision.day,
            portfolioKey: alternative?.portfolio.key,
          },
        });
        if (candidate && candidate.goalDay < best.goalDay) best = candidate;
      }
    }
  }

  if (people > 0 && best.goalDay > earliestGoalDay) {
    try {
      const noReferralPath = simulateHeuristicStrategyPath(
        { ...inputs, people: 0 },
        maximumDays,
      );
      const ignoreReferralCash = simulateStrategyCandidate(
        inputs,
        maximumDays,
        {
          purchaseSchedule: purchaseScheduleFromResult(noReferralPath),
        },
      );
      if (ignoreReferralCash && ignoreReferralCash.goalDay < best.goalDay) {
        best = ignoreReferralCash;
      }
    } catch {
      // A short custom projection can reach the goal only with referrals.
    }
  }

  if (startingCampaigns > 1 && best.goalDay > earliestGoalDay) {
    try {
      const fewerStartingCampaignsPath = simulateHeuristicStrategyPath(
        {
          ...inputs,
          startingCampaigns: startingCampaigns - 1,
        },
        maximumDays,
      );
      const carryExtraStartingValue = simulateStrategyCandidate(
        inputs,
        maximumDays,
        {
          purchaseSchedule: purchaseScheduleFromResult(
            fewerStartingCampaignsPath,
          ),
        },
      );
      if (
        carryExtraStartingValue &&
        carryExtraStartingValue.goalDay < best.goalDay
      ) {
        best = carryExtraStartingValue;
      }
    } catch {
      // A short custom projection may be reachable only from the larger start.
    }
  }

  strategyHeuristicPathCache.set(cacheKey, best);
  return best;
}

const referralPeopleScheduleAnchors = [
  0,
  1,
  2,
  3,
  4,
  8,
  12,
  15,
  16,
  19,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
  4096,
  Number.MAX_SAFE_INTEGER,
] as const;
const strategyPathCache = new Map<string, StrategyPathResult>();

function isBetterCompletedPath(
  candidate: StrategyPathResult,
  current: StrategyPathResult | undefined,
) {
  if (!current) return true;
  if (candidate.goalDay !== current.goalDay) {
    return candidate.goalDay < current.goalDay;
  }
  return (
    candidate.ongoingProjection.combinedNetWithdrawals >
    current.ongoingProjection.combinedNetWithdrawals
  );
}

/**
 * Keeps referral-count projections monotone by replaying a deterministic,
 * nested set of purchase schedules. A schedule affordable with fewer direct
 * referrals remains affordable with more; the replay may depart from its fixed
 * schedule only to complete three Level 7 campaigns immediately. Each anchor's
 * one-through-selected starting-count templates provide the same dominance for
 * additional starting campaigns. Exact common 0–4 examples, logarithmic
 * anchors, and an earliest-path sentinel preserve useful candidate variety
 * while keeping very large counts constant-time.
 */
export function simulateStrategyPath(
  inputs: StrategyPathInputs,
  maximumDays = maximumProjectionDays,
): StrategyPathResult {
  const startingLevel = getLevel(inputs.startingLevel);
  const people = normalizedCount(inputs.people, 0);
  const referralLevel = getLevel(inputs.referralLevel ?? 3);
  const referralCampaigns = normalizedReferralCampaigns(
    inputs.referralCampaigns,
  );
  const referralCadence =
    inputs.referralCadence ?? "release-funded";
  const funding = calculateStrategyFunding(
    startingLevel.id,
    inputs.strategy,
    inputs.startingCampaigns,
    inputs.continuationMode,
  );
  const startingCampaigns = funding.startingCampaigns;
  const cacheKey = [
    startingLevel.id,
    startingCampaigns,
    inputs.strategy,
    inputs.continuationMode ?? "legacy",
    funding.replacementCampaigns,
    people,
    referralLevel.id,
    referralCampaigns,
    referralCadence,
    maximumDays,
  ].join("|");
  const cached = strategyPathCache.get(cacheKey);
  if (cached) return cached;

  if (people === 0) {
    const noReferralPath = simulateHeuristicStrategyPath(
      inputs,
      maximumDays,
    );
    strategyPathCache.set(cacheKey, noReferralPath);
    return noReferralPath;
  }

  const earliestGoalDay = earliestStrategyGoalDay(
    startingLevel.id,
    startingCampaigns,
    funding.replacementCampaigns,
  );
  const eligibleAnchors = referralPeopleScheduleAnchors
    .filter(
      (anchorPeople) =>
        anchorPeople <= people ||
        anchorPeople === Number.MAX_SAFE_INTEGER,
    )
    .sort((left, right) => right - left);
  let best: StrategyPathResult | undefined;

  for (const anchorPeople of eligibleAnchors) {
    for (
      let templateStartingCampaigns = startingCampaigns;
      templateStartingCampaigns >= 1;
      templateStartingCampaigns -= 1
    ) {
      try {
        const anchorPath = simulateHeuristicStrategyPath(
          {
            ...inputs,
            startingCampaigns: templateStartingCampaigns,
            people: anchorPeople,
          },
          maximumDays,
        );
        const replayedPath = simulateStrategyCandidate(
          inputs,
          maximumDays,
          {
            purchaseSchedule: purchaseScheduleFromResult(anchorPath),
            allowGoalOverride: true,
          },
        );
        if (replayedPath && isBetterCompletedPath(replayedPath, best)) {
          best = replayedPath;
        }
      } catch {
        // Some anchor schedules cannot complete inside a short custom horizon.
      }
      if (best?.goalDay === earliestGoalDay) break;
    }
    if (best?.goalDay === earliestGoalDay) break;
  }

  if (!best) {
    throw new Error(
      "Three Level 7 campaigns were not reached within the event model.",
    );
  }

  strategyPathCache.set(cacheKey, best);
  return best;
}

export function simulateAllStrategyPaths(
  inputs: Omit<StrategyPathInputs, "strategy">,
  maximumDays = maximumProjectionDays,
) {
  return {
    "start-small": simulateStrategyPath(
      { ...inputs, strategy: "start-small" },
      maximumDays,
    ),
    "smooth-timing": simulateStrategyPath(
      { ...inputs, strategy: "smooth-timing" },
      maximumDays,
    ),
    "grow-fastest": simulateStrategyPath(
      { ...inputs, strategy: "grow-fastest" },
      maximumDays,
    ),
  } satisfies Record<CampaignStrategy, StrategyPathResult>;
}

/**
 * Compares starting one, two, or three campaigns today under one operating
 * choice. `keep-spots-moving` models the one-time day-12 bridge for the same
 * number of selected spots; later purchases follow the fastest modeled
 * reinvestment path. It does not claim a permanently ring-fenced reserve.
 */
export function simulateStartingCampaignOptions(
  inputs: StartingCampaignOptionInputs,
  maximumDays = maximumProjectionDays,
): StartingCampaignOptions {
  const strategy: CampaignStrategy =
    inputs.continuationMode === "keep-spots-moving"
      ? "grow-fastest"
      : "start-small";

  return {
    1: simulateStrategyPath(
      { ...inputs, startingCampaigns: 1, strategy },
      maximumDays,
    ),
    2: simulateStrategyPath(
      { ...inputs, startingCampaigns: 2, strategy },
      maximumDays,
    ),
    3: simulateStrategyPath(
      { ...inputs, startingCampaigns: 3, strategy },
      maximumDays,
    ),
  };
}

function optimizedResult(
  state: CompoundSearchState,
  initialCostCents: number,
  inputs: PathInputs,
): OptimizedCompoundPathResult {
  const goalStep = state.steps[state.steps.length - 1];
  const goalDay = goalStep.day;
  const nextReleaseReferralGross =
    referralGrossThroughDay(
      goalDay + cycleDays,
      inputs.people,
      inputs.referralLevel,
      inputs.referralCampaigns,
    ) -
    referralGrossThroughDay(
      goalDay,
      inputs.people,
      inputs.referralLevel,
      inputs.referralCampaigns,
    );
  const projectedExitGrossCents =
    state.walletCents +
    state.portfolio.earningsCents +
    toCents(nextReleaseReferralGross);
  const projectedExitNet =
    fromCents(projectedExitGrossCents) * withdrawalRate;
  const initialCost = fromCents(initialCostCents);
  const firstThreeCampaigns = state.steps.find(
    (step) => step.campaigns.length === 3,
  );
  const firstLevelSeven = state.steps.find((step) =>
    step.campaigns.includes(7),
  );
  const goalCampaignValue = fromCents(state.portfolio.campaignCostCents);
  const goalWallet = fromCents(state.walletCents);

  return {
    initialCost,
    goalDay,
    firstThreeCampaignsDay: firstThreeCampaigns?.day ?? -1,
    firstLevelSevenDay: firstLevelSeven?.day ?? -1,
    goalWallet,
    goalCampaignValue,
    goalInternalValue: goalCampaignValue + goalWallet,
    projectedExitDay: goalDay + cycleDays,
    projectedExitNet,
    projectedExitRoi:
      ((projectedExitNet - initialCost) / initialCost) * 100,
    steps: state.steps,
  };
}

/**
 * Finds the earliest three-Level-7 portfolio on synchronized 19-day release
 * boundaries. Every valid one-, two-, and three-campaign mix is evaluated;
 * ties at the earliest goal favor the largest remaining wallet.
 */
export function simulateOptimizedCompoundPath(
  inputs: PathInputs,
  maximumRounds = 240,
): OptimizedCompoundPathResult {
  const starting = getLevel(inputs.startingLevel);
  const initialCampaigns = Array.from(
    { length: inputs.startingCampaigns },
    () => inputs.startingLevel,
  );
  const initialPortfolio = portfolioOptions.find(
    (portfolio) => portfolio.key === initialCampaigns.join("-"),
  );

  if (!initialPortfolio) {
    throw new Error("Starting campaign selection is outside the model.");
  }

  const initialCostCents =
    initialPortfolio.campaignCostCents + toCents(starting.activation);
  const initialState: CompoundSearchState = {
    portfolio: initialPortfolio,
    activatedMask: levelMask(inputs.startingLevel),
    walletCents: 0,
    steps: [
      {
        round: 0,
        day: 0,
        campaigns: initialCampaigns,
        availableBeforePurchase: fromCents(initialCostCents),
        purchaseCost: fromCents(initialCostCents),
        walletAfterPurchase: 0,
      },
    ],
  };

  if (initialPortfolio.key === goalPortfolioKey) {
    return optimizedResult(initialState, initialCostCents, inputs);
  }

  let states = new Map<string, CompoundSearchState>([
    [`${initialPortfolio.key}|${initialState.activatedMask}`, initialState],
  ]);

  for (let round = 1; round <= maximumRounds; round += 1) {
    const day = round * cycleDays;
    const previousDay = (round - 1) * cycleDays;
    const referralGrossCents = toCents(
      referralGrossThroughDay(
        day,
        inputs.people,
        inputs.referralLevel,
        inputs.referralCampaigns,
      ) -
        referralGrossThroughDay(
          previousDay,
          inputs.people,
          inputs.referralLevel,
          inputs.referralCampaigns,
        ),
    );
    const nextStates = new Map<string, CompoundSearchState>();

    for (const state of states.values()) {
      const availableCents =
        state.walletCents + state.portfolio.earningsCents + referralGrossCents;

      for (const portfolio of portfolioOptions) {
        const newActivationMask =
          portfolio.activationMask & ~state.activatedMask;
        const purchaseCostCents =
          portfolio.campaignCostCents +
          activationCostCents(newActivationMask);

        if (purchaseCostCents > availableCents) continue;

        const activatedMask = state.activatedMask | portfolio.activationMask;
        const walletCents = availableCents - purchaseCostCents;
        const key = `${portfolio.key}|${activatedMask}`;
        const existing = nextStates.get(key);

        if (existing && existing.walletCents >= walletCents) continue;

        nextStates.set(key, {
          portfolio,
          activatedMask,
          walletCents,
          steps: [
            ...state.steps,
            {
              round,
              day,
              campaigns: portfolio.campaigns,
              availableBeforePurchase: fromCents(availableCents),
              purchaseCost: fromCents(purchaseCostCents),
              walletAfterPurchase: fromCents(walletCents),
            },
          ],
        });
      }
    }

    const goalStates = Array.from(nextStates.values()).filter(
      (state) => state.portfolio.key === goalPortfolioKey,
    );
    if (goalStates.length > 0) {
      const bestGoal = goalStates.reduce((best, state) =>
        state.walletCents > best.walletCents ? state : best,
      );
      return optimizedResult(bestGoal, initialCostCents, inputs);
    }

    states = nextStates;
  }

  throw new Error("Three Level 7 campaigns were not reached within the model.");
}

function campaignValue(campaigns: CampaignLane[]) {
  return campaigns.reduce(
    (total, campaign) => total + getLevel(campaign.level).campaign,
    0,
  );
}

/**
 * Models the Build momentum path as a daily cash ledger. Available campaign
 * value and referral commissions are compounded until three Level 7 campaigns
 * are active. After that milestone, every campaign is replaced at Level 7 and
 * the remaining value is counted as net cash after the modeled withdrawal fee.
 */
export function simulateCompoundPath(
  {
    startingLevel,
    startingCampaigns,
    people,
    referralLevel,
    referralCampaigns,
  }: PathInputs,
  projectionDays = maximumProjectionDays,
): CompoundPathResult {
  const starting = getLevel(startingLevel);
  const campaigns: CampaignLane[] = Array.from(
    { length: startingCampaigns },
    (_, index) => ({
      level: startingLevel,
      availableOn: cycleDays + index * 7,
    }),
  );
  const activatedLevels = new Set([startingLevel]);
  const cashAvailableByDay = Array.from(
    { length: projectionDays + 1 },
    () => 0,
  );
  const campaignValueByDay = Array.from(
    { length: projectionDays + 1 },
    () => 0,
  );

  let wallet = 0;
  let minimumWallet = 0;
  let netCashAvailable = 0;
  let threeCampaignsDay = campaigns.length === 3 ? 0 : -1;
  let firstLevelSevenDay = campaigns.some((campaign) => campaign.level === 7)
    ? 0
    : -1;
  let goalDay =
    campaigns.length === 3 &&
    campaigns.every((campaign) => campaign.level === 7)
      ? 0
      : -1;
  let harvesting = goalDay === 0;

  campaignValueByDay[0] = campaignValue(campaigns);

  for (let day = 1; day <= projectionDays; day += 1) {
    const referralCommission = referralCommissionForDay(
      day,
      people,
      referralLevel,
      referralCampaigns,
    );

    if (harvesting) {
      netCashAvailable += referralCommission * withdrawalRate;
    } else {
      wallet += referralCommission;
    }

    const campaignCountBeforeCompletion = campaigns.length;
    const completing = campaigns.filter(
      (campaign) => campaign.availableOn === day,
    );

    if (completing.length > 0) {
      for (const campaign of completing) {
        const index = campaigns.indexOf(campaign);
        if (index >= 0) campaigns.splice(index, 1);
        wallet += getLevel(campaign.level).earnings;
      }

      for (let index = 0; index < completing.length; index += 1) {
        const campaign = completing[index];
        let nextLevel = campaign.level;

        if (!harvesting && campaignCountBeforeCompletion === 3 && campaign.level < 7) {
          const upgrade = getLevel(campaign.level + 1);
          const upgradeCost =
            upgrade.campaign +
            (activatedLevels.has(upgrade.id) ? 0 : upgrade.activation);
          const laterReplacementReserve = completing
            .slice(index + 1)
            .reduce(
              (total, laterCampaign) =>
                total + getLevel(laterCampaign.level).campaign,
              0,
            );

          if (wallet + epsilon >= upgradeCost + laterReplacementReserve) {
            nextLevel = upgrade.id;
          }
        }

        const next = getLevel(nextLevel);
        const purchaseCost =
          next.campaign +
          (activatedLevels.has(nextLevel) ? 0 : next.activation);

        // A completed campaign always produces enough value to replace itself.
        // The upgrade check above also reserves the cost of every other campaign
        // completing on the same day, so the ledger never spends future funds.
        if (wallet + epsilon < purchaseCost) {
          throw new Error("Campaign replacement exceeded available value.");
        }

        wallet -= purchaseCost;
        if (Math.abs(wallet) < epsilon) wallet = 0;
        minimumWallet = Math.min(minimumWallet, wallet);
        activatedLevels.add(nextLevel);
        campaigns.push({
          level: nextLevel,
          availableOn: day + cycleDays,
        });
      }
    }

    if (!harvesting) {
      while (campaigns.length < 3 && wallet + epsilon >= starting.campaign) {
        wallet -= starting.campaign;
        if (Math.abs(wallet) < epsilon) wallet = 0;
        minimumWallet = Math.min(minimumWallet, wallet);
        campaigns.push({
          level: startingLevel,
          availableOn: day + cycleDays,
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
        goalDay < 0 &&
        campaigns.length === 3 &&
        campaigns.every((campaign) => campaign.level === 7)
      ) {
        goalDay = day;
        harvesting = true;
      }
    }

    if (harvesting && wallet > epsilon) {
      netCashAvailable += wallet * withdrawalRate;
      wallet = 0;
    }

    cashAvailableByDay[day] = netCashAvailable;
    campaignValueByDay[day] = campaignValue(campaigns);
  }

  return {
    initialCost:
      starting.campaign * startingCampaigns + starting.activation,
    threeCampaignsDay,
    firstLevelSevenDay,
    goalDay,
    cashAvailableByDay,
    campaignValueByDay,
    minimumWallet,
  };
}

/** Models Start & learn or Maintain continuity with discrete release events. */
export function simulateCashPath(
  {
    startingLevel,
    startingCampaigns,
    people,
    referralLevel,
    referralCampaigns,
  }: PathInputs,
  releaseInterval: number,
  projectionDays = maximumProjectionDays,
) {
  const starting = getLevel(startingLevel);
  const cashAvailableByDay = Array.from(
    { length: projectionDays + 1 },
    () => 0,
  );
  const campaignValueByDay = Array.from(
    { length: projectionDays + 1 },
    () => starting.campaign * startingCampaigns,
  );
  const netSurplusPerRelease =
    (starting.earnings - starting.campaign) * withdrawalRate;
  let netCashAvailable = 0;

  for (let day = 1; day <= projectionDays; day += 1) {
    netCashAvailable +=
      referralCommissionForDay(
        day,
        people,
        referralLevel,
        referralCampaigns,
      ) * withdrawalRate;

    for (let campaign = 0; campaign < startingCampaigns; campaign += 1) {
      const firstRelease = cycleDays + campaign * 7;
      if (day >= firstRelease && (day - firstRelease) % releaseInterval === 0) {
        netCashAvailable += netSurplusPerRelease;
      }
    }

    cashAvailableByDay[day] = netCashAvailable;
  }

  return { cashAvailableByDay, campaignValueByDay };
}

export function monthNumber(day: number) {
  if (day < 0) return -1;
  if (day === 0) return 0;
  return Math.max(1, Math.round(day / 30));
}

export function timeLabel(day: number, locale: "en" | "fr" | "de" = "en") {
  if (locale === "de") {
    if (day < 0) return "Außerhalb dieser Simulation";
    if (day === 0) return "Ausgangspunkt";
    if (day <= 45) return `Etwa ${day} ${day === 1 ? "Tag" : "Tage"}`;
    const months = monthNumber(day);
    return `Etwa ${months} ${months === 1 ? "Monat" : "Monate"}`;
  }
  if (day < 0) return locale === "fr" ? "Au-delà de cette simulation" : "Beyond this model";
  if (day === 0) return locale === "fr" ? "Point de départ" : "Starting point";
  if (day <= 45) {
    return locale === "fr"
      ? `Environ ${day} jour${day === 1 ? "" : "s"}`
      : `About ${day} ${day === 1 ? "day" : "days"}`;
  }
  const months = monthNumber(day);
  return locale === "fr"
    ? `Environ ${months} mois`
    : `About ${months} ${months === 1 ? "month" : "months"}`;
}

export function milestoneLabel(day: number) {
  if (day < 0) return "Not reached";
  if (day === 0) return "Starting point";
  if (day <= 45) return `Day ${day}`;
  return `Month ${monthNumber(day)}`;
}

export function monthlyReferralPotential(
  people: number,
  campaignCount: number,
  level: number,
) {
  return (
    (people *
      campaignCount *
      getLevel(level).referralCommission *
      30 *
      withdrawalRate) /
    cycleDays
  );
}
