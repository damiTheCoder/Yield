import { Instagram, Linkedin, Send, Twitter, Youtube } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const PROBLEM_ITEMS = [
  {
    image: "/k3.jpeg",
    alt: "Meme coins",
    text: "Meme Coins: No intrinsic value → driven by hype and speculation → rapid price pumps → early holders cash out → late buyers get dumped on → price crashes → often trends toward zero.",
  },
  {
    image: "/k5.jpeg",
    alt: "NFTs",
    text: "NFTs: One-time artist revenue followed by abandonment; zero guaranteed floor; buyers risk total loss; no ongoing cash flow; reliant on resale speculation.",
  },
  {
    image: "/base.jpeg",
    alt: "Utility tokens",
    text: "Utility Tokens: Utility claims rarely deliver; inflationary erosion; no real redemption rights; prone to pump-and-dumps; regulatory risks.",
  },
  {
    image: "/r1.jpeg",
    alt: "Result",
    text: "Result: Users get burned, creators lack sustainable income, regulators skeptical.",
  },
] as const;

const [PRIMARY_PROBLEM, SECONDARY_PROBLEM, TERTIARY_PROBLEM, QUATERNARY_PROBLEM] = PROBLEM_ITEMS;

type ProblemDiagramVariant = "blue" | "yellow" | "green" | "purple";

const ProblemDiagram = ({ variant }: { variant: ProblemDiagramVariant }) => (
  <div className={`problem-diagram problem-diagram--${variant}`} aria-hidden="true">
    {variant === "blue" && (
      <svg viewBox="0 0 640 240" className="problem-diagram-svg" role="presentation">
        <circle cx="180" cy="120" r="76" className="problem-diagram-stroke" />
        <circle cx="470" cy="110" r="50" className="problem-diagram-fill" />
        <path d="M265 121H375" className="problem-diagram-line" />
        <rect x="300" y="78" width="52" height="84" rx="10" className="problem-diagram-box" />
      </svg>
    )}
    {variant === "yellow" && (
      <svg viewBox="0 0 640 240" className="problem-diagram-svg" role="presentation">
        <rect x="150" y="72" width="116" height="96" rx="16" className="problem-diagram-box" />
        <path d="M290 118H408" className="problem-diagram-line" />
        <circle cx="444" cy="116" r="46" className="problem-diagram-fill" />
        <path d="M410 72L520 182" className="problem-diagram-stroke" />
      </svg>
    )}
    {variant === "green" && (
      <svg viewBox="0 0 640 240" className="problem-diagram-svg" role="presentation">
        <path d="M150 156C150 114 184 80 226 80H274V156H150Z" className="problem-diagram-fill" />
        <path d="M286 156C286 114 320 80 362 80H410V156H286Z" className="problem-diagram-fill problem-diagram-fill--alt" />
        <path d="M190 66V174" className="problem-diagram-line" />
        <path d="M332 66V174" className="problem-diagram-line" />
      </svg>
    )}
    {variant === "purple" && (
      <svg viewBox="0 0 640 240" className="problem-diagram-svg" role="presentation">
        <circle cx="190" cy="120" r="66" className="problem-diagram-stroke" />
        <rect x="292" y="76" width="84" height="84" rx="18" className="problem-diagram-fill" />
        <path d="M392 98H490" className="problem-diagram-line" />
        <path d="M412 142H520" className="problem-diagram-line" />
      </svg>
    )}
  </div>
);

const HOW_IT_WORKS_STEPS = [
  {
    title: "Launch an LFT",
    body: "A creator deploys a Liquidity Funded Token and seeds the first cycle with real reserve liquidity from day one.",
  },
  {
    title: "Users enter through CoinTags",
    body: "Participants access the token cycle through CoinTags, creating trackable demand instead of pure hype-driven speculation.",
  },
  {
    title: "Revenue splits in real time",
    body: "Every cycle routes value into current liquidity, next-cycle seed, creator income, holder rewards, and protocol revenue.",
  },
  {
    title: "Redeem or continue the cycle",
    body: "Holders keep a reserve-backed redemption path while the next cycle launches with stronger liquidity and cleaner economics.",
  },
] as const;

const FOOTER_SECTIONS = [
  {
    title: "Launch App",
    links: [
      { label: "Foundation", to: "/coin-tags" },
      { label: "Token", to: "/assets" },
      { label: "Airdrop", to: "/notifications" },
      { label: "Staking", to: "/portfolio" },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "Docs", to: "/blog" },
      { label: "Terms of Service", to: "/blog" },
      { label: "Privacy", to: "/blog" },
    ],
  },
] as const;

