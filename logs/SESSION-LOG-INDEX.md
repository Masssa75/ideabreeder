# Session Log Index

This index provides a comprehensive overview of all IdeaBreeder development sessions. For detailed session logs, see the individual log files.

## 2025

### December 2025 Sessions

#### [December 15, 2025 - Web Search Integration & History Modal](SESSION-LOG-2025-12.md#session---december-15-2025-web-search-integration--history-modal)
- **Web search enabled:** Added Kimi K2 `$web_search` builtin tool to idea generation
- **Research-first prompts:** AI now researches problems, APIs, and market gaps before generating
- **History modal:** Full history view with sorting (date/score), detail view with scores breakdown
- **Seed genes updated:** Replaced virality-focused genes with utility/data/API focused patterns
- **USEFUL scoring:** Supports both legacy VIRUS (5 dims, /50) and new USEFUL (6 dims, /60) display

#### [December 14-15, 2025 - USEFUL Framework & Meta-Aware Prompts](SESSION-LOG-2025-12.md#session---december-14-15-2025-useful-framework--meta-aware-prompts)
- **VIRUS → USEFUL:** Changed scoring from virality-focused to utility-focused
- **Meta-aware prompts:** AI now knows it's part of an evolutionary system
- **Scoring dimensions:** Utility, Simplicity, Economics, Frequency, Uniqueness, Leverage
- **Gene diversity fix:** Addressed convergence issue (all badge/workout ideas)

#### [December 14, 2025 - Supabase Integration & Background Evolution](SESSION-LOG-2025-12.md#session---december-14-2025-supabase-integration--background-evolution)
- **Database setup:** Created genes, ideas, evolution_state tables with RLS
- **pg_cron:** Background evolution every 5 minutes via Supabase cron
- **Realtime updates:** Subscribed to database changes for live UI updates
- **Seed genes:** Initial 30+ genes covering various patterns

#### [December 13-14, 2025 - Initial Build](SESSION-LOG-2025-12.md#session---december-13-14-2025-initial-build)
- **Core architecture:** Next.js 15 with evolutionary algorithm
- **Gene pool:** Fitness-weighted selection, gene extraction from ideas
- **Scoring system:** Initial VIRUS framework (later replaced)
- **UI components:** GenePool, BreedingView, Leaderboard, ActivityLog
- **Moonshot API:** Kimi K2 integration for idea generation and scoring
