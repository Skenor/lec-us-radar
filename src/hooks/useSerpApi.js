import { useState, useEffect } from "react";
import { fallbackSerpGeo, fallbackSerpTimeseries } from "../data/fallbackData";

const SERP_KEY = import.meta.env.VITE_SERPAPI_KEY;

const QUERY_LABELS = {
  "low calorie ice cream": "Low Cal Ice Cream",
  "healthy gelato":        "Healthy Gelato",
  "halo top ice cream":    "Halo Top",
  "sugar free ice cream":  "Sugar Free Ice Cream",
};

function parseDate(raw) {
  // SerpAPI: "Aug 18 – 24, 2024" → take first 6 chars "Aug 18"
  return typeof raw === "string" ? raw.slice(0, 6).trim() : raw;
}

function computeAverages(timeseries) {
  const keys = ["Low Cal Ice Cream", "Healthy Gelato", "Halo Top", "Sugar Free Ice Cream"];
  const result = {};
  for (const key of keys) {
    const vals = (timeseries || []).map((p) => p[key] || 0);
    const nonZero = vals.filter((v) => v > 0);
    if (!nonZero.length) { result[key] = { avg: 0, max: 0, peakMonth: "—" }; continue; }
    const avg = Math.round(nonZero.reduce((s, v) => s + v, 0) / nonZero.length);
    const max = Math.max(...vals);
    const peakIdx = vals.indexOf(max);
    const peakMonth = peakIdx >= 0 ? (timeseries[peakIdx]?.date || "—") : "—";
    result[key] = { avg, max, peakMonth };
  }
  return result;
}

async function serpFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") {
      console.log("⏱ useSerpApi: timeout after 8s, using fallback");
    } else {
      console.log(`❌ useSerpApi: ${e.message}, using fallback`);
    }
    throw e;
  }
}

export function useSerpApi() {
  const [timeseriesData, setTimeseriesData] = useState(fallbackSerpTimeseries);
  const [averages, setAverages] = useState(() => computeAverages(fallbackSerpTimeseries));
  const [geoData, setGeoData] = useState(fallbackSerpGeo);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!SERP_KEY) return;

      const [tsRes, geoRes] = await Promise.allSettled([
        serpFetch(
          `https://serpapi.com/search.json?engine=google_trends&q=low+calorie+ice+cream,healthy+gelato,halo+top+ice+cream,sugar+free+ice+cream&data_type=TIMESERIES&geo=US&date=today+12-m&api_key=${SERP_KEY}`
        ),
        serpFetch(
          `https://serpapi.com/search.json?engine=google_trends&q=Charles+Leclerc&data_type=GEO_MAP&geo=US&api_key=${SERP_KEY}`
        ),
      ]);

      if (cancelled) return;

      let anyLive = false;

      if (tsRes.status === "fulfilled" && tsRes.value?.interest_over_time?.timeline_data) {
        const ts = tsRes.value.interest_over_time.timeline_data.map((point) => {
          const entry = { date: parseDate(point.date) };
          (point.values || []).forEach((v) => {
            const label = QUERY_LABELS[v.query?.toLowerCase()] || v.query;
            entry[label] = v.extracted_value ?? v.value ?? 0;
          });
          return entry;
        });
        const avgs = computeAverages(ts);
        setTimeseriesData(ts);
        setAverages(avgs);
        anyLive = true;
      }

      if (geoRes.status === "fulfilled" && geoRes.value?.interest_by_region) {
        const geo = geoRes.value.interest_by_region.map((r) => ({
          location: r.location,
          value: r.value,
        }));
        setGeoData(geo);
        anyLive = true;
      }

      setIsLive(anyLive);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { timeseriesData, averages, geoData, loading, isLive };
}
