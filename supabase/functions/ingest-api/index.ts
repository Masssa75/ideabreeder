import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MOONSHOT_API_KEY = Deno.env.get('MOONSHOT_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const SYSTEM_PROMPT = `You are an expert API researcher. Your job is to research APIs thoroughly and extract structured data about them.

When researching an API:
1. Use web_search to find official documentation, statistics, and capabilities
2. Use fetch to read the actual API documentation pages
3. Use rethink to organize your findings before responding

Always provide accurate, verifiable information. If you can't find specific numbers, say so rather than making them up.`

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
- CAPABILITIES: 8-15 specific things you can DO with this API (endpoints, data you can fetch, actions you can perform). Be comprehensive - this is the source of truth for what the API offers.
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
  "capabilities": [],
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
}`

const tools = [
  {
    type: 'function',
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
    type: 'function',
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
    type: 'function',
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
]

async function researchApi(apiName: string): Promise<any | null> {
  const messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT_TEMPLATE(apiName) }
  ]

  let maxTurns = 15
  let turn = 0

  while (turn < maxTurns) {
    turn++
    console.log(`[${apiName}] Turn ${turn}...`)

    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: 'kimi-k2-0711-preview',
        messages,
        tools,
        temperature: 0.6,
        max_tokens: 8192
      })
    })

    const data = await response.json()
    const message = data.choices?.[0]?.message
    if (!message) return null

    messages.push(message)

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        console.log(`[${apiName}] Tool: ${toolCall.function.name}`)
        messages.push({
          role: 'tool',
          content: JSON.stringify({ status: 'executed' }),
          tool_call_id: toolCall.id
        })
      }
      continue
    }

    if (message.content) {
      let jsonStr = message.content
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      }

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      return JSON.parse(jsonMatch[0])
    }
  }

  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!MOONSHOT_API_KEY) {
      throw new Error('MOONSHOT_API_KEY not configured')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const body = await req.json().catch(() => ({}))
    
    let apisToProcess: string[] = []

    // Mode 1: Process from queue (default for cron)
    if (body.fromQueue || (!body.apiNames && !body.apiName)) {
      const { data: queueItems } = await supabase
        .from('api_ingestion_queue')
        .select('id, api_name')
        .eq('status', 'pending')
        .order('id')
        .limit(5)

      if (!queueItems || queueItems.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No pending APIs in queue', count: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark as processing
      const ids = queueItems.map(q => q.id)
      await supabase
        .from('api_ingestion_queue')
        .update({ status: 'processing' })
        .in('id', ids)

      apisToProcess = queueItems.map(q => q.api_name)
      console.log(`Processing ${apisToProcess.length} APIs from queue`)
    } 
    // Mode 2: Process specific APIs
    else {
      apisToProcess = body.apiNames || [body.apiName]
    }

    const results: any[] = []

    for (const apiName of apisToProcess) {
      console.log(`Processing: ${apiName}`)

      // Check if already in apis table
      const { data: existing } = await supabase
        .from('apis')
        .select('id')
        .ilike('title', `%${apiName.replace(' API', '')}%`)
        .limit(1)

      if (existing && existing.length > 0) {
        console.log(`Skipping ${apiName} - already exists in apis table`)
        await supabase
          .from('api_ingestion_queue')
          .update({ status: 'completed', processed_at: new Date().toISOString() })
          .eq('api_name', apiName)
        results.push({ apiName, status: 'skipped', reason: 'already exists' })
        continue
      }

      // Research the API
      const apiData = await researchApi(apiName)

      if (!apiData) {
        console.log(`Failed to research ${apiName}`)
        await supabase
          .from('api_ingestion_queue')
          .update({ status: 'failed', last_error: 'Research returned null' })
          .eq('api_name', apiName)
        results.push({ apiName, status: 'failed', reason: 'research failed' })
        continue
      }

      // Save to apis table
      const { error } = await supabase
        .from('apis')
        .upsert({
          title: apiData.title,
          hook: apiData.hook,
          description: apiData.description,
          capabilities: apiData.capabilities,
          bullets: apiData.bullets,
          what_it_contains: apiData.what_it_contains,
          who_uses_this: apiData.who_uses_this,
          technical: apiData.technical,
          free: apiData.free,
          url: apiData.url,
          category: apiData.category
        }, { onConflict: 'title' })

      if (error) {
        console.log(`Error saving ${apiName}: ${error.message}`)
        await supabase
          .from('api_ingestion_queue')
          .update({ status: 'failed', last_error: error.message })
          .eq('api_name', apiName)
        results.push({ apiName, status: 'failed', reason: error.message })
      } else {
        console.log(`Saved: ${apiData.title}`)
        await supabase
          .from('api_ingestion_queue')
          .update({ 
            status: 'completed', 
            result_hook: apiData.hook,
            processed_at: new Date().toISOString() 
          })
          .eq('api_name', apiName)
        results.push({ apiName, status: 'success', hook: apiData.hook })
      }

      // Rate limiting
      if (apisToProcess.indexOf(apiName) < apisToProcess.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, count: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
