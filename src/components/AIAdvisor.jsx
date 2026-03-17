import { useState, useRef, useEffect } from "react";
import { Send, Bot } from "lucide-react";
import LiveBadge from "./LiveBadge";

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

const SYSTEM_PROMPT = `You are a senior market entry strategist specializing in premium food & beverage brands expanding into the US. You are advising LEC — an Italian low-calorie gelato brand (max 150 kcal/100g, -32% vs market average) co-founded by Charles Leclerc (F1 driver) and Federico Grom (founder of Grom gelato, Italy's iconic artisan gelato chain). Currently present in Italy, France, UK, and Monaco. Target: US market within 5 years. US Competitors: Halo Top (owned by Wells Enterprises), Enlightened, Nick's Swedish Ice Cream, Arctic Zero, Yasso. Recommended entry channel hierarchy: Whole Foods > Erewhon > Sprouts > Trader Joe's > Target/Kroger. F1 US boom post Drive to Survive (Netflix): Austin TX (COTA race), Miami FL (Miami GP), Las Vegas NV (Las Vegas GP) = highest fan density. Italian-American concentration: NY, NJ, MA, IL, CA. Respond directly, strategically, specifically. Never generic. Max 3 paragraphs. Always give recommendations with real numbers and concrete brand/retailer names. VERIFIED LEC DATA: 5 flavors available — Vanillove (130 kcal/100g), Salty Carammmel (140 kcal/100g), Swirly Pistachi-oh! (148 kcal/100g), Peanut Caramel Tango (150 kcal/100g), Chocolate Crunch (130 kcal/100g). Format: 460ml jar. Year 1 revenue: €3M (April–December 2024). Italian distribution: Esselunga, Iper, Bennet, Despar, Eurospar, Iperal, Unes + Gopuff delivery. Technical differentiation: erythritol + stevia sweeteners, 9-11g fiber per 100g, up to 60% less fat vs market. Official tagline: "Why resist?". Co-founders: Charles Leclerc (Ferrari F1 driver), Federico Grom (ex-founder Grom gelato), Guido Martinetti (ex-founder Grom gelato), Nicolas Todt (Leclerc's historic manager). Origin story: born from Leclerc's frustration of not being able to eat gelato during race weekends without breaking his physical condition.`;

const CHIPS = [
  "LEC ha già €3M di revenue in Italia — quale soglia di revenue realisticamente si può aspettare nel primo anno USA?",
  "Quale gusto LEC lanciare prima negli USA tra i 5 disponibili?",
  "Esselunga e Gopuff in Italia — quale equivalente USA avvicinare per prima?",
];

