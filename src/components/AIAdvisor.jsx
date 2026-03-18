import { useState, useRef, useEffect } from "react";
import { Send, RotateCcw } from "lucide-react";
import LiveBadge from "./LiveBadge";

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

const SYSTEM_PROMPT = `You are a senior market entry strategist specializing in premium food & beverage brands expanding into the US. You are advising LEC — an Italian low-calorie gelato brand (max 150 kcal/100g, -32% vs market average) co-founded by Charles Leclerc (F1 driver) and Federico Grom (founder of Grom gelato, Italy's iconic artisan gelato chain). Currently present in Italy, France, UK, and Monaco. Target: US market within 5 years. US Competitors: Halo Top (owned by Wells Enterprises), Enlightened, Nick's Swedish Ice Cream, Arctic Zero, Yasso. Recommended entry channel hierarchy: Whole Foods > Erewhon > Sprouts > Trader Joe's > Target/Kroger. F1 US boom post Drive to Survive (Netflix): Austin TX (COTA race), Miami FL (Miami GP), Las Vegas NV (Las Vegas GP) = highest fan density. Italian-American concentration: NY, NJ, MA, IL, CA. Respond directly, strategically, specifically. Never generic. Max 3 paragraphs. Always give recommendations with real numbers and concrete brand/retailer names. VERIFIED LEC DATA: 5 flavors available — Vanillove (130 kcal/100g), Salty Carammmel (140 kcal/100g), Swirly Pistachi-oh! (148 kcal/100g), Peanut Caramel Tango (150 kcal/100g), Chocolate Crunch (130 kcal/100g). Format: 460ml jar. Year 1 revenue: €3M (April–December 2024). Italian distribution: Esselunga, Iper, Bennet, Despar, Eurospar, Iperal, Unes + Gopuff delivery. Technical differentiation: erythritol + stevia sweeteners, 9-11g fiber per 100g, up to 60% less fat vs market. Official tagline: "Why resist?". Co-founders: Charles Leclerc (Ferrari F1 driver), Federico Grom (ex-founder Grom gelato), Guido Martinetti (ex-founder Grom gelato), Nicolas Todt (Leclerc's historic manager). Origin story: born from Leclerc's frustration of not being able to eat gelato during race weekends without breaking his physical condition.`;

const CHIPS = [
  { label: "Revenue target US anno 1?", icon: "📈" },
  { label: "Quale gusto lanciare prima?", icon: "🍦" },
  { label: "Equivalente Erewhon / Gopuff in USA?", icon: "🏪" },
];

