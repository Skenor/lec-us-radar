import { useState, useEffect, useCallback } from "react";
import { fallbackLECPosts, fallbackCategoryDemand } from "../data/fallbackData";

// ── LEC keywords ───────────────────────────────────────────────────────────────
// Direct brand mentions — sufficient on their own
const LEC_DIRECT = ["lec gelato", "lec ice cream", "lec icecream", "lec brand", "lec shop", "lec store"];
// Food context words — required when only "leclerc" or "lec" appears alone
const LEC_FOOD_CONTEXT = ["gelato", "ice cream", "icecream", "grom", "dessert", "frozen", "food", "shop", "store", "brand", "calories", "kcal"];

// ── Low-calorie keywords ───────────────────────────────────────────────────────
const LC_KEYWORDS = [
  "low calorie", "low-calorie", "healthy ice cream", "healthy gelato",
  "guilt free", "sugar free ice cream", "halo top", "enlightened ice cream",
  "protein ice cream", "low cal ice cream", "skinny", "light ice cream",
];

// ── LEC URLs (20 total) ────────────────────────────────────────────────────────
const ALL_LEC_URLS = [
  // Global
  "https://www.reddit.com/search.json?q=LEC+ice+cream&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=LEC+gelato&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=%22LEC+gelato%22&sort=new&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=%22LEC+ice+cream%22&sort=new&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=lec+gelato+leclerc&sort=relevance&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=charles+leclerc+ice+cream&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=charles+leclerc+gelato&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=leclerc+grom+gelato&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  // Subreddit-specific
  "https://www.reddit.com/r/formula1/search.json?q=LEC+gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/formula1/search.json?q=LEC+ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/formula1/search.json?q=leclerc+gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/CharlesLeclerc/search.json?q=LEC&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/CharlesLeclerc/search.json?q=gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/CharlesLeclerc/search.json?q=ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/Monaco/search.json?q=LEC&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/italy/search.json?q=LEC+gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/italy/search.json?q=leclerc+gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/icecream/search.json?q=LEC&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/icecream/search.json?q=leclerc&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/F1Technical/search.json?q=leclerc+gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
];

// ── Low-calorie URLs (26 total) ────────────────────────────────────────────────
const ALL_LC_URLS = [
  // Global
  "https://www.reddit.com/search.json?q=low+calorie+ice+cream&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=low+calorie+gelato&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=healthy+ice+cream&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=guilt+free+ice+cream&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=sugar+free+gelato&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=protein+ice+cream&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=%22halo+top%22+review&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  "https://www.reddit.com/search.json?q=enlightened+ice+cream+review&sort=top&t=all&limit=25&restrict_sr=false&raw_json=1",
  // Subreddit-specific
  "https://www.reddit.com/r/icecream/search.json?q=low+calorie&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/icecream/search.json?q=healthy&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/icecream/search.json?q=halo+top&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/icecream/search.json?q=gelato+calories&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/1200isplenty/search.json?q=ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/1200isplenty/search.json?q=gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/1200isplenty/search.json?q=halo+top&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/loseit/search.json?q=low+calorie+ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/loseit/search.json?q=healthy+gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/loseit/search.json?q=frozen+dessert&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/HealthyFood/search.json?q=ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/HealthyFood/search.json?q=gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/Fitness/search.json?q=low+calorie+ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/nutrition/search.json?q=low+calorie+gelato&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/EatCheapAndHealthy/search.json?q=ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/WeightLoss/search.json?q=ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/keto/search.json?q=ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
  "https://www.reddit.com/r/intermittentfasting/search.json?q=ice+cream&sort=top&t=all&limit=25&restrict_sr=true&raw_json=1",
];

// ── CORS proxy fetch ───────────────────────────────────────────────────────────
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.org/?",
];

