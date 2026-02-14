# Employment Risk Assessment — risk.workforce.ai

AI-powered employment risk analysis tool. Enter any person's name and get a full assessment of their job security, AI automation exposure, career trajectory, and retraining recommendations.

**Stack:** Next.js 14 + Tailwind + LiveData People API + Claude API

## Quick Start (Local)

```bash
# 1. Clone and install
cd risk-app
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel + Custom Domain

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create workforce-risk-assessment --private --source=. --push
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repo
3. Add environment variables in Vercel dashboard:
   - `LIVEDATA_ORG_ID` → `o_52c87b0a`
   - `LIVEDATA_API_KEY` → your LiveData API key
   - `ANTHROPIC_API_KEY` → your Anthropic API key
4. Deploy

### Step 3: Add Custom Domain (risk.workforce.ai)

1. In Vercel project → Settings → Domains
2. Add `risk.workforce.ai`
3. Vercel will give you a CNAME target (usually `cname.vercel-dns.com`)
4. In your DNS provider (wherever workforce.ai is registered):
   - Add a CNAME record:
     - **Name:** `risk`
     - **Value:** `cname.vercel-dns.com`
     - **TTL:** Auto or 300
5. Wait for DNS propagation (usually < 5 minutes)
6. Vercel auto-provisions SSL

### If using Cloudflare DNS:
- Set the CNAME proxy to **DNS only** (gray cloud) initially
- After Vercel verifies, you can enable proxy (orange cloud) if desired

## Architecture

```
User → risk.workforce.ai
  └→ Search page (name + company or LinkedIn URL)
      └→ POST /api/assess
          ├→ LiveData /find       → person data + career history
          ├→ LiveData /search     → company demographics (headcount by function)
          ├→ LiveData /search     → arrivals/departures (hiring flows)
          ├→ LiveData /search     → flows by level (promotion patterns)
          ├→ Risk Scoring Engine  → rules-based scores (AI, company, tenure, etc.)
          ├→ Salary Estimator     → function + level + geo comp estimates
          └→ Claude API           → narrative analysis + retraining recommendations
              └→ Full assessment JSON → rendered in dashboard
```

## Files

```
risk-app/
├── app/
│   ├── layout.js           # Root layout + metadata
│   ├── page.js             # Search form + report dashboard (client)
│   ├── globals.css         # Tailwind + dark theme styles
│   └── api/assess/
│       └── route.js        # API endpoint (orchestrator)
├── lib/
│   ├── livedata.js         # LiveData People API client
│   ├── scoring.js          # Risk scoring engine (rules-based)
│   ├── salary.js           # Salary estimation (function + level + geo)
│   └── claude.js           # Claude API for narratives
├── .env.example            # Environment variables template
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Cost Per Assessment

- **LiveData API:** 4 calls (find + 3 search reports) — included in your plan
- **Claude API:** ~2K input + 2K output tokens ≈ $0.02–0.04 per report (Sonnet)
- **Hosting:** Free tier on Vercel covers significant traffic

## Customization

- **Scoring weights:** Edit `lib/scoring.js` → `computeOverallRisk()` weights
- **Salary tables:** Edit `lib/salary.js` → base comp and geo multipliers
- **Claude prompt:** Edit `lib/claude.js` → `buildPrompt()` for different narrative style
- **Design:** All in `app/page.js` — single-file React dashboard
