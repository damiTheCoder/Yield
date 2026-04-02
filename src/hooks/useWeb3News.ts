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
  status?: string;
  items?: Array<{
    guid?: string;
    title?: string;
    link?: string;
    thumbnail?: string;
    enclosure?: {
      link?: string;
      thumbnail?: string;
    };
    pubDate?: string;
  }>;
}

const NEWS_ENDPOINT =
  "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fdecrypt.co%2Ffeed";

let cachedNews: Web3NewsItem[] | null = null;
let cacheTimestamp = 0;
let inflightRequest: Promise<Web3NewsItem[]> | null = null;

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const REFRESH_INTERVAL = 1000 * 60 * 5; // auto refresh every 5 minutes

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
        return cacheNews([]);
      }
      const payload = (await response.json()) as RawDecryptNewsResponse;
      if (payload?.status !== "ok" || !Array.isArray(payload.items)) {
        return cacheNews([]);
      }

      const normalized = payload.items
        .map((item, index) => ({
          id: item.guid || item.link || `decrypt-${index}`,
          title: item.title ?? "",
          url: item.link ?? "",
          imageUrl: item.enclosure?.thumbnail || item.thumbnail || item.enclosure?.link || "",
          source: "Decrypt",
          publishedAt: new Date(item.pubDate ?? ""),
        }))
        .filter((item: Web3NewsItem) => {
          if (!item.title || !item.url) return false;
          if (!item.imageUrl) return false;
          if (Number.isNaN(item.publishedAt.getTime())) return false;
          return true;
        })
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

      return cacheNews(normalized);
    })
    .catch(() => {
      return cacheNews([]);
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
            setError(null);
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
