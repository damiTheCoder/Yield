import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import { useApp } from "@/lib/app-state";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const LETTERS = "ABCDEFGHIJKLMNOPQRST".split("");
const ROWS = Array.from({ length: 20 }, (_, index) => index + 1);
const MAX_TOKENS = 100;

type HuntData = {
  boxes: string[];
  values: Record<string, string>;
};

function createSeededRandom(seedString: string) {
  let h = 1779033703 ^ seedString.length;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return t / 4294967296;
  };
}

function generateHuntData(seed: string): HuntData {
  const random = createSeededRandom(seed);
  const coords: string[] = [];
  LETTERS.forEach((letter) => {
    ROWS.forEach((row) => {
      coords.push(`${letter}${row}`);
    });
  });

  const values: Record<string, string> = {};
  coords.forEach((coord) => {
    const left = Math.floor(random() * 100)
      .toString()
      .padStart(2, "0");
    const right = Math.floor(random() * 100)
      .toString()
      .padStart(2, "0");
    values[coord] = `${left}, ${right}`;
  });

  const boxes: string[] = Array.from({ length: 320 }, () => coords[Math.floor(random() * coords.length)]);
  return { boxes, values };
}

export default function HuntPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assets } = useApp();

  const asset = assets.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (!asset) {
      const timeout = setTimeout(() => navigate("/market"), 2000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [asset, navigate]);

  if (!asset) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto space-y-4 px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Asset not found</h1>
          <p className="text-muted-foreground">Redirecting you back to the market…</p>
          <Button onClick={() => navigate("/market")}>Return to Market</Button>
        </main>
      </div>
    );
  }

  return (
    <HuntExperience
      assetId={asset.id}
      assetName={asset.name}
      ticker={asset.ticker}
      lpu={asset.cycle.lpu}
      pricePerUnit={asset.cycle.lpu}
      initialSupply={asset.params.initialSupply}
      image={asset.image}
      onBack={() => navigate("/market")}
    />
  );
}

type HuntExperienceProps = {
  assetId: string;
  assetName: string;
  ticker?: string;
  lpu: number;
  pricePerUnit: number;
  initialSupply: number;
  image: string;
  onBack: () => void;
};

