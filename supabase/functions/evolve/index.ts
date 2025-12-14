import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Gene {
  id: string
  text: string
  fitness: number
  offspring_count: number
}

interface Scores {
  virality: number
  immediacy: number
  recurrence: number
  urgency: number
  simplicity: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const moonshotKey = Deno.env.get('MOONSHOT_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if evolution is running
    const { data: state } = await supabase
      .from('evolution_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (!state?.is_running) {
      return new Response(
        JSON.stringify({ message: 'Evolution is paused', state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting generation ${state.current_generation}`)

    // 1. Select genes (fitness-weighted)
    const { data: genes } = await supabase
      .from('genes')
      .select('*')
      .order('fitness', { ascending: false })
      .limit(50)

    if (!genes || genes.length < 3) {
      throw new Error('Not enough genes in pool')
    }

    const selectedGenes = selectGenesByFitness(genes, 3)
    console.log('Selected genes:', selectedGenes)

    // 2. Generate idea from genes
    const idea = await generateIdea(selectedGenes, moonshotKey)
    console.log('Generated idea:', idea.name)

    // 3. Score the idea
    const { scores, reasoning } = await scoreIdea(idea, moonshotKey)
    const virusScore = scores.virality + scores.immediacy + scores.recurrence + scores.urgency + scores.simplicity
    console.log('Scored:', virusScore)

    // 4. Extract new genes
    const extractedGenes = await extractGenes(idea, moonshotKey)
    console.log('Extracted genes:', extractedGenes)

    // 5. Save the idea
    const { error: ideaError } = await supabase.from('ideas').insert({
      name: idea.name,
      description: idea.description,
      hook: idea.hook,
      virus_score: virusScore,
      scores,
      genes_used: selectedGenes,
      genes_extracted: extractedGenes,
      reasoning,
      generation: state.current_generation,
    })

    if (ideaError) console.error('Failed to save idea:', ideaError)

    // 6. Update gene fitness based on score
    const fitnessDelta = (virusScore - 25) / 25 // -1 to +1 based on score
    for (const geneText of selectedGenes) {
      await updateGeneFitness(supabase, geneText, fitnessDelta)
    }

    // 7. Add extracted genes to pool
    for (const geneText of extractedGenes) {
      await upsertGene(supabase, geneText, fitnessDelta * 0.5)
    }

    // 8. Update evolution state
    await supabase
      .from('evolution_state')
      .update({
        current_generation: state.current_generation + 1,
        status: 'complete',
        last_run_at: new Date().toISOString(),
      })
      .eq('id', 1)

    return new Response(
      JSON.stringify({
        success: true,
        generation: state.current_generation,
        idea: idea.name,
        virus_score: virusScore,
        genes_used: selectedGenes,
        genes_extracted: extractedGenes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Evolution error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function selectGenesByFitness(genes: Gene[], count: number): string[] {
  const totalFitness = genes.reduce((sum, g) => sum + g.fitness, 0)
  const selected: string[] = []
  const available = [...genes]

  while (selected.length < count && available.length > 0) {
    let random = Math.random() * totalFitness
    for (let i = 0; i < available.length; i++) {
      random -= available[i].fitness
      if (random <= 0) {
        selected.push(available[i].text)
        available.splice(i, 1)
        break
      }
    }
  }

  return selected
}

async function generateIdea(genes: string[], apiKey: string) {
  const genesText = genes.map(g => `"${g}"`).join(', ')

  const prompt = `You are a startup idea generator. Given these concept fragments (genes), combine them creatively to generate ONE novel startup idea.

GENES TO COMBINE:
${genesText}

IMPORTANT: Generate diverse ideas across ALL industries - consumer apps, health, food, entertainment, finance, education, etc. Do NOT default to B2B SaaS or productivity tools.

Generate a startup idea that creatively combines these concepts. The idea should be:
- Specific and actionable (not vague)
- Something that could realistically be built
- Novel - not just an obvious combination
- Could be B2C, B2B, marketplace, or any business model

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "name": "Short catchy name (2-4 words)",
  "description": "One paragraph describing the startup idea, what it does, who it's for, and how it makes money. Be specific.",
  "hook": "One sentence pitch that would make someone stop scrolling"
}`

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-k2-0905-preview',
      messages: [
        { role: 'system', content: 'You are a creative startup idea generator. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.95,
      max_tokens: 500,
    }),
  })

  const data = await response.json()
  const content = data.choices[0].message.content
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleanContent)
}

async function scoreIdea(idea: { name: string; description: string; hook: string }, apiKey: string) {
  const prompt = `Score this startup idea using the VIRUS framework (0-10 each):

NAME: ${idea.name}
DESCRIPTION: ${idea.description}
HOOK: ${idea.hook}

VIRUS Framework:
- Virality (0-10): How likely are users to share this? Built-in sharing mechanics?
- Immediacy (0-10): How fast can someone get value? Instant gratification?
- Recurrence (0-10): Will users come back daily/weekly? Habit-forming?
- Urgency (0-10): Why would someone sign up TODAY? Time pressure?
- Simplicity (0-10): Can you explain it in one sentence? Easy to understand?

Respond with ONLY a JSON object:
{
  "scores": { "virality": X, "immediacy": X, "recurrence": X, "urgency": X, "simplicity": X },
  "reasoning": "Brief 1-2 sentence analysis of strengths and weaknesses"
}`

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-k2-0905-preview',
      messages: [
        { role: 'system', content: 'You are a startup analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  })

  const data = await response.json()
  const content = data.choices[0].message.content
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleanContent)
}

async function extractGenes(idea: { name: string; description: string; hook: string }, apiKey: string) {
  const prompt = `Extract 3-5 reusable concept fragments (genes) from this startup idea that could be combined with other concepts to create new ideas.

IDEA: ${idea.name}
${idea.description}

Extract atomic, reusable concepts like:
- Business mechanics (e.g., "auction-based pricing", "peer verification")
- User behaviors (e.g., "daily check-in", "photo-based input")
- Psychological triggers (e.g., "scarcity timer", "social proof")
- Target niches (e.g., "new parents", "remote workers")

Respond with ONLY a JSON array of 3-5 strings:
["concept one", "concept two", "concept three"]`

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-k2-0905-preview',
      messages: [
        { role: 'system', content: 'You are a concept analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  })

  const data = await response.json()
  const content = data.choices[0].message.content
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleanContent)
}

async function updateGeneFitness(supabase: any, geneText: string, delta: number) {
  const normalizedText = geneText.toLowerCase().trim()

  const { data: existing } = await supabase
    .from('genes')
    .select('*')
    .eq('text', normalizedText)
    .single()

  if (existing) {
    await supabase
      .from('genes')
      .update({
        fitness: Math.max(0.5, Math.min(10, existing.fitness + delta)),
        offspring_count: existing.offspring_count + 1,
      })
      .eq('id', existing.id)
  }
}

async function upsertGene(supabase: any, geneText: string, fitness: number) {
  const normalizedText = geneText.toLowerCase().trim()

  const { data: existing } = await supabase
    .from('genes')
    .select('id')
    .eq('text', normalizedText)
    .single()

  if (!existing) {
    await supabase.from('genes').insert({
      text: normalizedText,
      fitness: Math.max(0.5, Math.min(10, 5 + fitness)),
      offspring_count: 0,
    })
  }
}
