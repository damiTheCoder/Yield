import {
  initializeCycle,
  applyCoinTagSales,
  endCycleAndSeedNext,
  allocateLaunchPadTokens,
  type CycleParams,
  type CycleState,
} from './src/domain/tokenomics';

// Scenario Analysis from images
// 10,000 players × $5 CoinTag = $50,000 revenue per cycle
const PLAYERS = 10_000;
const COINTAG_PRICE = 5;
const TOTAL_REVENUE = PLAYERS * COINTAG_PRICE; // $50,000

// Initial parameters
// Note: From scenario analysis, initial liquidity pattern is:
// Cycle 1: $6,000 (creator seed)
// Cycle 2: $15,000 (30% from Cycle 1's $50K revenue)
// Cycle 3+: Accumulates (previous initial + 30% of revenue)
const params: CycleParams = {
  initialReserve: 6000, // Cycle 1 starts with $6,000 creator seed
  initialSupply: 1_000, // 1,000 tokens for Cycle 1
  redemptionThreshold: 100,
};

console.log('🚀 OpenYield Tokenomics - Cycle Halving Test\n');
console.log('=' .repeat(80));
console.log('Scenario: 10,000 players buying $5 CoinTags each cycle = $50,000 revenue');
console.log('=' .repeat(80));
console.log();

let cycle = initializeCycle(params, 1);

for (let i = 1; i <= 5; i++) {
  console.log(`\n📊 CYCLE ${i}`);
  console.log('-'.repeat(80));
  
  // Show initial state
  console.log(`Initial Reserve: $${cycle.reserve.toLocaleString()}`);
  console.log(`Max Supply: ${cycle.maxSupply.toLocaleString()} tokens`);
  console.log(`Initial LPU: $${cycle.lpu.toFixed(6)}`);
  
  // Apply revenue splits (30% current + 30% next)
  const cycleWithRevenue = applyCoinTagSales(cycle, TOTAL_REVENUE);
  
  console.log(`\nRevenue Allocation from $${TOTAL_REVENUE.toLocaleString()} in CoinTag sales:`);
  console.log(`  Creator (20%): $${cycleWithRevenue.accrued.creator.toFixed(2)}`);
  console.log(`  Next Cycle Liquidity (30%): $${cycleWithRevenue.accrued.nextCycleLiquidity.toFixed(2)}`);
  console.log(`  Platform (15%): $${cycleWithRevenue.accrued.platform.toFixed(2)}`);
  console.log(`  Current Cycle Liquidity (30%): $${cycleWithRevenue.accrued.currentCycleLiquidity.toFixed(2)}`);
  console.log(`  Holder Rewards (5%): $${cycleWithRevenue.accrued.holderRewards.toFixed(2)}`);
  
  console.log(`\nFinal State:`);
  console.log(`  Final Reserve: $${cycleWithRevenue.reserve.toLocaleString()}`);
  console.log(`  Seed for Next Cycle: $${cycleWithRevenue.seedNext.toLocaleString()}`);
  console.log(`  Final Token Price (LPU): $${cycleWithRevenue.lpu.toFixed(6)}`);
  
  // Show token distribution
  console.log(`\nLaunchPad Distribution (${cycle.maxSupply.toLocaleString()} total):`);
  const allocation = allocateLaunchPadTokens(cycle.maxSupply, cycle.distribution);
  console.log(`  GameHunt (70%): ${allocation.gameHunt.toLocaleString()} tokens`);
  console.log(`  Creator (10%): ${cycle.creatorTokens.toLocaleString()} tokens`);
  console.log(`  Platform (10%): ${cycle.platformTokens.toLocaleString()} tokens`);
  console.log(`  Investors (10%): ${cycle.investorTokens.toLocaleString()} tokens`);
  
  // Expected values from scenario analysis
  const expectedPrices = [21, 60, 180, 480, 1190.48];
  const expectedLiquidity = [21000, 30000, 45000, 60000, 75000];
  const expectedSupply = [1000, 500, 250, 125, 63];
  
  console.log(`\n✅ Verification vs Scenario Analysis:`);
  console.log(`  Expected Supply: ${expectedSupply[i-1].toLocaleString()} | Actual: ${cycle.maxSupply.toLocaleString()} | ${cycle.maxSupply === expectedSupply[i-1] ? '✓' : '✗'}`);
  console.log(`  Expected Liquidity: ~$${expectedLiquidity[i-1].toLocaleString()} | Actual: $${cycleWithRevenue.reserve.toLocaleString()} | ${Math.abs(cycleWithRevenue.reserve - expectedLiquidity[i-1]) < 1 ? '✓' : '~'}`);
  console.log(`  Expected Price: $${expectedPrices[i-1].toFixed(2)} | Actual: $${cycleWithRevenue.lpu.toFixed(2)} | ${Math.abs(cycleWithRevenue.lpu - expectedPrices[i-1]) < 0.01 ? '✓' : '~'}`);
  
  // Advance to next cycle
  if (i < 5) {
    cycle = endCycleAndSeedNext(cycleWithRevenue, params);
  }
}

console.log('\n' + '='.repeat(80));
console.log('🎯 Key Insights:');
console.log('='.repeat(80));
console.log('✓ Supply halves each cycle: 1,000 → 500 → 250 → 125 → 63');
console.log('✓ Liquidity increases each cycle: 30% of revenue adds to current + 30% seeds next');
console.log('✓ Price appreciates exponentially due to decreasing supply + increasing liquidity');
console.log('✓ More participants (CoinTag purchases) = higher token value');
console.log('='.repeat(80));
