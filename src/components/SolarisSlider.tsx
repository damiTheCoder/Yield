import { useNavigate } from "react-router-dom";

interface DataItem {
  place: string;
  title: string;
  title2: string;
  description: string;
  image: string;
  cta: string;
  ctaLink: string;
}

const data: DataItem[] = [
  {
    place: "The Problem",
    title: "DIGITAL ASSETS",
    title2: "ARE BROKEN",
    description:
      "Crypto today is driven by speculation, not sustainability. Meme coins spike on hype, then crater to zero. NFTs promise creativity but strand holders in illiquid markets. The system feeds on exit liquidity.",
    image: "/d1.png",
    cta: "Discover LFTs",
    ctaLink: "/assets",
  },
  {
    place: "The Solution",
    title: "LIQUIDITY",
    title2: "FUNDED TOKENS",
    description:
      "Solaris redefines digital ownership with Liquidity-Funded Tokens (LFTs) - assets backed by real liquidity reserves. Every token launch creates sustainable value, not speculative bubbles.",
    image: "/d2.png",
    cta: "Launch Console",
    ctaLink: "/assets",
  },
  {
    place: "Creative Finance",
    title: "CREATIVE",
    title2: "LIQUIDITY",
    description:
      "How DAOs, NFT studios, and LFT builders treat liquidity as a design medium. Turn hype into real value through liquidity-backed launches powered by Solaris.",
    image: "/d3.png",
    cta: "Read More",
    ctaLink: "/blog/creative-liquidity-web3",
  },
  {
    place: "The Future",
    title: "VALUE BACKED",
    title2: "DIGITAL ASSETS",
    description:
      "At Solaris, we believe digital assets should hold their ground - not your hope. Creators earn sustainably. Holders get real value. The future is liquidity-backed.",
    image: "/d4.png",
    cta: "Start Building",
    ctaLink: "/coin-tags",
  },
];

