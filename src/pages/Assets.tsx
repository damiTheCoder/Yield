import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { Link, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency, formatCurrencyK, formatUnitCurrency } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, LayoutGrid, Rows3, Star } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Web3News from "@/components/Web3News";
import MarketTickerTape from "@/components/MarketTickerTape";
import type { TouchEvent } from "react";
import { getDiscoverableSupply } from "@/domain/tokenomics";
import { useWeb3News } from "@/hooks/useWeb3News";
import type { Web3NewsItem } from "@/hooks/useWeb3News";

const MAX_TRENDING = 10;
const ASSET_HEADER_ICONS = ["/z1.png", "/z2.png", "/z3.png", "/r1.jpeg"];
const MOBILE_ASSET_HEADER_ICONS = ["/z1.png", "/z2.png", "/z3.png", "/r1.jpeg"];
const ICON_STACK_MESSAGE = "we just felt this will make the UX design look good 😂";
type Network = "all" | "polygon" | "ethereum" | "solana" | "base" | "optimism";
const ASSET_NETWORK_IDS: Exclude<Network, "all">[] = ["polygon", "ethereum", "solana", "base", "optimism"];
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
    id: "polygon" as const,
    name: "Polygon",
    icon: "P",
    image: "/Polygon.jpeg",
    pillClass: "bg-[#F1EBFF] text-[#7049C9] hover:bg-[#E9DEFF] dark:bg-[#251E39] dark:text-[#CDBBFF] dark:hover:bg-[#30284A]",
    selectedPillClass: "bg-[#E4D8FF] text-[#5B36B5] ring-1 ring-inset ring-[#BEA5FF] dark:bg-[#3B2F60] dark:text-[#E7DDFF] dark:ring-[#8D73D6]",
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
    image: "/solana.jpeg",
    pillClass: "bg-[#CFFBE8] text-[#063B2B] hover:bg-[#B8F7DD] dark:bg-[#CFFBE8] dark:text-[#063B2B] dark:hover:bg-[#B8F7DD]",
    selectedPillClass: "bg-[#B8F7DD] text-[#063B2B] ring-1 ring-inset ring-[#5DE8B2] dark:bg-[#B8F7DD] dark:text-[#063B2B] dark:ring-[#5DE8B2]",
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
    id: "optimism" as const,
    name: "Optimism",
    icon: "O",
    image: "/Optimism.jpeg",
    pillClass: "bg-[#FFECEC] text-[#C84444] hover:bg-[#FFE0E0] dark:bg-[#3A1F22] dark:text-[#FFB8B8] dark:hover:bg-[#4A282C]",
    selectedPillClass: "bg-[#FFDADA] text-[#AD2F2F] ring-1 ring-inset ring-[#F6A6A6] dark:bg-[#5A2A30] dark:text-[#FFD6D6] dark:ring-[#D67070]",
  },
];

