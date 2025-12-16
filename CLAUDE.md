# IdeaBreeder.ai Project

## Project Overview

**IdeaBreeder.ai** is an evolutionary startup idea generator that breeds and evolves ideas using a genetic algorithm approach. AI generates ideas from a "gene pool" of concept fragments, scores them on utility, and the system evolves toward better ideas over generations.

**Live URL:** https://ideabreeder.netlify.app (or custom domain when configured)
**GitHub:** https://github.com/Masssa75/ideabreeder

### Tech Stack
- **Frontend:** Next.js 15 with TypeScript, Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** Moonshot Kimi K2 API (with web search capability)
- **Deployment:** Netlify (auto-deploy from GitHub)
- **Background Jobs:** Supabase pg_cron (every 5 minutes)

### Core Concept
1. **Gene Pool:** Collection of concept fragments (e.g., "AI analyzes large datasets", "small business owners")
2. **Fitness-Weighted Selection:** Genes with higher fitness scores are more likely to be selected
3. **Idea Generation:** AI combines 3 genes + does web research to generate ideas
4. **USEFUL Scoring:** Ideas scored on 6 dimensions (0-10 each, max 60):
   - **U**tility: Does it solve a real, painful problem?
   - **S**implicity: Can a solo dev build an MVP quickly?
   - **E**conomics: Is there a clear path to revenue?
   - **F**requency: How often would people use this?
   - **U**niqueness: Is it a fresh approach?
   - **L**everage: Does it use AI/new tech meaningfully?
5. **Gene Extraction:** New genes extracted from high-scoring ideas
6. **Fitness Update:** Genes that produced good ideas get boosted, bad ones penalized

## Project Structure

```
ideabreeder/
├── app/
│   ├── page.tsx              # Main UI with evolution controls
│   └── api/
│       ├── generate/route.ts  # Generate idea from genes (with web search)
│       ├── score/route.ts     # Score idea with USEFUL framework
│       ├── extract/route.ts   # Extract new genes from idea
│       └── evolve/route.ts    # Background evolution (called by pg_cron)
├── components/
│   ├── GenePool.tsx          # Gene pool visualization
│   ├── BreedingView.tsx      # Current generation display
│   ├── Leaderboard.tsx       # Top 10 ideas
│   ├── ActivityLog.tsx       # Evolution activity log
│   └── HistoryModal.tsx      # View all past ideas
├── logs/                     # Session logs
└── CLAUDE.md                 # This file
```

## Database Schema (Supabase)

```sql
-- Gene pool
genes (
  id uuid PRIMARY KEY,
  text text UNIQUE,        -- The gene concept
  fitness numeric,         -- 0.5 to 10, determines selection probability
  offspring_count int      -- How many ideas this gene has contributed to
)

-- Generated ideas
ideas (
  id uuid PRIMARY KEY,
  name text,
  description text,
  hook text,
  virus_score int,         -- Total score (legacy name, now max 60)
  scores jsonb,            -- {utility, simplicity, economics, frequency, uniqueness, leverage}
  genes_used text[],       -- Which genes were combined
  genes_extracted text[],  -- New genes discovered
  reasoning text,          -- AI's analysis
  generation int,
  created_at timestamp
)

-- Evolution state
evolution_state (
  id int PRIMARY KEY,      -- Always 1
  current_generation int,
  is_running boolean,
  last_run_at timestamp
)
```

## Autonomous Development Workflow

### The Golden Rule - ALWAYS Follow This Pattern:
```bash
1. Make code changes
2. git add -A && git commit -m "feat: description" && git push
3. IMMEDIATELY start streaming logs: netlify logs:deploy
4. Watch until "Build script success" or error
5. If build fails, analyze error and fix immediately
6. Test on deployed site
7. If issues, fix and repeat from step 1
```

### Real-time Build Monitoring
```bash
# Stream deployment logs in real-time
netlify logs:deploy

# Check deployment status
netlify api listSiteDeploys --data '{"site_id": "YOUR_SITE_ID"}' | jq '.[0] | {state, created_at, error_message}'

# Quick status check
curl -s https://ideabreeder.netlify.app | head -1
```