const toSectionId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const SolarisSlider = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    if (typeof window === "undefined") return;
    const target = document.getElementById(sectionId);
    if (!target) return;
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  };

  return (
    <div className="solaris-landing">
      <style>{`
        .solaris-landing {
          position: relative;
          min-height: 100vh;
          width: 100%;
          color: #060b16;
          background: linear-gradient(180deg, #f2f8ff 0%, #e2efff 38%, #d4e6ff 100%);
          font-family: "Glacial Indifference", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .solaris-landing::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(47, 123, 247, 0.09) 1px, transparent 1px),
            linear-gradient(90deg, rgba(47, 123, 247, 0.09) 1px, transparent 1px);
          background-size: 68px 68px;
          pointer-events: none;
          z-index: 0;
        }

        .landing-shell {
          position: relative;
          z-index: 1;
        }

        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 14px 22px;
          background: rgba(237, 243, 254, 0.85);
          backdrop-filter: blur(10px);
        }

        .landing-nav-inner {
          max-width: 1220px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
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
          padding: 0 28px;
          min-height: 58px;
          background: #060b16;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .get-started-btn:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }

        .hero-section {
          min-height: calc(100vh - 88px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px 20px 36px;
        }

        .hero-chip {
          border: 1px solid rgba(47, 123, 247, 0.36);
          border-radius: 999px;
          padding: 12px 22px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          color: #2f7bf7;
          background: rgba(255, 255, 255, 0.35);
        }

        .chip-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #2f7bf7;
        }

        .hero-title {
          margin: 34px 0 0;
          font-size: clamp(50px, 8.2vw, 102px);
          line-height: 0.95;
          letter-spacing: -0.03em;
          font-weight: 800;
        }

        .hero-title span {
          display: block;
        }

        .hero-title .accent {
          color: #2f59e8;
        }

        .hero-underline {
          width: min(78vw, 460px);
          height: 18px;
          border-radius: 999px;
          background: #2f59e8;
          margin: -10px auto 0;
        }

        .hero-copy {
          margin-top: 24px;
          font-size: clamp(21px, 2.2vw, 41px);
          line-height: 1.32;
          color: rgba(6, 11, 22, 0.56);
          max-width: 980px;
        }

        .hero-actions {
          margin-top: 34px;
          display: inline-flex;
          align-items: center;
          gap: 28px;
        }

        .hero-primary {
          border: none;
          border-radius: 999px;
          min-height: 60px;
          padding: 0 34px;
          background: #2f59e8;
          color: #ffffff;
          font-size: 29px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .hero-secondary {
          border: none;
          background: transparent;
          color: #060b16;
          font-size: 29px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .hero-primary:hover {
          transform: translateY(-1px);
          opacity: 0.96;
        }

        .hero-secondary:hover {
          color: #2f59e8;
        }

        .hero-divider {
          margin-top: 34px;
          width: min(88vw, 820px);
          height: 2px;
          background: rgba(6, 11, 22, 0.14);
        }

        .story-feed {
          max-width: 980px;
          margin: 0 auto;
          padding: 8px 10px 26px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .story-block {
          background: rgba(255, 255, 255, 0.44);
          border-radius: 24px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .place-tag {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(6, 11, 22, 0.64);
        }

        .main-title {
          margin: 4px 0 0;
          font-size: clamp(30px, 4.4vw, 58px);
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .main-title .line-two {
          display: block;
          color: #2f59e8;
        }

        .description {
          font-size: 18px;
          line-height: 1.6;
          color: rgba(6, 11, 22, 0.68);
        }

        .cta-buttons {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }

        .bookmark-btn {
          width: 42px;
          height: 42px;
          border: none;
          border-radius: 999px;
          background: #060b16;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .discover-btn {
          border: none;
          border-radius: 999px;
          min-height: 42px;
          padding: 0 22px;
          background: #060b16;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
        }

        .story-image-wrap {
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.6);
        }

        .story-image {
          width: 100%;
          height: clamp(220px, 40vw, 460px);
          object-fit: cover;
          display: block;
        }

        @media (max-width: 1100px) {
          .landing-nav-inner {
            grid-template-columns: 1fr auto;
            gap: 10px;
          }

          .nav-links {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .landing-nav {
            padding: 10px 12px;
          }

          .nav-brand {
            font-size: 16px;
          }

          .nav-logo {
            width: 30px;
            height: 30px;
          }

          .get-started-btn {
            min-height: 46px;
            padding: 0 16px;
            font-size: 14px;
            gap: 8px;
          }

          .hero-section {
            min-height: auto;
            padding: 20px 12px 24px;
          }

          .hero-chip {
            font-size: 13px;
            padding: 8px 14px;
          }

          .hero-title {
            margin-top: 20px;
            font-size: clamp(36px, 13vw, 60px);
          }

          .hero-underline {
            height: 10px;
            width: min(88vw, 280px);
            margin-top: -4px;
          }

          .hero-copy {
            margin-top: 16px;
            font-size: 16px;
          }

          .hero-actions {
            margin-top: 20px;
            gap: 16px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .hero-primary,
          .hero-secondary {
            font-size: 18px;
            min-height: 46px;
          }

          .hero-primary {
            padding: 0 18px;
          }

          .hero-divider {
            margin-top: 22px;
          }

          .story-feed {
            padding: 8px 8px 18px;
            gap: 12px;
          }

          .story-block {
            padding: 12px;
            border-radius: 18px;
          }

          .description {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="landing-shell">
        <nav className="landing-nav">
          <div className="landing-nav-inner">
            <button className="nav-brand" onClick={() => scrollToSection("hero")}>
              <span className="nav-logo">
                <img src="/h4.png" alt="Solaris logo" />
              </span>
              <span>Solaris Ledger</span>
            </button>

            <div className="nav-links">
              <button className="nav-link" onClick={() => scrollToSection("the-solution")}>Features</button>
              <button className="nav-link" onClick={() => scrollToSection("creative-finance")}>How It Works</button>
              <button className="nav-link" onClick={() => navigate("/assets")}>Marketplace</button>
              <button className="nav-link" onClick={() => scrollToSection("the-future")}>About</button>
            </div>

            <button className="get-started-btn" onClick={() => navigate("/assets")}>
              Get Started
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </nav>

        <section className="hero-section" id="hero">
          <div className="hero-chip">
            <span className="chip-dot" />
            The era of redifined Token Launch & Liquidity
          </div>

          <h1 className="hero-title">
            <span>Your Asset</span>
            <span className="accent">Liquidity,</span>
            <span>Simplified.</span>
          </h1>
          <div className="hero-underline" />

          <p className="hero-copy">
            Know your numbers. Control your reserve. Build and scale digital assets with confidence.
          </p>

          <div className="hero-actions">
            <button className="hero-primary" onClick={() => navigate("/assets")}>
              Start Exploring
              <span aria-hidden="true">→</span>
            </button>
            <button className="hero-secondary" onClick={() => navigate("/blog")}>
              Watch Demo
              <span aria-hidden="true">▶</span>
            </button>
          </div>

          <div className="hero-divider" />
        </section>

        <main className="story-feed">
          {data.map((item) => {
            const sectionId = toSectionId(item.place);

            return (
              <section className="story-block" key={item.place} id={sectionId}>
                <div className="place-tag">{item.place}</div>

                <h2 className="main-title">
                  {item.title}
                  <span className="line-two">{item.title2}</span>
                </h2>

                <p className="description">{item.description}</p>

                <div className="cta-buttons">
                  <button className="bookmark-btn" onClick={() => navigate(item.ctaLink)} aria-label={`Open ${item.place}`}>
                    <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <button className="discover-btn" onClick={() => navigate(item.ctaLink)}>
                    {item.cta}
                  </button>
                </div>

                <div className="story-image-wrap">
                  <img src={item.image} alt={`${item.title} ${item.title2}`} className="story-image" />
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
};

export default SolarisSlider;
