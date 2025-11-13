import { Link } from "react-router-dom";

const sections = [
  {
    heading: "Liquidity as a Design Primitive",
    paragraphs: [
      "In Web3, liquidity moved from a background mechanic to a visible product surface. Teams design pools like they would design UI, because the way capital flows determines how people feel while using the protocol.",
    ],
    bullets: [
      "Align incentives by routing emissions to early stakers or LPs.",
      "Shape access by gating mints, governance, or community tiers with minimum liquidity positions.",
      "Signal trust through deep, transparent reserves that communicate protocol health at a glance.",
    ],
    closing:
      "Uniswap, Curve, and the rest of DeFi summer made market making collaborative. That participatory model created a new \"liquidity UX\"—one where users co-create value every time they deposit.",
  },
  {
    heading: "NFTs and the Rise of Liquid Creativity",
    paragraphs: [
      "Fractionalized NFTs turned 1-of-1 art into composable markets. Now holders can trade exposure to culture itself, not just the original mint.",
      "Liquidity-backed NFTs push this further. By embedding reserves directly into the asset, creators give collectors a softer landing and a clearer sense of intrinsic value.",
    ],
  },
  {
    heading: "Liquidity-Backed Tokens (LFTs): The Next Evolution",
    paragraphs: [
      "Minting against liquidity pools ensures every token is tradable from day one. Holders don’t fear illiquid cliffs, and teams don’t have to negotiate OTC deals to unlock markets.",
    ],
    bullets: [
      "Instant tradability so communities never face the \"no buyer\" problem.",
      "Price resilience thanks to buffers that absorb volatility spikes.",
      "Organic growth driven by real capital flows instead of paid hype.",
    ],
    closing:
      "Projects like Reccur treat liquidity itself as lore—something that reinforces trust, unlocks new utilities, and lays the groundwork for community-owned market infrastructure.",
  },
  {
    heading: "The Culture of Liquid Communities",
    paragraphs: [
      "DAOs increasingly wire liquidity pools into their governance fabric. Participation isn’t just about forum threads; it’s about staking resources to steer the collective.",
      "Creative groups now tokenize access, merch, or IP. Members can join or exit without destabilizing everyone else because the liquidity layer absorbs churn.",
    ],
  },
  {
    heading: "Toward a Liquid Future",
    paragraphs: [
      "As Web3 matures, the most interesting builders treat liquidity like clay. They sculpt behaviors, narratives, and monetization models with it.",
      "Liquidity becomes both the canvas and the paint—an expressive medium that blurs finance, fandom, and ownership.",
    ],
  },
];

export default function BlogCreativeLiquidity() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <article className="container mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span>Liquidity Futures</span>
            <span>July 9, 2024 · 7 min read</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">The Creative Use of Liquidity in the Web3 Space</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Liquidity is no longer just a risk metric. In decentralized culture, it is the new creative medium—fuel for protocols, tokens,
            and communities that want to stay fluid without losing intent.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[30px] border border-border/60">
          <img src="/d3.png" alt="Vibrant gradient collage representing liquidity creativity" className="w-full object-cover" />
        </div>

        <section className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
          <h2 className="text-2xl font-semibold text-foreground">Introduction: Liquidity as the New Creative Medium</h2>
          <p>
            Traditional markets define liquidity as the ease of buying or selling without crushing price. Web3 expands that definition.
            Liquidity becomes programmable energy—powering governance, creator economies, and entirely new incentive loops.
          </p>
          <p>
            From NFTs with embedded yield to dynamic AMMs that remix token behavior in real time, liquidity now acts as a design layer. It
            shapes how users participate, how treasuries plan, and how stories spread.
          </p>
        </section>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">{section.heading}</h3>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="list-disc space-y-2 pl-5 text-base text-muted-foreground">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
              {section.closing && (
                <p className="text-base leading-relaxed text-muted-foreground">
                  {section.closing}
                </p>
              )}
            </section>
          ))}
        </div>

        <section className="mt-10 space-y-4">
          <h3 className="text-2xl font-semibold text-foreground">Closing Thought</h3>
          <p className="text-base leading-relaxed text-muted-foreground">
            Liquidity is no longer just about moving money—it’s about moving meaning. In the creative Web3 economy, liquidity is both the
            medium and the message, shaping how value is created, shared, and sustained.
          </p>
        </section>

        <div className="mt-12 flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface/50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">Build with us</p>
            <h3 className="text-xl font-semibold">Prototype liquid experiences on Forge</h3>
            <p className="text-sm text-muted-foreground">
              Pair your next drop or DAO with liquidity rails, analytics, and growth partners. We’ll help you design the curve and the story.
            </p>
          </div>
          <Link
            to="/assets"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Explore Launchpad →
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link to="/blog" className="text-sm font-semibold text-primary hover:text-primary/80">
            ← Back to all posts
          </Link>
        </div>
      </article>
    </main>
  );
}