function HuntExperience({
  assetId,
  assetName,
  ticker,
  lpu,
  pricePerUnit,
  initialSupply,
  image,
  onBack,
}: HuntExperienceProps) {
  const { assetAvailable, userAssets, discoverAssetLFTs } = useApp();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState("");
  const [foundTokens, setFoundTokens] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"idle" | "success" | "error">("idle");
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const ownedTokens = userAssets[assetId]?.lfts ?? 0;
  const remainingSupply = assetAvailable[assetId] ?? Math.max(initialSupply - ownedTokens, 0);
  const sessionCap = Math.min(MAX_TOKENS, initialSupply);
  const huntData = useMemo(() => generateHuntData(assetId), [assetId]);

  useEffect(() => {
    setRevealed(new Set());
    setMatched(new Set());
    setInputValue("");
    setFoundTokens(0);
    setStatus("");
    setStatusType("idle");
  }, [assetId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateMatch = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateMatch);
    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsDrawerOpen(false);
    }
  }, [isMobile]);

  const walletValue = ownedTokens * pricePerUnit;
  const sessionProgress = sessionCap > 0 ? (foundTokens / sessionCap) * 100 : 0;

  const handleReveal = (coordinate: string) => {
    if (matched.has(coordinate)) return;
    setRevealed((prev) => new Set(prev).add(coordinate));
  };

  const handleSubmit = () => {
    const coord = inputValue.trim().toUpperCase();
    if (!coord) return;
    if (!huntData.values[coord]) {
      setStatusType("error");
      setStatus(`Coordinate ${coord} does not exist.`);
      return;
    }
    if (!revealed.has(coord)) {
      setStatusType("error");
      setStatus("Open a box with that coordinate first.");
      return;
    }
    if (matched.has(coord)) {
      setStatusType("error");
      setStatus("You already claimed that coordinate.");
      return;
    }
    if (foundTokens >= sessionCap) {
      setStatusType("error");
      setStatus("Session cap reached. Try another asset or come back next cycle.");
      return;
    }

    const { claimed } = discoverAssetLFTs(assetId, 1);
    if (claimed <= 0) {
      setStatusType("error");
      setStatus("All available tokens for this asset have been claimed.");
      return;
    }

    const nextMatched = new Set(matched);
    nextMatched.add(coord);
    setMatched(nextMatched);
    setFoundTokens((prev) => Math.min(prev + claimed, sessionCap));
    const nextWalletTokens = ownedTokens + claimed;
    setStatusType("success");
    setStatus(`Token found at ${coord}! Wallet now ${formatCurrency(nextWalletTokens * pricePerUnit)}.`);
    setInputValue("");
  };

  const renderCoordinateTable = () => (
    <table className="hunt-table text-[10px] sm:text-xs">
      <thead>
        <tr>
          <th scope="col" className="hunt-table-corner" aria-hidden="true"></th>
          {LETTERS.map((letter) => (
            <th key={letter} scope="col" className="hunt-table-col">
              {letter}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row}>
            <th scope="row" className="hunt-table-row">
              {row}
            </th>
            {LETTERS.map((letter) => {
              const coord = `${letter}${row}`;
              const value = huntData.values[coord];
              const isMatched = matched.has(coord);
              const isRevealed = revealed.has(coord);
              return (
                <td
                  key={coord}
                  className={`hunt-table-cell ${
                    isMatched ? "hunt-table-cell--matched" : isRevealed ? "hunt-table-cell--revealed" : ""
                  }`}
                >
                  {value}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 lg:py-10">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              onClick={onBack}
              className="self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to market
            </button>
            <div className="flex items-center gap-3">
              <img src={image} alt={assetName} className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16" />
              <div>
                <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{assetName}</h1>
                <p className="text-sm text-muted-foreground">Cycle hunt • LPU {formatCurrency(lpu)}</p>
              </div>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-6 rounded-2xl border border-border/40 bg-surface/40 px-5 py-4 text-sm shadow-card sm:flex sm:max-w-none sm:flex-row sm:items-center sm:gap-6">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Wallet value</div>
              <div className="text-lg font-semibold text-foreground sm:text-xl">{formatCurrency(walletValue)}</div>
            </div>
            <div className="space-y-1 sm:border-l sm:border-border/40 sm:pl-6">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Wallet tokens</div>
              <div className="text-lg font-semibold text-foreground sm:text-xl">{ownedTokens}</div>
            </div>
            <div className="space-y-1 sm:border-l sm:border-border/40 sm:pl-6">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Session finds</div>
              <div className="text-lg font-semibold text-foreground sm:text-xl">
                {foundTokens}/{sessionCap}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-4">
            <div className="hidden overflow-hidden rounded-2xl border border-border/40 bg-surface/40 shadow-card md:block">
              <img src={image} alt={assetName} className="h-36 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">{assetName}</h2>
                  {ticker && <span className="rounded-full border border-border/40 px-2 py-0.5 text-xs text-muted-foreground">{ticker}</span>}
                </div>
                <p className="text-sm text-muted-foreground">
                  Hunt the grid, locate coordinates, and redeem liquidity-backed tokens in real time.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/40 bg-surface/40 p-4">
              <div className="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted-foreground sm:flex-row sm:items-baseline sm:justify-between">
                <span>Progress</span>
                <span className="text-sm font-medium text-foreground">{sessionProgress.toFixed(0)}%</span>
              </div>
              <Progress value={sessionProgress} className="hunt-progress" />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-nowrap">
                <span>LPU {formatCurrency(lpu)}</span>
                <span>Session cap {sessionCap}</span>
                <span>Remaining supply {remainingSupply.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-border/40 bg-surface/40 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">How to play</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Tap a box to reveal its number pair.</li>
                <li>Find the coordinate in the reference sheet.</li>
                <li>Enter the coordinate below to claim the token.</li>
              </ol>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="hunt-card">
              <div className="hunt-card__header hunt-card__header--row">
                <span>Coordinate reference</span>
                <span className="hidden text-xs text-muted-foreground md:inline">Swipe to explore</span>
              </div>
              <div className="space-y-3 px-4 pb-4 pt-3">
                {isMobile ? (
                  <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="secondary" className="w-full sm:w-auto">
                        Open coordinate sheet
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[85vh] overflow-hidden">
                      <DrawerHeader className="text-left">
                        <DrawerTitle>Coordinate reference</DrawerTitle>
                        <DrawerDescription>
                          Drag horizontally to see more columns and vertically to explore additional rows.
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="px-4 pb-6">
                        <div className="hunt-table-container">
                          <div className="hunt-table-scroll max-h-[60vh]">{renderCoordinateTable()}</div>
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <div className="hunt-table-container">
                    <div className="hunt-table-scroll">{renderCoordinateTable()}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="hunt-card space-y-4 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Enter coordinate</span>
                <div className="flex w-full gap-2 sm:w-auto">
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="E.g. G12"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  />
                  <Button onClick={handleSubmit}>Submit</Button>
                </div>
              </div>
              {status && (
                <p className={`text-sm ${statusType === "success" ? "text-emerald-400" : "text-destructive"}`}>{status}</p>
              )}
            </div>

            <div className="hunt-card space-y-4 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Hunt grid</span>
                <span className="text-[11px] text-muted-foreground">Swipe sideways to open more boxes</span>
              </div>
              <div className="hunt-grid-scroll">
                <div className="hunt-grid">
                  {huntData.boxes.map((coord, index) => {
                    const isMatched = matched.has(coord);
                    const isRevealed = revealed.has(coord);
                    const value = huntData.values[coord];
                    return (
                      <button
                        key={`${coord}-${index}`}
                        type="button"
                        onClick={() => handleReveal(coord)}
                        className={`hunt-grid-card ${
                          isMatched
                            ? "hunt-grid-card--matched"
                            : isRevealed
                            ? "hunt-grid-card--revealed"
                            : "hunt-grid-card--hidden"
                        }`}
                      >
                        {isMatched ? "🏆" : isRevealed ? value : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
