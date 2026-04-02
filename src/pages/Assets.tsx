import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency, formatCurrencyK, formatCompactCurrency } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Check, ChevronDown, Search, Star, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/input";
import Web3News from "@/components/Web3News";
import MarketTickerTape from "@/components/MarketTickerTape";
import type { TouchEvent } from "react";

const MAX_TRENDING = 10;
type Network = "all" | "bitcoin" | "ethereum" | "solana" | "base" | "monad";
const NETWORKS = [
  {
    id: "all" as const,
    name: "All networks",
    icon: "⚡",
    image: "/Coinbase Logo.jpeg",
    pillClass: "bg-[#EEF4FF] text-[#3A5DAE] hover:bg-[#E1ECFF] dark:bg-[#1A2338] dark:text-[#AFC8FF] dark:hover:bg-[#22304D]",
    selectedPillClass: "bg-[#DFEAFE] text-[#26468E] dark:bg-[#243555] dark:text-[#D5E4FF]",
  },
  {
    id: "bitcoin" as const,
    name: "Bitcoin",
    icon: "₿",
    image: "/Bitcoin.jpeg",
    pillClass: "bg-[#FFF1E1] text-[#B56814] hover:bg-[#FFE7CF] dark:bg-[#332315] dark:text-[#F4BE7B] dark:hover:bg-[#422E1B]",
    selectedPillClass: "bg-[#FFE4C3] text-[#9B5604] ring-1 ring-inset ring-[#F4BE7B] dark:bg-[#4A311A] dark:text-[#FFD7A2] dark:ring-[#9A6A2A]",
  },
  {
    id: "ethereum" as const,
    name: "Ethereum",
    icon: "Ξ",
    image: "/ethereum.jpeg",
    pillClass: "bg-[#EEF0FF] text-[#5A68C4] hover:bg-[#E3E7FF] dark:bg-[#20263D] dark:text-[#BEC7FF] dark:hover:bg-[#29324E]",
    selectedPillClass: "bg-[#E1E5FF] text-[#4653AB] ring-1 ring-inset ring-[#B9C2FF] dark:bg-[#2D3557] dark:text-[#D7DDFF] dark:ring-[#7F8ED9]",
  },
  {
    id: "solana" as const,
    name: "Solana",
    icon: "◎",
    image: "/solana.png",
    pillClass: "bg-[#E9FFF8] text-[#17916E] hover:bg-[#DDFBF2] dark:bg-[#152D28] dark:text-[#8DE0C4] dark:hover:bg-[#1B3932]",
    selectedPillClass: "bg-[#D8F9EE] text-[#0E775A] ring-1 ring-inset ring-[#93E5CA] dark:bg-[#1F433B] dark:text-[#B3F3DE] dark:ring-[#4BAA8A]",
  },
  {
    id: "base" as const,
    name: "Base",
    icon: "🔵",
    image: "/base.jpeg",
    pillClass: "bg-[#EAF2FF] text-[#2D58D7] hover:bg-[#DDE8FF] dark:bg-[#16233C] dark:text-[#AAC3FF] dark:hover:bg-[#1D2E4D]",
    selectedPillClass: "bg-[#DBE8FF] text-[#1F47BC] ring-1 ring-inset ring-[#A4BEFF] dark:bg-[#223662] dark:text-[#D4E0FF] dark:ring-[#6F93F1]",
  },
  {
    id: "monad" as const,
    name: "Monad",
    icon: "M",
    image: "/Monad.jpeg",
    pillClass: "bg-[#F5ECFF] text-[#6E3DBF] hover:bg-[#EDDEFF] dark:bg-[#2A1D39] dark:text-[#D3B5FF] dark:hover:bg-[#36264A]",
    selectedPillClass: "bg-[#EBDDFF] text-[#5A2FA5] ring-1 ring-inset ring-[#C8A8F6] dark:bg-[#412B5C] dark:text-[#ECD9FF] dark:ring-[#8F69C8]",
  },
];

type AssetsPageProps = {
  showTrending?: boolean;
  showViewAllButton?: boolean;
  listedLimit?: number;
  showSearchBar?: boolean;
};

type RGBColor = { r: number; g: number; b: number };

const imageColorCache = new Map<string, RGBColor>();

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function adjustColor(color: RGBColor, amount: number): RGBColor {
  const target = amount < 0 ? 0 : 255;
  const factor = Math.abs(amount);
  return {
    r: clampColor((target - color.r) * factor + color.r),
    g: clampColor((target - color.g) * factor + color.g),
    b: clampColor((target - color.b) * factor + color.b),
  };
}

