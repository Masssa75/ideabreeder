/**
 * DataGold API Ingestion Script
 *
 * Uses Kimi K2 with web search to research APIs and extract structured data.
 *
 * Usage:
 *   npx tsx scripts/ingest-api.ts "GitHub REST API"
 *   npx tsx scripts/ingest-api.ts "NOAA Storm Events API" "PubMed API"
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { ApiInsert } from '../lib/types';

// Load environment variables
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!MOONSHOT_API_KEY) {
  console.error('Error: MOONSHOT_API_KEY not set');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Supabase credentials not set');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.ai/v1'
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SYSTEM_PROMPT = `You are an expert API researcher. Your job is to research APIs thoroughly and extract structured data about them.

When researching an API:
1. Use web_search to find official documentation, statistics, and capabilities
2. Use fetch to read the actual API documentation pages
3. Use rethink to organize your findings before responding

Always provide accurate, verifiable information. If you can't find specific numbers, say so rather than making them up.`;

const USER_PROMPT_TEMPLATE = (apiName: string) => `I'm building a database of amazing APIs for developers. Research this API thoroughly and extract structured data.

API: ${apiName}

Extract:

HOOK: One punchy "holy shit" sentence about the DATA, not the API mechanics.
Formula: "[Breadth statement] — [number], [number], [number]"
Keep it under 20 words. Focus on: scale, history, coverage, uniqueness.
NO rate limits, pricing, or technical specs in the hook.

BULLETS: 6-8 specific facts, each starting with a number

DESCRIPTION: 2-3 sentences explaining what this is

WHAT_IT_CONTAINS: List the data types inside (for search matching)

WHO_USES_THIS: Who would want this? (5-6 max)

TECHNICAL: auth type, rate limits, formats, pricing

Output as JSON only (no markdown code blocks):
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

interface KimiResponse {
  title: string;
  hook: string;
  description: string;
  bullets: string[];
  what_it_contains: string[];
  who_uses_this: string[];
  technical: {
    auth: string;
    rate_limit: string;
    formats: string[];
    pricing?: string;
  };
  free: boolean;
  url: string;
  category: string;
}

async function researchApi(apiName: string): Promise<KimiResponse | null> {
  console.log(`\n🔍 Researching: ${apiName}`);

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
    let maxTurns = 10;
    let turn = 0;

    while (turn < maxTurns) {
      turn++;
      console.log(`   Turn ${turn}...`);

      const response = await client.chat.completions.create({
        model: 'kimi-k2-0711-preview',
        messages,
        tools,
        temperature: 0.6,
        max_tokens: 8192
      });

      const message = response.choices[0]?.message;
      if (!message) {
        console.error('❌ No message in response');
        return null;
      }

      // Add assistant message to history
      messages.push(message);

      // Check if we have tool calls to process
      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          console.log(`   🔧 Tool: ${toolName}`);

          // Kimi K2 handles tool execution internally - we just need to acknowledge
          // The tool results come back encrypted from Moonshot's servers
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

        // Parse JSON from response
        let jsonStr = content;
        if (content.includes('```json')) {
          jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (content.includes('```')) {
          jsonStr = content.replace(/```\n?/g, '');
        }

        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('❌ Could not find JSON in response');
          console.log('Response:', content.substring(0, 500));
          return null;
        }

        const parsed: KimiResponse = JSON.parse(jsonMatch[0]);
        console.log(`✅ Successfully researched: ${parsed.title}`);
        return parsed;
      }

      // No content and no tool calls - something went wrong
      console.error('❌ No content or tool calls in response');
      return null;
    }

    console.error('❌ Max turns reached without final response');
    return null;

  } catch (error) {
    console.error(`❌ Error researching ${apiName}:`, error);
    return null;
  }
}

async function saveToSupabase(data: KimiResponse): Promise<boolean> {
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

  const { data: result, error } = await supabase
    .from('apis')
    .upsert(apiInsert, { onConflict: 'title' })
    .select()
    .single();

  if (error) {
    console.error(`❌ Error saving to Supabase:`, error.message);
    return false;
  }

  console.log(`💾 Saved to database: ${result.title}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/ingest-api.ts "API Name" ["API Name 2" ...]');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/ingest-api.ts "GitHub REST API"');
    console.log('  npx tsx scripts/ingest-api.ts "NOAA Storm Events" "PubMed API"');
    process.exit(1);
  }

  console.log(`\n🚀 DataGold API Ingestion`);
  console.log(`📋 Processing ${args.length} API(s)...\n`);

  let success = 0;
  let failed = 0;

  for (const apiName of args) {
    const result = await researchApi(apiName);

    if (result) {
      const saved = await saveToSupabase(result);
      if (saved) {
        success++;
        console.log(`   Hook: "${result.hook}"\n`);
      } else {
        failed++;
      }
    } else {
      failed++;
    }

    // Rate limiting - wait 2 seconds between API calls
    if (args.indexOf(apiName) < args.length - 1) {
      console.log('⏳ Waiting 2s before next request...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n✨ Done! Success: ${success}, Failed: ${failed}`);
}

main();
