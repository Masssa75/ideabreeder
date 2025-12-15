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
3. Verify Netlify deployment succeeds
4. Test on deployed site
5. If issues, fix and repeat from step 1
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

### Testing Approach:
- Test API endpoints with curl
- Verify UI changes in browser
- Check Supabase data directly when needed

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
- **Last Updated:** 2025-12-15
- **Status:** Active - Evolution running with web search enabled

---

# DataGold - API Discovery Directory

## Overview

**DataGold** is a "Did You Know?" style directory of amazing data APIs. It presents APIs as surprising discoveries rather than dry documentation.

**Live URL:** https://ideabreeder.netlify.app/datagold
**Route:** `/datagold`

### Design Philosophy
- **Discovery over documentation** - Hooks should make developers say "holy shit, I had no idea"
- **Large typography** - One fact fills the screen
- **Yellow highlights** - Key phrases marked with `**bold**` render as yellow text
- **Minimal chrome** - Let the content breathe

## DataGold Files

```
app/
├── datagold/page.tsx      # Discovery + Browse UI
└── api/apis/route.ts      # API endpoint (random, list, filter)

scripts/
├── ingest-api.ts          # Single API ingestion via Kimi K2
├── batch-ingest.ts        # Batch process 75+ curated APIs
└── experiment-hooks.ts    # Test different hook prompts

lib/
├── types.ts               # Api, ApiInsert, ApiTechnical types
└── supabase.ts            # API helper functions
```

## DataGold Database Schema

```sql
CREATE TABLE apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  hook text NOT NULL,              -- "Did You Know?" fact with **bold** markers
  description text,
  bullets text[] DEFAULT '{}',     -- 4-6 numbered facts
  what_it_contains text[],         -- Data types for search
  who_uses_this text[],            -- Target audience
  technical jsonb DEFAULT '{}',    -- {auth, rate_limit, formats, pricing}
  free boolean DEFAULT true,
  url text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

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

## DataGold Commands

```bash
# Ingest single API (uses Kimi K2 with web search)
npx tsx scripts/ingest-api.ts "GitHub REST API"

# Ingest multiple
npx tsx scripts/ingest-api.ts "NASA API" "Spotify API" "USPTO API"

# Batch ingest (75+ curated APIs)
npx tsx scripts/batch-ingest.ts           # All APIs
npx tsx scripts/batch-ingest.ts --batch 0 # First 10
npx tsx scripts/batch-ingest.ts --batch 1 # APIs 11-20

# Test hook prompts
npx tsx scripts/experiment-hooks.ts
```

## DataGold Environment Setup

Scripts require dotenv to load env vars:
```bash
# Create symlink (one-time setup)
ln -sf .env.local .env
```

Required env vars:
- `MOONSHOT_API_KEY` - For Kimi K2 API
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## DataGold API Endpoints

```bash
# Get random API (for Discovery mode)
curl "http://localhost:3004/api/apis?random=true"

# List all APIs
curl "http://localhost:3004/api/apis"

# Filter by category
curl "http://localhost:3004/api/apis?category=weather"

# Search
curl "http://localhost:3004/api/apis?search=earthquake"
```

## DataGold Current State (Dec 15, 2025)

- **6 APIs ingested** with new hook format
- **Discovery mode**: Full-screen "Did You Know?" cards
- **Browse mode**: Searchable list with category filters
- **Next**: Expandable rows to show bullets/technical details

---

## Session Logs

See `logs/` folder for detailed session history.
