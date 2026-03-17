import { useState, useMemo, useEffect, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { scaleSequential } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import {
  ChevronDown,
  ChevronUp,
  Info,
  Map,
  MousePointer2,
  Store,
  Loader2,
  X,
} from "lucide-react";
import { useSerpApi } from "../hooks/useSerpApi";
import { useCensus } from "../hooks/useCensus";
import { computeMarketReadinessScore } from "../utils/scoring";
import LiveBadge from "./LiveBadge";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const F1_MARKERS = [
  { name: "Austin, TX", coordinates: [-97.7431, 30.2672], stateName: "Texas" },
  { name: "Miami, FL", coordinates: [-80.1918, 25.7617], stateName: "Florida" },
  { name: "Las Vegas, NV", coordinates: [-115.1398, 36.1699], stateName: "Nevada" },
];
const F1_STATE_NAMES = new Set(["Texas", "Florida", "Nevada"]);

// ── Helpers ────────────────────────────────────────────────────────────────────
function getTierClasses(tier) {
  if (tier === "Tier 1 Entry") return "bg-live/10 text-live border border-live/20";
  if (tier === "Tier 2 Watch") return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
  return "bg-border/20 text-text-muted border border-border/40";
}

function getRetailers(tier) {
  if (tier === "Tier 1 Entry") return ["Whole Foods Market", "Erewhon", "Sprouts Farmers Market"];
  if (tier === "Tier 2 Watch") return ["Whole Foods Market", "Trader Joe's", "Target"];
  return ["Target", "Kroger", "Costco"];
}

function getEntryStrategy(state) {
  if (!state) return "";
  const { stateName, tier } = state;
  if (tier === "Tier 1 Entry") {
    if (stateName === "California") return "Erewhon LA + Whole Foods NorCal give immediate premium shelf access. Price at $7.99 at Erewhon for 90 days before scaling to $4.99 at Whole Foods statewide.";
    if (stateName === "New York") return "NYC Italian-American density (index 100) makes this the highest-credibility launch market. Anchor at Whole Foods Union Square and seed to food communities on social.";
    if (stateName === "Texas") return "COTA hosts 400K+ F1 fans annually — Austin GP activation is the single best zero-cost earned media event in the US. Lead with Whole Foods Austin during race weekend.";
    if (stateName === "Florida") return "Miami GP + Italian-American community in Boca/Fort Lauderdale creates dual entry vectors. Approach Whole Foods Brickell and The Organic Spot simultaneously.";
    if (stateName === "Nevada") return "Las Vegas GP in November delivers a concentrated F1 fan window. Negotiate Bellagio food hall + Whole Foods Las Vegas endcap for the race week.";
    if (stateName === "New Jersey") return "Proximity to NYC Italian-American corridors (index 95) makes NJ a natural spillover market. Target premium independents in Bergen County alongside Whole Foods.";
    if (stateName === "Connecticut") return "High income density + Italian-American index (90) positions CT as a strong Northeast anchor. Fairfield County Whole Foods is the entry point.";
    return `${stateName}'s combination of high income index and strong brand interest creates a clear first-mover opportunity. Lead with premium grocery channels and F1 fan seeding.`;
  }
  if (tier === "Tier 2 Watch") {
    return `${stateName} warrants year-2 expansion after validating Tier 1 proof-of-concept. Monitor Google Trends velocity before committing distribution budget.`;
  }
  return `${stateName} is a longer-term develop market. Build online DTC awareness before pursuing retail placement — current signals don't justify slotting fees.`;
}

// ── useCountUp ────────────────────────────────────────────────────────────────
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// ── MetricBar ────────────────────────────────────────────────────────────────
function MetricBar({ label, value, size = "sm" }) {
  const h = size === "lg" ? "h-2" : "h-1";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-secondary w-28 flex-shrink-0">{label}</span>
      <div className={`flex-1 ${h} bg-bg-base rounded-full mx-2`}>
        <div
          className="bg-ferrari rounded-full h-full transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text-primary w-6 text-right">{value}</span>
    </div>
  );
}

