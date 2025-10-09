import { useEffect, useState } from "react";

export type Web3NewsItem = {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: Date;
};

const NEWS_ENDPOINT =
  "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=Blockchain";

let cachedNews: Web3NewsItem[] | null = null;
let cacheTimestamp = 0;
let inflightRequest: Promise<Web3NewsItem[]> | null = null;

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const REFRESH_INTERVAL = 1000 * 60 * 5; // auto refresh every 5 minutes
const STALE_THRESHOLD = 1000 * 60 * 60 * 24 * 7; // 7 days

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
        throw new Error(`Failed to load news: ${response.status}`);
      }
      const payload = await response.json();
      if (!payload?.Data || !Array.isArray(payload.Data)) {
        throw new Error("Unexpected response format");
      }

      const now = Date.now();
      const normalized = payload.Data.filter((item: any) => item?.title && item?.url)
        .map((item: any) => ({
          id: String(item.id ?? item.guid ?? item.url),
          title: String(item.title),
          url: String(item.url),
          imageUrl: String(item.imageurl || ""),
          source: String(item.source_info?.name || item.source || ""),
          publishedAt: new Date((item.published_on ?? 0) * 1000),
        }))
        .filter((item: Web3NewsItem) => {
          if (!item.imageUrl) return false;
          const source = item.source?.toLowerCase() ?? "";
          const isSupportedSource = source === "coindesk" || source === "techcrunch";
          if (!isSupportedSource) return false;
          return now - item.publishedAt.getTime() <= STALE_THRESHOLD;
        })
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

      cachedNews = normalized;
      cacheTimestamp = Date.now();
      return normalized;
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
