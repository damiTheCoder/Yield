import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  Coins,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Repeat,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type TrackingPayload = Record<string, unknown>;

type Persona = {
  value: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
};

type CaseSnapshot = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: { label: string; value: string }[];
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const trustSignals = [
  "Liquidity floor from inception (LPU backing)",
  "Ongoing holder rewards from real revenues (not inflation)",
  "Transparent, cycle-based mechanics",
];

const personaTabs: Persona[] = [
  {
    value: "creators",
    label: "Creators (Artists)",
    title: "50% of ongoing ecosystem revenue—not just a one-time mint.",
    description:
      "Launch ArtTags backed by liquidity from day one. Every drop routes real cash flow to you and the holders who power it.",
    bullets: [
      "Lock in a verifiable LPU so your collectors always know the floor.",
      "Blend storytelling, steady income, and discovery hunts without needing a trading desk.",
    ],
  },
  {
    value: "collectors",
    label: "Collectors",
    title: "Redeemable value floor plus recurring distributions.",
    description:
      "Build conviction positions that are underwritten by liquidity. Every cycle shares holder rewards sourced from net revenues.",
    bullets: [
      "Claim tokens with an instant baseline value thanks to the liquidity reserve.",
      "Earn automated rewards from cash flows instead of new-token inflation.",
    ],
  },
  {
    value: "traders",
    label: "Traders",
    title: "Opt into the YIELD market for cross-ecosystem exposure.",
    description:
      "Convert Class A holdings into freely tradable YIELD to capture spreads, liquidity moves, and market structure advantages.",
    bullets: [
      "Single YIELD/USDC market aggregates every ecosystem's supply.",
      "Arbitrage between LPU floors and market pricing with transparent data feeds.",
    ],
  },
  {
    value: "communities",
    label: "Communities/Meme projects",
    title: "Channel viral energy into liquidity-backed assets.",
    description:
      "Turn meme momentum into lasting value with cycle mechanics that recycle liquidity and reward your believers.",
    bullets: [
      "Discovery hunts and CoinTags gamify participation while building the reserve.",
      "Graceful cycle transitions prevent sudden collapses when the hype fades.",
    ],
  },
];

const howItWorksSteps = [
  {
    title: "Seed Liquidity",
    description:
      "Set a reserve, fix the initial supply, and publish a verifiable LPU so every participant understands the floor.",
  },
  {
    title: "Sell CoinTags",
    description:
      "CoinTags unlock access, discovery events, or perks. Revenue flows directly into the cycle treasury and rewards engine.",
  },
  {
    title: "Allocate Revenue",
    description:
      "Smart contracts route 50% Creator, 20% Reserve (next cycle), 15% Platform, 10% Liquidity (this cycle), and 5% Holder Rewards.",
  },
  {
    title: "Run Cycles",
    description:
      "Once the reserve threshold is met, the cycle closes, reserves seed the next drop, and value compounds for all stakeholders.",
  },
];

const revenueAllocation = [
  { label: "Creator", value: "50%" },
  { label: "Next-cycle reserve", value: "20%" },
  { label: "Platform", value: "15%" },
  { label: "Liquidity (current cycle)", value: "10%" },
  { label: "Holder rewards", value: "5%" },
];

const badgeStrip = ["Stability", "Sustainability", "Ongoing Rewards", "Fairness"];

const heroTokens = [
  {
    label: "YLD",
    change: "+3.4%",
    positive: true,
    positionClass: "left-4 top-12 md:left-[6%] md:top-[10%]",
    image: "/doodles.jpeg",
  },
  {
    label: "LFT",
    change: "+0.9%",
    positive: true,
    positionClass: "right-6 top-14 md:right-[6%] md:top-[12%]",
    image: "/alios.jpeg",
  },
  {
    label: "OP",
    change: "-2.4%",
    positive: false,
    positionClass: "right-8 top-1/2 md:right-[10%] md:top-[46%]",
    image: "/_ (14).jpeg",
  },
];

const conceptTokens = [
  {
    label: "YLD",
    price: "$2.4K",
    change: "+3.4%",
    positive: true,
    image: "/doodles.jpeg",
  },
  {
    label: "LFT",
    price: "$1.9K",
    change: "+0.9%",
    positive: true,
    image: "/alios.jpeg",
  },
  {
    label: "OP",
    price: "$1.1K",
    change: "-2.4%",
    positive: false,
    image: "/_ (14).jpeg",
  },
];

