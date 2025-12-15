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

## Session Logs

See `logs/` folder for detailed session history.
