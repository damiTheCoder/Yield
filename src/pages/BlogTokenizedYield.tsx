import { Link } from "react-router-dom";

const sections = [
  {
    heading: "Liquidity Is Being Rewritten for a New Era of Finance",
    body: [
      "In traditional markets, liquidity is the invisible force that keeps economies moving. It measures how efficiently an asset can be bought or sold without disrupting price.",
      "Inside Web3, liquidity is no longer passive. It is programmable, composable, and treated as a design surface for incentives, risk, and community engagement.",
      "USYC — a yield-bearing token issued by Circle International Bermuda Ltd. — is the clearest signal that traditional finance primitives can live natively on-chain. It blends fixed-income structure with blockchain reach, pointing toward a more fluid global capital stack.",
    ],
  },
  {
    heading: "What Exactly Is USYC?",
    body: [
      "USYC represents tokenized shares of a money market fund backed by short-duration U.S. Treasuries. Think of it as a conservative, income-generating instrument that lives on-chain.",
      "Unlike USDC, which maintains a flat 1:1 dollar peg without yield, USYC’s value steadily increases as the underlying Treasury assets produce returns. Holders get regulated exposure to Treasuries while staying inside blockchain ecosystems.",
    ],
  },
  {
    heading: "Why It Matters Beyond Crypto",
    bullets: [
      "Democratized access to fixed-income yield: compliant entities can tap institutional-grade Treasuries without legacy intermediaries.",
      "New safety rails for DeFi: protocols can anchor reserves to government-backed yield rather than synthetic incentives.",
      "Efficient treasury management: DAOs, funds, and corporates deploy idle cash through platforms like Circle’s Arc to earn regulated returns without leaving Web3 rails.",
    ],
  },
  {
    heading: "The Peg: From Fixed to Floating Stability",
    body: [
      "Stablecoins usually target a strict $1 peg. USYC tracks the Net Asset Value (NAV) of its Treasury fund, so the peg floats as yield accrues.",
      "Each USYC equals one fund share. If annual Treasury yields hover around 5%, the NAV could move from $1.00 to $1.05 over twelve months. The token stays stable because it is collateralized by government securities, yet it remains productive.",
    ],
  },
  {
    heading: "Why Circle Issued It from Bermuda",
    body: [
      "Yield-bearing products are treated as investment instruments, not payment tokens. Issuing USYC via Circle International Bermuda Ltd. lets Circle serve institutional and global DeFi participants while respecting regulatory boundaries.",
      "It marries compliant yield with the transparency and speed of Web3 infrastructure — a blueprint for future regulated tokenized yields.",
    ],
  },
  {
    heading: "Liquidity as a Financial and Creative Tool",
    body: [
      "In traditional finance, liquidity sits idle on balance sheets. In tokenized markets, liquidity is active — earning yield automatically, moving across protocols instantly, and serving as collateral or settlement capital on demand.",
      "Designers can express strategy directly through liquidity flows, aligning capital with network behavior.",
    ],
  },
  {
    heading: "The Convergence of TradFi and DeFi",
    body: [
      "USYC embodies the synthesis between traditional finance (yield, trust, compliance) and decentralized finance (transparency, efficiency, programmability).",
      "Together they create programmable liquidity — stable, secure, and yield-bearing. This hints at a digitized global capital stack where Treasuries, credit, and other instruments become interoperable infrastructure.",
    ],
  },
  {
    heading: "The Future: Yield as Infrastructure",
    body: [
      "The creative use of liquidity marks a profound shift. Capital is no longer idle; it is an active component of system design.",
      "USYC proves liquidity can earn while it moves, and that yield can be as programmable as code. Liquidity isn’t leaving finance — it is evolving into its most efficient form.",
    ],
  },
];

export default function BlogTokenizedYield() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <article className="container mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span>Liquidity Futures</span>
            <span>August 2, 2024 · 8 min read</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Reimagining Liquidity: How Tokenized Yield Is Bridging Traditional Finance and Web3
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Liquidity is being rewritten for a programmable era. Tokenized yield products like USYC bring the reliability of Treasuries to Web3,
            proving that capital can be compliant, composable, and creative all at once.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[30px] border border-border/60 aspect-[16/9]">
          <img
            src="/d5.png"
            alt="Abstract finance shapes representing tokenized liquidity"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">{section.heading}</h2>
              {section.body?.map((paragraph) => (
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
            </section>
          ))}
        </div>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Discussion & Further Reading</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Liquidity is no longer the quiet accounting line it once was. It is a living instrument that connects markets, communities, and
            protocols. Builders that weave real-world yield into decentralized playbooks will define the next decade of finance.
          </p>
        </section>

        <div className="mt-12 flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface/50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">Build with confidence</p>
            <h3 className="text-xl font-semibold">Route real yield through Forge rails</h3>
            <p className="text-sm text-muted-foreground">
              Pair tokenized Treasuries with your launch. We’ll help you plan compliance, analytics, and the liquidity design that keeps holders engaged.
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