const SolarisSlider = () => {
  const navigate = useNavigate();
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isNavPastHero, setIsNavPastHero] = useState(false);
  const [openHowItWorks, setOpenHowItWorks] = useState(0);
  const currentYear = new Date().getFullYear();
  const landingRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileMediaQuery = window.matchMedia("(max-width: 768px)");
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsNavScrolled(scrollY > 0);

      if (!mobileMediaQuery.matches) {
        setIsNavPastHero(false);
        return;
      }

      const heroBottom = heroSectionRef.current
        ? heroSectionRef.current.getBoundingClientRect().bottom + scrollY
        : window.innerHeight;

      setIsNavPastHero(scrollY >= Math.max(heroBottom - 72, 0));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    mobileMediaQuery.addEventListener("change", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      mobileMediaQuery.removeEventListener("change", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const landingRoot = landingRef.current;
    if (!landingRoot) return;

    const animatedElements = Array.from(landingRoot.querySelectorAll<HTMLElement>(".scroll-drop"));
    if (animatedElements.length === 0) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) {
      animatedElements.forEach((element) => {
        element.classList.remove("scroll-drop-ready");
        element.classList.add("is-visible");
      });
      return;
    }

    animatedElements.forEach((element) => element.classList.add("scroll-drop-ready"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.classList.add("is-visible");
          observer.unobserve(target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    animatedElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={landingRef} className="solaris-landing">
      <style>{`
        .solaris-landing {
          position: relative;
          min-height: 100vh;
          width: 100%;
          color: #060b16;
          background: #000000;
          font-family: "Glacial Indifference", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .scroll-drop {
          opacity: 1;
          transform: none;
          filter: none;
        }

        .scroll-drop.scroll-drop-ready {
          opacity: 0;
          transform: translate3d(0, -44px, 0) scale(0.985);
          filter: blur(12px);
          transition:
            opacity 0.68s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.9s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform, filter;
        }

        .scroll-drop.scroll-drop-ready.is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0);
        }

        .scroll-drop[data-drop-delay="1"] {
          transition-delay: 0.08s;
        }

        .scroll-drop[data-drop-delay="2"] {
          transition-delay: 0.16s;
        }

        .scroll-drop[data-drop-delay="3"] {
          transition-delay: 0.24s;
        }

        .scroll-drop[data-drop-delay="4"] {
          transition-delay: 0.32s;
        }

        .scroll-drop[data-drop-delay="5"] {
          transition-delay: 0.4s;
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-drop {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }

          .scroll-drop.scroll-drop-ready {
            opacity: 1;
            transform: none;
            filter: none;
          }
        }

        .landing-shell {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #000000;
        }

        .landing-top-band {
          position: relative;
          min-height: 100svh;
          background: #000000 url("/ks1.jpeg") center center / cover no-repeat;
          overflow: hidden;
        }

        .landing-top-band::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.46) 44%, rgba(0, 0, 0, 0.9) 100%),
            radial-gradient(circle at 54% 62%, rgba(128, 157, 255, 0.22), transparent 34%);
          pointer-events: none;
        }

        .landing-top-band::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 128px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%);
          pointer-events: none;
        }

        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 14px 22px;
          pointer-events: none;
          background: transparent;
        }

        .landing-nav-inner {
          max-width: 1320px;
          margin: 0 auto;
          pointer-events: auto;
        }

        .landing-nav-bar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          min-height: 64px;
          padding: 0;
          border-radius: 0;
          background: transparent;
          border: 0;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          transition:
            background 0.24s ease,
            backdrop-filter 0.24s ease,
            -webkit-backdrop-filter 0.24s ease,
            box-shadow 0.24s ease,
            border-color 0.24s ease;
        }

        .landing-nav.landing-nav-scrolled .landing-nav-bar {
          background: transparent;
          border-color: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        .nav-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          border: none;
          border-radius: 13px;
          background: #17171f;
          color: #ffffff;
          font-size: 22px;
          font-weight: 900;
          justify-self: start;
          cursor: pointer;
          min-height: 64px;
          padding: 0 28px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
        }

        .nav-logo {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          overflow: hidden;
        }

        .nav-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .nav-links {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 42px;
          min-height: 64px;
          padding: 0 42px;
          border-radius: 13px;
          background: #17171f;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
        }

        .nav-link {
          border: none;
          background: transparent;
          color: #8d8e9c;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #ffffff;
        }

        .get-started-btn {
          justify-self: end;
          border: none;
          border-radius: 13px;
          padding: 0 36px;
          min-height: 64px;
          background: #3b82f6;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.2s ease;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
        }

        .get-started-btn:hover {
          transform: translateY(-1px);
          background: #2563eb;
          opacity: 0.98;
        }

        .landing-hero {
          min-height: 100svh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 132px 32px 54px;
        }

        .landing-hero-inner {
          position: relative;
          z-index: 1;
          width: min(1240px, 100%);
          min-height: calc(100svh - 186px);
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 0.75fr);
          align-items: end;
          gap: clamp(36px, 7vw, 120px);
        }

        .landing-hero-title {
          margin: 0;
          font-size: clamp(58px, 9vw, 128px);
          line-height: 0.98;
          letter-spacing: -0.075em;
          font-weight: 400;
          color: #ffffff;
          text-align: left;
          white-space: normal;
          text-shadow: 0 20px 48px rgba(0, 0, 0, 0.32);
        }

        .landing-hero-title span {
          display: block;
          margin-top: 22px;
          color: #8fb3ff;
        }

        .landing-hero-pill {
          margin-top: 46px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.08);
          padding: 14px 18px;
          color: #ffffff;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 16px;
          font-weight: 900;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .landing-hero-pill-mark {
          display: inline-flex;
          width: 16px;
          height: 16px;
          background: #ffffff;
        }

        .landing-hero-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 36px;
          padding-bottom: 8px;
        }

        .landing-hero-tagline {
          margin: 0;
          max-width: 620px;
          color: #d2d2dc;
          font-size: clamp(24px, 2.4vw, 38px);
          line-height: 1.15;
          letter-spacing: -0.055em;
          font-weight: 900;
          text-align: right;
          text-shadow: 0 14px 34px rgba(0, 0, 0, 0.36);
        }

        .learn-more-btn {
          border: 0;
          border-radius: 8px;
          min-height: 64px;
          padding: 0 28px;
          background: #3b82f6;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: none;
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .learn-more-btn:hover {
          transform: translateY(-1px);
          background: #2563eb;
          color: #ffffff;
        }

        .landing-hero-mark {
          pointer-events: none;
          position: absolute;
          left: 50%;
          top: 54%;
          width: min(360px, 32vw);
          height: min(150px, 12vw);
          transform: translate(-50%, -50%);
          opacity: 0.9;
          filter: drop-shadow(0 0 72px rgba(128, 157, 255, 0.5));
        }

        .landing-hero-mark::before,
        .landing-hero-mark::after {
          content: "";
          position: absolute;
          top: 22%;
          width: 44%;
          height: 58%;
          background: linear-gradient(135deg, #dbe8ff, #8fb3ff 48%, #4f7dde);
        }

        .landing-hero-mark::before {
          left: 3%;
          border-radius: 0 0 0 70px;
        }

        .landing-hero-mark::after {
          right: 3%;
          border-radius: 0 70px 0 0;
        }

        .landing-empty {
          flex: 1;
          min-height: 36vh;
          position: relative;
          background: #000000;
        }

        .landing-section {
          width: 100%;
          max-width: none;
          margin: 0 auto;
          min-height: clamp(560px, 56.25vw, 820px);
          padding: clamp(72px, 8vw, 120px) clamp(24px, 4.8vw, 96px);
          position: relative;
          z-index: 0;
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
          align-items: center;
          gap: clamp(48px, 7vw, 112px);
          text-align: left;
          isolation: isolate;
          overflow: hidden;
          background:
            radial-gradient(circle at 72% 42%, rgba(59, 130, 246, 0.18), transparent 34%),
            #000000;
        }

        .landing-section::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
          background-size: 180px 180px;
          opacity: 0.3;
        }

        .landing-section-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(54px, 6.8vw, 92px);
          line-height: 0.92;
          letter-spacing: -0.065em;
          font-weight: 400;
        }

        .landing-section-kicker {
          display: block;
          margin-bottom: clamp(30px, 4vw, 56px);
          color: #ffffff;
          font-size: clamp(40px, 4.3vw, 72px);
          line-height: 0.96;
          letter-spacing: -0.055em;
          font-weight: 400;
        }

        .landing-section-muted-line {
          display: block;
          margin-top: clamp(28px, 3vw, 48px);
          color: #858692;
        }

        .landing-section-copy {
          margin: clamp(46px, 4.5vw, 72px) 0 0;
          max-width: 680px;
          color: #aaaab4;
          font-size: clamp(18px, 1.75vw, 29px);
          line-height: 1.42;
          font-weight: 700;
          letter-spacing: -0.035em;
        }

        .landing-section-copy + .landing-section-copy {
          margin-top: clamp(28px, 3vw, 48px);
        }

        .landing-section-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: clamp(36px, 4vw, 56px);
        }

        .landing-section-action {
          min-height: 64px;
          border: 0;
          border-radius: 8px;
          padding: 0 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          background: #3b82f6;
          font-size: 20px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .landing-section-action:hover {
          transform: translateY(-1px);
          background: #2563eb;
        }

        .landing-section-action--secondary {
          color: #ffffff;
          background: #3b82f6;
        }

        .landing-section-action--secondary:hover {
          background: #2563eb;
        }

        .token-visual {
          position: relative;
          min-height: clamp(420px, 38vw, 620px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .token-visual-ring {
          position: absolute;
          width: min(38vw, 560px);
          aspect-ratio: 1;
          border-radius: 999px;
          border: 3px solid rgba(255, 255, 255, 0.45);
        }

        .token-visual-ring::after {
          content: "";
          position: absolute;
          inset: 22px;
          border-radius: inherit;
          border: 3px solid rgba(255, 255, 255, 0.35);
        }

        .token-visual-ring--right {
          transform: translateX(32%);
          border-color: rgba(212, 157, 255, 0.62);
        }

        .token-visual-ring--right::after {
          border-color: rgba(212, 157, 255, 0.48);
        }

        .token-visual-ring--left {
          transform: translateX(-24%);
        }

        .token-visual-mark {
          position: relative;
          width: min(35vw, 480px);
          height: min(13vw, 180px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.92;
        }

        .token-visual-mark-outline {
          position: absolute;
          left: 2%;
          width: 38%;
          height: 92%;
          border: 3px solid rgba(255, 255, 255, 0.22);
          border-radius: 0 0 0 80px;
        }

        .token-visual-mark-outline::before,
        .token-visual-mark-outline::after,
        .token-visual-mark-fill::before,
        .token-visual-mark-fill::after {
          content: "";
          position: absolute;
          width: 50%;
          height: 48%;
          background: currentColor;
        }

        .token-visual-mark-outline::before {
          right: 0;
          top: 0;
          border: 3px solid rgba(255, 255, 255, 0.24);
          border-left: 0;
          background: transparent;
        }

        .token-visual-mark-outline::after {
          left: 0;
          bottom: 0;
          border: 3px solid rgba(255, 255, 255, 0.24);
          border-right: 0;
          background: transparent;
        }

        .token-visual-mark-fill {
          position: absolute;
          right: 1%;
          width: 42%;
          height: 92%;
          color: #8fb3ff;
          filter: drop-shadow(0 0 54px rgba(128, 157, 255, 0.38));
        }

        .token-visual-mark-fill::before {
          left: 0;
          bottom: 0;
          border-radius: 0 0 0 80px;
          background: linear-gradient(135deg, #dbe8ff, #8fb3ff);
        }

        .token-visual-mark-fill::after {
          right: 0;
          top: 0;
          border-radius: 0 80px 0 0;
          background: linear-gradient(135deg, #8fb3ff, #355fd6);
        }

        .problem-section {
          max-width: 1240px;
          width: min(100%, 1240px);
          margin: 0 auto;
          padding: 8px 24px 80px;
          text-align: left;
        }

        .problem-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(28px, 4vw, 52px);
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 400;
        }

        .problem-subtitle {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: clamp(15px, 1.2vw, 18px);
          line-height: 1.45;
          font-weight: 400;
        }

        .problem-list {
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          align-items: stretch;
        }

        .problem-box-row {
          width: 100%;
          display: grid;
          gap: 28px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          max-width: none;
          margin: 0;
        }

        .problem-box {
          position: relative;
          overflow: hidden;
          width: 100%;
          min-height: 440px;
          padding: 30px 30px 232px;
          border-radius: 34px;
          text-align: left;
          display: flex;
          align-items: flex-start;
        }

        .problem-box--blue {
          background: linear-gradient(180deg, #101a33 0%, #0b1327 100%);
        }

        .problem-box--yellow {
          background: linear-gradient(180deg, #2b1f08 0%, #1c1507 100%);
        }

        .problem-box--green {
          background: linear-gradient(180deg, #0d2418 0%, #08180f 100%);
        }

        .problem-box--purple {
          background: linear-gradient(180deg, #101a33 0%, #0b1327 100%);
        }

        .problem-box-copy {
          margin: 0;
          max-width: 620px;
          font-size: clamp(19px, 1.7vw, 28px);
          line-height: 1.38;
          letter-spacing: -0.02em;
          font-weight: 400;
        }

        .problem-box--blue .problem-box-copy {
          color: #9bbcff;
        }

        .problem-box--yellow .problem-box-copy {
          color: #ffd98a;
        }

        .problem-box--green .problem-box-copy {
          color: #8ee0a7;
        }

        .problem-box--purple .problem-box-copy {
          color: #9bbcff;
        }

        .problem-box-frame {
          position: absolute;
          inset: auto 0 0;
          width: 100%;
          height: 240px;
          overflow: hidden;
          border-radius: 0 0 34px 34px;
          pointer-events: none;
        }

        .problem-diagram {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.24) 100%);
        }

        .problem-diagram-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .problem-diagram-stroke,
        .problem-diagram-line {
          fill: none;
          stroke: rgba(255, 255, 255, 0.5);
          stroke-width: 6;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .problem-diagram-line {
          stroke-width: 5;
        }

        .problem-diagram-box {
          fill: rgba(255, 255, 255, 0.12);
          stroke: rgba(255, 255, 255, 0.28);
          stroke-width: 4;
        }

        .problem-diagram-fill {
          fill: rgba(128, 157, 255, 0.9);
        }

        .problem-diagram-fill--alt {
          fill: rgba(95, 219, 146, 0.86);
        }

        .problem-diagram--blue .problem-diagram-fill,
        .problem-diagram--purple .problem-diagram-fill {
          fill: rgba(128, 157, 255, 0.9);
        }

        .problem-diagram--yellow .problem-diagram-fill {
          fill: rgba(255, 205, 95, 0.92);
        }

        .problem-diagram--green .problem-diagram-fill {
          fill: rgba(95, 219, 146, 0.9);
        }

        .problem-diagram--blue .problem-diagram-stroke,
        .problem-diagram--blue .problem-diagram-line {
          stroke: rgba(145, 175, 255, 0.68);
        }

        .problem-diagram--yellow .problem-diagram-stroke,
        .problem-diagram--yellow .problem-diagram-line {
          stroke: rgba(255, 214, 120, 0.72);
        }

        .problem-diagram--green .problem-diagram-stroke,
        .problem-diagram--green .problem-diagram-line {
          stroke: rgba(120, 231, 168, 0.72);
        }

        .problem-diagram--purple .problem-diagram-stroke,
        .problem-diagram--purple .problem-diagram-line {
          stroke: rgba(194, 156, 255, 0.72);
        }

        .problem-diagram--blue {
          background: linear-gradient(180deg, rgba(13, 23, 46, 0.14) 0%, rgba(10, 18, 37, 0.66) 100%);
        }

        .problem-diagram--yellow {
          background: linear-gradient(180deg, rgba(43, 31, 8, 0.12) 0%, rgba(28, 21, 7, 0.7) 100%);
        }

        .problem-diagram--green {
          background: linear-gradient(180deg, rgba(13, 36, 24, 0.12) 0%, rgba(8, 24, 15, 0.72) 100%);
        }

        .problem-diagram--purple {
          background: linear-gradient(180deg, rgba(33, 20, 51, 0.12) 0%, rgba(21, 13, 34, 0.72) 100%);
        }

        .problem-box-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          border-radius: inherit;
        }

        .lft-section {
          margin-top: 0;
          scroll-margin-top: 110px;
          position: relative;
          z-index: 1;
          padding: 48px 24px 72px;
          background: #000000;
        }

        .lft-section-inner {
          max-width: 980px;
          margin: 0 auto;
        }

        .lft-image-frame {
          width: min(100%, 980px);
          margin: 0 auto;
          padding: clamp(26px, 4vw, 54px);
          border: 4px solid rgba(148, 148, 156, 0.62);
          border-radius: 0;
          background: #000000;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 14px;
          text-align: left;
        }

        .lft-intro-title {
          margin: 0;
          max-width: 780px;
          color: #ffffff;
          font-size: clamp(26px, 3.3vw, 46px);
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 600;
        }

        .lft-intro-copy {
          margin: 0;
          max-width: 780px;
          color: rgba(255, 255, 255, 0.72);
          font-size: clamp(16px, 1.55vw, 24px);
          line-height: 1.45;
          letter-spacing: -0.02em;
          font-weight: 300;
        }

        .lft-intro-image-shell {
          position: relative;
          width: min(100%, 1180px);
          max-width: 1180px;
          margin-top: 28px;
          margin-left: auto;
          margin-right: auto;
          overflow: hidden;
          isolation: isolate;
          line-height: 0;
          border-radius: 28px;
          box-shadow: 0 28px 72px rgba(0, 0, 0, 0.45);
        }

        .lft-intro-image-shell::before,
        .lft-intro-image-shell::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          z-index: 1;
          pointer-events: none;
        }

        .lft-intro-image-shell::before {
          top: 0;
          height: clamp(48px, 6vw, 88px);
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.46) 46%, rgba(0, 0, 0, 0) 100%);
        }

        .lft-intro-image-shell::after {
          bottom: 0;
          height: clamp(76px, 9vw, 132px);
          background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.52) 58%, rgba(0, 0, 0, 0.96) 100%);
        }

        .lft-intro-image {
          width: 100%;
          height: auto;
          display: block;
          border-radius: inherit;
          image-rendering: auto;
        }

        .paradigm-section {
          padding: 0 48px 104px;
        }

        .paradigm-section-inner {
          max-width: 1220px;
          margin: 0 auto;
          padding: clamp(72px, 10vw, 124px) clamp(24px, 4vw, 72px);
          border-radius: 36px;
          background: #000000;
        }

        .paradigm-copy {
          max-width: 920px;
          margin: 0;
          color: rgba(255, 255, 255, 0.76);
          text-align: left;
          font-size: clamp(22px, 2.15vw, 34px);
          line-height: 1.42;
          letter-spacing: -0.03em;
          font-weight: 400;
        }

        .paradigm-copy + .paradigm-copy {
          margin-top: 20px;
        }

        .how-it-works-section {
          padding: 0 24px 120px;
          background: linear-gradient(180deg, #000000 0%, #071736 100%);
        }

        .how-it-works-inner {
          max-width: 1220px;
          margin: 0 auto;
        }

        .how-it-works-heading {
          width: auto;
          margin: 0 0 28px;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: #ffffff;
          font-size: clamp(24px, 2.6vw, 40px);
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-weight: 500;
        }

        .how-it-works-track {
          display: flex;
          flex-direction: column;
          gap: 0;
          align-items: stretch;
          padding: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.14);
        }

        .how-it-works-card {
          width: 100%;
          border-radius: 0;
          background: transparent;
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: none;
        }

        .how-it-works-trigger {
          width: 100%;
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr) 36px;
          align-items: center;
          gap: 18px;
          padding: 26px 0;
          border: 0;
          background: transparent;
          text-align: left;
          color: #ffffff;
          cursor: pointer;
        }

        .how-it-works-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-size: 16px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        .how-it-works-question {
          font-size: clamp(20px, 2vw, 28px);
          line-height: 1.2;
          letter-spacing: -0.03em;
          font-weight: 400;
        }

        .how-it-works-icon {
          display: inline-block;
          color: #ffffff;
          font-size: 42px;
          line-height: 0.8;
          font-weight: 300;
          text-align: center;
          transition: transform 0.24s ease;
        }

        .how-it-works-card[data-open="true"] .how-it-works-icon {
          transform: rotate(135deg);
        }

        .how-it-works-answer {
          padding: 0 0 28px 76px;
          color: rgba(255, 255, 255, 0.74);
          font-size: clamp(15px, 1.25vw, 18px);
          line-height: 1.55;
          letter-spacing: -0.01em;
        }

        .how-it-works-answer p {
          margin: 0;
        }

        .how-it-works-answer[hidden] {
          display: none;
        }

        .how-it-works-answer-inner {
          width: 100%;
          max-width: 860px;
        }

        .landing-footer {
          margin-top: 28px;
          background: #050608;
          padding: 0 24px 18px;
        }

        .landing-footer-inner {
          max-width: 1360px;
          margin: 0 auto;
          padding: 56px 6px 54px;
          display: grid;
          grid-template-columns: minmax(300px, 1.2fr) minmax(160px, 0.68fr) minmax(160px, 0.68fr) minmax(360px, 1.35fr);
          align-items: flex-start;
          gap: 32px 64px;
        }

        .landing-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .landing-footer-mark {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #ffffff;
          font-size: clamp(30px, 3vw, 36px);
          line-height: 1;
          letter-spacing: -0.03em;
          font-weight: 500;
        }

        .landing-footer-mark img {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: block;
        }

        .landing-footer-copy {
          max-width: 360px;
          margin: 0;
          color: rgba(255, 255, 255, 0.56);
          font-size: 15px;
          line-height: 1.6;
        }

        .landing-footer-socials {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .landing-footer-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.72);
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .landing-footer-social:hover {
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(59, 130, 246, 0.24);
          color: #ffffff;
        }

        .landing-footer-columns {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 32px 36px;
        }

        .landing-footer-subscribe {
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: stretch;
        }

        .landing-footer-subscribe-copy {
          margin: 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: 18px;
          line-height: 1.45;
          letter-spacing: -0.02em;
          max-width: 640px;
        }

        .landing-footer-subscribe-form {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 14px 36px rgba(0, 0, 0, 0.24);
        }

        .landing-footer-subscribe-input {
          flex: 1;
          min-width: 0;
          border: 0;
          background: transparent;
          color: #ffffff;
          font-size: 20px;
          line-height: 1.2;
          outline: none;
        }

        .landing-footer-subscribe-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .landing-footer-subscribe-button {
          border: 0;
          border-radius: 16px;
          padding: 18px 28px;
          background: #7aae1f;
          color: #10131b;
          font-size: 20px;
          font-weight: 700;
          box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.12);
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .landing-footer-subscribe-button:hover {
          transform: translateY(-1px);
          background: #8bc126;
        }

        .landing-footer-subscribe-socials {
          display: flex;
          justify-content: flex-end;
          gap: 18px;
          align-items: center;
          margin-top: 8px;
        }

        .landing-footer-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .landing-footer-column-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(20px, 1.8vw, 26px);
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-weight: 500;
        }

        .landing-footer-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }

        .landing-footer-link {
          border: 0;
          padding: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.62);
          font-size: 14px;
          line-height: 1.4;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .landing-footer-link:hover {
          color: #ffffff;
        }

        @media (max-width: 1100px) {
          .landing-nav-bar {
            grid-template-columns: 1fr auto;
            gap: 10px;
          }

          .nav-links {
            display: none;
          }

        }

        @media (max-width: 768px) {
          .scroll-drop.scroll-drop-ready {
            transform: translate3d(0, -20px, 0) scale(0.995);
            filter: blur(6px);
            transition:
              opacity 0.44s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.56s cubic-bezier(0.22, 1, 0.36, 1),
              filter 0.56s cubic-bezier(0.22, 1, 0.36, 1);
          }

          .problem-box.scroll-drop-ready,
          .problem-box.scroll-drop-ready.is-visible {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }

          .landing-nav {
            padding: 10px 12px 0;
            background: linear-gradient(180deg, rgba(17, 17, 22, 0.98) 0%, rgba(17, 17, 22, 0.62) 72%, rgba(17, 17, 22, 0) 100%);
            transition:
              background 0.24s ease,
              backdrop-filter 0.24s ease,
              -webkit-backdrop-filter 0.24s ease,
              box-shadow 0.24s ease;
          }

          .landing-nav-bar {
            min-height: 54px;
            padding: 0;
            margin-bottom: 8px;
            border-radius: 0;
            background: transparent;
            border: 0;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }

          .landing-nav.landing-nav-scrolled {
            background: rgba(17, 17, 22, 0.88);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);
            backdrop-filter: saturate(180%) blur(18px);
            -webkit-backdrop-filter: saturate(180%) blur(18px);
          }

          .landing-nav.landing-nav-past-hero {
            background: rgba(17, 17, 22, 0.9);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);
            backdrop-filter: saturate(180%) blur(22px);
            -webkit-backdrop-filter: saturate(180%) blur(22px);
          }

          .nav-brand {
            font-size: 20px;
            font-weight: 900;
            min-height: 48px;
            padding: 0 14px;
          }

          .nav-logo {
            width: 30px;
            height: 30px;
          }

          .get-started-btn {
            min-height: 48px;
            padding: 0 14px;
            font-size: 12px;
            gap: 6px;
          }

          .landing-hero {
            min-height: 100svh;
            padding: 104px 18px 48px;
          }

          .landing-hero-inner {
            min-height: calc(100svh - 152px);
            grid-template-columns: 1fr;
            align-items: end;
            gap: 42px;
          }

          .landing-hero-title {
            font-size: clamp(54px, 15vw, 82px);
          }

          .landing-hero-title span {
            margin-top: 14px;
          }

          .landing-hero-actions {
            align-items: flex-start;
            gap: 24px;
            padding-bottom: 0;
            width: 100%;
          }

          .landing-hero-tagline {
            font-size: clamp(22px, 6vw, 30px);
            white-space: normal;
            width: 100%;
            text-align: left;
          }

          .learn-more-btn {
            min-height: 54px;
            padding: 0 20px;
            font-size: 16px;
          }

          .landing-hero-pill {
            margin-top: 28px;
            padding: 11px 13px;
            font-size: 12px;
          }

          .landing-hero-mark {
            top: 54%;
            left: 70%;
            width: 220px;
            height: 92px;
            opacity: 0.42;
          }

          .landing-section {
            grid-template-columns: 1fr;
            min-height: auto;
            padding: 64px 20px 72px;
            gap: 38px;
          }

          .landing-section::before {
            display: block;
            background-size: 96px 96px;
          }

          .landing-section-title {
            font-size: clamp(48px, 14vw, 76px);
          }

          .landing-section-kicker {
            margin-bottom: 26px;
            font-size: clamp(38px, 11vw, 60px);
          }

          .landing-section-muted-line {
            margin-top: 24px;
          }

          .landing-section-copy {
            margin-top: 34px;
            font-size: clamp(17px, 5vw, 22px);
            line-height: 1.42;
          }

          .landing-section-copy + .landing-section-copy {
            margin-top: 24px;
          }

          .landing-section-actions {
            gap: 12px;
            margin-top: 32px;
          }

          .landing-section-action {
            min-height: 52px;
            padding: 0 18px;
            font-size: 15px;
          }

          .token-visual {
            min-height: 300px;
            margin-top: 8px;
          }

          .token-visual-ring {
            width: 74vw;
            border-width: 2px;
          }

          .token-visual-ring::after {
            inset: 14px;
            border-width: 2px;
          }

          .token-visual-mark {
            width: 76vw;
            height: 28vw;
          }

          .token-visual-mark-outline,
          .token-visual-mark-outline::before,
          .token-visual-mark-outline::after {
            border-width: 2px;
          }

          .problem-section {
            width: calc(100% - 16px);
            max-width: none;
            margin: 0 auto;
            padding: 8px 16px 52px;
            text-align: left;
          }

          .problem-title {
            font-size: clamp(24px, 7vw, 34px);
          }

          .problem-subtitle {
            font-size: 14px;
          }

          .problem-list {
            margin-top: 14px;
            gap: 20px;
            align-items: center;
          }

          .problem-box-row {
            width: 100%;
            grid-template-columns: 1fr;
            gap: 20px;
            justify-items: center;
          }

          .problem-box {
            width: min(100%, 640px);
            min-height: 320px;
            padding: 20px 18px 152px;
            border-radius: 24px;
          }

          .problem-box-copy {
            max-width: none;
            font-size: 16px;
            line-height: 1.45;
          }

          .problem-box-frame {
            inset: auto 0 0;
            width: 100%;
            height: 146px;
            border-radius: 0 0 24px 24px;
          }

          .problem-diagram-svg {
            transform: scale(0.92);
            transform-origin: center;
          }

          .lft-section {
            margin-top: 8px;
            scroll-margin-top: 78px;
            padding: 36px 16px 44px;
          }

          .landing-empty {
            background: #000000;
          }

          .lft-image-frame {
            width: 100%;
            margin-top: 0;
            padding: 22px 16px;
            border-width: 3px;
            border-radius: 0;
            gap: 8px;
            align-items: flex-start;
            text-align: left;
          }

          .lft-intro-title {
            font-size: clamp(24px, 7vw, 34px);
          }

          .lft-intro-copy {
            font-size: clamp(14px, 4.2vw, 18px);
            line-height: 1.42;
          }

          .lft-intro-image-shell {
            width: calc(100% - 16px);
            margin-top: 18px;
            border-radius: 20px;
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
          }

          .lft-intro-image-shell::before {
            height: clamp(18px, 6vw, 28px);
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.32) 50%, rgba(0, 0, 0, 0) 100%);
          }

          .lft-intro-image-shell::after {
            height: clamp(28px, 8vw, 44px);
            background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.36) 56%, rgba(0, 0, 0, 0.94) 100%);
          }

          .lft-intro-image {
            width: 100%;
            height: auto;
            border-radius: inherit;
          }

          .paradigm-section {
            padding: 0 16px 32px;
          }

          .paradigm-section-inner {
            min-height: 500px;
            padding: 28px 14px;
            border-radius: 24px;
            background: #000000;
            display: flex;
            align-items: center;
          }

          .paradigm-copy {
            font-size: clamp(14px, 4vw, 18px);
            line-height: 1.48;
          }

          .paradigm-copy + .paradigm-copy {
            margin-top: 12px;
          }

          .how-it-works-section {
            padding: 0 12px 72px;
          }

          .how-it-works-heading {
            margin-bottom: 18px;
            padding: 0;
            font-size: clamp(22px, 6vw, 30px);
          }

          .how-it-works-track {
            gap: 0;
            padding: 4px 2px 8px;
          }

          .how-it-works-card {
            border-radius: 0;
          }

          .how-it-works-trigger {
            grid-template-columns: 52px minmax(0, 1fr) 32px;
            gap: 12px;
            padding: 18px 0 16px;
          }

          .how-it-works-number {
            width: 36px;
            height: 36px;
            border-radius: 999px;
            font-size: 15px;
          }

          .how-it-works-question {
            font-size: 16px;
            line-height: 1.25;
          }

          .how-it-works-icon {
            width: auto;
            height: auto;
            font-size: 34px;
          }

          .how-it-works-answer {
            padding: 0 0 18px 48px;
            font-size: 14px;
            line-height: 1.5;
          }

          .landing-footer {
            padding: 0 16px 28px;
          }

          .landing-footer-inner {
            grid-template-columns: 1fr;
            gap: 28px;
            padding: 32px 0 34px;
          }

          .landing-footer-columns {
            grid-template-columns: 1fr;
            gap: 22px;
          }

          .landing-footer-subscribe-form {
            flex-direction: column;
            align-items: stretch;
          }

          .landing-footer-subscribe-input {
            font-size: 18px;
          }

          .landing-footer-subscribe-button {
            width: 100%;
            font-size: 18px;
          }

          .landing-footer-subscribe-socials {
            justify-content: flex-start;
          }

          .landing-footer-copy {
            max-width: none;
            font-size: 13px;
          }

          .landing-footer-mark {
            font-size: 28px;
          }

          .landing-footer-mark img {
            width: 34px;
            height: 34px;
          }

          .landing-footer-social {
            width: 38px;
            height: 38px;
            border-radius: 11px;
          }

          .landing-footer-column {
            gap: 14px;
          }

          .landing-footer-column-title {
            font-size: 22px;
          }

          .landing-footer-links {
            gap: 12px;
          }

          .landing-footer-link {
            font-size: 13px;
          }
        }
      `}</style>

      <div className="landing-shell">
        <nav className={`landing-nav${isNavScrolled ? " landing-nav-scrolled" : ""}${isNavPastHero ? " landing-nav-past-hero" : ""}`}>
          <div className="landing-nav-inner">
            <div className="landing-nav-bar">
              <button className="nav-brand" onClick={() => navigate("/")}>
                <span className="nav-logo">
                  <img src="/h4.png" alt="Solaris logo" />
                </span>
                <span>Solaris</span>
              </button>

              <div className="nav-links">
                <button className="nav-link" onClick={() => navigate("/assets")}>Features</button>
                <button className="nav-link" onClick={() => navigate("/coin-tags")}>How It Works</button>
                <button className="nav-link" onClick={() => navigate("/assets")}>Marketplace</button>
                <button className="nav-link" onClick={() => navigate("/blog")}>About</button>
              </div>

              <button className="get-started-btn" onClick={() => navigate("/assets")}>
                Get Started
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="landing-top-band">
          <section ref={heroSectionRef} className="landing-hero">
            <div className="landing-hero-inner">
              <div>
                <h1 className="landing-hero-title">
                  Non-extractive Tokens,
                  <span>Real Liquidity.</span>
                </h1>
                <div className="landing-hero-pill">
                  <span>Built and powered by</span>
                  <span className="landing-hero-pill-mark" />
                  <span>base</span>
                </div>
              </div>
              <div className="landing-hero-mark" aria-hidden="true" />
              <div className="landing-hero-actions">
                <p className="landing-hero-tagline">
                  Trade liquidity-backed assets with guaranteed floors, transparent cycles, and creator-aligned rewards.
                </p>
                <button
                  className="learn-more-btn"
                  onClick={() =>
                    document.getElementById("lft-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  Learn more <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <main className="landing-empty">
          <section className="problem-section scroll-drop">
            <div>
              <h3 className="problem-title">The problem</h3>
              <p className="problem-subtitle">Problems across all asset class</p>
            </div>

            <div className="problem-list">
              <div className="problem-box-row">
                <article className="problem-box problem-box--blue">
                  <p className="problem-box-copy">{PRIMARY_PROBLEM.text}</p>
                  <div className="problem-box-frame">
                    <ProblemDiagram variant="blue" />
                  </div>
                </article>

                <article className="problem-box problem-box--yellow">
                  <p className="problem-box-copy">{SECONDARY_PROBLEM.text}</p>
                  <div className="problem-box-frame">
                    <ProblemDiagram variant="yellow" />
                  </div>
                </article>
              </div>

              <div className="problem-box-row">
                <article className="problem-box problem-box--green">
                  <p className="problem-box-copy">{TERTIARY_PROBLEM.text}</p>
                  <div className="problem-box-frame">
                    <ProblemDiagram variant="green" />
                  </div>
                </article>

                <article className="problem-box problem-box--purple">
                  <p className="problem-box-copy">{QUATERNARY_PROBLEM.text}</p>
                  <div className="problem-box-frame">
                    <ProblemDiagram variant="purple" />
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section className="landing-section">
            <div className="landing-section-content">
              <span className="landing-section-kicker">$LFT.</span>
              <h3 className="landing-section-title">
                Non-extractive
                <span className="landing-section-muted-line">Digital Value.</span>
              </h3>
              <p className="landing-section-copy">
                Liquidity Funded Tokens (LFTs) introduce a new paradigm in digital assets: LFTs are tokenized income (Cash)
                backed by real liquidity from day one, with redemption value that grows in real-time based on gamified
                engagement, structured in self-contained cycles that compound strength over time. In simple terms LFTs are
                tokens with real liquidity where engagement towards the token is not trading based but gamifications.
              </p>
              <div className="landing-section-actions">
                <button className="landing-section-action" onClick={() => navigate("/coin-tags")}>
                  Go to Solaris Foundation
                </button>
                <button className="landing-section-action landing-section-action--secondary" onClick={() => navigate("/assets")}>
                  Go to Token
                </button>
              </div>
            </div>
            <div className="token-visual" aria-hidden="true">
              <div className="token-visual-ring token-visual-ring--left" />
              <div className="token-visual-ring token-visual-ring--right" />
              <div className="token-visual-mark">
                <div className="token-visual-mark-outline" />
                <div className="token-visual-mark-fill" />
              </div>
            </div>
          </section>

          <section className="lft-section" id="lft-section">
            <div className="lft-section-inner">
              <div className="lft-image-frame">
                <h3 className="lft-intro-title">Introducing LFTs.</h3>
                <p className="lft-intro-copy">
                  Liquidity Funded Tokens. Value-backed from day one. Guaranteed redemption that never hits zero.
                </p>
              </div>
            </div>
          </section>

          <section className="paradigm-section">
            <div className="paradigm-section-inner">
              <p className="paradigm-copy">
                Solaris is the end of the "Rug Pull." We are building the first Non-Extractive Launchpad. We reject the
                model where value is based on promises; instead, we enforce value through Liquidity Funded Tokens (LFTs).
              </p>
              <p className="paradigm-copy">
                Inclusive by Design: We don&apos;t just sell tokens; we build economies. Every interaction and CoinTag purchase
                automatically increases the Liquidity Per Unit (LPU) for the entire community.
              </p>
              <p className="paradigm-copy">
                Protected by Math: We guarantee a redemption floor that rises in real-time. A Solaris asset can never go to zero.
              </p>
              <p className="paradigm-copy">
                * Sustainable for All: Creators earn from engagement and cash flow, not by dumping on their community.
              </p>
            </div>
          </section>

          <section className="how-it-works-section">
            <div className="how-it-works-inner">
              <h3 className="how-it-works-heading">How it works</h3>
              <div className="how-it-works-track">
                {HOW_IT_WORKS_STEPS.map((item, index) => {
                  const isOpen = openHowItWorks === index;
                  return (
                    <article
                      className="how-it-works-card"
                      data-open={isOpen}
                      key={item.title}
                    >
                      <button
                        type="button"
                        className="how-it-works-trigger"
                        onClick={() => setOpenHowItWorks((current) => (current === index ? -1 : index))}
                        aria-expanded={isOpen}
                      >
                        <span className="how-it-works-number">{index + 1}</span>
                        <span className="how-it-works-question">{item.title}</span>
                        <span className="how-it-works-icon" aria-hidden="true">+</span>
                      </button>
                      <div className="how-it-works-answer" hidden={!isOpen}>
                        <div className="how-it-works-answer-inner">
                          <p>{item.body}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <footer className="landing-footer">
            <div className="landing-footer-inner">
              <div className="landing-footer-brand">
                <div className="landing-footer-mark">
                  <img src="/h4.png" alt="Solaris logo" />
                  <span>Solaris</span>
                </div>
                <p className="landing-footer-copy">
                  Liquidity-backed token cycles built for real value, measurable demand, and cleaner creator economics.
                </p>
                <p className="landing-footer-copy">© {currentYear} Solaris. All rights reserved.</p>
                <div className="landing-footer-socials">
                  <button className="landing-footer-social" aria-label="Instagram">
                    <Instagram size={18} />
                  </button>
                  <button className="landing-footer-social" aria-label="Twitter">
                    <Twitter size={18} />
                  </button>
                  <button className="landing-footer-social" aria-label="LinkedIn">
                    <Linkedin size={18} />
                  </button>
                  <button className="landing-footer-social" aria-label="Telegram">
                    <Send size={18} />
                  </button>
                  <button className="landing-footer-social" aria-label="YouTube">
                    <Youtube size={18} />
                  </button>
                </div>
              </div>

              {FOOTER_SECTIONS.map((section) => (
                <div className="landing-footer-column" key={section.title}>
                  <h4 className="landing-footer-column-title">{section.title}</h4>
                  <div className="landing-footer-links">
                    {section.links.map((link) => (
                      <button
                        key={`${section.title}-${link.label}`}
                        className="landing-footer-link"
                        onClick={() => navigate(link.to)}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="landing-footer-subscribe">
                <p className="landing-footer-subscribe-copy">
                  Subscribe to be the first to learn the latest from Solaris
                </p>
                <form className="landing-footer-subscribe-form" onSubmit={(event) => event.preventDefault()}>
                  <input className="landing-footer-subscribe-input" type="email" placeholder="name@email.com" aria-label="Email address" />
                  <button className="landing-footer-subscribe-button" type="submit">
                    Subscribe
                  </button>
                </form>
                <div className="landing-footer-subscribe-socials">
                  <button className="landing-footer-social" aria-label="Twitter">
                    <Twitter size={18} />
                  </button>
                  <button className="landing-footer-social" aria-label="Discord">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default SolarisSlider;
