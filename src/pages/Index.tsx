import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const onboardingScreens = [
  {
    id: 1,
    badge: "WHAT ARE LFTs?",
    title: "A Revolutionary Digital Asset Class",
    description: "Liquidity Funded Tokens (LFTs) represent a groundbreaking new category of digital assets—combining the collectibility of NFTs, the liquidity backing of bonds, and the engagement mechanics of skill-based gaming. Unlike anything you've seen before.",
    image: "/_ (14).jpeg",
  },
  {
    id: 2,
    badge: "THE PROBLEM",
    title: "Traditional Digital Assets Are Broken",
    description: "Meme coins crash to zero overnight. NFTs have no guaranteed value—you could lose everything. Standard tokens promise utility that never materializes. All suffer from one fatal flaw: no intrinsic value floor and no sustainable growth mechanism.",
    image: "/k1.jpeg",
  },
  {
    id: 3,
    badge: "LFTs VS TRADITIONAL ASSETS",
    title: "LFTs: Backed by Real Liquidity from Day One",
    description: "While stocks represent company ownership and bonds represent debt, LFTs represent redeemable liquidity reserves that grow in real-time. Every token is backed by locked funds—your floor value can only go up, never down during active cycles.",
    image: "/_ (17).jpeg",
  },
  {
    id: 4,
    badge: "THE INNOVATION",
    title: "Self-Appreciating Liquidity That Grows Automatically",
    description: "Here's the magic: 10% of every purchase flows directly into the liquidity pool. If you discover an LFT early and hold it, you literally watch your guaranteed redemption value increase as others join the hunt. No action required—just hold and appreciate.",
    image: "/k2.jpeg",
  },
  {
    id: 5,
    badge: "HOW IT WORKS",
    title: "Step 1: Creator Locks Initial Liquidity",
    description: "An artist or developer locks real funds ($10,000) to create 100 LFTs. Each starts with a base Liquidity Per Unit (LPU) of $100. These reserves are verifiable on-chain and cannot be withdrawn—guaranteed backing from launch.",
    image: "/_ (18).jpeg",
  },
  {
    id: 6,
    badge: "HOW IT WORKS",
    title: "Step 2: Hunt and Discover Through Skill",
    description: "LFTs are hidden across an interactive coordinate grid. Purchase CoinTags ($25 each) or earn them free through content creation, social sharing, and challenges. Use strategy, community hints, and creator clues to discover hidden tokens. It's treasure hunting meets digital collecting.",
    image: "/k3.jpeg",
  },
  {
    id: 7,
    badge: "HOW IT WORKS",
    title: "Step 3: Watch Your Value Grow in Real-Time",
    description: "As the community hunts, 10% of every CoinTag purchase tops up the liquidity pool. Early discoverers at $100 LPU watch it climb to $107, $115, $125 as activity increases. Your asset literally appreciates while you hold it—backed by real, locked liquidity.",
    image: "/_ (19).jpeg",
  },
  {
    id: 8,
    badge: "HOW IT WORKS",
    title: "Step 4: Redeem or Hold for Passive Income",
    description: "Exchange your LFT for current LPU value anytime—guaranteed redemption. Or keep holding to earn 5% of all ongoing CoinTag revenue as passive rewards. Plus, holders benefit as others redeem (fewer LFTs = higher LPU for remaining holders).",
    image: "/k5.jpeg",
  },
  {
    id: 9,
    badge: "SUSTAINABLE ECONOMICS",
    title: "Revenue Model That Benefits Everyone",
    description: "From each $25 CoinTag: 50% to creators (sustainable income), 20% seeds next cycle (compounding growth), 15% platform operations, 10% current liquidity pool (your appreciation), 5% holder rewards (passive income). Transparent, sustainable, aligned.",
    image: "/k6.jpeg",
  },
  {
    id: 10,
    badge: "SELF-REINFORCING CYCLES",
    title: "Each Cycle Launches Stronger Than the Last",
    description: "Cycle 1 starts at $10,000 liquidity. Activity generates $1,500 reserve for Cycle 2, which launches at $11,500 (+15% larger). Cycle 3 at $13,300. The ecosystem compounds strength without requiring exponential user growth—built for long-term sustainability.",
    image: "/alios.jpeg",
  },
  {
    id: 11,
    badge: "WHY THIS MATTERS",
    title: "The Future of Value-Backed Digital Assets",
    description: "LFTs solve the core problem plaguing digital assets: no guaranteed value. Your tokens can't go to zero. Creators earn sustainable income. Holders get passive rewards. Community activity benefits everyone. It's not speculation—it's mathematical, guaranteed appreciation from ecosystem engagement.",
    image: "/Mr_Booo - Collection _ OpenSea.jpeg",
  },
  {
    id: 12,
    badge: "GET STARTED",
    title: "Join the LFT Revolution Today",
    description: "Transform digital ownership forever. Discover value-backed tokens through skill-based treasure hunts. Watch your assets appreciate in real-time. Earn passive rewards. Build sustainable communities. This is the future—where skill meets value, and everyone wins.",
    image: "/doodles.jpeg",
  },
];

