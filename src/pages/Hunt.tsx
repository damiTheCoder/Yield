import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/lib/app-state";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const LETTERS = "ABCDEFGHIJKLMNOPQRST".split("");
const ROWS = Array.from({ length: 20 }, (_, i) => i + 1);
const MAX_TOKENS = 100;

type HuntData = {
  boxes: string[];
  values: Record<string, string>;
  winningCoordinates: Set<string>; // Only these coordinates contain tokens
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
  
  // Generate all coordinate values
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
  
  // Shuffle all coordinates
  const shuffled = [...coords];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Select boxes to display (320 boxes)
  const boxes: string[] = shuffled.slice(0, 320);
  
  // Only 30-40% of boxes actually contain tokens (makes it challenging but not impossible)
  const numWinningBoxes = Math.floor(boxes.length * 0.35); // ~112 winning boxes out of 320
  const winningCoordinates = new Set(boxes.slice(0, numWinningBoxes));
  
  return { boxes, values, winningCoordinates };
}

export default function HuntPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assets } = useApp();

  const asset = assets.find((a) => a.id === id);

  useEffect(() => {
    if (!asset) {
      const timeout = setTimeout(() => navigate("/market"), 2000);
      return () => clearTimeout(timeout);
    }
  }, [asset, navigate]);

  if (!asset) {
    return (
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-20 text-center space-y-4">
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
      cycleNumber={asset.cycle.cycle}
      lpu={asset.cycle.lpu}
      pricePerUnit={asset.cycle.lpu}
      initialSupply={asset.params.initialSupply}
      image={asset.image}
    />
  );
}

type HuntExperienceProps = {
  assetId: string;
  assetName: string;
  ticker?: string;
  cycleNumber: number;
  lpu: number;
  pricePerUnit: number;
  initialSupply: number;
  image: string;
};

