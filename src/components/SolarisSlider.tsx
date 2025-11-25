import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { Monitor, Moon, Sun } from 'lucide-react';

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
    place: 'The Problem',
    title: 'DIGITAL ASSETS',
    title2: 'ARE BROKEN',
    description: 'Crypto today is driven by speculation, not sustainability. Meme coins spike on hype, then crater to zero. NFTs promise creativity but strand holders in illiquid markets. The system feeds on exit liquidity.',
    image: '/d1.png',
    cta: 'Discover LFTs',
    ctaLink: '/assets'
  },
  {
    place: 'The Solution',
    title: 'LIQUIDITY',
    title2: 'FUNDED TOKENS',
    description: 'Solaris redefines digital ownership with Liquidity-Funded Tokens (LFTs) — assets backed by real liquidity reserves. Every token launch creates sustainable value, not speculative bubbles.',
    image: '/d2.png',
    cta: 'Launch Console',
    ctaLink: '/assets'
  },
  {
    place: 'Creative Finance',
    title: 'CREATIVE',
    title2: 'LIQUIDITY',
    description: 'How DAOs, NFT studios, and LFT builders treat liquidity as a design medium. Turn hype into real value through liquidity-backed launches powered by Solaris.',
    image: '/d3.png',
    cta: 'Read More',
    ctaLink: '/blog/creative-liquidity-web3'
  },
  {
    place: 'The Future',
    title: 'VALUE BACKED',
    title2: 'DIGITAL ASSETS',
    description: 'At Solaris, we believe digital assets should hold their ground — not your hope. Creators earn sustainably. Holders get real value. The future is liquidity-backed.',
    image: '/d4.png',
    cta: 'Start Building',
    ctaLink: '/coin-tags'
  }
];

const SolarisSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkMode = theme === "dark" || (theme === "system" && prefersDark);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % data.length);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // Auto-slide functionality
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex]);

  const handleCTA = (link: string) => {
    navigate(link);
  };

  const currentData = data[currentIndex];
  const themeOptions: Array<{ id: ThemeMode; icon: typeof Monitor; label: string }> = [
    { id: "system", icon: Monitor, label: "System theme" },
    { id: "dark", icon: Moon, label: "Dark theme" },
    { id: "light", icon: Sun, label: "Light theme" },
  ];

  return (
    <div className="solaris-slider">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500&display=swap");
        
        .solaris-slider {
          margin: 0;
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: "Inter", sans-serif;
          height: 100vh;
          min-height: 100vh;
          width: 100vw;
          overflow: hidden;
          position: relative;
          transition: background-color 0.4s ease, color 0.4s ease;
          --slider-accent-bg: #000;
          --slider-accent-contrast: #fff;
          --slider-accent-hover: rgba(0, 0, 0, 0.85);
          --slider-accent-soft: rgba(0, 0, 0, 0.12);
        }

        [data-theme="dark"] .solaris-slider {
          --slider-accent-bg: #fff;
          --slider-accent-contrast: #000;
          --slider-accent-hover: rgba(255, 255, 255, 0.85);
          --slider-accent-soft: rgba(255, 255, 255, 0.2);
        }

        /* Navigation */
        .navigation {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 14px 50px;
          font-weight: 500;
          color: inherit;
          background: transparent;
          transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
        }

        .navigation-inner {
          width: 100%;
          max-width: 640px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
        }

        .nav-logo {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
        }

        .nav-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 32px;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 0.1em;
        }

        .nav-item {
          position: relative;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .nav-item:hover {
          color: var(--slider-accent-bg);
        }

        .nav-item.active::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 99px;
          background-color: var(--slider-accent-bg);
        }

        /* Theme Toggle */
        .theme-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(107, 114, 128, 0.5);
          border: none;
          border-radius: 999px;
          padding: 6px;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .theme-option {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: rgba(226, 232, 240, 0.7);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .theme-option svg {
          width: 16px;
          height: 16px;
          stroke-width: 1.6;
        }

        .theme-option:hover {
          background: rgba(255, 255, 255, 0.12);
          color: hsl(var(--foreground));
        }

        .theme-option.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
        }

        /* Theme toggle state styling */
        [data-theme="dark"] .solaris-slider .theme-toggle {
          background: rgba(107, 114, 128, 0.5);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        }

        [data-theme="light"] .solaris-slider .theme-toggle {
          background: rgba(107, 114, 128, 0.5);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        [data-theme="light"] .solaris-slider .theme-option:hover {
          background: rgba(15, 23, 42, 0.12);
        }

        [data-theme="light"] .solaris-slider .theme-option.active {
          background: #111826;
          color: #f8fafc;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.35);
        }

        .launch-btn {
          background: linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%);
          color: #000;
          border: none;
          padding: 12px 24px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .launch-btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        /* Main layout */
        .main-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 100vh;
        }

        /* Left column - Content */
        .content-column {
          padding: 120px 60px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 10;
          opacity: 0;
          animation: dropUp 0.75s ease forwards;
        }


        .place-tag {
          position: relative;
          font-size: 16px;
          margin-bottom: 32px;
          padding-top: 20px;
          color: var(--slider-accent-bg);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }

        .place-tag::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 40px;
          height: 4px;
          border-radius: 99px;
          background-color: var(--slider-accent-bg);
        }

        .main-title {
          font-family: "Oswald", sans-serif;
          font-weight: 600;
          font-size: clamp(48px, 8vw, 80px);
          line-height: 0.9;
          margin-bottom: 24px;
          overflow: hidden;
          color: hsl(var(--foreground));
        }

        .title-line {
          transform: translateY(100%);
          animation: slideInUp 0.8s ease-out forwards;
        }

        .title-line:nth-child(2) {
          animation-delay: 0.1s;
          color: var(--slider-accent-bg);
        }

        @keyframes slideInUp {
          to {
            transform: translateY(0);
          }
        }

        .description {
          font-size: 18px;
          line-height: 1.7;
          margin-bottom: 40px;
          max-width: 520px;
          opacity: 0;
          animation: dropUp 0.8s ease-out 0.25s forwards;
          color: hsl(var(--foreground) / 0.8);
        }

        @keyframes dropUp {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cta-buttons {
          display: flex;
          align-items: center;
          gap: 20px;
          opacity: 0;
          animation: dropUp 0.8s ease-out 0.35s forwards;
        }

        .bookmark-btn {
          border: none;
          background: linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          color: #000; /* Contrast text for gold/orange */
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .bookmark-btn:hover {
          transform: scale(1.1);
          opacity: 0.9;
        }

        .discover-btn {
          border: none;
          background: linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%);
          height: 44px;
          border-radius: 22px;
          color: #000; /* Contrast text for gold/orange */
          padding: 0 28px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .discover-btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        /* Right column - Images */
        .image-column {
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: dropUp 0.75s ease 0.1s forwards;
        }

        .main-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          transition: transform 1s ease-in-out;
        }



        .main-image.active {
          transform: scale(1);
        }

        .main-image.next {
          transform: scale(1.1) translateX(100%);
        }

        .main-image.prev {
          transform: scale(1.1) translateX(-100%);
        }



        /* Controls */
        .controls {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          z-index: 20;
        }

        .arrow-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }

        .arrow-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          background: hsl(var(--background) / 0.6);
          backdrop-filter: blur(10px);
          color: hsl(var(--foreground));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .arrow-btn:hover {
          color: var(--slider-accent-bg);
          transform: scale(1.1);
          background: var(--slider-accent-soft);
        }

        .progress-bar-container {
          width: 240px;
          height: 4px;
          background-color: hsl(var(--foreground) / 0.15);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background-color: var(--slider-accent-bg);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .slide-counter {
          font-size: 20px;
          font-weight: bold;
          color: hsl(var(--foreground));
          min-width: 50px;
          text-align: center;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .navigation {
            padding: 12px 36px;
          }

          .navigation-inner {
            max-width: none;
          }

          .main-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
          }
          
          .content-column {
            padding: 100px 40px 40px;
          }
          
          .image-column {
            height: 50vh;
          }
          
          .controls {
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
          }

          .nav-menu {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .navigation {
            padding: 12px 18px;
          }

          .navigation-inner {
            gap: 12px;
          }
          
          .content-column {
            padding: 80px 20px 40px;
          }
          
          .main-title {
            font-size: clamp(36px, 10vw, 56px);
          }
          
          .description {
            font-size: 16px;
            margin-bottom: 32px;
          }
          

          
          .controls {
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            gap: 12px;
          }
          
          .progress-bar-container {
            width: 200px;
          }
          
          .arrow-btn {
            width: 48px;
            height: 48px;
          }

          .cta-buttons {
            flex-direction: row;
            align-items: center;
            gap: 16px;
          }

          .nav-brand {
            font-size: 16px;
          }

          .theme-toggle {
            gap: 4px;
            padding: 4px;
            margin-right: 0;
          }
          
          .theme-option {
            width: 30px;
            height: 30px;
          }

        }
      `}</style>

      {/* Navigation */}
      <nav className="navigation">
        <div className="navigation-inner">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <div className="nav-logo">
              <img src={isDarkMode ? "/h4.png" : "/g56.png"} alt="Solaris logo" />
            </div>
            <div>Solaris</div>
          </div>
          <div className="theme-toggle" role="group" aria-label="Select theme">
            {themeOptions.map(({ id, icon: Icon, label }) => {
              const isActive = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`theme-option ${isActive ? 'active' : ''}`}
                  aria-pressed={isActive}
                  aria-label={label}
                  onClick={() => setTheme(id)}
                >
                  <Icon aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        {/* Left Column - Content */}
        <div className="content-column" key={`content-column-${currentIndex}`}>
          <div className="place-tag" key={`place-${currentIndex}`}>
            {currentData.place}
          </div>

          <div className="main-title" key={`title-${currentIndex}`}>
            <div className="title-line">{currentData.title}</div>
            <div className="title-line">{currentData.title2}</div>
          </div>

          <div className="description" key={`desc-${currentIndex}`}>
            {currentData.description}
          </div>

          <div className="cta-buttons">
            <button className="bookmark-btn" onClick={() => handleCTA(currentData.ctaLink)}>
              <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="discover-btn" onClick={() => handleCTA(currentData.ctaLink)}>
              {currentData.cta}
            </button>
          </div>
        </div>

        {/* Right Column - Images */}
        <div className="image-column" key={`image-column-${currentIndex}`}>
          <div
            className="main-image active"
            style={{ backgroundImage: `url(${currentData.image})` }}
            key={`main-${currentIndex}`}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="arrow-controls">
          <button className="arrow-btn" onClick={prevSlide}>
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button className="arrow-btn" onClick={nextSlide}>
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div className="slide-counter">
            {String(currentIndex + 1).padStart(2, '0')}
          </div>
        </div>

        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SolarisSlider;
