import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight, Code2, FileText, Landmark, LockKeyhole, PackageOpen, Sparkles } from "lucide-react";

type TrackingPayload = Record<string, unknown>;

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

type ScrollDropProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  as?: "div" | "section";
};

const ScrollDrop = ({ children, className, id, delay = 0, as = "section" }: ScrollDropProps) => {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (delay) {
      node.style.setProperty("--scroll-drop-delay", `${delay}ms`);
    }

    const show = () => node.classList.add("scroll-drop-visible");

    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  const Component = as;
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Component id={id} ref={ref as any} className={cn("scroll-drop", className)}>
      {children}
    </Component>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [navDropped, setNavDropped] = useState(false);
  const [isDarkMode] = useState(true);
  const navLinks = [
    { label: "Foundation", href: "#difference", icon: Landmark },
    { label: "Token", href: "#solution", icon: PackageOpen },
    { label: "Airdrop", href: "#impact", icon: Sparkles },
    { label: "Staking", href: "#cta", icon: LockKeyhole },
    { label: "Build", href: "/coin-tags", icon: Code2 },
    { label: "Docs", href: "/blog", icon: FileText },
  ];
  const accentButtonClass = isDarkMode
    ? "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
    : "bg-neutral-200 text-black hover:bg-neutral-300 border border-neutral-200";
  const accentIconBgClass = isDarkMode ? "bg-neutral-700" : "bg-neutral-300";
  const accentIconWithTextClass = isDarkMode ? "bg-neutral-700 text-white" : "bg-neutral-200 text-black";

  const handleCta = (location: string, href?: string, options?: { newTab?: boolean }) => {
    trackEvent("cta_click", { location });

    if (!href) return;

    if (options?.newTab) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    const isExternal = /^(https?:|mailto:|tel:)/i.test(href);
    if (isExternal) {
      window.location.href = href;
      return;
    }

    navigate(href);
  };

  useEffect(() => {
    const handleScroll = () => setNavDropped(window.scrollY > 0);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (label: string, href: string) => {
    trackEvent("nav_click", { label });

    if (!href) return;
    if (href.startsWith("#")) {
      if (typeof document === "undefined") return;
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    handleCta(`nav_${label.toLowerCase()}`, href);
  };

  return (
    <div className={cn("relative font-glacial min-h-screen transition-colors duration-300", isDarkMode ? "bg-black text-white" : "bg-white text-black")}>
      <div className="relative z-10">
        <nav
          className={cn(
            "fixed inset-x-0 top-0 z-50 px-4 pt-4 transition-all duration-300 sm:px-6",
            navDropped
              ? isDarkMode
                ? "shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                : "shadow-[0_12px_40px_rgba(15,24,74,0.08)]"
              : "bg-transparent",
            navDropped && "header-glass-blur",
            navDropped && "landing-nav-mobile-gradient",
            navDropped && (isDarkMode ? "landing-nav-scrolled-dark" : "landing-nav-scrolled-light"),
          )}
        >
          <div
            className={cn(
              "relative z-10 mx-auto flex max-w-[1320px] items-center justify-between gap-3",
            )}
          >
            <button
              type="button"
              onClick={() => handleCta("nav_logo", "/")}
              className="flex h-14 items-center gap-3 rounded-xl bg-[#17171f] px-4 text-left ring-1 ring-white/[0.03] transition hover:bg-[#1d1d27] sm:h-16 sm:min-w-[184px] sm:px-7"
            >
              <span className="flex h-9 w-9 overflow-hidden rounded-lg bg-white sm:h-10 sm:w-10">
                <img
                  src="/h4.png"
                  alt="Solaris logo"
                  className="h-full w-full object-cover"
                />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-bold tracking-[-0.04em] text-white sm:text-2xl">Solaris</span>
              </div>
            </button>

            <div className="hidden h-16 flex-1 items-center justify-between rounded-xl bg-[#17171f] px-7 text-[15px] font-bold text-[#8d8e9c] ring-1 ring-white/[0.03] lg:flex">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handleNavClick(link.label, link.href)}
                  className="flex items-center gap-2.5 transition hover:text-white"
                >
                  <link.icon className="h-5 w-5" strokeWidth={2.4} />
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden md:block">
              <Button
                size="sm"
                className="h-14 rounded-xl border-0 bg-[#17171f] px-7 text-base font-bold text-white ring-1 ring-white/[0.03] transition hover:bg-[#242430] sm:h-16 sm:px-10"
                onClick={() => handleCta("nav_launch", "/assets")}
              >
                Launch App
              </Button>
            </div>
            <div className="flex flex-1 justify-end md:hidden">
              <Button
                variant="ghost"
                className="rounded-xl border border-white/10 bg-[#17171f] px-4 py-2 text-xs font-bold text-white"
                onClick={() => handleCta("nav_launch_mobile", "/assets")}
              >
                Launch
              </Button>
            </div>
          </div>
        </nav>
        <main className="flex w-full flex-col gap-28 pb-24 sm:gap-32 sm:pb-32 lg:gap-36">
          <section
            id="problem"
            className="relative min-h-[100svh] overflow-hidden border-b border-white/80 bg-[#111116] px-5 pt-28 text-white sm:px-8 sm:pt-32 lg:px-12 lg:pt-36"
            style={{
              backgroundImage: "url('/ks1.jpeg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[#111116]/36" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#111116]/12 via-[#111116]/35 to-[#111116]/78" />
              <div className="absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(90deg,rgba(133,69,255,0.08),rgba(218,145,255,0.12),rgba(133,69,255,0.06))] blur-3xl" />
              <div className="absolute left-[42%] top-[32%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full border border-white/[0.07]" />
              <div className="absolute right-[11%] top-[28%] h-[30rem] w-[30rem] rounded-full border border-white/[0.06]" />
              <div className="absolute left-[34%] top-[28%] h-[38rem] w-[44rem] border border-white/[0.08]" />
              <div className="absolute bottom-[13%] left-[33%] h-[11rem] w-[18rem] rounded-tl-[9rem] border border-white/[0.08]" />
              <div className="absolute bottom-[13%] right-[35%] h-[11rem] w-[18rem] rounded-br-[9rem] border border-white/[0.08]" />
            </div>
            <div className="relative mx-auto flex min-h-[calc(100svh-9rem)] max-w-[1240px] flex-col">
              <div className="max-w-[720px] pt-8 sm:pt-14 lg:pt-20">
                <h1 className="text-[clamp(3.35rem,10vw,7rem)] font-medium leading-[0.98] tracking-[-0.07em] text-white">
                  Liquidity Markets,
                  <span className="mt-6 block text-[#d681ff]">Limitless Value.</span>
                </h1>
                <div className="mt-10 inline-flex items-center gap-2 rounded-md bg-white/[0.07] px-4 py-3 font-mono text-sm font-bold text-white ring-1 ring-white/[0.04] sm:text-base">
                  <span>Built on and backed by</span>
                  <span className="inline-flex h-4 w-4 bg-white" />
                  <span className="text-xl font-black leading-none tracking-[-0.06em]">base</span>
                </div>
              </div>

              <div className="pointer-events-none absolute left-1/2 top-[54%] hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center md:flex">
                <div className="relative h-36 w-60 opacity-70 lg:h-44 lg:w-72 lg:opacity-100">
                  <div className="absolute left-7 top-10 h-24 w-24 rounded-br-[4.5rem] rounded-tl-sm bg-[#d681ff] shadow-[0_0_90px_rgba(214,129,255,0.72)]" />
                  <div className="absolute left-20 top-10 h-24 w-24 rounded-bl-[4.5rem] rounded-tr-sm bg-[#f0c9ff] shadow-[0_0_95px_rgba(240,201,255,0.72)]" />
                  <div className="absolute right-20 top-10 h-24 w-24 rounded-br-[4.5rem] rounded-tl-sm bg-[#f0c9ff] shadow-[0_0_95px_rgba(240,201,255,0.72)]" />
                  <div className="absolute right-7 top-10 h-24 w-24 rounded-bl-[4.5rem] rounded-tr-sm bg-[#d681ff] shadow-[0_0_90px_rgba(214,129,255,0.72)]" />
                </div>
              </div>

              <div className="mt-auto grid gap-8 pb-12 sm:pb-16 lg:grid-cols-[1fr_0.9fr] lg:items-end">
                <div className="hidden lg:block" />
                <div className="space-y-8 lg:justify-self-end lg:text-right">
                  <p className="max-w-[560px] text-2xl font-bold leading-tight tracking-[-0.04em] text-[#c9c9d1] sm:text-3xl">
                    Trade liquidity-backed tokens, collectible markets, and digital value cycles straight from your wallet.
                  </p>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 rounded-lg border-2 border-[#d9d9e2] bg-transparent px-7 text-lg font-bold text-white transition hover:bg-white hover:text-[#111116]"
                    onClick={() => handleCta("hero_trade_now", "/assets")}
                  >
                    Trade now
                    <ArrowRight className="ml-4 h-6 w-6" strokeWidth={2.4} />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 – Solution */}
          <ScrollDrop
            id="difference"
            className="grid gap-10 px-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:px-16"
          >
            <div className="order-1 mt-8 px-6 sm:px-12 lg:order-1 lg:mt-0 lg:flex lg:h-full lg:px-12">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-auto lg:h-full">
                <img
                  src="/d2.png"
                  alt="Liquidity funded tokens value cycle"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="order-2 space-y-6 px-6 sm:px-12 lg:pl-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b5cff]">The difference</p>
              <h2 className={cn("text-3xl font-semibold leading-tight sm:text-4xl", isDarkMode ? "text-white" : "text-black")}>
                The Solaris difference: liquidity, transparency, and growth.
              </h2>
              <p className={cn("text-base leading-relaxed sm:text-lg", isDarkMode ? "text-white" : "text-black")}>
                Solaris redefines digital ownership with Liquidity-Funded Tokens (LFTs) — assets backed by real liquidity
                from the first block. LFTs launch with a guaranteed redemption floor and self-appreciating mechanics. As
                the community engages, liquidity deepens automatically and every token becomes more valuable.
              </p>
              <ul className={cn("grid gap-2 text-sm sm:text-base", isDarkMode ? "text-white" : "text-black")}>
                <li className="flex items-start gap-2">
                  <span className={cn("mt-1 inline-block h-1.5 w-1.5 rounded-full", accentIconBgClass)} />
                  <span>Guaranteed floor value anchored by locked liquidity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={cn("mt-1 inline-block h-1.5 w-1.5 rounded-full", accentIconBgClass)} />
                  <span>Automatic appreciation as participation expands.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={cn("mt-1 inline-block h-1.5 w-1.5 rounded-full", accentIconBgClass)} />
                  <span>Skill-based discovery replaces panic-driven speculation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={cn("mt-1 inline-block h-1.5 w-1.5 rounded-full", accentIconBgClass)} />
                  <span>Locked pools that creators cannot drain.</span>
                </li>
              </ul>
              <blockquote className="rounded-3xl border border-[#dcd4ff] bg-[#f6f3ff] px-6 py-5 text-sm italic text-black">
                “Every LFT starts with real liquidity — and only gets stronger as the community grows.”
              </blockquote>
              <Button
                size="lg"
                className={cn("rounded-xl px-10 py-3 transition", accentButtonClass)}
                onClick={() => handleCta("cta_difference_learn", "/coin-tags")}
              >
                See how LFTs work
              </Button>
            </div>
          </ScrollDrop>

          {/* Section 3 – Solution */}
          <ScrollDrop
            id="solution"
            className="grid gap-10 px-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:px-16"
          >
            <div className="order-1 mt-8 px-6 sm:px-12 lg:order-1 lg:mt-0 lg:flex lg:h-full lg:px-12">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-auto lg:h-full">
                <img
                  src="/d3.jpeg"
                  alt="Step-by-step visuals showing the LFT lifecycle"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="order-2 space-y-6 px-6 sm:px-12 lg:pl-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b5cff]">The solution</p>
              <h2 className={cn("text-3xl font-semibold leading-tight sm:text-4xl", isDarkMode ? "text-white" : "text-black")}>
                We turn speculation into sustainable play.
              </h2>
              <p className={cn("text-base leading-relaxed sm:text-lg", isDarkMode ? "text-white" : "text-black")}>
                LFTs replace the buy-and-pray model with a discovery experience where every move reinforces the system.
              </p>
              <ol className={cn("space-y-4 text-sm sm:text-base", isDarkMode ? "text-white" : "text-black")}>
                {[
                  {
                    title: "Launch with liquidity",
                    description: "Creators seed an LFT with locked liquidity from day one.",
                  },
                  {
                    title: "Divide the pool",
                    description: "Liquidity splits into 1,000 tokens that inherit the floor value.",
                  },
                  {
                    title: "Hunt with CoinTags",
                    description: "Participants purchase CoinTags to uncover tokens on an encrypted grid.",
                  },
                  {
                    title: "Boost the floor",
                    description: "Thirty percent of every CoinTag sale flows into liquidity, lifting redemption value.",
                  },
                  {
                    title: "Redeem or hold",
                    description: "Players cash out at the floor or stay for the next appreciation cycle.",
                  },
                ].map((step, index) => (
                  <li key={step.title} className={cn("flex gap-3 rounded-3xl px-4 py-3", isDarkMode ? "bg-[#1a1a1a]" : "bg-[#f7f5ff]")}>
                    <span
                      className={cn(
                        "mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                        accentIconWithTextClass,
                      )}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className={cn("text-sm font-semibold uppercase tracking-wide", isDarkMode ? "text-white" : "text-black")}>{step.title}</p>
                      <p className={cn("text-sm", isDarkMode ? "text-white" : "text-black")}>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className={cn("text-base leading-relaxed sm:text-lg", isDarkMode ? "text-white" : "text-black")}>
                The outcome is a self-sustaining, cashflow-positive ecosystem where creators earn continuously, players
                profit transparently, and the community fuels lasting growth.
              </p>
              <Button
                size="lg"
                className={cn("rounded-xl px-10 py-3 transition", accentButtonClass)}
                onClick={() => handleCta("cta_solution_join", "/portfolio")}
              >
                Join the next generation of digital assets
              </Button>
            </div>
          </ScrollDrop>

          {/* Section 4 – Impact */}
          <ScrollDrop
            id="impact"
            className="grid gap-10 px-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:px-16"
          >
            <div className="order-1 mt-8 px-6 sm:px-12 lg:order-1 lg:mt-0 lg:flex lg:h-full lg:px-12">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-auto lg:h-full">
                <img
                  src="/d4.png"
                  alt="Comparison between NFTs, meme coins, and LFTs"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="order-2 space-y-6 px-6 sm:px-12 lg:pl-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b5cff]">The impact</p>
              <h2 className={cn("text-3xl font-semibold leading-tight sm:text-4xl", isDarkMode ? "text-white" : "text-black")}>
                Not just another token — a new digital asset standard.
              </h2>
              <div className={cn("overflow-hidden rounded-3xl border border-[#e6ddff] shadow-[0_20px_60px_rgba(16,18,36,0.08)]", isDarkMode ? "bg-[#1a1a1a]" : "bg-white")}>
                <table className={cn("w-full text-left text-sm sm:text-base", isDarkMode ? "text-white" : "text-black")}>
                  <thead className={cn("text-xs uppercase tracking-wide", isDarkMode ? "bg-[#2a2a2a] text-white" : "bg-[#f6f3ff] text-black")}>
                    <tr>
                      <th className="px-5 py-3">Problem (NFTs & meme coins)</th>
                      <th className="px-5 py-3">Solution (LFTs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Can drop to zero", "Guaranteed redemption floor"],
                      ["Reliant on resale hype", "Value grows automatically"],
                      ["No creator incentive after mint", "Creators earn every cycle"],
                      ["Illiquid markets and exits", "Instant redemption at the floor"],
                      ["Pump-and-dump risk", "Locked liquidity and transparent flows"],
                    ].map(([problem, solution]) => (
                      <tr key={problem} className={cn("border-t", isDarkMode ? "border-[#3a3a3a]" : "border-[#ede8ff]")}>
                        <td className="px-5 py-4">{problem}</td>
                        <td className="px-5 py-4">{solution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={cn("text-base leading-relaxed sm:text-lg", isDarkMode ? "text-white" : "text-black")}>
                LFTs merge the strongest parts of DeFi, NFTs, and skill gaming without carrying over their flaws. It’s
                crypto that rewards participation, preserves value, and aligns incentives for everyone in the network.
              </p>
              <Button
                size="lg"
                className={cn("rounded-xl px-10 py-3 transition", accentButtonClass)}
                onClick={() => handleCta("cta_impact_explore", "/assets")}
              >
                Explore Solaris — where liquidity meets longevity
              </Button>
            </div>
          </ScrollDrop>

          {/* Section 5 – Call to Action */}
          <ScrollDrop
            id="cta"
            className="grid gap-10 px-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:px-16"
          >
            <div className="order-1 mt-8 px-6 sm:px-12 lg:order-1 lg:mt-0 lg:flex lg:h-full lg:px-12">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-auto lg:h-full">
                <img
                  src="/a.png"
                  alt="Solaris liquidity network"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="order-2 space-y-6 px-6 sm:px-12 lg:pl-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b5cff]">Call to action</p>
              <h2 className={cn("text-3xl font-semibold leading-tight sm:text-4xl", isDarkMode ? "text-white" : "text-black")}>
                The future of digital assets starts here.
              </h2>
              <p className={cn("text-base leading-relaxed sm:text-lg", isDarkMode ? "text-white" : "text-black")}>
                Solaris isn’t another speculative play. It’s a financial game layer built on real liquidity, community
                participation, and sustainable growth. The crypto world doesn’t need more hype — it needs Solaris.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Button
                  size="lg"
                  className={cn("rounded-xl px-10 py-3 transition", accentButtonClass)}
                  onClick={() => handleCta("cta_final_launch", "/assets")}
                >
                  Launch console
                </Button>
                <Button
                  size="lg"
                  className={cn("rounded-xl px-10 py-3 transition", accentButtonClass)}
                  onClick={() => handleCta("cta_final_learn", "/coin-tags")}
                >
                  Learn about LFTs
                </Button>
              </div>
            </div>
          </ScrollDrop>
        </main>
        <footer
          id="footer"
          className={cn("border-t", isDarkMode ? "border-[#3a3a3a] bg-[#0a0a0a] text-white" : "border-[#ede8ff] bg-[#f8f5ff] text-black")}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 sm:px-12 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md space-y-3">
              <div className="flex items-center gap-3">
                <span className={cn("flex h-10 w-10 overflow-hidden rounded-full border shadow-[0_12px_32px_rgba(139,92,255,0.2)]", isDarkMode ? "border-[#3a3a3a] bg-[#1a1a1a]" : "border-white/40 bg-white")}>
                  <img src="/h4.png" alt="Solaris logo" className="h-full w-full object-cover" />
                </span>
                <span className={cn("text-lg font-semibold tracking-wide", isDarkMode ? "text-white" : "text-black")}>Solaris</span>
              </div>
              <p className={cn("text-sm leading-relaxed", isDarkMode ? "text-gray-400" : "text-[#4d3a7f]")}>
                Solaris curates liquidity-backed digital art experiences that reward creators, collectors, and communities in
                equal measure.
              </p>
              <p className="text-xs uppercase tracking-[0.32em] text-[#8b5cff]">
                Where liquidity meets artistry
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 sm:text-base">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b5cff]">Navigate</p>
                <div className={cn("flex flex-col gap-2", isDarkMode ? "text-white" : "text-black")}>
                  {navLinks.map((link) => (
                    <button
                      key={`footer-${link.label}`}
                      type="button"
                      onClick={() => handleNavClick(link.label, link.href)}
                      className="text-left transition hover:text-[#8b5cff]"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b5cff]">Get in touch</p>
                <div className={cn("flex flex-col gap-2", isDarkMode ? "text-white" : "text-black")}>
                  <button
                    type="button"
                    onClick={() => handleCta("footer_email", "mailto:hello@forgearthub.com")}
                    className="text-left transition hover:text-[#8b5cff]"
                  >
                    hello@forgearthub.com
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCta("footer_launch", "/assets")}
                    className="text-left transition hover:text-[#8b5cff]"
                  >
                    Launch Console
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={cn("border-t", isDarkMode ? "border-[#3a3a3a] bg-black/60" : "border-[#ede8ff] bg-white/60")}>
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-xs uppercase tracking-[0.3em] text-[#8b5cff] sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} Solaris. All rights reserved.</span>
              <div className={cn("flex flex-wrap gap-4", isDarkMode ? "text-gray-400" : "text-[#4d3a7f]")}>
                <button
                  type="button"
                  onClick={() => handleCta("footer_terms", "/terms")}
                  className="transition hover:text-[#8b5cff]"
                >
                  Terms
                </button>
                <button
                  type="button"
                  onClick={() => handleCta("footer_privacy", "/privacy")}
                  className="transition hover:text-[#8b5cff]"
                >
                  Privacy
                </button>
                <button
                  type="button"
                  onClick={() => handleCta("footer_status", "/status")}
                  className="transition hover:text-[#8b5cff]"
                >
                  Status
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
