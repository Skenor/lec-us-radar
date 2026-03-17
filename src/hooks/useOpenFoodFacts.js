import { useState, useEffect } from "react";
import { fallbackCompetitors } from "../data/fallbackData";

const FIELDS = "product_name,nutriments,image_url,image_front_url,countries_tags,brands,quantity,product_quantity";

const COMPETITORS = [
  { query: "halo top", label: "Halo Top" },
  { query: "enlightened ice cream", label: "Enlightened" },
  { query: "nick's ice cream", label: "Nick's Ice Cream" },
  { query: "yasso", label: "Yasso" },
  { query: "arctic zero", label: "Arctic Zero" },
];

function buildUrl(term) {
  return `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&json=1&page_size=10&fields=${FIELDS}`;
}

function findValidProduct(products) {
  return (products || []).find((p) => {
    const kcal = p?.nutriments?.["energy-kcal_100g"];
    return kcal != null && kcal > 0;
  });
}

async function offFetch(term) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(buildUrl(term), { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return findValidProduct(data.products);
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") {
      console.log("⏱ useOpenFoodFacts: timeout after 8s, using fallback");
    } else {
      console.log(`❌ useOpenFoodFacts: ${e.message}, using fallback`);
    }
    return null;
  }
}

function parseProduct(product, label) {
  const kcal = product.nutriments?.["energy-kcal_100g"];
  const fat = product.nutriments?.["fat_100g"];
  const sugars = product.nutriments?.["sugars_100g"];
  const weight = product.quantity || null;
  return {
    name: label,
    calories: kcal != null ? Math.round(kcal) : null,
    fat: fat != null ? parseFloat(fat.toFixed(1)) : null,
    sugars: sugars != null ? parseFloat(sugars.toFixed(1)) : null,
    weight,
    image_url: product.image_url || product.image_front_url || null,
    source: "openfoodfacts",
  };
}

async function fetchCompetitor({ query, label }) {
  let product = await offFetch(query);
  if (!product) {
    product = await offFetch(`${query} ice cream`);
  }
  if (product) return parseProduct(product, label);
  const fb = fallbackCompetitors.find((f) => f.name.toLowerCase() === label.toLowerCase());
  return fb ? { ...fb, source: "fallback" } : { name: label, calories: null, fat: null, sugars: null, source: "fallback" };
}

const LEC = { name: "LEC Gelato", calories: 145, fat: 3.2, sugars: 11.0, weight: "460 ml", isLEC: true, source: "verified" };

export function useOpenFoodFacts() {
  const [data, setData] = useState(() => [
    LEC,
    ...fallbackCompetitors.filter((c) => !c.isLEC).map((c) => ({ ...c, source: "fallback" })),
  ]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await Promise.allSettled(COMPETITORS.map(fetchCompetitor));
      if (cancelled) return;
      const parsed = results.map((r) => (r.status === "fulfilled" ? r.value : null)).filter(Boolean);
      const liveCount = parsed.filter((c) => c.source === "openfoodfacts").length;
      setData([LEC, ...parsed]);
      setIsLive(liveCount >= 3);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, isLive };
}
