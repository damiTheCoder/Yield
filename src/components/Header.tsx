import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  Grid3X3,
  Loader2,
  Newspaper,
  PieChart,
  Search,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, formatCurrencyK } from "@/lib/utils";

type SearchResult = {
  type: "page" | "asset";
  label: string;
  description?: string;
  badge?: string;
  path: string;
};

type WalletOption = {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  gradient: string;
  detected: boolean;
};

export type MobileNavItem =
  | { type: "link"; label: string; href: string }
  | { type: "action"; label: string; active: boolean; onClick: () => void };

type MobileMenuSection = {
  title?: string;
  items: MobileNavItem[];
  showArrow?: boolean;
};

const NAV_LINKS = [
  { label: "Assets", href: "/assets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Wallet", href: "/wallet" },
  { label: "Notifications", href: "/notifications" },
  { label: "LaunchPad", href: "/coin-tags" },
  { label: "Revenue", href: "/revenue" },
];

const MOBILE_NAV_ICONS: Record<string, LucideIcon> = {
  "/assets": Grid3X3,
  "/portfolio": PieChart,
  "/wallet": Wallet,
  "/notifications": Bell,
  "/coin-tags": Tag,
  "/revenue": BarChart3,
  "/blog": Newspaper,
};

const getMobileNavIcon = (item: MobileNavItem): LucideIcon => {
  if (item.type === "action") {
    return ArrowLeftRight;
  }

  return MOBILE_NAV_ICONS[item.href] ?? Grid3X3;
};

type HeaderProps = {
  mobileNavItems?: MobileNavItem[];
};