// ── StatePanel ────────────────────────────────────────────────────────────────
function StatePanel({ state, onClose }) {
  const isF1 = state && F1_STATE_NAMES.has(state.stateName);
  const retailers = state ? getRetailers(state.tier) : [];
  const strategy = state ? getEntryStrategy(state) : "";

  return (
    <div className={`transition-all duration-300 ${state ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5 pointer-events-none"} w-72 flex-shrink-0`}>
      {!state ? (
        <div className="h-full flex flex-col items-center justify-center pt-12">
          <Map size={64} className="text-ferrari/20 mb-4" />
          <p className="text-text-secondary text-sm text-center">Select a state</p>
          <p className="text-text-muted text-xs text-center px-4 mt-1">
            Click any state on the map to see detailed entry strategy
          </p>
        </div>
      ) : (
        <div className="bg-bg-elevated border border-border rounded-2xl p-5 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-xl font-semibold text-text-primary leading-tight">{state.stateName}</h3>
            <button onClick={onClose} className="text-text-muted hover:text-ferrari transition-colors mt-0.5 ml-2 shrink-0">
              <X size={16} />
            </button>
          </div>
          <span className={`inline-flex items-center text-xs rounded-full px-2.5 py-1 mb-4 ${getTierClasses(state.tier)}`}>
            {state.tier}
          </span>
          {isF1 && (
            <span className="ml-2 inline-flex items-center text-xs rounded-full px-2.5 py-1 bg-ferrari/10 text-ferrari border border-ferrari/20">
              🏁 F1 Grand Prix
            </span>
          )}

          {/* Score */}
          <div className="flex items-baseline gap-1 my-4">
            <span className="text-5xl font-mono font-bold text-ferrari">{state.score}</span>
            <span className="text-lg text-text-muted">/100</span>
          </div>

          {/* Score Breakdown */}
          <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Score Breakdown</p>
          <div className="space-y-3">
            <MetricBar label="Brand Interest" value={state.leclercTrend} size="lg" />
            <MetricBar label="Income Index" value={state.normalizedIncome} size="lg" />
            <MetricBar label="Italian Heritage" value={state.italianProxy} size="lg" />
          </div>

          {/* Entry Strategy */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-2">Entry Strategy</p>
            <p className="text-sm text-text-secondary leading-relaxed">{strategy}</p>
          </div>

          {/* Key Retailers */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Key Retailers</p>
            <ul className="space-y-2">
              {retailers.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Store size={12} className="text-text-muted shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LeclercMap() {
  const { geoData, loading: sLoading, isLive: sLive } = useSerpApi();
  const { data: censusData, loading: cLoading, isLive: cLive } = useCensus();

  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedState, setSelectedState] = useState(null);
  const [mapLayer, setMapLayer] = useState("All States");
  const [showMethodology, setShowMethodology] = useState(false);
  const methodologyRef = useRef(null);

  const loading = sLoading || cLoading;
  const isLive = sLive && cLive;

  const scoredStates = useMemo(() => {
    if (!censusData || !geoData) return [];
    const geoMap = {};
    (geoData || []).forEach((item) => { geoMap[item.location] = item.value; });
    return computeMarketReadinessScore(
      censusData.map((s) => ({ ...s, leclercTrendValue: geoMap[s.stateName] ?? 10 }))
    );
  }, [censusData, geoData]);

  const scoreMap = useMemo(() => {
    const m = {};
    scoredStates.forEach((s) => { m[s.stateFips] = s; });
    return m;
  }, [scoredStates]);

  const maxScore = scoredStates[0]?.score || 100;
  const minScore = scoredStates[scoredStates.length - 1]?.score || 0;
  const colorScale = scaleSequential(interpolateRgb("#1A0000", "#DC0000")).domain([minScore, maxScore]);

  const top10 = scoredStates.slice(0, 10);
  const tier1Count = scoredStates.filter((s) => s.tier === "Tier 1 Entry").length;
  const avgScore = scoredStates.length
    ? Math.round(scoredStates.reduce((acc, s) => acc + s.score, 0) / scoredStates.length)
    : 0;

  // Animated counters
  const animAvg = useCountUp(loading ? 0 : avgScore);
  const animTier1 = useCountUp(loading ? 0 : tier1Count);
  const animTop = useCountUp(loading ? 0 : (scoredStates[0]?.score || 0));

  function getFillColor(state) {
    if (!state) return "#1A0000";
    const base = colorScale(state.score);
    if (mapLayer === "Tier 1 Only" && state.tier !== "Tier 1 Entry") return "#160808";
    // Low-Cal States: high Italian heritage (gelato culture) OR high income (health-conscious)
    if (mapLayer === "Low-Cal States" && state.italianProxy < 50 && state.normalizedIncome < 65) return "#130606";
    return base;
  }

  const LAYER_BUTTONS = ["All States", "Tier 1 Only", "Low-Cal States"];

  return (
    <div>
      {/* ── Header Zone ──────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Module 03</p>
            <h2 className="text-2xl font-semibold text-text-primary">Market Readiness Index</h2>
            <p className="text-sm text-text-secondary mt-1">State-by-state opportunity scoring across 50 US markets</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Google Trends</span>
              <LiveBadge isLive={sLive} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">US Census</span>
              <LiveBadge isLive={cLive} />
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* Top Market */}
          <div className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Top Market</p>
            {loading ? (
              <div className="h-8 w-24 bg-ferrari/10 animate-pulse rounded mt-1" />
            ) : (
              <>
                <p className="text-2xl font-mono font-semibold text-text-primary leading-tight">
                  {animTop}
                </p>
                <p className="text-xs text-text-secondary mt-1 truncate">{scoredStates[0]?.stateName || "—"}</p>
              </>
            )}
          </div>

          {/* National Avg */}
          <div className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">National Avg</p>
            {loading ? (
              <div className="h-8 w-16 bg-ferrari/10 animate-pulse rounded mt-1" />
            ) : (
              <>
                <p className="text-2xl font-mono font-semibold text-text-primary">{animAvg}</p>
                <p className="text-xs text-text-secondary mt-1">composite score</p>
              </>
            )}
          </div>

          {/* Tier 1 States */}
          <div className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Tier 1 States</p>
            {loading ? (
              <div className="h-8 w-12 bg-ferrari/10 animate-pulse rounded mt-1" />
            ) : (
              <>
                <p className="text-2xl font-mono font-semibold text-text-primary">{animTier1}</p>
                <p className="text-xs text-text-secondary mt-1">ready to launch</p>
              </>
            )}
          </div>

          {/* Data Sources */}
          <div className="bg-bg-elevated border border-border rounded-xl p-4 flex flex-col">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Data Sources</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs bg-bg-base border border-border rounded-full px-2 py-0.5 text-text-secondary">Census 2021</span>
              <span className="text-xs bg-bg-base border border-border rounded-full px-2 py-0.5 text-text-secondary">Google Trends</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map Zone ─────────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">

          {/* Map + toolbar */}
          <div className="flex-1 bg-bg-elevated border border-border rounded-2xl overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-xs text-text-muted flex items-center gap-1">
                <MousePointer2 size={12} className="inline" />
                Hover a state to explore · Click to deep dive
              </p>
              <div className="flex items-center gap-1.5">
                {LAYER_BUTTONS.map((label) => (
                  <button
                    key={label}
                    onClick={() => setMapLayer(label)}
                    className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                      mapLayer === label
                        ? "border-ferrari text-ferrari bg-ferrari/10"
                        : "border-border text-text-muted hover:border-ferrari/50 hover:text-text-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map */}
            {loading ? (
              <div className="aspect-video flex flex-col items-center justify-center bg-bg-elevated animate-pulse">
                <Loader2 size={24} className="text-ferrari animate-spin mb-2" />
                <p className="text-xs text-text-muted">Fetching census data and brand trends…</p>
              </div>
            ) : (
              <div
                className="relative"
                style={{ paddingBottom: "55%" }}
                onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
              >
                <ComposableMap
                  projection="geoAlbersUsa"
                  width={900}
                  height={500}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const fips = String(geo.id).padStart(2, "0");
                        const state = scoreMap[fips];
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={getFillColor(state)}
                            stroke="#0A0A0A"
                            strokeWidth={0.4}
                            style={{
                              default: { outline: "none" },
                              hover: { fill: "#FF2020", outline: "none", cursor: "pointer" },
                              pressed: { outline: "none" },
                            }}
                            onMouseEnter={() => state && setHoveredState(state)}
                            onMouseLeave={() => setHoveredState(null)}
                            onClick={() => state && setSelectedState(state)}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {/* F1 City Markers */}
                  {F1_MARKERS.map(({ name, coordinates }) => (
                    <Marker key={name} coordinates={coordinates}>
                      {/* Pulse ring */}
                      <circle r={10} fill="none" stroke="#DC0000" strokeWidth={1}>
                        <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="1" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                      {/* Core dot */}
                      <circle r={6} fill="#DC0000" stroke="#FAFAF8" strokeWidth={1.5} />
                      <text
                        fill="#FAFAF8"
                        fontSize={7}
                        fontWeight="bold"
                        textAnchor="middle"
                        dy={2}
                      >
                        F1
                      </text>
                    </Marker>
                  ))}
                </ComposableMap>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 px-6 py-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Low</span>
                <div className="w-32 h-2 rounded-full" style={{ background: "linear-gradient(to right, #1C1C1C, #4A0000, #DC0000)" }} />
                <span className="text-xs text-text-muted">High</span>
              </div>
              <span className="text-text-muted text-xs">·</span>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Tier 1 Entry", cls: "bg-live/10 text-live border border-live/20" },
                  { label: "Tier 2 Watch", cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
                  { label: "Tier 3 Develop", cls: "bg-border/20 text-text-muted border border-border/40" },
                ].map(({ label, cls }) => (
                  <span key={label} className={`text-xs rounded-full px-2.5 py-0.5 ${cls}`}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel — hidden on mobile, bottom sheet instead */}
          <div className="hidden md:block">
            <StatePanel state={selectedState} onClose={() => setSelectedState(null)} />
          </div>
        </div>
      </div>

      {/* ── Top Markets Zone ──────────────────────────────────────────────── */}
      <div className="border-b border-border pb-6 mb-6">
        <p className="text-lg font-semibold text-text-primary mb-4">Priority Market Ranking</p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-bg-elevated animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {top10.map((state, i) => {
              const isF1 = F1_STATE_NAMES.has(state.stateName);
              const isFirst = i === 0;
              return (
                <div
                  key={state.stateName}
                  onClick={() => setSelectedState(state)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={`bg-bg-elevated border rounded-2xl p-4 cursor-pointer transition-all duration-300
                    hover:border-ferrari/30 hover:shadow-lg hover:shadow-ferrari/5
                    ${isFirst ? "border-ferrari shadow-ferrari/10 shadow-lg ring-1 ring-ferrari/20" : "border-border"}`}
                >
                  {/* Rank */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-6 h-6 rounded-full bg-ferrari/10 text-ferrari font-mono text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-text-primary truncate">{state.stateName}</p>
                  <p className="text-3xl font-mono font-bold text-ferrari leading-none mt-1 mb-2">{state.score}</p>

                  <span className={`text-xs rounded-full px-2 py-0.5 ${getTierClasses(state.tier)}`}>
                    {state.tier}
                  </span>

                  {/* Mini dots */}
                  <div className="flex items-end gap-1.5 mt-3">
                    {[
                      { label: "Brand Interest", value: state.leclercTrend, color: "bg-ferrari" },
                      { label: "Income Index", value: state.normalizedIncome, color: "bg-blue-500" },
                      { label: "Italian Heritage", value: state.italianProxy, color: "bg-emerald-500" },
                    ].map(({ label, value, color }) => {
                      const size = Math.max(5, Math.round((value / 100) * 12));
                      return (
                        <div
                          key={label}
                          title={`${label}: ${value}/100`}
                          className={`rounded-full ${color} opacity-60`}
                          style={{ width: size, height: size }}
                        />
                      );
                    })}
                    {isF1 && <span className="text-xs ml-auto" title="Active F1 Grand Prix">🏁</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Methodology Zone ─────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setShowMethodology((v) => !v)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <Info size={14} />
          How is the score calculated?
          {showMethodology ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div
          style={{
            maxHeight: showMethodology ? (methodologyRef.current?.scrollHeight ?? 400) : 0,
            overflow: "hidden",
            transition: "max-height 300ms ease",
          }}
        >
          <div ref={methodologyRef} className="bg-bg-elevated border border-border rounded-xl p-5 mt-3">
            <div className="space-y-3">
              {[
                { weight: "50%", label: "Leclerc Google Trends", desc: "State-level brand search interest, past 12 months", source: "SerpAPI", color: "text-ferrari" },
                { weight: "30%", label: "Median Household Income", desc: "Normalized index vs national range", source: "US Census ACS 2021", color: "text-blue-400" },
                { weight: "20%", label: "Italian-American Density", desc: "Proprietary index — 100 = highest concentration", source: "Proprietary", color: "text-emerald-400" },
              ].map(({ weight, label, desc, source, color }) => (
                <div key={label} className="flex items-start gap-4">
                  <span className={`text-sm font-mono font-semibold w-10 shrink-0 ${color}`}>{weight}</span>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">{label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{desc} · <span className="italic">{source}</span></p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border text-xs text-text-muted">
              Tiers: <span className="text-live">Tier 1 Entry ≥70</span> · <span className="text-yellow-400">Tier 2 Watch 50–69</span> · <span className="text-text-muted">Tier 3 Develop &lt;50</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tooltip (fixed, follows cursor) ──────────────────────────────── */}
      {hoveredState && (
        <div
          className="fixed z-50 pointer-events-none transition-opacity duration-150"
          style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 10 }}
        >
          <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-2xl shadow-black/50 w-64">
            <p className="text-base font-semibold text-text-primary">{hoveredState.stateName}</p>
            <span className={`inline-flex items-center text-xs rounded-full px-2.5 py-1 mt-1 mb-4 ${getTierClasses(hoveredState.tier)}`}>
              {hoveredState.tier}
            </span>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-mono font-bold text-ferrari">{hoveredState.score}</span>
              <span className="text-lg text-text-muted">/100</span>
            </div>

            <div className="space-y-2.5">
              <MetricBar label="Brand Interest" value={hoveredState.leclercTrend} />
              <MetricBar label="Income Index" value={hoveredState.normalizedIncome} />
              <MetricBar label="Italian Heritage" value={hoveredState.italianProxy} />
            </div>

            {F1_STATE_NAMES.has(hoveredState.stateName) && (
              <span className="inline-flex items-center mt-3 text-xs bg-ferrari/10 text-ferrari rounded-full px-3 py-1 border border-ferrari/20">
                🏁 Active F1 Grand Prix
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Sheet ───────────────────────────────────────────── */}
      {selectedState && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto z-50 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{selectedState.stateName}</h3>
              <span className={`inline-flex text-xs rounded-full px-2.5 py-1 mt-1 ${getTierClasses(selectedState.tier)}`}>
                {selectedState.tier}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-bold text-ferrari">{selectedState.score}</span>
              <span className="text-sm text-text-muted">/100</span>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <MetricBar label="Brand Interest" value={selectedState.leclercTrend} />
            <MetricBar label="Income Index" value={selectedState.normalizedIncome} />
            <MetricBar label="Italian Heritage" value={selectedState.italianProxy} />
          </div>
          <p className="text-xs text-text-secondary mt-4 leading-relaxed">{getEntryStrategy(selectedState)}</p>
          <button
            onClick={() => setSelectedState(null)}
            className="mt-4 w-full text-xs text-text-muted border border-border rounded-full py-2 hover:border-ferrari transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
