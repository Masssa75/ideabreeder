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

## Session: December 16, 2025 (Night) - Soulmate Finder & Shake Alert

### Summary
Built two new prototypes: Shake Alert (earthquake tracker) and Soulmate Finder (AI personality interview for matching). Added user accounts with Supabase auth using email magic links, with optional save functionality.

### Accomplishments

#### Shake Alert (`/shake`)
- Real-time earthquake data from USGS API
- Geolocation support - shows distance from user's location
- Color-coded magnitude display
- Live deployment at ideabreeder-ai.netlify.app/shake

#### Soulmate Finder (`/soulmate`)
- AI interview chat using Moonshot Kimi K2 API
- Research-backed psychology system prompt incorporating:
  - **Arthur Aron's 36 Questions** (escalating self-disclosure)
  - **Attachment Theory** (Secure, Anxious, Avoidant, Fearful-Avoidant)
  - **Big Five Personality** (OCEAN)
  - **Gottman Method** (conflict predictors)
  - **24 Compatibility Factors** (2024 research)
- 5 phases, 36 questions, progressively deeper
- Auto-expanding textarea for long responses

#### 5 UI Variations for A/B Testing
- `/soulmate/v1` - Light & Clean
- `/soulmate/v2` - Dark Romantic
- `/soulmate/v3` - Glassmorphism
- `/soulmate/v4` - Warm & Cozy
- `/soulmate/v5` - Bold Modern
- `/soulmate/versions` - Version selector

#### User Accounts & Persistence
- **Supabase Auth** with email magic link (no password needed)
- **Database schema** for sessions, messages, and profiles with RLS
- **Anonymous chat** works immediately (localStorage)
- **"Save Progress"** button in chat header for non-logged users
- **Migration** - localStorage data migrates to Supabase on login
- **Cross-device sync** - continue interview from any device

#### Data Migration
- Manually migrated friend's interview from localhost localStorage to Supabase
- Created user `philipp@desci.com` via admin API
- Inserted 9 messages into their session

### Database Schema Created

```sql
-- soulmate_sessions: Interview sessions per user
-- soulmate_messages: Chat messages with role and index
-- soulmate_profiles: Extracted personality data (for future matching)
-- All with RLS policies for user data isolation
```

### Files Created/Modified

```
app/
├── shake/page.tsx                    # Earthquake tracker
├── soulmate/page.tsx                 # Main chat (updated for auth)
├── soulmate/v1-v5/page.tsx          # UI variations
├── soulmate/versions/page.tsx        # Version selector
└── api/soulmate/chat/route.ts        # Chat API (supports anon + auth)

components/
└── AuthModal.tsx                     # Email magic link login

lib/
├── soulmate/session.ts               # Session management helpers
└── supabase/
    ├── client.ts                     # Browser Supabase client
    ├── server.ts                     # Server Supabase client
    └── middleware.ts                 # Session refresh

middleware.ts                         # Root auth middleware

supabase/migrations/
└── 20251216_soulmate_auth.sql        # Sessions, messages, profiles tables

tests/
├── verify-deploy.spec.ts             # Playwright tests for deployed site
└── verify-local.spec.ts              # Playwright tests for localhost
```

### Key Design Decisions

1. **Anonymous-first**: Users can start chatting immediately without login
2. **Optional save**: Green "Save Progress" button appears only for non-logged users
3. **Dual storage**: localStorage for anonymous, Supabase for authenticated
4. **API flexibility**: Supports both `{messages: []}` (anon) and `{sessionId, userMessage}` (auth)
5. **Migration on login**: localStorage data automatically migrates to Supabase

### Deployment
- **URL**: https://ideabreeder-ai.netlify.app
- **Soulmate**: https://ideabreeder-ai.netlify.app/soulmate
- **Shake Alert**: https://ideabreeder-ai.netlify.app/shake

### Future Ideas Discussed
- **Friend Matching**: With 100K+ completed interviews, could match people as best friends (not just romantic)
- **Profile Extraction**: AI generates structured personality profile after 30+ questions
- **Matching Algorithm**: Compare profiles based on shared values, compatible energy levels, complementary traits

### Next Steps

