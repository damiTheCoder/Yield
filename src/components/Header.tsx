import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, Gift, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useApp } from "@/lib/app-state";
import { useTheme } from "@/hooks/useTheme";

type SearchResult = {
  type: "page" | "asset";
  label: string;
  description?: string;
  badge?: string;
  path: string;
};

const Header = () => {
  const { assets } = useApp();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultPanelRef = useRef<HTMLDivElement | null>(null);

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

  const assetResults = useMemo<SearchResult[]>(
    () =>
      assets.map((asset) => ({
        type: "asset",
        label: asset.name,
        description: `Asset · ${asset.params.initialSupply} supply · LPU ${asset.cycle.lpu.toFixed(2)}`,
        badge: asset.ticker || undefined,
        path: `/assets/${asset.id}`,
      })),
    [assets],
  );

  const results = useMemo<SearchResult[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const merged = [...staticPages, ...assetResults];
    return merged.filter((item) => {
      const haystack = `${item.label} ${item.description ?? ""} ${item.badge ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [assetResults, staticPages, query]);

  const handleNavigate = useCallback(
    (result: SearchResult) => {
      navigate(result.path);
      setQuery("");
      setShowResults(false);
      setMobileSearchOpen(false);
    },
    [navigate],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultPanelRef.current &&
        !resultPanelRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const shouldShowDropdown = showResults && results.length > 0;

  useEffect(() => {
    if (!mobileSearchOpen) setShowResults(false);
  }, [mobileSearchOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="text-2xl font-bold text-foreground hover:text-foreground/80 transition-smooth">
            YIELD
          </a>
        </div>

        <nav className="hidden md:flex flex-1 mx-4 items-center space-x-6 text-sm md:text-base">
          <a href="/assets" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Assets</a>
          <a href="/coin-tags" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">LaunchPad</a>
          <a href="/portfolio" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Portfolio</a>
          <a href="/revenue" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Revenue</a>
          <a href="/market" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Market</a>
          <a href="/notifications" className="text-foreground hover:text-foreground/80 transition-smooth font-medium">Notifications</a>
        </nav>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && results[0]) {
                  event.preventDefault();
                  handleNavigate(results[0]);
                }
              }}
              placeholder="Search pages or assets"
              className="pl-10 bg-surface border-border rounded-lg"
            />
            {shouldShowDropdown && (
              <div
                ref={resultPanelRef}
                className="absolute left-0 right-0 top-[110%] z-50 rounded-2xl border border-border/50 bg-background/95 shadow-lg backdrop-blur"
              >
                <ul className="max-h-80 overflow-auto py-2">
                  {results.map((result) => (
                    <li key={`${result.type}-${result.path}`}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleNavigate(result)}
                        className="w-full px-4 py-2 text-left transition-smooth hover:bg-surface"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-foreground">{result.label}</div>
                            {result.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">{result.description}</div>
                            )}
                          </div>
                          {result.badge && (
                            <span className="rounded-full bg-surface px-2 py-1 text-[11px] uppercase text-muted-foreground">
                              {result.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="relative"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full bg-background/95 backdrop-blur border-b border-border/50">
              <SheetHeader className="mb-6 text-left">
                <SheetTitle className="text-xl font-semibold text-foreground">Search</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    autoFocus
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setShowResults(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && results[0]) {
                        event.preventDefault();
                        handleNavigate(results[0]);
                      }
                    }}
                    placeholder="Search pages or assets"
                    className="pl-10 bg-surface border-border rounded-lg"
                  />
                </div>
                <div className="max-h-[65vh] overflow-auto space-y-2">
                  {query.trim() && results.length === 0 && (
                    <p className="text-sm text-muted-foreground px-1">No results for “{query}”.</p>
                  )}
                  {results.map((result) => (
                    <button
                      key={`mobile-${result.type}-${result.path}`}
                      type="button"
                      onClick={() => handleNavigate(result)}
                      className="w-full rounded-xl border border-border/40 bg-surface/50 px-4 py-3 text-left transition-smooth hover:bg-surface"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-foreground">{result.label}</div>
                          {result.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">{result.description}</div>
                          )}
                        </div>
                        {result.badge && (
                          <span className="rounded-full bg-background/70 px-2 py-1 text-[11px] uppercase text-muted-foreground">
                            {result.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="ghost" className="hidden lg:flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Earn Points
          </Button>

          <Button variant="default" size="sm">
            Connect
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full bg-background/95 backdrop-blur border-b border-border/50">
              <SheetHeader className="mb-8 text-left">
                <SheetTitle className="text-2xl font-semibold text-foreground">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-6 text-3xl font-semibold">
                <SheetClose asChild>
                  <a href="/assets" className="transition-smooth hover:text-foreground/80">Assets</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/coin-tags" className="transition-smooth hover:text-foreground/80">LaunchPad</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/portfolio" className="transition-smooth hover:text-foreground/80">Portfolio</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/revenue" className="transition-smooth hover:text-foreground/80">Revenue</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/market" className="transition-smooth hover:text-foreground/80">Market</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="/notifications" className="transition-smooth hover:text-foreground/80">Notifications</a>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