const caseSnapshots: CaseSnapshot[] = [
  {
    id: "digital-renaissance",
    title: "Digital Renaissance (Artist)",
    subtitle: "ArtTags ecosystem",
    description:
      "Shifted from a one-off mint to recurring monthly drops. Liquidity-backed ArtTags build a stronger community flywheel.",
    metrics: [
      { label: "Monthly CoinTags sold", value: "8,450*" },
      { label: "Current LPU", value: "$142.00*" },
      { label: "Rewards distributed", value: "$27.8K*" },
    ],
  },
  {
    id: "shibahunt",
    title: "ShibaHunt (Meme LFT)",
    subtitle: "Community treasure hunt",
    description:
      "Viral participation funds the liquidity reserve while discovery mechanics keep holders engaged beyond the meme cycle.",
    metrics: [
      { label: "Hunt participants", value: "32,500*" },
      { label: "Reserve grown", value: "+68% cycle-over-cycle*" },
      { label: "Creator income", value: "$54.2K*" },
    ],
  },
];

const marketFlowScenarios = [
  {
    condition: "When YIELD trades below avg LPU",
    action: "Arbitrageurs convert Class A into YIELD, sell into the market, and rebalance toward fundamentals.",
  },
  {
    condition: "When YIELD trades above avg LPU",
    action: "Traders repurchase Class A from ecosystems, reconvert, and tighten the spread without new inflation.",
  },
];

const transparencyPoints = [
  "On-chain proofs of liquidity reserves every cycle.",
  "Anti-whale mechanics and programmable governance levers.",
  "Graceful cycle termination with orderly redemption windows.",
];

const faqItems: FaqItem[] = [
  {
    id: "lpu-calculation",
    question: "How is LPU calculated and updated?",
    answer:
      "LPU (Liquidity Per Unit) equals the real-time liquidity reserve divided by outstanding Class A supply. It updates automatically with every funding or redemption event.",
  },
  {
    id: "coin-tags",
    question: "What do CoinTags do?",
    answer:
      "CoinTags are access passes to hunts, drops, or gated experiences. Revenue from CoinTags flows into the liquidity reserve and reward allocations.",
  },
  {
    id: "cycle-end",
    question: "What happens at cycle end?",
    answer:
      "When the reserve target is met, the cycle closes. A portion of revenue automatically seeds the next cycle while current holders keep their backing and rewards.",
  },
  {
    id: "class-a-trade",
    question: "Can I trade Class A tokens?",
    answer:
      "Class A LFTs are redeemable at LPU and intentionally non-transferable. Convert to YIELD to gain full liquidity across ecosystems.",
  },
  {
    id: "reward-sources",
    question: "Where do holder rewards come from?",
    answer:
      "5% of every cycle's net revenue funds the reward pool, streaming distributions to eligible Class A holders in real time.",
  },
];

type ComparisonColumn = {
  title: string;
  bullets: string[];
  highlight?: boolean;
};

const comparisonColumns: ComparisonColumn[] = [
  {
    title: "NFTs",
    bullets: [
      "Often launch without intrinsic backing.",
      "One-time mint revenue with limited ongoing upside.",
      "Floor prices decay when hype cools off.",
    ],
  },
  {
    title: "Memecoins",
    bullets: [
      "No provable floor value or redeemable reserve.",
      "Volatility depends on attention, not fundamentals.",
      "Pump-and-dump risk with opaque tokenomics.",
    ],
  },
  {
    title: "LFTs",
    bullets: [
      "Liquidity-backed floor that grows with the reserve.",
      "Recurring revenue splits across creators, holders, and future cycles.",
      "Transparent smart contracts align incentives and governance.",
    ],
    highlight: true,
  },
];

const docsLinks = [
  { label: "Whitepaper PDF", href: "/whitepaper.pdf", event: "open_whitepaper" },
  { label: "Risk & Mitigation Overview", href: "#trust", event: "open_risk_mitigation" },
  { label: "Developer Docs", href: "/docs", event: "open_docs" },
];

const trackEvent = (event: string, payload: TrackingPayload = {}) => {
  if (typeof window === "undefined") return;

  const anyWindow = window as typeof window & {
    analytics?: { track?: (name: string, data?: TrackingPayload) => void };
    dataLayer?: Array<Record<string, unknown>>;
  };

  try {
    anyWindow.analytics?.track?.(event, payload);
  } catch (error) {
    // no-op: analytics failures should never break the UX
  }

  anyWindow.dataLayer?.push?.({ event, ...payload });
};

