import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, Bell, Gift, KeyRound, LineChart } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK, formatUnitCurrency } from "@/lib/utils";
import Web3News from "@/components/Web3News";

type NotificationPriority = "high" | "medium" | "normal";
type NotificationType = "coins_ready" | "redeemable" | "holder_rewards" | "market_phase" | "hunt_closing";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  timestamp: string;
  priority: NotificationPriority;
  asset: {
    id: string;
    name: string;
    image: string;
  };
  metrics: string[];
  primaryAction: { label: string; path: string };
  secondaryAction?: { label: string; path: string };
};

const priorityRank: Record<NotificationPriority, number> = {
  high: 3,
  medium: 2,
  normal: 1,
};

const toNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function Notifications() {
  const { assets, userAssets, assetAvailable, getAssetCoinTagCodes } = useApp();

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: Array<NotificationItem & { sortIndex: number }> = [];

    assets.forEach((asset, index) => {
      const balances = userAssets[asset.id] ?? { coinTags: 0, lfts: 0 };
      const ownedCoinTags = toNumeric(balances.coinTags);
      const ownedLfts = toNumeric(balances.lfts);
      const codes = getAssetCoinTagCodes(asset.id);
      const marketOnly = Boolean(asset.secondaryMarket?.active);
      const remainingUnits = marketOnly ? 0 : Math.max(0, assetAvailable[asset.id] ?? asset.cycle.initialSupply);
      const liquidity = marketOnly ? asset.secondaryMarket?.liquidityPool ?? asset.cycle.reserve : asset.cycle.reserve;
      const liveSupply = marketOnly ? asset.secondaryMarket?.supplyPool ?? asset.cycle.supply : asset.cycle.supply;
      const unitPrice = marketOnly
        ? asset.secondaryMarket?.walv ?? (liveSupply > 0 ? liquidity / liveSupply : 0)
        : liveSupply > 0
          ? asset.cycle.reserve / liveSupply
          : 0;
      const redeemableValue = ownedLfts * unitPrice;
      const baseAsset = {
        id: asset.id,
        name: asset.name,
        image: asset.image,
      };

      if (ownedCoinTags > 0 && !marketOnly) {
        items.push({
          id: `${asset.id}-coins-ready`,
          type: "coins_ready",
          title: "CoinTags Ready",
          content: `${ownedCoinTags} CoinTag${ownedCoinTags === 1 ? "" : "s"} are ready for ${asset.name} cycle ${asset.cycle.cycle}. Enter one key to unlock the hunt, then open as many boxes as you want.`,
          timestamp: `${index + 1}h`,
          priority: "high",
          asset: baseAsset,
          metrics: [
            `${codes.length} synced code${codes.length === 1 ? "" : "s"}`,
            `LPU ${formatUnitCurrency(unitPrice)}`,
            `Liquidity ${formatCurrencyK(liquidity)}`,
          ],
          primaryAction: { label: "Start Hunt", path: `/assets/${asset.id}/hunt` },
          secondaryAction: { label: "Open Wallet", path: "/wallet" },
          sortIndex: index,
        });
      }

      if (ownedLfts > 0 && !marketOnly) {
        items.push({
          id: `${asset.id}-redeemable`,
          type: "redeemable",
          title: "Redeemable Value Updated",
          content: `Your ${ownedLfts} ${asset.name} LFT${ownedLfts === 1 ? "" : "s"} currently redeem for ${formatCurrency(redeemableValue)} at the live reserve floor for cycle ${asset.cycle.cycle}.`,
          timestamp: `${index + 2}h`,
          priority: "high",
          asset: baseAsset,
          metrics: [
            `${ownedLfts} LFT${ownedLfts === 1 ? "" : "s"} held`,
            `Reserve ${formatCurrencyK(asset.cycle.reserve)}`,
            `Floor ${formatUnitCurrency(unitPrice)}`,
          ],
          primaryAction: { label: "Open Portfolio", path: "/portfolio" },
          secondaryAction: { label: "Asset Details", path: `/assets/${asset.id}` },
          sortIndex: index + 20,
        });
      }

      if (ownedLfts > 0 && asset.cycle.accrued.holderRewards > 0) {
        items.push({
          id: `${asset.id}-holder-rewards`,
          type: "holder_rewards",
          title: "Holder Rewards Accruing",
          content: `${asset.name} has ${formatCurrency(asset.cycle.accrued.holderRewards)} accruing to holders in the current cycle. Review portfolio rewards before the next reset.`,
          timestamp: `${index + 3}h`,
          priority: "medium",
          asset: baseAsset,
          metrics: [
            `Rewards pool ${formatCurrency(asset.cycle.accrued.holderRewards)}`,
            `Cycle ${asset.cycle.cycle}`,
            `Sales ${formatCurrency(asset.cycle.totalSales)}`,
          ],
          primaryAction: { label: "View Portfolio", path: "/portfolio" },
          secondaryAction: { label: "Open Revenue", path: "/revenue" },
          sortIndex: index + 40,
        });
      }

      if (ownedLfts > 0 && marketOnly) {
        items.push({
          id: `${asset.id}-market-phase`,
          type: "market_phase",
          title: "Market Phase Active",
          content: `${asset.name} has moved into market-only trading. WALV now anchors pricing and live redemptions are closed for this collection.`,
          timestamp: `${index + 4}h`,
          priority: "high",
          asset: baseAsset,
          metrics: [
            `WALV ${formatUnitCurrency(unitPrice)}`,
            `Pool ${formatCurrencyK(liquidity)}`,
            `${ownedLfts} LFT${ownedLfts === 1 ? "" : "s"} tracked`,
          ],
          primaryAction: { label: "Token Market", path: `/assets/${asset.id}/token` },
          secondaryAction: { label: "Open Portfolio", path: "/portfolio" },
          sortIndex: index + 60,
        });
      }

      if (!marketOnly && remainingUnits > 0 && remainingUnits <= Math.max(5, Math.floor(asset.cycle.initialSupply * 0.2))) {
        items.push({
          id: `${asset.id}-hunt-closing`,
          type: "hunt_closing",
          title: "Discovery Near Completion",
          content: `${asset.name} cycle ${asset.cycle.cycle} is close to closing. Only ${remainingUnits.toLocaleString()} hunt units remain before the cycle rolls forward.`,
          timestamp: `${index + 5}h`,
          priority: "medium",
          asset: baseAsset,
          metrics: [
            `${remainingUnits.toLocaleString()} units left`,
            `LPU ${formatUnitCurrency(unitPrice)}`,
            `Reserve ${formatCurrencyK(asset.cycle.reserve)}`,
          ],
          primaryAction: { label: "Open Hunt", path: `/assets/${asset.id}/hunt` },
          secondaryAction: { label: "Asset Details", path: `/assets/${asset.id}` },
          sortIndex: index + 80,
        });
      }
    });

    return items
      .sort((left, right) => {
        const priorityDiff = priorityRank[right.priority] - priorityRank[left.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return left.sortIndex - right.sortIndex;
      })
      .map(({ sortIndex, ...item }) => item)
      .slice(0, 12);
  }, [assetAvailable, assets, getAssetCoinTagCodes, userAssets]);

  const getNotificationIcon = (type: NotificationType) => {
    const baseClasses = "h-5 w-5";
    switch (type) {
      case "coins_ready":
        return <KeyRound className={`${baseClasses} text-blue-500`} />;
      case "redeemable":
        return <Activity className={`${baseClasses} text-emerald-500`} />;
      case "holder_rewards":
        return <Gift className={`${baseClasses} text-amber-500`} />;
      case "market_phase":
        return <LineChart className={`${baseClasses} text-violet-500`} />;
      case "hunt_closing":
        return <Bell className={`${baseClasses} text-orange-500`} />;
      default:
        return <Bell className={`${baseClasses} text-muted-foreground`} />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    if (priority === "high") {
      return <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />;
    }
    if (priority === "medium") {
      return <div className="h-2 w-2 rounded-full bg-orange-500" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-16 pt-3 sm:pt-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-8">
          <aside className="hidden lg:block lg:space-y-6 lg:pt-2">
            <Web3News variant="detail" />
          </aside>

          <div className="w-full">
            {notifications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/60 bg-surface/40 px-6 py-14 text-center">
                <h1 className="text-xl font-semibold text-foreground">No live alerts yet</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Buy CoinTags, start hunts, or hold LFTs to receive lifecycle updates here.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <Link
                    to="/assets"
                    className="inline-flex items-center justify-center rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    Browse Assets
                  </Link>
                  <Link
                    to="/wallet"
                    className="inline-flex items-center justify-center rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface/60"
                  >
                    Open Wallet
                  </Link>
                </div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border-b border-border/40 px-4 py-4 transition-colors hover:bg-surface/30"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <img
                              src={notification.asset.image}
                              alt={notification.asset.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <span className="text-sm font-bold text-foreground">{notification.asset.name}</span>
                            <span className="text-sm text-muted-foreground">·</span>
                            <span className="text-sm text-muted-foreground">{notification.timestamp}</span>
                            {getPriorityBadge(notification.priority)}
                          </div>

                          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {notification.content}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {notification.metrics.map((metric) => (
                              <span key={metric}>{metric}</span>
                            ))}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              to={notification.primaryAction.path}
                              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600"
                            >
                              {notification.primaryAction.label}
                            </Link>
                            {notification.secondaryAction ? (
                              <Link
                                to={notification.secondaryAction.path}
                                className="inline-flex items-center justify-center rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface/60"
                              >
                                {notification.secondaryAction.label}
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <div className="h-16" />
    </div>
  );
}