### Your Full Permissions

You have COMPLETE autonomous control:

**Supabase:**
- Full service role key access (in .env.local)
- Can run ANY SQL via REST API
- Can modify schema, add tables, update data

**Netlify:**
- Auto-deploy from GitHub (push = deploy)
- Can check deployment status

**GitHub:**
- Full repository access
- Can push directly to main

**You are expected to work autonomously. Don't ask for permission - just do it!**

## Session Management

### WRAP Keyword
When user says "WRAP", end session with:
1. Update session logs in `logs/` folder
2. Document progress and accomplishments
3. Note any incomplete work and next steps
4. Commit and push all changes

### Session Logs
- `logs/SESSION-LOG-INDEX.md` - Overview of all sessions
- `logs/SESSION-LOG-2025-12.md` - December 2025 sessions (and so on by month)

## Development Rules

### Critical Rules:
1. **Always verify in browser** - Never claim something works without testing
2. **Push frequently** - Don't wait until "it's ready"
3. **Document changes** - Update logs after significant work
4. **API keys in .env.local** - Never in code or CLAUDE.md
5. **Never create fallback systems** without explicit request
6. **Do only what's asked** - nothing more, nothing less
7. **Always prefer editing** existing files to creating new ones

### Testing Approach:
- Test API endpoints with curl
- Verify UI changes in browser
- Check Supabase data directly when needed

### The Sunbeam Debugging Protocol
When debugging issues, follow this systematic approach:

1. **Browser Testing First** - Manually reproduce the issue, note exact steps
2. **Investigate Root Cause** - Trace data flow, check API responses, identify failure point
3. **Implement Minimal Fix** - Fix only what's broken, avoid unnecessary refactoring
4. **Verify with Testing** - Test fix consistently, check edge cases
5. **Document Everything** - Update CLAUDE.md immediately

### Autonomous Working Principles

**ALWAYS Do Without Asking:**
- Deploy to production (for prototyping/MVP)
- Fix bugs and errors
- Run tests and diagnostics
- Update documentation
- Try up to 10 different approaches to solve problems

**ALWAYS Ask Before:**
- Deleting user data
- Major architectural refactors
- Rolling back deployed changes
- Changing core business logic

## Key API Endpoints

### Generate Idea
```bash
curl -X POST https://ideabreeder.netlify.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"genes": ["AI analyzes large datasets", "small business owners", "legal and compliance"]}'
```

### Check Evolution Status
```bash
curl https://ideabreeder.netlify.app/api/evolve
```

### Trigger Evolution (if running)
```bash
curl -X POST https://ideabreeder.netlify.app/api/evolve
```

## Environment Variables (.env.local)

```
MOONSHOT_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Current Status
- **Version:** 1.0.0
- **Last Updated:** 2025-12-16
- **Status:** Active - Evolution running with web search enabled

---

# Bamboo Valley Content Creation

## Overview

This project also hosts content creation work for **Bamboo Valley School** - an alternative outdoor school in Phuket, Thailand. Content is created here for social media, blog posts, and marketing materials.

**Related Project:** `/Users/marcschwyn/Desktop/projects/BambooValley`
**School Website:** https://bamboovalleyphuket.com
**Instagram:** @bamboovalleyphuket

## Content Files

```
content/
├── blog/                      # Blog post drafts and research
├── social/                    # Social media content
│   └── homework-myth-carousel.md  # Instagram carousel content
├── carousel-*.html            # Carousel design iterations
│   ├── carousel-waldorf-v2.html   # Current: Soft Waldorf aesthetic
│   ├── carousel-bold-display.html # Bold Anton font version
│   ├── carousel-text-iconic.html  # Iconic text sizing
│   └── ...
└── images/                    # Image assets for content

data/
└── education-research/
    └── HOMEWORK-RESEARCH-DEEP-DIVE.md  # Research sources for homework myth content
```

## Brand Guidelines (Bamboo Valley)

### Brand Colors (Waldorf-inspired pastels)
- **Peachy Pink**: `#EBC3C3`
- **Sage Green**: `#BED7AF`
- **Sky Blue**: `#C8DCE1`
- **Cream Yellow**: `#FAD7AA`
- **Pale Mint**: `#DCEBE1`

