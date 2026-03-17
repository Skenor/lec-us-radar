import { useState, useEffect } from "react";
import { fallbackKroger } from "../data/fallbackData";

const CLIENT_ID = import.meta.env.VITE_KROGER_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_KROGER_CLIENT_SECRET;

let cachedToken = null;

async function getToken() {
  if (cachedToken) return cachedToken;
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch("https://api.kroger.com/v1/connect/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=product.compact",
  });
  if (!res.ok) throw new Error("Token fetch failed");
  const data = await res.json();
  cachedToken = data.access_token;
  return cachedToken;
}

async function fetchProduct(term, token) {
  const url = `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(term)}&filter.locationId=01400943`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Product fetch failed");
  const data = await res.json();
  return (data.data || []).slice(0, 3).map((p) => ({
    name: p.description,
    price: p.items?.[0]?.price?.regular ?? null,
    promoPrice: p.items?.[0]?.price?.promo ?? null,
    store: "Kroger",
  }));
}

const searchTerms = ["halo top", "enlightened ice cream", "yasso"];

export function useKroger() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!CLIENT_ID || !CLIENT_SECRET) {
        if (!cancelled) { setData(fallbackKroger); setLoading(false); }
        return;
      }
      try {
        const token = await getToken();
        const results = await Promise.allSettled(
          searchTerms.map((term) => fetchProduct(term, token))
        );
        const products = results
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value)
          .filter((p) => p.price !== null);

        if (!cancelled) {
          if (products.length > 0) {
            setData(products);
            setIsLive(true);
          } else {
            setData(fallbackKroger);
            setIsLive(false);
          }
        }
      } catch {
        if (!cancelled) { setData(fallbackKroger); setIsLive(false); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, isLive };
}