const FALLBACK_ANSWERS = {
  "Revenue target US anno 1?": `Based on LEC's €3M Italian revenue in 8 months (April–December 2024) with a single-country footprint, a realistic US Year 1 target is $2.5–4M — achievable with 3-city launch across Austin, Miami, and Los Angeles. The math: 60 Whole Foods doors × 6 SKUs × $4.99 avg × 8 units/day velocity = ~$4.3M annualized at full distribution. Conservative estimate accounts for 6-month ramp-up and ~50% door compliance.\n\nThe key benchmark is Halo Top's first US year: $2.4M at 500 doors (2013). LEC has structural advantages — celebrity co-founder, existing European proof points, and a $2.3B category with weakening incumbents. Price at $6.99–7.99 at Erewhon (12 locations) and $4.99 at Whole Foods. Target $1.8M from premium channel + $1.2M from Whole Foods in Year 1.\n\nFundraising implication: $3M+ Year 1 US revenue on top of €3M EU positions LEC for a $15–20M Series A in 2026 at a 4–5x revenue multiple. The narrative writes itself — Italian brand with Ferrari-level brand equity entering a market with no authentic artisan gelato at sub-150 kcal.`,
  "Quale gusto lanciare prima?": `Launch with Vanillove (130 kcal) and Chocolate Crunch (130 kcal) as your hero SKUs — tied for lowest calorie count, broadest consumer appeal, and easiest flavor comparison story vs Halo Top's vanilla (320 kcal). Vanilla is the #1 best-selling ice cream flavor in the US (28% market share) and the category benchmark consumers use to evaluate new brands.\n\nChocolate Crunch is the differentiator — 130 kcal with 11g fiber and a "crunch" texture cue that signals premium quality and stands out on shelf. In Whole Foods buyer pitches, lead with the chocolate: "Same calories as a Greek yogurt, actual chocolate gelato texture." That's a category-redefining claim.\n\nHold Swirly Pistachi-oh! and Peanut Caramel Tango for Month 4+ as "flavor drops" — limited availability drives urgency and social content. Erewhon shoppers will post about a pistachio gelato at 148 kcal. Salty Carammmel is your Q4 holiday SKU. Running all 5 from day one dilutes focus and increases supply chain complexity — 2 SKUs, perfect execution, then expand.`,
  "Equivalente Erewhon / Gopuff in USA?": `Erewhon equivalent: Erewhon itself — there is no true US equivalent for ultra-premium experiential grocery, which is exactly why it's the right entry point. 12 LA locations, $250K+ avg household income, 4.8★ average. LEC should target Erewhon Silver Lake and Venice Beach first (highest foot traffic, strongest social UGC). Erewhon's "immunity shot" section is the proof point — $18 wellness shots move 200+ units/day. A $7.99 premium gelato can do the same.\n\nGopuff equivalent: Gopuff operates in 500+ US cities — it IS the US equivalent. LEC is already in their Italian catalog model. The US Gopuff pitch is straightforward: "We're already live on your Italian platform, here's the sell-through data, we want US pilot in Austin/Miami/LA." Gopuff's average delivery basket is $35 — a $6.99 LEC impulse add is perfect. Also target DoorDash Convenience and Instacart Express for premium frozen delivery.\n\nBonus channel: FreshDirect (NYC/Philadelphia/DC) and Good Eggs (Bay Area) — premium delivery grocers with European import programs and health-conscious subscribers. These move slower than Gopuff but build the premium positioning that protects Erewhon/Whole Foods pricing.`,
};

/* ── LEC AI Avatar Icon ────────────────────────────────────────── */
function LECIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="14" fill="#DC0000" />
      {/* Gelato scoop */}
      <ellipse cx="14" cy="13" rx="5.5" ry="5" fill="white" fillOpacity="0.95" />
      {/* Cone */}
      <path d="M10.5 17.5 L14 24 L17.5 17.5 Z" fill="white" fillOpacity="0.7" />
      {/* Sparkle top */}
      <circle cx="14" cy="8.5" r="1.2" fill="white" />
      <line x1="14" y1="6" x2="14" y2="7.2" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <line x1="11.7" y1="6.7" x2="12.6" y2="7.6" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <line x1="16.3" y1="6.7" x2="15.4" y2="7.6" stroke="white" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ── Typing dots ───────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-ferrari animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Ciao — I'm your LEC US Market Entry Advisor, trained on verified LEC brand data. Ask me anything about launch strategy, retailers, pricing, or flavors. Use the chips below to get started.",
};