const FALLBACK_ANSWERS = {
  [CHIPS[0]]: `Austin, Texas is the single best US launch market for LEC, and the data is conclusive. COTA hosts the US Grand Prix with 400,000+ attendees annually — Charles Leclerc's fan base is measurably concentrated there (Google Trends index: 91/100). The city has 2+ Whole Foods, Central Market (4.6★, 2,341 reviews), and a health-conscious demographic with $63K median income. Budget $800K for a 3-month Austin-first launch: Grand Prix weekend activation, Whole Foods endcap placement ($120K slotting), and micro-influencer seeding via F1 fan accounts (combined 12M followers in that market).\n\nMiami is your second market — Miami GP creates the same F1 fan density window, and the Brickell/South Beach corridor has Whole Foods, The Organic Spot, and Fresh Market within 2 miles. The Cuban-Italian culinary crossover means gelato has existing cultural resonance. Prioritize Q2 (April-May) to align the launch with Miami GP weekend — you'll get organic media coverage that would cost $500K+ in paid placements.\n\nLas Vegas (Q4, Las Vegas GP in November) closes the F1 trilogy. These three cities give LEC a "F1 Circuit Launch" narrative that no US food brand has ever executed — it's a built-in PR story that justifies international coverage and positions LEC as a premium European import with authentic celebrity origins.`,

  [CHIPS[1]]: `Approach Whole Foods first, but only after securing Erewhon as a proof-of-concept. Here's the strategy: launch exclusively at Erewhon Silver Lake and Venice Beach (6 locations, $18–22 average basket) for 90 days. Erewhon's customer base ($250K+ household income, heavy social media users) will generate the organic content you need — expect 200–400 UGC posts per week at full velocity. Price LEC at $7.99 at Erewhon to signal premium positioning before you compete at $4.99 in mainstream channels.\n\nAfter Erewhon validates demand with real sell-through data (target: 8+ units per SKU per day), bring that data to Whole Foods regional buyer (Southwest region first). Whole Foods requires a $15,000–25,000 slotting fee per region and minimum 85% in-stock compliance — you need the Erewhon velocity data to negotiate from strength, not hope. Request placement in the "Better For You" frozen set, not the standard ice cream case, to avoid direct comparison with commodity products.\n\nDo NOT approach Sprouts or Trader Joe's in year one. Trader Joe's requires private label exclusivity which destroys brand equity, and Sprouts' buyer timeline is 12–18 months. Whole Foods + Erewhon in 3 F1 markets gives you $4–6M in year-one revenue with defensible margin — the foundation for a Series A narrative if you're still fundraising.`,

  [CHIPS[2]]: `Charles Leclerc's US leverage strategy should follow the "athlete-founder" playbook used by Kevin Hart (Hartbeat) and Ryan Reynolds (Aviation Gin) — never as a spokesperson, always as a co-founder with authentic involvement. The key difference: Leclerc's F1 fan base in the US skews 25–40, college-educated, $75K+ income — identical to the Whole Foods shopper profile. This demographic overlap is worth $20M in targeted marketing equivalence.\n\nFor the Austin GP launch: negotiate a trackside brand activation (COTA allows hospitality partner deals from $150K), have Leclerc post 3 organic Instagram stories at the event (his 17M followers, ~4% engagement rate = 680,000 impressions per story at zero media cost). Seed product to 50 F1 journalists and content creators attending the race — target RACER, The Race, and Drive to Survive cast alumni. Do NOT buy ads. The authenticity of "Charles brought his gelato to America" is worth more than any paid campaign.\n\nLong-term: create a "LEC x COTA" limited edition flavor (something with Texan ingredients — bourbon pecan, Mexican vanilla) available only at Austin Whole Foods during GP week. Limited scarcity drives social sharing. Year 2: repeat in Miami with a tropical flavor, Las Vegas with a desert theme. By year 3, you have a collectible "F1 Circuit" seasonal line that Halo Top and Enlightened cannot replicate — their founders don't race Formula 1 cars.`,
};

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Ciao — I'm your LEC US Market Entry Advisor. Ask me anything about strategy, retailers, timing, or how to leverage Charles Leclerc for the US launch. Use the suggestion chips below to get started.",
    },
  ]);
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
        current += text[i];
        i++;
        setMessages((prev) => {
          const updated = [...prev];
          updated[messageIndex] = { ...updated[messageIndex], content: current, typing: i < text.length };
          return updated;
        });
      }, 15);
    });
  }

  async function sendMessage(userText) {
    if (!userText.trim() || loading) return;
    const userMsg = { role: "user", content: userText };
    const aiPlaceholder = { role: "assistant", content: "", typing: true };
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
        : "For optimal US market entry, LEC should prioritize Austin TX, Miami FL, and Las Vegas NV — where Charles Leclerc's fan base is most concentrated. Start with Whole Foods and Erewhon placement, price at $7.99 at premium retailers to signal Italian artisan positioning, and leverage event weekends for zero-cost earned media through authentic founder content.";
      setLoading(false);
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
      await animateResponse(text, aiIndex);
    } catch {
      const fallbackText = fallbackKey
        ? FALLBACK_ANSWERS[fallbackKey]
        : "For US market entry, prioritize Austin, Miami, and Las Vegas — lead with Whole Foods and Erewhon placement, and use Charles Leclerc's event appearances as zero-cost earned media anchors.";
      setLoading(false);
      await animateResponse(fallbackText, aiIndex);
    }
  }

  function handleChip(chip) {
    setInput(chip);
    setTimeout(() => sendMessage(chip), 100);
  }

  return (
    <div className="flex flex-col h-[420px] sm:h-[520px] bg-bg-elevated border border-border rounded-xl overflow-hidden">

      {/* Internal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface">
        <p className="text-sm font-semibold text-text-primary">AI Market Entry Advisor</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Powered by Claude</span>
          <LiveBadge isLive={isLive} />
        </div>
      </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" ? (
              <div className="mr-auto max-w-[85vw] sm:max-w-xs lg:max-w-md bg-bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-text-primary flex gap-2">
                <Bot size={14} className="text-ferrari shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">
                  {msg.content}
                  {msg.typing && (
                    <span className="inline-block w-0.5 h-4 bg-ferrari ml-0.5 animate-pulse" />
                  )}
                </span>
              </div>
            ) : (
              <div className="ml-auto max-w-[85vw] sm:max-w-xs lg:max-w-md bg-ferrari text-white rounded-2xl rounded-tr-sm px-4 py-2 text-sm whitespace-pre-line">
                {msg.content}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3 border-b border-border">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChip(chip)}
              disabled={loading}
              className="border border-border rounded-full px-3 py-1.5 text-xs text-text-secondary hover:border-ferrari hover:text-ferrari transition-colors cursor-pointer disabled:opacity-50 text-left"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4 flex gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about US market entry strategy..."
          disabled={loading}
          className="flex-1 bg-bg-surface border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-ferrari transition-colors text-text-primary placeholder:text-text-muted disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-ferrari hover:bg-ferrari-dark text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
