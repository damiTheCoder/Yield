export type RevenueSplit = {
  creator: number; // 20%
  nextCycleLiquidity: number; // 30% -> next cycle LFT launch
  platform: number; // 15%
  currentCycleLiquidity: number; // 30% -> current cycle liquidity
  holderRewards: number; // 5%
};

export const DEFAULT_SPLIT: RevenueSplit = {
  creator: 0.2,
  nextCycleLiquidity: 0.3,
  platform: 0.15,
  currentCycleLiquidity: 0.3,
  holderRewards: 0.05,
};

// LaunchPad Token Distribution
export type LaunchPadDistribution = {
  gameHunt: number; // 60%
  creator: number; // 20%
  platform: number; // 10%
  investors: number; // 10%
};

export const DEFAULT_LAUNCHPAD_DISTRIBUTION: LaunchPadDistribution = {
  gameHunt: 0.6,
  creator: 0.2,
  platform: 0.1,
  investors: 0.1,
};

export type CycleParams = {
  initialReserve: number; // e.g., 1000
  initialSupply: number; // e.g., 100
  redemptionThreshold: number; // e.g., 200 -> end cycle threshold
  split?: RevenueSplit;
};

export type CycleState = {
  cycle: number;
  reserve: number; // Rt
  supply: number; // Qt (circulating)
  initialSupply: number; // total units at cycle start
  maxSupply: number; // maximum supply for this cycle (halving applied)
  lpu: number; // Rt / Qt
  totalSales: number; // St accumulated
  seedNext: number; // Rt+1_seed accumulates 30% of sales for next cycle
  accrued: {
    creator: number;
    nextCycleLiquidity: number;
    platform: number;
    currentCycleLiquidity: number;
    holderRewards: number;
  };
  distribution: LaunchPadDistribution;
  split: RevenueSplit;
  ended: boolean;
  // Halving tracking
  discoveredTokens: number; // Tokens found via hunt (from gameHunt allocation)
  creatorTokens: number; // Creator allocation
  platformTokens: number; // Platform allocation
  investorTokens: number; // Investor allocation
};

function getSupplyForCycle(baseSupply: number, cycle: number): number {
  if (baseSupply <= 0) return 0;
  const halvingFactor = Math.max(0, cycle - 1);
  const divisor = 2 ** halvingFactor;
  return Math.max(1, Math.floor(baseSupply / divisor));
}

export function initializeCycle(params: CycleParams, cycle = 1): CycleState {
  const split = params.split ?? DEFAULT_SPLIT;
  const distribution = DEFAULT_LAUNCHPAD_DISTRIBUTION;
  const reserve = params.initialReserve;
  const maxSupply = getSupplyForCycle(params.initialSupply, cycle);
  const supply = maxSupply; // Start with full supply available
  
  return {
    cycle,
    reserve,
    supply,
    initialSupply: supply,
    maxSupply,
    lpu: supply > 0 ? reserve / supply : 0,
    totalSales: 0,
    seedNext: 0,
    accrued: {
      creator: 0,
      nextCycleLiquidity: 0,
      platform: 0,
      currentCycleLiquidity: 0,
      holderRewards: 0,
    },
    distribution,
    split,
    ended: false,
    // LaunchPad distribution (percentages of maxSupply)
    discoveredTokens: 0, // Will be discovered via hunt (60% available)
    creatorTokens: Math.floor(maxSupply * distribution.creator), // 20%
    platformTokens: Math.floor(maxSupply * distribution.platform), // 10%
    investorTokens: Math.floor(maxSupply * distribution.investors), // 10%
  };
}

export function applyCoinTagSales(state: CycleState, salesAmount: number): CycleState {
  if (state.ended || salesAmount <= 0) return state;
  const { split } = state;
  
  // Revenue Allocation (from your images)
  const creator = salesAmount * split.creator; // 20%
  const nextCycleLiquidity = salesAmount * split.nextCycleLiquidity; // 30% -> next cycle
  const platform = salesAmount * split.platform; // 15%
  const currentCycleLiquidity = salesAmount * split.currentCycleLiquidity; // 30% -> current cycle
  const holderRewards = salesAmount * split.holderRewards; // 5%

  const reserve = state.reserve + currentCycleLiquidity; // Add 30% to current cycle liquidity
  const seedNext = state.seedNext + nextCycleLiquidity; // Add 30% to seed next cycle
  const totalSales = state.totalSales + salesAmount;
  const lpu = state.supply > 0 ? reserve / state.supply : 0;

  return {
    ...state,
    reserve,
    seedNext,
    totalSales,
    lpu,
    accrued: {
      creator: state.accrued.creator + creator,
      nextCycleLiquidity: state.accrued.nextCycleLiquidity + nextCycleLiquidity,
      platform: state.accrued.platform + platform,
      currentCycleLiquidity: state.accrued.currentCycleLiquidity + currentCycleLiquidity,
      holderRewards: state.accrued.holderRewards + holderRewards,
    },
  };
}

