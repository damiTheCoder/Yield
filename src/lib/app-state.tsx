import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import {
  CycleParams,
  CycleState,
  RevenueSplit,
  YieldIndex,
  applyCoinTagSales,
  convertLFTtoYield,
  endCycleAndSeedNext,
  initializeCycle,
  updateYieldIndex,
  redeemFinders,
  DEFAULT_SPLIT,
  getRemainingDiscoverableTokens,
  recordLftDiscovery,
} from "@/domain/tokenomics";
import { saveState, loadState, clearState, hasStoredState, HuntProgress } from "@/lib/storage";

export const HUNT_TOKEN_SUPPLY = 1_000;
export const HUNT_TOKEN_BUNDLE = 20;
const MIN_LISTED_ASSET_RESERVE = 1_000;
const MAX_REDEMPTION_CYCLES = 5;
type User = {
  usd: number;
  coinTags: number;
  lfts: number; // units held by the user in current cycle
  yieldUnits: number; // units in the consolidated index
  realizedRewards: number; // total claimed rewards
  withdrawn: number; // total USD received from LFT redemptions
};

export type Asset = {
  id: string;
  name: string;
  params: CycleParams;
  cycle: CycleState;
  image: string; // path or data url
  network: string; // ethereum, solana, base, etc.
  ticker?: string;
  summary?: string;
  secondaryMarket?: SecondaryMarketState;
};

type CycleLiquiditySnapshot = {
  cycle: number;
  liquidity: number;
  unredeemedSupply: number;
};

type SecondaryMarketState = {
  active: boolean;
  activatedFromCycle: number | null;
  walv: number;
  liquidityPool: number;
  supplyPool: number;
  snapshots: CycleLiquiditySnapshot[];
};

type AppState = {
  params: CycleParams;
  cycle: CycleState;
  yieldIndex: YieldIndex;
  availableToFind: number; // remaining LFTs discoverable this cycle
  user: User;
  assets: Asset[];
  assetAvailable: Record<string, number>; // per-asset findable units
  userAssets: Record<string, { coinTags: number; lfts: number }>;
  assetCoinTagCodes: Record<string, string[]>;
  huntProgress: Record<string, HuntProgress>; // per-asset hunt progress
  getAssetTokenInfo: (assetId: string) => AssetTokenInfo | null;
  getAssetCoinTagCodes: (assetId: string) => string[];
};

type AppActions = {
  reset: () => void;
  buyCoinTags: (usdAmount: number, pricePerTag?: number) => void;
  openCoinTags: (count: number, discoveryRate?: number) => { found: number; opened: number };
  redeemFinders: (count: number) => { redeemed: number; payout: number };
  convertToYield: (units: number) => { converted: number };
  endCycle: () => void;
  buyYield: (usdAmount: number) => { units: number };
  sellYield: (units: number) => { usd: number };
  claimRewards: () => { claimed: number };
  buyAssetCoinTags: (assetId: string, usdAmount: number, pricePerTag?: number) => void;
  spendAssetCoinTag: (assetId: string, count?: number) => boolean;
  openAssetCoinTags: (
    assetId: string,
    count: number,
    discoveryRate?: number
  ) => { found: number; opened: number };
  discoverAssetLFTs: (assetId: string, count?: number) => { claimed: number };
  redeemAssetLFTs: (assetId: string, count: number) => { redeemed: number; payout: number };
  launchAsset: (config: {
    name: string;
    ticker: string;
    image: string;
    summary?: string;
    params: CycleParams;
    raise: number;
  }) => string;
  // Hunt-related actions
  getHuntProgress: (assetId: string) => HuntProgress;
  updateHuntProgress: (assetId: string, progress: HuntProgress) => void;
  activateAssetHuntCode: (assetId: string, code: string) => { ok: boolean; message: string; code?: string };
  claimHuntToken: (assetId: string, quantity?: number) => boolean;
  depositUsd: (amount: number) => void;
  withdrawUsd: (amount: number) => void;
};

type AssetTokenInfo = {
  symbol: string;
  supply: number;
  price: number;
  unlocked: boolean;
  remainingLfts: number;
  totalValue: number;
  walv: number;
  phase: "hunt" | "market";
  canRedeem: boolean;
};

type AssetBalances = { coinTags: number; lfts: number };

const toNumeric = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAssetBalances = (entry?: Partial<AssetBalances>): AssetBalances => ({
  coinTags: toNumeric(entry?.coinTags),
  lfts: toNumeric(entry?.lfts),
});

const normalizeCoinTagCode = (value: string): string => value.trim().toUpperCase();

const normalizeUserAssetRecord = (
  raw: Record<string, Partial<AssetBalances>> | undefined,
  assetList: Asset[],
): Record<string, AssetBalances> => {
  const normalized: Record<string, AssetBalances> = {};

  if (raw) {
    for (const [assetId, balances] of Object.entries(raw)) {
      normalized[assetId] = normalizeAssetBalances(balances);
    }
  }

  for (const asset of assetList) {
    if (!normalized[asset.id]) {
      normalized[asset.id] = { coinTags: 0, lfts: 0 };
    }
  }

  return normalized;
};