function toRgba({ r, g, b }: RGBColor, alpha: number) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatLiquidityPerUnit(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0.0000";
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(3);
  return value.toFixed(4);
}

function hslToRgb(h: number, s: number, l: number): RGBColor {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp >= 1 && hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp >= 2 && hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp >= 3 && hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp >= 4 && hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  return {
    r: clampColor((r1 + m) * 255),
    g: clampColor((g1 + m) * 255),
    b: clampColor((b1 + m) * 255),
  };
}

function fallbackColor(id: string): RGBColor {
  const hue = hashString(id) % 360;
  return hslToRgb(hue, 0.58, 0.46);
}

function useAverageColor(src: string, id: string): RGBColor {
  const initial = useMemo(() => fallbackColor(id), [id]);
  const [color, setColor] = useState<RGBColor>(initial);

  useEffect(() => {
    setColor(initial);
  }, [initial]);

  useEffect(() => {
    if (!src) {
      setColor(initial);
      return;
    }
    if (imageColorCache.has(src)) {
      setColor(imageColorCache.get(src)!);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const size = 16;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("missing context");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] / 255;
          if (alpha === 0) continue;
          r += data[i] * alpha;
          g += data[i + 1] * alpha;
          b += data[i + 2] * alpha;
          count += alpha;
        }
        if (count === 0) throw new Error("transparent image");
        const averaged: RGBColor = {
          r: clampColor(r / count),
          g: clampColor(g / count),
          b: clampColor(b / count),
        };
        imageColorCache.set(src, averaged);
        if (!cancelled) setColor(averaged);
      } catch (error) {
        if (!cancelled) setColor(initial);
      }
    };

    img.onerror = () => {
      if (!cancelled) setColor(initial);
    };

    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, initial]);

  return color;
}

