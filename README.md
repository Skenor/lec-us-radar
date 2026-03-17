# LEC US Entry Radar

**Market Intelligence Dashboard for LEC Gelato's US Market Entry**

Built for Federico Grom, Charles Leclerc, Guido Martinetti, and Nicolas Todt.

---

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in your API keys (all free — see below)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> The app works without any API keys — all modules fall back to curated realistic data automatically. Add keys progressively to unlock live data.

---

## Getting Your API Keys (All Free)

### 1. Open Food Facts — No key needed
Open Food Facts is fully open. No registration required. The app queries it automatically.

### 2. Nutritionix
1. Go to [nutritionix.com/business/api](https://www.nutritionix.com/business/api)
2. Click **Get API Key**
3. Fill in the free tier registration form
4. You'll receive `APP ID` and `APP KEY` via email
5. Add to `.env`:
   ```
   VITE_NUTRITIONIX_APP_ID=your_app_id
   VITE_NUTRITIONIX_APP_KEY=your_app_key
   ```

### 3. Kroger API
1. Go to [developer.kroger.com](https://developer.kroger.com)
2. Click **Sign Up** → Create a developer account
3. Go to **My Apps** → **Create App**
4. App name: `LEC Radar`, Scope: `product.compact`
5. Copy **Client ID** and **Client Secret**
6. Add to `.env`:
   ```
   VITE_KROGER_CLIENT_ID=your_client_id
   VITE_KROGER_CLIENT_SECRET=your_client_secret
   ```

### 4. Yelp Fusion API
1. Go to [yelp.com/developers](https://www.yelp.com/developers)
2. Click **Create App**
3. Fill in app details (any name/description)
4. Copy your **API Key**
5. Add to `.env`:
   ```
   VITE_YELP_API_KEY=your_yelp_api_key
   ```

### 5. YouTube Data API v3
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Navigate to **APIs & Services** → **Library**
4. Search for **YouTube Data API v3** → Enable it
5. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **API Key**
6. Add to `.env`:
   ```
   VITE_YOUTUBE_API_KEY=your_youtube_api_key
   ```

### 6. NewsAPI
1. Go to [newsapi.org/register](https://newsapi.org/register)
2. Register for a free developer account
3. Your API key is shown immediately after registration
4. Add to `.env`:
   ```
   VITE_NEWS_API_KEY=your_newsapi_key
   ```

### 7. SerpAPI
1. Go to [serpapi.com/users/sign_up](https://serpapi.com/users/sign_up)
2. Register for a free account (100 free searches/month)
3. Your API key is in the dashboard
4. Add to `.env`:
   ```
   VITE_SERPAPI_KEY=your_serpapi_key
   ```

### 8. Anthropic Claude API
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Navigate to **API Keys** → **Create Key**
4. Copy the key immediately (shown only once)
5. Add to `.env`:
   ```
   VITE_ANTHROPIC_KEY=your_anthropic_key
   ```

---

## Tech Stack

- **React 18** + **Vite** — fast development server
- **Tailwind CSS v3** — utility-first styling with Ferrari design system
- **Recharts** — BarChart, LineChart for competitive data
- **React Simple Maps** — US choropleth map
- **d3-scale** — Ferrari red color scale for state scoring
- **Lucide React** — icons
- **Inter** (Google Fonts) — premium typography

---

## Architecture

```
src/
├── components/
│   ├── Header.jsx              Fixed nav with live clock
│   ├── CompetitiveLandscape.jsx  Nutritional benchmarks + trends + news + YouTube
│   ├── RetailerScore.jsx       Pricing panel + city store map
│   ├── LeclercMap.jsx          US choropleth market readiness
│   ├── CommunityPulse.jsx      Reddit brand heat + category demand
│   ├── AIAdvisor.jsx           Claude-powered strategy chat
│   ├── LiveBadge.jsx           Live/Demo status indicator
│   └── ExportButton.jsx        Print/PDF export
├── hooks/
│   ├── useOpenFoodFacts.js     OFF + Nutritionix competitor nutrition
│   ├── useKroger.js            Retail pricing data
│   ├── useYelp.js              Premium store density by city
│   ├── useYouTube.js           Video buzz + engagement
│   ├── useRedditFeed.js        Community sentiment signals
│   ├── useNewsApi.js           Market intelligence news
│   ├── useSerpApi.js           Google Trends geo + timeseries
│   └── useCensus.js            US Census income data
├── data/
│   └── fallbackData.js         Curated realistic fallback data
└── utils/
    ├── timeAgo.js              Relative timestamp formatter
    ├── mapHelpers.js           State name to FIPS mappings
    └── scoring.js              Market readiness composite score
```

---

## Market Readiness Scoring Formula

```
score = (leclercTrendValue x 0.5) + (normalizedIncome x 0.3) + (italianProxy x 0.2)

Tier 1 Entry:   score >= 70
Tier 2 Watch:   score 50-69
Tier 3 Develop: score < 50
```

---

Confidential. Prepared exclusively for LEC Gelato leadership.
