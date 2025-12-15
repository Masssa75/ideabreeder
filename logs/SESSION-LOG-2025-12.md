# December 2025 Session Logs

---

## Session: December 15, 2025 - DataGold MVP

### Summary
Built DataGold, a "Did You Know?" style API directory that showcases amazing data APIs with punchy, discovery-oriented hooks.

### Accomplishments

#### Database
- Created Supabase `apis` table with schema for title, hook, description, bullets, technical info, etc.
- Added RLS policies for public read/write access
- Successfully migrated using `supabase db push`

#### Ingestion Scripts
- **`scripts/ingest-api.ts`**: Single API ingestion using Kimi K2 with web search
  - Multi-turn tool call handling (web_search, fetch, rethink)
  - "Did You Know?" style prompt that generates hooks with `**bold**` markers
  - Saves structured data to Supabase
- **`scripts/batch-ingest.ts`**: Batch processing with 75+ curated API names
- **`scripts/experiment-hooks.ts`**: Hook format experimentation tool

#### UI (`/datagold`)
- **Discovery Mode**: Full-screen "Did You Know?" cards with:
  - Yellow-highlighted key phrases (parses `**bold**` markers)
  - Source link with free/paid indicator
  - "Show me another" / "Save this" buttons
  - Space bar / arrow key navigation
- **Browse Mode**: Searchable list with category filters

#### Data
- 6 APIs ingested with new hook format:
  - AIS Ship Tracking API
  - USGS Earthquake API
  - Internet Archive API
  - Spotify Web API
  - USPTO Patent Database API
  - NASA Mars Rover Photos API

### Key Technical Decisions

1. **Hook Format**: Changed from dry stats to discovery-oriented "There's a..." format
   - Before: "100M+ developers, 330M+ repositories, 4B+ annual contributions"
   - After: "There's a live map of **every ocean vessel** on Earth — **400,000+ ships** tracked in **real-time**"

2. **Kimi K2 Multi-turn**: Script handles up to 15 tool call turns before final response

3. **Highlight Parsing**: Hooks stored with `**bold**` markdown, parsed to yellow spans in UI

### Files Created/Modified

```
scripts/
├── ingest-api.ts        # Single API ingestion (modified with new prompt)
├── batch-ingest.ts      # Batch processing
└── experiment-hooks.ts  # Hook format testing

app/
├── datagold/page.tsx    # Discovery + Browse UI (modified for new design)
└── api/apis/route.ts    # API endpoint

supabase/migrations/
├── 20251215170000_apis_table.sql
└── 20251215170100_apis_policies.sql

lib/
├── types.ts             # Added Api types
└── supabase.ts          # Added API functions

logs/
├── SESSION-LOG-INDEX.md
└── SESSION-LOG-2025-12.md
```

### Next Steps

1. **Ingest more APIs**: Run `npx tsx scripts/batch-ingest.ts` to populate database
2. **Add "Save" functionality**: Currently "Save this" just switches to Browse mode
3. **User accounts**: Allow users to save favorites
4. **Search improvements**: Full-text search on hooks and descriptions
5. **Deploy**: Push changes to trigger Netlify deploy

### Environment Notes

- Dev server runs on port 3004 (3000 was in use)
- Requires `.env` symlinked to `.env.local` for scripts: `ln -sf .env.local .env`
- MOONSHOT_API_KEY required for Kimi K2 ingestion

### Commands

```bash
# Ingest single API
npx tsx scripts/ingest-api.ts "GitHub REST API"

# Ingest batch (first 10)
npx tsx scripts/batch-ingest.ts --batch 0

# Test hook formats
npx tsx scripts/experiment-hooks.ts

# Run dev server
npm run dev
```

---

## Session: December 16, 2025 - DataGold Scale-up & Discovery

### Summary
Scaled DataGold from 6 to 119 APIs, added capabilities field, set up background ingestion pipeline, and discovered the power of "rethink" for finding surprising APIs.

### Accomplishments

