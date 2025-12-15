/**
 * Hook Experimentation Script
 *
 * Tests different prompt styles to find the best "holy shit" format
 */

import 'dotenv/config';
import OpenAI from 'openai';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

if (!MOONSHOT_API_KEY) {
  console.error('Error: MOONSHOT_API_KEY not set');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.ai/v1'
});

// Different prompt styles to test
const PROMPT_STYLES = {
  discovery: (apiName: string) => `You are a researcher who discovers mind-blowing facts about data sources.

Research this API: ${apiName}

Write ONE "Did You Know?" fact that would make a developer say "holy shit, I had no idea this existed."

Rules:
- Start with "There's a..." or "You can access..." or "Every..."
- Include 1-2 specific numbers that show scale
- Focus on the SURPRISING thing you can do with this data
- Make it feel like a secret you're sharing, not a product description
- Keep it under 30 words

Mark the 2-3 most impactful phrases with **bold** (these will be highlighted in yellow).

Examples of the style I want:
- "There's a real-time feed of **every ship** in the ocean — position, cargo type, destination. **400,000+ vessels** tracked live."
- "You can query **every earthquake** that's happened since 1900 — magnitude, depth, location. **5 million events**, updated every minute."
- "There's a database of **every drug interaction** ever studied — **2.5 million** combinations, free to query."

Output format:
HOOK: [your hook with **bold** markers]
SOURCE_NAME: [clean name for the source link]
FREE: [true/false]`,

  secret: (apiName: string) => `You discover hidden data treasures that most developers don't know exist.

Research: ${apiName}

Write a single sentence that reveals this data source like you're sharing a secret with a friend.

The sentence should:
- Sound like "Did you know there's a way to..."
- Include a mind-blowing number
- Make someone want to immediately try it
- Be under 25 words

Use **bold** on 2-3 key phrases for emphasis.

Format:
HOOK: [sentence]
SOURCE_NAME: [name]
FREE: [true/false]`,

  trivia: (apiName: string) => `You write viral "Did You Know?" facts for developers.

Research: ${apiName}

Write ONE fact that would get shared on Twitter/X because it's so surprising.

Rules:
- Lead with the most surprising capability
- Include specific numbers (the bigger the better)
- Frame it as discovery, not documentation
- Under 30 words

Mark **key phrases** to highlight.

Examples:
- "**Every patent ever filed** in the US is searchable via API — **11 million documents**, full text, dating back to 1790."
- "NASA gives you **500,000+ Mars photos** for free — every rover, every sol, every camera angle. Just an API call away."

Output:
HOOK: [fact with **bold**]
SOURCE_NAME: [name]
FREE: [true/false]`
};

async function testPrompt(apiName: string, style: string, prompt: string): Promise<string | null> {
  try {
    const messages: any[] = [
      { role: 'user', content: prompt }
    ];

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'web_search',
          description: 'Search the web',
          parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'fetch',
          description: 'Fetch a URL',
          parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }
        }
      }
    ];

    let maxTurns = 8;
    let turn = 0;

    while (turn < maxTurns) {
      turn++;

      const response = await client.chat.completions.create({
        model: 'kimi-k2-0711-preview',
        messages,
        tools,
        temperature: 0.7,
        max_tokens: 1000
      });

      const message = response.choices[0]?.message;
      if (!message) return null;

      messages.push(message);

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

      if (message.content) {
        return message.content;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error:`, error);
    return null;
  }
}

async function main() {
  const testApis = [
    'AIS Ship Tracking API',
    'USGS Earthquake API',
    'USPTO Patent Database API',
    'NASA Mars Rover Photos API'
  ];

  const stylesToTest = ['discovery', 'trivia'];

  console.log('🧪 Hook Experimentation\n');
  console.log('='.repeat(80));

  for (const apiName of testApis) {
    console.log(`\n📡 ${apiName}`);
    console.log('-'.repeat(80));

    for (const style of stylesToTest) {
      const prompt = PROMPT_STYLES[style as keyof typeof PROMPT_STYLES](apiName);

      process.stdout.write(`   [${style}] Researching...`);
      const result = await testPrompt(apiName, style, prompt);

      if (result) {
        // Extract just the HOOK line
        const hookMatch = result.match(/HOOK:\s*(.+?)(?:\n|$)/i);
        const hook = hookMatch ? hookMatch[1].trim() : result.split('\n')[0];
        console.log(`\n   ${style.toUpperCase()}: ${hook}\n`);
      } else {
        console.log(' FAILED\n');
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Done! Review the hooks above and pick the best style.');
}

main();
