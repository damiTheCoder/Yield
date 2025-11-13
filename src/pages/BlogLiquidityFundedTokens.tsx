import { Link } from "react-router-dom";

const sections = [
  {
    heading: "What Makes LFTs Different?",
    copy: [
      "Liquidity Funded Tokens flip the script on speculative launches. Instead of selling vibes and hoping a secondary market materializes, each mint automatically routes a percentage into a shared liquidity pool. Holders can always exit against provable liquidity, so price discovery reflects real demand rather than thin order books.",
    ],
  },
  {
    heading: "Designed for Sustainable Communities",
    copy: [
      "When liquidity is locked alongside every mint, teams can focus on utility, not floor price management. Creators can program yields, revenue shares, or gated experiences on top of that base liquidity, ensuring the token keeps doing work for collectors long after the drop.",
      "Communities also benefit from transparent runway. They can see, on-chain, how much liquidity backs the project, making it easier to vote on new features, treasury deployments, or collaborations without blind trust.",
    ],
  },
  {
    heading: "How the Trone Launch Rails Work",
    copy: [
      "Trone’s market maker vault automates the entire process. Launch teams configure the mint price, the liquidity split, and the bonding curve shape. As collectors mint, liquidity is paired with the project’s token and deployed into pools across the supported venues.",
      "Because everything is automated, teams don’t need a quant desk to coordinate listings. They get instant markets with transparent fees, plus dashboards that surface health metrics like reserve depth, holder concentration, and daily volume.",
    ],
  },
  {
    heading: "Why Liquidity Matters Now",
    copy: [
      "NFTs proved that culture can be tokenized, but they also showed how fragile creator economies become without liquidity. LFTs keep the energy from that era, while adding the guard rails institutional treasuries now demand: predictable exits, verifiable collateral, and programmable revenue splits.",
      "The next wave of consumer crypto will be built on primitives that feel fun but behave responsibly. LFTs give teams both, enabling fandom-backed treasuries that can power merch, events, and shared upside without the exhaustion of constant relaunches.",
    ],
  },
];

export default function BlogLiquidityFundedTokens() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <article className="container mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span>LFT Playbook</span>
            <span>May 21, 2024 · 6 min read</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Liquidity Funded Tokens (LFTs): The Future of Sustainable Digital Assets
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Powered by Trone — a blueprint for shipping tokens that stay liquid, reward true believers, and keep runway on-chain.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[30px] border border-border/60">
          <img src="/d1.png" alt="Colorful characters surrounding the LFT brand" className="w-full object-cover" />
        </div>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            Every cycle in crypto starts with storytelling. LFTs make sure the story has capital behind it. By tying liquidity to each mint,
            teams never have to pray for market makers or plead for centralized exchange listings. Liquidity is the product.
          </p>
          <p>
            That simple shift unlocks better behavior: communities can exit without nuking the chart, treasuries can plan years out, and
            creators can experiment with new perks knowing the floor is supported by actual reserves.
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.copy.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface/50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">Go deeper</p>
            <h3 className="text-xl font-semibold">Build your first LFT with Forge</h3>
            <p className="text-sm text-muted-foreground">
              Tap into Trone’s liquidity rails, analytics, and launch partners. We’ll help design the curve, utility, and post-launch plan.
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