1. **Profile Extraction** - After interview completion, have AI generate structured JSON profile
2. **Matching MVP** - Have AI read two transcripts and write compatibility report
3. **Supabase Dashboard Config** - Set Site URL and Redirect URLs for magic links:
   - Site URL: `https://ideabreeder-ai.netlify.app`
   - Redirect URL: `https://ideabreeder-ai.netlify.app/soulmate`

### Commands

```bash
# Run dev server
npm run dev -- -p 3005

# Check localStorage data (browser console)
localStorage.getItem('soulmate-chat-messages')

# Create user via Supabase admin API (example)
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{"email": "user@example.com", "email_confirm": true}'
```

---

## Session: December 16, 2025 (Evening) - Bamboo Valley Carousel Content

### Summary
Created Instagram carousel content and designs for Bamboo Valley School about "The Homework Myth" - research showing homework doesn't help children under 10.

### Accomplishments

#### Deep Research
- Conducted extensive research into actual academic sources on homework effectiveness
- Created `data/education-research/HOMEWORK-RESEARCH-DEEP-DIVE.md` with sourced findings:
  - NAEP: 4th graders doing 45+ min homework scored WORSE
  - Cooper meta-analysis: <4% of test variance explained by homework
  - 50-country TIMSS study: ALL correlations negative
  - Stanford: 56% of students say homework is #1 stress
  - Japan/Hong Kong/Taiwan: below-average homework, top math scores
  - Family fights 200% more likely without college degree

#### Carousel Design Iterations
Created multiple design versions exploring different aesthetics:

```
content/
├── carousel-headlines.html       # Interactive headline brainstorm tool (47 options)
├── carousel-simple-mockup.html   # 10 simple style options
├── carousel-slide1-options.html  # Slide 1 variations (13 options)
├── carousel-content-flow.html    # Big numbers + flow design
├── carousel-text-heavy.html      # Bullet-point text-heavy version
├── carousel-text-iconic.html     # Iconic text sizing with varying opacity
├── carousel-bold-display.html    # Bold Anton font, chunky colors
├── carousel-waldorf.html         # First Waldorf attempt (rejected - too blurry)
└── carousel-waldorf-v2.html      # Current: Soft Waldorf gradients, multiple approaches
```

#### Design Direction Discovered
- User prefers "children" over "kids" (respectful language)
- Need source citations for credibility
- Waldorf aesthetic: soft, organic, natural
- Rejected: blurry backdrop-filter overlays on images
- Preferred: soft watercolor gradients, serif fonts (Cormorant Garamond)
- Brand colors: sage, cream, blush, lavender, wheat, mist, rose, moss

#### CLAUDE.md Updates
- Added enhanced workflow documentation (build monitoring, debugging protocol)
- Added autonomous working principles
- (Bamboo Valley content section added then removed per user preference)

### Key Technical Fixes
- Fixed JavaScript syntax error in carousel-headlines.html: smart quotes (`'`) breaking string literals - replaced with escaped straight quotes (`\'`)

### Files Created

```
content/
├── carousel-waldorf-v2.html      # Current working version
├── carousel-bold-display.html
├── carousel-text-iconic.html
├── carousel-text-heavy.html
├── carousel-content-flow.html
├── carousel-slide1-options.html
└── social/homework-myth-carousel.md

data/education-research/
└── HOMEWORK-RESEARCH-DEEP-DIVE.md

images/                           # Created folder for carousel images
```

### Next Steps

1. **Get Gemini image** - User has a watercolor forest image from Gemini to try as background
2. **Finalize design approach** - Choose from 4 approaches in waldorf-v2:
   - A: Split (image top, text bottom)
   - B: Circular image accent
   - C: Full image with text card overlay
   - D: No image, soft watercolor gradients
3. **Export for Instagram** - Final slides at 1080x1350 (4:5) or 1080x1080 (1:1)

### Carousel Content (9 slides)

1. **Hook**: "Homework Doesn't Help Children Under 10" - 35 years, 35 studies, zero benefit
2. **NAEP**: 45+ minutes = worse scores
3. **Cooper**: <4% of test score differences
4. **50 Countries**: All correlations negative
5. **A+ Teachers**: Give less homework, more choices
6. **Family Fights**: 200% more likely without college degree
7. **Stress**: 56% say homework is #1 stress
8. **Top Countries**: Japan, Hong Kong, Taiwan - below-average homework, top scores
9. **CTA**: Bamboo Valley - give your children their evenings back

---
