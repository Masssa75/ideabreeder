/**
 * DataGold Batch Ingestion Script
 *
 * Processes a list of APIs in batches with rate limiting.
 *
 * Usage:
 *   npx tsx scripts/batch-ingest.ts              # Run all
 *   npx tsx scripts/batch-ingest.ts --batch 0    # First 10 APIs
 *   npx tsx scripts/batch-ingest.ts --batch 1    # APIs 11-20
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { ApiInsert } from '../lib/types';

// Load environment variables
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!MOONSHOT_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing environment variables');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.ai/v1'
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Curated list of amazing APIs
const API_LIST = [
  // Government & Public Data
  'NOAA Storm Events Database API',
  'EPA Toxics Release Inventory API',
  'PACER Federal Court Records API',
  'FDA Food Recall API',
  'Census Bureau ACS API',
  'USPTO Patent Database API',
  'SEC EDGAR API',
  'FEC Campaign Finance API',
  'USGS Earthquake API',
  'NASA Open APIs',

  // Finance & Business
  'Crunchbase API',
  'FRED Federal Reserve Economic Data API',
  'Alpha Vantage Stock API',
  'Yahoo Finance API',
  'CoinGecko Cryptocurrency API',
  'OpenCorporates API',
  'IEX Cloud API',

  // Health & Science
  'PubMed API',
  'ClinicalTrials.gov API',
  'OpenFDA API',
  'UniProt Protein Database API',
  'ChEMBL Drug Database API',
  'Human Genome API',
  'CDC Wonder API',

  // Geospatial & Mapping
  'OpenStreetMap Overpass API',
  'NASA Earthdata API',
  'USGS National Map API',
  'AIS Ship Tracking API',
  'OpenSky Flight Tracking API',
  'GeoNames API',
  'What3Words API',

  // Technology & Development
  'GitHub REST API',
  'GitLab API',
  'npm Registry API',
  'PyPI API',
  'Stack Exchange API',
  'Hacker News API',
  'Product Hunt API',

  // Media & Content
  'GDELT Global News API',
  'Internet Archive API',
  'Wikimedia API',
  'TMDB Movie Database API',
  'Spotify Web API',
  'YouTube Data API',
  'Reddit API',

  // AI & Machine Learning
  'Hugging Face API',
  'OpenAI API',
  'Replicate API',
  'Clarifai API',

  // Weather & Environment
  'OpenWeatherMap API',
  'Weather.gov API',
  'AirNow Air Quality API',
  'Sunrise-Sunset API',

  // Communication
  'Twilio API',
  'SendGrid API',
  'Discord API',
  'Slack API',

  // Infrastructure
  'Cloudflare API',
  'AWS SDK',
  'Stripe API',
  'Plaid API',

  // Niche & Interesting
  'OpenLibrary API',
  'Chronicling America Historic Newspapers API',
  'NASA Astronomy Picture of the Day API',
  'SpaceX API',
  'Pokemon API',
  'Open Food Facts API',
  'Open Brewery DB API',
  'Dog CEO API',
  'Cat Facts API',
  'Random User Generator API',
];

const SYSTEM_PROMPT = `You are an expert API researcher. Your job is to research APIs thoroughly and extract structured data about them.

When researching an API:
1. Use web_search to find official documentation, statistics, and capabilities
2. Use fetch to read the actual API documentation pages
3. Use rethink to organize your findings before responding

Always provide accurate, verifiable information. If you can't find specific numbers, say so rather than making them up.`;

const USER_PROMPT_TEMPLATE = (apiName: string) => `Research this API and extract structured data for a "Did You Know?" style directory.

API: ${apiName}

HOOK FORMAT (CRITICAL):
Write ONE "Did You Know?" fact that makes developers say "holy shit, I had no idea."
- Start with "There's a..." or "You can access..." or "Every..."
- Include 1-2 specific mind-blowing numbers
- Frame it as a discovery, not documentation
- Keep under 30 words
- Mark 2-3 key phrases with **bold** for highlighting

GOOD EXAMPLES:
- "There's a real-time feed of **every ship** in the ocean — position, cargo type, destination. **400,000+ vessels** tracked live."
- "**Every earthquake** since 1900 is queryable — magnitude, depth, location. **5 million events**, updated every minute."
- "**Every patent ever filed** in America is searchable — **11 million documents** with full text back to 1790."

BAD (too dry/technical):
- "The USGS Earthquake API provides access to seismic data..." (boring!)
- "100M+ developers, 330M+ repositories..." (just stats, no discovery)

Also extract:
- BULLETS: 4-6 specific facts, each starting with a number
- DESCRIPTION: 2-3 sentences
- WHAT_IT_CONTAINS: Data types for search
- WHO_USES_THIS: 4-5 user types
- TECHNICAL: auth, rate limits, formats, pricing

Output as JSON only (no markdown):
{
  "title": "",
  "hook": "",
  "description": "",
  "bullets": [],
  "what_it_contains": [],
  "who_uses_this": [],
  "technical": {
    "auth": "",
    "rate_limit": "",
    "formats": [],
    "pricing": ""
  },
  "free": true,
  "url": "",
  "category": ""
}`;

async function checkIfExists(title: string): Promise<boolean> {
  const { data } = await supabase
    .from('apis')
    .select('id')
    .ilike('title', `%${title.replace(' API', '')}%`)
    .limit(1);

  return (data?.length || 0) > 0;
}

async function researchApi(apiName: string): Promise<any | null> {
  try {
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_PROMPT_TEMPLATE(apiName) }
    ];

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'web_search',
          description: 'Search the web for information',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'What to search for' },
              classes: {
                type: 'array',
                items: { type: 'string', enum: ['all', 'academic', 'social', 'library', 'finance', 'code', 'ecommerce', 'medical'] },
                description: 'Search domains to focus on'
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'rethink',
          description: 'Organize your thoughts before responding',
          parameters: {
            type: 'object',
            properties: {
              thought: { type: 'string', description: 'Your thought process' }
            },
            required: ['thought']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'fetch',
          description: 'Fetch a URL and extract its contents',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to fetch' },
              max_length: { type: 'integer', default: 5000, description: 'Max characters to return' }
            },
            required: ['url']
          }
        }
      }
    ];

    // Multi-turn conversation to handle tool calls
    let maxTurns = 15;
    let turn = 0;

    while (turn < maxTurns) {
      turn++;

      const response = await client.chat.completions.create({
        model: 'kimi-k2-0711-preview',
        messages,
        tools,
        temperature: 0.6,
        max_tokens: 8192
      });

      const message = response.choices[0]?.message;
      if (!message) return null;

      messages.push(message);

      // Check if we have tool calls to process
      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          messages.push({
            role: 'tool',
            content: JSON.stringify({ status: 'executed' }),
            tool_call_id: toolCall.id
          });
        }
        continue;
      }

      // No tool calls - check for final content
      if (message.content) {
        const content = message.content;

        let jsonStr = content;
        if (content.includes('```')) {
          jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        return JSON.parse(jsonMatch[0]);
      }
    }

    return null;

  } catch (error) {
    console.error(`Error:`, error);
    return null;
  }
}

async function saveToSupabase(data: any): Promise<boolean> {
  const apiInsert: ApiInsert = {
    title: data.title,
    hook: data.hook,
    description: data.description,
    bullets: data.bullets,
    what_it_contains: data.what_it_contains,
    who_uses_this: data.who_uses_this,
    technical: data.technical,
    free: data.free,
    url: data.url,
    category: data.category
  };

  const { error } = await supabase
    .from('apis')
    .upsert(apiInsert, { onConflict: 'title' });

  return !error;
}

async function main() {
  const args = process.argv.slice(2);
  const batchIndex = args.includes('--batch') ? parseInt(args[args.indexOf('--batch') + 1]) : -1;
  const BATCH_SIZE = 10;

  let apisToProcess = API_LIST;

  if (batchIndex >= 0) {
    const start = batchIndex * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    apisToProcess = API_LIST.slice(start, end);
    console.log(`\n🚀 Processing batch ${batchIndex} (APIs ${start + 1}-${end})`);
  } else {
    console.log(`\n🚀 Processing all ${API_LIST.length} APIs`);
  }

  console.log(`📋 APIs to process: ${apisToProcess.length}\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < apisToProcess.length; i++) {
    const apiName = apisToProcess[i];
    const progress = `[${i + 1}/${apisToProcess.length}]`;

    // Check if already exists
    const exists = await checkIfExists(apiName);
    if (exists) {
      console.log(`${progress} ⏭️  Skipping ${apiName} (already exists)`);
      skipped++;
      continue;
    }

    console.log(`${progress} 🔍 Researching: ${apiName}`);

    const result = await researchApi(apiName);

    if (result) {
      const saved = await saveToSupabase(result);
      if (saved) {
        success++;
        console.log(`${progress} ✅ Saved: ${result.title}`);
        console.log(`        Hook: "${result.hook.substring(0, 80)}..."\n`);
      } else {
        failed++;
        console.log(`${progress} ❌ Failed to save\n`);
      }
    } else {
      failed++;
      console.log(`${progress} ❌ Failed to research\n`);
    }

    // Rate limiting - wait 3 seconds between API calls
    if (i < apisToProcess.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n✨ Done!`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
}

main();
