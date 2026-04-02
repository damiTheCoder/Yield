import { useEffect, useState } from "react";

export type Web3NewsItem = {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: Date;
};

interface RawDecryptNewsResponse {
  contents?: string;
}

const NEWS_ENDPOINT =
  "https://api.allorigins.win/get?url=https%3A%2F%2Fdecrypt.co%2Ffeed";

let cachedNews: Web3NewsItem[] | null = null;
let cacheTimestamp = 0;
let inflightRequest: Promise<Web3NewsItem[]> | null = null;

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const REFRESH_INTERVAL = 1000 * 60 * 5; // auto refresh every 5 minutes
const STALE_THRESHOLD = 1000 * 60 * 60 * 24 * 7; // 7 days

const FALLBACK_NEWS: Web3NewsItem[] = [
  {
    id: "fallback-tokenized-yield",
    title: "Reimagining Liquidity: How Tokenized Yield Is Bridging TradFi and Web3",
    url: "/blog/tokenized-yield-liquidity",
    imageUrl: "/d5.png",
    source: "Solaris Research",
    publishedAt: new Date("2024-08-02T00:00:00.000Z"),
  },
  {
    id: "fallback-lft-future",
    title: "Liquidity Funded Tokens (LFTs): The Future of Sustainable Digital Assets",
    url: "/blog/liquidity-funded-tokens",
    imageUrl: "/d1.png",
    source: "Solaris Research",
    publishedAt: new Date("2024-05-21T00:00:00.000Z"),
  },
  {
    id: "fallback-creative-liquidity",
    title: "The Creative Use of Liquidity in the Web3 Space",
    url: "/blog/creative-liquidity-web3",
    imageUrl: "/d3.png",
    source: "Solaris Research",
    publishedAt: new Date("2024-07-09T00:00:00.000Z"),
  },
];

function cacheNews(items: Web3NewsItem[]) {
  cachedNews = items;
  cacheTimestamp = Date.now();
  return items;
}

async function fetchWeb3News(forceRefresh = false): Promise<Web3NewsItem[]> {
  if (!forceRefresh && cachedNews && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedNews;
  }

  if (!forceRefresh && inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = fetch(NEWS_ENDPOINT)
    .then(async (response) => {
      if (!response.ok) {
        return cacheNews(FALLBACK_NEWS);
      }
      const payload = (await response.json()) as RawDecryptNewsResponse;
      if (!payload?.contents) {
        return cacheNews(FALLBACK_NEWS);
      }

      const parser = new DOMParser();
      const xml = parser.parseFromString(payload.contents, "application/xml");
      const xmlError = xml.querySelector("parsererror");
      if (xmlError) {
        return cacheNews(FALLBACK_NEWS);
      }

      const now = Date.now();
      const normalized = Array.from(xml.querySelectorAll("item"))
        .map((itemNode, index) => {
          const title = itemNode.querySelector("title")?.textContent?.trim() ?? "";
          const link = itemNode.querySelector("link")?.textContent?.trim() ?? "";
          const guid = itemNode.querySelector("guid")?.textContent?.trim() || link || `decrypt-${index}`;
          const pubDate = itemNode.querySelector("pubDate")?.textContent?.trim() ?? "";
          const mediaThumbnail = itemNode.getElementsByTagName("media:thumbnail")[0]?.getAttribute("url") ?? "";
          const enclosure = itemNode.getElementsByTagName("enclosure")[0]?.getAttribute("url") ?? "";

          return {
            id: guid,
            title,
            url: link,
            imageUrl: mediaThumbnail || enclosure,
            source: "Decrypt",
            publishedAt: new Date(pubDate),
          };
        })
        .filter((item: Web3NewsItem) => {
          if (!item.title || !item.url) return false;
          if (!item.imageUrl) return false;
          if (Number.isNaN(item.publishedAt.getTime())) return false;
          return now - item.publishedAt.getTime() <= STALE_THRESHOLD;
        })
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

      return cacheNews(normalized.length > 0 ? normalized : FALLBACK_NEWS);
    })
    .catch(() => {
      return cacheNews(FALLBACK_NEWS);
    })
    .finally(() => {
      inflightRequest = null;
    });

  return inflightRequest;
}

export function useWeb3News(limit?: number) {
  const initialNews = cachedNews
    ? limit !== undefined
      ? cachedNews.slice(0, limit)
      : cachedNews
    : null;

  const [news, setNews] = useState<Web3NewsItem[] | null>(initialNews);
  const [loading, setLoading] = useState(!cachedNews);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = (force = false) => {
      fetchWeb3News(force)
        .then((items) => {
          if (!cancelled) {
            const next = limit !== undefined ? items.slice(0, limit) : items;
            setNews(next);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Unable to load news");
            setLoading(false);
          }
        });
    };

    load();
    const interval = setInterval(() => load(true), REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [limit]);

  return { news, loading, error };
}
