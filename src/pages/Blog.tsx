import { Link } from "react-router-dom";

const posts = [
  {
    slug: "tokenized-yield-liquidity",
    title: "Reimagining Liquidity: How Tokenized Yield Is Bridging Traditional Finance and Web3",
    description:
      "Why USYC and tokenized Treasuries signal programmable liquidity for institutions, DAOs, and DeFi protocols alike.",
    readTime: "8 min read",
    date: "August 2, 2024",
    tag: "Liquidity Futures",
    image: "/d5.png",
  },
  {
    slug: "creative-liquidity-web3",
    title: "The Creative Use of Liquidity in the Web3 Space",
    description:
      "Liquidity is now a design language for DAOs, NFT studios, and token projects—here’s how teams use it as a creative medium.",
    readTime: "7 min read",
    date: "July 9, 2024",
    tag: "Liquidity Futures",
    image: "/d3.png",
  },
  {
    slug: "liquidity-funded-tokens",
    title: "Liquidity Funded Tokens (LFTs): Turning Hype Into Durable Value",
    description:
      "A deep dive into how Solaris’s liquidity-backed launch model keeps communities engaged long after the mint frenzy fades.",
    readTime: "6 min read",
    date: "May 21, 2024",
    tag: "LFT Playbook",
    image: "/d1.png",
  },
];

export default function Blog() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Library</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Latest thinking from Forge</h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Playbooks, experiments, and frameworks for building sustainable liquidity funded tokens.
            </p>
          </div>

          <div className="grid gap-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface/60 p-4 transition hover:-translate-y-0.5 hover:border-border hover:bg-surface/90 sm:flex-row"
              >
                <div className="overflow-hidden rounded-2xl bg-muted sm:w-1/3">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary/70">
                    <span>{post.tag}</span>
                    <span className="text-muted-foreground tracking-normal">{post.date}</span>
                  </div>
                  <h2 className="text-xl font-semibold leading-snug sm:text-2xl">{post.title}</h2>
                  <p className="text-sm text-muted-foreground">{post.description}</p>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <span>{post.readTime}</span>
                    <span aria-hidden="true">•</span>
                    <span className="text-primary group-hover:text-white">Read article →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
