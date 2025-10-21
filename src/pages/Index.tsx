import { useState } from "react";
import { Button } from "@/components/ui/button";
import FloatingLogos from "@/components/FloatingLogos";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type TrackingPayload = Record<string, unknown>;

const trustSignals: string[] = [];

const mechanics = [
  {
    title: "Lock real reserves",
    description:
      "Creators seed a verifiable liquidity pool so every participant sees the floor before the first token is issued.",
  },
  {
    title: "Discovery fuels growth",
    description:
      "CoinTags and hunts route revenue into the reserve and rewards engine—no inflation, just compounding backing.",
  },
  {
    title: "Share the upside",
    description:
      "Smart contracts stream holder rewards while creators capture sustainable income each cycle.",
  },
];

const audienceHighlights = [
  {
    title: "Creators",
    description:
      "Launch once, grow continuously. Liquidity-backed drops keep communities engaged without grinding on secondary sales.",
  },
  {
    title: "Collectors",
    description:
      "Hold assets with a visible floor and cash-flow potential. No rugs—just transparent reserves and cycle reporting.",
  },
];

const assurancePoints = [
  "Reserves and reward flows are published on-chain in real time.",
  "Cycle transitions are automated to prevent surprise dilution or shutdowns.",
  "Open APIs and docs make it simple to verify every metric yourself.",
];

const trackEvent = (event: string, payload: TrackingPayload = {}) => {
  if (typeof window === "undefined") return;

  const anyWindow = window as typeof window & {
    analytics?: { track?: (name: string, data?: TrackingPayload) => void };
    dataLayer?: Array<Record<string, unknown>>;
  };

  try {
    anyWindow.analytics?.track?.(event, payload);
  } catch {
    // ignore analytics failures
  }

  anyWindow.dataLayer?.push?.({ event, ...payload });
};

