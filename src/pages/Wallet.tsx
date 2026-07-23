import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Copy,
  Pencil,
  Minus,
  Plus,
  SearchCheck,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-state";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, formatUnitCurrency } from "@/lib/utils";

const activity = [
  { type: "CoinTag purchase", detail: "Purchased CoinTags for hunts", amount: "-8.40 USDC", icon: ShoppingBag },
  { type: "LFT found", detail: "Discovered LFT from CoinTag", amount: "+1 LFT", icon: SearchCheck },
  { type: "LFT withdrawal", detail: "Withdrew redeemed LFT value", amount: "-4.20 USDC", icon: ArrowUpRight },
];

const avatarStyles = [
  {
    name: "Violet",
    bg: "bg-[#A99BF5]",
    blocks: ["bg-white", "bg-white", "bg-[#7F70D8]", "bg-white/80", "bg-[#D8D2FF]", "bg-white"],
  },
  {
    name: "Blue",
    bg: "bg-[#8FC7FF]",
    blocks: ["bg-white", "bg-[#2F66F6]", "bg-white/80", "bg-white", "bg-[#1E4FCC]", "bg-white"],
  },
  {
    name: "Mint",
    bg: "bg-[#89E6C2]",
    blocks: ["bg-white", "bg-[#0EA371]", "bg-white", "bg-white/80", "bg-[#067653]", "bg-white"],
  },
];

const avatarImages = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23A99BF5'/%3E%3Crect x='22' y='25' width='32' height='16' rx='8' fill='%23FFFFFF'/%3E%3Crect x='60' y='25' width='14' height='16' rx='7' fill='%23FFFFFF' opacity='.9'/%3E%3Crect x='22' y='47' width='15' height='15' rx='5' fill='%237F70D8'/%3E%3Crect x='43' y='47' width='32' height='15' rx='7.5' fill='%23FFFFFF'/%3E%3Crect x='22' y='68' width='15' height='15' rx='5' fill='%23D8D2FF'/%3E%3Crect x='43' y='68' width='15' height='15' rx='5' fill='%23FFFFFF'/%3E%3Ccircle cx='76' cy='27' r='4' fill='%23FFFFFF'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%238FC7FF'/%3E%3Crect x='22' y='25' width='32' height='16' rx='8' fill='%23FFFFFF'/%3E%3Crect x='60' y='25' width='14' height='16' rx='7' fill='%232F66F6'/%3E%3Crect x='22' y='47' width='15' height='15' rx='5' fill='%23FFFFFF' opacity='.85'/%3E%3Crect x='43' y='47' width='32' height='15' rx='7.5' fill='%23FFFFFF'/%3E%3Crect x='22' y='68' width='15' height='15' rx='5' fill='%231E4FCC'/%3E%3Crect x='43' y='68' width='15' height='15' rx='5' fill='%23FFFFFF'/%3E%3Ccircle cx='76' cy='27' r='4' fill='%23FFFFFF'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%2389E6C2'/%3E%3Crect x='22' y='25' width='32' height='16' rx='8' fill='%23FFFFFF'/%3E%3Crect x='60' y='25' width='14' height='16' rx='7' fill='%230EA371'/%3E%3Crect x='22' y='47' width='15' height='15' rx='5' fill='%23FFFFFF'/%3E%3Crect x='43' y='47' width='32' height='15' rx='7.5' fill='%23FFFFFF' opacity='.85'/%3E%3Crect x='22' y='68' width='15' height='15' rx='5' fill='%23067653'/%3E%3Crect x='43' y='68' width='15' height='15' rx='5' fill='%23FFFFFF'/%3E%3Ccircle cx='76' cy='27' r='4' fill='%23FFFFFF'/%3E%3C/svg%3E",
];

const getAvatarVariantFromImage = (avatar?: string) => {
  const index = avatarImages.findIndex((image) => image === avatar);
  return index >= 0 ? index : 0;
};

const toNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCompactUsd = (value: number) => {
  if (!Number.isFinite(value)) return "0";

  const abs = Math.abs(value);
  const units = [
    { value: 1_000_000_000_000, suffix: "t" },
    { value: 1_000_000_000, suffix: "b" },
    { value: 1_000_000, suffix: "m" },
    { value: 1_000, suffix: "k" },
  ];
  const unit = units.find((entry) => abs >= entry.value);

  if (!unit) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const scaled = abs / unit.value;
  const formatted = scaled >= 100 ? scaled.toFixed(1) : scaled >= 10 ? scaled.toFixed(2) : scaled.toFixed(3);
  const rounded = Number(formatted);
  const isExactUnit = Math.abs(abs % unit.value) < 0.000001;
  const compact = rounded % 1 === 0 && !isExactUnit ? formatted : formatted.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  return `${value < 0 ? "-" : ""}${compact}${unit.suffix}`;
};

