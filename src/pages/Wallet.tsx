import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, ExternalLink, KeyRound, Wallet2 } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const toNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function Wallet() {
  const { assets, userAssets, getAssetCoinTagCodes, user } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const walletRows = useMemo(() => {
    return assets
      .map((asset) => {
        const balances = userAssets[asset.id];
        const ownedCoinTags = toNumeric(balances?.coinTags);
        const codes = getAssetCoinTagCodes(asset.id);
        return {
          asset,
          ownedCoinTags,
          codes,
          visibleCount: Math.max(ownedCoinTags, codes.length),
        };
      })
      .filter(({ asset, visibleCount }) => {
        if (visibleCount <= 0) return false;
        if (!normalizedQuery) return true;
        const name = asset.name.toLowerCase();
        const ticker = asset.ticker?.toLowerCase() ?? "";
        return name.includes(normalizedQuery) || ticker.includes(normalizedQuery);
      })
      .sort((a, b) => b.visibleCount - a.visibleCount);
  }, [assets, userAssets, getAssetCoinTagCodes, normalizedQuery]);

  const totals = useMemo(() => {
    return walletRows.reduce(
      (acc, row) => {
        acc.coinTags += row.visibleCount;
        acc.codes += row.codes.length;
        return acc;
      },
      { coinTags: 0, codes: 0 },
    );
  }, [walletRows]);

  const copyCode = async (code: string) => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied",
        description: `${code} copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy code. Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 pb-10 pt-3 space-y-6 sm:pt-8">
        <Card className="rounded-3xl border-0 bg-transparent p-0 shadow-none">
          <CardContent className="grid grid-cols-1 gap-4 p-0 text-foreground sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-surface/70 p-4">
              <p className="text-xs uppercase text-muted-foreground">Total CoinTags</p>
              <p className="mt-1 text-3xl font-semibold">{totals.coinTags}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-surface/70 p-4">
              <p className="text-xs uppercase text-muted-foreground">Code Entries</p>
              <p className="mt-1 text-3xl font-semibold">{totals.codes}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-surface/70 p-4">
              <p className="text-xs uppercase text-muted-foreground">Wallet Balance</p>
              <p className="mt-1 text-3xl font-semibold">{formatCurrency(user.usd)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 bg-surface/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Wallet2 className="h-5 w-5" />
              Asset CoinTag Wallet
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              View every CoinTag you own by asset, including the code assigned at purchase.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search asset by name or ticker"
              className="h-11"
            />

            {walletRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No CoinTag codes found yet. Buy CoinTags from an asset page to populate your wallet.
                </p>
                <Button className="mt-4" onClick={() => navigate("/assets")}>
                  Browse Assets
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {walletRows.map(({ asset, codes, ownedCoinTags, visibleCount }) => (
                  <article
                    key={asset.id}
                    className="rounded-2xl border border-border/60 bg-background/40 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={asset.image}
                          alt={asset.name}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{asset.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {visibleCount} CoinTag{visibleCount === 1 ? "" : "s"} • {codes.length} code
                            {codes.length === 1 ? "" : "s"} • Cycle {asset.cycle.cycle}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="h-11 w-full sm:w-auto"
                        onClick={() => navigate(`/assets/${asset.id}`)}
                      >
                        Open Asset
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {codes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                        You currently hold {ownedCoinTags} CoinTag{ownedCoinTags === 1 ? "" : "s"}, but no codes are synced yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {codes.map((code) => (
                          <div
                            key={`${asset.id}-${code}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-surface/70 px-3 py-2"
                          >
                            <span className="flex items-center gap-2 font-mono text-sm text-foreground">
                              <KeyRound className="h-4 w-4 text-muted-foreground" />
                              {code}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11"
                              onClick={() => copyCode(code)}
                              aria-label={`Copy code ${code}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