type AssetsPageProps = {
  showTrending?: boolean;
  showViewAllButton?: boolean;
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

function getNetworkInfo(id: Network) {
  return NETWORKS.find((network) => network.id === id) ?? NETWORKS[0];
}

function getAssetNetworkId(asset: Asset): Exclude<Network, "all"> {
  const hash = asset.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ASSET_NETWORK_IDS[hash % ASSET_NETWORK_IDS.length];
}

function getAssetNetwork(asset: Asset) {
  return getNetworkInfo(getAssetNetworkId(asset));
}

export function AssetsPage({ showTrending = true, showViewAllButton = true, showSearchBar = false }: AssetsPageProps) {
  const { assets, userAssets, assetAvailable } = useApp();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("all");
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedNews, setSelectedNews] = useState<Web3NewsItem | null>(null);
  const [activeNewsIndex, setActiveNewsIndex] = useState(1);
  const newsCarouselRef = useRef<HTMLDivElement | null>(null);
  const { news: statusNews, loading: statusNewsLoading } = useWeb3News(8);

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
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleResize = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    setIsDesktop(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isDesktop || statusNewsLoading) return;

    const itemCount = statusNews?.length ?? 0;
    if (itemCount <= 1) {
      setActiveNewsIndex(0);
      return;
    }

    const defaultIndex = 1;
    setActiveNewsIndex(defaultIndex);

    window.requestAnimationFrame(() => {
      const scroller = newsCarouselRef.current;
      const card = scroller?.querySelector<HTMLElement>("[data-news-card]");
      if (!scroller || !card) return;

      scroller.scrollLeft = card.offsetWidth * defaultIndex;
    });
  }, [isDesktop, statusNews?.length, statusNewsLoading]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const handleToggleViewMode = useCallback(() => {
    setViewMode((current) => (current === "list" ? "grid" : "list"));
  }, []);

  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Filter by network (assign chains based on asset ID hash for demo)
    if (selectedNetwork !== "all") {
      filtered = filtered.filter((asset) => {
        return getAssetNetworkId(asset) === selectedNetwork;
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
  const displayListedAssets = listedAssets;
  const totalVisibleAssets = listedAssets.length;
  const listedHeaderIcons = isDesktop ? ASSET_HEADER_ICONS : MOBILE_ASSET_HEADER_ICONS;
  const cardBorderClass = "";
  const cardMediaBorderClass = isDarkTheme ? "border-b-0" : "border-b border-slate-200/60";

  const selectedNetworkInfo = NETWORKS.find(n => n.id === selectedNetwork) || NETWORKS[0];
  const brandHeadingGradient = "linear-gradient(130deg, #7dd3fc 0%, #38bdf8 45%, #0ea5e9 100%)";
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
      typeof available === "number" && getDiscoverableSupply(asset.cycle) > 0 && available < getDiscoverableSupply(asset.cycle);

    return hasHuntActivity;
  }, [assetAvailable]);

  const renderGridCard = (
    asset: Asset,
    change: number,
    onNavigate: () => void,
    bottomContent?: React.ReactNode,
  ) => {
    const changeClass = changeColorClass(change);
    const assetLive = isAssetLive(asset);
    const safeReserve = Math.max(0, Number.isFinite(asset.cycle.reserve) ? asset.cycle.reserve : 0);
    const safeSupply = Math.max(0, Number.isFinite(asset.cycle.supply) ? asset.cycle.supply : asset.cycle.initialSupply || 0);
    const liveLpu = safeSupply > 0 ? safeReserve / safeSupply : 0;
    const coinTagPrice = Math.max(4.2, liveLpu * 0.4);
    const stats = [
      { label: "Liquidity", value: formatCurrencyK(safeReserve) },
      { label: "LPU", value: formatUnitCurrency(liveLpu) },
      { label: "CoinTag", value: formatCurrency(coinTagPrice) },
      { label: "Backing", value: formatCurrencyK(asset.params.initialReserve) },
    ];
    const projectStory =
      asset.summary?.trim() ||
      `Collection: ${asset.name} • By OpenYield Labs. Outline the story behind this artifact and why finders will want to activate your CoinTag campaign.`;

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
          "group flex h-full w-full flex-col rounded-2xl border-0 bg-transparent p-3 text-left shadow-none transition-colors duration-200 hover:bg-transparent dark:bg-transparent dark:shadow-none dark:hover:bg-transparent",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <img
            src={asset.image}
            alt={asset.name}
            className="h-11 w-11 shrink-0 rounded-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-12 sm:w-12"
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="min-w-0 truncate text-[0.96rem] font-semibold leading-tight text-[#111827] dark:text-[#F2F4F7] sm:text-[1rem]">
                    {asset.name}
                  </span>
                  <img src="/checklist.png" alt="verified" className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
                </div>
                {assetLive ? (
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                    Live
                  </div>
                ) : null}
              </div>
              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", changeBadgeClass(change))}>
                <span className={changeClass}>{formatChange(change)}</span>
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-5 text-[#667085] dark:text-[#98A2B3]">
              {projectStory}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {stats.map((stat, index) => (
            <div
              key={`${asset.id}-${stat.label}`}
              className={cn(
                "min-w-0 rounded-xl bg-[#ECEFF3] px-3 py-2.5 dark:bg-[#202020]",
                index % 2 === 1 && "text-right",
              )}
            >
              <span className="block text-[11px] uppercase tracking-[0.14em] text-[#98A2B3]">{stat.label}</span>
              <span className="price-number mt-1 block truncate text-[1.05rem] font-semibold tabular-nums text-[#101828] dark:text-[#F2F4F7] sm:text-[1.08rem]">{stat.value}</span>
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

  const tableShellClasses = "-mx-4 overflow-hidden rounded-2xl bg-transparent md:mx-0 md:bg-white dark:bg-transparent dark:md:bg-[#151515] mb-6 sm:-mx-6";
  const tableStickyColumnClasses = "bg-white dark:bg-[#0F0F0F] dark:md:bg-[#151515]";

  const renderListedList = (items: Asset[]) => (
    <div className={tableShellClasses}>
      <div className="asset-list-scroll overflow-visible md:overflow-x-auto md:no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <Table className="asset-list-table w-full table-fixed text-sm md:min-w-[720px] md:table-auto">
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              {isDesktop && (
                <TableHead className={cn("hidden w-10 border-b-0 pl-4 md:table-cell", tableStickyColumnClasses)}>
                  <Star className="h-4 w-4 text-blue-500 fill-blue-500" />
                </TableHead>
              )}
              <TableHead className={cn("asset-list-collection-col left-0 z-20 text-left pl-3 text-[16px] sm:pl-4 border-b-0 md:sticky md:min-w-[200px] md:pl-4 md:text-sm", tableStickyColumnClasses)}>Collection</TableHead>
              <TableHead className="w-[104px] text-right border-b-0 pr-2 text-[16px] sm:pr-3 md:w-auto md:min-w-[140px] md:px-4 md:text-sm">Liquidity</TableHead>
              <TableHead className="hidden asset-list-metric-col min-w-0 text-right border-b-0 px-2 md:table-cell md:min-w-[140px] md:px-8">LPU</TableHead>
              <TableHead className="hidden asset-list-metric-col min-w-0 text-right border-b-0 px-2 md:table-cell md:min-w-[140px] md:px-4">CoinTag</TableHead>
              <TableHead className="hidden asset-list-metric-col min-w-0 text-right border-b-0 px-2 md:table-cell md:min-w-[160px] md:pr-6">Backing Reserve</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((asset, index) => {
              const safeReserve = Math.max(0, Number.isFinite(asset.cycle.reserve) ? asset.cycle.reserve : 0);
              const safeSupply = Math.max(0, Number.isFinite(asset.cycle.supply) ? asset.cycle.supply : asset.cycle.initialSupply || 0);
              const liveLpu = safeSupply > 0 ? safeReserve / safeSupply : 0;
              const coinTagPrice = Math.max(4.2, liveLpu * 0.4);
              const change = getAssetChange(asset);
              const changeText = formatChange(change);
              const changeClass = changeColorClass(change);
              const assetLive = isAssetLive(asset);
              const assetNetwork = getAssetNetwork(asset);
              const mobileDividerClass = "border-b-0";
              return (
                <TableRow
                  key={asset.id}
                  className={cn(
                    "cursor-pointer text-sm transition-colors hover:bg-surface/30 md:border-0 group [&>td]:pb-3 md:[&>td]:pb-4",
                    mobileDividerClass,
                  )}
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  {isDesktop && (
                    <TableCell className={cn("hidden w-10 pl-4 md:table-cell", tableStickyColumnClasses)} onClick={(e) => toggleFavorite(asset.id, e)}>
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
                  <TableCell className={cn("asset-list-collection-col left-0 z-10 min-w-0 py-1.5 pl-3 pr-1.5 sm:pl-4 md:sticky md:min-w-[200px] md:border-b-0 md:py-4 md:pl-4 md:pr-4", mobileDividerClass, tableStickyColumnClasses)}>
                    <div className="flex min-w-0 items-center gap-2 text-[15px] md:gap-3 md:text-sm">
                      <div className="relative h-10 w-10 shrink-0 md:h-9 md:w-9">
                        <img src={asset.image} alt={asset.name} className="h-full w-full rounded-full object-cover" />
                        <img
                          src={assetNetwork.image}
                          alt={assetNetwork.name}
                          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-white object-cover p-[1px] grayscale contrast-125 dark:border-black dark:bg-black md:h-3.5 md:w-3.5"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="min-w-0 truncate text-[16px] font-semibold text-foreground md:text-base">{asset.name}</span>
                          <img src="/checklist.png" alt="verified" className="h-4 w-4 flex-shrink-0 opacity-80 md:h-4 md:w-4" />
                        </div>
                        <p className="mt-0.5 max-w-[42vw] truncate text-[12px] font-medium leading-4 text-[#667085] dark:text-[#98A2B3] md:max-w-none md:text-xs">
                          <span>LPU </span><span className="price-number tabular-nums">{formatUnitCurrency(liveLpu)}</span>
                        </p>
                        <div className="hidden items-center gap-1.5 md:flex">
                          <span className={`text-xs font-semibold ${changeClass}`}>{changeText}</span>
                          {assetLive ? <span className="text-[11px] font-semibold text-emerald-500">Live</span> : null}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn("w-[96px] py-1.5 pr-2 text-right sm:pr-3 md:w-auto md:min-w-[140px] md:border-b-0 md:px-4 md:py-4", mobileDividerClass)}>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="price-number text-[16px] font-semibold tabular-nums text-foreground md:text-sm">{formatCurrencyK(safeReserve)}</span>
                      <span className="flex items-center justify-end gap-1.5 md:hidden">
                        <span className={`text-[14px] font-semibold md:text-xs ${changeClass}`}>{changeText}</span>
                        {assetLive ? <span className="text-[12px] font-semibold text-emerald-500">Live</span> : null}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={cn("price-number hidden asset-list-metric-col min-w-0 px-2 text-right text-[15px] font-semibold tabular-nums md:table-cell md:min-w-[140px] md:border-b-0 md:px-8 md:text-sm", mobileDividerClass)}>{formatUnitCurrency(liveLpu)}</TableCell>
                  <TableCell className={cn("price-number hidden asset-list-metric-col min-w-0 px-2 text-right text-[15px] font-semibold tabular-nums md:table-cell md:min-w-[140px] md:border-b-0 md:px-4 md:text-sm", mobileDividerClass)}>{formatCurrency(coinTagPrice)}</TableCell>
                  <TableCell className={cn("price-number hidden asset-list-metric-col min-w-0 px-2 text-right text-[15px] font-semibold tabular-nums md:table-cell md:min-w-[160px] md:border-b-0 md:pl-4 md:pr-6 md:text-sm", mobileDividerClass)}>
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
    <div className="grid grid-cols-1 gap-2.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((asset) => {
        const change = getAssetChange(asset);
        return renderGridCard(asset, change, () => navigate(`/assets/${asset.id}`));
      })}
    </div>
  );

  const renderNetworkSelector = () => {
    if (viewMode === "grid" && isDesktop) return null;

    return (
      <div className="relative left-1/2 mt-2 mb-2 flex w-screen -translate-x-1/2 items-stretch gap-0 overflow-x-auto pb-0 no-scrollbar md:left-auto md:mt-4 md:mb-6 md:w-auto md:translate-x-0 md:items-center md:gap-2 md:px-0">
        {NETWORKS.map((network) => (
          <button
            key={network.id}
            type="button"
            onClick={() => setSelectedNetwork(network.id)}
            className={cn(
              "flex items-center gap-2 border-r border-[#D0D5DD] px-4 py-3 transition-all duration-200 whitespace-nowrap shadow-none last:border-r-0 dark:border-[#2A2A2A] md:rounded-2xl md:py-2 md:shadow-sm",
              network.id === "all" ? "md:border-0" : "md:border md:border-transparent",
              selectedNetwork === network.id
                ? cn("font-semibold", network.selectedPillClass)
                : network.pillClass
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                {network.image ? (
                  <img
                    src={network.image}
                    alt={network.name}
                    className={cn(
                      "w-full h-full object-cover",
                      network.id === "solana" && "grayscale contrast-150 brightness-75",
                    )}
                  />
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
    );
  };

  const trendingTokens = useMemo(() => {
    if (!showTrending) return [];
    return [...assets]
      .map((asset) => ({ asset, change: getAssetChange(asset) }))
      .sort((a, b) => b.change - a.change)
      .slice(0, MAX_TRENDING);
  }, [assets, showTrending]);

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

  const renderTrendingLftsStrip = () => {
    if (!showTrending || trendingTokens.length === 0) return null;

    return (
      <section className="mb-2 px-2 py-2 sm:px-3 md:px-4">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Trending LFTs
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
              The hottest liquidity-funded tokens right now
            </h2>
          </div>
          <div className="hidden shrink-0 rounded-full border border-border/50 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground sm:block">
            Live rankings
          </div>
        </div>

        <div className="no-scrollbar flex overflow-x-auto pr-1">
          {trendingTokens.slice(0, 6).map(({ asset, change }) => {
            const isPositive = change >= 0;
            const network = getAssetNetwork(asset);
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => navigate(`/assets/${asset.id}`)}
                className="group flex min-w-[320px] flex-col justify-between border-r border-[#D0D5DD] bg-transparent px-4 py-2.5 text-left transition last:border-r-0 dark:border-[#2A2A2A] sm:min-w-[380px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={asset.image}
                      alt={asset.name}
                      className="h-9 w-9 rounded-full border border-border/50 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-base font-semibold tracking-[-0.03em] text-foreground">
                          {asset.name}
                        </span>
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/40"
                          aria-label={network.name}
                          title={network.name}
                        >
                          {network.image ? (
                            <img src={network.image} alt={network.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[11px] font-semibold text-muted-foreground">{network.icon}</span>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{asset.ticker || "LFT"}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600",
                    )}
                  >
                    {formatChange(change)}
                  </div>
                </div>

                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Liquidity</p>
                    <p className="text-base font-semibold text-foreground">{formatCurrencyK(asset.cycle.reserve)}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground transition group-hover:text-foreground">
                    {formatChange(change)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  const renderMobileNewsStatus = () => {
    if (!showTrending) return null;

    const statusItems = statusNews ?? [];
    const showPlaceholders = statusNewsLoading && statusItems.length === 0;
    const indicatorCount = Math.min(showPlaceholders ? 5 : statusItems.length, 7);
    const handleNewsScroll = (event: React.UIEvent<HTMLDivElement>) => {
      const scroller = event.currentTarget;
      const card = scroller.querySelector<HTMLElement>("[data-news-card]");
      if (!card) return;

      const cardStep = card.offsetWidth;
      if (cardStep <= 0) return;

      const centeredIndex = Math.round(scroller.scrollLeft / cardStep);
      setActiveNewsIndex(Math.max(0, Math.min(centeredIndex, indicatorCount - 1)));
    };

    if (!showPlaceholders && statusItems.length === 0) return null;

    return (
      <section className="mb-5 md:hidden">
        <div
          ref={newsCarouselRef}
          className="relative left-1/2 w-screen -translate-x-1/2 snap-x snap-mandatory overflow-x-auto scroll-smooth pb-5 no-scrollbar"
          onScroll={handleNewsScroll}
        >
          <div className="flex items-center gap-0 px-[9vw]">
            {showPlaceholders
              ? Array.from({ length: 3 }, (_, index) => (
                <div
                  key={`news-card-placeholder-${index}`}
                  data-news-card
                  className="h-[360px] w-[82vw] max-w-[400px] shrink-0 snap-center animate-pulse rounded-[16px] bg-muted"
                />
              ))
              : statusItems.map((item, index) => {
                const isActive = index === activeNewsIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedNews(item)}
                    data-news-card
                    className={cn(
                      "group w-[82vw] max-w-[400px] shrink-0 snap-center overflow-hidden rounded-[16px] bg-[#F1F1F1] text-left shadow-none outline-none transition-all duration-300 ease-out dark:bg-[#171717]",
                      isActive ? "scale-100 opacity-100" : "scale-[0.9] opacity-80",
                    )}
                    aria-label={`Open headline: ${item.title}`}
                  >
                    <div className="relative h-[270px] overflow-hidden rounded-t-[16px] bg-[#111111]">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/72 via-black/22 to-black/24" />
                      <div className="absolute left-0 right-0 top-8 px-7 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
                          {item.source || "Web3"}
                        </p>
                        <h2 className="mt-5 line-clamp-3 text-[34px] font-black leading-[0.94] tracking-[-0.06em] text-white">
                          {item.title}
                        </h2>
                      </div>
                      <div className="absolute bottom-5 left-5 inline-flex max-w-[72%] items-center gap-2 rounded-2xl bg-black/42 px-3 py-2 text-white backdrop-blur-md">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/18 text-xs font-black">
                          {(item.source || "W").slice(0, 1)}
                        </span>
                        <span className="truncate text-lg font-bold">{item.source || "Web3"}</span>
                      </div>
                    </div>
                    <div className="px-6 py-5">
                      <h3 className="line-clamp-1 text-[24px] font-black leading-tight tracking-[-0.04em] text-[#111111] dark:text-white">
                        {item.source || "Web3"}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-[18px] font-medium tracking-[-0.035em] text-[#9A9A9A] dark:text-[#A6A6A6]">
                        {item.title}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-center gap-3">
          {Array.from({ length: indicatorCount }, (_, index) => (
            <span
              key={`news-dot-${index}`}
              className={cn(
                "h-3 rounded-full bg-[#A8A8A8] transition-all duration-300",
                index === activeNewsIndex ? "w-9 bg-[#555555]" : "w-3",
              )}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={cn("min-h-screen", "bg-background")}>
      <main className="flex-1 pb-2 pt-2 sm:pt-6 md:pb-20">
        <div className="mx-auto w-full max-w-[1400px] px-2 sm:px-6 lg:px-8">
          <div className="flex flex-col pt-0 pb-4">

            {renderTrendingLftsStrip()}

            {showTrending && (
              <Web3News variant="mobile" className="mb-4 hidden md:block" />
            )}

            <MarketTickerTape className="mb-4 hidden md:block" />

            <MarketTickerTape className="relative left-1/2 mb-2 w-screen -translate-x-1/2 md:hidden" />

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

            {renderNetworkSelector()}

            {/* Text Navigation Links - Unified */}
            <div className="mt-0 flex items-center justify-between gap-4 pb-1 md:mt-2 md:pb-2">
              <div className="flex min-w-0 items-center gap-4">
                <span className="whitespace-nowrap text-[22px] font-semibold text-foreground md:hidden">
                  Listed LFTs
                </span>
                <span className="hidden text-[22px] font-semibold text-foreground whitespace-nowrap md:inline">
                  Listed
                </span>
                {showViewAllButton && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="hidden items-center whitespace-nowrap transition-transform hover:scale-[1.02] md:flex"
                        aria-label="Why these icons are here"
                      >
                        {listedHeaderIcons.map((icon, index) => (
                          <span
                            key={icon}
                            className={cn(
                              "overflow-hidden rounded-full bg-white",
                              "h-8 w-8",
                              index === 0 ? "ml-0" : "-ml-2.5",
                            )}
                          >
                            <img src={icon} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </span>
                        ))}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align={isDesktop ? "end" : "start"}
                      alignOffset={isDesktop ? 0 : 10}
                      collisionPadding={16}
                      className="w-[240px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#D5DCE8] bg-white p-3 text-sm font-medium leading-6 text-[#344054] shadow-xl dark:border-[#2A2A2A] dark:bg-[#171717] dark:text-[#D0D5DD]"
                    >
                      {ICON_STACK_MESSAGE}
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {viewMode === "grid" && isDesktop && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold shadow-sm transition-colors",
                          selectedNetworkInfo.selectedPillClass,
                        )}
                        aria-label="Choose network"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
                          {selectedNetworkInfo.image ? (
                            <img
                              src={selectedNetworkInfo.image}
                              alt={selectedNetworkInfo.name}
                              className={cn(
                                "h-full w-full object-cover",
                                selectedNetworkInfo.id === "solana" && "grayscale contrast-150 brightness-75",
                              )}
                            />
                          ) : (
                            <span className="text-[10px]">{selectedNetworkInfo.icon}</span>
                          )}
                        </span>
                        <span className="max-w-[90px] truncate sm:max-w-none">{selectedNetworkInfo.name}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      collisionPadding={16}
                      className="w-52 rounded-2xl border border-border/60 bg-background p-2 shadow-xl"
                    >
                      <div className="space-y-1">
                        {NETWORKS.map((network) => (
                          <button
                            key={network.id}
                            type="button"
                            onClick={() => setSelectedNetwork(network.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                              selectedNetwork === network.id && "bg-muted font-semibold",
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                                {network.image ? (
                                  <img
                                    src={network.image}
                                    alt={network.name}
                                    className={cn(
                                      "h-full w-full object-cover",
                                      network.id === "solana" && "grayscale contrast-150 brightness-75",
                                    )}
                                  />
                                ) : (
                                  <span className="text-[10px]">{network.icon}</span>
                                )}
                              </span>
                              <span className="truncate">{network.name}</span>
                            </span>
                            {selectedNetwork === network.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                <button
                  type="button"
                  onClick={handleToggleViewMode}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-transparent text-[#344054] transition-all hover:bg-transparent hover:text-[#111827] dark:text-[#98A2B3] dark:hover:text-white"
                  aria-label={viewMode === "grid" ? "Switch listed assets to list view" : "Switch listed assets to card view"}
                >
                  {viewMode === "grid" ? (
                    <LayoutGrid className="h-5 w-5" strokeWidth={2.4} />
                  ) : (
                    <Rows3 className="h-5 w-5" strokeWidth={2.4} />
                  )}
                </button>
              </div>
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
      <Dialog open={Boolean(selectedNews)} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-3xl border border-border/60 p-0">
          {selectedNews ? (
            <div>
              {selectedNews.imageUrl ? (
                <div className="relative h-44 overflow-hidden bg-muted">
                  <img
                    src={selectedNews.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                </div>
              ) : null}
              <DialogHeader className="space-y-3 px-5 pb-5 pt-5 text-left">
                <DialogDescription className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2F66F6]">
                  {selectedNews.source || "Web3 headline"}
                </DialogDescription>
                <DialogTitle className="text-2xl font-bold leading-tight tracking-[-0.03em] text-foreground">
                  {selectedNews.title}
                </DialogTitle>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-[#2F66F6] px-4 text-white hover:bg-[#2559DC]"
                    onClick={() => {
                      if (!selectedNews.url) return;
                      if (selectedNews.url.startsWith("/")) {
                        navigate(selectedNews.url);
                      } else {
                        window.open(selectedNews.url, "_blank", "noopener,noreferrer");
                      }
                      setSelectedNews(null);
                    }}
                  >
                    Read story
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedNews(null)}
                  >
                    Close
                  </Button>
                </div>
              </DialogHeader>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Assets() {
  return <AssetsPage showTrending showViewAllButton />;
}