### Writing Style
- **Always use "children" instead of "kids"** - Brand preference for respectful language
- Include source citations for credibility
- Focus on outcomes and feelings, not just features
- Emphasize nature, calm, wholesome experiences

### Design Direction
- **Waldorf aesthetic**: Soft, organic, natural
- Large impactful images when using photos
- Soft watercolor gradients as alternatives
- Serif fonts (Cormorant Garamond) for elegance
- Earth tones: sage, cream, blush, moss

## Current Carousel Project (Dec 2025)

Creating Instagram carousel about "The Homework Myth" - research showing homework doesn't help children under 10.

**Key Research Stats:**
- NAEP: 45+ min homework = worse scores
- Cooper: <4% of test variance explained
- 50 countries: ALL correlations negative
- 56% students say homework is #1 stress
- Japan/Hong Kong/Taiwan: below-average homework, top scores

**Slide Structure:**
1. Hook: "Homework Doesn't Help Children Under 10"
2. NAEP data (45+ minutes = worse)
3. <4% variance (Cooper)
4. 50 countries negative
5. A+ teachers give less
6. 200% more family fights
7. 56% stress
8. Top countries paradox
9. CTA: Bamboo Valley

---

# DataGold - API Discovery Directory

## Overview

**DataGold** is a "Did You Know?" style directory of amazing data APIs. It presents APIs as surprising discoveries rather than dry documentation. The goal is to help Marc (and others) discover APIs that could power viral apps for specific niches.

**Live URL:** https://ideabreeder.netlify.app/datagold
**Route:** `/datagold`

### Design Philosophy
- **Discovery over documentation** - Hooks should make developers say "holy shit, I had no idea"
- **Large typography** - One fact fills the screen
- **Yellow highlights** - Key phrases marked with `**bold**` render as yellow text
- **Minimal chrome** - Let the content breathe

### Marc's Context
Marc lives in **Phuket, Thailand** and works in **education**. When discovering new APIs, consider:
- APIs with Thailand/Southeast Asia data
- Education-related data sources
- Tourism data (Phuket is a major tourist destination)
- Regional government open data portals
- APIs that could power viral apps for local communities

## DataGold Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DataGold System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Discovery  │────▶│   Queue     │────▶│  Ingestion  │       │
│  │   Script    │     │   Table     │     │  (Kimi K2)  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│        │                    │                    │              │
│        │              (pg_cron)                  │              │
│        │            5 APIs / 5 min               ▼              │
│        │                    │            ┌─────────────┐       │
│        └────────────────────┴───────────▶│  APIs Table │       │
│                                          └─────────────┘       │
│                                                 │               │
│                                                 ▼               │
│                                          ┌─────────────┐       │
│                                          │  Frontend   │       │
│                                          │  /datagold  │       │
│                                          └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## DataGold Files

```
app/
├── datagold/page.tsx         # Discovery + Browse UI with tabs
└── api/apis/route.ts         # API endpoint (random, list, filter)

scripts/
├── discover-apis.ts          # ⭐ Discover APIs for a topic/location
├── ingest-api.ts             # Ingest specific APIs by name
├── queue-status.ts           # Check ingestion queue status
├── check-capabilities.ts     # See which APIs have capabilities
├── normalize-categories.ts   # Normalize category names
└── reset-queue.ts            # Reset completed items for re-ingestion

supabase/
├── functions/ingest-api/     # Edge function for background processing
└── migrations/               # Database schema changes

lib/
├── types.ts                  # Api, ApiInsert, ApiTechnical types
└── supabase.ts               # Database helpers
```

## DataGold Database Schema

