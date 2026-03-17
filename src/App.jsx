import { useState, useEffect } from "react";
import Header from "./components/Header";
import CompetitiveLandscape from "./components/CompetitiveLandscape";
import RetailerScore from "./components/RetailerScore";
import LeclercMap from "./components/LeclercMap";
import CommunityPulse from "./components/CommunityPulse";
import AIAdvisor from "./components/AIAdvisor";
import BrandStory from "./components/BrandStory";

export default function App() {
  const [anyLive, setAnyLive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const liveEls = document.querySelectorAll(".text-live");
      if (liveEls.length > 0) setAnyLive(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-bg-base">
      <Header anyLive={anyLive} />
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 xl:px-8 py-4 sm:py-6 pt-18 sm:pt-20 space-y-4 sm:space-y-6">
        <BrandStory />

        <section className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-semibold text-base sm:text-lg text-text-primary">Competitive Landscape</h2>
          </div>
          <CompetitiveLandscape />
        </section>

        <section className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-semibold text-base sm:text-lg text-text-primary">Retail Entry Map</h2>
          </div>
          <RetailerScore />
        </section>

        <section className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-semibold text-base sm:text-lg text-text-primary">Market Readiness Index</h2>
          </div>
          <LeclercMap />
        </section>

        <section className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-semibold text-base sm:text-lg text-text-primary">Community Pulse</h2>
          </div>
          <CommunityPulse />
        </section>

        <section className="bg-bg-surface border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-semibold text-base sm:text-lg text-text-primary">AI Market Entry Advisor</h2>
          </div>
          <AIAdvisor />
        </section>

        <footer className="text-center text-text-muted text-xs py-8 border-t border-border mt-4">
          <p>LEC US Entry Radar · Market Intelligence Dashboard · Confidential</p>
          <p className="mt-1">Data sources: Open Food Facts · US Census ACS 2021 · Reddit · YouTube · NewsAPI · SerpAPI · Kroger API · Yelp Fusion</p>
        </footer>
      </main>
    </div>
  );
}