const handleCta = (location: string, href?: string, options?: { newTab?: boolean }) => {
  trackEvent("cta_click", { location });

  if (!href || typeof window === "undefined") return;
  if (options?.newTab) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.href = href;
};

const Index = () => {
  const [activePersona, setActivePersona] = useState<string>(personaTabs[0].value);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="flex flex-col">
        <section id="hero" className="relative overflow-hidden border-b border-border/30 bg-gradient-to-b from-emerald-500/25 via-background to-background/60">
          <div
            className="pointer-events-none absolute inset-0 z-0 hidden opacity-30 md:block"
            style={{
              backgroundImage:
                "linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "90px 90px",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 -top-36 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.26),_transparent_70%)]" aria-hidden="true" />
          {heroTokens.map((token) => (
            <div
              key={token.label}
              className={`absolute z-[1] opacity-90 md:opacity-100 ${token.positionClass}`}
            >
              <button
                type="button"
                onClick={() => setActiveToken((prev) => (prev === token.label ? null : token.label))}
                className="flex animate-[float-soft_5s_ease-in-out_infinite] items-center gap-3 rounded-full border border-emerald-400/10 bg-black/20 px-3 py-2 backdrop-blur-sm md:px-4 md:py-3"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-full md:h-16 md:w-16">
                  <div
                    className={`absolute inset-0 rounded-full ${
                      token.positive ? "bg-emerald-500/20" : "bg-rose-500/20"
                    }`}
                  />
                  <div
                    className={`absolute inset-2 rounded-full border ${
                      token.positive ? "border-emerald-400/40" : "border-rose-400/40"
                    }`}
                  />
                  <img src={token.image} alt={`${token.label} art`} className="absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)] rounded-full object-cover" />
                  <div
                    className={`absolute inset-[-8px] rounded-full border ${
                      token.positive ? "border-emerald-400/30" : "border-rose-400/30"
                    } opacity-70`}
                    aria-hidden="true"
                  />
                  <div
                    className={`absolute inset-[-16px] rounded-full border ${
                      token.positive ? "border-emerald-400/20" : "border-rose-400/20"
                    } opacity-50`}
                    aria-hidden="true"
                  />
                </div>
                <div className="hidden flex-col text-left text-sm md:flex">
                  <span className="text-sm font-semibold text-emerald-50 tracking-wide">{token.label}</span>
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      token.positive ? "text-emerald-200" : "text-rose-300"
                    }`}
                  >
                    {token.positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    <span>{token.change}</span>
                  </div>
                </div>
              </button>
              {activeToken === token.label && (
                <div className="mt-2 flex items-center gap-3 rounded-full border border-emerald-400/10 bg-black/40 px-3 py-2 text-xs text-emerald-100 backdrop-blur-sm md:hidden">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/15" aria-hidden="true" />
                    <img src={token.image} alt={`${token.label} avatar badge`} className="absolute inset-[6px] h-[calc(100%-12px)] w-[calc(100%-12px)] rounded-full object-cover" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-foreground">{token.label}</span>
                    <div
                      className={`flex items-center gap-1 ${
                        token.positive ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {token.positive ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      <span>{token.change}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="container mx-auto px-4 pb-20 pt-24 text-center lg:pb-28 lg:pt-32">
            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-10">
              <span className="text-lg font-semibold uppercase tracking-[0.6em] text-emerald-200" style={{ fontFamily: 'Nasalization, var(--font-sans)' }}>
                YIELD
              </span>
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-emerald-300">
                  Liquidity Funded Tokens
                </div>
                <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                  Turn speculation into sustainable value.
                </h1>
                <p className="text-lg text-muted-foreground md:text-xl">
                  Liquidity Funded Tokens (LFTs) are a new asset class: liquidity-backed from day one, fueled by real cash flows, and designed to reward creators and holders—not just hype.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="group"
                  data-event="cta_click"
                  onClick={() => handleCta("hero_primary", "/market")}
                >
                  Launch App / Join Waitlist
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </div>
              <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                {trustSignals.map((signal) => (
                  <li key={signal} className="flex items-start gap-2 rounded-xl border border-border/40 bg-surface/40 p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="what" className="border-b border-border/20 bg-black">
          <div className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/40 px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                What is an LFT?
              </div>
              <h2 className="text-3xl font-semibold md:text-4xl">A value-backed, growth-driven digital asset</h2>
              <p className="text-base text-muted-foreground md:text-lg">
                Each Liquidity Funded Token ties to a live liquidity reserve. That reserve creates an always-on, redeemable LPU floor. As the ecosystem sells CoinTags and grows, the reserve compounds and rewards stream seamlessly—no hype cycle required.
              </p>
            </div>
            <div className="space-y-5">
              {conceptTokens.map((token) => (
                <div
                  key={token.label}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-border/40 bg-surface/60 px-4 py-4 shadow-card backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full md:h-16 md:w-16">
                      <div
                        className={`absolute inset-0 rounded-full ${
                          token.positive ? "bg-emerald-500/15" : "bg-rose-500/15"
                        }`}
                      />
                      <div
                        className={`absolute inset-2 rounded-full border ${
                          token.positive ? "border-emerald-400/40" : "border-rose-400/40"
                        }`}
                      />
                      <img
                        src={token.image}
                        alt={`${token.label} avatar`}
                        className="absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)] rounded-full object-cover"
                      />
                      <div
                        className={`absolute inset-[-8px] rounded-full border ${
                          token.positive ? "border-emerald-400/25" : "border-rose-400/25"
                        } opacity-70`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      <span className="text-base font-semibold text-foreground">{token.label}</span>
                      <span>{token.price}</span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      token.positive ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {token.positive ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{token.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="creators" className="border-b border-border/20 bg-black py-16">
          <span id="collectors" className="sr-only" aria-hidden="true" />
          <span id="yield" className="sr-only" aria-hidden="true" />
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold md:text-4xl">Who it&apos;s for</h2>
                <p className="text-muted-foreground md:text-lg">
                  Tailor the experience for creators, collectors, traders, and communities with tabbed perspectives.
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Tap a persona to see the value prop and action flow.
              </div>
            </div>
            <Tabs
              value={activePersona}
              onValueChange={(value) => {
                setActivePersona(value);
                trackEvent("tab_select_persona", { persona: value });
              }}
              className="space-y-6"
            >
              <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
                {personaTabs.map((persona) => (
                  <TabsTrigger
                    key={persona.value}
                    value={persona.value}
                    className="rounded-full border border-border/40 bg-background px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground data-[state=active]:border-emerald-400/60 data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-200"
                  >
                    {persona.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {personaTabs.map((persona) => (
                <TabsContent
                  key={persona.value}
                  value={persona.value}
                  className="mt-0"
                >
                  <Card className="border-border/40 bg-background/90 shadow-card">
                    <CardHeader className="space-y-3">
                      <CardTitle className="text-2xl font-semibold text-foreground">
                        {persona.title}
                      </CardTitle>
                      <CardDescription className="text-base text-muted-foreground">
                        {persona.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      <ul className="space-y-3 text-sm text-muted-foreground md:flex-1">
                        {persona.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-col gap-3 md:w-56">
                        <Button
                          variant="secondary"
                          className="justify-between"
                          onClick={() => handleCta(`persona_cta_${persona.value}`, "#how")}
                        >
                          See how setup works
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-between"
                          onClick={() => handleCta(`persona_docs_${persona.value}`, "#docs")}
                        >
                          Explore docs
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        <section id="how" className="border-b border-border/20 bg-black">
          <div className="container mx-auto px-4 py-16">
            <div className="grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold md:text-4xl">How it works</h2>
                  <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                    Four simple, auditable steps turn every cycle into a compounding engine for creators, holders, and the ecosystem treasury.
                  </p>
                </div>
                <ol className="space-y-5">
                  {howItWorksSteps.map((step, index) => (
                    <li key={step.title} className="flex gap-4 rounded-2xl border border-border/40 bg-surface/40 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-400/10 text-sm font-semibold text-emerald-200">
                        {index + 1}
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <Button
                    variant="secondary"
                    onClick={() => trackEvent("learn_more_cycle")}
                  >
                    View a sample cycle
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => trackEvent("open_pie_allocation")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 underline-offset-4 hover:underline"
                  >
                    Open allocation pie breakdown
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border/40 bg-surface/60 shadow-card">
                <img src="/Logo5.png" alt="Revenue allocation illustration" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section id="tiers" className="border-b border-border/20 bg-black">
          <div className="container mx-auto px-4 py-16">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Two-tier value system</h2>
              <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
                Choose certainty (Class A) or flexibility (YIELD). Conversion is one-way by design so the value floor remains untouched while a liquid market thrives.
              </p>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card className="border-border/40 bg-background/90 shadow-card">
                <CardHeader className="space-y-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-200">
                    <ShieldCheck className="h-5 w-5" />
                    Class A — Liquidity-backed LFTs
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Redeem at the live LPU, receive rewards, and anchor the ecosystem&apos;s fundamentals.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span>Redeem anytime at the published LPU baseline.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span>Earn automated holder rewards from 5% of revenues.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span>Non-transferable by default to preserve the redeemable floor.</span>
                    </li>
                  </ul>
                  <div className="rounded-2xl border border-border/40 bg-surface/40 p-4 text-xs text-muted-foreground">
                    <p className="font-medium uppercase tracking-wide text-foreground">Why hold Class A?</p>
                    <p>Ideal for fundamentals-first participants who value provable backing, income, and governance alignment.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-400/50 bg-emerald-500/5 shadow-card">
                <CardHeader className="space-y-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-200">
                    <Coins className="h-5 w-5" />
                    YIELD — Class B Market Token
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Convert Class A to unlock liquidity, divisibility, and unified exposure across ecosystems.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>Fully tradable and divisible in the global YIELD/USDC pool.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>Tracks the weighted average fundamentals of every LFT ecosystem.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>One-way conversion prevents dilution while enabling active strategies.</span>
                    </li>
                  </ul>
                  <div className="rounded-2xl border border-emerald-400/40 bg-background/70 p-4 text-xs text-muted-foreground">
                    <p className="font-medium uppercase tracking-wide text-foreground">Why convert?</p>
                    <p>Best for liquidity seekers, arbitrage desks, or structured strategies that thrive on cross-ecosystem exposure.</p>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => trackEvent("convert_to_yield_info_open")}
                  >
                    Understand conversion flow
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="mt-10 flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-px w-16 bg-border" />
                <Repeat className="h-4 w-4 text-emerald-300" />
                <div className="h-px w-16 bg-border" />
              </div>
              <p>One-way conversion: Class A → YIELD keeps the floor intact while powering open market liquidity.</p>
            </div>
          </div>
        </section>

        <section id="compare" className="border-b border-border/20 bg-black py-16">
          <div className="container mx-auto px-4">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Why LFTs win vs legacy models</h2>
              <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
                Compare Liquidity Funded Tokens against NFTs and memecoins to see how liquidity floors and recurring revenues create durable value.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {comparisonColumns.map((column) => (
                <Card
                  key={column.title}
                  className={`border-border/40 bg-surface/40 shadow-card ${column.highlight ? "border-emerald-400/50 bg-emerald-500/5" : ""}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      {column.title}
                      {column.highlight && <Sparkles className="h-4 w-4 text-emerald-300" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      {column.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <ArrowRight className="mt-1 h-3.5 w-3.5 text-emerald-300" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              {badgeStrip.map((badge) => (
                <span key={badge} className="rounded-full border border-border/40 bg-surface/40 px-3 py-1">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="cases" className="border-b border-border/20 bg-black py-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 space-y-4">
              <h2 className="text-3xl font-semibold md:text-4xl">Case snapshots</h2>
              <p className="max-w-3xl text-muted-foreground md:text-lg">
                Illustrative examples show how creators and communities compound value without speculative froth.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {caseSnapshots.map((snapshot) => (
                <Card key={snapshot.id} className="border-border/40 bg-background/90 shadow-card">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="h-5 w-5 text-emerald-300" />
                      {snapshot.title}
                    </CardTitle>
                    <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                      {snapshot.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">{snapshot.description}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {snapshot.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-2xl border border-border/40 bg-surface/40 p-4 text-center">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{metric.label}</div>
                          <div className="text-lg font-semibold text-foreground">{metric.value}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">* Examples, not financial guarantees. Use for narrative illustration only.</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="market-design" className="border-b border-border/20 bg-black py-16">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/40 px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Market design & efficiency
              </div>
              <h2 className="text-3xl font-semibold md:text-4xl">Unified YIELD market with natural arbitrage</h2>
              <ul className="space-y-3 text-sm text-muted-foreground md:text-base">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>Single YIELD/USDC venue aggregates conversions across every ecosystem.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>Arbitrage keeps YIELD aligned with the weighted average of published LPUs.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>Supply expands only when holders convert Class A to YIELD—no dilutive minting.</span>
                </li>
              </ul>
            </div>
            <Card className="border-border/40 bg-surface/30 shadow-card">
              <CardHeader className="space-y-2">
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                  Market guard-rails
                </CardTitle>
                <CardDescription>Schematic of how spreads tighten naturally.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {marketFlowScenarios.map((scenario) => (
                  <div key={scenario.condition} className="rounded-2xl border border-border/40 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-300">{scenario.condition}</p>
                    <p className="mt-2 text-foreground">{scenario.action}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                  Conversions drive price discovery without inflation.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="trust" className="border-b border-border/20 bg-black py-16">
          <div className="container mx-auto px-4">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Trust, transparency & risk</h2>
              <p className="max-w-3xl text-muted-foreground md:text-lg">
                Rigorous reporting and governance tooling keep every participant informed and protected.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {transparencyPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background/80 p-5 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              <Button
                variant="link"
                className="px-0 text-emerald-300"
                onClick={() => trackEvent("open_risk_mitigation")}
              >
                Read the Risk & Mitigation overview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section id="docs" className="border-b border-border/20 bg-black py-16">
          <div className="container mx-auto px-4">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold md:text-4xl">Docs & resources</h2>
              <p className="max-w-2xl text-muted-foreground md:text-lg">
                Deep dive into token mechanics, governance guard-rails, and implementation details.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docsLinks.map((link) => (
                <Card key={link.label} className="border-border/40 bg-surface/40 shadow-card">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">{link.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="secondary"
                      className="w-full justify-between"
                      onClick={() => {
                        trackEvent(link.event, { location: "docs" });
                        if (typeof window !== "undefined") {
                          if (link.href.startsWith("http")) {
                            window.open(link.href, "_blank", "noopener,noreferrer");
                          } else {
                            window.location.href = link.href;
                          }
                        }
                      }}
                    >
                      Open resource
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-b border-border/20 bg-black py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 space-y-4">
              <h2 className="text-3xl font-semibold md:text-4xl">FAQ</h2>
              <p className="max-w-2xl text-muted-foreground md:text-lg">
                Straight answers about liquidity mechanics, CoinTags, and redemption flows.
              </p>
            </div>
            <Accordion type="multiple" className="space-y-3">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="overflow-hidden rounded-2xl border border-border/40 bg-background/90">
                  <AccordionTrigger
                    className="px-6 py-4 text-left text-base font-medium text-foreground hover:text-emerald-200"
                    onClick={() => trackEvent("faq_open", { id: item.id })}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section id="final-cta" className="relative overflow-hidden bg-black py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),_transparent_70%)]" aria-hidden="true" />
          <div className="container relative mx-auto px-4">
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="text-3xl font-semibold md:text-4xl">Build or back assets with real fundamentals.</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="group"
                  onClick={() => handleCta("final_primary", "/market")}
                >
                  Launch App / Join Waitlist
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    trackEvent("open_whitepaper", { location: "final" });
                    handleCta("final_whitepaper", "/whitepaper.pdf", { newTab: true });
                  }}
                >
                  Read the Whitepaper
                  <FileText className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <p className="max-w-xl text-xs text-muted-foreground">
                Digital assets carry risk. LFT mechanics are transparent but not risk-free—review the docs, confirm local compliance, and align participation with your risk tolerance.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/20 bg-background/80">
        <div className="container mx-auto flex flex-col gap-6 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-base font-semibold text-foreground">Citadel Protocol</div>
            <p className="text-xs text-muted-foreground">Liquidity Funded Tokens • Powered by transparent cycle economics.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide">
            <a href="#how" className="hover:text-foreground/80">How It Works</a>
            <a href="#creators" className="hover:text-foreground/80">For Creators</a>
            <a href="#collectors" className="hover:text-foreground/80">For Collectors</a>
            <a href="#yield" className="hover:text-foreground/80">YIELD Market</a>
            <a href="#docs" className="hover:text-foreground/80">Docs</a>
          </nav>
          <p className="text-xs">© {new Date().getFullYear()} Citadel Protocol. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
