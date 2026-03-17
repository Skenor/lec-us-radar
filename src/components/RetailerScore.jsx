import { useState, useMemo, useEffect, useRef } from "react";
import { ExternalLink, Zap, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MapPin, Info, SearchX } from "lucide-react";
import { useKroger } from "../hooks/useKroger";
import { useYelp } from "../hooks/useYelp";
import LiveBadge from "./LiveBadge";

const LEC_TARGET = 4.99;

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

const F1_CITIES = ["Austin, TX", "Miami, FL", "Las Vegas, NV"];

const KEY_RETAILERS = ["whole foods", "erewhon", "sprouts", "trader joe"];

const QUICK_FILTERS = ["Whole Foods", "Erewhon", "Sprouts", "Trader Joe's", "Organic"];

const CITY_META = {
  "Miami, FL":       { label: "Miami",       state: "FL", bullets: ["Health-conscious Brickell corridor: avg HH income $89k", "Strong Italian-American diaspora in Coral Gables & Doral", "3rd highest premium grocery density in the Southeast"] },
  "Austin, TX":      { label: "Austin",      state: "TX", bullets: ["Whole Foods world HQ flagship — premium grocery capital of the US", "Tech-affluent demographic: median income $75k, health-obsessed", "Leclerc's highest US search interest index (91/100)"] },
  "Los Angeles, CA": { label: "Los Angeles", state: "CA", bullets: ["Erewhon Market epicenter — highest premium grocery density globally", "LA leads US in European premium food imports by volume", "Celebrity food culture aligns perfectly with LEC's co-founder profile"] },
  "New York, NY":    { label: "New York",    state: "NY", bullets: ["#1 Italian-American concentration in the US (NY metro: 3.1M)", "Union Square Whole Foods: highest revenue per sqft in the chain", "Premium import brand velocity 3x national average at NYC specialty stores"] },
  "Chicago, IL":     { label: "Chicago",     state: "IL", bullets: ["3rd largest Italian-American population center (1.2M metro)", "Lincoln Park & Wicker Park premium grocery corridor growing 22% YoY", "Strong European artisan brand affinity in North Side neighborhoods"] },
  "Las Vegas, NV":   { label: "Las Vegas",   state: "NV", bullets: ["Tourism-driven impulse premium purchase behavior", "Summerlin & Henderson: $95k avg HH income, high health awareness", "High foot traffic hospitality corridor on the Strip"] },
  "Boston, MA":      { label: "Boston",      state: "MA", bullets: ["#1 Italian-American density per capita in New England (North End)", "College-dense market (400k students): premium health food early adopters", "Formaggio Kitchen & Savenor's prove $$$-tier import demand"] },
  "Seattle, WA":     { label: "Seattle",     state: "WA", bullets: ["PCC Community Markets: highest co-op loyalty in the US", "Tech worker demographic ($130k median income) drives premium F&B", "Erewhon-equivalent demand but no Erewhon presence — white space"] },
  "Dallas, TX":      { label: "Dallas",      state: "TX", bullets: ["Central Market Dallas: Texas benchmark for premium European imports", "Fastest-growing premium grocery market in the South 2022-2024", "Highland Park & Uptown: $120k+ HH income corridors"] },
  "Atlanta, GA":     { label: "Atlanta",     state: "GA", bullets: ["Your DeKalb Farmers Market: 4.5★ 4,567 reviews — premium import demand proven", "Atlanta tech boom driving Midtown/Buckhead premiumization", "Strong Whole Foods penetration across Buckhead & Virginia-Highland"] },
};

const COL_TOOLTIPS = {
  "City": "US market analyzed",
  "Premium Doors": "Number of premium health/specialty grocery stores identified via Yelp Fusion API (rating ≥ 3.8)",
  "Avg Rating": "Average Yelp rating across all premium doors in this market",
  "Whole Foods": "Number of Whole Foods Market locations — primary recommended entry retailer for LEC",
  "Erewhon": "Number of Erewhon Market locations — ultra-premium proof-of-concept retailer",
  "Opportunity Score": "Composite score: 60% premium door density + 40% avg rating. Higher = prioritize first.",
};

