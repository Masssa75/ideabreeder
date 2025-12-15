# Session Log - December 2025

## Session - December 15, 2025 (Web Search Integration & History Modal)

### Summary
Added Kimi K2's built-in web search capability to idea generation, enabling the AI to research real problems and market gaps before generating ideas. Also created a comprehensive history modal to view all past ideas with their scores and analysis.

### Key Accomplishments

**1. Web Search Integration**
- Enabled `$web_search` builtin tool in Kimi K2 API calls
- Updated prompts to instruct AI to research before generating:
  - Find real problems people complain about
  - Discover free APIs and data sources
  - Identify market gaps
- Added to both `/api/generate` and `/api/evolve` routes
- Increased max_tokens to 1000 to accommodate research output

**2. Research-First Prompt Updates**
- Added "RESEARCH FIRST" section to generation prompts
- Encouraged data + API + AI combination ideas
- Examples: government data, public APIs, AI processing tedious data

**3. History Modal Component**
- Created `components/HistoryModal.tsx` with full functionality
- Features:
  - List all ideas sorted by date (default) or score
  - Click to see full details
  - USEFUL scores breakdown (6 dimensions)
  - Legacy VIRUS scores support (5 dimensions)
  - AI reasoning display
  - Genes used and extracted
- Added prominent "View All Ideas" button in header

**4. Seed Genes Overhaul**
- Replaced old virality-focused genes with utility/data patterns:
  - Data + API: "free public API integration", "government open data", "aggregates fragmented information"
  - AI leverage: "AI analyzes large datasets", "AI extracts insights from documents"
  - Problem patterns: "replaces expensive professionals", "automates tedious paperwork"
  - Audiences: "small business owners", "freelancers", "real estate investors"
  - Verticals: "legal and compliance", "financial planning", "hiring and recruiting"
  - Frequency: "daily workflow tool", "recurring decision support"

### Files Modified
- `app/api/generate/route.ts` - Added web search tool, updated prompts
- `app/api/evolve/route.ts` - Added web search tool, updated prompts
- `app/page.tsx` - New seed genes, history modal integration
- `components/HistoryModal.tsx` - New component

### Technical Notes
- Web search uses `tools: [{ type: 'builtin_function', function: { name: '$web_search' } }]`
- Model: `kimi-k2-0905-preview` (Moonshot confirmed `kimi-k2-0711-preview` may work better for search)
- If search is unreliable, fallback option is Tavily API

### Status
- **Deployed:** Yes (auto-deploy via GitHub)
- **Evolution:** Running with web search enabled
- **Next:** Monitor idea quality, consider Tavily if Kimi search unreliable

---

## Session - December 14-15, 2025 (USEFUL Framework & Meta-Aware Prompts)

### Summary
Major pivot from virality-focused VIRUS scoring to utility-focused USEFUL scoring. Made the AI meta-aware of the evolutionary system it's part of, improving idea quality and diversity.

### Key Accomplishments

**1. VIRUS → USEFUL Scoring Change**
- Old VIRUS (max 50): Virality, Immediacy, Recurrence, Urgency, Simplicity
- New USEFUL (max 60): Utility, Simplicity, Economics, Frequency, Uniqueness, Leverage
- Focus shifted from "goes viral" to "genuinely useful"

**2. Meta-Aware Prompts**
- AI now knows it's part of an evolutionary engine
- Understands that:
  - Its outputs get scored and affect gene fitness
  - High scores boost genes, low scores penalize them
  - The system learns from its outputs
