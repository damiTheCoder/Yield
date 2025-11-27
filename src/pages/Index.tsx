import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navLinks = [
    { label: "Problem", href: "#problem" },
    { label: "Difference", href: "#difference" },
    { label: "Solution", href: "#solution" },
    { label: "Impact", href: "#impact" },
    { label: "Launch", href: "#cta" },
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
    const handleScroll = () => setNavDropped(window.scrollY > 12);
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
      {/* Background image with blur effect */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[550px]"
        style={{
          backgroundImage: "url('/d1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(8px)",
          zIndex: 0
        }}
      />
      {/* Overlay for content visibility */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[550px]"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 1
        }}
      />
      <div className="relative z-10">
        <nav
          className={cn(
            "fixed inset-x-0 top-0 z-50 transition-all duration-300",
            navDropped
              ? isDarkMode
                ? "bg-black/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                : "bg-white/80 shadow-[0_12px_40px_rgba(15,24,74,0.08)]"
              : "bg-transparent"
          )}
          style={navDropped ? {
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          } : undefined}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
            <button
              type="button"
              onClick={() => handleCta("nav_logo", "/")}
              className="flex items-center gap-2 text-left sm:gap-3"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-base font-semibold sm:h-10 sm:w-10",
                  isDarkMode ? "bg-neutral-900 text-white border-neutral-700" : "bg-white text-black border-neutral-200",
                )}
              >
                S
              </span>
              <div className="flex flex-col leading-tight">
                <span className={cn("text-sm font-semibold tracking-wide sm:text-base", isDarkMode ? "text-white" : "text-black")}>Solaris</span>
              </div>
            </button>

            <div className={cn("hidden items-center justify-center gap-6 text-[11px] font-semibold uppercase tracking-[0.22em] md:flex lg:gap-8 lg:text-sm", isDarkMode ? "text-white" : "text-black")}>
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handleNavClick(link.label, link.href)}
                  className="relative transition hover:text-[#8b5cff]"
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-0 -bottom-1 h-0.5 scale-x-0 transition-transform duration-200 ease-out hover:scale-x-100",
                      accentIconBgClass,
                    )}
                  />
                </button>
              ))}
            </div>

            <div className="hidden md:block">
              <Button
                size="sm"
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] transition sm:text-sm",
                  accentButtonClass,
                )}
                onClick={() => handleCta("nav_launch", "/assets")}
              >
                Launch Console
              </Button>
            </div>
            <div className="flex flex-1 justify-end md:hidden">
              <Button
                variant="ghost"
                className={cn("rounded-full border border-[#dcd4ff] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(139,92,255,0.12)]", isDarkMode ? "text-white" : "text-black")}
                onClick={() => handleCta("nav_launch_mobile", "/assets")}
              >
                Launch
              </Button>
            </div>
          </div>
        </nav>
        <main className="flex w-full flex-col gap-28 pb-24 pt-16 sm:gap-32 sm:pb-32 sm:pt-24 lg:gap-36">
          {/* Section 1 – Problem & Vision */}
          <ScrollDrop
            id="problem"
            className="flex flex-col items-center gap-12 px-6 text-center sm:px-12 lg:px-16"
          >
            <div className="max-w-3xl space-y-5 sm:space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b5cff]">The problem</p>
              <h1 className={cn("text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl", isDarkMode ? "text-white" : "text-black")}>
                The digital asset market is broken.
              </h1>
              <p className={cn("text-base leading-relaxed sm:text-lg", isDarkMode ? "text-white" : "text-black")}>
                Crypto today is driven by speculation, not sustainability. The greater-fool cycle has replaced real value
                creation.
              </p>
              <ul className={cn("mx-auto flex max-w-2xl flex-col gap-3 text-left text-sm sm:flex-row sm:items-start sm:justify-center sm:gap-6 sm:text-base", isDarkMode ? "text-white" : "text-black")}>
                {[
                  "Meme coins spike on hype, then crater to zero.",
                  "NFTs promise creativity but strand holders in illiquid markets.",
                  "Utility tokens inflate endlessly while delivering little real utility.",
                ].map((item) => (
                  <li key={item} className="flex flex-1 items-start gap-2">
                    <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", accentIconBgClass)} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className={cn("text-base leading-relaxed sm:text-lg", isDarkMode ? "text-white" : "text-black")}>
                Creators earn once and vanish. Holders get burned. The system feeds on exit liquidity. At Solaris, we believe
                digital assets should hold their ground — not your hope.
              </p>
              <Button
                size="lg"
                className={cn("mx-auto rounded-xl px-10 py-3 transition", accentButtonClass)}
                onClick={() => handleCta("cta_problem_future", "/assets")}
              >
                Discover the future of value-backed tokens
              </Button>
            </div>
          </ScrollDrop>

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
                    description: "Liquidity splits into 1,000,000 tokens that inherit the floor value.",
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
                  <img src={isDarkMode ? "/h4.png" : "/g56.png"} alt="Solaris logo" className="h-full w-full object-cover" />
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
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-6 sm:pb-8">
          <button
            type="button"
            aria-label="Toggle dark mode"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="pointer-events-auto relative flex h-24 w-24 items-center justify-center rounded-full transition hover:scale-105 focus:outline-none"
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 rounded-full border",
                isDarkMode ? "border-neutral-700 bg-neutral-900/80" : "border-neutral-200 bg-white/80",
              )}
            />
            <span
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-full border text-3xl font-semibold shadow-[0_12px_32px_rgba(0,0,0,0.16)] transition-colors",
                isDarkMode ? "bg-neutral-900 border-neutral-700 text-white" : "bg-white border-neutral-200 text-black",
              )}
            >
              S
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