const Index = () => {
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCta = (location: string, href?: string, options?: { newTab?: boolean }) => {
    trackEvent("cta_click", { location });

    if (!href) return;

    if (options?.newTab) {
      if (typeof window !== "undefined") {
        window.open(href, "_blank", "noopener,noreferrer");
      }
      return;
    }

    const isExternal = /^(https?:|mailto:|tel:)/i.test(href);
    if (isExternal) {
      if (typeof window !== "undefined") {
        window.location.href = href;
      }
      return;
    }

    navigate(href);
  };

  return (
    <div className="font-glacial min-h-screen bg-black text-slate-50">
      <main className="flex flex-col">
        <section
          id="hero"
          className="relative overflow-hidden bg-gradient-to-b from-emerald-500/30 via-black/60 to-transparent"
        >
          <div
            className="pointer-events-none absolute inset-0 z-0 hidden opacity-30 md:block"
            style={{
              backgroundImage:
                "linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "90px 90px",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 -top-36 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.26),_transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-24 text-center lg:pb-28 lg:pt-32">
            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-10">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-emerald-300">
                  Liquidity Funded Tokens
                </div>
                <h1 className="text-4xl font-medium leading-tight text-white md:text-5xl lg:text-6xl">
                  Turn speculation into sustainable value.
                </h1>
                <p className="text-lg text-slate-300 md:text-xl">
                  LFTs are a new kind of digital asset — <strong>liquidity-backed from day one</strong>, <strong>fueled by real cash flows</strong>, and <strong>built for creators and holders, not hype</strong>. Each token is anchored by verifiable on-chain reserves, creating a permanent floor of value that compounds over time as communities grow.
                </p>
              </div>
              {/* hero CTAs removed per design */}
              {trustSignals.length > 0 && (
                <ul className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  {trustSignals.map((signal) => (
                    <li
                      key={signal}
                      className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

  {/* Floating partner logos below hero */}
  {/* Inserted component renders two continuous horizontal marquees */}
  <FloatingLogos />

        
        <section id="what" className="bg-black py-16">
          <div className="absolute inset-0 pointer-events-none z-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 15% 25%,rgba(16,185,129,0.15),transparent 65%)'}} aria-hidden="true" />
          <div className="relative z-10 mx-auto flex w-full justify-center px-0 sm:px-4">
            <div className="relative w-full overflow-hidden border border-white/10 bg-black/80 text-foreground shadow-xl sm:max-w-3xl lg:max-w-4xl lg:text-xs">
              <div
                className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-emerald-500/20 via-emerald-500/6 to-transparent"
                aria-hidden="true"
              />
              {/* Top meta strip */}
              <div className="relative z-10 flex divide-x divide-white/10 border-b border-white/10 text-[10px] uppercase tracking-[0.45em] text-slate-300 sm:text-[11px] lg:text-[10px]">
                <div className="flex flex-1 items-center gap-2 px-4 py-3">
                  <img src="/OPY.png" alt="Trone logo" className="h-6 w-6 rounded-full" />
                  <span className="font-semibold tracking-[0.35em] text-slate-100">Trone</span>
                </div>
                <div className="flex items-center justify-center px-4 py-3 text-lg text-slate-400 sm:px-6">×</div>
                <a
                  href="https://opencitadel.xyz"
                  className="flex flex-1 items-center justify-between gap-3 px-4 py-3 text-slate-200 transition hover:text-white sm:px-6"
                >
                  <span className="tracking-[0.35em]">opencitadel.xyz</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {/* Body */}
              <div className="relative z-10 border-t border-white/10">
                <div className="relative flex flex-col gap-6 px-5 py-8 text-left sm:px-8 sm:py-10 lg:px-10 lg:py-12">
                  <div className="space-y-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-emerald-200 sm:text-xs">Why LFTs Matter</p>
                    <h2 className="text-2xl font-semibold text-white sm:text-3xl lg:text-2xl">
                      Liquidity-backed. Trust by default.
                    </h2>
                    <div className="text-sm text-slate-300 sm:text-base lg:text-sm space-y-3">
                      <p>
                        In traditional launches, speculation drives volatility and uncertainty. With LFTs, every cycle begins with <strong>real liquidity locked in smart contracts</strong>, so the market’s foundation is visible, verifiable, and sustainable.
                      </p>
                      <p>
                        Reserves grow through <strong>CoinTag discovery events</strong> — where new demand automatically feeds back into the pool — turning community activity into genuine value creation.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border border-white/10 bg-black/40 px-4 py-3 text-slate-200">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-200">No rugs</p>
                      <p className="mt-1 text-sm font-medium">Reserves and flows stay on-chain. Redemption never disappears.</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/40 px-4 py-3 text-slate-200">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-200">Calm cycles</p>
                      <p className="mt-1 text-sm font-medium">Discovery, rewards, and creator income stay in sync each launch.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="mechanics" className="bg-black py-12 md:py-16 -mt-8 md:-mt-10">
                <div className="absolute inset-0 pointer-events-none z-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 60% 30%,rgba(16,185,129,0.18),transparent 60%)'}} aria-hidden="true" />
                <div className="relative z-10 mx-auto flex w-full justify-center px-0 sm:px-4">
                  <div className="relative w-full overflow-hidden border border-white/10 bg-black/80 text-foreground shadow-xl sm:max-w-3xl lg:max-w-4xl">
              <div
                className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-emerald-500/20 via-emerald-500/6 to-transparent"
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-10 px-6 py-10 sm:px-10 sm:py-12">
                <div className="flex flex-col gap-4 text-left">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.4em] text-black shadow-lg">
                    How it works
                  </div>
                  <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                    A quiet, verifiable cycle
                  </h2>
                  <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
                    A quiet, verifiable cycle: lock real reserves, let discovery drive growth, and share upside with holders and creators through automated, on-chain flows.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  {mechanics.map((item) => (
                    <div key={item.title} className="flex flex-col gap-3 border border-white/10 bg-black/40 px-4 py-5 text-slate-200">
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-slate-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

  <section id="audience" className="bg-black py-20">
    <div className="absolute inset-0 pointer-events-none z-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 30% 70%,rgba(236,72,153,0.12),transparent 60%)'}} aria-hidden="true" />
    <div className="relative z-10 mx-auto flex w-full justify-center px-0 sm:px-4">
      <div className="relative w-full overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-700/10 text-foreground shadow-xl sm:max-w-3xl lg:max-w-4xl">
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-emerald-500/18 via-emerald-500/8 to-transparent" aria-hidden="true" />
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8 px-6 py-10 sm:px-10 sm:py-12 items-center">
          {/* Left: image (on mobile this appears above content) */}
          <div className="flex justify-center sm:justify-start">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2">
              <img src="/x2.png" alt="Creator visual" className="h-48 w-48 object-cover rounded-lg" />
            </div>
          </div>

          {/* Right: content */}
          <div className="flex flex-col gap-6">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-emerald-200">For Creators</p>
            <h3 className="text-2xl font-bold text-white">Launch once. Grow continuously.</h3>
            <p className="text-base text-slate-300">Seed verifiable reserves for confidence and stability. Engage your community through transparent discovery cycles, and capture recurring income with every round of growth.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-black/40 px-4 py-3 text-slate-200">
                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-200">Tools</p>
                <p className="mt-1 text-sm font-medium">Creator-friendly primitives for managing cycles.</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/40 px-4 py-3 text-slate-200">
                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-200">Rewards</p>
                <p className="mt-1 text-sm font-medium">Automated payouts and transparent analytics.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-white/10 bg-black/40 px-4 py-3 text-slate-200">
              <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-200">For Collectors</p>
              <p className="mt-1 text-sm font-medium">Build with a visible floor and share in the upside. Every reserve balance and reward flow is published on-chain in real time.</p>
            </div>
            <div className="rounded-md border border-white/10 bg-black/40 px-4 py-3 text-slate-200">
              <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-200">Trust</p>
              <p className="mt-1 text-sm font-medium">Transparency without middlemen — on-chain balances, flows, and cycle reporting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

        {/* New full-width centered section: LFTs by Trone (moved after mechanics) */}
        <section id="lfts-by-opy" className="bg-black py-24">
          <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
            <div className="border-t border-white/10 mb-8" />
            <h2 className="text-5xl font-bold text-white leading-tight md:text-6xl lg:text-7xl">
              LFTs by Trone
            </h2>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-400">
              A new standard for liquidity-backed collectibles and revenue-sharing tokens, designed for creators and collectors.
            </p>
          </div>
        </section>

  <section id="citadel-protocol" className="bg-black py-20">
    <div className="absolute inset-0 pointer-events-none z-0 opacity-18" style={{backgroundImage:'radial-gradient(circle at 80% 20%,rgba(16,185,129,0.12),transparent 60%)'}} aria-hidden="true" />
    <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
      <div className="relative w-full overflow-hidden border border-white/8 bg-gradient-to-br from-emerald-900/28 via-emerald-800/18 to-black/6 text-foreground shadow-xl">
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-emerald-500/10 via-emerald-500/4 to-transparent" aria-hidden="true" />
        <div className="relative z-10 px-8 py-12">
          <div className="mb-6 border-t-2 border-emerald-700/12 pt-6"></div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-200">The Trone Protocol</p>
          <h2 className="mt-4 text-5xl font-bold text-white md:text-6xl lg:text-7xl drop-shadow-lg leading-tight">Powering calm, durable ecosystems.</h2>
          <p className="mt-6 max-w-3xl text-lg text-slate-200">
            Trone makes LFTs possible — a protocol for liquidity-backed collectibles and revenue-sharing tokens.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-700/18 bg-gradient-to-br from-black/30 to-black/10 p-6 shadow-xl backdrop-blur-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-400" />
                <span className="text-base text-slate-100">Automated transitions prevent surprise dilution</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-700/18 bg-gradient-to-br from-black/30 to-black/10 p-6 shadow-xl backdrop-blur-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-400" />
                <span className="text-base text-slate-100">Open APIs make verification effortless</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-700/18 bg-gradient-to-br from-black/30 to-black/10 p-6 shadow-xl backdrop-blur-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-400" />
                <span className="text-base text-slate-100">Every promise is enforced on-chain</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="cta" className="bg-black py-24">
          <div className="absolute inset-0 pointer-events-none z-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 50% 50%,rgba(16,185,129,0.18),transparent 60%)'}} aria-hidden="true" />
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center">
            <h2 className="text-4xl font-bold text-white sm:text-5xl drop-shadow-lg">
              Build with a floor. Share in the upside.
            </h2>
            <p className="max-w-2xl text-lg text-slate-200">
              Trone pairs creator-friendly economics with collector confidence. Launch a cycle or join the waitlist to explore what LFTs can do for your community.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="rounded-full px-12 bg-emerald-500 text-black font-bold shadow-lg hover:scale-105 transition-transform hover:bg-emerald-400"
                onClick={() => handleCta("cta_primary", "/assets")}
              >
                Launch the Asset Desk
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
  </main>

      <footer className="bg-black">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-base font-medium text-white">Trone</span>
            <p className="text-xs text-slate-500">Liquidity Funded Tokens for calm, durable ecosystems.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-slate-500">
            <a href="#what" className="hover:text-white">
              Overview
            </a>
            <a href="#mechanics" className="hover:text-white">
              Mechanics
            </a>
            <a href="#audience" className="hover:text-white">
              Use Cases
            </a>
            <a href="#assurance" className="hover:text-white">
              Trust
            </a>
            <a href="#cta" className="hover:text-white">
              Get Started
            </a>
          </nav>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Trone.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