- Added scoring criteria to generation prompt (AI optimizes for what it's scored on)

**3. Gene Diversity Fix**
- Problem: Top ideas were all badge/workout related (convergence)
- Solution: Meta-awareness + utility focus + recent ideas context
- Added recent idea names to prompt to avoid repetition

**4. Database Reset**
- Cleared old ideas and genes
- Added new utility-focused seed genes
- Reset generation counter

### Files Modified
- `app/api/generate/route.ts` - Meta-aware prompt, USEFUL criteria
- `app/api/score/route.ts` - USEFUL scoring framework
- `app/api/extract/route.ts` - Meta-aware extraction prompt
- `app/api/evolve/route.ts` - All prompts updated
- `components/BreedingView.tsx` - USEFUL scores display

### Prompt Evolution
The generate prompt went from a prescriptive "here's how to make ideas" to a collaborative "you're part of this system, help it get smarter."

Key prompt sections:
- HOW THIS WORKS: Explains the evolutionary loop
- YOUR OBJECTIVE: Help the engine get smarter
- YOU WILL BE SCORED ON: The 6 USEFUL dimensions
- GUIDELINES: Practical tips for better ideas

### Status
- **Scoring:** USEFUL framework active (max 60)
- **History:** Supports both legacy VIRUS and new USEFUL display

---

## Session - December 14, 2025 (Supabase Integration & Background Evolution)

### Summary
Set up Supabase for persistence and background evolution via pg_cron. The system now runs autonomously, generating new ideas every 5 minutes when evolution is enabled.

### Key Accomplishments

**1. Supabase Database Setup**
- Created tables: `genes`, `ideas`, `evolution_state`
- Row Level Security (RLS) policies for public read access
- Service role for write operations

**2. Background Evolution (pg_cron)**
- Supabase cron job calls `/api/evolve` every 5 minutes
- Checks `is_running` flag before proceeding
- Updates generation counter after each run

**3. Realtime Subscriptions**
- UI subscribes to database changes
- New ideas appear automatically
- Gene fitness updates reflected in real-time

**4. Evolution State Management**
- Start/Pause button toggles `is_running` flag
- Generation counter persisted
- Last run timestamp tracked

### Database Schema
```sql
CREATE TABLE genes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text UNIQUE NOT NULL,
  fitness numeric DEFAULT 5,
  offspring_count int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  hook text,
  virus_score int,
  scores jsonb,
  genes_used text[],
  genes_extracted text[],
  reasoning text,
  generation int,
  created_at timestamp DEFAULT now()
);

CREATE TABLE evolution_state (
  id int PRIMARY KEY DEFAULT 1,
  current_generation int DEFAULT 1,
  is_running boolean DEFAULT false,
  last_run_at timestamp
);
```

### Status
- **Background evolution:** Active via pg_cron
- **Interval:** Every 5 minutes when running

---

## Session - December 13-14, 2025 (Initial Build)

### Summary
Built the initial IdeaBreeder application with core evolutionary algorithm, Moonshot Kimi K2 integration, and real-time UI.

### Key Accomplishments

**1. Core Architecture**
- Next.js 15 App Router
- TypeScript throughout
- Tailwind CSS with custom glass morphism styles

**2. Evolutionary Algorithm**
- Fitness-weighted gene selection
- Gene extraction from generated ideas
- Fitness adjustment based on scores

**3. API Routes**
- `/api/generate` - Generate idea from genes
- `/api/score` - Score idea with framework
- `/api/extract` - Extract new genes

**4. UI Components**
- `GenePool` - Visual gene pool with fitness indicators
- `BreedingView` - Current generation status and idea display
- `Leaderboard` - Top 10 ideas ranked by score
- `ActivityLog` - Real-time evolution activity

**5. Moonshot Integration**
- Kimi K2 model for all AI operations
- JSON-only responses for reliable parsing
- Different temperatures for different tasks (0.9 generate, 0.3 score, 0.7 extract)

### Files Created
- `app/page.tsx` - Main application
- `app/api/generate/route.ts`
- `app/api/score/route.ts`
- `app/api/extract/route.ts`
- `components/GenePool.tsx`
- `components/BreedingView.tsx`
- `components/Leaderboard.tsx`
- `components/ActivityLog.tsx`
- `app/globals.css` - Custom styles

### Status
- **Initial deployment:** Successful on Netlify
- **Core loop:** Working (generate → score → extract → update fitness)
