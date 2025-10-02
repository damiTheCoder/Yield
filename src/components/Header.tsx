import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, Gift, Sun, Moon, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { useApp } from "@/lib/app-state";
import type { Asset } from "@/lib/app-state";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";

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

const NAV_LINKS = [
  { label: "Assets", href: "/assets" },
  { label: "LaunchPad", href: "/coin-tags" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Revenue", href: "/revenue" },
  { label: "Market", href: "/market" },
  { label: "Notifications", href: "/notifications" },
];

const Header = () => {
  const { assets } = useApp();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === "dark";
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<"all" | "assets" | "pages">("all");
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  const staticPages = useMemo<SearchResult[]>(
    () => [
      { type: "page", label: "Landing", path: "/", description: "Return to the hero section" },
      { type: "page", label: "Assets", path: "/assets", description: "Browse all listed LFTs" },
      { type: "page", label: "LaunchPad", path: "/coin-tags", description: "Configure a new campaign" },
      { type: "page", label: "Portfolio", path: "/portfolio", description: "View balances and redeem" },
      { type: "page", label: "Revenue", path: "/revenue", description: "Track live revenue splits" },
      { type: "page", label: "Market", path: "/market", description: "Marketplace overview" },
      { type: "page", label: "Notifications", path: "/notifications", description: "Hunt alerts and activity" },
    ],
    [],
  );

  const trendingAssets = useMemo(() => {
    return [...assets].sort((a, b) => b.cycle.totalSales - a.cycle.totalSales).slice(0, 6);
  }, [assets]);

  const orderedAssets = useMemo(() => {
    return [...assets].sort((a, b) => a.name.localeCompare(b.name));
  }, [assets]);

  const walletOptions = useMemo<WalletOption[]>(() => {
    const win = typeof window === "undefined" ? undefined : (window as any);
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
        gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
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
              {asset.ticker || asset.id.toUpperCase()} · LPU {formatCurrency(asset.cycle.lpu)}
            </span>
          </div>
        </div>
        <div className="text-right">
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
        const provider = (window as any).ethereum;
        if (provider?.request) {
          await provider.request({ method: "eth_requestAccounts" });
        }
      }

      if (wallet.id === "phantom" && typeof window !== "undefined") {
        const provider = (window as any).solana;
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
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                searchFilter === tab.id
                  ? "bg-foreground text-background"
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

      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-6">
            <a href="/" className="text-2xl font-bold text-foreground hover:text-foreground/80 transition-smooth">
              YIELD
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground hover:text-foreground/80 transition-smooth"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSearchOpen(true)}
              className="hidden md:inline-flex items-center gap-2 rounded-full border-border/60 bg-surface/60 px-3 py-1 text-sm font-medium text-foreground"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
              <span className="hidden items-center gap-1 rounded border border-border/40 bg-background px-1.5 text-[10px] font-semibold uppercase text-muted-foreground md:flex">
                ⌘K
              </span>
            </Button>
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

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="hidden md:inline-flex min-w-[120px] justify-center">
                  {connectedWallet ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span className="truncate max-w-[80px]">{connectedWallet}</span>
                    </span>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="md:hidden rounded-full px-4 py-1 text-sm font-semibold"
                >
                  {connectedWallet ? "Wallet" : "Connect"}
                </Button>
              </DialogTrigger>
              <DialogContent
                className={`w-[calc(100%-2rem)] max-w-[420px] border-0 mx-auto rounded-3xl p-0 shadow-xl transition-colors duration-200 sm:max-w-md ${
                  isDarkTheme ? "bg-[#0f0f10] text-neutral-100" : "bg-neutral-100"
                }`}
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
                          className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition-colors ${
                            isDarkTheme ? "bg-[#1f1f24] hover:bg-[#292a30]" : "bg-neutral-200 hover:bg-neutral-300"
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

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden bg-muted/60 hover:bg-muted text-foreground">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full bg-background/95 backdrop-blur border-b border-border/50">
              <SheetHeader className="mb-8 text-left">
                <SheetTitle className="text-2xl font-semibold text-foreground">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-6 text-3xl font-semibold">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <a href={link.href} className="transition-smooth hover:text-foreground/80">
                      {link.label}
                    </a>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
