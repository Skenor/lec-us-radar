import { useState, useEffect } from "react";
import {
  fallbackLecNews,
  fallbackMarketNews,
  fallbackCompetitorNews,
} from "../data/fallbackData";

const NEWS_KEY = import.meta.env.VITE_NEWS_API_KEY;

async function newsFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
    const data = await res.json();
    if (data.status === "error") {
      const err = new Error(data.message || data.code);
      err.fatal = data.code === "apiKeyInvalid" || data.code === "apiKeyExhausted";
      throw err;
    }
    return data.articles || [];
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") {
      console.log("⏱ useNewsApi: timeout after 8s, using fallback");
    } else {
      console.log(`❌ useNewsApi: ${e.message}, using fallback`);
    }
    throw e;
  }
}

function parseArticles(raw, category) {
  const seen = new Set();
  return raw
    .filter((a) => {
      if (!a.title || a.title.includes("[Removed]")) return false;
      if (a.description == null || a.url == null) return false;
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    })
    .map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.urlToImage || null,
      publishedAt: a.publishedAt,
      source: a.source,
      category,
    }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function buildTopStories(lec, market, competitor) {
  return [...lec, ...market, ...competitor]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 3);
}

export function useNewsApi() {
  const [lecNews, setLecNews] = useState(fallbackLecNews);
  const [marketNews, setMarketNews] = useState(fallbackMarketNews);
  const [competitorNews, setCompetitorNews] = useState(fallbackCompetitorNews);
  const [topStories, setTopStories] = useState(() =>
    buildTopStories(fallbackLecNews, fallbackMarketNews, fallbackCompetitorNews)
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!NEWS_KEY) return;
    let cancelled = false;
    const isRefresh = refreshKey > 0;

    if (isRefresh) setRefreshing(true);

    async function load() {
      const [res1, res2, res3] = await Promise.allSettled([
        newsFetch(
          `https://newsapi.org/v2/everything?q="LEC gelato"+OR+"LEC ice cream"+OR+"Leclerc gelato brand"+OR+"Federico Grom LEC"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_KEY}`
        ),
        newsFetch(
          `https://newsapi.org/v2/everything?q="low calorie ice cream"+OR+"healthy gelato"+OR+"low calorie gelato"+OR+"guilt free ice cream"&language=en&sortBy=relevancy&pageSize=10&apiKey=${NEWS_KEY}`
        ),
        newsFetch(
          `https://newsapi.org/v2/everything?q="Halo Top"+OR+"Enlightened ice cream"+OR+"Nick's ice cream"+OR+"healthy frozen dessert USA"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_KEY}`
        ),
      ]);

      if (cancelled) return;

      // Abort on fatal key errors
      for (const r of [res1, res2, res3]) {
        if (r.status === "rejected" && r.reason?.fatal) {
          if (isRefresh) setRefreshing(false);
          return;
        }
      }

      const rawLec        = res1.status === "fulfilled" ? res1.value : [];
      const rawMarket     = res2.status === "fulfilled" ? res2.value : [];
      const rawCompetitor = res3.status === "fulfilled" ? res3.value : [];

      const lec        = parseArticles(rawLec, "lec").slice(0, 4);
      const market     = parseArticles(rawMarket, "market").slice(0, 6);
      const competitor = parseArticles(rawCompetitor, "competitor").slice(0, 4);

      const anyLive = lec.length > 0 || market.length > 0 || competitor.length > 0;

      if (anyLive) {
        setLecNews(lec.length ? lec : fallbackLecNews);
        setMarketNews(market.length ? market : fallbackMarketNews);
        setCompetitorNews(competitor.length ? competitor : fallbackCompetitorNews);
        setTopStories(buildTopStories(
          lec.length ? lec : fallbackLecNews,
          market.length ? market : fallbackMarketNews,
          competitor.length ? competitor : fallbackCompetitorNews
        ));
        setIsLive(true);
      }

      if (isRefresh) setRefreshing(false);
    }

    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  return { lecNews, marketNews, competitorNews, topStories, isLive, loading, refreshing, refresh };
}
