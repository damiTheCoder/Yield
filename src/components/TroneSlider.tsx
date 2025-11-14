import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

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
    description: 'Trone redefines digital ownership with Liquidity-Funded Tokens (LFTs) — assets backed by real liquidity reserves. Every token launch creates sustainable value, not speculative bubbles.',
    image: '/d2.png',
    cta: 'Launch Console',
    ctaLink: '/assets'
  },
  {
    place: 'Creative Finance',
    title: 'CREATIVE',
    title2: 'LIQUIDITY',
    description: 'How DAOs, NFT studios, and LFT builders treat liquidity as a design medium. Turn hype into real value through liquidity-backed launches powered by Trone.',
    image: '/d3.png',
    cta: 'Read More',
    ctaLink: '/blog/creative-liquidity-web3'
  },
  {
    place: 'The Future',
    title: 'VALUE BACKED',
    title2: 'DIGITAL ASSETS',
    description: 'At Trone, we believe digital assets should hold their ground — not your hope. Creators earn sustainably. Holders get real value. The future is liquidity-backed.',
    image: '/d4.png',
    cta: 'Start Building',
    ctaLink: '/coin-tags'
  }
];

const TroneSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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

  return (
    <div className="trone-slider">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500&display=swap");
        
        .trone-slider {
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
        }

        /* Navigation */
        .navigation {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 20px 60px;
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
          color: #7A3BFF;
        }

        .nav-item.active::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 99px;
          background-color: #7A3BFF;
        }

        /* Theme Toggle */
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          background: hsl(var(--foreground) / 0.1);
          border: none;
          border-radius: 20px;
          padding: 4px;
          backdrop-filter: blur(10px);
          box-shadow: 0 12px 30px hsl(var(--foreground) / 0.15);
        }

        .theme-option {
          padding: 6px 10px;
          border-radius: 14px;
          color: hsl(var(--foreground));
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          background: transparent;
          border: none;
          outline: none;
          text-transform: capitalize;
        }

        .theme-option:hover {
          background: hsl(var(--foreground) / 0.15);
          transform: translateY(-1px);
        }

        .theme-option.active {
          background: #00ffa1;
          color: #000;
          box-shadow: 0 2px 8px rgba(0, 255, 161, 0.3);
        }

        /* Dark mode specific styling */
        [data-theme="dark"] .trone-slider .theme-toggle {
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
        }

        [data-theme="light"] .trone-slider .theme-toggle {
          background: rgba(15, 23, 42, 0.06);
          box-shadow: 0 15px 40px rgba(15, 23, 42, 0.08);
        }

        [data-theme="light"] .trone-slider .theme-option:hover {
          background: rgba(15, 23, 42, 0.08);
        }

        .launch-btn {
          background: #7A3BFF;
          color: white;
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
          background: #6a2ef0;
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
        }


        .place-tag {
          position: relative;
          font-size: 16px;
          margin-bottom: 32px;
          padding-top: 20px;
          color: #7A3BFF;
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
          background-color: #7A3BFF;
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
          color: #7A3BFF;
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
          animation: fadeInUp 0.8s ease-out 0.3s forwards;
          color: hsl(var(--foreground) / 0.8);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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
          animation: fadeInUp 0.8s ease-out 0.4s forwards;
        }

        .bookmark-btn {
          border: none;
          background-color: #7A3BFF;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .bookmark-btn:hover {
          transform: scale(1.1);
          background-color: #6a2ef0;
        }

        .discover-btn {
          border: none;
          background-color: #7A3BFF;
          height: 44px;
          border-radius: 22px;
          color: white;
          padding: 0 28px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .discover-btn:hover {
          background-color: #6a2ef0;
          color: white;
          transform: translateY(-2px);
        }

        /* Right column - Images */
        .image-column {
          position: relative;
          overflow: hidden;
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
          position: absolute;
          bottom: 40px;
          left: 60px;
          display: flex;
          align-items: center;
          gap: 24px;
          z-index: 20;
        }

        .arrow-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 1px solid hsl(var(--foreground) / 0.15);
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
          color: #7A3BFF;
          transform: scale(1.1);
          background: rgba(122, 59, 255, 0.1);
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
          background-color: #7A3BFF;
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
            padding: 16px 40px;
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
            left: 40px;
          }

          .nav-menu {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .navigation {
            padding: 16px 20px;
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
            left: 20px;
            gap: 16px;
          }
          
          .progress-bar-container {
            width: 150px;
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
            gap: 2px;
            padding: 3px;
            margin-right: 0;
          }
          
          .theme-option {
            padding: 4px 6px;
            font-size: 9px;
          }

        }
      `}</style>

      {/* Navigation */}
      <nav className="navigation">
        <div className="navigation-inner">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <div className="nav-logo">
              <img src="/OPY.png" alt="Trone logo" />
            </div>
            <div>Trone</div>
          </div>
          <div className="theme-toggle">
            <button 
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
            <button 
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
            <button 
              className={`theme-option ${theme === 'system' ? 'active' : ''}`}
              onClick={() => setTheme('system')}
            >
              System
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        {/* Left Column - Content */}
        <div className="content-column">
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
        <div className="image-column">
          <div 
            className="main-image active"
            style={{ backgroundImage: `url(${currentData.image})` }}
            key={`main-${currentIndex}`}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
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
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="slide-counter">
          {String(currentIndex + 1).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

export default TroneSlider;