function HuntExperience({ assetId, assetName, ticker, cycleNumber, lpu, pricePerUnit, initialSupply, image }: HuntExperienceProps) {
  const { getHuntProgress, updateHuntProgress, claimHuntToken } = useApp();
  
  // Load saved progress or initialize
  const [revealed, setRevealed] = useState<Set<string>>(() => {
    const saved = getHuntProgress(assetId);
    return new Set(saved.revealed);
  });
  const [matched, setMatched] = useState<Set<string>>(() => {
    const saved = getHuntProgress(assetId);
    return new Set(saved.matched);
  });
  const [failed, setFailed] = useState<Set<string>>(() => {
    const saved = getHuntProgress(assetId);
    return new Set(saved.failed || []);
  }); // Coordinates with no tokens (red boxes)
  const [inputValue, setInputValue] = useState("");
  const [foundTokens, setFoundTokens] = useState(() => {
    const saved = getHuntProgress(assetId);
    return saved.foundTokens;
  });
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"idle" | "success" | "error">("idle");

  const maxTokens = Math.min(MAX_TOKENS, initialSupply);
  const huntData = useMemo(() => generateHuntData(assetId), [assetId]);

  // Reset when switching to a different asset
  useEffect(() => {
    const saved = getHuntProgress(assetId);
    setRevealed(new Set(saved.revealed));
    setMatched(new Set(saved.matched));
    setFailed(new Set(saved.failed || [])); // Restore failed attempts from saved progress
    setFoundTokens(saved.foundTokens);
    setInputValue("");
    setStatus("");
    setStatusType("idle");
  }, [assetId, getHuntProgress]);

  const walletValue = foundTokens * pricePerUnit;

  const handleReveal = useCallback((coordinate: string) => {
    setRevealed((prevRevealed) => {
      if (matched.has(coordinate)) return prevRevealed;
      if (prevRevealed.has(coordinate)) return prevRevealed; // Already revealed
      
      const nextRevealed = new Set(prevRevealed);
      nextRevealed.add(coordinate);
      
      // Save progress after state update
      setTimeout(() => {
        updateHuntProgress(assetId, {
          revealed: Array.from(nextRevealed),
          matched: Array.from(matched),
          failed: Array.from(failed),
          foundTokens,
        });
      }, 0);
      
      return nextRevealed;
    });
  }, [assetId, matched, failed, foundTokens, updateHuntProgress]);

  const handleSubmit = useCallback(() => {
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
    
    // Check if this coordinate actually contains a token
    if (!huntData.winningCoordinates.has(coord)) {
      // Mark this coordinate as failed (red box)
      setFailed((prevFailed) => {
        const nextFailed = new Set(prevFailed);
        nextFailed.add(coord);
        
        // Save progress immediately with failed state
        setTimeout(() => {
          updateHuntProgress(assetId, {
            revealed: Array.from(revealed),
            matched: Array.from(matched),
            failed: Array.from(nextFailed),
            foundTokens,
          });
        }, 0);
        
        return nextFailed;
      });
      setStatusType("error");
      setStatus(`No token at ${coord}. Keep searching!`);
      setInputValue("");
      return;
    }
    
    if (foundTokens >= maxTokens) {
      setStatusType("error");
      setStatus("You've already claimed the maximum tokens for this hunt.");
      return;
    }
    
    // Try to claim the token from the app state
    const claimed = claimHuntToken(assetId);
    if (!claimed) {
      setStatusType("error");
      setStatus("No more tokens available in this asset's pool.");
      return;
    }
    
    const nextMatched = new Set(matched);
    nextMatched.add(coord);
    const nextFoundTokens = Math.min(foundTokens + 1, maxTokens);
    
    setMatched(nextMatched);
    setFoundTokens(nextFoundTokens);
    setStatusType("success");
    setStatus(`Token found at ${coord}! +${formatCurrency(pricePerUnit)} added to your wallet.`);
    setInputValue("");
    
    // Save progress after state updates
    setTimeout(() => {
      updateHuntProgress(assetId, {
        revealed: Array.from(revealed),
        matched: Array.from(nextMatched),
        failed: Array.from(failed),
        foundTokens: nextFoundTokens,
      });
    }, 0);
  }, [inputValue, huntData, revealed, matched, failed, foundTokens, maxTokens, claimHuntToken, assetId, pricePerUnit, updateHuntProgress]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <div className="container mx-auto px-2 sm:px-4 pt-3 pb-4 sm:pt-4 sm:pb-6 space-y-3 font-mono">
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <img src={image} alt={assetName} className="h-10 w-10 sm:h-14 sm:w-14 rounded-full border border-border/50 object-cover" />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground sm:text-2xl">{assetName}</h1>
                  {ticker && <span className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">{ticker}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />Live Hunt
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">•</span>
                  <span>Cycle {cycleNumber}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">•</span>
                  <span className="text-muted-foreground">{foundTokens} tokens claimed</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center sm:gap-4">
              <div className="rounded-xl border border-border/40 bg-muted/30 px-4 py-3 text-left shadow-sm sm:min-w-[200px] dark:bg-neutral-900/70">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">Wallet value</span>
                <div className="text-xl font-semibold text-emerald-400 sm:text-3xl">{formatCurrency(walletValue)}</div>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/30 px-4 py-3 text-left shadow-sm sm:min-w-[200px] dark:bg-neutral-900/70">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">Tokens found</span>
                <div className="text-xl font-semibold text-emerald-400 sm:text-3xl">
                  {foundTokens}/{maxTokens}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 sm:hidden">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Wallet value</span>
              <div className="text-xl font-semibold text-emerald-400">{formatCurrency(walletValue)}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Tokens found</span>
              <div className="text-xl font-semibold text-emerald-400">
                {foundTokens}/{maxTokens}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-2 sm:px-4 pb-32 pt-4 sm:pt-6 space-y-4 sm:space-y-8">
        {/* Main Content - Stack on mobile, side-by-side on desktop */}
        <section className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <aside className="hidden w-full lg:w-80 lg:flex-shrink-0 space-y-3 sm:space-y-4 sm:block">
            <div className="hunt-image-card overflow-hidden rounded-xl sm:rounded-2xl border border-border/40 bg-surface/40 shadow-card">
              <div className="hunt-image-card__media">
                <img src={image} alt={assetName} className="w-full h-32 sm:h-auto object-cover" />
              </div>
              <div className="space-y-2 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">{assetName}</h2>
                  {ticker && <span className="rounded-full border border-border/40 px-2 py-0.5 text-xs text-muted-foreground flex-shrink-0">{ticker}</span>}
                </div>
                <p className="hunt-image-card__caption text-xs sm:text-sm text-muted-foreground">
                  Hunt the grid, locate coordinates, and redeem liquidity-backed tokens in real time.
                </p>
              </div>
            </div>
            <div className="space-y-3 rounded-xl sm:rounded-2xl border border-border/40 bg-surface/40 p-3 sm:p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">Progress</span>
                <span className="text-xs sm:text-sm font-medium text-foreground">{((foundTokens / maxTokens) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(foundTokens / maxTokens) * 100} className="h-2" />
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                <span>LPU {formatCurrency(lpu)}</span>
                <span>Max tokens {maxTokens}</span>
              </div>
            </div>
            <div className="space-y-2 rounded-xl sm:rounded-2xl border border-border/40 bg-surface/40 p-3 sm:p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">How to play</p>
              <ol className="list-decimal space-y-1 pl-4 text-[10px] sm:text-xs">
                <li>Tap a box to reveal its number pair.</li>
                <li>Locate the coordinate in the reference sheet.</li>
                <li>Enter the coordinate below to claim the token.</li>
              </ol>
            </div>
          </aside>

          {/* Main Game Area */}
          <section className="flex-1 space-y-4 sm:space-y-6 min-w-0">
            <div className="rounded-xl sm:rounded-2xl border border-border/40 bg-surface/40 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">
                <span className="whitespace-nowrap">Coordinate reference</span>
                <span className="hidden sm:inline whitespace-nowrap">Scroll to explore</span>
                <span className="sm:hidden whitespace-nowrap">Swipe right to see more →</span>
              </div>
              <div className="w-full overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch', maxHeight: '360px' }}>
                <table className="border-collapse text-[9px] sm:text-[10px] md:text-[11px]" style={{ minWidth: '100%', width: 'max-content' }}>
                  <thead>
                    <tr>
                      <th scope="col" className="sticky left-0 bg-muted w-8 sm:w-10 h-6 sm:h-8 text-center font-medium text-muted-foreground z-10"></th>
                      {LETTERS.map((letter) => (
                        <th
                          key={letter}
                          scope="col"
                          className="sticky top-0 bg-muted w-12 sm:w-14 md:w-16 h-6 sm:h-8 text-center font-medium text-muted-foreground z-10"
                        >
                          {letter}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row}>
                        <th scope="row" className="sticky left-0 bg-muted w-8 sm:w-10 h-6 sm:h-7 text-center font-medium text-muted-foreground z-10">{row}</th>
                        {LETTERS.map((letter) => {
                          const coord = `${letter}${row}`;
                          const value = huntData.values[coord];
                          const isMatched = matched.has(coord);
                          const isFailed = failed.has(coord);
                          const isRevealed = revealed.has(coord);
                          return (
                            <td
                              key={coord}
                              className={`w-12 sm:w-14 md:w-16 h-6 sm:h-7 text-center font-mono transition-colors p-1 ${
                                isMatched 
                                  ? "bg-emerald-500/30 text-emerald-100 font-semibold" 
                                  : isFailed
                                  ? "bg-red-500/20 text-red-100 font-semibold"
                                  : isRevealed 
                                  ? "bg-muted text-foreground" 
                                  : "text-muted-foreground bg-background/50"
                              }`}
                            >
                              <div className="text-center leading-none">{value}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Input Section (desktop/tablet) */}
            <div className="hidden space-y-3 sm:block sm:space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">Enter coordinate</div>
                <div className="flex gap-2">
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
                    className="flex-1 min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                  />
                  <Button onClick={handleSubmit} className="px-4 py-2 text-sm">Submit</Button>
                </div>
              </div>
              {status && <p className={`text-xs sm:text-sm ${statusType === "success" ? "text-emerald-400" : "text-destructive"}`}>{status}</p>}
            </div>

            {/* Input Section (mobile floating bar) */}
            <div className="sm:hidden fixed inset-x-0 bottom-12 z-40 border-t border-border/40 bg-background/95 px-3 py-3 backdrop-blur-sm shadow-[0_-16px_32px_rgba(0,0,0,0.35)]">
              <div className="container mx-auto px-0">
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Enter coordinate</div>
                  <div className="flex gap-2">
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
                      className="flex-1 min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                    />
                    <Button onClick={handleSubmit} className="px-4 py-2 text-sm">Submit</Button>
                  </div>
                  {status && <p className={`text-xs ${statusType === "success" ? "text-emerald-400" : "text-destructive"}`}>{status}</p>}
                </div>
              </div>
            </div>

            {/* Hunt Grid - Fixed mobile layout */}
            <div className="space-y-2 sm:space-y-3">
              <div className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">Hunt grid</div>
              <div className="rounded-xl border border-border/30 bg-surface/40 p-2 sm:p-3 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="grid auto-cols-min grid-flow-col gap-1 sm:gap-1.5" style={{ gridTemplateRows: 'repeat(7, minmax(32px, 1fr))' }}>
                  {huntData.boxes.map((coord) => {
                    const isMatched = matched.has(coord);
                    const isFailed = failed.has(coord);
                    const isRevealed = revealed.has(coord);
                    const value = huntData.values[coord];
                    return (
                      <button
                        key={coord}
                        type="button"
                        onClick={() => handleReveal(coord)}
                        disabled={isMatched}
                        className={`aspect-square rounded border text-[8px] sm:text-[9px] md:text-[10px] font-semibold transition-colors flex items-center justify-center min-w-[32px] sm:min-w-[40px] min-h-[32px] sm:min-h-[40px] ${
                          isMatched
                            ? "border-emerald-400/70 bg-emerald-500/25 text-emerald-50 cursor-not-allowed"
                            : isFailed
                            ? "border-red-400/70 bg-red-500/20 text-red-100 cursor-pointer"
                            : isRevealed
                            ? "border-border bg-muted text-foreground cursor-pointer"
                            : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground active:scale-95 cursor-pointer"
                        }`}
                      >
                        <span className="block text-center leading-none p-0.5 break-all">
                          {isMatched ? "" : isFailed ? "" : isRevealed ? value : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
