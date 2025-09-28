import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Brain, Infinity, Target } from "lucide-react";

const challenges = [
  {
    icon: AlertTriangle,
    headline: "Floors collapse once hype fades",
    copy: "LFTs assign a mandatory liquidity contribution on every mint so reserve coverage scales with your community. No more empty treasuries or rug-prone floors.",
  },
  {
    icon: Brain,
    headline: "Revenue splits are opaque",
    copy: "Programmable buckets stream value to the creator desk, holder rewards, seed-next, and platform in real time—fully auditable on-chain.",
  },
  {
    icon: Infinity,
    headline: "Cycles stall without forward momentum",
    copy: "Reserve growth continuously seeds the next activation so your story keeps unlocking new chapters without manual fundraisers.",
  },
  {
    icon: Target,
    headline: "Hunters lack predictable upside",
    copy: "Finders redeem at live LPU or convert to yield, meaning collectors see clear, predictable value for participating in hunts.",
  },
];

const DropsSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 space-y-16">
        <div className="relative rounded-3xl border border-border/40 bg-gradient-to-r from-background via-surface/70 to-background overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-12 p-10 lg:p-16">
            <div className="space-y-6">
              <Badge variant="secondary" className="w-fit bg-foreground text-background uppercase tracking-wide">
                The LFT difference
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Turn every drop into a compounding revenue machine
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Traditional NFT launches leave communities guessing where liquidity lives. LFTs wire proceeds into transparent smart-contract buckets so you can point to exactly what backs the floor and where future chapters are funded.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg">Review Tokenomics</Button>
                <Button variant="outline" size="lg">See Live Campaigns</Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background/80 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Where the $1 mint travels</h3>
              <div className="space-y-3 text-sm">
                <SplitRow label="Creator desk" value="50%" color="bg-blue-400" />
                <SplitRow label="Liquidity contribution" value="10%" color="bg-emerald-400" />
                <SplitRow label="Reserve growth" value="20%" color="bg-purple-400" />
                <SplitRow label="Holder rewards" value="5%" color="bg-orange-400" />
                <SplitRow label="Platform + operations" value="15%" color="bg-pink-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {challenges.map((item) => (
            <div key={item.headline} className="rounded-2xl border border-border/40 bg-surface/40 p-6 space-y-3">
              <item.icon className="h-6 w-6 text-foreground" />
              <h3 className="text-xl font-semibold text-foreground">{item.headline}</h3>
              <p className="text-sm text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SplitRow = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
    <span className="font-mono text-sm text-foreground">{value}</span>
  </div>
);

export default DropsSection;