const createCoinTagCode = (assetId: string): string => {
  const prefix = assetId
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CT-${prefix}-${stamp}${random}`;
};

const createCoinTagCodes = (
  assetId: string,
  count: number,
  existingCodes: string[] = [],
): string[] => {
  const target = Math.max(0, Math.floor(count));
  if (target <= 0) return [];
  const seen = new Set(existingCodes);
  const next: string[] = [];
  while (next.length < target) {
    const code = createCoinTagCode(assetId);
    if (!seen.has(code)) {
      seen.add(code);
      next.push(code);
    }
  }
  return next;
};

const normalizeAssetCoinTagCodes = (
  rawCodes: Record<string, string[]> | undefined,
  balances: Record<string, AssetBalances>,
  assetList: Asset[],
): Record<string, string[]> => {
  const normalized: Record<string, string[]> = {};
  const keys = new Set<string>([
    ...Object.keys(rawCodes || {}),
    ...Object.keys(balances || {}),
    ...assetList.map((asset) => asset.id),
  ]);

  keys.forEach((assetId) => {
    const targetCount = Math.max(0, Math.floor(toNumeric(balances[assetId]?.coinTags)));
    const currentCodes = Array.isArray(rawCodes?.[assetId])
      ? rawCodes![assetId]
        .filter((code): code is string => typeof code === "string")
        .map((code) => code.trim())
        .filter((code) => code.length > 0)
      : [];
    const clippedCodes = currentCodes.slice(0, targetCount);
    const missing = targetCount - clippedCodes.length;
    normalized[assetId] =
      missing > 0
        ? [...clippedCodes, ...createCoinTagCodes(assetId, missing, clippedCodes)]
        : clippedCodes;
  });

  return normalized;
};

const areCoinTagCodeMapsEqual = (
  left: Record<string, string[]>,
  right: Record<string, string[]>,
): boolean => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    const a = left[key] || [];
    const b = right[key] || [];
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
  }
  return true;
};

const BLOCKED_ASSET_NAMES = new Set(["new lft drop"]);

const shouldHideAsset = (asset: Partial<Asset> | undefined): boolean => {
  const normalizedName = asset?.name?.trim().toLowerCase();
  if (!normalizedName) return false;
  return BLOCKED_ASSET_NAMES.has(normalizedName);
};

const computeHuntPoolSeed = (asset: Asset | undefined): number => {
  if (!asset) {
    return 0;
  }
  if (asset.cycle) {
    return getRemainingDiscoverableTokens(asset.cycle);
  }
  if (asset.params?.initialSupply && asset.params.initialSupply > 0) {
    return Math.floor(asset.params.initialSupply * 0.7);
  }
  return Math.floor(HUNT_TOKEN_SUPPLY * 0.7);
};

const TOKEN_SUPPLY = 1_000;
const createSecondaryMarketState = (): SecondaryMarketState => ({
  active: false,
  activatedFromCycle: null,
  walv: 0,
  liquidityPool: 0,
  supplyPool: 0,
  snapshots: [],
});

const normalizeSecondaryMarketState = (state?: Partial<SecondaryMarketState>): SecondaryMarketState => ({
  active: Boolean(state?.active),
  activatedFromCycle:
    typeof state?.activatedFromCycle === "number" && Number.isFinite(state.activatedFromCycle)
      ? state.activatedFromCycle
      : null,
  walv: toNumeric(state?.walv),
  liquidityPool: toNumeric(state?.liquidityPool),
  supplyPool: toNumeric(state?.supplyPool),
  snapshots: Array.isArray(state?.snapshots)
    ? state.snapshots
      .map((snapshot) => ({
        cycle: Math.max(1, Math.floor(toNumeric(snapshot?.cycle, 1))),
        liquidity: Math.max(0, toNumeric(snapshot?.liquidity)),
        unredeemedSupply: Math.max(0, Math.floor(toNumeric(snapshot?.unredeemedSupply))),
      }))
      .filter((snapshot) => snapshot.cycle > 0)
    : [],
});

const normalizeRevenueSplit = (split?: Partial<RevenueSplit>): RevenueSplit => ({
  creator: Math.max(0, toNumeric(split?.creator, DEFAULT_SPLIT.creator)),
  nextCycleLiquidity: Math.max(0, toNumeric(split?.nextCycleLiquidity, DEFAULT_SPLIT.nextCycleLiquidity)),
  platform: Math.max(0, toNumeric(split?.platform, DEFAULT_SPLIT.platform)),
  currentCycleLiquidity: Math.max(0, toNumeric(split?.currentCycleLiquidity, DEFAULT_SPLIT.currentCycleLiquidity)),
  holderRewards: Math.max(0, toNumeric(split?.holderRewards, DEFAULT_SPLIT.holderRewards)),
});

const normalizeCycleState = (cycle: Partial<CycleState> | undefined, params: CycleParams): CycleState => {
  const split = normalizeRevenueSplit(cycle?.split ?? params.split);
  const cycleNumber = Math.max(1, Math.floor(toNumeric(cycle?.cycle, 1)));
  const initialSupply = Math.max(1, Math.floor(toNumeric(cycle?.initialSupply, params.initialSupply || HUNT_TOKEN_SUPPLY)));
  const maxSupply = Math.max(1, Math.floor(toNumeric(cycle?.maxSupply, initialSupply)));
  const supply = Math.max(0, Math.floor(toNumeric(cycle?.supply, maxSupply)));
  const totalSales = Math.max(0, toNumeric(cycle?.totalSales));
  const salesLiquidity = totalSales * split.currentCycleLiquidity;
  const computedReserve = toNumeric(params.initialReserve) + salesLiquidity;
  const fallbackReserve = computedReserve > 0 ? computedReserve : MIN_LISTED_ASSET_RESERVE;
  const rawReserve = Math.max(0, toNumeric(cycle?.reserve));
  const reserve = rawReserve > 0 ? rawReserve : fallbackReserve;
  const normalizedParams = { ...params, initialReserve: reserve, initialSupply, split };
  const base = initializeCycle(normalizedParams, cycleNumber);
  const supplyForLpu = supply > 0 ? supply : maxSupply;

  return {
    ...base,
    ...cycle,
    cycle: cycleNumber,
    reserve,
    supply,
    initialSupply,
    maxSupply,
    lpu: supplyForLpu > 0 ? reserve / supplyForLpu : 0,
    totalSales,
    seedNext: Math.max(0, toNumeric(cycle?.seedNext, totalSales * split.nextCycleLiquidity)),
    accrued: {
      creator: Math.max(0, toNumeric(cycle?.accrued?.creator, base.accrued.creator)),
      nextCycleLiquidity: Math.max(0, toNumeric(cycle?.accrued?.nextCycleLiquidity, base.accrued.nextCycleLiquidity)),
      platform: Math.max(0, toNumeric(cycle?.accrued?.platform, base.accrued.platform)),
      currentCycleLiquidity: Math.max(0, toNumeric(cycle?.accrued?.currentCycleLiquidity, base.accrued.currentCycleLiquidity)),
      holderRewards: Math.max(0, toNumeric(cycle?.accrued?.holderRewards, base.accrued.holderRewards)),
    },
    distribution: base.distribution,
    split,
    ended: Boolean(cycle?.ended),
    discoveredTokens: Math.max(0, Math.floor(toNumeric(cycle?.discoveredTokens, base.discoveredTokens))),
    creatorTokens: base.creatorTokens,
    platformTokens: base.platformTokens,
    investorTokens: base.investorTokens,
  };
};

const normalizeRuntimeAsset = (asset: Asset): Asset => {
  const split = normalizeRevenueSplit(asset.params?.split);
  const rawSeededReserve = Math.max(toNumeric(asset.params?.initialReserve), toNumeric(asset.cycle?.reserve));
  const seededReserve = rawSeededReserve > 0 ? rawSeededReserve : MIN_LISTED_ASSET_RESERVE;
  const normalizedParams: CycleParams = {
    ...asset.params,
    initialReserve: seededReserve,
    initialSupply: Math.max(1, Math.floor(toNumeric(asset.params?.initialSupply, HUNT_TOKEN_SUPPLY))),
    redemptionThreshold: Math.max(0, toNumeric(asset.params?.redemptionThreshold, 200)),
    split,
  };

  return {
    ...asset,
    params: normalizedParams,
    cycle: normalizeCycleState(asset.cycle, normalizedParams),
    secondaryMarket: normalizeSecondaryMarketState(asset.secondaryMarket),
  };
};

const snapshotFromCycle = (cycle: CycleState): CycleLiquiditySnapshot => ({
  cycle: Math.max(1, Math.floor(toNumeric(cycle.cycle, 1))),
  liquidity: Math.max(0, toNumeric(cycle.reserve)),
  unredeemedSupply: Math.max(0, Math.floor(toNumeric(cycle.supply))),
});

const withCycleSnapshot = (market: SecondaryMarketState, snapshot: CycleLiquiditySnapshot): SecondaryMarketState => {
  const deduped = market.snapshots.filter((entry) => entry.cycle !== snapshot.cycle);
  return {
    ...market,
    snapshots: [...deduped, snapshot].sort((a, b) => a.cycle - b.cycle),
  };
};

const activateSecondaryMarket = (market: SecondaryMarketState, activationCycle: number): SecondaryMarketState => {
  const liquidityPool = market.snapshots.reduce((sum, entry) => sum + entry.liquidity, 0);
  const supplyPool = market.snapshots.reduce((sum, entry) => sum + entry.unredeemedSupply, 0);
  const walv = supplyPool > 0 ? liquidityPool / supplyPool : 0;
  return {
    ...market,
    active: true,
    activatedFromCycle: activationCycle,
    liquidityPool,
    supplyPool,
    walv,
  };
};

const DEFAULT_PARAMS: CycleParams = {
  initialReserve: 1000,
  initialSupply: TOKEN_SUPPLY,
  redemptionThreshold: 200,
  split: DEFAULT_SPLIT,
};

const DEFAULT_INDEX: YieldIndex = { aggregatedLiquidity: 0, totalUnits: 0, price: 0 };
const INITIAL_CYCLE_STATE = initializeCycle(DEFAULT_PARAMS, 1);

const AppCtx = createContext<(AppState & AppActions) | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<CycleParams>(DEFAULT_PARAMS);
  const [cycle, setCycle] = useState<CycleState>(() => INITIAL_CYCLE_STATE);
  const [yieldIndex, setYieldIndex] = useState<YieldIndex>(DEFAULT_INDEX);
  const [availableToFind, setAvailableToFind] = useState<number>(() => getRemainingDiscoverableTokens(INITIAL_CYCLE_STATE));

  // Demo assets list (separate ecosystems) for listing view
  const makeAsset = (id: string, name: string, p: CycleParams, sales: number = 0, image: string = "/placeholder.svg", network: string = "ethereum"): Asset => {
    const config: CycleParams = { ...p, initialSupply: TOKEN_SUPPLY };
    let c = initializeCycle(config, 1);
    if (sales > 0) c = applyCoinTagSales(c, sales);
    return {
      id,
      name,
      params: config,
      cycle: c,
      image,
      network,
      secondaryMarket: createSecondaryMarketState(),
    };
  };

  // Initialize state from localStorage if available
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User>(() => {
    if (typeof window !== 'undefined' && hasStoredState()) {
      const stored = loadState();
      if (stored?.user) {
        return {
          ...stored.user,
          withdrawn: stored.user.withdrawn ?? 0
        };
      }
    }
    return { usd: 0, coinTags: 0, lfts: 0, yieldUnits: 0, realizedRewards: 0, withdrawn: 0 };
  });

  const buildInitialAvailability = (assetList: Asset[]) => {
    if (!assetList || !Array.isArray(assetList)) return {};
    return Object.fromEntries(
      assetList.map((asset) => [
        asset.id,
        asset.secondaryMarket?.active ? 0 : getRemainingDiscoverableTokens(asset.cycle),
      ]),
    );
  };

  const [assets, setAssets] = useState<Asset[]>(() => {
    if (typeof window !== 'undefined' && hasStoredState()) {
      const stored = loadState();
      if (stored?.assets && Array.isArray(stored.assets) && stored.assets.length > 0) {
        return stored.assets
          .filter((asset) => !shouldHideAsset(asset))
          .map((asset) => normalizeRuntimeAsset(asset as Asset));
      }
    }
    return [
      makeAsset("alpha", "Alpha Ecosystem", { ...DEFAULT_PARAMS, initialReserve: 1200, initialSupply: 100 }, 250, "/ape.jpeg", "ethereum"),
      makeAsset("beta", "Beta Studio", { ...DEFAULT_PARAMS, initialReserve: 2400, initialSupply: 150 }, 650, "/azuki.jpeg", "solana"),
      makeAsset("gamma", "Gamma Labs", { ...DEFAULT_PARAMS, initialReserve: 800, initialSupply: 80 }, 120, "/doodles.jpeg", "base"),
      makeAsset("delta", "Delta Collective", { ...DEFAULT_PARAMS, initialReserve: 1500, initialSupply: 110 }, 300, "/cool-ape.jpeg", "ethereum"),
      makeAsset("epsilon", "Epsilon Arts", { ...DEFAULT_PARAMS, initialReserve: 950, initialSupply: 95 }, 210, "/landers.jpeg", "solana"),
      makeAsset("zeta", "Zeta Labs", { ...DEFAULT_PARAMS, initialReserve: 1300, initialSupply: 105 }, 275, "/alios.jpeg", "base"),
      makeAsset("theta", "Theta Network", { ...DEFAULT_PARAMS, initialReserve: 1700, initialSupply: 120 }, 420, "/digital-art.jpeg", "ethereum"),
      makeAsset("sigma", "Sigma Studio", { ...DEFAULT_PARAMS, initialReserve: 1100, initialSupply: 90 }, 180, "/_ (17).jpeg", "solana"),
      makeAsset("orion", "Orion Guild", { ...DEFAULT_PARAMS, initialReserve: 2200, initialSupply: 140 }, 700, "/_ (18).jpeg", "base"),
      makeAsset("nova", "Nova Builders", { ...DEFAULT_PARAMS, initialReserve: 1050, initialSupply: 88 }, 160, "/_ (19).jpeg", "ethereum"),
      makeAsset("kappa", "Kappa Syndicate", { ...DEFAULT_PARAMS, initialReserve: 1450, initialSupply: 115 }, 360, "/k1.jpeg", "solana"),
      makeAsset("lambda", "Lambda Atelier", { ...DEFAULT_PARAMS, initialReserve: 980, initialSupply: 92 }, 210, "/k2.jpeg", "base"),
      makeAsset("mu", "Mu Collective", { ...DEFAULT_PARAMS, initialReserve: 1650, initialSupply: 123 }, 410, "/k3.jpeg", "ethereum"),
      makeAsset("nu", "Nu Labs", { ...DEFAULT_PARAMS, initialReserve: 890, initialSupply: 84 }, 150, "/_ (14).jpeg", "solana"),
      makeAsset("omicron", "Omicron Vault", { ...DEFAULT_PARAMS, initialReserve: 1850, initialSupply: 132 }, 480, "/k5.jpeg", "base"),
      makeAsset("rho", "Rho Gallery", { ...DEFAULT_PARAMS, initialSupply: 108, initialReserve: 1420 }, 320, "/_ (5).jpeg", "ethereum"),
      makeAsset("tau", "Tau Vision", { ...DEFAULT_PARAMS, initialReserve: 1010, initialSupply: 90 }, 190, "/_ (6).jpeg", "solana"),
    ];
  });

  useEffect(() => {
    setAssets((prev) => {
      const normalized = prev
        .filter((asset) => !shouldHideAsset(asset))
        .map((asset) => normalizeRuntimeAsset(asset));
      if (normalized.length !== prev.length) return normalized;
      const changed = normalized.some((asset, index) => {
        const current = prev[index];
        return (
          asset.params.initialReserve !== current.params.initialReserve ||
          asset.cycle.reserve !== current.cycle.reserve ||
          asset.cycle.supply !== current.cycle.supply ||
          asset.cycle.lpu !== current.cycle.lpu ||
          Boolean(asset.secondaryMarket?.active) !== Boolean(current.secondaryMarket?.active)
        );
      });
      return changed ? normalized : prev;
    });
  }, []);

  // Per-asset findable counters and user balances
  const [assetAvailable, setAssetAvailable] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined" && hasStoredState()) {
      const stored = loadState();
      if (stored?.assetAvailable) {
        const next: Record<string, number> = {};
        assets.forEach((asset) => {
          if (!asset) return;
          if (asset.secondaryMarket?.active) {
            next[asset.id] = 0;
            return;
          }
          const maxSupply = asset.cycle ? getRemainingDiscoverableTokens(asset.cycle) : 0;
          const value = stored.assetAvailable?.[asset.id];
          next[asset.id] =
            typeof value === "number" && value > 0
              ? Math.min(maxSupply, value)
              : maxSupply;
        });
        return next;
      }
    }
    return buildInitialAvailability(assets);
  });

  const [userAssets, setUserAssets] = useState<Record<string, AssetBalances>>(() => {
    if (typeof window !== 'undefined' && hasStoredState()) {
      const stored = loadState();
      console.log('App State Debug - Loading userAssets from localStorage:', stored?.userAssets);
      return normalizeUserAssetRecord(stored?.userAssets, assets);
    }
    const defaults = normalizeUserAssetRecord(undefined, assets);
    console.log('App State Debug - Using default userAssets:', defaults);
    return defaults;
  });

  const [assetCoinTagCodes, setAssetCoinTagCodes] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined" && hasStoredState()) {
      const stored = loadState();
      const normalizedBalances = normalizeUserAssetRecord(stored?.userAssets, assets);
      return normalizeAssetCoinTagCodes(stored?.assetCoinTagCodes, normalizedBalances, assets);
    }
    const defaults = normalizeUserAssetRecord(undefined, assets);
    return normalizeAssetCoinTagCodes(undefined, defaults, assets);
  });

  const [huntProgress, setHuntProgress] = useState<Record<string, HuntProgress>>(() => {
    if (typeof window !== 'undefined' && hasStoredState()) {
      const stored = loadState();
      if (stored?.huntProgress) return stored.huntProgress;
    }
    return {};
  });

  useEffect(() => {
    setAssetAvailable((prev) => {
      let mutated = false;
      const next = { ...prev };
      assets.forEach((asset) => {
        if (asset.secondaryMarket?.active) return;
        const current = toNumeric(prev[asset.id]);
        if (current <= 0) {
          const seed = computeHuntPoolSeed(asset);
          if (seed > 0) {
            next[asset.id] = seed;
            mutated = true;
          }
        }
      });
      return mutated ? next : prev;
    });
  }, [assets]);

  useEffect(() => {
    setAssetCoinTagCodes((prev) => {
      const normalized = normalizeAssetCoinTagCodes(prev, userAssets, assets);
      return areCoinTagCodeMapsEqual(prev, normalized) ? prev : normalized;
    });
  }, [assets, userAssets]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return;
    }

    console.log('App State Debug - Saving to localStorage:', {
      userAssets,
      assetCoinTagCodes,
      user,
      assets: assets.map(a => ({ id: a.id, name: a.name }))
    });

    saveState({
      user,
      assets,
      assetAvailable,
      userAssets,
      assetCoinTagCodes,
      huntProgress,
    });
  }, [user, assets, assetAvailable, userAssets, assetCoinTagCodes, huntProgress, initialized]);

  const slugify = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
  }, []);

  const reset = useCallback(() => {
    // Clear localStorage
    clearState();

    // Reset to defaults with demo assets
    const defaultAssets = [
      makeAsset("alpha", "Alpha Ecosystem", { ...DEFAULT_PARAMS, initialReserve: 1200, initialSupply: 100 }, 250, "/ape.jpeg"),
      makeAsset("beta", "Beta Studio", { ...DEFAULT_PARAMS, initialReserve: 2400, initialSupply: 150 }, 650, "/azuki.jpeg"),
      makeAsset("gamma", "Gamma Labs", { ...DEFAULT_PARAMS, initialReserve: 800, initialSupply: 80 }, 120, "/doodles.jpeg"),
      makeAsset("delta", "Delta Collective", { ...DEFAULT_PARAMS, initialReserve: 1500, initialSupply: 110 }, 300, "/cool-ape.jpeg"),
      makeAsset("epsilon", "Epsilon Arts", { ...DEFAULT_PARAMS, initialReserve: 950, initialSupply: 95 }, 210, "/landers.jpeg"),
      makeAsset("zeta", "Zeta Labs", { ...DEFAULT_PARAMS, initialReserve: 1300, initialSupply: 105 }, 275, "/alios.jpeg"),
      makeAsset("theta", "Theta Network", { ...DEFAULT_PARAMS, initialReserve: 1700, initialSupply: 120 }, 420, "/digital-art.jpeg"),
      makeAsset("sigma", "Sigma Studio", { ...DEFAULT_PARAMS, initialReserve: 1100, initialSupply: 90 }, 180, "/_ (17).jpeg"),
      makeAsset("orion", "Orion Guild", { ...DEFAULT_PARAMS, initialReserve: 2200, initialSupply: 140 }, 700, "/_ (18).jpeg"),
      makeAsset("nova", "Nova Builders", { ...DEFAULT_PARAMS, initialReserve: 1050, initialSupply: 88 }, 160, "/_ (19).jpeg"),
      makeAsset("kappa", "Kappa Syndicate", { ...DEFAULT_PARAMS, initialReserve: 1450, initialSupply: 115 }, 360, "/k1.jpeg"),
      makeAsset("lambda", "Lambda Atelier", { ...DEFAULT_PARAMS, initialReserve: 980, initialSupply: 92 }, 210, "/k2.jpeg"),
      makeAsset("mu", "Mu Collective", { ...DEFAULT_PARAMS, initialReserve: 1650, initialSupply: 123 }, 410, "/k3.jpeg"),
      makeAsset("nu", "Nu Labs", { ...DEFAULT_PARAMS, initialReserve: 890, initialSupply: 84 }, 150, "/_ (14).jpeg"),
      makeAsset("omicron", "Omicron Vault", { ...DEFAULT_PARAMS, initialReserve: 1850, initialSupply: 132 }, 480, "/k5.jpeg"),
      makeAsset("rho", "Rho Gallery", { ...DEFAULT_PARAMS, initialSupply: 108, initialReserve: 1420 }, 320, "/_ (5).jpeg"),
      makeAsset("tau", "Tau Vision", { ...DEFAULT_PARAMS, initialReserve: 1010, initialSupply: 90 }, 190, "/_ (6).jpeg"),
    ];

    setParams(DEFAULT_PARAMS);
    const resetCycle = initializeCycle(DEFAULT_PARAMS, 1);
    setCycle(resetCycle);
    setYieldIndex(DEFAULT_INDEX);
    setAvailableToFind(getRemainingDiscoverableTokens(resetCycle));
    setUser({ usd: 0, coinTags: 0, lfts: 0, yieldUnits: 0, realizedRewards: 0, withdrawn: 0 });
    setAssets(defaultAssets);
    setAssetAvailable(buildInitialAvailability(defaultAssets));
    const resetBalances = normalizeUserAssetRecord(undefined, defaultAssets);
    setUserAssets(resetBalances);
    setAssetCoinTagCodes(normalizeAssetCoinTagCodes(undefined, resetBalances, defaultAssets));
  }, []);

  const buyCoinTags = useCallback(
    (usdAmount: number, pricePerTag = 1) => {
      if (usdAmount <= 0 || user.usd <= 0) return;
      const spend = Math.min(usdAmount, user.usd);
      const tags = Math.floor(spend / pricePerTag);
      if (tags <= 0) return;
      setUser((u) => ({ ...u, usd: u.usd - tags * pricePerTag, coinTags: u.coinTags + tags }));
      setCycle((s) => applyCoinTagSales(s, tags * pricePerTag));
    },
    [user.usd]
  );

  const openCoinTags = useCallback(
    (count: number, discoveryRate = 0.2) => {
      if (count <= 0 || user.coinTags <= 0) return { found: 0, opened: 0 };
      const opened = Math.min(count, user.coinTags);
      let found = 0;
      let remainingFindable = availableToFind;
      for (let i = 0; i < opened; i++) {
        if (remainingFindable <= 0) break;
        if (Math.random() < discoveryRate) {
          found += 1;
          remainingFindable -= 1;
        }
      }
      if (found > 0) {
        setCycle((s) => recordLftDiscovery(s, found).state);
      }
      setAvailableToFind(remainingFindable);
      setUser((u) => ({ ...u, coinTags: u.coinTags - opened, lfts: u.lfts + found }));
      return { found, opened };
    },
    [availableToFind, user.coinTags]
  );

  const redeemFindersAction = useCallback(
    (count: number) => {
      if (count <= 0 || user.lfts <= 0) return { redeemed: 0, payout: 0 };
      const toRedeem = Math.min(count, user.lfts);
      const before = cycle.reserve;
      const next = redeemFinders(cycle, toRedeem, params.redemptionThreshold);
      const payout = Math.max(0, before - next.reserve);
      const redeemed = Math.min(toRedeem, count);
      setCycle(next);
      setUser((u) => ({ ...u, lfts: u.lfts - redeemed, usd: u.usd + payout, withdrawn: u.withdrawn + payout }));
      return { redeemed, payout };
    },
    [cycle, params.redemptionThreshold, user.lfts]
  );

  const convertToYield = useCallback(
    (units: number) => {
      if (units <= 0 || user.lfts <= 0) return { converted: 0 };
      const toConvert = Math.min(units, user.lfts);
      const { state: nextState, index: nextIndex } = convertLFTtoYield(cycle, toConvert, yieldIndex);
      setCycle(nextState);
      setYieldIndex(nextIndex);
      setUser((u) => ({ ...u, lfts: u.lfts - toConvert, yieldUnits: u.yieldUnits + toConvert }));
      return { converted: toConvert };
    },
    [cycle, yieldIndex, user.lfts]
  );

  const endCycle = useCallback(() => {
    setCycle((s) => {
      const next = endCycleAndSeedNext(s, params);
      setAvailableToFind(getRemainingDiscoverableTokens(next));
      return next;
    });
  }, [params, setAvailableToFind]);

  const buyYield = useCallback(
    (usdAmount: number) => {
      if (usdAmount <= 0 || user.usd <= 0) return { units: 0 };
      const spend = Math.min(usdAmount, user.usd);
      if (yieldIndex.price <= 0) return { units: 0 };
      const units = spend / yieldIndex.price;
      const next = updateYieldIndex(yieldIndex, spend, units);
      setYieldIndex(next);
      setUser((u) => ({ ...u, usd: u.usd - spend, yieldUnits: u.yieldUnits + units }));
      return { units };
    },
    [user.usd, yieldIndex]
  );

  const sellYield = useCallback(
    (units: number) => {
      if (units <= 0 || user.yieldUnits <= 0) return { usd: 0 };
      const qty = Math.min(units, user.yieldUnits);
      const proceeds = qty * yieldIndex.price;
      const next = updateYieldIndex(yieldIndex, -proceeds, -qty);
      setYieldIndex(next);
      setUser((u) => ({ ...u, usd: u.usd + proceeds, yieldUnits: u.yieldUnits - qty }));
      return { usd: proceeds };
    },
    [user.yieldUnits, yieldIndex]
  );

  const claimRewards = useCallback(() => {
    const amount = cycle.accrued.holderRewards;
    if (amount <= 0) return { claimed: 0 };
    setCycle((s) => ({ ...s, accrued: { ...s.accrued, holderRewards: 0 } }));
    setUser((u) => ({ ...u, usd: u.usd + amount, realizedRewards: u.realizedRewards + amount }));
    return { claimed: amount };
  }, [cycle.accrued.holderRewards]);

  const depositUsd = useCallback((amount: number) => {
    const deposit = Math.max(0, Number.isFinite(amount) ? amount : 0);
    if (deposit <= 0) return;
    setUser((u) => ({ ...u, usd: u.usd + deposit }));
  }, []);

  const withdrawUsd = useCallback((amount: number) => {
    const requested = Math.max(0, Number.isFinite(amount) ? amount : 0);
    if (requested <= 0) return;
    setUser((u) => ({ ...u, usd: Math.max(0, u.usd - Math.min(requested, u.usd)) }));
  }, []);

  const advanceAssetCycle = useCallback(
    (assetId: string) => {
      let nextSupply = 0;
      setAssets((prev) => {
        const idx = prev.findIndex((asset) => asset.id === assetId);
        if (idx < 0) return prev;
        const asset = normalizeRuntimeAsset(prev[idx]);
        if (asset.secondaryMarket?.active) return prev;

        const snapshot = snapshotFromCycle(asset.cycle);
        const marketWithSnapshot = withCycleSnapshot(
          normalizeSecondaryMarketState(asset.secondaryMarket),
          snapshot,
        );

        const next = prev.slice();
        if (asset.cycle.cycle >= MAX_REDEMPTION_CYCLES) {
          const activated = activateSecondaryMarket(marketWithSnapshot, asset.cycle.cycle);
          next[idx] = {
            ...asset,
            cycle: { ...asset.cycle, ended: true },
            secondaryMarket: activated,
          };
          nextSupply = 0;
          return next;
        }

        const nextCycle = endCycleAndSeedNext(asset.cycle, asset.params);
        nextSupply = getRemainingDiscoverableTokens(nextCycle);
        next[idx] = {
          ...asset,
          cycle: nextCycle,
          secondaryMarket: marketWithSnapshot,
        };
        return next;
      });
      if (nextSupply > 0) {
        setAssetAvailable((prev) => ({ ...prev, [assetId]: nextSupply }));
      } else {
        setAssetAvailable((prev) => ({ ...prev, [assetId]: 0 }));
      }
    },
    [setAssets, setAssetAvailable],
  );
  // Per‑asset purchase and discovery
  const buyAssetCoinTags = useCallback(
    (assetId: string, usdAmount: number, pricePerTag = 1) => {
      if (usdAmount <= 0 || user.usd <= 0) return;
      const idx = assets.findIndex((a) => a.id === assetId);
      if (idx < 0) return;
      if (assets[idx]?.secondaryMarket?.active) return;
      const spend = Math.min(usdAmount, user.usd);
      const tags = Math.floor(spend / pricePerTag);
      if (tags <= 0) return;
      setUser((u) => ({ ...u, usd: u.usd - tags * pricePerTag }));
      setUserAssets((ua) => {
        const balances = normalizeAssetBalances(ua[assetId]);
        return {
          ...ua,
          [assetId]: {
            coinTags: balances.coinTags + tags,
            lfts: balances.lfts,
          },
        };
      });
      setAssetCoinTagCodes((prev) => {
        const existing = prev[assetId] || [];
        return {
          ...prev,
          [assetId]: [...existing, ...createCoinTagCodes(assetId, tags, existing)],
        };
      });
      setAssets((arr) => {
        const next = arr.slice();
        const asset = next[idx];
        next[idx] = { ...asset, cycle: applyCoinTagSales(asset.cycle, tags * pricePerTag) };
        return next;
      });
    },
    [assets, user.usd]
  );

  const spendAssetCoinTag = useCallback((assetId: string, count = 1): boolean => {
    const qty = Math.max(1, Math.floor(count));
    let spent = false;
    setUserAssets((prev) => {
      const balances = normalizeAssetBalances(prev[assetId]);
      if (balances.coinTags < qty) {
        return prev;
      }
      spent = true;
      return {
        ...prev,
        [assetId]: {
          coinTags: balances.coinTags - qty,
          lfts: balances.lfts,
        },
      };
    });
    if (spent) {
      setAssetCoinTagCodes((prev) => {
        const existing = prev[assetId] || [];
        return {
          ...prev,
          [assetId]: existing.slice(qty),
        };
      });
    }
    return spent;
  }, []);

  const openAssetCoinTags = useCallback(
    (assetId: string, count: number, discoveryRate = 0.2) => {
      const asset = assets.find((a) => a.id === assetId);
      if (asset?.secondaryMarket?.active) return { found: 0, opened: 0 };
      const ua = normalizeAssetBalances(userAssets[assetId]);
      if (count <= 0 || ua.coinTags <= 0) return { found: 0, opened: 0 };
      const opened = Math.min(count, ua.coinTags);
      let found = 0;
      let remaining = assetAvailable[assetId];
      if (remaining === undefined) {
        const asset = assets.find((a) => a.id === assetId);
        remaining = asset ? getRemainingDiscoverableTokens(asset.cycle) : 0;
      }
      for (let i = 0; i < opened; i++) {
        if (remaining <= 0) break;
        if (Math.random() < discoveryRate) {
          found += 1;
          remaining -= 1;
        }
      }
      const normalizedRemaining = Math.max(0, remaining);
      setAssetAvailable((av) => ({ ...av, [assetId]: normalizedRemaining }));
      if (found > 0) {
        setAssets((arr) => {
          const idx = arr.findIndex((entry) => entry.id === assetId);
          if (idx < 0) return arr;
          const next = arr.slice();
          const asset = next[idx];
          next[idx] = { ...asset, cycle: recordLftDiscovery(asset.cycle, found).state };
          return next;
        });
      }
      setUserAssets((prev) => {
        const balances = normalizeAssetBalances(prev[assetId]);
        return {
          ...prev,
          [assetId]: {
            coinTags: balances.coinTags - opened,
            lfts: balances.lfts + found,
          },
        };
      });
      if (opened > 0) {
        setAssetCoinTagCodes((prev) => {
          const existing = prev[assetId] || [];
          return {
            ...prev,
            [assetId]: existing.slice(opened),
          };
        });
      }
      if (normalizedRemaining <= 0 && found > 0) {
        advanceAssetCycle(assetId);
      }
      return { found, opened };
    },
    [assetAvailable, userAssets, assets, advanceAssetCycle]
  );

  const discoverAssetLFTs = useCallback((assetId: string, count = 1) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset?.secondaryMarket?.active) return { claimed: 0 };
    if (count <= 0) return { claimed: 0 };

    let claimed = 0;
    let nextAvailable = 0;
    setAssetAvailable((prev) => {
      let available = prev[assetId];
      if (available === undefined) {
        const asset = assets.find((a) => a.id === assetId);
        available = asset ? getRemainingDiscoverableTokens(asset.cycle) : 0;
      }
      claimed = Math.min(count, available);
      if (claimed <= 0) return prev;
      nextAvailable = Math.max(0, available - claimed);
      return { ...prev, [assetId]: nextAvailable };
    });

    if (claimed <= 0) return { claimed: 0 };

    setUserAssets((prev) => {
      const balances = normalizeAssetBalances(prev[assetId]);
      return {
        ...prev,
        [assetId]: {
          coinTags: balances.coinTags,
          lfts: balances.lfts + claimed,
        },
      };
    });
    setAssets((arr) => {
      const idx = arr.findIndex((entry) => entry.id === assetId);
      if (idx < 0) return arr;
      const next = arr.slice();
      const asset = next[idx];
      next[idx] = { ...asset, cycle: recordLftDiscovery(asset.cycle, claimed).state };
      return next;
    });
    if (nextAvailable <= 0 && claimed > 0) {
      advanceAssetCycle(assetId);
    }

    return { claimed };
  }, [assets, advanceAssetCycle]);

  const redeemAssetLFTs = useCallback(
    (assetId: string, count: number) => {
      const asset = assets.find((a) => a.id === assetId);
      if (asset?.secondaryMarket?.active) return { redeemed: 0, payout: 0 };
      const owned = toNumeric(userAssets[assetId]?.lfts);
      if (count <= 0 || owned <= 0) return { redeemed: 0, payout: 0 };
      const toRedeem = Math.min(Math.floor(count), owned);
      if (toRedeem <= 0) return { redeemed: 0, payout: 0 };

      let redeemed = 0;
      let payout = 0;

      setAssets((prev) => {
        const idx = prev.findIndex((asset) => asset.id === assetId);
        if (idx < 0) return prev;
        const asset = prev[idx];
        const beforeSupply = asset.cycle.supply;
        const beforeReserve = asset.cycle.reserve;
        const nextCycle = redeemFinders(asset.cycle, toRedeem, asset.params.redemptionThreshold);
        redeemed = Math.max(0, beforeSupply - nextCycle.supply);
        payout = Math.max(0, beforeReserve - nextCycle.reserve);
        if (redeemed <= 0 && payout <= 0) return prev;
        const next = prev.slice();
        next[idx] = { ...asset, cycle: nextCycle };
        return next;
      });

      if (redeemed <= 0) return { redeemed: 0, payout: 0 };

      setUserAssets((prev) => {
        const balances = normalizeAssetBalances(prev[assetId]);
        return {
          ...prev,
          [assetId]: {
            coinTags: balances.coinTags,
            lfts: Math.max(0, balances.lfts - redeemed),
          },
        };
      });

      setUser((prev) => ({ ...prev, usd: prev.usd + payout, withdrawn: prev.withdrawn + payout }));

      return { redeemed, payout };
    },
    [assets, userAssets],
  );

  // Hunt-related functions
  const getHuntProgress = useCallback(
    (assetId: string): HuntProgress => {
      return huntProgress[assetId] || { revealed: [], matched: [], failed: [], foundTokens: 0, activated: false };
    },
    [huntProgress]
  );

  const updateHuntProgress = useCallback(
    (assetId: string, progress: HuntProgress) => {
      setHuntProgress((prev) => ({
        ...prev,
        [assetId]: progress,
      }));
    },
    []
  );

  const activateAssetHuntCode = useCallback(
    (assetId: string, code: string): { ok: boolean; message: string; code?: string } => {
      const normalizedCode = normalizeCoinTagCode(code);
      if (!normalizedCode) {
        return { ok: false, message: "Enter a CoinTag key to start the hunt." };
      }

      const asset = assets.find((entry) => entry.id === assetId);
      if (!asset) {
        return { ok: false, message: "Asset not found." };
      }
      if (asset.secondaryMarket?.active) {
        return { ok: false, message: "Hunt phase has ended for this asset." };
      }

      const existingCodes = assetCoinTagCodes[assetId] || [];
      const codeIndex = existingCodes.findIndex((entry) => normalizeCoinTagCode(entry) === normalizedCode);
      if (codeIndex < 0) {
        return { ok: false, message: "That key is not active for this asset." };
      }

      const balances = normalizeAssetBalances(userAssets[assetId]);
      if (balances.coinTags <= 0) {
        return { ok: false, message: "No active CoinTag balance found for this asset." };
      }

      setAssetCoinTagCodes((prev) => {
        const currentCodes = prev[assetId] || [];
        return {
          ...prev,
          [assetId]: currentCodes.filter((entry, index) => index !== codeIndex),
        };
      });

      setUserAssets((prev) => {
        const previous = normalizeAssetBalances(prev[assetId]);
        return {
          ...prev,
          [assetId]: {
            coinTags: Math.max(0, previous.coinTags - 1),
            lfts: previous.lfts,
          },
        };
      });

      return { ok: true, message: "Hunt unlocked.", code: existingCodes[codeIndex] };
    },
    [assetCoinTagCodes, assets, userAssets],
  );

  const claimHuntToken = useCallback(
    (assetId: string, quantity: number = 1): boolean => {
      console.log(`🎯 Hunt Debug - claimHuntToken called with assetId: ${assetId}, quantity: ${quantity}`);

      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        console.error(`❌ Hunt Debug - Asset not found: ${assetId}`);
        return false;
      }

      if (asset.secondaryMarket?.active) {
        console.error(`❌ Hunt Debug - Asset ${assetId} is in market-only phase`);
        return false;
      }

      const requested = Math.max(1, Math.floor(quantity));
      let available = toNumeric(assetAvailable[assetId], getRemainingDiscoverableTokens(asset.cycle));
      if (available <= 0) {
        const replenished = computeHuntPoolSeed(asset);
        console.log(`🪙 Hunt Debug - Replenishing pool for ${assetId} with ${replenished} units`);
        available = replenished;
      }
      console.log(`📊 Hunt Debug - Available tokens: ${available}, Requested: ${requested}`);

      if (available <= 0) {
        console.error(`❌ Hunt Debug - No tokens available`);
        return false;
      }
      const actual = Math.min(requested, available);

      // Deduct from available pool
      const remaining = Math.max(0, available - actual);
      setAssetAvailable((prev) => ({
        ...prev,
        [assetId]: remaining,
      }));
      setAssets((arr) => {
        const idx = arr.findIndex((entry) => entry.id === assetId);
        if (idx < 0) return arr;
        const next = arr.slice();
        const asset = next[idx];
        next[idx] = { ...asset, cycle: recordLftDiscovery(asset.cycle, actual).state };
        return next;
      });
      if (remaining <= 0 && actual > 0) {
        advanceAssetCycle(assetId);
      }

      // Add to user's LFT balance for this asset
      setUserAssets((prev) => {
        const previous = normalizeAssetBalances(prev[assetId]);
        const newLfts = previous.lfts + actual;

        console.log(`✅ Hunt Debug - Adding ${actual} LFTs to asset ${assetId}`);
        console.log(`📈 Hunt Debug - Previous LFTs: ${previous.lfts}, New LFTs: ${newLfts}`);

        const newState = {
          ...prev,
          [assetId]: {
            coinTags: previous.coinTags,
            lfts: newLfts,
          },
        };

        console.log('💾 Hunt Debug - New userAssets state:', JSON.stringify(newState, null, 2));
        return newState;
      });

      console.log(`✨ Hunt Debug - Successfully claimed ${actual} tokens`);
      return true;
    },
    [assets, assetAvailable, advanceAssetCycle]
  );

  const getAssetTokenInfo = useCallback(
    (assetId: string): AssetTokenInfo | null => {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return null;
      const market = normalizeSecondaryMarketState(asset.secondaryMarket);
      const remaining = market.active ? 0 : (assetAvailable[assetId] ?? getRemainingDiscoverableTokens(asset.cycle));
      const unlocked = market.active || remaining <= 0;
      const totalValue = market.active ? Math.max(0, market.liquidityPool) : Math.max(0, asset.cycle.reserve);
      const supply = market.active ? Math.max(0, market.supplyPool) : asset.cycle.supply;
      const walv = supply > 0 ? totalValue / supply : 0;
      const price = walv;
      const base = (asset.ticker || asset.name).replace(/\s+/g, "");
      const symbol = `${base.toUpperCase()}-TOKEN`;
      return {
        symbol,
        supply,
        price,
        unlocked,
        remainingLfts: remaining,
        totalValue,
        walv,
        phase: market.active ? "market" : "hunt",
        canRedeem: !market.active,
      };
    },
    [assets, assetAvailable],
  );

  const getAssetCoinTagCodes = useCallback(
    (assetId: string): string[] => {
      return assetCoinTagCodes[assetId] || [];
    },
    [assetCoinTagCodes],
  );

  const value = useMemo(
    () => ({
      params,
      cycle,
      yieldIndex,
      availableToFind,
      user,
      assets,
      assetAvailable,
      userAssets,
      assetCoinTagCodes,
      huntProgress,
      getAssetTokenInfo,
      getAssetCoinTagCodes,
      reset,
      buyCoinTags,
      openCoinTags,
      redeemFinders: redeemFindersAction,
      convertToYield,
      endCycle,
      buyYield,
      sellYield,
      claimRewards,
      buyAssetCoinTags,
      spendAssetCoinTag,
      openAssetCoinTags,
      discoverAssetLFTs,
      redeemAssetLFTs,
      getHuntProgress,
      updateHuntProgress,
      activateAssetHuntCode,
      claimHuntToken,
      depositUsd,
      withdrawUsd,
      launchAsset: ({ name, ticker, image, summary, params: launchParams, raise }) => {
        const safeName = name.trim() || "Untitled Asset";
        const baseSlug = slugify(ticker.trim() || safeName);
        let createdId = baseSlug || `asset-${Date.now()}`;
        const clonedSplit = launchParams.split
          ? {
            creator: launchParams.split.creator,
            nextCycleLiquidity: launchParams.split.nextCycleLiquidity,
            platform: launchParams.split.platform,
            currentCycleLiquidity: launchParams.split.currentCycleLiquidity,
            holderRewards: launchParams.split.holderRewards,
          }
          : undefined;
        const baseSupply = TOKEN_SUPPLY;
        const paramConfig: CycleParams = {
          ...launchParams,
          initialSupply: baseSupply,
          split: clonedSplit,
        };
        const initialCycle = initializeCycle(paramConfig, 1);
        const cycleAfterRaise = raise > 0 ? applyCoinTagSales(initialCycle, raise) : initialCycle;

        setAssets((prev) => {
          let slug = createdId;
          let suffix = 1;
          while (prev.some((asset) => asset.id === slug)) {
            slug = `${baseSlug || "asset"}-${suffix++}`;
          }
          createdId = slug;
          const nextAsset: Asset = {
            id: slug,
            name: safeName,
            params: paramConfig,
            cycle: cycleAfterRaise,
            image,
            network: "ethereum",
            ticker: ticker.trim(),
            summary,
            secondaryMarket: createSecondaryMarketState(),
          };
          return [nextAsset, ...prev];
        });
        setAssetAvailable((prev) => ({ ...prev, [createdId]: getRemainingDiscoverableTokens(cycleAfterRaise) }));
        setUserAssets((prev) => ({ ...prev, [createdId]: { coinTags: 0, lfts: 0 } }));
        setAssetCoinTagCodes((prev) => ({ ...prev, [createdId]: [] }));
        return createdId;
      },
    }),
    [
      params,
      cycle,
      yieldIndex,
      availableToFind,
      user,
      assets,
      assetAvailable,
      userAssets,
      assetCoinTagCodes,
      huntProgress,
      getAssetTokenInfo,
      getAssetCoinTagCodes,
      reset,
      buyCoinTags,
      openCoinTags,
      redeemFindersAction,
      convertToYield,
      endCycle,
      buyYield,
      sellYield,
      claimRewards,
      buyAssetCoinTags,
      spendAssetCoinTag,
      openAssetCoinTags,
      discoverAssetLFTs,
      redeemAssetLFTs,
      getHuntProgress,
      updateHuntProgress,
      activateAssetHuntCode,
      claimHuntToken,
      depositUsd,
      withdrawUsd,
      slugify,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppStateProvider");
  return ctx;
}