```sql
-- Main APIs table
CREATE TABLE apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  hook text NOT NULL,              -- "Did You Know?" fact with **bold** markers
  description text,
  capabilities text[] DEFAULT '{}', -- 8-15 specific things you can DO with this API
  bullets text[] DEFAULT '{}',     -- 4-6 numbered facts
  what_it_contains text[],         -- Data types for search
  who_uses_this text[],            -- Target audience
  technical jsonb DEFAULT '{}',    -- {auth, rate_limit, formats, pricing}
  free boolean DEFAULT true,
  url text,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ingestion queue (processed by cron job)
CREATE TABLE api_ingestion_queue (
  id serial PRIMARY KEY,
  api_name text NOT NULL,
  status text DEFAULT 'pending',   -- pending, processing, completed, failed
  source text DEFAULT 'manual',    -- manual, discovery:<topic>, curated
  result_hook text,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Cron job: processes 5 APIs every 5 minutes
-- Calls: POST https://xxx.supabase.co/functions/v1/ingest-api
```

## How to Discover New APIs (IMPORTANT)

### For AI Instances (Claude, Kimi, etc.)

When Marc asks you to find APIs for a specific topic, use the discovery script:

```bash
# Discover APIs for a topic
npx tsx scripts/discover-apis.ts "Phuket tourism"
npx tsx scripts/discover-apis.ts "Thailand education data"
npx tsx scripts/discover-apis.ts "Southeast Asia weather"
npx tsx scripts/discover-apis.ts "Thai government open data"
npx tsx scripts/discover-apis.ts "marine conservation data"
```

The script will:
1. Use Kimi K2 with web search to find relevant APIs
2. Return 10-15 API suggestions with relevance and app ideas
3. Add new APIs to the ingestion queue
4. The cron job will process them automatically (5 every 5 minutes)

### For Manual Ingestion

```bash
# Ingest specific APIs immediately
npx tsx scripts/ingest-api.ts "Thai Meteorological API" "Thailand Open Government Data"

# Check queue status
npx tsx scripts/queue-status.ts

# Check which APIs have capabilities
npx tsx scripts/check-capabilities.ts
```

### Discovery Prompt Tips (CRITICAL INSIGHT)

When using Kimi K2 (or any AI) to discover APIs, **always use the `rethink` tool** between searches. This dramatically improves results:

| Without Rethink | With Rethink |
|-----------------|--------------|
| Standard global APIs (Google, Amadeus) | Hyperlocal government data |
| "Oh yeah, that exists" | "Holy shit, they track THAT?" |
| Generic "Thailand" data | Specific "Phuket Smart City" sensors |

**The "Holy Shit" Discovery Prompt:**
```
Find APIs that will make developers say "holy shit, I had no idea this existed."

Topic: "[YOUR TOPIC]"

PROCESS:
1. Search for OBVIOUS APIs first
2. Use RETHINK: "What would SURPRISE a developer? What hidden government/sensor data exists?"
3. Search for surprising angles
4. Use RETHINK: "What LOCAL data exists? What real-time feeds? What niche databases?"
5. Search deeper
6. Use FETCH to verify APIs actually exist

WHAT MAKES "HOLY SHIT" APIs:
- Government data that's surprisingly detailed (every boat registered, every business license)
- Real-time sensor feeds (crowd density, water quality, air quality)
- Niche industry databases (dive conditions, coral health, marine life sightings)
- Historical data going back decades
- Hyperlocal data specific to the location

After each search, RETHINK: "Is this surprising enough? What angle haven't I explored?"
```

**Example results with rethink enabled:**
- Phuket CCTV Crowd Density API (1,300 cameras with AI)
- Tourist Wristband GPS Tracking (government tracks every boat tourist)
- Beach Water Quality (hourly bacteria levels, 20-year history)
- Tourism Police Incident Reports (scam locations!)
- Coral Reef Health Monitoring (underwater drone data)

## Hook Format (CRITICAL)

Hooks must follow the "Did You Know?" style:

**Good:**
```
"There's a live map of **every ocean vessel** on Earth — cargo ships, oil tankers, cruise liners. **400,000+ ships** tracked in **real-time** via satellite."
```

**Bad:**
```
"100M+ developers, 330M+ repositories, 4B+ annual contributions — all queryable"
```

Rules:
- Start with "There's a..." or "You can access..." or "Every..."
- Include 1-2 mind-blowing numbers
- Frame as discovery, not documentation
- Mark 2-3 key phrases with `**bold**` for yellow highlighting
- Keep under 30 words