const Header = ({ mobileNavItems = [] }: HeaderProps) => {
  const { assets } = useApp();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<"all" | "assets" | "pages">("all");
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const mobileMenuSections = useMemo<MobileMenuSection[]>(() => {
    const primaryItems = mobileNavItems.filter(
      (item) => item.type === "link" && ["/assets", "/portfolio"].includes(item.href),
    );
    const exploreItems = mobileNavItems.filter(
      (item) => item.type === "link" && ["/wallet", "/notifications", "/coin-tags"].includes(item.href),
    );
    const protocolItems = mobileNavItems.filter(
      (item) => !primaryItems.includes(item) && !exploreItems.includes(item),
    );

    return [
      { items: primaryItems },
      { title: "Explore", items: exploreItems },
      { title: "Protocol", items: protocolItems, showArrow: true },
    ].filter((section) => section.items.length > 0);
  }, [mobileNavItems]);

  const staticPages = useMemo<SearchResult[]>(
    () => [
      { type: "page", label: "Landing", path: "/", description: "Return to the Solaris landing page" },
      { type: "page", label: "Assets", path: "/assets", description: "Browse live hunts and listed LFTs" },
      { type: "page", label: "All Tokens", path: "/assets/all", description: "See every listed collection in one place" },
      { type: "page", label: "LaunchPad", path: "/coin-tags", description: "Configure a launch and review the split" },
      { type: "page", label: "Portfolio", path: "/portfolio", description: "Monitor redeemable value and rewards" },
      { type: "page", label: "Wallet", path: "/wallet", description: "View CoinTag codes and hunt readiness" },
      { type: "page", label: "Revenue", path: "/revenue", description: "Track creator-side token financials by cycle" },
      { type: "page", label: "Notifications", path: "/notifications", description: "See hunt, rewards, and market lifecycle alerts" },
      { type: "page", label: "Blog", path: "/blog", description: "Read Solaris posts and Decrypt headlines" },
    ],
    [],
  );

  const trendingAssets = useMemo(() => {
    if (!assets || !Array.isArray(assets)) return [];
    return [...assets].sort((a, b) => (b.cycle?.totalSales || 0) - (a.cycle?.totalSales || 0)).slice(0, 6);
  }, [assets]);

  const orderedAssets = useMemo(() => {
    if (!assets || !Array.isArray(assets)) return [];
    return [...assets].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [assets]);

  const walletOptions = useMemo<WalletOption[]>(() => {
    const win = typeof window === "undefined" ? undefined : (window as unknown as { ethereum?: { isTrust?: boolean; isMetaMask?: boolean }; solana?: { isPhantom?: boolean }; gatewallet?: boolean; coinbaseWalletExtension?: boolean });
    const gateIcon = "/Gate%20IO%20Exchange.jpeg";
    const walletConnectIcon = "/walletconnect.png";
    const coinbaseIcon = "/Coinbase%20Logo.jpeg";
    return [
      {
        id: "trust",
        name: "Trust Wallet",
        icon: "/r2.jpeg",
        gradient: "from-blue-500 via-blue-600 to-indigo-500",
        detected: Boolean(win?.ethereum?.isTrust),
      },
      {
        id: "metamask",
        name: "MetaMask",
        icon: "/r3.jpeg",
        gradient: "from-orange-400 via-orange-500 to-amber-500",
        detected: Boolean(win?.ethereum?.isMetaMask),
      },
      {
        id: "phantom",
        name: "Phantom",
        icon: "/r1.jpeg",
        gradient: "from-blue-500 via-sky-500 to-cyan-500",
        detected: Boolean(win?.solana?.isPhantom),
      },
      {
        id: "gate",
        name: "Gate Wallet",
        icon: gateIcon,
        gradient: "from-sky-400 via-cyan-500 to-blue-500",
        detected: Boolean(win?.gatewallet),
      },
      {
        id: "walletconnect",
        name: "WalletConnect",
        icon: walletConnectIcon,
        gradient: "from-cyan-400 via-cyan-500 to-cyan-600",
        detected: true,
      },
      {
        id: "coinbase",
        name: "Coinbase Wallet",
        icon: coinbaseIcon,
        gradient: "from-blue-500 via-blue-500 to-blue-600",
        detected: Boolean(win?.coinbaseWalletExtension),
      },
    ];
  }, [walletDialogOpen]);

  const renderAssetCommandItem = (asset: Asset, context: "trending" | "all") => (
    <CommandItem
      key={`${context}-${asset.id}`}
      value={`${asset.name} ${asset.ticker ?? asset.id}`}
      onSelect={() => handleNavigate(`/assets/${asset.id}`)}
      className="data-[selected=true]:bg-surface/90"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={asset.image}
            alt={asset.name}
            className="h-9 w-9 rounded-full border border-border/50 object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{asset.name}</span>
            <span className="text-xs text-muted-foreground">
              {asset.ticker || asset.id.toUpperCase()} · Cycle {asset.cycle.cycle} · LPU {formatCurrency(asset.secondaryMarket?.active ? asset.secondaryMarket.walv : asset.cycle.lpu)}
            </span>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            asset.secondaryMarket?.active
              ? "bg-violet-500/10 text-violet-300"
              : "bg-emerald-500/10 text-emerald-300",
          )}>
            {asset.secondaryMarket?.active ? "Market" : "Hunt Live"}
          </div>
          <div className="text-xs font-semibold text-foreground">{formatCurrencyK(asset.cycle.reserve)}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Liquidity</div>
        </div>
      </div>
    </CommandItem>
  );

  const searchTabs: Array<{ id: "all" | "assets" | "pages"; label: string }> = [
    { id: "all", label: "All" },
    { id: "assets", label: "Listed" },
    { id: "pages", label: "Sections" },
  ];

  const showAssets = searchFilter === "all" || searchFilter === "assets";
  const showPages = searchFilter === "all" || searchFilter === "pages";

  const handleWalletConnect = async (wallet: WalletOption) => {
    if (connectingWallet) return;
    setConnectingWallet(wallet.id);
    try {
      if (wallet.id === "metamask" && typeof window !== "undefined") {
        const provider = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<void> } }).ethereum;
        if (provider?.request) {
          await provider.request({ method: "eth_requestAccounts" });
        }
      }

      if (wallet.id === "phantom" && typeof window !== "undefined") {
        const provider = (window as unknown as { solana: { connect: () => Promise<void> } }).solana;
        if (provider?.connect) {
          await provider.connect();
        }
      }

      // Simulate handshake latency
      await new Promise((resolve) => setTimeout(resolve, 400));

      setConnectedWallet(wallet.name);
      toast({
        title: `${wallet.name} connected`,
        description: "Wallet ready for hunts and redemptions.",
      });
      setWalletDialogOpen(false);
    } catch (error) {
      toast({
        title: `Unable to connect ${wallet.name}`,
        description:
          error instanceof Error ? error.message : "Connection was cancelled or is not supported.",
        variant: "destructive",
      });
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      setSearchOpen(false);
      setSearchFilter("all");
      setSheetOpen(false);
    },
    [navigate],
  );

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <CommandDialog
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) {
            setSearchFilter("all");
          }
        }}
      >
        <CommandInput placeholder="Search listed assets or sections" />
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {searchTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchFilter(tab.id)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${searchFilter === tab.id
                ? "bg-gradient-logo text-black font-medium"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>
          {showAssets && (
            <>
              {trendingAssets.length > 0 && (
                <CommandGroup heading="Tokens by 24H volume">
                  {trendingAssets.map((asset) => renderAssetCommandItem(asset, "trending"))}
                </CommandGroup>
              )}
              {orderedAssets.length > 0 && (
                <>
                  {trendingAssets.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="All listed assets">
                    {orderedAssets.map((asset) => renderAssetCommandItem(asset, "all"))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
          {showPages && staticPages.length > 0 && (
            <>
              {showAssets && (trendingAssets.length > 0 || orderedAssets.length > 0) && <CommandSeparator />}
              <CommandGroup heading="Sections">
                {staticPages.map((page) => (
                  <CommandItem
                    key={`page-${page.path}`}
                    value={`${page.label} ${page.description ?? ""}`}
                    onSelect={() => handleNavigate(page.path)}
                    className="data-[selected=true]:bg-surface/90"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">{page.label}</span>
                      {page.description && (
                        <span className="text-xs text-muted-foreground">{page.description}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>

      <header
        className="sticky top-0 z-50 w-full px-0 pt-0 transition-[padding] duration-200"
      >
        <div
          className={cn(
            "relative w-full transition-[box-shadow,border-radius,max-width,background-color,backdrop-filter] duration-200",
            isScrolled
              ? "max-w-none rounded-none shadow-[0_10px_28px_rgba(6,11,22,0.08)]"
              : "max-w-none rounded-none bg-white shadow-none",
            isScrolled && "header-glass-blur",
            isScrolled && (isDarkTheme ? "header-glass-app-dark" : "header-glass-app-light"),
          )}
        >
          <div className="relative flex w-full items-center justify-between gap-2 px-3 py-2 md:px-6">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hover:opacity-80 transition-smooth flex items-center gap-2"
              >
                <img
                  src="/h4.png"
                  alt="Solaris logo"
                  className="h-7 w-7 rounded-full object-cover"
                />
                <span className="text-lg font-extrabold text-foreground">Solaris</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="md:hidden"
                aria-label="Search listed assets"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <nav className="hidden md:flex items-center gap-6 flex-1 justify-center px-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-semibold transition-colors hover:text-foreground",
                    location.pathname === link.href || (link.href !== "/" && location.pathname.startsWith(link.href))
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 md:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearchOpen(true)}
                className="hidden md:inline-flex items-center gap-2 rounded-full border-border/60 bg-surface/60 px-3 py-1 text-sm font-medium text-foreground md:mr-auto"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
                <span className="hidden items-center gap-1 rounded border border-border/40 bg-background px-1.5 text-[10px] font-semibold uppercase text-muted-foreground md:flex">
                  ⌘K
                </span>
              </Button>

              <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="neutral"
                    size="sm"
                    className="hidden md:inline-flex min-w-[120px] justify-center h-8 rounded-full text-sm font-semibold border-0 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {connectedWallet ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-white" />
                        <span className="truncate max-w-[80px]">{connectedWallet}</span>
                      </span>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button
                    variant="neutral"
                    size="sm"
                    className="md:hidden rounded-full h-8 px-4 text-sm font-semibold border-0 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {connectedWallet ? "Wallet" : "Connect"}
                  </Button>
                </DialogTrigger>

                <div className="md:hidden ml-0">
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 p-0 bg-transparent text-foreground hover:bg-transparent"
                        aria-label="Open navigation menu"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-9 w-9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        >
                          <line x1="2.5" y1="5" x2="22" y2="5" />
                          <line x1="5.5" y1="12" x2="22" y2="12" />
                          <line x1="8.5" y1="19" x2="22" y2="19" />
                        </svg>
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="top"
                      className="h-[100dvh] max-h-[100dvh] gap-0 overflow-y-auto rounded-none border-0 bg-white p-0 text-slate-700 shadow-none"
                    >
                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                      <div className="flex items-center px-5 pt-4 pr-14">
                        <Link
                          to="/"
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center"
                        >
                          <img
                            src="/h4.png"
                            alt="Solaris logo"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        </Link>
                      </div>
                      <div className="min-h-full px-5 pb-12 pt-8">
                        {mobileMenuSections.map((section, sectionIndex) => (
                          <div
                            key={section.title ?? "primary"}
                            className={cn(sectionIndex === 0 ? "" : "mt-11")}
                          >
                            {section.title ? (
                              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                {section.title}
                              </div>
                            ) : null}
                            <div className="flex flex-col gap-5">
                              {section.items.map((item, index) => {
                                const isActive =
                                  item.type === "link"
                                    ? location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
                                    : item.active;
                                const Icon = getMobileNavIcon(item);
                                const itemClass = cn(
                                  "flex min-h-[34px] w-full items-center gap-3 text-left text-[14px] font-medium tracking-[-0.01em] transition-colors",
                                  isActive ? "text-slate-950" : "text-slate-600 hover:text-slate-950",
                                );
                                const iconClass = cn(
                                  "h-[18px] w-[18px] shrink-0",
                                  isActive ? "text-slate-950" : "text-slate-500",
                                );

                                if (item.type === "link") {
                                  return (
                                    <Link
                                      key={`${section.title ?? "primary"}-${item.href}-${index}`}
                                      to={item.href}
                                      onClick={() => setSheetOpen(false)}
                                      className={itemClass}
                                    >
                                      <Icon className={iconClass} strokeWidth={1.9} />
                                      <span className="flex-1">{item.label}</span>
                                      {section.showArrow ? (
                                        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
                                      ) : null}
                                    </Link>
                                  );
                                }

                                return (
                                  <button
                                    key={`${section.title ?? "primary"}-${item.label}-${index}`}
                                    onClick={() => {
                                      item.onClick();
                                      setSheetOpen(false);
                                    }}
                                    className={itemClass}
                                  >
                                    <Icon className={iconClass} strokeWidth={1.9} />
                                    <span className="flex-1">{item.label}</span>
                                    {section.showArrow ? (
                                      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <DialogContent
                  className={`w-[calc(100%-2rem)] max-w-[420px] border-0 mx-auto rounded-3xl p-0 shadow-xl transition-colors duration-200 sm:max-w-md ${isDarkTheme ? "bg-[#0f0f10] text-neutral-100" : "bg-neutral-100"}`}
                >
                  <DialogHeader className="space-y-1 px-6 pt-6">
                    <DialogTitle className="text-lg font-semibold">Connect a Wallet</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Choose a wallet provider to continue. We detect installed extensions automatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="px-2 pb-6 pt-4">
                    <div className="max-h-[60vh] overflow-y-auto space-y-2">
                      {walletOptions.map((wallet) => {
                        const isConnecting = connectingWallet === wallet.id;
                        const isConnected = connectedWallet === wallet.name;
                        return (
                          <button
                            key={wallet.id}
                            type="button"
                            disabled={isConnecting}
                            onClick={() => handleWalletConnect(wallet)}
                            className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition-colors ${isDarkTheme ? "bg-[#1f1f24] hover:bg-[#292a30]" : "bg-neutral-200 hover:bg-neutral-300"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${wallet.gradient}`}
                              >
                                {wallet.icon ? (
                                  <img src={wallet.icon} alt={`${wallet.name} icon`} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-lg">{wallet.emoji}</span>
                                )}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">{wallet.name}</span>
                                <span
                                  className={`text-xs font-medium ${wallet.detected ? "text-emerald-300" : "text-muted-foreground"}`}
                                >
                                  {wallet.detected ? "Detected" : "Not detected"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isConnected && <Check className="h-4 w-4 text-emerald-300" />}
                              {isConnecting ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : (
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {isConnected ? "Connected" : "Connect"}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-4 px-2 text-center text-[11px] text-muted-foreground">
                      Need help? Install your preferred wallet extension and refresh this page to detect it automatically.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