function Skeleton({ className = "" }) {
  return <div className={`bg-ferrari/10 animate-pulse rounded ${className}`} />;
}

function StarRow({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? "text-amber-400" : "text-border"}>★</span>
      ))}
    </span>
  );
}

function isKeyRetailer(name) {
  const lower = name.toLowerCase();
  return KEY_RETAILERS.some((k) => lower.includes(k));
}

function StoreCard({ store }) {
  const keyRetailer = isKeyRetailer(store.name);
  return (
    <div className="group bg-bg-elevated hover:border-ferrari/40 border border-border rounded-lg p-3 mb-2 transition-all duration-200 cursor-default">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-text-primary truncate">{store.name}</p>
            {keyRetailer && (
              <span className="bg-ferrari/10 text-ferrari text-xs px-1.5 py-0.5 rounded shrink-0">Key Retailer</span>
            )}
          </div>
          <p className="text-xs text-text-secondary">{store.category}</p>
          <p className="text-xs text-text-muted truncate">{store.address}{store.city ? `, ${store.city}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <StarRow rating={store.rating} />
              <span className="text-xs text-text-secondary ml-1">{store.rating}</span>
            </div>
            <span className="text-xs text-text-muted">({store.review_count?.toLocaleString()})</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-ferrari">{store.price || "$"}</span>
              {store.url && (
                <a href={store.url} target="_blank" rel="noreferrer" title="View on Yelp" className="text-text-muted hover:text-ferrari transition-colors">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
          <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0" />
        </div>
      </div>
    </div>
  );
}

function CityPanel({ cityKey, cityData, kroger, kLoading, isTransitioning }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rating");
  const [expanded, setExpanded] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const meta = CITY_META[cityKey] || {};
  const stores = cityData?.stores || [];
  const summary = cityData?.summary || {};

  const avgCompetitorPrice = kroger
    ? kroger.reduce((s, p) => s + (p.price || 0), 0) / kroger.length
    : 5.5;
  const pricingAdv = Math.round(((avgCompetitorPrice - LEC_TARGET) / avgCompetitorPrice) * 100);

  const filtered = useMemo(() => {
    let list = stores.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => b.review_count - a.review_count);
    return list;
  }, [stores, search, sort]);

  const visible = expanded ? filtered : filtered.slice(0, 10);
  const remaining = filtered.length - 10;

  return (
    <div
      className="flex flex-col lg:flex-row gap-6 transition-opacity duration-150"
      style={{ opacity: isTransitioning ? 0 : 1 }}
    >
      {/* LEFT: City Summary */}
      <div className="lg:w-[40%] flex flex-col gap-4">
        <div className="bg-bg-elevated border border-border rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-xl text-text-primary">{meta.label}</p>
              <p className="text-text-secondary text-sm">{meta.state}</p>
            </div>
          </div>

          {/* Onboarding Hint */}
          <div
            className="flex items-center gap-2 mb-4 transition-opacity duration-500"
            style={{ opacity: showHint ? 1 : 0, pointerEvents: "none" }}
          >
            <Info size={12} className="text-text-muted shrink-0" />
            <p className="text-text-muted text-xs italic">Use the search and filters on the right to find the best entry points</p>
          </div>

          {/* 2x2 Metric Tiles */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-bg-surface border border-border rounded-lg p-3">
              <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Premium Doors</p>
              <p className="font-mono text-ferrari text-3xl font-bold">{summary.total || stores.length}</p>
            </div>
            <div className="bg-bg-surface border border-border rounded-lg p-3">
              <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Avg Rating</p>
              <p className="font-mono text-ferrari text-3xl font-bold">{summary.avgRating || "4.3"}</p>
              <p className="text-xs text-amber-400">★ avg</p>
            </div>
            <div className="bg-bg-surface border border-border rounded-lg p-3">
              <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Whole Foods</p>
              <p className="font-mono text-ferrari text-3xl font-bold">{summary.topChains?.wholeFoods ?? "—"}</p>
              <p className="text-xs text-text-muted">locations</p>
            </div>
            <div className="bg-bg-surface border border-border rounded-lg p-3">
              <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Erewhon / Sprouts</p>
              <p className="font-mono text-ferrari text-3xl font-bold">
                {(summary.topChains?.erewhon ?? 0) + (summary.topChains?.sprouts ?? 0)}
              </p>
              <p className="text-xs text-text-muted">locations</p>
            </div>
          </div>

          {/* Why This Market */}
          <div className="border-t border-border pt-3">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">Why This Market</p>
            <ul className="space-y-1.5">
              {(meta.bullets || []).map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-ferrari mt-0.5 shrink-0">→</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-bg-elevated border border-border rounded-xl p-4">
          <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">Kroger Shelf Price</p>
          {kLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <div className="flex flex-col gap-1.5 mb-3">
                {(kroger || []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary truncate">{p.name}</span>
                    <span className="font-mono text-sm text-text-primary">${p.price?.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-1.5">
                  <span className="text-xs text-ferrari font-semibold">LEC Target</span>
                  <span className="font-mono text-sm text-ferrari font-bold">${LEC_TARGET.toFixed(2)}</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-live/10 border border-live/30 rounded-lg">
                <Zap size={12} className="text-live" />
                <span className="text-live text-xs font-semibold">LEC -{pricingAdv}% vs category avg</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT: Store List */}
      <div className="lg:w-[60%]">
        {/* Search + Sort */}
        <div className="flex gap-2 mb-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowHint(false)}
            placeholder="🔍 Search by store name or neighborhood..."
            className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ferrari transition-colors"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-ferrari transition-colors"
          >
            <option value="rating">Sort by Rating</option>
            <option value="reviews">Sort by Reviews</option>
          </select>
        </div>

        {/* Quick filters or results label */}
        <div className="flex items-center justify-between mb-3 min-h-[24px]">
          {search === "" ? (
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setSearch(f)}
                  className="border border-border rounded-full px-2.5 py-1 text-xs text-text-secondary hover:border-ferrari hover:text-ferrari transition-colors cursor-pointer"
                >
                  {f}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">{filtered.length} results for <span className="text-text-primary">'{search}'</span></span>
              <button
                onClick={() => setSearch("")}
                className="text-text-muted hover:text-ferrari transition-colors text-xs"
              >
                ×
              </button>
            </div>
          )}
          <span className="text-xs text-text-muted shrink-0 ml-2">
            Showing {Math.min(expanded ? filtered.length : 10, filtered.length)} of {stores.length}
          </span>
        </div>

        {/* Store list or empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SearchX size={48} className="text-ferrari/40 mb-3" />
            <p className="font-semibold text-text-primary mb-1">No stores found for '{search}'</p>
            <p className="text-text-secondary text-sm mb-4">Try 'Whole Foods' or 'organic'</p>
            <button
              onClick={() => setSearch("")}
              className="border border-ferrari text-ferrari rounded-full px-4 py-1.5 text-sm hover:bg-ferrari hover:text-white transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div>
              {visible.map((store, i) => (
                <StoreCard key={store.id || i} store={store} />
              ))}
            </div>

            {filtered.length > 10 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-2 py-2 border border-border rounded-lg text-xs text-text-secondary hover:border-ferrari hover:text-ferrari transition-colors flex items-center justify-center gap-2"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expanded ? "Show less ↑" : `Show all ${remaining} more stores ↓`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OpportunityTable({ data }) {
  const rows = useMemo(() => {
    if (!data) return [];
    const allDoors = CITIES.map((c) => (data[c]?.summary?.total || data[c]?.stores?.length || 0));
    const maxDoors = Math.max(...allDoors, 1);

    return CITIES.map((city) => {
      const d = data[city];
      const stores = d?.stores || (Array.isArray(d) ? d : []);
      const summary = d?.summary || {};
      const doors = summary.total || stores.length || 0;
      const avgRating = summary.avgRating || 4.0;
      const score = Math.round((doors / maxDoors) * 60 + (avgRating / 5) * 40);
      return { city, doors, avgRating, topChains: summary.topChains || {}, score };
    }).sort((a, b) => b.score - a.score);
  }, [data]);

  const maxScore = rows[0]?.score || 100;
  const totalDoors = rows.reduce((s, r) => s + r.doors, 0);
  const avgAllRating = rows.length
    ? Math.round((rows.reduce((s, r) => s + r.avgRating, 0) / rows.length) * 10) / 10
    : 0;

  const COLS = ["City", "Premium Doors", "Avg Rating", "Whole Foods", "Erewhon", "Opportunity Score"];

  return (
    <div className="mt-8">
      <p className="font-semibold text-base text-text-primary mb-1">Market Opportunity Ranking</p>
      <p className="text-xs text-text-secondary mb-4">
        Composite score based on premium store density and avg rating — higher = prioritize first
      </p>
      <div className="bg-bg-elevated border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {COLS.map((h) => (
                <th
                  key={h}
                  title={COL_TOOLTIPS[h] || ""}
                  className="text-left px-4 py-2.5 text-xs text-text-secondary uppercase tracking-widest cursor-help"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.city}
                className={`border-b border-border/50 ${i === 0 ? "border-l-2 border-l-ferrari" : ""}`}
              >
                <td className="px-4 py-3 text-text-primary font-medium text-xs whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    {CITY_META[row.city]?.label}, {CITY_META[row.city]?.state}
                    {i === 0 && (
                      <span className="text-xs bg-ferrari/10 text-ferrari px-1.5 py-0.5 rounded border border-ferrari/30 whitespace-nowrap">🏆 Top Priority</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-ferrari font-semibold text-sm">{row.doors}</td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <span className="text-amber-400">★</span> {row.avgRating}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">{row.topChains.wholeFoods ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">{row.topChains.erewhon ?? "—"}</td>
                <td className="px-4 py-3 w-40">
                  <div className="relative">
                    <div className="w-full h-5 bg-ferrari/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ferrari rounded-full transition-all duration-500"
                        style={{ width: `${(row.score / maxScore) * 100}%` }}
                      />
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-white">
                      {row.score}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-bg-surface">
              <td className="px-4 py-2.5 text-xs text-text-secondary font-semibold uppercase tracking-widest">Total</td>
              <td className="px-4 py-2.5 font-mono text-xs text-ferrari font-semibold">{totalDoors} doors</td>
              <td className="px-4 py-2.5 text-xs text-text-secondary"><span className="text-amber-400">★</span> {avgAllRating} avg</td>
              <td className="px-4 py-2.5 text-xs text-text-muted">—</td>
              <td className="px-4 py-2.5 text-xs text-text-muted">—</td>
              <td className="px-4 py-2.5 text-xs text-text-muted">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function RetailerScore() {
  const { data: kroger, loading: kLoading, isLive: kLive } = useKroger();
  const { data: yelp, loading: yLoading, isLive: yLive } = useYelp();
  const [activeCity, setActiveCity] = useState(CITIES[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tabBarRef = useRef(null);

  const totalStores = useMemo(() => {
    if (!yelp) return 0;
    return CITIES.reduce((acc, c) => {
      const d = yelp[c];
      return acc + (d?.summary?.total || d?.stores?.length || (Array.isArray(d) ? d.length : 0));
    }, 0);
  }, [yelp]);

  function getCityDoors(city) {
    const d = yelp?.[city];
    if (!d) return 0;
    return d?.summary?.total || d?.stores?.length || (Array.isArray(d) ? d.length : 0);
  }

  function handleCityChange(city) {
    if (city === activeCity) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveCity(city);
      setIsTransitioning(false);
    }, 150);
  }

  function scrollTabs(dir) {
    if (tabBarRef.current) {
      tabBarRef.current.scrollBy({ left: dir * 200, behavior: "smooth" });
    }
  }

  const activeIdx = CITIES.indexOf(activeCity);

  return (
    <div>
      {/* Module Header + Live badges */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-secondary">
          Yelp Fusion API —{" "}
          <span className="font-mono text-ferrari font-semibold">{totalStores}</span>{" "}
          premium doors across{" "}
          <span className="font-mono text-ferrari font-semibold">{CITIES.length}</span>{" "}
          markets
        </p>
        <div className="flex gap-2">
          <LiveBadge isLive={kLive} />
          <LiveBadge isLive={yLive} />
        </div>
      </div>

      {/* Intro Banner */}
      <div className="bg-bg-elevated border border-border rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-ferrari shrink-0" />
          <p className="text-sm text-text-primary">
            Explore <span className="font-mono text-ferrari font-semibold">{totalStores}</span> premium retail doors across{" "}
            <span className="font-mono text-ferrari font-semibold">{CITIES.length}</span> US markets — click any city to dive in.
          </p>
        </div>
        {yLive && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-ferrari animate-pulse"
                  style={{ animationDelay: `${i * 150}ms`, opacity: 1 - i * 0.3 }}
                />
              ))}
            </div>
            <span className="text-xs text-text-secondary">Live scanning</span>
          </div>
        )}
      </div>

      {/* Tab Bar Label */}
      <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">📍 Select a market to explore</p>

      {/* Tab Bar with scroll arrows */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
        <button
          onClick={() => scrollTabs(-1)}
          className="shrink-0 p-1 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-ferrari hover:border-ferrari/50 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        <div
          ref={tabBarRef}
          className="flex gap-2 overflow-x-auto scrollbar-none flex-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {CITIES.map((city) => {
            const meta = CITY_META[city];
            const isActive = activeCity === city;
            const doors = getCityDoors(city);
            const isF1 = F1_CITIES.includes(city);
            return (
              <button
                key={city}
                onClick={() => handleCityChange(city)}
                className={`relative shrink-0 px-2 sm:px-3 py-2 rounded-xl text-sm transition-all duration-200 flex flex-col items-center min-w-[68px] sm:min-w-[80px] ${
                  isActive
                    ? "bg-ferrari text-white shadow-lg shadow-ferrari/20"
                    : "bg-bg-elevated border border-border text-text-secondary hover:border-ferrari/50 hover:text-text-primary cursor-pointer"
                }`}
              >
                {isF1 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ferrari border border-bg-base" />
                )}
                <span className="font-medium text-xs">{meta?.label}</span>
                {!yLoading && (
                  <span className={`text-xs mt-0.5 ${isActive ? "text-white/70" : "text-text-muted"}`}>
                    {doors} doors
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scrollTabs(1)}
          className="shrink-0 p-1 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-ferrari hover:border-ferrari/50 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* City Content */}
      {yLoading ? (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[40%] flex flex-col gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="lg:w-[60%]">
            <Skeleton className="h-10 w-full mb-4" />
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)}
          </div>
        </div>
      ) : (
        <CityPanel
          key={activeCity}
          cityKey={activeCity}
          cityData={yelp?.[activeCity]}
          kroger={kroger}
          kLoading={kLoading}
          isTransitioning={isTransitioning}
        />
      )}

      {/* Opportunity Table */}
      {!yLoading && <OpportunityTable data={yelp} />}
    </div>
  );
}