export default function Index() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll reveal effect for desktop
  useEffect(() => {
    if (isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '-50px'
      }
    );

    const sections = document.querySelectorAll('.scroll-reveal');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [isMobile]);

  const handleNext = () => {
    if (currentScreen < onboardingScreens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      navigate("/assets");
    }
  };

  const handlePrev = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSkip = () => {
    navigate("/assets");
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentScreen < onboardingScreens.length - 1) {
      handleNext();
    }
    if (isRightSwipe && currentScreen > 0) {
      handlePrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const currentData = onboardingScreens[currentScreen];

  // Mobile layout (scrollable landing page)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        {/* Fixed Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="text-base font-semibold">Yield</div>
            <Button
              onClick={handleSkip}
              size="sm"
            >
              Start Hunting
            </Button>
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="w-full">
          {onboardingScreens.map((screen, index) => (
            <section 
              key={screen.id} 
              className="min-h-screen flex flex-col justify-center px-6 py-12"
            >
              {/* Text content */}
              <div className="space-y-4 mb-8">
                <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {screen.badge}
                </Badge>

                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {screen.title}
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {screen.description}
                </p>
              </div>

              {/* Image */}
              <div className="w-full flex items-center justify-center">
                <div className="relative w-full h-[300px] sm:h-[350px] flex items-center justify-center">
                  {/* Gradient glow effect behind image */}
                  <div className="absolute inset-0 rounded-3xl blur-3xl opacity-40" 
                    style={{
                      background: `radial-gradient(circle at center, 
                        hsl(${index * 30}, 70%, 50%) 0%, 
                        hsl(${index * 30 + 60}, 60%, 45%) 50%, 
                        transparent 70%)`
                    }}
                  />
                  <img
                    src={screen.image}
                    alt={screen.title}
                    className="relative w-full h-full object-cover drop-shadow-2xl rounded-3xl z-10"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="py-12 px-6 bg-background/50">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Ready to Start Your Journey?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Join the LFT revolution and discover value-backed digital assets today.
            </p>
            <Button 
              onClick={handleSkip}
              size="lg"
              className="w-full sm:w-auto"
            >
              Explore Assets Now
            </Button>
          </div>
        </div>

        {/* Professional Footer */}
        <footer className="border-t border-border bg-background">
          <div className="px-6 py-8">
            {/* Social Icons */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Telegram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.961 9.247-2.768 12.273-.342 1.281-.682 1.71-1.118 1.751-.95.087-1.672-.628-2.593-1.23-1.438-.943-2.25-1.53-3.643-2.45-1.609-1.063-.566-1.647.351-2.602.24-.25 4.41-4.041 4.49-4.384.01-.042.02-.2-.075-.283-.095-.084-.235-.056-.336-.033-.143.032-2.415 1.534-6.82 4.506-.646.445-1.23.662-1.754.651-.577-.013-1.688-.327-2.513-.595-.999-.33-1.788-.504-1.718-1.067.036-.293.431-.593 1.184-.9 4.645-2.025 7.742-3.36 9.291-4.008 4.422-1.854 5.342-2.177 5.941-2.187.132-.002.427.03.619.186.162.131.206.307.227.431.021.124.048.407.027.629z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Discord">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="X (Twitter)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Reddit">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </a>
            </div>

            {/* Disclaimer */}
            <div className="border-t border-border pt-6 pb-4">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                <strong className="text-foreground">Disclaimer:</strong> Nothing on this site is investment advice. All information is for informational purposes only. All images displayed on this platform are used for illustrative purposes only and do not belong to us. All intellectual property rights remain with their respective owners. Nothing contained on our site constitutes a solicitation, recommendation, endorsement, or offer by Forge Art Hub or any third party service provider to buy or sell any assets, digital coins and tokens, securities or other financial instruments in this or in any other jurisdiction. Please view our{" "}
                <button className="underline hover:text-foreground transition-colors">Terms of Use</button> for more information.
              </p>
            </div>

            {/* Copyright */}
            <div className="text-center text-xs text-muted-foreground pt-4">
              © {new Date().getFullYear()} Forge Art Hub. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Desktop layout (scrollable landing page with all sections)
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex justify-between items-center px-12 py-4">
          <div className="text-lg font-semibold">Liquidity Funded Tokens</div>
          <Button
            onClick={handleSkip}
            size="lg"
          >
            Start Hunting
          </Button>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="w-full">
        {onboardingScreens.map((screen, index) => {
          const isEven = index % 2 === 0;
          return (
            <section 
              key={screen.id} 
              className="min-h-screen flex items-center justify-center px-12 py-20 scroll-reveal"
              data-index={index}
            >
              <div className={`w-full max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center`}>
                {/* Content section */}
                <div 
                  className={`space-y-6 ${!isEven ? 'order-2' : 'order-1'} scroll-content`}
                >
                  <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
                    {screen.badge}
                  </Badge>

                  <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                    {screen.title}
                  </h1>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {screen.description}
                  </p>
                </div>

                {/* Image section */}
                <div 
                  className={`flex items-center justify-center ${!isEven ? 'order-1' : 'order-2'} scroll-image`}
                >
                  <div className="relative w-full h-[500px] flex items-center justify-center">
                    {/* Gradient glow effect behind image */}
                    <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30" 
                      style={{
                        background: `radial-gradient(circle at center, 
                          hsl(${index * 30}, 70%, 50%) 0%, 
                          hsl(${index * 30 + 60}, 60%, 45%) 50%, 
                          transparent 70%)`
                      }}
                    />
                    <img
                      src={screen.image}
                      alt={screen.title}
                      className="relative w-full h-full object-cover drop-shadow-2xl rounded-3xl z-10"
                    />
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Add CSS for scroll animations */}
      <style>{`
        @keyframes slideUpContent {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUpImage {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scroll-content {
          opacity: 0;
          transform: translateY(40px);
        }

        .scroll-image {
          opacity: 0;
          transform: translateY(60px);
        }

        .scroll-reveal.in-view .scroll-content {
          animation: slideUpContent 0.7s ease-out forwards;
          animation-delay: 0.1s;
        }

        .scroll-reveal.in-view .scroll-image {
          animation: slideUpImage 0.8s ease-out forwards;
          animation-delay: 0.3s;
        }

        /* Make first section visible immediately */
        .scroll-reveal:first-of-type .scroll-content,
        .scroll-reveal:first-of-type .scroll-image {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Footer CTA */}
      <div className="py-20 px-12 bg-background/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-foreground">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join the LFT revolution and discover value-backed digital assets today.
          </p>
          <Button 
            onClick={handleSkip}
            size="lg"
            className="text-lg px-8 py-6"
          >
            Explore Assets Now
          </Button>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-12 py-8">
          {/* Social Icons */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Telegram">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.961 9.247-2.768 12.273-.342 1.281-.682 1.71-1.118 1.751-.95.087-1.672-.628-2.593-1.23-1.438-.943-2.25-1.53-3.643-2.45-1.609-1.063-.566-1.647.351-2.602.24-.25 4.41-4.041 4.49-4.384.01-.042.02-.2-.075-.283-.095-.084-.235-.056-.336-.033-.143.032-2.415 1.534-6.82 4.506-.646.445-1.23.662-1.754.651-.577-.013-1.688-.327-2.513-.595-.999-.33-1.788-.504-1.718-1.067.036-.293.431-.593 1.184-.9 4.645-2.025 7.742-3.36 9.291-4.008 4.422-1.854 5.342-2.177 5.941-2.187.132-.002.427.03.619.186.162.131.206.307.227.431.021.124.048.407.027.629z"/>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Discord">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="X (Twitter)">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Reddit">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
            </a>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-border pt-6 pb-4">
            <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-4xl mx-auto">
              <strong className="text-foreground">Disclaimer:</strong> Nothing on this site is investment advice. All information is for informational purposes only. All images displayed on this platform are used for illustrative purposes only and do not belong to us. All intellectual property rights remain with their respective owners. Nothing contained on our site constitutes a solicitation, recommendation, endorsement, or offer by Forge Art Hub or any third party service provider to buy or sell any assets, digital coins and tokens, securities or other financial instruments in this or in any other jurisdiction. Please view our{" "}
              <button className="underline hover:text-foreground transition-colors">Terms of Use</button> for more information.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            © {new Date().getFullYear()} Forge Art Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
