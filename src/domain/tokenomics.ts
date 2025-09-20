export type RevenueSplit = {
  creator: number; // 50%
  reserveGrowth: number; // 20% -> next cycle seed
  platform: number; // 15%
  liquidityContribution: number; // 10% -> current reserve
  holderRewards: number; // 5%
};

export const DEFAULT_SPLIT: RevenueSplit = {
  creator: 0.5,
  reserveGrowth: 0.2,
  platform: 0.15,
  liquidityContribution: 0.1,
  holderRewards: 0.05,
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
  lpu: number; // Rt / Qt
  totalSales: number; // St accumulated
  seedNext: number; // Rt+1_seed accumulates 0.20 St
  accrued: {
    creator: number;
    reserveGrowth: number;
    platform: number;
    liquidityContribution: number;
    holderRewards: number;
  };
  split: RevenueSplit;
  ended: boolean;
};

export function initializeCycle(params: CycleParams, cycle = 1): CycleState {
  const split = params.split ?? DEFAULT_SPLIT;
  const reserve = params.initialReserve;
  const supply = params.initialSupply;
  return {
    cycle,
    reserve,
    supply,
    lpu: supply > 0 ? reserve / supply : 0,
    totalSales: 0,
    seedNext: 0,
    accrued: {
      creator: 0,
      reserveGrowth: 0,
      platform: 0,
      liquidityContribution: 0,
      holderRewards: 0,
    },
    split,
    ended: false,
  };
}

export function applyCoinTagSales(state: CycleState, salesAmount: number): CycleState {
  if (state.ended || salesAmount <= 0) return state;
  const { split } = state;
  const creator = salesAmount * split.creator;
  const reserveGrowth = salesAmount * split.reserveGrowth;
  const platform = salesAmount * split.platform;
  const liquidityContribution = salesAmount * split.liquidityContribution;
  const holderRewards = salesAmount * split.holderRewards;

  const reserve = state.reserve + liquidityContribution; // uplift current cycle
  const seedNext = state.seedNext + reserveGrowth; // seed next cycle
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
      reserveGrowth: state.accrued.reserveGrowth + reserveGrowth,
      platform: state.accrued.platform + platform,
      liquidityContribution: state.accrued.liquidityContribution + liquidityContribution,
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
    lpu,
    ended,
  };
}

export function endCycleAndSeedNext(state: CycleState, params: CycleParams): CycleState {
  // Ends the current cycle and starts a new one seeded with accumulated seedNext
  const nextCycle = state.cycle + 1;
  const reserve = state.seedNext; // seed from reserveGrowth
  const supply = params.initialSupply; // reset supply per cycle
  const lpu = supply > 0 ? reserve / supply : 0;

  return {
    cycle: nextCycle,
    reserve,
    supply,
    lpu,
    totalSales: 0,
    seedNext: 0,
    accrued: {
      creator: 0,
      reserveGrowth: 0,
      platform: 0,
      liquidityContribution: 0,
      holderRewards: 0,
    },
    split: state.split,
    ended: false,
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

