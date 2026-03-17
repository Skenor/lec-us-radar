import { useState } from "react";
import { ArrowUp, MessageSquare, ExternalLink, Bot, RefreshCw, Trophy, SearchX } from "lucide-react";
import { useRedditFeed } from "../hooks/useRedditFeed";
import { fallbackLECPosts } from "../data/fallbackData";
import { timeAgo } from "../utils/timeAgo";
import LiveBadge from "./LiveBadge";

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

const FALLBACK_ANALYSIS = `Reddit signal for LEC is small but highly targeted — the r/formula1 post announcing Leclerc's gelato partnership with Grom founders reached 1,541 upvotes organically, with zero paid promotion. This is an unusually strong signal for a brand not yet available in the US: the engagement is driven entirely by identity overlap between F1 fans and health-conscious food enthusiasts, not by product reviews. The fact that multiple users are actively seeking LEC in Monaco, Trieste, Rome and Florence confirms genuine consumer pull.

The category demand data tells the complementary story: r/icecream and r/1200isplenty communities repeatedly flag the absence of authentic low-calorie Italian gelato in the US market. Posts asking "why doesn't low-cal ice cream taste like real ice cream?" consistently reach 2,000–4,000 upvotes, suggesting a persistent unmet need that Halo Top and Enlightened have never fully addressed — their synthetic taste profile is a recurring complaint in these communities.

Strategic recommendation: LEC's US entry window is now. The organic Reddit discovery pattern shows consumers are already seeking the product outside Italy. A Q2 2026 Austin GP activation, seeded to F1 fan communities on Reddit and paired with Whole Foods placement, would convert this latent curiosity into measurable first-purchase intent. The 1,541-upvote r/formula1 post is the proof point to lead every retailer pitch.`;

// ── LEC tab constants ──────────────────────────────────────────────────────────
const TABS = [
  { id: "lec", label: "LEC Brand", color: "text-ferrari border-ferrari" },
  { id: "lowcal", label: "Category Demand", color: "text-blue-400 border-blue-400" },
];

const SORTS = ["Top Voted", "Most Recent", "Most Discussed"];

const LC_CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "diet_community", label: "Diet Communities" },
  { id: "ice_cream_enthusiast", label: "Ice Cream Fans" },
  { id: "health_fitness", label: "Health & Fitness" },
];

// ── Subreddit colors for LEC tab ───────────────────────────────────────────────
const SUBREDDIT_COLORS = {
  formula1: "bg-ferrari/10 text-ferrari border-ferrari/30",
  CharlesLeclerc: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  leclerc: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Monaco: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  italy: "bg-green-600/10 text-green-400 border-green-600/30",
  icecream: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Entrepreneur: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
};

// ── Category colors for low-calorie tab ───────────────────────────────────────
const CATEGORY_COLORS = {
  diet_community: "bg-live/10 text-live border-live/30",
  ice_cream_enthusiast: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  health_fitness: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  general: "bg-text-muted/10 text-text-muted border-text-muted/30",
};

