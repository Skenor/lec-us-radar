import { useState, useEffect } from "react";
import { fallbackYouTube } from "../data/fallbackData";

const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

async function ytFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`YT ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") {
      console.log("⏱ useYouTube: timeout after 8s, using fallback");
    } else {
      console.log(`❌ useYouTube: ${e.message}, using fallback`);
    }
    throw e;
  }
}

async function searchVideos(q) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&order=viewCount&regionCode=US&q=${encodeURIComponent(q)}&key=${YT_KEY}`;
  const data = await ytFetch(url);
  return (data.items || [])
    .map((item) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      channel: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
    }))
    .filter((v) => v.videoId);
}

async function fetchStats(videoIds) {
  if (!videoIds.length) return {};
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(",")}&key=${YT_KEY}`;
  const data = await ytFetch(url);
  const map = {};
  (data.items || []).forEach((item) => {
    map[item.id] = {
      views: parseInt(item.statistics?.viewCount || "0"),
      likes: parseInt(item.statistics?.likeCount || "0"),
    };
  });
  return map;
}

function enrich(videos, stats) {
  return videos
    .map((v) => {
      const s = stats[v.videoId] || { views: 0, likes: 0 };
      return {
        ...v,
        views: s.views,
        likes: s.likes,
        viewsFormatted: formatNum(s.views),
        engagement: s.views > 0 ? ((s.likes / s.views) * 100).toFixed(2) : "0.00",
      };
    })
    .sort((a, b) => b.views - a.views);
}

function buildFallback() {
  return {
    haloTop: fallbackYouTube.haloTop.map((v) => ({
      ...v,
      viewsFormatted: formatNum(v.views),
      engagement: ((v.likes / v.views) * 100).toFixed(2),
    })),
    lec: fallbackYouTube.lec.map((v) => ({
      ...v,
      viewsFormatted: formatNum(v.views),
      engagement: ((v.likes / v.views) * 100).toFixed(2),
    })),
  };
}

export function useYouTube() {
  const [data, setData] = useState(buildFallback);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!YT_KEY) return;
      try {
        // Step 1: parallel searches
        const [haloResults, lecResults] = await Promise.all([
          searchVideos("Halo Top ice cream review"),
          searchVideos("LEC gelato Charles Leclerc"),
        ]);

        // Step 2: get stats to check LEC viewCount threshold
        const [haloStats, lecStatsMap] = await Promise.all([
          fetchStats(haloResults.map((v) => v.videoId)),
          fetchStats(lecResults.map((v) => v.videoId)),
        ]);

        // Check if < 2 LEC videos have views > 1000 → 3rd search
        const lecEnriched = enrich(lecResults, lecStatsMap);
        const highViewLec = lecEnriched.filter((v) => v.views > 1_000);
        let finalLec = lecEnriched;

        if (highViewLec.length < 2) {
          try {
            const extraResults = await searchVideos("Charles Leclerc food brand");
            const seenIds = new Set(lecResults.map((v) => v.videoId));
            const newVideos = extraResults.filter((v) => !seenIds.has(v.videoId));
            const extraStats = await fetchStats(newVideos.map((v) => v.videoId));
            const extraEnriched = enrich(newVideos, extraStats);
            finalLec = [...lecEnriched, ...extraEnriched].sort((a, b) => b.views - a.views);
          } catch {
            // keep what we have
          }
        }

        if (!cancelled) {
          setData({ haloTop: enrich(haloResults, haloStats), lec: finalLec });
          setIsLive(true);
        }
      } catch {
        // state already has fallback data
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, isLive };
}
