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

export function timeLabel(day: number) {
  if (day < 0) return "Beyond this model";
  if (day === 0) return "Starting point";
  if (day <= 45) return `About ${day} ${day === 1 ? "day" : "days"}`;
  const months = monthNumber(day);
  return `About ${months} ${months === 1 ? "month" : "months"}`;
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