const getAssetUnitPrice = (asset: {
  cycle: { reserve: number; supply: number; lpu: number };
  secondaryMarket?: { active: boolean; walv: number; liquidityPool?: number; supplyPool?: number };
}) => {
  if (asset.secondaryMarket?.active) {
    const supply = Math.max(0, asset.secondaryMarket.supplyPool ?? 0);
    const liquidity = Math.max(0, asset.secondaryMarket.liquidityPool ?? 0);
    return asset.secondaryMarket.walv || (supply > 0 ? liquidity / supply : 0);
  }

  const reserve = Math.max(0, asset.cycle.reserve);
  const supply = Math.max(0, asset.cycle.supply);
  return supply > 0 ? reserve / supply : asset.cycle.lpu;
};

function PixelAvatar({ variant, className }: { variant: number; className?: string }) {
  const style = avatarStyles[variant] ?? avatarStyles[0];

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full", style.bg, className)} aria-hidden="true">
      <div className="absolute inset-[18%] grid grid-cols-3 grid-rows-3 gap-[7%]">
        {style.blocks.map((block, index) => (
          <span
            key={`${style.name}-${index}`}
            className={cn(
              "rounded-[35%]",
              block,
              index === 0 && "col-span-2",
              index === 3 && "col-span-2",
            )}
          />
        ))}
      </div>
      <span className="absolute right-[24%] top-[23%] h-[10%] w-[10%] rounded-full bg-white/90" />
      <span className="absolute right-[13%] top-[20%] h-[13%] w-[13%] rounded-full bg-white/90" />
    </div>
  );
}

