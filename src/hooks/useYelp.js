import { useState, useEffect } from "react";
import { fallbackYelp } from "../data/fallbackData";

const YELP_KEY = import.meta.env.VITE_YELP_API_KEY;

const CITIES = [
  "Miami, FL",
  "Austin, TX",
  "Los Angeles, CA",
  "New York, NY",
  "Chicago, IL",
  "Las Vegas, NV",
  "Boston, MA",
  "Seattle, WA",
  "Dallas, TX",
  "Atlanta, GA",
];

const CHAIN_KEYWORDS = {
  wholeFoods: ["whole foods"],
  erewhon: ["erewhon"],
  sprouts: ["sprouts"],
  traderjoes: ["trader joe"],
};

function detectChain(name) {
  const lower = name.toLowerCase();
  for (const [chain, keywords] of Object.entries(CHAIN_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return chain;
  }
  return null;
}

async function yelpFetch(term, city, limit = 50) {
  const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(term)}&categories=healthmarkets,grocery&limit=${limit}&location=${encodeURIComponent(city)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${YELP_KEY}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Yelp ${res.status}`);
    const data = await res.json();
    return data.businesses || [];
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function parseBusiness(b) {
  return {
    id: b.id,
    name: b.name,
    rating: b.rating,
    review_count: b.review_count,
    address: b.location?.address1 || "",
    city: b.location?.city || "",
    zip_code: b.location?.zip_code || "",
    category: b.categories?.[0]?.title || "Grocery",
    price: b.price || "$",
    phone: b.phone || "",
    url: b.url || "",
    lat: b.coordinates?.latitude,
    lng: b.coordinates?.longitude,
  };
}

async function fetchCityData(city) {
  const queries = [
    yelpFetch("health food store", city, 50),
    yelpFetch("specialty grocery store", city, 50),
    yelpFetch("Whole Foods", city, 10),
    yelpFetch("Erewhon", city, 10),
    yelpFetch("Sprouts", city, 10),
    yelpFetch("Trader Joe's", city, 10),
  ];

  const results = await Promise.allSettled(queries);
  const allBusinesses = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  console.log(`[Yelp] ${city}: fetched ${allBusinesses.length} raw results`);

  // Deduplicate by id
  const seen = new Set();
  const deduped = allBusinesses.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });

  // Filter and sort
  const filtered = deduped
    .filter((b) => b.rating >= 3.8)
    .sort((a, b) => b.rating - a.rating || b.review_count - a.review_count)
    .slice(0, 30)
    .map(parseBusiness);

  console.log(`[Yelp] ${city}: ${filtered.length} stores after dedup+filter`);

  // Build chain counts
  const topChains = { wholeFoods: 0, erewhon: 0, sprouts: 0, traderjoes: 0 };
  filtered.forEach((s) => {
    const chain = detectChain(s.name);
    if (chain) topChains[chain]++;
  });

  const avgRating = filtered.length
    ? Math.round((filtered.reduce((s, b) => s + b.rating, 0) / filtered.length) * 10) / 10
    : 0;

  return {
    stores: filtered,
    summary: { total: filtered.length, avgRating, topChains },
  };
}

export function useYelp() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!YELP_KEY) {
        console.log("[Yelp] No API key — using fallback data");
        if (!cancelled) { setData(fallbackYelp); setLoading(false); }
        return;
      }

      try {
        const results = await Promise.allSettled(CITIES.map(fetchCityData));
        const cityData = {};
        let anyLive = false;

        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value.stores.length > 0) {
            cityData[CITIES[i]] = r.value;
            anyLive = true;
          } else {
            console.warn(`[Yelp] ${CITIES[i]} failed — using fallback`);
            cityData[CITIES[i]] = fallbackYelp[CITIES[i]] || { stores: [], summary: { total: 0, avgRating: 0, topChains: {} } };
          }
        });

        if (!cancelled) {
          setData(cityData);
          setIsLive(anyLive);
        }
      } catch (e) {
        console.error("[Yelp] Fatal error — using fallback", e);
        if (!cancelled) { setData(fallbackYelp); setIsLive(false); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, isLive };
}