## Capabilities Field

Each API stores 8-15 specific capabilities - things you can DO with the API:
- "Get current weather conditions for any city"
- "Access historical data from 1979 to present"
- "Search by geographic coordinates"

This is the source of truth for what each API offers, enabling AI chatbots to analyze APIs for business opportunities.

## UI Features

### Discovery Mode (`/datagold`)
- Full-screen "Did You Know?" cards
- Yellow highlights on key phrases
- Space/arrow to get next random API
- Source link with free/paid indicator

### Browse Mode
- Search across all fields
- Category filter chips
- Expandable rows with tabs:
  - **Capabilities** - What you can do with the API
  - **Facts** - Key statistics and data types
  - **Technical** - Auth, rate limits, pricing
  - **Audience** - Who uses this API

## Categories (Normalized)

APIs are categorized into these 15 categories:
- Government, Finance, Science, Space, Health
- Geography, Developer Tools, Social/News, Media
- AI/ML, Weather, Communication, Business, Fun, Food

## DataGold Current State (Dec 16, 2025)

- **119 APIs** in database with capabilities
- **Cron job** running: 5 APIs processed every 5 minutes (but may timeout on complex APIs - use local ingestion instead)
- **Discovery script** ready for topic-based API discovery
- **Browse mode** with expandable rows and tabs
- **Capabilities field** for AI analysis

## Next Feature: Continuous API Discovery (TODO)

**Goal:** User specifies topics, AI searches in background, sends Telegram notifications when cycles complete.

**Proposed Design (Options 3+4 combined):**

1. **Depth Levels** - User chooses upfront:
   - `quick` → 10 APIs, obvious sources
   - `thorough` → 25 APIs, includes niche angles
   - `exhaustive` → 50+ APIs, every possible angle

2. **Iterative with Checkpoints:**
   - AI finds batch of 10 APIs
   - Sends Telegram notification: "Found 10 APIs for [topic]. Review or continue?"
   - User can respond: "continue", "focus on [X]", or "stop"
   - Repeat until depth satisfied

3. **Rethink as Meta-Controller:**
   - After each batch, AI uses `rethink` to evaluate:
     - "What angles haven't I explored?"
     - "Am I seeing repeat results?"
     - "Have I reached the requested depth?"

4. **Telegram Integration:**
   - Notify when cycle completes
   - Send summary of APIs found
   - Allow user to respond with commands

**Implementation Notes:**
- Could run as Supabase Edge Function with longer timeout
- Or as local script with `--background` flag
- Store discovery state in database for resumability
- Consider using Telegram Bot API for notifications

---

## Thailand Education Data (For Marc's School)

If you need Thailand school/education data, here are the sources:

| Source | URL | What it has |
|--------|-----|-------------|
| **OBEC Open Data** | https://opendata.obec.go.th/ | 31,000+ public schools, structured data |
| **OBEC School Lists** | http://www.bopp.go.th/?page_id=878 | Downloadable lists since 2007, updated each semester |
| **data.go.th** | https://data.go.th/dataset?groups=education | 46,000+ schools with GPS coordinates |
| **SchoolMIS** | Via bopp.go.th | School management system data |
| **B-OBEC** | Via bopp.go.th | School building/infrastructure database |

Note: No public API exists for MOE catalog - but data is downloadable/scrapable from OBEC portals.

## Quick Commands Reference

```bash
# Discover APIs for a niche
npx tsx scripts/discover-apis.ts "your topic here"

# Ingest specific APIs
npx tsx scripts/ingest-api.ts "API Name 1" "API Name 2"

# Check queue status
npx tsx scripts/queue-status.ts

# Check capabilities coverage
npx tsx scripts/check-capabilities.ts

# Normalize categories after batch ingestion
npx tsx scripts/normalize-categories.ts
```

## Environment Variables

Required in `.env.local`:
```
MOONSHOT_API_KEY=sk-...           # Kimi K2 API key
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Session Logs

See `logs/` folder for detailed session history.
