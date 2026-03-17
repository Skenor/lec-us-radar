import { useState, useEffect } from "react";
import { fallbackCensus } from "../data/fallbackData";

export function useCensus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          "https://api.census.gov/data/2021/acs/acs5?get=B19013_001E,NAME&for=state:*"
        );
        if (!res.ok) throw new Error("Census failed");
        const raw = await res.json();
        // First row is headers: ["B19013_001E", "NAME", "state"]
        const headers = raw[0];
        const incomeIdx = headers.indexOf("B19013_001E");
        const nameIdx = headers.indexOf("NAME");
        const fipsIdx = headers.indexOf("state");

        const parsed = raw
          .slice(1)
          .map((row) => ({
            income: Number(row[incomeIdx]),
            stateName: row[nameIdx],
            stateFips: row[fipsIdx],
          }))
          .filter((s) => s.income > 0);

        if (!cancelled) {
          if (parsed.length > 0) {
            setData(parsed);
            setIsLive(true);
          } else {
            setData(fallbackCensus);
            setIsLive(false);
          }
        }
      } catch {
        if (!cancelled) { setData(fallbackCensus); setIsLive(false); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, isLive };
}
