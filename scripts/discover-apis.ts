/**
 * DataGold API Discovery Script
 *
 * Uses Kimi K2 to discover APIs relevant to a specific domain, location, or use case.
 * Adds discovered APIs to the ingestion queue for background processing.
 *
 * Usage:
 *   npx tsx scripts/discover-apis.ts "Phuket tourism"
 *   npx tsx scripts/discover-apis.ts "Thailand education data"
 *   npx tsx scripts/discover-apis.ts "Southeast Asia weather and climate"
 *   npx tsx scripts/discover-apis.ts "Thai government open data"
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

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

const DISCOVERY_PROMPT = (topic: string) => `You are an API researcher. Find real, publicly accessible APIs that would be valuable for someone interested in: "${topic}"

IMPORTANT RULES:
1. Only suggest APIs that ACTUALLY EXIST and are publicly documented
2. Focus on APIs with interesting data that could power a viral app
3. Include both global APIs (that have data relevant to the topic) and local/regional APIs
4. Think about what a developer building apps for this niche would need

Search the web to find:
- Government open data portals (national, regional, city-level)
- Industry-specific APIs
- Geographic/location data APIs
- Real-time data feeds
- Statistical databases
- Any unique or surprising data sources

For each API, provide:
- The official name (as it should be searched)
- Why it's relevant to "${topic}"
- What kind of app could be built with it

Output as JSON array:
[
  {
    "api_name": "Official API Name",
    "relevance": "Why this is relevant",
    "app_idea": "What could be built with this"
  }
]

Find 10-15 APIs. Be creative - think about what data would make a developer say "I could build something amazing with this!"`

const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: 'Search the web for APIs and data sources',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'fetch',
      description: 'Fetch a URL to read API documentation',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'rethink',
      description: 'Organize thoughts before responding',
      parameters: {
        type: 'object',
        properties: {
          thought: { type: 'string', description: 'Thought process' }
        },
        required: ['thought']
      }
    }
  }
];

interface DiscoveredApi {
  api_name: string;
  relevance: string;
  app_idea: string;
}

async function discoverApis(topic: string): Promise<DiscoveredApi[]> {
  console.log(`\n🔍 Discovering APIs for: "${topic}"\n`);

  const messages: any[] = [
    { role: 'user', content: DISCOVERY_PROMPT(topic) }
  ];

  let maxTurns = 20;
  let turn = 0;

  while (turn < maxTurns) {
    turn++;
    console.log(`   Turn ${turn}...`);

    const response = await client.chat.completions.create({
      model: 'kimi-k2-0711-preview',
      messages,
      tools,
      temperature: 0.7,
      max_tokens: 8192
    });

    const message = response.choices[0]?.message;
    if (!message) return [];

    messages.push(message);

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || '{}');
        console.log(`   🔧 ${toolName}: ${args.query || args.url || args.thought?.substring(0, 50) + '...'}`);

        messages.push({
          role: 'tool',
          content: JSON.stringify({ status: 'executed' }),
          tool_call_id: toolCall.id
        });
      }
      continue;
    }

    if (message.content) {
      let jsonStr = message.content;
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('Could not find JSON array in response');
        return [];
      }

      return JSON.parse(jsonMatch[0]);
    }
  }

  return [];
}

async function addToQueue(apis: DiscoveredApi[], topic: string): Promise<number> {
  // Get existing APIs and queue items to avoid duplicates
  const { data: existingApis } = await supabase.from('apis').select('title');
  const { data: existingQueue } = await supabase.from('api_ingestion_queue').select('api_name');

  const existingNames = new Set([
    ...(existingApis?.map(a => a.title.toLowerCase()) || []),
    ...(existingQueue?.map(q => q.api_name.toLowerCase()) || [])
  ]);

  const newApis = apis.filter(api =>
    !existingNames.has(api.api_name.toLowerCase())
  );

  if (newApis.length === 0) {
    console.log('\nAll discovered APIs are already in the system.');
    return 0;
  }

  const toInsert = newApis.map(api => ({
    api_name: api.api_name,
    status: 'pending',
    source: `discovery:${topic}`
  }));

  const { error } = await supabase
    .from('api_ingestion_queue')
    .insert(toInsert);

  if (error) {
    console.error('Error adding to queue:', error);
    return 0;
  }

  return newApis.length;
}

async function main() {
  const topic = process.argv.slice(2).join(' ');

  if (!topic) {
    console.log(`
DataGold API Discovery
======================

Discovers APIs relevant to a specific domain, location, or use case.

Usage:
  npx tsx scripts/discover-apis.ts "<topic>"

Examples:
  npx tsx scripts/discover-apis.ts "Phuket tourism"
  npx tsx scripts/discover-apis.ts "Thailand education"
  npx tsx scripts/discover-apis.ts "Southeast Asia weather"
  npx tsx scripts/discover-apis.ts "Thai government open data"
  npx tsx scripts/discover-apis.ts "marine life and ocean data"
  npx tsx scripts/discover-apis.ts "real estate in Thailand"

The discovered APIs will be added to the ingestion queue and
processed automatically by the cron job (5 every 5 minutes).
`);
    process.exit(1);
  }

  const apis = await discoverApis(topic);

  if (apis.length === 0) {
    console.log('\n❌ No APIs discovered. Try a different topic.');
    process.exit(1);
  }

  console.log(`\n✨ Discovered ${apis.length} APIs:\n`);
  apis.forEach((api, i) => {
    console.log(`${i + 1}. ${api.api_name}`);
    console.log(`   Relevance: ${api.relevance}`);
    console.log(`   App idea: ${api.app_idea}\n`);
  });

  const added = await addToQueue(apis, topic);

  if (added > 0) {
    console.log(`\n✅ Added ${added} new APIs to ingestion queue`);
    console.log(`They will be processed automatically by the cron job.`);
  }
}

main();
