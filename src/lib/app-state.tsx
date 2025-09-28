import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  CycleParams,
  CycleState,
  YieldIndex,
  applyCoinTagSales,
  convertLFTtoYield,
  endCycleAndSeedNext,
  initializeCycle,
  updateYieldIndex,
  redeemFinders,
  DEFAULT_SPLIT,
} from "@/domain/tokenomics";

type User = {
  usd: number;
  coinTags: number;
  lfts: number; // units held by the user in current cycle
  yieldUnits: number; // units in the consolidated index
  realizedRewards: number; // total claimed rewards
};

export type Asset = {
  id: string;
  name: string;
  params: CycleParams;
  cycle: CycleState;
  image: string; // path or data url
  ticker?: string;
  summary?: string;
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
};

const DEFAULT_PARAMS: CycleParams = {
  initialReserve: 1000,
  initialSupply: 100,
  redemptionThreshold: 200,
  split: DEFAULT_SPLIT,
};

const DEFAULT_INDEX: YieldIndex = { aggregatedLiquidity: 0, totalUnits: 0, price: 0 };

const AppCtx = createContext<(AppState & AppActions) | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<CycleParams>(DEFAULT_PARAMS);
  const [cycle, setCycle] = useState<CycleState>(() => initializeCycle(DEFAULT_PARAMS, 1));
  const [yieldIndex, setYieldIndex] = useState<YieldIndex>(DEFAULT_INDEX);
  const [availableToFind, setAvailableToFind] = useState<number>(DEFAULT_PARAMS.initialSupply);
  const [user, setUser] = useState<User>({ usd: 1000, coinTags: 0, lfts: 0, yieldUnits: 0, realizedRewards: 0 });

  // Demo assets list (separate ecosystems) for listing view
  const makeAsset = (id: string, name: string, p: CycleParams, sales: number = 0, image: string = "/placeholder.svg"): Asset => {
    let c = initializeCycle(p, 1);
    if (sales > 0) c = applyCoinTagSales(c, sales);
    return { id, name, params: p, cycle: c, image };
  };
  const [assets, setAssets] = useState<Asset[]>([
    makeAsset("alpha", "Alpha Ecosystem", { ...DEFAULT_PARAMS, initialReserve: 1200, initialSupply: 100 }, 250, "/ape.jpeg"),
    makeAsset("beta", "Beta Studio", { ...DEFAULT_PARAMS, initialReserve: 2400, initialSupply: 150 }, 650, "/azuki.jpeg"),
    makeAsset("gamma", "Gamma Labs", { ...DEFAULT_PARAMS, initialReserve: 800, initialSupply: 80 }, 120, "/doodles.jpeg"),
    makeAsset("delta", "Delta Collective", { ...DEFAULT_PARAMS, initialReserve: 1500, initialSupply: 110 }, 300, "/cool-ape.jpeg"),
    makeAsset("epsilon", "Epsilon Arts", { ...DEFAULT_PARAMS, initialReserve: 950, initialSupply: 95 }, 210, "/landers.jpeg"),
    makeAsset("zeta", "Zeta Labs", { ...DEFAULT_PARAMS, initialReserve: 1300, initialSupply: 105 }, 275, "/alios.jpeg"),
    makeAsset("theta", "Theta Network", { ...DEFAULT_PARAMS, initialReserve: 1700, initialSupply: 120 }, 420, "/digital-art.jpeg"),
    makeAsset("sigma", "Sigma Studio", { ...DEFAULT_PARAMS, initialReserve: 1100, initialSupply: 90 }, 180, "/Can.jpeg"),
    makeAsset("orion", "Orion Guild", { ...DEFAULT_PARAMS, initialReserve: 2200, initialSupply: 140 }, 700, "/N26 Expands its Footprints in Europe as Crypto Market Bounces.jpeg"),
    makeAsset("nova", "Nova Builders", { ...DEFAULT_PARAMS, initialReserve: 1050, initialSupply: 88 }, 160, "/NFTs Digital Art & Passive Income.jpeg"),
  ]);

  // Per-asset findable counters and user balances
  const [assetAvailable, setAssetAvailable] = useState<Record<string, number>>(
    () => Object.fromEntries(assets.map((a) => [a.id, a.params.initialSupply]))
  );
  const [userAssets, setUserAssets] = useState<Record<string, { coinTags: number; lfts: number }>>(
    () => Object.fromEntries(assets.map((a) => [a.id, { coinTags: 0, lfts: 0 }]))
  );

  const slugify = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
  }, []);

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setCycle(initializeCycle(DEFAULT_PARAMS, 1));
    setYieldIndex(DEFAULT_INDEX);
    setAvailableToFind(DEFAULT_PARAMS.initialSupply);
    setUser({ usd: 1000, coinTags: 0, lfts: 0, yieldUnits: 0, realizedRewards: 0 });
    setAssetAvailable(Object.fromEntries(assets.map((a) => [a.id, a.params.initialSupply])));
    setUserAssets(Object.fromEntries(assets.map((a) => [a.id, { coinTags: 0, lfts: 0 }])));
  }, [assets]);

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
      setUser((u) => ({ ...u, lfts: u.lfts - redeemed, usd: u.usd + payout }));
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
    setCycle((s) => endCycleAndSeedNext(s, params));
    setAvailableToFind(params.initialSupply);
  }, [params]);

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

  // Per‑asset purchase and discovery
  const buyAssetCoinTags = useCallback(
    (assetId: string, usdAmount: number, pricePerTag = 1) => {
      if (usdAmount <= 0 || user.usd <= 0) return;
      const idx = assets.findIndex((a) => a.id === assetId);
      if (idx < 0) return;
      const spend = Math.min(usdAmount, user.usd);
      const tags = Math.floor(spend / pricePerTag);
      if (tags <= 0) return;
      setUser((u) => ({ ...u, usd: u.usd - tags * pricePerTag }));
      setUserAssets((ua) => ({ ...ua, [assetId]: { ...ua[assetId], coinTags: (ua[assetId]?.coinTags ?? 0) + tags } }));
      setAssets((arr) => {
        const next = arr.slice();
        const asset = next[idx];
        next[idx] = { ...asset, cycle: applyCoinTagSales(asset.cycle, tags * pricePerTag) };
        return next;
      });
    },
    [assets, user.usd]
  );

  const openAssetCoinTags = useCallback(
    (assetId: string, count: number, discoveryRate = 0.2) => {
      const ua = userAssets[assetId];
      if (!ua || count <= 0 || ua.coinTags <= 0) return { found: 0, opened: 0 };
      const opened = Math.min(count, ua.coinTags);
      let found = 0;
      let remaining = assetAvailable[assetId] ?? 0;
      for (let i = 0; i < opened; i++) {
        if (remaining <= 0) break;
        if (Math.random() < discoveryRate) {
          found += 1;
          remaining -= 1;
        }
      }
      setAssetAvailable((av) => ({ ...av, [assetId]: remaining }));
      setUserAssets((prev) => ({
        ...prev,
        [assetId]: {
          coinTags: (prev[assetId]?.coinTags ?? 0) - opened,
          lfts: (prev[assetId]?.lfts ?? 0) + found,
        },
      }));
      return { found, opened };
    },
    [assetAvailable, userAssets]
  );

  const discoverAssetLFTs = useCallback((assetId: string, count = 1) => {
    if (count <= 0) return { claimed: 0 };

    let claimed = 0;
    setAssetAvailable((prev) => {
      const available = prev[assetId] ?? 0;
      claimed = Math.min(count, available);
      if (claimed <= 0) return prev;
      return { ...prev, [assetId]: available - claimed };
    });

    if (claimed <= 0) return { claimed: 0 };

    setUserAssets((prev) => ({
      ...prev,
      [assetId]: {
        coinTags: prev[assetId]?.coinTags ?? 0,
        lfts: (prev[assetId]?.lfts ?? 0) + claimed,
      },
    }));

    return { claimed };
  }, []);

  const redeemAssetLFTs = useCallback(
    (assetId: string, count: number) => {
      const owned = userAssets[assetId]?.lfts ?? 0;
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

      setUserAssets((prev) => ({
        ...prev,
        [assetId]: {
          coinTags: prev[assetId]?.coinTags ?? 0,
          lfts: Math.max(0, (prev[assetId]?.lfts ?? 0) - redeemed),
        },
      }));

      setUser((prev) => ({ ...prev, usd: prev.usd + payout }));

      return { redeemed, payout };
    },
    [userAssets],
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
      // actions
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
      openAssetCoinTags,
      discoverAssetLFTs,
      redeemAssetLFTs,
      launchAsset: ({ name, ticker, image, summary, params: launchParams, raise }) => {
        const safeName = name.trim() || "Untitled Asset";
        const baseSlug = slugify(ticker.trim() || safeName);
        let createdId = baseSlug || `asset-${Date.now()}`;
        setAssets((prev) => {
          let slug = createdId;
          let suffix = 1;
          while (prev.some((asset) => asset.id === slug)) {
            slug = `${baseSlug || "asset"}-${suffix++}`;
          }
          createdId = slug;
          const clonedSplit = launchParams.split
            ? {
                creator: launchParams.split.creator,
                reserveGrowth: launchParams.split.reserveGrowth,
                platform: launchParams.split.platform,
                liquidityContribution: launchParams.split.liquidityContribution,
                holderRewards: launchParams.split.holderRewards,
              }
            : undefined;
          const paramConfig: CycleParams = {
            ...launchParams,
            split: clonedSplit,
          };
          const initialCycle = initializeCycle(paramConfig, 1);
          const cycleAfterRaise = raise > 0 ? applyCoinTagSales(initialCycle, raise) : initialCycle;
          const nextAsset: Asset = {
            id: slug,
            name: safeName,
            params: paramConfig,
            cycle: cycleAfterRaise,
            image,
            ticker: ticker.trim(),
            summary,
          };
          return [nextAsset, ...prev];
        });
        setAssetAvailable((prev) => ({ ...prev, [createdId]: Math.max(1, launchParams.initialSupply) }));
        setUserAssets((prev) => ({ ...prev, [createdId]: { coinTags: 0, lfts: 0 } }));
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
      openAssetCoinTags,
      discoverAssetLFTs,
      redeemAssetLFTs,
      slugify,
    ]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppStateProvider");
  return ctx;
}
