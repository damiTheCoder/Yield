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
] as const;

const SolarisSlider = () => {
  const navigate = useNavigate();

  return (
    <div className="solaris-landing">
      <style>{`
        .solaris-landing {
          position: relative;
          min-height: 100vh;
          width: 100%;
          color: #060b16;
          background: #ffffff;
          font-family: "Glacial Indifference", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 14px 22px;
          background: transparent;
          backdrop-filter: none;
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
          padding: 40px 20px 120px;
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

        .landing-hero-tagline {
          position: absolute;
          left: 50%;
          bottom: clamp(10px, 2vw, 28px);
          transform: translateX(-50%);
          margin: 0;
          color: #42bf67;
          font-size: clamp(14px, 1.35vw, 20px);
          line-height: 1.2;
          letter-spacing: -0.02em;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
          z-index: 4;
          text-shadow: 0 6px 18px rgba(255, 255, 255, 0.36);
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
          max-width: 1080px;
          width: min(100%, 1080px);
          margin: 0 0 0 auto;
          padding: 8px 32px 80px 88px;
          text-align: right;
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
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          align-items: flex-end;
        }

        .problem-item {
          display: grid;
          width: min(100%, 980px);
          grid-template-columns: minmax(0, 1fr) 112px;
          gap: 22px;
          align-items: center;
          padding: 6px 0 10px;
        }

        .problem-item-frame {
          width: 112px;
          height: 112px;
          border-radius: 24px;
          transform: rotate(-8deg);
          box-shadow: 0 14px 28px rgba(6, 11, 22, 0.08);
          align-self: start;
          margin-bottom: 10px;
        }

        .problem-item-image {
          width: 100%;
          height: 100%;
          border-radius: 24px;
          object-fit: cover;
          display: block;
        }

        .problem-item-copy {
          margin: 0;
          max-width: 760px;
          padding: 18px 24px;
          border-radius: 28px;
          background: #e5f8dd;
          color: #2f9a52;
          font-size: clamp(16px, 1.25vw, 19px);
          line-height: 1.55;
          font-weight: 400;
          letter-spacing: -0.01em;
          text-align: right;
          justify-self: end;
          display: -webkit-box;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .lft-section {
          margin-top: 12px;
          padding: 72px 24px 88px;
          background: transparent;
        }

        .lft-section-inner {
          max-width: 1220px;
          margin: 0 auto;
          text-align: center;
        }

        .lft-section-title {
          margin: 0;
          color: #2f59e8;
          font-size: clamp(28px, 4.6vw, 56px);
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 400;
        }

        .lft-section-copy {
          margin: 14px 0 0;
          max-width: 760px;
          color: rgba(6, 11, 22, 0.76);
          font-size: clamp(16px, 1.4vw, 22px);
          line-height: 1.5;
          font-weight: 400;
          margin-left: auto;
          margin-right: auto;
        }

        .lft-image-frame {
          width: min(100%, 1140px);
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

          .landing-hero-tagline {
            bottom: 8px;
            font-size: clamp(12px, 3.5vw, 16px);
            white-space: normal;
            width: min(90vw, 320px);
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
            margin: 0 0 0 auto;
            padding: 8px 16px 52px;
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
          }

          .problem-item {
            width: 100%;
            grid-template-columns: minmax(0, 1fr) 88px;
            gap: 14px;
            padding: 4px 0 8px;
            align-items: center;
          }

          .problem-item-frame {
            width: 88px;
            height: 88px;
            border-radius: 18px;
            margin-bottom: 6px;
          }

          .problem-item-image {
            width: 100%;
            height: 100%;
            border-radius: 18px;
          }

          .problem-item-copy {
            padding: 14px 16px;
            border-radius: 22px;
            font-size: 14px;
            line-height: 1.5;
            max-width: none;
            text-align: right;
            display: block;
            overflow: visible;
            -webkit-line-clamp: unset;
          }

          .lft-section {
            margin-top: 8px;
            padding: 48px 16px 56px;
          }

          .lft-section-title {
            font-size: clamp(24px, 7vw, 34px);
          }

          .lft-section-copy {
            margin-top: 12px;
            font-size: 15px;
            line-height: 1.55;
          }

          .lft-image-frame {
            width: min(86vw, 320px);
            margin-top: 20px;
            padding: 0;
            border-radius: 13px;
          }

          .lft-image {
            border-radius: 13px;
          }
        }
      `}</style>

      <div className="landing-shell">
        <div className="landing-top-band">
          <nav className="landing-nav">
            <div className="landing-nav-inner">
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
          </nav>

          <section className="landing-hero">
            <div className="landing-hero-inner">
              <h1 className="landing-hero-title">Solaris</h1>
              <img className="landing-hero-ring" src="/G5.png" alt="" aria-hidden="true" />
              <p className="landing-hero-tagline">The era of Non extractive tokens</p>
            </div>
          </section>
        </div>

        <main className="landing-empty">
          <section className="landing-section">
            <h3 className="landing-section-title">Zero to Value.</h3>
            <p className="landing-section-copy">
              Digital assets shouldn&apos;t be a gamble. Most tokens today are built on hype and they end in extraction leaving
              the end users liquidated. We built something different. A token that actually has a guaranteed floor that
              requires no complex engagement such as trading, farming or drops.
            </p>
          </section>

          <section className="problem-section">
            <h3 className="problem-title">The problem</h3>
            <p className="problem-subtitle">Problems across all asset class</p>

            <div className="problem-list">
              {PROBLEM_ITEMS.map((item) => (
                <div className="problem-item" key={item.text}>
                  <p className="problem-item-copy">{item.text}</p>
                  <div className="problem-item-frame">
                    <img className="problem-item-image" src={item.image} alt={item.alt} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="lft-section">
            <div className="lft-section-inner">
              <h3 className="lft-section-title">Introducing LFTs.</h3>
              <p className="lft-section-copy">
                Liquidity Funded Tokens. Value-backed from day one. Guaranteed redemption that never hits zero.
              </p>
              <div className="lft-image-frame">
                <picture className="lft-image-picture">
                  <source media="(max-width: 768px)" srcSet="/v3.png" />
                  <img className="lft-image" src="/v2.png" alt="LFT interface preview" />
                </picture>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SolarisSlider;
