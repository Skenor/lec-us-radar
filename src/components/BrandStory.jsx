import { useState } from "react";
import { Quote } from "lucide-react";
import { lecBrandData } from "../data/fallbackData";

const STORAGE_KEY = "lec-brand-story-open";

export default function BrandStory() {
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  };

  const stats = [
    { value: lecBrandData.revenueYear1Formatted, label: "Year 1 Revenue" },
    { value: String(5), label: "Flavors" },
    { value: String(lecBrandData.markets.length), label: "Countries" },
    { value: "130–150", label: "Kcal/100g" },
  ];

  return (
    <div className="bg-bg-elevated border border-border rounded-2xl overflow-hidden">
      {/* Header bar always visible */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="w-0.5 h-4 bg-ferrari" />
          <span className="text-sm font-semibold text-text-primary">LEC — The Brand Story</span>
          <span className="text-xs text-text-muted font-mono italic ml-1">"{lecBrandData.tagline}"</span>
        </div>
        <button
          onClick={toggle}
          className="text-xs text-text-muted hover:text-text-primary transition-colors ml-4 shrink-0"
        >
          {open ? "Hide brand overview ↑" : "Show brand overview ↓"}
        </button>
      </div>

      {/* Collapsible content */}
      {open && (
        <div className="border-t border-border px-4 sm:px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Col 1 — Origin Story */}
          <div>
            <Quote size={18} className="text-ferrari mb-2" />
            <p className="text-sm text-text-primary italic leading-relaxed mb-3">
              "Born on the track — Charles couldn't eat gelato during race weekends without breaking his diet. So he built one he could."
            </p>
            <p className="text-xs text-text-muted">— Charles Leclerc, 2024</p>
            <p className="text-xs text-text-secondary mt-3 leading-relaxed">{lecBrandData.originStory}</p>
            <p className="text-xs text-text-muted mt-2">Founded: <span className="text-text-secondary">{lecBrandData.founded}</span></p>
          </div>

          {/* Col 2 — By The Numbers */}
          <div>
            <p className="text-xs uppercase tracking-widest text-text-secondary mb-4">By The Numbers</p>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-mono text-ferrari text-2xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-text-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 space-y-1">
              <p className="text-xs text-text-secondary">
                <span className="text-text-muted">Markets: </span>
                {lecBrandData.markets.join(" · ")}
              </p>
              <p className="text-xs text-text-secondary">
                <span className="text-text-muted">Sweeteners: </span>
                {lecBrandData.sweeteners}
              </p>
              <p className="text-xs text-text-secondary">
                <span className="text-text-muted">Fiber: </span>
                {lecBrandData.fiberHighlight}
              </p>
            </div>
          </div>

          {/* Col 3 — The Team */}
          <div>
            <p className="text-xs uppercase tracking-widest text-text-secondary mb-4">The Team</p>
            <div className="space-y-3">
              {lecBrandData.founders.map((f) => (
                <div key={f.name} className="flex flex-col">
                  <span className="font-semibold text-sm text-text-primary">{f.name}</span>
                  <span className="text-xs text-text-muted">{f.role}</span>
                  <span className="text-xs text-text-secondary italic">{f.note}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