export function redeemFinders(state: CycleState, count: number, redemptionThreshold: number): CycleState {
  if (state.ended || count <= 0) return state;
  let { reserve, supply } = state;
  for (let i = 0; i < count; i++) {
    if (supply <= 0) break;
    const lpu = supply > 0 ? reserve / supply : 0;
    // Finder redeems at current cycle LPU; token is burned
    reserve -= lpu;
    supply -= 1;
    if (reserve <= redemptionThreshold) {
      // Stop further redemptions if we hit threshold
      break;
    }
  }
  const lpu = supply > 0 ? reserve / supply : 0;
  const ended = reserve <= redemptionThreshold || supply <= 0;
  return {
    ...state,
    reserve,
    supply,
    initialSupply: state.initialSupply,
    lpu,
    ended,
  };
}

export function endCycleAndSeedNext(state: CycleState, params: CycleParams): CycleState {
  // Ends the current cycle and starts a new one
  // Liquidity transition logic:
  // - From Cycle 1→2: Use accumulated seedNext (30% of CoinTag revenues)
  // - From Cycle 2+: Full reserve carries forward + 30% of new revenues added during cycle
  const nextCycle = state.cycle + 1;
  
  // For Cycle 1→2, use seedNext. For all others, use full ending reserve
  const reserve = (state.cycle === 1) ? state.seedNext : state.reserve;
  
  const maxSupply = getSupplyForCycle(params.initialSupply, nextCycle); // halved supply per cycle
  const supply = maxSupply;
  const lpu = supply > 0 ? reserve / supply : 0;
  const distribution = DEFAULT_LAUNCHPAD_DISTRIBUTION;

  return {
    cycle: nextCycle,
    reserve,
    supply,
    initialSupply: supply,
    maxSupply,
    lpu,
    totalSales: 0,
    seedNext: 0,
    accrued: {
      creator: 0,
      nextCycleLiquidity: 0,
      platform: 0,
      currentCycleLiquidity: 0,
      holderRewards: 0,
    },
    distribution,
    split: state.split,
    ended: false,
    // LaunchPad distribution for new cycle
    discoveredTokens: 0, // Will be discovered via hunt (60% available)
    creatorTokens: Math.floor(maxSupply * distribution.creator), // 20%
    platformTokens: Math.floor(maxSupply * distribution.platform), // 10%
    investorTokens: Math.floor(maxSupply * distribution.investors), // 10%
  };
}

export type YieldIndex = {
  // Simplified representation of the consolidated YIELD token
  aggregatedLiquidity: number; // sum of reserves across ecosystems
  totalUnits: number; // abstract units representing converted LFTs
  price: number; // aggregatedLiquidity / totalUnits (if > 0)
};

export function updateYieldIndex(index: YieldIndex, deltaLiquidity: number, deltaUnits: number): YieldIndex {
  const aggregatedLiquidity = Math.max(0, index.aggregatedLiquidity + deltaLiquidity);
  const totalUnits = Math.max(0, index.totalUnits + deltaUnits);
  const price = totalUnits > 0 ? aggregatedLiquidity / totalUnits : 0;
  return { aggregatedLiquidity, totalUnits, price };
}

export function convertLFTtoYield(state: CycleState, units: number, index: YieldIndex): { state: CycleState; index: YieldIndex } {
  // Finder converts LFTs to YIELD; redemption right resets; move value notionally to index
  const unitsToConvert = Math.min(units, state.supply);
  if (unitsToConvert <= 0) return { state, index };
  // Move intrinsic value basis to index without changing cycle reserve (no redemption)
  const lpu = state.lpu;
  const deltaLiquidity = unitsToConvert * lpu; // contributes basis to index backing
  const updatedIndex = updateYieldIndex(index, deltaLiquidity, unitsToConvert);
  // In the cycle, these LFTs leave the set available for discovery/trading
  const newSupply = state.supply - unitsToConvert;
  const newLpu = newSupply > 0 ? state.reserve / newSupply : 0;
  return {
    state: { ...state, supply: newSupply, lpu: newLpu },
    index: updatedIndex,
  };
}