async function redditFetch(url) {
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.data?.children) {
          console.log(`✓ Reddit fetch OK via ${proxy}`);
          return data;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ── Shared fetch ───────────────────────────────────────────────────────────────
async function fetchReddit(url) {
  const data = await redditFetch(url);
  if (!data) return [];
  return (data.data.children || []).map((c) => ({
    id: c.data.id,
    title: c.data.title,
    score: c.data.score,
    num_comments: c.data.num_comments,
    subreddit: c.data.subreddit,
    url: `https://www.reddit.com${c.data.permalink}`,
    permalink: c.data.permalink,
    created_utc: c.data.created_utc,
    author: c.data.author,
    selftext: (c.data.selftext || "").slice(0, 400),
  }));
}

function dedupeAndCollect(results) {
  const map = new Map();
  results.forEach((r) => {
    if (r.status !== "fulfilled") return;
    r.value.forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
  });
  return [...map.values()];
}

// ── LEC relevance & fetch ──────────────────────────────────────────────────────
function isRelevantLEC(post) {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  // Explicit brand mention — always relevant
  if (LEC_DIRECT.some((kw) => text.includes(kw))) return true;
  // "leclerc" or bare "lec" only counts if the post also talks about food/gelato
  const mentionsLeclerc = text.includes("leclerc") || /\blec\b/.test(text);
  const hasFood = LEC_FOOD_CONTEXT.some((ft) => text.includes(ft));
  return mentionsLeclerc && hasFood;
}

async function fetchAllLECPosts() {
  const results = await Promise.allSettled(ALL_LEC_URLS.map(fetchReddit));
  return dedupeAndCollect(results)
    .filter(isRelevantLEC)
    .filter((p) => p.score >= 1 || p.num_comments >= 1)
    .filter((p) => p.title !== "[removed]" && p.title !== "[deleted]")
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

// ── Low-calorie relevance, categorization & fetch ─────────────────────────────
function isRelevantLC(post) {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  return LC_KEYWORDS.some((kw) => text.includes(kw));
}

function categorizePost(post) {
  const sr = post.subreddit;
  if (["1200isplenty", "loseit", "WeightLoss"].includes(sr)) return "diet_community";
  if (sr === "icecream") return "ice_cream_enthusiast";
  if (["Fitness", "nutrition", "intermittentfasting", "keto"].includes(sr)) return "health_fitness";
  return "general";
}

async function fetchAllLowCaloriePosts() {
  const results = await Promise.allSettled(ALL_LC_URLS.map(fetchReddit));
  return dedupeAndCollect(results)
    .filter(isRelevantLC)
    .filter((p) => p.score >= 2 || p.num_comments >= 1)
    .filter((p) => p.title !== "[removed]" && p.title !== "[deleted]")
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      engagementRatio: (p.num_comments / Math.max(p.score, 1)).toFixed(2),
      category: categorizePost(p),
    }));
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useRedditFeed() {
  // LEC posts
  const [posts, setPosts] = useState(fallbackLECPosts);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);
  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // Low-calorie posts
  const [lcPosts, setLcPosts] = useState(() =>
    fallbackCategoryDemand.map((p) => ({ ...p, category: "general" }))
  );
  const [lcLoading, setLcLoading] = useState(false);
  const [lcIsLive, setLcIsLive] = useState(false);
  const [lcFetchKey, setLcFetchKey] = useState(0);
  const lcRefetch = useCallback(() => setLcFetchKey((k) => k + 1), []);

  // LEC effect
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAllLECPosts()
      .then((livePosts) => {
        if (cancelled) return;
        if (livePosts.length > 0) { setPosts(livePosts); setIsLive(true); }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchKey]);

  // Low-calorie effect
  useEffect(() => {
    let cancelled = false;
    setLcLoading(true);
    fetchAllLowCaloriePosts()
      .then((livePosts) => {
        if (cancelled) return;
        if (livePosts.length > 0) { setLcPosts(livePosts); setLcIsLive(true); }
      })
      .catch(() => { /* lcPosts stays [] */ })
      .finally(() => { if (!cancelled) setLcLoading(false); });
    return () => { cancelled = true; };
  }, [lcFetchKey]);

  // LEC derived
  const totalFound = posts.length;
  const subredditsFound = [...new Set(posts.map((p) => p.subreddit))];
  const topPost = posts[0] || null;

  // Low-calorie derived
  const lcTotalFound = lcPosts.length;
  const lcSubredditsFound = [...new Set(lcPosts.map((p) => p.subreddit))];
  const lcTopPost = lcPosts[0] || null;
  const byCategory = {
    diet_community: lcPosts.filter((p) => p.category === "diet_community"),
    ice_cream_enthusiast: lcPosts.filter((p) => p.category === "ice_cream_enthusiast"),
    health_fitness: lcPosts.filter((p) => p.category === "health_fitness"),
    general: lcPosts.filter((p) => p.category === "general"),
  };

  return {
    // LEC posts
    posts, totalFound, subredditsFound, topPost, loading, isLive, error, refetch,
    // Low-calorie posts
    lowCalorie: {
      posts: lcPosts,
      totalFound: lcTotalFound,
      subredditsFound: lcSubredditsFound,
      topPost: lcTopPost,
      byCategory,
      loading: lcLoading,
      isLive: lcIsLive,
      refetch: lcRefetch,
    },
  };
}