export default function Wallet() {
  const { toast } = useToast();
  const { assets, user, authUser, userAssets, depositUsd, withdrawUsd, updateAuthProfile } = useApp();
  const walletAddress = "0xc1...677d";
  const [profileName, setProfileName] = useState(authUser?.name ?? "grimfit86454");
  const [draftName, setDraftName] = useState(profileName);
  const [avatarVariant, setAvatarVariant] = useState(0);
  const [draftAvatarVariant, setDraftAvatarVariant] = useState(avatarVariant);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const ownedLftHoldings = assets
    .map((asset) => {
      const lfts = toNumeric(userAssets[asset.id]?.lfts);
      const unitPrice = getAssetUnitPrice(asset);
      return {
        asset,
        lfts,
        unitPrice,
        value: lfts * unitPrice,
      };
    })
    .filter((holding) => holding.lfts > 0)
    .sort((a, b) => b.value - a.value);
  const totalLftValue = ownedLftHoldings.reduce((sum, holding) => sum + holding.value, 0);

  useEffect(() => {
    if (!authUser) return;
    setProfileName(authUser.name);
    setDraftName(authUser.name);
    const savedVariant = getAvatarVariantFromImage(authUser.avatar);
    setAvatarVariant(savedVariant);
    setDraftAvatarVariant(savedVariant);
  }, [authUser]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText("0xc10000000000000000000000000000000000677d");
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the wallet address.",
        variant: "destructive",
      });
    }
  };

  const openProfileEditor = () => {
    setDraftName(profileName);
    setDraftAvatarVariant(avatarVariant);
    setIsEditingProfile(true);
  };

  const saveProfile = () => {
    const nextName = draftName.trim() || profileName;
    const nextAvatar = avatarImages[draftAvatarVariant] ?? avatarImages[0];
    setProfileName(nextName);
    setAvatarVariant(draftAvatarVariant);
    updateAuthProfile({ name: nextName, avatar: nextAvatar });
    setIsEditingProfile(false);
    toast({
      title: "Profile updated",
      description: "Your wallet profile was saved.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <div>
          <section className="overflow-hidden rounded-2xl bg-transparent">
            <div className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {authUser ? (
                    <img src={authUser.avatar} alt={authUser.name} className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-10 sm:w-10" />
                  ) : (
                    <PixelAvatar variant={avatarVariant} className="h-8 w-8 sm:h-10 sm:w-10" />
                  )}
                  <div className="min-w-0">
                    <p className="max-w-[8rem] truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:max-w-[11rem] sm:text-[11px]">
                      Solaris Wallet
                    </p>
                    <h1 className="mt-0.5 truncate text-xl font-black tracking-[-0.05em] text-foreground sm:text-2xl">
                      {profileName}
                    </h1>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-xl bg-transparent px-0 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground sm:text-sm"
                      aria-label="Copy wallet address"
                    >
                      <span className="truncate">{walletAddress}</span>
                      <Copy className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={openProfileEditor}
                  className="h-8 shrink-0 rounded-xl bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              </div>

              {isEditingProfile && (
                <div className="rounded-2xl bg-transparent p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <label htmlFor="profile-name" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Profile name
                      </label>
                      <Input
                        id="profile-name"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        className="mt-2 h-11 rounded-xl border-0 bg-transparent px-0 text-lg font-semibold"
                        maxLength={24}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {avatarStyles.map((style, index) => (
                        <button
                          key={style.name}
                          type="button"
                          onClick={() => setDraftAvatarVariant(index)}
                          className={cn(
                            "rounded-full p-1 transition",
                            draftAvatarVariant === index ? "bg-blue-500" : "bg-transparent",
                          )}
                          aria-label={`Use ${style.name} profile icon`}
                        >
                          <PixelAvatar variant={index} className="h-10 w-10" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                      className="h-10 rounded-xl border-0 bg-transparent"
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={saveProfile} className="h-10 rounded-xl bg-blue-500 text-white hover:bg-blue-600">
                      Save
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-transparent p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Trading Balance</p>
                    <button
                      type="button"
                      onClick={() => setBalanceDialogOpen(true)}
                      className="mt-2 block max-w-full text-left font-mono text-4xl font-black tracking-[-0.05em] text-foreground transition hover:text-blue-500 sm:text-5xl"
                      aria-label="Show exact trading balance"
                    >
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <img src="/usdc.png" alt="" className="h-10 w-10 rounded-full object-cover" />
                        <span>{formatCompactUsd(user.usd)}</span>
                      </span>
                    </button>
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      Ready for CoinTag hunts, redemptions, and liquidity-funded token trades.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => depositUsd(100)}
                      className="h-11 rounded-xl bg-blue-500 px-4 text-white hover:bg-blue-600"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => withdrawUsd(100)}
                      disabled={user.usd <= 0}
                      className="h-11 rounded-xl border-0 bg-transparent px-4 text-foreground hover:bg-transparent hover:text-foreground disabled:text-muted-foreground"
                    >
                      <Minus className="mr-2 h-4 w-4" />
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl bg-transparent p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-[-0.04em] text-foreground">LFT holdings</h2>
              <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(totalLftValue)}</span>
            </div>
            {ownedLftHoldings.length > 0 ? (
              <div className="mt-4 space-y-2">
                {ownedLftHoldings.map(({ asset, lfts, unitPrice, value }) => (
                  <div key={asset.id} className="flex items-center justify-between rounded-xl bg-transparent p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={asset.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{asset.name}</p>
                        <p className="text-xs font-medium text-muted-foreground">
                          {asset.ticker || asset.id.toUpperCase()} · {lfts} LFT{lfts === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(value)}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{formatUnitCurrency(unitPrice)} LPU</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-transparent p-4 text-sm font-medium text-muted-foreground">
                No owned LFT collections yet.
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-transparent p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-[-0.04em] text-foreground">Recent activity</h2>
              <span className="text-sm font-semibold text-muted-foreground">Today</span>
            </div>
            <div className="mt-4 space-y-2">
              {activity.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={`${item.type}-${item.detail}`} className="flex items-center justify-between rounded-xl bg-transparent p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{item.type}</p>
                        <p className="truncate text-xs font-medium text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-foreground">{item.amount}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="mx-auto w-[calc(100%-2rem)] max-w-xs rounded-2xl border-0 bg-background p-5 text-center shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Trading Balance</DialogTitle>
          </DialogHeader>
          <p className="font-mono text-2xl font-semibold text-foreground">
            <span className="inline-flex items-center justify-center gap-2">
              <img src="/usdc.png" alt="" className="h-8 w-8 rounded-full object-cover" />
              <span>{formatCurrency(user.usd).replace("$", "")}</span>
            </span>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
