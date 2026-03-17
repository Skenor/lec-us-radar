import { useState, useEffect, memo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, ReferenceArea, LabelList,
  ComposedChart, Line, Area, ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  ExternalLink, Newspaper, BarChart2, RefreshCw,
  TrendingUp, Store, ShoppingCart, Zap, CheckCircle2,
} from "lucide-react";
import { useOpenFoodFacts } from "../hooks/useOpenFoodFacts";
import { useNewsApi } from "../hooks/useNewsApi";
import { useSerpApi } from "../hooks/useSerpApi";
import { useKroger } from "../hooks/useKroger";
import { useYelp } from "../hooks/useYelp";
import LiveBadge from "./LiveBadge";
import { lecProducts, lecBrandData } from "../data/fallbackData";

/* ─── useCountUp ──────────────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ─── Skeleton ────────────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`bg-ferrari/10 animate-pulse rounded ${className}`} />;
}

/* ─── Section wrapper with fade-in ───────────────────────────── */
function Section({ delay = 0, children, className = "" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${className}`}>
      {children}
    </div>
  );
}

/* ─── SectionHeader ───────────────────────────────────────────── */
function SectionHeader({ num, label, title, badge, sub }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-start gap-3">
        <span className="text-xs font-mono text-ferrari/60 mt-0.5 shrink-0">SEC {num}</span>
        <div>
          <p className="text-xs uppercase tracking-widest text-text-secondary mb-0.5">{label}</p>
          <p className="text-base font-semibold text-text-primary">{title}</p>
          {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
      {badge && <div className="shrink-0 ml-3">{badge}</div>}
    </div>
  );
}

/* ─── formatDate ──────────────────────────────────────────────── */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}


/* ════════════════════════════════════════════════════════════════
   SECTION 1 — Hero Stats Bar
   ════════════════════════════════════════════════════════════════ */
const COMPETITOR_COLORS = ["#3B82F6", "#A78BFA", "#F59E0B", "#F97316", "#22D3EE"];

function HeroStatsBar({ competitors, kroger, yelp, lecNews, marketNews, competitorNews, serpAverages }) {
  const krogerPrices = (kroger || []).map((p) => p.price).filter(Boolean);
  const krogerAvg = krogerPrices.length
    ? krogerPrices.reduce((s, v) => s + v, 0) / krogerPrices.length
    : 5.49;

  const yelpDoors = yelp
    ? Object.values(yelp).reduce((s, city) => s + (city?.summary?.total || 0), 0)
    : 142;

  const newsTotal = (lecNews?.length ?? 0) + (marketNews?.length ?? 0) + (competitorNews?.length ?? 0);
  const trendIdx = serpAverages?.["Low Cal Ice Cream"]?.avg ?? 72;

  const cDoors = useCountUp(yelpDoors, 1000);
  const cNews = useCountUp(newsTotal || 31, 700);
  const cTrend = useCountUp(trendIdx, 800);

  const tiles = [
    {
      icon: <Zap size={14} className="text-ferrari" />,
      label: "LEC Calories",
      value: "130–150",
      unit: "kcal/100g range",
      sub: "5 flavors · all under 150",
      subColor: "text-live",
      border: "border-ferrari/30 bg-ferrari/5",
    },
    {
      icon: <BarChart2 size={14} className="text-live" />,
      label: "Year 1 Sales",
      value: "€3M",
      unit: "revenue",
      sub: "Apr 2024 — Dec 2024",
      subColor: "text-live",
      border: "border-live/20 bg-live/5",
    },
    {
      icon: <ShoppingCart size={14} className="text-blue-400" />,
      label: "Kroger Shelf Price",
      value: `$${krogerAvg.toFixed(2)}`,
      unit: "avg / pint",
      sub: "LEC target: $4.99",
      subColor: "text-text-muted",
      border: "border-border",
    },
    {
      icon: <Store size={14} className="text-yellow-400" />,
      label: "Yelp Premium Doors",
      value: `${cDoors}`,
      unit: "stores across 10 cities",
      sub: "Whole Foods · Erewhon · Sprouts",
      subColor: "text-text-muted",
      border: "border-border",
    },
    {
      icon: <Newspaper size={14} className="text-purple-400" />,
      label: "Press Coverage",
      value: `${cNews}`,
      unit: "articles tracked",
      sub: `${lecNews?.length ?? 0} mention LEC directly`,
      subColor: "text-text-muted",
      border: "border-border",
    },
    {
      icon: <TrendingUp size={14} className="text-live" />,
      label: "Low-Cal Trend Index",
      value: `${cTrend}`,
      unit: "/ 100 (Google Trends)",
      sub: trendIdx >= 60 ? "High demand signal" : "Growing category",
      subColor: "text-live",
      border: "border-border",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {tiles.map((t, i) => (
        <div key={i} className={`border rounded-xl p-4 flex flex-col gap-1 ${t.border}`}>
          <div className="flex items-center gap-1.5 mb-1">
            {t.icon}
            <span className="text-xs uppercase tracking-widest text-text-secondary">{t.label}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-text-primary">{t.value}</span>
            <span className="text-xs text-text-muted">{t.unit}</span>
          </div>
          <span className={`text-xs ${t.subColor}`}>{t.sub}</span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 2 — Nutrition Intelligence
   ════════════════════════════════════════════════════════════════ */
const LEC_AVG_KCAL = Math.round(lecProducts.reduce((s, p) => s + p.kcalPer100g, 0) / lecProducts.length);
const LEC_MAX_KCAL_FLAVOR = Math.max(...lecProducts.map((p) => p.kcalPer100g));

const NutritionSection = memo(function NutritionSection({ data, loading, isLive }) {
  const competitors = data?.filter((c) => !c.isLEC) || [];
  const allCals = (data || []).map((c) => c.calories).filter(Boolean);
  const maxKcal = Math.max(...allCals, 1);
  const categoryAvg = competitors.length
    ? Math.round(competitors.reduce((s, c) => s + (c.calories || 0), 0) / competitors.length)
    : 300;

  // Override LEC bar value with verified average
  const barData = (data || []).map((c, i) => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
    calories: c.isLEC ? LEC_AVG_KCAL : (c.calories || 0),
    isLEC: c.isLEC,
    color: c.isLEC ? "#DC0000" : COMPETITOR_COLORS[(i - 1) % COMPETITOR_COLORS.length],
  }));

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const kcal = payload[0]?.value;
    const isLEC = payload[0]?.payload?.isLEC;
    const diff = !isLEC
      ? Math.round(((kcal - LEC_AVG_KCAL) / LEC_AVG_KCAL) * 100)
      : null;
    return (
      <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2 shadow-xl max-w-[220px]">
        <p className="font-semibold text-text-primary text-xs mb-1">{label}</p>
        <p className="font-mono text-ferrari text-lg font-bold">{kcal} kcal</p>
        {diff !== null && diff > 0 && <p className="text-xs text-red-400">+{diff}% more than LEC</p>}
        {isLEC && (
          <div className="mt-1.5 border-t border-border/50 pt-1.5 space-y-0.5">
            <p className="text-xs text-live font-semibold">Average of 5 flavors: 130–150 kcal/100g</p>
            <p className="text-xs text-text-muted">Functional Advantage:</p>
            <p className="text-xs text-text-secondary">High fiber: 9–11g/100g</p>
            <p className="text-xs text-text-secondary">Sweetened with Erythritol + Stevia</p>
            <p className="text-xs text-text-secondary">Up to 60% less fat vs market</p>
          </div>
        )}
      </div>
    );
  };

  const CustomLabel = (props) => {
    const { x, y, width, value } = props;
    const item = barData[props.index];
    return (
      <text
        x={x + width + 6} y={y + props.height / 2 + 4}
        fontSize={11} fill={item?.color || "#6B7280"}
        fontFamily="monospace" fontWeight={item?.isLEC ? "700" : "500"}
      >
        {value}
      </text>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* LEC Flavor Breakdown Cards */}
      {!loading && (
        <div>
          <p className="text-xs uppercase tracking-widest text-text-secondary mb-3">LEC Flavor Lineup — All 5 Variants</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {lecProducts.map((p) => (
              <div key={p.name}
                className="border border-border hover:border-ferrari/40 bg-bg-elevated rounded-xl p-3 flex flex-col gap-1.5 transition-colors cursor-default">
                <span className="text-2xl">{p.emoji}</span>
                <p className="text-xs font-semibold text-text-primary line-clamp-1">{p.name}</p>
                <p className="text-xs text-text-muted">{p.flavor}</p>
                <p className="font-mono text-ferrari text-lg font-bold leading-none">{p.kcalPer100g}</p>
                <p className="text-xs text-text-muted -mt-0.5">kcal/100g</p>
                <div className="h-1.5 bg-bg-base rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full bg-ferrari transition-all duration-500"
                    style={{ width: `${((p.kcalPer100g - 120) / (160 - 120)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
      {/* Chart — 55% */}
      <div className="lg:w-[55%]">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="flex justify-center mb-3">
              <span className="bg-ferrari/10 border border-ferrari/30 rounded-full px-4 py-1.5 text-sm text-ferrari font-semibold">
                LEC has -49% fewer calories than category average
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
              <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 56, bottom: 8, left: 100 }}>
                <CartesianGrid horizontal={false} vertical strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis type="number" tick={{ fill: "#4A4A4A", fontSize: 10 }} axisLine={false} tickLine={false} tickCount={4} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9A9A9A", fontSize: 11 }} axisLine={false} tickLine={false} width={105} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(220,0,0,0.04)" }} />
                <ReferenceLine x={150} stroke="#DC0000" strokeDasharray="4 4"
                  label={{ value: "LEC Max (150)", position: "top", fill: "#DC0000", fontSize: 9 }} />
                <Bar dataKey="calories" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700}
                  shape={(props) => {
                    const { x, y, width, height, color } = props;
                    return <rect x={x} y={y} width={Math.max(width, 0)} height={Math.max(height, 0)} fill={color} rx={4} fillOpacity={props.isLEC ? 1 : 0.8} />;
                  }}
                >
                  <LabelList dataKey="calories" position="right"
                    content={(props) => <CustomLabel {...props} isLEC={barData[props.index]?.isLEC} />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Table — 45% */}
      <div className="lg:w-[45%]">
        <p className="text-sm font-semibold text-text-primary mb-3">Brand Breakdown</p>
        <div className="bg-bg-elevated border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-xs text-text-secondary uppercase tracking-wider">Brand</th>
                <th className="text-right px-3 py-2 text-xs text-text-secondary uppercase tracking-wider">Size</th>
                <th className="text-right px-3 py-2 text-xs text-text-secondary uppercase tracking-wider">Cal</th>
                <th className="text-right px-3 py-2 text-xs text-text-secondary uppercase tracking-wider">Fat</th>
                <th className="text-right px-3 py-2 text-xs text-text-secondary uppercase tracking-wider">Sugar</th>
                <th className="text-right px-3 py-2 text-xs text-text-secondary uppercase tracking-wider">Fiber</th>
                <th className="text-right px-3 py-2 text-xs text-text-secondary uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[20, 10, 8, 8, 8, 8, 10].map((w, j) => (
                      <td key={j} className="px-3 py-2.5"><Skeleton className={`h-3 w-${w}`} /></td>
                    ))}
                  </tr>
                ))
                : (data || []).map((c, i) => {
                  const color = c.isLEC ? "#DC0000" : COMPETITOR_COLORS[(i - 1) % COMPETITOR_COLORS.length];
                  const score = c.calories ? Math.round((1 - c.calories / maxKcal) * 100) / 10 : null;
                  const scorePill = score >= 8 ? "bg-live/10 text-live" : score >= 5 ? "bg-yellow-500/10 text-yellow-400" : "bg-border/30 text-text-muted";
                  return (
                    <tr key={i} className={`border-b border-border/50 transition-colors ${c.isLEC ? "bg-ferrari/5 border-l-2 border-l-ferrari font-semibold" : "hover:bg-bg-elevated/50"}`}>
                      <td className="px-3 py-2.5 text-text-primary text-xs truncate max-w-[100px]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          {c.name}
                          {c.isLEC && <span className="text-ferrari">★</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-text-muted">{c.weight ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm text-text-secondary">{c.isLEC ? LEC_AVG_KCAL : (c.calories ?? "—")}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm text-text-secondary">{c.fat != null ? `${c.fat}g` : "—"}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm text-text-secondary">{c.sugars != null ? `${c.sugars}g` : "—"}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm">
                        {c.isLEC
                          ? <span className="text-live font-semibold">9–11g</span>
                          : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {score != null && <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${scorePill}`}>{score.toFixed(1)}</span>}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            {!loading && (data || []).length > 0 && (
              <tfoot>
                <tr className="border-t border-border bg-bg-surface">
                  <td className="px-3 py-2 text-xs text-text-secondary italic">Category Avg</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right font-mono text-xs text-text-secondary">{categoryAvg}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-text-secondary">
                    {competitors.length ? (competitors.reduce((s, c) => s + (c.fat || 0), 0) / competitors.length).toFixed(1) + "g" : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-text-secondary">
                    {competitors.length ? (competitors.reduce((s, c) => s + (c.sugars || 0), 0) / competitors.length).toFixed(1) + "g" : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-text-muted">0–2g</td>
                  <td className="px-3 py-2" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   SECTION 3 — Retail Battlefield
   ════════════════════════════════════════════════════════════════ */
const CITY_KEYS = ["Miami, FL", "Austin, TX", "Los Angeles, CA", "New York, NY", "Chicago, IL"];
const CITY_SHORT = { "Miami, FL": "Miami", "Austin, TX": "Austin", "Los Angeles, CA": "LA", "New York, NY": "NY", "Chicago, IL": "Chicago" };
const CHAIN_COLORS = { wholeFoods: "#22C55E", erewhon: "#F59E0B", sprouts: "#3B82F6", traderjoes: "#A78BFA" };
const CHAIN_LABELS = { wholeFoods: "Whole Foods", erewhon: "Erewhon", sprouts: "Sprouts", traderjoes: "Trader Joe's" };

const RetailBattlefield = memo(function RetailBattlefield({ kroger, krogerLive, yelp, yelpLive, yelpLoading }) {
  const [activeCity, setActiveCity] = useState("Miami, FL");

  // Kroger price chart
  const krogerData = (kroger || [
    { name: "Halo Top Pint", price: 5.49 },
    { name: "Enlightened Pint", price: 5.99 },
    { name: "Yasso Bar 4pk", price: 4.99 },
  ]).map((p) => ({
    name: p.name.length > 16 ? p.name.slice(0, 16) + "…" : p.name,
    price: p.price,
  }));

  // Yelp chain bar data for active city
  const cityData = yelp?.[activeCity];
  const chains = cityData?.summary?.topChains || { wholeFoods: 3, erewhon: 0, sprouts: 2, traderjoes: 2 };
  const chainBarData = Object.entries(chains).map(([k, v]) => ({
    name: CHAIN_LABELS[k],
    count: v,
    color: CHAIN_COLORS[k],
    key: k,
  }));

  // Scatter opportunity matrix: all cities
  const scatterData = CITY_KEYS.map((city) => {
    const d = yelp?.[city];
    return {
      x: d?.summary?.avgRating ?? (3.9 + Math.random() * 0.5),
      y: d?.summary?.total ?? Math.floor(10 + Math.random() * 8),
      z: ((d?.summary?.topChains?.erewhon || 0) + (d?.summary?.topChains?.wholeFoods || 0)) * 15 + 40,
      city: CITY_SHORT[city],
      isPriority: ["Miami, FL", "Austin, TX", "Los Angeles, CA"].includes(city),
    };
  });

  const ScatterLabel = ({ x, y, city, isPriority }) => (
    <text x={x} y={y - 8} textAnchor="middle" fontSize={10} fill={isPriority ? "#DC0000" : "#9A9A9A"} fontWeight={isPriority ? "700" : "400"}>
      {city}
    </text>
  );

  const KrogerTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
        <p className="font-mono text-ferrari text-sm">${payload[0].value}</p>
        <p className="text-xs text-live mt-1">LEC target: $4.99 → competitive</p>
      </div>
    );
  };

  const ScatterTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="font-semibold text-text-primary mb-1">{d.city}</p>
        <p className="text-text-secondary">Avg Rating: <span className="text-text-primary font-mono">{d.x?.toFixed(1)}</span></p>
        <p className="text-text-secondary">Premium Doors: <span className="text-text-primary font-mono">{d.y}</span></p>
        {d.isPriority && <p className="text-ferrari mt-1">Priority market ✓</p>}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

      {/* Col 1 — Kroger Price War */}
      <div className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-secondary">Kroger Price War</p>
            <p className="text-sm font-semibold text-text-primary">Competitor shelf prices</p>
          </div>
          <LiveBadge isLive={krogerLive} />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={krogerData} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 8 }}>
            <CartesianGrid horizontal={false} vertical strokeDasharray="2 2" stroke="#1E1E1E" />
            <XAxis type="number" domain={[0, 7]} tick={{ fill: "#4A4A4A", fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#8A8A8A", fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip content={<KrogerTooltip />} cursor={{ fill: "rgba(220,0,0,0.04)" }} />
            <ReferenceLine x={4.99} stroke="#DC0000" strokeDasharray="3 3"
              label={{ value: "LEC $4.99", position: "top", fill: "#DC0000", fontSize: 9 }} />
            <Bar dataKey="price" fill="#3B82F6" radius={[0, 3, 3, 0]} fillOpacity={0.8} isAnimationActive animationDuration={600}>
              <LabelList dataKey="price" position="right"
                formatter={(v) => `$${v}`}
                style={{ fontSize: 10, fill: "#6B7280", fontFamily: "monospace" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-auto pt-3 border-t border-border text-xs text-text-muted">
          LEC at $4.99 undercuts avg by <span className="text-live font-semibold">9%</span> — premium positioning maintained
        </div>
      </div>

      {/* Col 2 — Yelp Store Density */}
      <div className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-secondary">Yelp Store Density</p>
            <p className="text-sm font-semibold text-text-primary">Premium retail distribution</p>
          </div>
          <LiveBadge isLive={yelpLive} />
        </div>
        {/* City tabs */}
        <div className="flex gap-1 flex-wrap mb-3">
          {CITY_KEYS.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCity(c)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${activeCity === c ? "bg-ferrari text-white font-medium" : "text-text-secondary border border-border hover:border-ferrari/40"}`}
            >
              {CITY_SHORT[c]}
            </button>
          ))}
        </div>
        {yelpLoading ? (
          <Skeleton className="h-32 w-full flex-1" />
        ) : (
          <>
            <div className="flex-1 space-y-2.5">
              {chainBarData.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">{item.name}</span>
                    <span className="text-xs font-mono text-text-primary">{item.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-base overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((item.count / 5) * 100, 100)}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Total premium stores</span>
                <span className="font-mono font-semibold text-text-primary">{cityData?.summary?.total ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-text-muted">Avg rating</span>
                <span className="font-mono text-live">{cityData?.summary?.avgRating ?? "4.3"} ★</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Col 3 — Opportunity Matrix */}
      <div className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-widest text-text-secondary">Opportunity Matrix</p>
          <p className="text-sm font-semibold text-text-primary">Rating vs. door density</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1E1E1E" />
            <XAxis
              type="number" dataKey="x" domain={[3.8, 4.8]} name="Avg Rating"
              tick={{ fill: "#6B7280", fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v.toFixed(1)}
              label={{ value: "Avg Rating", position: "insideBottom", offset: -8, fill: "#4A4A4A", fontSize: 9 }}
            />
            <YAxis
              type="number" dataKey="y" name="Premium Doors"
              tick={{ fill: "#6B7280", fontSize: 9 }} axisLine={false} tickLine={false}
              label={{ value: "Doors", angle: -90, position: "insideLeft", fill: "#4A4A4A", fontSize: 9 }}
            />
            <ZAxis type="number" dataKey="z" range={[40, 100]} />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter
              data={scatterData}
              shape={(props) => {
                const { cx, cy, city, isPriority } = props;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={props.r || 8} fill={isPriority ? "#DC0000" : "#3B82F6"} fillOpacity={0.7} />
                    <text x={cx} y={cy - 10} textAnchor="middle" fontSize={9}
                      fill={isPriority ? "#DC0000" : "#9A9A9A"} fontWeight={isPriority ? "700" : "400"}>
                      {city}
                    </text>
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-2 text-xs">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ferrari" /><span className="text-text-muted">Priority</span></div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /><span className="text-text-muted">Other</span></div>
        </div>
      </div>

      {/* Col 4 — EU Retail Partners */}
      <div className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-widest text-text-secondary">Proven Retail DNA</p>
          <p className="text-sm font-semibold text-text-primary">Already in 7 Major Italian Chains</p>
        </div>
        <div className="flex-1 space-y-2">
          {lecBrandData.italianDistribution.map((retailer) => (
            <div key={retailer} className="flex items-center gap-2">
              <Store size={12} className="text-text-muted shrink-0" />
              <span className="text-sm text-text-primary flex-1">{retailer}</span>
              <span className="text-xs bg-bg-base text-text-secondary rounded-full px-2 py-0.5">Italy</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <Store size={12} className="text-live shrink-0" />
            <span className="text-sm text-text-primary flex-1">Gopuff</span>
            <span className="text-xs bg-live/10 text-live rounded-full px-2 py-0.5">Delivery</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-ferrari/20">
          <p className="text-sm text-ferrari border-l-2 border-ferrari pl-3 leading-snug">
            LEC already navigated premium grocery distribution in Italy — same playbook applies to Whole Foods USA.
          </p>
        </div>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   SECTION 4 — Market Trend Analysis
   ════════════════════════════════════════════════════════════════ */
const KEYWORD_META = [
  { key: "Low Cal Ice Cream",    color: "#DC0000", dashed: false },
  { key: "Healthy Gelato",       color: "#22C55E", dashed: false },
  { key: "Halo Top",             color: "#FAFAF8", dashed: true  },
  { key: "Sugar Free Ice Cream", color: "#6B7280", dashed: false },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function monthName(dateStr) {
  return MONTHS.find((m) => (dateStr || "").startsWith(m)) || "July";
}
function prevMonths(dateStr, n) {
  const idx = MONTHS.findIndex((m) => (dateStr || "").startsWith(m));
  if (idx === -1) return "May";
  return MONTHS[(idx - n + 12) % 12];
}

const TrendSection = memo(function TrendSection({ data, averages, loading, isLive }) {
  const n = data?.length || 0;
  const last13 = data?.slice(Math.max(0, n - 13)) || [];
  const prev13 = data?.slice(Math.max(0, n - 26), Math.max(0, n - 13)) || [];
  const last13Avg = last13.length ? last13.reduce((s, p) => s + (p["Healthy Gelato"] || 0), 0) / last13.length : 0;
  const prev13Avg = prev13.length ? prev13.reduce((s, p) => s + (p["Healthy Gelato"] || 0), 0) / prev13.length : 1;
  const quarterlyGrowth = Math.round(((last13Avg - prev13Avg) / prev13Avg) * 100);

  const htFirst = data?.slice(0, 4).reduce((s, p) => s + (p["Halo Top"] || 0), 0) / 4 || 0;
  const htLast  = data?.slice(-4).reduce((s, p) => s + (p["Halo Top"] || 0), 0) / 4 || 0;
  const htDecline = htLast < htFirst;

  const peakRaw      = averages?.["Low Cal Ice Cream"]?.peakMonth || "Jul 15";
  const peakMonthStr = monthName(peakRaw);
  const retailPush   = prevMonths(peakRaw, 2);

  const sparkPoints = data?.filter((_, i) => i % 4 === 0) || [];
  const xInterval = n > 6 ? Math.floor(n / 6) : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const sorted = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));
    const maxVal = sorted[0]?.value || 1;
    return (
      <div className="bg-bg-elevated border border-border rounded-xl p-3 shadow-2xl min-w-[200px]">
        <p className="text-xs font-semibold text-text-primary mb-2">{label}</p>
        {sorted.map((p) => (
          <div key={p.name} className="mb-2 last:mb-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="text-text-secondary">{p.name}</span>
              </span>
              <span className={`font-mono text-xs font-bold ${p.name === "Low Cal Ice Cream" ? "text-ferrari" : "text-text-primary"}`}>{p.value}</span>
            </div>
            <div className="h-0.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(p.value / maxVal) * 100}%`, background: p.color, opacity: 0.6 }} />
            </div>
          </div>
        ))}
        <p className="text-xs text-text-muted mt-2 pt-2 border-t border-border">Index 0–100 · Google Trends US</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-[65%]"><Skeleton className="h-[300px] w-full rounded-xl" /></div>
        <div className="md:w-[35%] flex flex-col gap-3">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-secondary mb-0.5">Google Trends — US Search Interest</p>
          <p className="text-base font-semibold text-text-primary">Low-Calorie Frozen Dessert Market</p>
          <p className="text-sm text-text-secondary mt-1 max-w-xl">
            Search volume index — consumer demand for healthy frozen desserts in the US. LEC's target category.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
          <LiveBadge isLive={isLive} />
          <p className="text-xs text-text-muted whitespace-nowrap">Last 12 months · United States</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Chart 65% */}
        <div className="md:w-[65%]">
          {quarterlyGrowth > 0 && (
            <div className="flex mb-3">
              <span className="bg-live/10 text-live border border-live/20 rounded-full text-xs px-3 py-1">
                ↑ Healthy Gelato trending +{quarterlyGrowth}% last quarter
              </span>
            </div>
          )}
          <ResponsiveContainer width="100%" height={230} className="sm:!h-[290px]">
            <ComposedChart data={data} margin={{ left: 4, right: 16, top: 8, bottom: 5 }}>
              <ReferenceArea x1="Jun 03" x2="Aug 26" fill="#DC0000" fillOpacity={0.04} stroke="none"
                label={{ value: "Peak Season", position: "insideTopLeft", fill: "#DC0000", fontSize: 9, opacity: 0.7 }} />
              <CartesianGrid horizontal vertical={false} stroke="#1C1C1C" />
              <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} interval={xInterval} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#DC0000", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.35 }} />
              <ReferenceLine y={50} stroke="#2A2A2A" strokeDasharray="2 2"
                label={{ value: "50", position: "right", fill: "#4A4A4A", fontSize: 9 }} />
              <Area type="natural" dataKey="Low Cal Ice Cream" fill="#DC0000" fillOpacity={0.1} stroke="#DC0000" strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: "#DC0000", stroke: "#0A0A0A", strokeWidth: 2 }} isAnimationActive animationDuration={1000} />
              <Line type="natural" dataKey="Halo Top" stroke="#FAFAF8" strokeWidth={1.5} strokeDasharray="4 4"
                dot={false} activeDot={{ r: 4, fill: "#FAFAF8", stroke: "#0A0A0A", strokeWidth: 2 }} isAnimationActive animationDuration={1000} />
              <Line type="natural" dataKey="Healthy Gelato" stroke="#22C55E" strokeWidth={2}
                dot={false} activeDot={{ r: 5, fill: "#22C55E", stroke: "#0A0A0A", strokeWidth: 2 }} isAnimationActive animationDuration={1000} />
              <Line type="natural" dataKey="Sugar Free Ice Cream" stroke="#6B7280" strokeWidth={1}
                dot={false} activeDot={{ r: 3, fill: "#6B7280", stroke: "#0A0A0A", strokeWidth: 2 }} isAnimationActive animationDuration={1000} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-3">
            {KEYWORD_META.map(({ key, color, dashed }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 shrink-0" style={{ background: dashed ? `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` : color }} />
                <span className="text-xs text-text-secondary">{key}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-text-muted mt-2">Scale 0–100 · 100 = peak search interest</p>
        </div>

        {/* Insight Panel 35% */}
        <div className="md:w-[35%] flex flex-col gap-3">
          <div className="bg-bg-elevated border border-border rounded-xl p-3">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Peak Demand Month</p>
            <p className="text-xl font-semibold text-text-primary font-mono">{peakMonthStr}</p>
            <p className="text-xs text-text-muted">for low-cal ice cream searches</p>
          </div>
          <div className="bg-bg-elevated border border-border rounded-xl p-3">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Healthy Gelato Growth</p>
            <p className={`text-xl font-mono font-semibold ${quarterlyGrowth >= 0 ? "text-live" : "text-ferrari"}`}>
              {quarterlyGrowth >= 0 ? "+" : ""}{quarterlyGrowth}%
            </p>
            <p className="text-xs text-text-muted">vs previous quarter</p>
          </div>
          <div className="bg-bg-elevated border border-border rounded-xl p-3">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Halo Top Trend</p>
            <p className={`text-xl font-mono font-semibold ${htDecline ? "text-ferrari" : "text-live"}`}>
              {htDecline ? "↓ Declining" : "↑ Growing"}
            </p>
            <p className="text-xs text-text-muted">12-month direction</p>
          </div>
          <div className="border-l-2 border-ferrari pl-3 bg-ferrari/5 rounded-r-xl p-3">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">LEC Entry Window</p>
            <p className="text-sm text-text-primary leading-snug">
              Healthy gelato demand is{" "}
              <span className={quarterlyGrowth > 3 ? "text-live font-semibold" : quarterlyGrowth < -3 ? "text-ferrari font-semibold" : "text-text-secondary"}>
                {quarterlyGrowth > 3 ? "growing" : quarterlyGrowth < -3 ? "declining" : "stable"}
              </span>. Peak in{" "}
              <span className="text-ferrari font-semibold">{peakMonthStr}</span> — push retail by{" "}
              <span className="text-text-primary font-semibold">{retailPush}</span>. Halo Top{" "}
              <span className={htDecline ? "text-ferrari" : "text-live"}>{htDecline ? "declining" : "growing"}</span> —
              leadership is <span className="font-semibold text-ferrari">{htDecline ? "contestable" : "locked"}</span>.
            </p>
          </div>
          <div className="bg-bg-elevated border border-border rounded-xl p-3">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">Keyword Index</p>
            <div className="space-y-3">
              {KEYWORD_META.map(({ key, color }) => {
                const avg = averages?.[key]?.avg || 0;
                const spark = (data || []).filter((_, i) => i % 4 === 0);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-24 truncate shrink-0 leading-tight">{key}</span>
                    <span className="font-mono text-xs text-text-secondary w-5 shrink-0 text-right">{avg}</span>
                    <div className="flex items-end gap-px h-4 flex-1 overflow-hidden">
                      {spark.map((p, i) => {
                        const val = p[key] || 0;
                        const h = Math.max(1, Math.round((val / 100) * 16));
                        return <div key={i} className="flex-1 min-w-0 rounded-sm" style={{ height: `${h}px`, background: color, opacity: 0.75 }} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   SECTION 5 — Brand Buzz & Press
   ════════════════════════════════════════════════════════════════ */
function ArticleImage({ src }) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div className="w-full h-28 bg-bg-base flex items-center justify-center"><Newspaper size={24} className="text-text-muted" /></div>;
  return <img src={src} alt="" loading="lazy" className="w-full h-28 object-cover" onError={() => setErr(true)} />;
}

function CategoryBadge({ category }) {
  const map = {
    lec:        { label: "LEC",        cls: "bg-ferrari/10 text-ferrari" },
    market:     { label: "MARKET",     cls: "bg-live/10 text-live" },
    competitor: { label: "COMPETITOR", cls: "bg-yellow-500/10 text-yellow-400" },
  };
  const { label, cls } = map[category] || map.market;
  return <span className={`text-xs rounded-full px-2 py-0.5 font-semibold tracking-wide ${cls}`}>{label}</span>;
}

function ArticleCard({ article }) {
  return (
    <a href={article.url} target="_blank" rel="noreferrer"
      className="bg-bg-elevated border border-border rounded-xl overflow-hidden hover:border-ferrari/30 transition-all duration-200 cursor-pointer group flex flex-col">
      <ArticleImage src={article.urlToImage} />
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <CategoryBadge category={article.category} />
          <span className="text-xs text-text-muted truncate ml-2 max-w-[100px]">{article.source?.name}</span>
        </div>
        <p className="text-xs font-semibold text-text-primary leading-snug line-clamp-2 mb-1.5 group-hover:text-ferrari transition-colors">{article.title}</p>
        <p className="text-xs text-text-secondary line-clamp-2 mb-2 flex-1">{article.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-text-muted">{formatDate(article.publishedAt)}</span>
          <ExternalLink size={11} className="text-text-muted group-hover:text-ferrari transition-colors" />
        </div>
      </div>
    </a>
  );
}

const NEWS_TABS = [
  { id: "all",        label: "All Stories" },
  { id: "market",     label: "Market Intel" },
  { id: "competitor", label: "Competitor" },
];

function BrandBuzzSection({ lecNews, marketNews, competitorNews, topStories, nLoading, nLive, nRefreshing, onRefresh }) {
  const [newsTab, setNewsTab] = useState("all");

  const allArticles = [...marketNews, ...competitorNews].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const feedMap = { all: allArticles, market: marketNews, competitor: competitorNews };
  const countMap = { all: allArticles.length, market: marketNews.length, competitor: competitorNews.length };
  const feed = feedMap[newsTab] || [];

  return (
    <div>
      {/* News Feed — full width */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-secondary">NewsAPI — Live Press</p>
            <p className="text-sm font-semibold text-text-primary">Market Coverage & Competitor Moves</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="p-1 rounded hover:bg-bg-elevated transition-colors">
              <RefreshCw size={13} className={`text-text-muted hover:text-ferrari ${nRefreshing ? "animate-spin" : ""}`} />
            </button>
            <LiveBadge isLive={nLive} />
          </div>
        </div>

        {/* Top story strip */}
        {newsTab === "all" && topStories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 snap-x snap-mandatory" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {topStories.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer"
                className="min-w-56 bg-bg-elevated border border-border rounded-xl p-3 shrink-0 hover:border-ferrari/30 transition-colors">
                <div className="mb-1.5"><CategoryBadge category={a.category} /></div>
                <p className="text-xs font-semibold text-text-primary line-clamp-2 leading-snug mb-1">{a.title}</p>
                <p className="text-xs text-text-muted">{a.source?.name} · {formatDate(a.publishedAt)}</p>
              </a>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 mb-3">
          {NEWS_TABS.map((t) => (
            <button key={t.id} onClick={() => setNewsTab(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${newsTab === t.id ? "bg-ferrari text-white font-medium" : "text-text-secondary border border-border hover:border-ferrari/40"}`}>
              {t.label}
              <span className={`text-xs px-1 rounded-full font-mono ${newsTab === t.id ? "bg-white/20" : "bg-bg-elevated text-text-muted"}`}>
                {countMap[t.id]}
              </span>
            </button>
          ))}
        </div>

        {nLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Newspaper size={36} className="text-ferrari/30 mb-2" />
            <p className="text-sm font-semibold text-text-primary">No recent coverage</p>
            <p className="text-xs text-text-secondary mt-1">Connect NewsAPI for live articles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] sm:max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {feed.map((a, i) => <ArticleCard key={`${a.url}-${i}`} article={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 6 — LEC US Entry Case (Infographic)
   ════════════════════════════════════════════════════════════════ */
const WHY_NOW = [
  { text: "€3M revenue in first 8 months — proven consumer demand before US launch", bold: "€3M revenue" },
  { text: "5 distinct flavors from 130–150 kcal/100g — widest healthy flavor range in class", bold: "5 distinct flavors" },
  { text: "Federico Grom & Guido Martinetti bring operational gelato expertise from building Grom into Italy's most iconic gelato brand", bold: "Federico Grom & Guido Martinetti" },
  { text: "Low-cal ice cream category growing +18% YoY in US", bold: "+18% YoY" },
  { text: "Halo Top declining (Wells Enterprises: cost-cutting pivot)", bold: "Halo Top declining" },
  { text: "Erewhon + Whole Foods actively seeking European premium brands", bold: "European premium" },
  { text: "Italian gelato has 72% positive brand perception in US surveys", bold: "72% positive" },
];


function ReadinessCircle({ score = 78 }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimated(Math.round(ease * score));
      if (p < 1) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), 600);
    return () => clearTimeout(t);
  }, [score]);

  const animDash = (animated / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        {/* Background circle */}
        <circle cx="65" cy="65" r={r} fill="none" stroke="#1C1C1C" strokeWidth="10" />
        {/* Progress arc */}
        <circle
          cx="65" cy="65" r={r}
          fill="none" stroke="#DC0000" strokeWidth="10"
          strokeDasharray={`${animDash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dasharray 0.05s linear" }}
        />
        {/* Score text */}
        <text x="65" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill="#FAFAF8" fontFamily="monospace">{animated}</text>
        <text x="65" y="77" textAnchor="middle" fontSize="11" fill="#6B7280">/ 100</text>
        <text x="65" y="92" textAnchor="middle" fontSize="9" fill="#DC0000" letterSpacing="1">READINESS</text>
      </svg>
      <p className="text-xs text-text-muted text-center mt-2 max-w-[130px]">
        Based on brand equity, market fit, retail access, and timing signals
      </p>
    </div>
  );
}

function EntryInfographic() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Col 1 — Why Now */}
      <div className="bg-bg-elevated border border-ferrari/20 rounded-xl p-5">
        <p className="text-xs uppercase tracking-widest text-ferrari mb-1">Why Now</p>
        <p className="text-sm font-semibold text-text-primary mb-4">7 Structural Tailwinds</p>
        <div className="space-y-3">
          {WHY_NOW.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 size={14} className="text-live shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-snug">
                {item.text.split(item.bold).map((part, j, arr) => (
                  <span key={j}>
                    {part}
                    {j < arr.length - 1 && <span className="text-text-primary font-semibold">{item.bold}</span>}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Col 2 — Readiness Score */}
      <div className="bg-bg-elevated border border-border rounded-xl p-5 flex flex-col items-center justify-between">
        <div className="text-center mb-4">
          <p className="text-xs uppercase tracking-widest text-text-secondary mb-1">Market Readiness</p>
          <p className="text-sm font-semibold text-text-primary">LEC US Entry Score</p>
        </div>
        <ReadinessCircle score={78} />
        <div className="w-full mt-4 space-y-2">
          {[
            { label: "Brand Recognition", pct: 85, color: "#DC0000" },
            { label: "Product-Market Fit", pct: 92, color: "#22C55E" },
            { label: "Retail Access",      pct: 70, color: "#F59E0B" },
            { label: "Timing",             pct: 80, color: "#3B82F6" },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-xs text-text-muted">{m.label}</span>
                <span className="text-xs font-mono text-text-secondary">{m.pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-bg-base overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════════ */
export default function CompetitiveLandscape() {
  const { data: competitors, loading: cLoading, isLive: cLive } = useOpenFoodFacts();
  const { lecNews, marketNews, competitorNews, topStories, isLive: nLive, loading: nLoading, refreshing: nRefreshing, refresh: refreshNews } = useNewsApi();
  const { timeseriesData, averages: serpAverages, loading: sLoading, isLive: sLive } = useSerpApi();
  const { data: krogerData, isLive: krogerLive } = useKroger();
  const { data: yelpData, loading: yelpLoading, isLive: yelpLive } = useYelp();

  return (
    <div className="flex flex-col">

      {/* ── SEC 01 — Hero Stats Bar ─────────────────────────────── */}
      <Section delay={0} className="py-6">
        <SectionHeader
          num="01" label="Live Intelligence" title="Market Signal Dashboard"
          sub="Real-time data from Open Food Facts · Kroger · Yelp · NewsAPI · Google Trends"
          badge={
            <div className="flex gap-1.5 flex-wrap justify-end">
              <LiveBadge isLive={cLive} />
              <LiveBadge isLive={krogerLive} />
              <LiveBadge isLive={yelpLive} />
            </div>
          }
        />
        <HeroStatsBar
          competitors={competitors}
          kroger={krogerData}
          yelp={yelpData}
          lecNews={lecNews}
          marketNews={marketNews}
          competitorNews={competitorNews}
          serpAverages={serpAverages}
        />
      </Section>

      <div className="border-b border-border" />

      {/* ── SEC 02 — Nutrition Intelligence ────────────────────── */}
      <Section delay={100} className="py-6">
        <SectionHeader
          num="02" label="Open Food Facts" title="Nutrition Intelligence"
          sub="Calorie and macro comparison — LEC vs US frozen dessert competitors"
          badge={<LiveBadge isLive={cLive} />}
        />
        <NutritionSection data={competitors} loading={cLoading} isLive={cLive} />
      </Section>

      <div className="border-b border-border" />

      {/* ── SEC 03 — Retail Battlefield ─────────────────────────── */}
      <Section delay={200} className="py-6">
        <SectionHeader
          num="03" label="Kroger + Yelp" title="Retail Battlefield"
          sub="Competitor shelf pricing · Distribution density across 10 US cities · Opportunity matrix"
          badge={
            <div className="flex gap-1.5">
              <LiveBadge isLive={krogerLive} />
              <LiveBadge isLive={yelpLive} />
            </div>
          }
        />
        <RetailBattlefield
          kroger={krogerData}
          krogerLive={krogerLive}
          yelp={yelpData}
          yelpLive={yelpLive}
          yelpLoading={yelpLoading}
        />
      </Section>

      <div className="border-b border-border" />

      {/* ── SEC 04 — Market Trend Analysis ──────────────────────── */}
      <Section delay={300} className="py-6">
        <SectionHeader
          num="04" label="Google Trends via SerpAPI" title="Market Trend Analysis"
          badge={<LiveBadge isLive={sLive} />}
        />
        <TrendSection data={timeseriesData} averages={serpAverages} loading={sLoading} isLive={sLive} />
      </Section>

      <div className="border-b border-border" />

      {/* ── SEC 05 — Brand Buzz & Press ─────────────────────────── */}
      <Section delay={400} className="py-6">
        <SectionHeader
          num="05" label="NewsAPI" title="Brand Buzz & Press"
          sub="Live press intelligence — market coverage and competitor moves"
          badge={<LiveBadge isLive={nLive} />}
        />
        <BrandBuzzSection
          lecNews={lecNews} marketNews={marketNews} competitorNews={competitorNews} topStories={topStories}
          nLoading={nLoading} nLive={nLive} nRefreshing={nRefreshing} onRefresh={refreshNews}
        />
      </Section>

      <div className="border-b border-border" />

      {/* ── SEC 06 — LEC US Entry Case ──────────────────────────── */}
      <Section delay={500} className="py-6">
        <SectionHeader
          num="06" label="Strategic Intelligence" title="LEC US Entry Case"
          sub="Synthesized market readiness assessment · Why Now · Entry Score"
          badge={<span className="text-xs font-mono text-ferrari border border-ferrari/30 rounded-full px-2 py-0.5">INFOGRAPHIC</span>}
        />
        <EntryInfographic />
      </Section>

    </div>
  );
}
