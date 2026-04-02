import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useWeb3News } from "@/hooks/useWeb3News";
import { cn } from "@/lib/utils";

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
  const { news, loading } = useWeb3News(3);

  const formatNewsTime = (date?: Date) => {
    if (!date) return "";
    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < hour) {
      return `${Math.max(1, Math.round(diff / minute))}m ago`;
    }
    if (diff < day) {
      return `${Math.max(1, Math.round(diff / hour))}h ago`;
    }
    return `${Math.max(1, Math.round(diff / day))}d ago`;
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">Library</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Latest thinking from Forge</h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Playbooks, experiments, and frameworks for building sustainable liquidity funded tokens.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Decrypt</p>
                  <h2 className="mt-2 text-xl font-semibold">Current Headlines</h2>
                </div>
                <a
                  href="https://decrypt.co/feed"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
                >
                  Source
                </a>
              </div>

              <div className="space-y-4">
                {(loading ? Array.from({ length: 3 }) : news ?? []).map((item, index) =>
                  item ? (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block overflow-hidden rounded-3xl border border-border/60 bg-surface/60 transition hover:-translate-y-0.5 hover:border-border hover:bg-surface/90"
                    >
                      <div className="relative h-40 overflow-hidden bg-muted">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
                          <span>{item.source}</span>
                          <span>{formatNewsTime(item.publishedAt)}</span>
                        </div>
                      </div>
                      <div className="space-y-2 p-4">
                        <h3 className="text-base font-semibold leading-snug text-foreground">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          <span>Open story</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div
                      key={`decrypt-loading-${index}`}
                      className="overflow-hidden rounded-3xl border border-border/60 bg-surface/60"
                    >
                      <div className="h-40 animate-pulse bg-muted" />
                      <div className="space-y-2 p-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-border/50" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-border/50" />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </aside>

            <div className="grid gap-4">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className={cn(
                    "group flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface/60 p-4 transition",
                    "hover:-translate-y-0.5 hover:border-border hover:bg-surface/90 sm:flex-row",
                  )}
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
      </div>
    </main>
  );
}
