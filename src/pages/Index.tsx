import { useEffect, useState } from "react";
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
  const [navDropped, setNavDropped] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      setNavDropped(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="font-glacial min-h-screen bg-white text-black">
      <main className="flex flex-col">
        <section id="hero" className="relative bg-white">
          <header
            className={`sticky top-0 z-50 flex w-full items-center justify-between border-b border-black/10 px-4 py-4 text-xs sm:text-sm lg:px-10 transition-all duration-300 ease-out ${
              navDropped
                ? "bg-white/95 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.08)] animate-[nav-drop_0.35s_ease-out]"
                : "bg-white"
            }`}
          >
            <div className="flex items-center gap-4">
              <img src="/OPY.png" alt="Trone logo" className="h-8 w-8 rounded-md object-cover" />
              <span className="text-sm font-semibold uppercase tracking-[0.35em]">Trone</span>
            </div>
            <nav className="hidden items-center gap-6 font-medium text-black/70 md:flex">
              <a
                href="#what"
                className="transition hover:text-black"
                onClick={() => handleCta("nav_overview")}
              >
                Overview
              </a>
              <a
                href="#mechanics"
                className="transition hover:text-black"
                onClick={() => handleCta("nav_mechanics")}
              >
                Mechanics
              </a>
              <a
                href="#audience"
                className="transition hover:text-black"
                onClick={() => handleCta("nav_use_cases")}
              >
                Use cases
              </a>
            </nav>
            <div className="flex items-center gap-3 text-xs font-medium text-black/80 sm:text-sm">
              <Button
                size="sm"
                className="rounded-full border border-black bg-black px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-black/80 sm:px-5 sm:text-xs"
                onClick={() => handleCta("nav_launch", "/assets")}
              >
                Launch console
              </Button>
            </div>
          </header>

          <div className="grid w-full gap-12 px-6 pb-24 pt-20 text-left lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:px-12">
            <div className="flex flex-col gap-12">
              <div className="space-y-6">
                <p className="text-sm font-medium uppercase tracking-[0.35em] text-black/60">
                  Liquidity funded tokens
                </p>
                <h1 className="text-4xl font-semibold leading-tight text-black sm:text-5xl lg:text-7xl">
                  Liquidity-backed launches for calm, durable ecosystems.
                </h1>
                <p className="text-lg text-black/70 sm:text-xl">
                  Trone’s Liquidity Funded Tokens seed verifiable reserves before the first trade.
                  Every cycle compounds transparent floors, automated rewards, and reporting that
                  holders and creators can audit in real time.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <Button
                  size="lg"
                  className="rounded-full border border-black bg-black px-12 text-white transition hover:bg-black/80"
                  onClick={() => handleCta("cta_primary", "/assets")}
                >
                  Get started
                </Button>
                <div className="flex flex-col gap-1 text-sm text-black/60">
                  <span className="font-semibold text-black">Available for</span>
                  <span>teams ready to launch with provable reserves and engaged communities.</span>
                </div>
              </div>

              {trustSignals.length > 0 && (
                <ul className="grid gap-3 text-sm text-black sm:grid-cols-3">
                  {trustSignals.map((signal) => (
                    <li
                      key={signal}
                      className="flex items-start gap-2 rounded-xl border border-black/10 bg-white p-3"
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-black" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-12 text-black/70 lg:items-end">
              <div className="max-w-md text-base leading-relaxed lg:text-right">
                <p>
                  Deploy new assets with predictable floors, measurable liquidity health, and
                  redemption mechanics encoded on-chain. Investors see cycle data before they
                  participate; creators earn recurring revenue without sacrificing trust.
                </p>
              </div>
              <div className="flex flex-col gap-3 text-xs uppercase tracking-[0.3em] text-black/50 lg:items-end">
                <span>EST. BLOCK 18921579</span>
                <span>Proof-of-liquidity since genesis</span>
              </div>
            </div>
          </div>
        </section>

  {/* Floating partner logos below hero */}
  {/* Inserted component renders two continuous horizontal marquees */}
  <FloatingLogos />

        <section id="what" className="bg-white py-16">
          <div className="relative z-10 flex w-full px-6 lg:px-12">
            <div className="relative w-full overflow-hidden border border-black/10 bg-white text-black lg:text-xs">
              {/* Top meta strip */}
              <div className="relative z-10 flex divide-x divide-black/10 border-b border-black/10 text-[10px] uppercase tracking-[0.45em] text-black sm:text-[11px] lg:text-[10px]">
                <div className="flex flex-1 items-center gap-2 px-4 py-3">
                  <img src="/OPY.png" alt="Trone logo" className="h-6 w-6 rounded-full" />
                  <span className="font-semibold tracking-[0.35em] text-black">Trone</span>
                </div>
                <div className="flex items-center justify-center px-4 py-3 text-lg text-black sm:px-6">×</div>
                <a
                  href="https://opencitadel.xyz"
                  className="flex flex-1 items-center justify-between gap-3 px-4 py-3 text-black transition hover:text-black sm:px-6"
                >
                  <span className="tracking-[0.35em]">opencitadel.xyz</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {/* Body */}
              <div className="relative z-10 border-t border-black/10">
                <div className="relative flex flex-col gap-6 px-6 py-8 text-left sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                  <div className="space-y-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-black sm:text-xs">Why LFTs Matter</p>
                    <h2 className="text-2xl font-semibold text-black sm:text-3xl lg:text-2xl">
                      Liquidity-backed. Trust by default.
                    </h2>
                    <div className="text-sm text-black sm:text-base lg:text-sm space-y-3">
                      <p>
                        In traditional launches, speculation drives volatility and uncertainty. With LFTs, every cycle begins with <strong>real liquidity locked in smart contracts</strong>, so the market’s foundation is visible, verifiable, and sustainable.
                      </p>
                      <p>
                        Reserves grow through <strong>CoinTag discovery events</strong> — where new demand automatically feeds back into the pool — turning community activity into genuine value creation.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border border-black/10 bg-white px-4 py-3 text-black">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black">No rugs</p>
                      <p className="mt-1 text-sm font-medium">Reserves and flows stay on-chain. Redemption never disappears.</p>
                    </div>
                    <div className="rounded-md border border-black/10 bg-white px-4 py-3 text-black">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black">Calm cycles</p>
                      <p className="mt-1 text-sm font-medium">Discovery, rewards, and creator income stay in sync each launch.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="mechanics" className="bg-white py-12 md:py-16 -mt-8 md:-mt-10">
          <div className="relative z-10 flex w-full px-6 lg:px-12">
            <div className="relative w-full overflow-hidden border border-black/10 bg-white text-black">
              <div className="relative flex flex-col gap-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
                <div className="flex flex-col gap-4 text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.4em] text-black">
                    How it works
                  </div>
                  <h2 className="text-3xl font-semibold text-black sm:text-4xl">
                    A quiet, verifiable cycle
                  </h2>
                  <p className="text-sm text-black sm:text-base">
                    A quiet, verifiable cycle: lock real reserves, let discovery drive growth, and share upside with holders and creators through automated, on-chain flows.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  {mechanics.map((item) => (
                    <div key={item.title} className="flex flex-col gap-3 border border-black/10 bg-white px-4 py-5 text-black">
                      <h3 className="text-base font-semibold text-black">{item.title}</h3>
                      <p className="text-sm text-black">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="audience" className="bg-white py-20">
          <div className="relative z-10 flex w-full px-6 lg:px-12">
            <div className="relative w-full overflow-hidden border border-black/10 bg-white text-black">
              <div className="relative z-10 grid grid-cols-1 items-center gap-8 px-6 py-10 sm:grid-cols-2 sm:px-10 sm:py-12 lg:px-12">
                {/* Left: image (on mobile this appears above content) */}
                <div className="flex justify-center sm:justify-start">
                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-2">
                    <img src="/x2.png" alt="Creator visual" className="h-48 w-48 rounded-lg object-cover" />
                  </div>
                </div>

                {/* Right: content */}
                <div className="flex flex-col gap-6">
                  <p className="text-xs font-medium uppercase tracking-[0.35em] text-black">For Creators</p>
                  <h3 className="text-2xl font-bold text-black">Launch once. Grow continuously.</h3>
                  <p className="text-base text-black">
                    Seed verifiable reserves for confidence and stability. Engage your community through transparent discovery cycles, and capture recurring income with every round of growth.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border border-black/10 bg-white px-4 py-3 text-black">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black">Tools</p>
                      <p className="mt-1 text-sm font-medium">Creator-friendly primitives for managing cycles.</p>
                    </div>
                    <div className="rounded-md border border-black/10 bg-white px-4 py-3 text-black">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black">Rewards</p>
                      <p className="mt-1 text-sm font-medium">Automated payouts and transparent analytics.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border border-black/10 bg-white px-4 py-3 text-black">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-black">For Collectors</p>
                    <p className="mt-1 text-sm font-medium">
                      Build with a visible floor and share in the upside. Every reserve balance and reward flow is published on-chain in real time.
                    </p>
                  </div>
                  <div className="rounded-md border border-black/10 bg-white px-4 py-3 text-black">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-black">Trust</p>
                    <p className="mt-1 text-sm font-medium">Transparency without middlemen — on-chain balances, flows, and cycle reporting.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* New full-width centered section: LFTs by Trone (moved after mechanics) */}
        <section id="lfts-by-opy" className="bg-white py-24">
          <div className="relative z-10 w-full px-6 text-center lg:px-12">
            <div className="mb-8 border-t border-black/10" />
            <h2 className="text-5xl font-bold text-black leading-tight md:text-6xl lg:text-7xl">
              LFTs by Trone
            </h2>
            <p className="mt-6 text-lg text-black">
              A new standard for liquidity-backed collectibles and revenue-sharing tokens, designed for creators and collectors.
            </p>
          </div>
        </section>

        <section id="citadel-protocol" className="bg-white py-20">
          <div className="relative z-10 w-full px-6 lg:px-12">
            <div className="relative w-full overflow-hidden border border-black/10 bg-white text-black">
              <div className="relative z-10 px-6 py-12 sm:px-10 lg:px-12">
                <div className="mb-6 border-t-2 border-black/10 pt-6"></div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-black">The Trone Protocol</p>
                <h2 className="mt-4 text-5xl font-bold text-black leading-tight md:text-6xl lg:text-7xl">
                  Powering calm, durable ecosystems.
                </h2>
                <p className="mt-6 text-lg text-black">
                  Trone makes LFTs possible — a protocol for liquidity-backed collectibles and revenue-sharing tokens.
                </p>

                <div className="mt-12 grid gap-6 sm:grid-cols-3">
                  <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 text-black" />
                      <span className="text-base text-black">Automated transitions prevent surprise dilution</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 text-black" />
                      <span className="text-base text-black">Open APIs make verification effortless</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 text-black" />
                      <span className="text-base text-black">Every promise is enforced on-chain</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="bg-white py-24">
          <div className="relative z-10 flex w-full flex-col items-center gap-8 px-6 text-center lg:px-12">
            <h2 className="text-4xl font-bold text-black sm:text-5xl">
              Build with a floor. Share in the upside.
            </h2>
            <p className="text-lg text-black">
              Trone pairs creator-friendly economics with collector confidence. Launch a cycle or join the waitlist to explore what LFTs can do for your community.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="rounded-full border border-black px-12 text-black transition hover:bg-neutral-200"
                onClick={() => handleCta("cta_primary", "/assets")}
              >
                Launch the Asset Desk
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white">
        <div className="flex w-full flex-col gap-6 px-6 py-12 text-sm text-black sm:flex-row sm:items-center sm:justify-between lg:px-12">
          <div>
            <span className="text-base font-medium text-black">Trone</span>
            <p className="text-xs text-black">Liquidity Funded Tokens for calm, durable ecosystems.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-black">
            <a href="#what" className="hover:underline">
              Overview
            </a>
            <a href="#mechanics" className="hover:underline">
              Mechanics
            </a>
            <a href="#audience" className="hover:underline">
              Use Cases
            </a>
            <a href="#assurance" className="hover:underline">
              Trust
            </a>
            <a href="#cta" className="hover:underline">
              Get Started
            </a>
          </nav>
          <p className="text-xs text-black">© {new Date().getFullYear()} Trone.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