#### Database & Schema
- Added `capabilities` field (text[]) to store 8-15 specific things you can DO with each API
- Added `api_ingestion_queue` table for background processing
- Added `source` column to track where API suggestions came from (manual, discovery:topic, etc.)
- Set up pg_cron job (5 APIs every 5 minutes) - though local processing works better for complex APIs

#### Ingestion Pipeline
- **Edge Function**: `supabase/functions/ingest-api/` for cloud-based background processing
- **Local Scripts**: More reliable for complex APIs that need many Kimi K2 turns
- **Queue Management**: Scripts to check status, reset stuck items, sync queue with database

#### API Discovery
- Grew from 6 → **119 APIs** with full capabilities
- Discovered **"rethink" dramatically improves results**:
  - Without rethink: Standard APIs (Google Places, Amadeus)
  - With rethink: "Holy shit" APIs (Phuket CCTV crowd density, tourist wristband tracking, coral reef monitoring)
- Added the "Holy Shit Discovery Prompt" template to CLAUDE.md

#### UI Enhancements
- Added **Capabilities tab** (first tab) in Browse mode - shows what you can DO with each API
- Expandable rows with tabs: Capabilities, Facts, Technical, Audience
- Fixed API limit from 50 → 200

#### Phuket-Specific APIs Discovered
- Smart City Phuket Data Platform (15,000+ sensors, 4,000+ vehicles tracked)
- Phuket Coral Reef Health Monitoring (3.2M coral colonies)
- Thailand Air Quality API with Phuket coverage
- TAT Developer Portal (40,000+ Thai attractions)
- And more...

#### Documentation
- Comprehensive CLAUDE.md update with:
  - Architecture diagram
  - Marc's context (Phuket, Thailand, education)
  - Discovery prompt tips with rethink
  - Thailand education data sources for Marc's school
  - Next feature TODO: Continuous discovery with Telegram notifications

### Key Insights

1. **Rethink is crucial**: Makes AI ask "is this surprising enough?" between searches
2. **Local > Cloud for complex APIs**: Edge function timeouts on APIs needing 10+ Kimi turns
3. **Queue can get stuck**: Items marked "processing" but never complete - need reset script
4. **Naming matters**: "Thailand Schools Dataset API" fails, "Thailand Open Government Data API" succeeds

### Files Created/Modified

```
scripts/
├── discover-apis.ts        # Topic-based API discovery (not fully implemented yet)
├── queue-status.ts         # Check ingestion queue
├── check-capabilities.ts   # See which APIs have capabilities
├── reset-queue.ts          # Reset stuck "processing" items
├── add-phuket-apis.ts      # Batch add Phuket tourism APIs
├── add-education-apis.ts   # Batch add education + rethink APIs
└── normalize-categories.ts # Normalize 55 categories → 15

supabase/
├── functions/ingest-api/index.ts   # Edge function for background processing
└── migrations/
    ├── 20251215190000_api_ingestion_queue.sql
    ├── 20251215190100_api_ingestion_cron.sql
    ├── 20251215200000_add_capabilities.sql
    └── 20251215210000_add_queue_source.sql

app/datagold/page.tsx       # Added Capabilities tab
lib/types.ts                # Added capabilities to Api interface
CLAUDE.md                   # Major documentation update
```

### Next Steps (For Next Instance)

1. **Continuous Discovery Feature** (see CLAUDE.md TODO):
   - Depth levels: quick/thorough/exhaustive
   - Iterative with checkpoints
   - Telegram notifications when cycles complete
   - Rethink as meta-controller

2. **Potential improvements**:
   - Retry failed queue items with better names
   - Add more Phuket/Thailand-specific APIs
   - Consider scraping OBEC education data for Marc's school

### Commands Reference

```bash
# Check queue status
npx tsx scripts/queue-status.ts

# Process APIs locally (more reliable than cron)
npx tsx scripts/ingest-api.ts "API Name 1" "API Name 2"

# Reset stuck "processing" items
npx tsx scripts/reset-queue.ts

# Check capabilities coverage
npx tsx scripts/check-capabilities.ts
```

### Stats
- **APIs in database**: 119
- **With capabilities**: 119 (100%)
- **Failed ingestions**: 5 (mostly non-existent APIs)
- **Categories**: 15 normalized

---