function detectWebView(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  const search = typeof window.location !== "undefined" ? window.location.search : "";
  if (/\b(webview|wv|inapp)=?(1|true)?\b/i.test(search)) return true;

  const standalone = (navigator as unknown as { standalone?: boolean }).standalone;
  const displayModeStandalone =
    typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  const hasReactNativeBridge = typeof (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView !== "undefined";
  const hasTelegramBridge =
    typeof (window as unknown as { TelegramWebviewProxy?: unknown }).TelegramWebviewProxy !== "undefined";
  const hasFlutterBridge = typeof (window as unknown as { flutter_inappwebview?: unknown }).flutter_inappwebview !== "undefined";
  const fromAndroidApp = typeof document !== "undefined" && document.referrer.startsWith("android-app://");

  const isAndroid = /Android/.test(ua);
  const isAndroidWebView =
    isAndroid &&
    (/; wv;/.test(ua) || /\bwv\b/.test(ua) || /Version\/[\d.]+ Chrome\/[\d.]+ Mobile/.test(ua));

  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  const isIOSWebView = isIOS && !isSafari;

  const isSocialInApp =
    /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|TikTok|OKApp|Electron|Telegram|WhatsApp|WeChat|TrustWallet|MetaMaskMobile|Phantom/.test(ua);

  return Boolean(
    hasReactNativeBridge ||
    hasTelegramBridge ||
    hasFlutterBridge ||
    fromAndroidApp ||
    displayModeStandalone ||
    standalone ||
    isAndroidWebView ||
    isIOSWebView ||
    isSocialInApp
  );
}

export function AssetsPage({ showTrending = true, showViewAllButton = true, listedLimit, showSearchBar = false }: AssetsPageProps) {
  const { assets, userAssets, assetAvailable } = useApp();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("all");
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isWebview, setIsWebview] = useState(() => detectWebView());
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<Network>).detail;
      if (!detail) return;
      setSelectedNetwork(detail);
      setShowNetworkDropdown(false);
    };
    window.addEventListener("solaris-network-change", handler as EventListener);
    return () => window.removeEventListener("solaris-network-change", handler as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("solaris-network-sync", { detail: selectedNetwork }));
  }, [selectedNetwork]);

  useEffect(() => {
    setIsWebview(detectWebView());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleResize = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      // Force list view on desktop
      if (e.matches) {
        setViewMode("list");
      }
    };

    // Set initial state
    setIsDesktop(mediaQuery.matches);
    if (mediaQuery.matches || isWebview) {
      setViewMode("list");
    }

    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, [isWebview]);

  useEffect(() => {
    if ((isWebview || isDesktop) && viewMode !== "list") {
      setViewMode("list");
    }
  }, [isWebview, isDesktop, viewMode]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const handleToggleViewMode = useCallback(() => {
    setViewMode("list");
  }, []);

  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Filter by network (assign chains based on asset ID hash for demo)
    if (selectedNetwork !== "all") {
      filtered = filtered.filter((asset) => {
        const hash = asset.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const networks: Network[] = ["bitcoin", "ethereum", "solana", "base", "monad"];
        const assignedNetwork = networks[hash % networks.length];
        return assignedNetwork === selectedNetwork;
      });
    }

    // Filter by search term
    if (normalizedSearch) {
      filtered = filtered.filter((asset) => {
        const name = asset.name.toLowerCase();
        const ticker = asset.ticker?.toLowerCase() ?? "";
        const id = asset.id.toLowerCase();
        return name.includes(normalizedSearch) || ticker.includes(normalizedSearch) || id.includes(normalizedSearch);
      });
    }

    return filtered;
  }, [assets, normalizedSearch, selectedNetwork]);

  const listedAssets = filteredAssets;
  const displayListedAssets = listedLimit ? listedAssets.slice(0, listedLimit) : listedAssets;
  const totalVisibleAssets = listedAssets.length;
  const cardBorderClass = "";
  const cardMediaBorderClass = isDarkTheme ? "border-b-0" : "border-b border-slate-200/60";

  const selectedNetworkInfo = NETWORKS.find(n => n.id === selectedNetwork) || NETWORKS[0];
  const brandHeadingGradient = "linear-gradient(130deg, #7dd3fc 0%, #38bdf8 45%, #0ea5e9 100%)";
  const isGridView = false;
  const isListView = true;
  const getAssetChange = (asset: Asset) => {
    const baseHash = hashString(`${asset.id}-${asset.name}`);
    const raw = ((baseHash % 140) - 60) / 10;
    return Number(raw.toFixed(1));
  };

  const formatChange = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const changeColorClass = (value: number) => (value >= 0 ? "text-emerald-500" : "text-rose-500");

  const changeBadgeClass = (value: number) =>
    value >= 0
      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500"
      : "border-rose-500/50 bg-rose-500/15 text-rose-500";

  const isAssetLive = useCallback((asset: Asset) => {
    const available = assetAvailable[asset.id];
    const hasHuntActivity =
      typeof available === "number" && asset.cycle.initialSupply > 0 && available < asset.cycle.initialSupply;

    return hasHuntActivity;
  }, [assetAvailable]);

  const renderGridCard = (
    asset: Asset,
    change: number,
    onNavigate: () => void,
    bottomContent?: React.ReactNode,
  ) => {
    const changeClass = changeColorClass(change);
    const coinTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
    const assetLive = isAssetLive(asset);
    const stats = [
      { label: "Liquidity", value: formatCurrencyK(asset.cycle.reserve) },
      { label: "LPU", value: formatCurrency(asset.cycle.lpu) },
      { label: "CoinTag", value: formatCurrency(coinTagPrice) },
      { label: "Backing", value: formatCurrencyK(asset.params.initialReserve) },
    ];

    return (
      <div
        role="button"
        tabIndex={0}
        key={`grid-${asset.id}`}
        onClick={onNavigate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onNavigate();
          }
        }}
        className={cn(
          "group flex w-full flex-col gap-3 border-b border-border/40 pb-5 text-left transition hover:-translate-y-0.5",
          "sm:rounded-3xl sm:border sm:border-border/60 sm:bg-surface/60 sm:px-5 sm:py-5 sm:shadow-sm sm:border-b-0 sm:hover:-translate-y-1",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl sm:h-12 sm:w-12">
              <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground sm:text-base">{asset.name}</span>
                <img src="/checklist.png" alt="verified" className="h-3 w-3 opacity-80 sm:h-4 sm:w-4" />
              </div>
              <span className="text-[11px] text-muted-foreground sm:text-xs">Cycle {asset.cycle.cycle}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-sm font-semibold", changeClass)}>{formatChange(change)}</span>
            {assetLive ? <span className="text-[11px] font-semibold text-emerald-500">Live</span> : null}
          </div>
        </div>

        <div className="flex w-full flex-nowrap items-start justify-between gap-4 overflow-x-auto text-[11px] uppercase tracking-wide text-muted-foreground sm:grid sm:flex-none sm:grid-cols-4 sm:gap-5 sm:overflow-visible">
          {stats.map((stat) => (
            <div key={`${asset.id}-${stat.label}`} className="flex min-w-[4.75rem] flex-col gap-0.5 sm:min-w-0">
              <span className="text-[10px]">{stat.label}</span>
              <span className="font-mono text-sm text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
        {bottomContent}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/40 bg-surface/60 px-6 py-12 text-center shadow-inner">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">No listed assets yet</h2>
        <p className="text-sm text-muted-foreground">
          Launch a new collection or import assets to start tracking them.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate("/coin-tags")}>
        Launch an LFT
      </Button>
    </div>
  );

  const tableShellClasses = "overflow-hidden rounded-2xl bg-[#FAFAFA] dark:bg-[#151515] mb-6";
  const tableStickyColumnClasses = "bg-[#F3F3F3] dark:bg-[#111111]";

  const renderListedList = (items: Asset[]) => (
    <div className={tableShellClasses}>
      <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <Table className="min-w-[720px] text-sm">
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              {isDesktop && (
                <TableHead className={cn("w-10 border-b-0 pl-4", tableStickyColumnClasses)}>
                  <Star className="h-4 w-4 text-blue-500 fill-blue-500" />
                </TableHead>
              )}
              <TableHead className={cn("sticky left-0 z-20 min-w-[200px] text-left pl-4 sm:pl-6 border-b-0", tableStickyColumnClasses)}>Collection</TableHead>
              <TableHead className="min-w-[140px] text-right border-b-0 px-4">Liquidity</TableHead>
              <TableHead className="min-w-[140px] text-right border-b-0 px-8">LPU</TableHead>
              <TableHead className="min-w-[140px] text-right border-b-0 px-4">CoinTag</TableHead>
              <TableHead className="min-w-[160px] text-right border-b-0 pr-6">Backing Reserve</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((asset) => {
              const coinTagPrice = Math.max(4.2, asset.cycle.lpu * 0.4);
              const change = getAssetChange(asset);
              const changeText = formatChange(change);
              const changeClass = changeColorClass(change);
              const assetLive = isAssetLive(asset);
              return (
                <TableRow
                  key={asset.id}
                  className="cursor-pointer text-sm transition-colors hover:bg-surface/30 border-0 group"
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  {isDesktop && (
                    <TableCell className={cn("w-10 pl-4", tableStickyColumnClasses)} onClick={(e) => toggleFavorite(asset.id, e)}>
                      <Star
                        className={cn(
                          "h-4 w-4 transition-all hover:scale-110",
                          favorites.has(asset.id)
                            ? "fill-blue-500 text-blue-500"
                            : "text-muted-foreground/40 hover:text-muted-foreground"
                        )}
                      />
                    </TableCell>
                  )}
                  <TableCell className={cn("sticky left-0 z-10 min-w-[200px] pl-4 sm:pl-6 pr-4", tableStickyColumnClasses)}>
                    <div className="flex items-center gap-2.5 text-sm">
                      <img src={asset.image} alt={asset.name} className="h-9 w-9 rounded-full object-cover" />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground truncate">{asset.name}</span>
                          <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold ${changeClass}`}>{changeText}</span>
                          {assetLive ? <span className="text-[11px] font-semibold text-emerald-500">Live</span> : null}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[140px] text-right font-mono text-sm px-4">{formatCurrencyK(asset.cycle.reserve)}</TableCell>
                  <TableCell className="min-w-[140px] text-right font-mono text-sm px-8">{formatCurrency(asset.cycle.lpu)}</TableCell>
                  <TableCell className="min-w-[140px] text-right font-mono text-sm px-4">{formatCurrency(coinTagPrice)}</TableCell>
                  <TableCell className="min-w-[160px] text-right font-mono text-sm pl-4 pr-6">
                    {formatCurrencyK(asset.params.initialReserve)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderListedGrid = (items: Asset[]) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
      {items.map((asset) => {
        const change = getAssetChange(asset);
        return renderGridCard(asset, change, () => navigate(`/assets/${asset.id}`));
      })}
    </div>
  );

  const trendingTokens = useMemo(() => {
    if (!showTrending) return [];
    return [...listedAssets]
      .map((asset) => ({ asset, change: getAssetChange(asset) }))
      .sort((a, b) => b.change - a.change)
      .slice(0, MAX_TRENDING);
  }, [listedAssets, showTrending]);

  const TrendingTokenCard = ({ asset, change }: { asset: Asset; change: number }) => {
    const baseColor = useAverageColor(asset.image, asset.id);
    const startColor = adjustColor(baseColor, isDarkTheme ? 0.15 : 0.35);
    const endColor = adjustColor(baseColor, isDarkTheme ? -0.25 : -0.05);
    const background = `linear-gradient(135deg, ${toRgba(startColor, 0.75)}, ${toRgba(endColor, 0.9)})`;
    const isPositive = change >= 0;
    return (
      <button
        type="button"
        onClick={() => navigate(`/assets/${asset.id}`)}
        className="group flex min-w-[240px] items-center justify-between gap-4 rounded-2xl border-0 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
        style={{ backgroundImage: background }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <img src={asset.image} alt={asset.name} className="h-12 w-12 rounded-xl border border-border/40 object-cover shadow-sm" />
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="max-w-[12ch] truncate sm:max-w-[14ch]">{asset.name}</span>
              {asset.ticker && <span className="max-w-[6ch] truncate text-xs font-medium text-muted-foreground">{asset.ticker}</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-foreground">{formatCurrencyK(asset.cycle.reserve)}</span>
              <span className={`font-semibold ${isPositive ? "text-emerald-300" : "text-rose-300"}`}>{formatChange(change)}</span>
            </div>
          </div>
        </div>
        <div className="hidden h-10 w-16 items-center justify-center text-emerald-200 group-hover:text-emerald-100 sm:flex">
          <span className="text-sm font-semibold">↗</span>
        </div>
      </button>
    );
  };
  const AssetStatsOverview = ({ className }: { className?: string }) => {
    const totalVolume = (assets.reduce((sum, a) => sum + (a.cycle?.reserve || 0), 0)) * 1000;
    const totalProfit = totalVolume * 0.082; // 8.2% profit placeholder

    return (
      <section className={cn("relative -mx-4", className ?? "mb-6")}>
        <div className="px-4 py-4 grid grid-cols-2 gap-4">
          <div className="space-y-1 text-left pr-4">
            <span className="text-[14px] font-medium text-muted-foreground block">
              Total LFT volume
            </span>
            <div className="flex flex-col gap-1 items-start">
              <span className="text-2xl font-bold tracking-tight">
                {formatCompactCurrency(totalVolume)}
              </span>
              <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="text-[12px]">▼ 36.1% today</span>
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 top-4 bottom-4 w-px bg-neutral-200 dark:bg-neutral-800" />

          <div className="space-y-1 pl-4 text-right">
            <span className="text-[14px] font-medium text-muted-foreground block">
              Total profit from LFT volume
            </span>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-2xl font-bold tracking-tight">
                {formatCompactCurrency(totalProfit)}
              </span>
              <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="text-[12px]">▼ 1.79% today</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className={cn("min-h-screen", "bg-background")}>
      <main className="flex-1 pb-20 pt-4 sm:pt-6">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col pt-0 pb-4">

            {/* Status bar */}
            {showTrending && (
              <Web3News variant="mobile" className="mb-4" />
            )}


            {/* Stats overview - Unified for all */}
            <AssetStatsOverview className="mb-4" />

            <MarketTickerTape />

            {/* SearchBar - toggleable on all platforms */}
            {(showSearchBar || isSearchVisible) && (
              <div className="px-0 mb-4">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search assets..."
                  className="h-11 w-full rounded-2xl border border-border/40 bg-background/80 px-4 text-sm text-foreground focus-visible:ring-0"
                />
              </div>
            )}

            {/* Text Navigation Links - Unified */}
            <div className="flex items-center gap-6 mt-2 pb-2 overflow-x-auto no-scrollbar">
              <span className="text-[22px] font-semibold text-foreground whitespace-nowrap">
                Listed
              </span>
              {showViewAllButton && (
                <button
                  type="button"
                  onClick={() => navigate("/assets/all")}
                  className="text-[22px] font-semibold transition-colors text-muted-foreground hover:text-foreground cursor-pointer whitespace-nowrap"
                >
                  View all tokens
                </button>
              )}
            </div>

            {/* Control Buttons Row - Unified */}
            {/* Horizontal Network Selector */}
            <div className="flex items-center gap-2 mt-4 mb-4 pb-2 overflow-x-auto no-scrollbar">
              {NETWORKS.map((network) => (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => setSelectedNetwork(network.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-200 whitespace-nowrap whitespace-nowrap shadow-sm",
                    network.id === "all" ? "border-0" : "border border-transparent",
                    selectedNetwork === network.id
                      ? cn("font-semibold", network.selectedPillClass)
                      : network.pillClass
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                      {network.image ? (
                        <img src={network.image} alt={network.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px]">{network.icon}</span>
                      )}
                    </div>
                    <span className="text-sm">{network.name}</span>
                  </div>
                  {selectedNetwork === network.id && (
                    <Check className="h-3.5 w-3.5 ml-1" />
                  )}
                </button>
              ))}
            </div>

            {/* Table or Grid View - Unified */}
            {displayListedAssets.length > 0 ? (
              viewMode === "grid" ? (
                renderListedGrid(displayListedAssets)
              ) : (
                renderListedList(displayListedAssets)
              )
            ) : (
              renderEmptyState()
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default function Assets() {
  return <AssetsPage showTrending showViewAllButton listedLimit={12} />;
}