export default function AIAdvisor() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const prevLenRef = useRef(1);
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLenRef.current = messages.length;
  }, [messages]);

  async function animateResponse(text, messageIndex) {
    let current = "";
    let i = 0;
    return new Promise((resolve) => {
      const id = setInterval(() => {
        if (i >= text.length) {
          clearInterval(id);
          resolve();
          return;
        }
        const chunk = Math.floor(Math.random() * 3) + 1;
        current += text.slice(i, i + chunk);
        i += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[messageIndex] = { ...updated[messageIndex], content: current, typing: i < text.length };
          return updated;
        });
      }, 12);
    });
  }

  async function sendMessage(userText) {
    if (!userText.trim() || loading) return;
    const userMsg = { role: "user", content: userText };
    const aiPlaceholder = { role: "assistant", content: "", typing: true, pending: true };
    const newMessages = [...messages, userMsg, aiPlaceholder];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const aiIndex = newMessages.length - 1;

    const fallbackKey = Object.keys(FALLBACK_ANSWERS).find(
      (k) => k.toLowerCase() === userText.toLowerCase()
    );

    if (!ANTHROPIC_KEY) {
      const fallbackText = fallbackKey
        ? FALLBACK_ANSWERS[fallbackKey]
        : "For optimal US market entry, LEC should prioritize Austin TX, Miami FL, and Los Angeles — lead with Erewhon for proof-of-concept, then Whole Foods at scale. Price at $7.99 at premium retailers, $4.99 at Whole Foods. Target $2.5–3M Year 1 US revenue.";
      setLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        updated[aiIndex] = { ...updated[aiIndex], pending: false };
        return updated;
      });
      await animateResponse(fallbackText, aiIndex);
      return;
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [...messages, userMsg]
            .filter((m) => m.role === "user" || (m.role === "assistant" && m.content))
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("API call failed");
      const data = await res.json();
      const text = data.content?.[0]?.text || "No response received.";
      setIsLive(true);
      setLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        updated[aiIndex] = { ...updated[aiIndex], pending: false };
        return updated;
      });
      await animateResponse(text, aiIndex);
    } catch {
      const fallbackText = fallbackKey
        ? FALLBACK_ANSWERS[fallbackKey]
        : "For US market entry, prioritize Austin, Miami, and LA — lead with Erewhon and Whole Foods placement, and use Charles Leclerc's event appearances as zero-cost earned media anchors.";
      setLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        updated[aiIndex] = { ...updated[aiIndex], pending: false };
        return updated;
      });
      await animateResponse(fallbackText, aiIndex);
    }
  }

  function handleChip({ label }) {
    setInput(label);
    setTimeout(() => sendMessage(label), 80);
  }

  function handleReset() {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setIsLive(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const showChips = messages.length <= 2 && !loading;

  return (
    <div className="flex flex-col h-[500px] sm:h-[580px] bg-bg-elevated border border-border rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface shrink-0">
        <div className="flex items-center gap-2.5">
          <LECIcon size={28} />
          <div>
            <p className="text-sm font-semibold text-text-primary leading-none mb-0.5">LEC Strategy Advisor</p>
            <p className="text-xs text-text-muted">Powered by Claude · LEC verified data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge isLive={isLive} />
          {messages.length > 1 && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-text-muted hover:text-ferrari hover:bg-ferrari/10 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

            {msg.role === "assistant" && (
              <div className="shrink-0 mb-0.5">
                <LECIcon size={22} />
              </div>
            )}

            <div className={`max-w-[80vw] sm:max-w-[72%] ${msg.role === "user" ? "order-first" : ""}`}>
              {msg.pending ? (
                <div className="bg-bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <TypingDots />
                </div>
              ) : msg.role === "assistant" ? (
                <div className="bg-bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-text-primary leading-relaxed">
                  <span className="whitespace-pre-line">
                    {msg.content}
                    {msg.typing && (
                      <span className="inline-block w-0.5 h-[1em] bg-ferrari ml-0.5 animate-pulse align-middle" />
                    )}
                  </span>
                </div>
              ) : (
                <div className="bg-ferrari rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-line">
                  {msg.content}
                </div>
              )}
            </div>

          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips */}
      {showChips && (
        <div className="px-4 pb-3 shrink-0">
          <p className="text-xs text-text-muted mb-2">Suggerimenti</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleChip(chip)}
                disabled={loading}
                className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 text-xs text-text-secondary hover:border-ferrari hover:text-ferrari hover:bg-ferrari/5 transition-all cursor-pointer disabled:opacity-50 text-left"
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-4 py-3 flex gap-2.5 shrink-0 bg-bg-surface">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about strategy, retailers, pricing…"
          disabled={loading}
          className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ferrari transition-colors text-text-primary placeholder:text-text-muted disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-ferrari hover:bg-red-700 text-white rounded-xl px-4 py-2.5 transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1.5"
        >
          <Send size={14} />
        </button>
      </div>

    </div>
  );
}
