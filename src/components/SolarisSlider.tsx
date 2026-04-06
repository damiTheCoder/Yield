import { Instagram, Linkedin, Send, Twitter, Youtube } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const PROBLEM_ITEMS = [
  {
    image: "/k3.jpeg",
    alt: "Meme coins",
    text: "Meme Coins: No intrinsic value → pump & dump → zero",
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
    title: "Platform",
    links: [
      { label: "Assets", to: "/assets" },
      { label: "Portfolio", to: "/portfolio" },
      { label: "Revenue", to: "/revenue" },
      { label: "Wallet", to: "/wallet" },
    ],
  },
  {
    title: "Creators",
    links: [
      { label: "LaunchPad", to: "/assets" },
      { label: "How It Works", to: "/coin-tags" },
      { label: "Token Financials", to: "/revenue" },
      { label: "Notifications", to: "/notifications" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "Marketplace", to: "/assets" },
      { label: "Connect Wallet", to: "/portfolio" },
      { label: "Get Started", to: "/assets" },
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

    const mobileQuery = window.matchMedia("(max-width: 768px)");
    let rafId = 0;
    let observer: IntersectionObserver | null = null;

    animatedElements.forEach((element) => element.classList.add("scroll-drop-ready"));

    const clearDesktopListeners = () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };

    const disconnectObserver = () => {
      if (!observer) return;
      observer.disconnect();
      observer = null;
    };

    const updateDesktopVisibility = () => {
      const viewportHeight = window.innerHeight;
      const revealStart = viewportHeight * 0.82;
      const revealEnd = viewportHeight * 0.08;
      const hideTop = -96;
      const hideBottom = viewportHeight + 96;

      animatedElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const shouldShow = rect.top <= revealStart && rect.bottom >= revealEnd;
        const shouldHide = rect.bottom < hideTop || rect.top > hideBottom;

        if (shouldShow) {
          element.classList.add("is-visible");
          return;
        }

        if (shouldHide) {
          element.classList.remove("is-visible");
        }
      });
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateDesktopVisibility();
      });
    };

    const enableMobileAnimation = () => {
      clearDesktopListeners();
      disconnectObserver();

      // Reveal anything already close to the viewport immediately on mobile.
      const initialRevealLine = window.innerHeight * 0.96;
      animatedElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top <= initialRevealLine) {
          element.classList.add("is-visible");
        }
      });

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const target = entry.target as HTMLElement;
            target.classList.add("is-visible");
            observer?.unobserve(target);
          });
        },
        {
          threshold: 0.06,
          rootMargin: "0px 0px -10% 0px",
        },
      );

      animatedElements.forEach((element) => {
        if (!element.classList.contains("is-visible")) {
          observer?.observe(element);
        }
      });
    };

    const enableDesktopAnimation = () => {
      disconnectObserver();
      updateDesktopVisibility();
      window.addEventListener("scroll", scheduleUpdate, { passive: true });
      window.addEventListener("resize", scheduleUpdate);
    };

    const syncAnimationMode = () => {
      if (mobileQuery.matches) {
        enableMobileAnimation();
        return;
      }

      enableDesktopAnimation();
    };

    syncAnimationMode();
    mobileQuery.addEventListener("change", syncAnimationMode);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      clearDesktopListeners();
      disconnectObserver();
      mobileQuery.removeEventListener("change", syncAnimationMode);
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
          background: #ffffff;
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
        }

        .landing-top-band {
          position: relative;
          background: url("/ks1.png") center top / cover no-repeat;
          overflow: hidden;
        }

        .landing-top-band::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 128px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.64) 66%, #ffffff 100%);
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
          background: url("/ks1.png") center top / cover no-repeat;
        }

        .landing-nav-inner {
          max-width: 1220px;
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
          background: transparent;
          color: #060b16;
          font-size: 18px;
          font-weight: 700;
          justify-self: start;
          cursor: pointer;
          padding: 0;
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
          gap: 38px;
        }

        .nav-link {
          border: none;
          background: transparent;
          color: rgba(6, 11, 22, 0.62);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #2f7bf7;
        }

        .get-started-btn {
          justify-self: end;
          border: none;
          border-radius: 999px;
          padding: 0 18px;
          min-height: 44px;
          background: #2f7bf7;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.2s ease;
          box-shadow: 0 14px 28px rgba(47, 123, 247, 0.24);
        }

        .get-started-btn:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }

        .landing-hero {
          min-height: clamp(360px, 64vh, 680px);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 58px 20px 120px;
        }

        .landing-hero-inner {
          position: relative;
          width: min(1100px, 100%);
          min-height: clamp(260px, 44vw, 420px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landing-hero-title {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) scaleX(1.12);
          margin: 0;
          font-size: clamp(78px, 16vw, 250px);
          line-height: 0.9;
          letter-spacing: -0.03em;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.96);
          text-align: center;
          white-space: nowrap;
          z-index: 3;
          text-shadow: 0 12px 30px rgba(112, 164, 207, 0.22);
        }

        .landing-hero-ring {
          position: relative;
          z-index: 2;
          width: clamp(220px, 34vw, 520px);
          filter: drop-shadow(0 24px 48px rgba(38, 63, 88, 0.18));
          user-select: none;
          pointer-events: none;
        }

        .landing-hero-actions {
          position: absolute;
          left: 50%;
          bottom: clamp(-18px, 0vw, 8px);
          transform: translateX(-50%);
          z-index: 4;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          width: max-content;
        }

        .landing-hero-tagline {
          margin: 0 0 32px;
          color: #ffffff;
          font-size: clamp(18px, 1.9vw, 28px);
          line-height: 1.08;
          letter-spacing: -0.02em;
          font-weight: 600;
          text-align: center;
          white-space: nowrap;
          text-shadow: 0 10px 24px rgba(6, 11, 22, 0.28);
        }

        .learn-more-btn {
          border: none;
          border-radius: 999px;
          min-height: 56px;
          padding: 0 30px;
          background: #2f66f6;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 16px 34px rgba(47, 102, 246, 0.28);
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .learn-more-btn:hover {
          transform: translateY(-1px);
          background: #2558de;
        }

        .landing-empty {
          flex: 1;
          min-height: 36vh;
          background: #ffffff;
        }

        .landing-section {
          max-width: 1220px;
          margin: 0 auto;
          padding: 72px 24px 40px;
        }

        .landing-section-title {
          margin: 0;
          color: #6da8ff;
          font-size: clamp(32px, 5.2vw, 64px);
          line-height: 0.96;
          letter-spacing: -0.04em;
          font-weight: 300;
        }

        .landing-section-copy {
          margin: 14px 0 0;
          max-width: 860px;
          color: rgba(6, 11, 22, 0.72);
          font-size: clamp(14px, 1.1vw, 17px);
          line-height: 1.6;
          font-weight: 300;
          letter-spacing: -0.01em;
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
          color: #060b16;
          font-size: clamp(28px, 4vw, 52px);
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 400;
        }

        .problem-subtitle {
          margin: 10px 0 0;
          color: rgba(6, 11, 22, 0.54);
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
          min-height: 390px;
          padding: 30px 30px 168px;
          border-radius: 34px;
          text-align: left;
          display: flex;
          align-items: flex-start;
        }

        .problem-box--blue {
          background: linear-gradient(180deg, #edf4ff 0%, #e4ecff 100%);
        }

        .problem-box--yellow {
          background: linear-gradient(180deg, #fff7de 0%, #fff0c2 100%);
        }

        .problem-box--green {
          background: linear-gradient(180deg, #edf9e6 0%, #e1f3d3 100%);
        }

        .problem-box--purple {
          background: linear-gradient(180deg, #f2ebff 0%, #eadfff 100%);
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
          color: #1c4399;
        }

        .problem-box--yellow .problem-box-copy {
          color: #8a5a07;
        }

        .problem-box--green .problem-box-copy {
          color: #2f7f49;
        }

        .problem-box--purple .problem-box-copy {
          color: #6b38b8;
        }

        .problem-box-frame {
          position: absolute;
          left: 50%;
          bottom: -18px;
          width: 190px;
          height: 190px;
          border-radius: 28px;
          transform: translateX(-50%) rotate(-8deg);
          box-shadow: 0 18px 36px rgba(6, 11, 22, 0.14);
          overflow: hidden;
          background: #ffffff;
        }

        .problem-box-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 28px;
        }

        .lft-section {
          margin-top: 12px;
          padding: 72px 24px 88px;
          background: transparent;
        }

        .lft-section-inner {
          max-width: 1220px;
          margin: 0 auto;
        }

        .lft-image-frame {
          width: min(100%, 980px);
          margin: 28px auto 0;
          padding: 0;
          border-radius: 18px;
          background: transparent;
          box-shadow: 0 22px 52px rgba(33, 86, 144, 0.14);
        }

        .lft-image {
          width: 100%;
          display: block;
          border-radius: 18px;
        }

        .lft-image-picture {
          display: block;
        }

        .paradigm-section {
          padding: 0 24px 104px;
        }

        .paradigm-section-inner {
          max-width: 1220px;
          margin: 0 auto;
          padding: clamp(72px, 10vw, 124px) clamp(24px, 4vw, 72px);
          border-radius: 36px;
          background: url("/r2.png") center / cover no-repeat;
        }

        .paradigm-copy {
          max-width: 920px;
          margin: 0 auto;
          color: #060b16;
          text-align: center;
          font-size: clamp(22px, 2.15vw, 34px);
          line-height: 1.42;
          letter-spacing: -0.03em;
          font-weight: 400;
        }

        .how-it-works-section {
          padding: 0 24px 120px;
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
          color: #060b16;
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
          border-top: 1px solid rgba(6, 11, 22, 0.18);
        }

        .how-it-works-card {
          width: 100%;
          border-radius: 0;
          background: transparent;
          border-bottom: 1px solid rgba(6, 11, 22, 0.18);
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
          color: #060b16;
          cursor: pointer;
        }

        .how-it-works-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: #f4f6fb;
          color: #6b7280;
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
          color: #060b16;
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
          color: rgba(6, 11, 22, 0.72);
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
          background: #171717;
          padding: 0 24px;
        }

        .landing-footer-inner {
          max-width: 1360px;
          margin: 0 auto;
          padding: 48px 8px 52px;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) repeat(3, minmax(160px, 1fr));
          align-items: flex-start;
          gap: 36px 56px;
        }

        .landing-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          color: rgba(255, 255, 255, 0.58);
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
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.72);
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .landing-footer-social:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }

        .landing-footer-columns {
          display: contents;
        }

        .landing-footer-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .landing-footer-column-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(22px, 2vw, 28px);
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-weight: 500;
        }

        .landing-footer-links {
          display: flex;
          flex-direction: column;
          gap: 18px;
          align-items: flex-start;
        }

        .landing-footer-link {
          border: 0;
          padding: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.62);
          font-size: 15px;
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
            background: linear-gradient(180deg, rgba(186, 225, 250, 0.96) 0%, rgba(170, 214, 246, 0.72) 62%, rgba(170, 214, 246, 0) 100%);
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
            background: linear-gradient(180deg, rgba(198, 231, 252, 0.88) 0%, rgba(183, 222, 250, 0.68) 66%, rgba(183, 222, 250, 0.12) 100%);
            box-shadow: 0 10px 24px rgba(6, 11, 22, 0.08);
            backdrop-filter: saturate(180%) blur(18px);
            -webkit-backdrop-filter: saturate(180%) blur(18px);
          }

          .landing-nav.landing-nav-past-hero {
            background: rgba(255, 255, 255, 0.82);
            box-shadow: 0 10px 24px rgba(6, 11, 22, 0.1);
            backdrop-filter: saturate(180%) blur(22px);
            -webkit-backdrop-filter: saturate(180%) blur(22px);
          }

          .nav-brand {
            font-size: 16px;
          }

          .nav-logo {
            width: 30px;
            height: 30px;
          }

          .get-started-btn {
            min-height: 38px;
            padding: 0 12px;
            font-size: 12px;
            gap: 6px;
          }

          .landing-hero {
            min-height: 320px;
            padding: 24px 12px 90px;
          }

          .landing-hero-title {
            font-size: clamp(56px, 17vw, 96px);
          }

          .landing-hero-ring {
            width: clamp(180px, 52vw, 300px);
          }

          .landing-hero-actions {
            bottom: -14px;
            width: min(90vw, 320px);
          }

          .landing-hero-tagline {
            margin: 0 0 22px;
            font-size: clamp(12px, 3.5vw, 16px);
            white-space: normal;
            width: 100%;
          }

          .learn-more-btn {
            min-height: 46px;
            padding: 0 22px;
            font-size: 14px;
          }

          .landing-section {
            padding: 52px 16px 28px;
          }

          .landing-section-title {
            font-size: clamp(28px, 9vw, 42px);
          }

          .landing-section-copy {
            margin-top: 12px;
            font-size: clamp(13px, 3.8vw, 16px);
            line-height: 1.55;
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
            min-height: 290px;
            padding: 20px 18px 112px;
            border-radius: 24px;
          }

          .problem-box-copy {
            max-width: none;
            font-size: 16px;
            line-height: 1.45;
          }

          .problem-box-frame {
            width: 118px;
            height: 118px;
            bottom: -10px;
            border-radius: 20px;
          }

          .problem-box-image {
            border-radius: 20px;
          }

          .lft-section {
            margin-top: 8px;
            padding: 48px 16px 56px;
          }

          .lft-image-frame {
            width: min(94vw, 380px);
            margin-top: 20px;
            padding: 0;
            border-radius: 13px;
          }

          .lft-image {
            border-radius: 13px;
          }

          .paradigm-section {
            padding: 0 12px 32px;
          }

          .paradigm-section-inner {
            min-height: 500px;
            padding: 28px 14px;
            border-radius: 24px;
            background: url("/r3.png") center / cover no-repeat;
            display: flex;
            align-items: center;
          }

          .paradigm-copy {
            font-size: clamp(17px, 5vw, 22px);
            line-height: 1.5;
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
                <span>Solaris Ledger</span>
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
              <h1 className="landing-hero-title">Solaris</h1>
              <img className="landing-hero-ring" src="/G5.png" alt="" aria-hidden="true" />
              <div className="landing-hero-actions">
                <p className="landing-hero-tagline">The era of Non extractive tokens</p>
                <button
                  className="learn-more-btn"
                  onClick={() =>
                    document.getElementById("lft-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  Learn more
                </button>
              </div>
            </div>
          </section>
        </div>

        <main className="landing-empty">
          <section className="problem-section">
            <div className="scroll-drop">
              <h3 className="problem-title">The problem</h3>
              <p className="problem-subtitle">Problems across all asset class</p>
            </div>

            <div className="problem-list">
              <div className="problem-box-row scroll-drop" data-drop-delay="1">
                <article className="problem-box problem-box--blue scroll-drop" data-drop-delay="1">
                  <p className="problem-box-copy">{PRIMARY_PROBLEM.text}</p>
                  <div className="problem-box-frame">
                    <img className="problem-box-image" src={PRIMARY_PROBLEM.image} alt={PRIMARY_PROBLEM.alt} />
                  </div>
                </article>

                <article className="problem-box problem-box--yellow scroll-drop" data-drop-delay="2">
                  <p className="problem-box-copy">{SECONDARY_PROBLEM.text}</p>
                  <div className="problem-box-frame">
                    <img className="problem-box-image" src={SECONDARY_PROBLEM.image} alt={SECONDARY_PROBLEM.alt} />
                  </div>
                </article>
              </div>

              <div className="problem-box-row scroll-drop" data-drop-delay="2">
                <article className="problem-box problem-box--green scroll-drop" data-drop-delay="3">
                  <p className="problem-box-copy">{TERTIARY_PROBLEM.text}</p>
                  <div className="problem-box-frame">
                    <img className="problem-box-image" src={TERTIARY_PROBLEM.image} alt={TERTIARY_PROBLEM.alt} />
                  </div>
                </article>

                <article className="problem-box problem-box--purple scroll-drop" data-drop-delay="4">
                  <p className="problem-box-copy">{QUATERNARY_PROBLEM.text}</p>
                  <div className="problem-box-frame">
                    <img className="problem-box-image" src={QUATERNARY_PROBLEM.image} alt={QUATERNARY_PROBLEM.alt} />
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section className="landing-section scroll-drop">
            <h3 className="landing-section-title">Zero to Value.</h3>
            <p className="landing-section-copy">
              Digital assets shouldn&apos;t be a gamble. Most tokens today are built on hype and they end in extraction leaving
              the end users liquidated. We built something different. A token that actually has a guaranteed floor that
              requires no complex engagement such as trading, farming or drops.
            </p>
          </section>

          <section className="lft-section scroll-drop" id="lft-section" data-drop-delay="1">
            <div className="lft-section-inner">
              <div className="lft-image-frame">
                <img className="lft-image" src="/v2.png" alt="LFT interface preview" />
              </div>
            </div>
          </section>

          <section className="paradigm-section scroll-drop" data-drop-delay="2">
            <div className="paradigm-section-inner">
              <p className="paradigm-copy">
                Liquidity Funded Tokens (LFTs) introduce a new paradigm in digital assets: tokens backed by real liquidity
                from day one, with redemption value that grows in real-time as the community engages, structured in
                self-contained cycles that compound strength over time.
              </p>
            </div>
          </section>

          <section className="how-it-works-section">
            <div className="how-it-works-inner">
              <h3 className="how-it-works-heading scroll-drop">How it works</h3>
              <div className="how-it-works-track">
                {HOW_IT_WORKS_STEPS.map((item, index) => {
                  const isOpen = openHowItWorks === index;
                  return (
                    <article
                      className="how-it-works-card scroll-drop"
                      data-open={isOpen}
                      data-drop-delay={String(Math.min(index + 1, 5))}
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
              <div className="landing-footer-brand scroll-drop">
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

              <div className="landing-footer-columns">
                {FOOTER_SECTIONS.map((section, index) => (
                  <div className="landing-footer-column scroll-drop" data-drop-delay={String(Math.min(index + 1, 4))} key={section.title}>
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
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default SolarisSlider;