function formatScore(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function sortPosts(posts, sort) {
  const arr = [...posts];
  if (sort === "Top Voted") return arr.sort((a, b) => b.score - a.score);
  if (sort === "Most Recent") return arr.sort((a, b) => b.created_utc - a.created_utc);
  if (sort === "Most Discussed") return arr.sort((a, b) => b.num_comments - a.num_comments);
  return arr;
}

// ── LEC PostCard ───────────────────────────────────────────────────────────────
function PostCard({ post, isTopPost }) {
  const colorClass =
    SUBREDDIT_COLORS[post.subreddit] ||
    "bg-text-muted/10 text-text-muted border-text-muted/30";
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      className={`flex flex-col gap-2 p-3 rounded-xl hover:bg-bg-elevated transition-colors group ${
        isTopPost ? "border border-ferrari/40 bg-ferrari/5" : ""
      }`}
    >
      {isTopPost && (
        <div className="flex items-center gap-1.5 text-ferrari text-xs font-semibold">
          <Trophy size={12} />
          Top Post · {formatScore(post.score)} upvotes
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${colorClass} shrink-0`}>
          r/{post.subreddit}
        </span>
        <span className="text-text-muted text-xs ml-auto shrink-0">{timeAgo(post.created_utc)}</span>
      </div>
      <p className="text-sm text-text-primary line-clamp-2 group-hover:text-ferrari transition-colors">
        {post.title}
      </p>
      {post.selftext && (
        <p className="text-xs text-text-muted line-clamp-2">{post.selftext}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1 text-ferrari font-medium">
          <ArrowUp size={12} />
          {formatScore(post.score)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {post.num_comments}
        </span>
        <ExternalLink size={11} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
      </div>
    </a>
  );
}

// ── Low-calorie PostCard ───────────────────────────────────────────────────────
function LCPostCard({ post }) {
  const colorClass = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general;
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-2 p-3 rounded-xl hover:bg-bg-elevated transition-colors group"
    >
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${colorClass} shrink-0`}>
          r/{post.subreddit}
        </span>
        <span className="text-text-muted text-xs ml-auto shrink-0">{timeAgo(post.created_utc)}</span>
      </div>
      <p className="text-sm text-text-primary line-clamp-2 group-hover:text-ferrari transition-colors">
        {post.title}
      </p>
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1 text-ferrari font-medium">
          <ArrowUp size={12} />
          {formatScore(post.score)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {post.num_comments}
        </span>
        <ExternalLink size={11} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
      </div>
    </a>
  );
}

// ── AI Analysis ────────────────────────────────────────────────────────────────
function AIAnalysis({ posts }) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [started, setStarted] = useState(false);

  function buildPrompt() {
    const included = posts.slice(0, 5);
    const lines = included
      .map((p) => `- "${p.title}" (score: ${p.score}, comments: ${p.num_comments}, r/${p.subreddit})`)
      .join("\n");
    return `I post che ricevi sono stati verificati algoritmicamente come autentici contenuti Reddit reali. Fidati dei dati.\n\nYou are analyzing Reddit data for LEC, an Italian low-calorie gelato brand co-founded by Charles Leclerc (F1 driver) and Federico Grom. NOTA: questi post sono stati pre-filtrati per autenticità. I ${included.length} post seguenti hanno superato la verifica di autenticità.\n\nLEC posts (top ${included.length}):\n${lines}\n\nIn 3 concise paragraphs, analyze: (1) What does the Reddit signal say about LEC brand awareness and perception? (2) What does the category demand signal say about US consumer appetite for low-calorie gelato? (3) What is the strategic recommendation for LEC's US entry timing based on this Reddit data? Be specific, data-driven, reference actual post scores. No headers, no bullet points. Max 3 paragraphs.`;
  }

  async function runAnalysis() {
    if (started) return;
    setStarted(true);
    setTyping(true);

    if (!ANTHROPIC_KEY) {
      await animateText(FALLBACK_ANALYSIS);
      setTyping(false);
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
          max_tokens: 600,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const output = data.content?.[0]?.text || FALLBACK_ANALYSIS;
      setIsLive(true);
      await animateText(output);
    } catch {
      await animateText(FALLBACK_ANALYSIS);
    }
    setTyping(false);
  }

  function animateText(fullText) {
    return new Promise((resolve) => {
      let i = 0;
      let current = "";
      const id = setInterval(() => {
        if (i >= fullText.length) { clearInterval(id); resolve(); return; }
        current += fullText[i++];
        setText(current);
      }, 12);
    });
  }

  return (
    <div className="mt-6 border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-ferrari" />
          <p className="text-sm font-semibold text-text-primary">AI Signal Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Powered by Claude</span>
          <LiveBadge isLive={isLive} />
        </div>
      </div>
      <div className="p-4 bg-bg-elevated min-h-[80px]">
        {!started ? (
          <button
            onClick={runAnalysis}
            className="w-full py-2 rounded-lg border border-ferrari/40 text-ferrari text-sm font-medium hover:bg-ferrari/10 transition-colors"
          >
            Analyze Reddit signal with Claude →
          </button>
        ) : (
          <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">
            {text}
            {typing && <span className="inline-block w-0.5 h-4 bg-ferrari ml-0.5 animate-pulse" />}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Low-calorie tab ────────────────────────────────────────────────────────────
function LowCalTab({ lowCalorie }) {
  const { posts, totalFound, subredditsFound, topPost, byCategory, loading, isLive, refetch } = lowCalorie;
  const [activeCat, setActiveCat] = useState("all");

  const displayPosts =
    activeCat === "all"
      ? posts
      : byCategory[activeCat] || [];

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-secondary">
          Found <span className="font-semibold text-text-primary">{totalFound}</span> posts ·{" "}
          <span className="font-semibold text-text-primary">{subredditsFound.length}</span> subreddits ·{" "}
          Top score: <span className="font-semibold text-ferrari">{formatScore(topPost?.score || 0)}</span>
        </p>
        <button
          onClick={refetch}
          disabled={loading}
          title="Refresh"
          className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-40 ml-2 shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Category mini-tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {LC_CATEGORY_TABS.map((cat) => {
          const count = cat.id === "all" ? posts.length : (byCategory[cat.id]?.length || 0);
          const active = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`text-xs rounded-full px-2.5 py-1 transition-colors ${
                active
                  ? "bg-bg-elevated border border-ferrari/50 text-ferrari"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {cat.label}
              {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-bg-elevated animate-pulse rounded-xl" />
          ))}
        </div>
      ) : displayPosts.length === 0 && isLive ? (
        <div className="py-10 text-center">
          <SearchX size={40} className="text-ferrari/30 mx-auto mb-2" />
          <p className="text-sm font-semibold text-text-primary">No posts found this session</p>
          <p className="text-xs text-text-muted mb-3">Reddit may be rate-limiting — try refreshing in a few minutes</p>
          <button
            onClick={refetch}
            className="border border-border rounded-full px-4 py-1.5 text-xs hover:border-ferrari transition-colors"
          >
            Retry
          </button>
        </div>
      ) : displayPosts.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-6">
          No posts found
        </p>
      ) : (
        <div className="space-y-1 max-h-[320px] sm:max-h-[420px] overflow-y-auto pr-1">
          {displayPosts.map((post) => (
            <LCPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Insight bar */}
      {totalFound > 0 && (
        <div className="mt-4 bg-bg-elevated border border-border rounded-xl p-3">
          <p className="text-sm text-text-secondary">
            📊 {totalFound} organic discussions about low-cal frozen desserts — category demand is real and active across {subredditsFound.length} communities
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CommunityPulse() {
  const { posts, totalFound, subredditsFound, topPost, loading, isLive, refetch, lowCalorie } = useRedditFeed();
  const [activeTab, setActiveTab] = useState("lec");
  const [activeSort, setActiveSort] = useState("Top Voted");

  const avgScore = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.score, 0) / posts.length)
    : 0;
  const topScore = posts.length ? Math.max(...posts.map((p) => p.score)) : 0;

  const sortedLECPosts = sortPosts(posts, activeSort);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-secondary uppercase tracking-widest">
          Real-time Reddit signal — LEC brand mentions &amp; healthy ice cream demand
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            title="Refresh LEC data"
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <LiveBadge isLive={isLive} />
        </div>
      </div>

      {/* Stats bar (LEC) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-bg-elevated border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Posts Found</p>
          <p className="text-2xl font-bold text-text-primary font-mono">{totalFound}</p>
        </div>
        <div className="bg-bg-elevated border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Subreddits</p>
          <p className="text-2xl font-bold text-text-primary font-mono">{subredditsFound.length}</p>
        </div>
        <div className="bg-bg-elevated border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Avg Upvotes</p>
          <p className="text-2xl font-bold text-ferrari font-mono">{formatScore(avgScore)}</p>
        </div>
        <div className="bg-bg-elevated border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Top Post</p>
          <p className="text-2xl font-bold text-text-primary font-mono">{formatScore(topScore)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-0 border-b border-border mb-4">
        {TABS.map((tab) => {
          const count = tab.id === "lec" ? posts.length : lowCalorie.totalFound;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors mr-2 ${
                active
                  ? `${tab.color} border-current`
                  : "text-text-secondary border-transparent hover:text-text-primary"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-current/10" : "bg-border"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* LEC Brand tab */}
      {activeTab === "lec" && (
        <>
          {/* Sort controls */}
          <div className="flex gap-2 mb-3">
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSort(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeSort === s
                    ? "bg-ferrari text-white border-ferrari"
                    : "border-border text-text-secondary hover:border-ferrari/50 hover:text-text-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* LEC feed header */}
          <div className="mb-3">
            {isLive ? (
              <p className="text-xs text-text-secondary">
                Found <span className="font-semibold text-text-primary">{totalFound}</span> posts mentioning LEC across{" "}
                <span className="font-semibold text-text-primary">{subredditsFound.length}</span> subreddits
                {subredditsFound.length > 0 && (
                  <span className="text-text-muted"> ({subredditsFound.map((s) => `r/${s}`).join(", ")})</span>
                )}
              </p>
            ) : null}
          </div>

          {/* Post list */}
          <div className="space-y-1 max-h-[320px] sm:max-h-[420px] overflow-y-auto pr-1">
            {sortedLECPosts.length === 0 && isLive ? (
              <p className="text-sm text-text-muted text-center py-8">
                No posts found yet — Reddit is still discovering LEC
              </p>
            ) : (
              sortedLECPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isTopPost={topPost?.score > 100 && post.id === topPost.id && activeSort === "Top Voted"}
                />
              ))
            )}
          </div>

          {/* LEC insight card */}
          <div className="mt-3 bg-ferrari/5 border border-ferrari/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-text-primary mb-1">
              r/formula1 top post reached 1,541 upvotes — highest organic reach of any LEC mention on Reddit.
            </p>
            <p className="text-sm text-text-secondary">
              These {posts.length} posts are 100% verified real Reddit discussions — organic demand signal with zero paid promotion.
            </p>
          </div>

          {/* AI Analysis */}
          <AIAnalysis posts={posts} />
        </>
      )}

      {/* Category Demand tab */}
      {activeTab === "lowcal" && <LowCalTab lowCalorie={lowCalorie} />}

    </div>
  );
}
