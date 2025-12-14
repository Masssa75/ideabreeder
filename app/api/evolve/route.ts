import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface Gene {
  id: string;
  text: string;
  fitness: number;
  offspring_count: number;
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow if no secret configured or if it matches
      if (cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Check if evolution is running
    const { data: state, error: stateError } = await supabase
      .from('evolution_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (stateError) {
      return NextResponse.json({ error: 'Failed to get state' }, { status: 500 });
    }

    if (!state?.is_running) {
      return NextResponse.json({
        message: 'Evolution is paused',
        is_running: false,
        generation: state?.current_generation || 1
      });
    }

    console.log(`Starting background generation ${state.current_generation}`);

    // 1. Get genes from database
    const { data: genes, error: genesError } = await supabase
      .from('genes')
      .select('*')
      .order('fitness', { ascending: false })
      .limit(50);

    if (genesError || !genes || genes.length < 3) {
      return NextResponse.json({ error: 'Not enough genes' }, { status: 500 });
    }

    // 2. Select genes by fitness
    const selectedGenes = selectGenesByFitness(genes, 3);
    console.log('Selected genes:', selectedGenes);

    // 3. Generate idea
    const idea = await generateIdea(selectedGenes);
    console.log('Generated:', idea.name);

    // 4. Score idea
    const { scores, reasoning } = await scoreIdea(idea);
    const virusScore = scores.virality + scores.immediacy + scores.recurrence + scores.urgency + scores.simplicity;
    console.log('Scored:', virusScore);

    // 5. Extract new genes
    const extractedGenes = await extractGenes(idea);
    console.log('Extracted:', extractedGenes);

    // 6. Save idea to database
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
    });

    if (ideaError) console.error('Failed to save idea:', ideaError);

    // 7. Update gene fitness
    const fitnessDelta = (virusScore - 25) / 25;
    for (const geneText of selectedGenes) {
      await updateGeneFitness(geneText, fitnessDelta);
    }

    // 8. Add extracted genes
    for (const geneText of extractedGenes) {
      await upsertGene(geneText, fitnessDelta * 0.5);
    }

    // 9. Update evolution state
    await supabase
      .from('evolution_state')
      .update({
        current_generation: state.current_generation + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq('id', 1);

    return NextResponse.json({
      success: true,
      generation: state.current_generation,
      idea: idea.name,
      virus_score: virusScore,
      genes_used: selectedGenes,
      genes_extracted: extractedGenes,
    });
  } catch (error) {
    console.error('Evolution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

function selectGenesByFitness(genes: Gene[], count: number): string[] {
  const totalFitness = genes.reduce((sum, g) => sum + Number(g.fitness), 0);
  const selected: string[] = [];
  const available = [...genes];

  while (selected.length < count && available.length > 0) {
    let random = Math.random() * totalFitness;
    for (let i = 0; i < available.length; i++) {
      random -= Number(available[i].fitness);
      if (random <= 0) {
        selected.push(available[i].text);
        available.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}

async function generateIdea(genes: string[]) {
  const genesText = genes.map(g => `"${g}"`).join(', ');

  const prompt = `You are a startup idea generator. Given these concept fragments (genes), combine them creatively to generate ONE novel startup idea.

GENES TO COMBINE:
${genesText}

IMPORTANT: Generate diverse ideas across ALL industries and business models:
- Consumer apps (dating, fitness, food, entertainment, travel)
- Marketplaces (local services, niche verticals)
- Health & wellness
- Education & learning
- Finance & investing
- Hardware + software combos
- Social/community platforms
Do NOT default to B2B SaaS, productivity tools, or workspace apps.

Generate a startup idea that creatively combines these concepts. The idea should be:
- Specific and actionable (not vague)
- Something that could realistically be built
- Novel - not just an obvious combination
- Surprising industry or audience - avoid the obvious

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "name": "Short catchy name (2-4 words)",
  "description": "One paragraph describing the startup idea, what it does, who it's for, and how it makes money. Be specific.",
  "hook": "One sentence pitch that would make someone stop scrolling"
}`;

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
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
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanContent);
}

async function scoreIdea(idea: { name: string; description: string; hook: string }) {
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
}`;

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
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
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanContent);
}

async function extractGenes(idea: { name: string; description: string; hook: string }) {
  const prompt = `Extract 3-5 reusable concept fragments (genes) from this startup idea that could be combined with other concepts to create new ideas.

IDEA: ${idea.name}
${idea.description}

Extract atomic, reusable concepts like:
- Business mechanics (e.g., "auction-based pricing", "peer verification")
- User behaviors (e.g., "daily check-in", "photo-based input")
- Psychological triggers (e.g., "scarcity timer", "social proof")
- Target niches (e.g., "new parents", "remote workers")

Respond with ONLY a JSON array of 3-5 strings:
["concept one", "concept two", "concept three"]`;

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
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
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanContent);
}

async function updateGeneFitness(geneText: string, delta: number) {
  const normalizedText = geneText.toLowerCase().trim();

  const { data: existing } = await supabase
    .from('genes')
    .select('*')
    .eq('text', normalizedText)
    .single();

  if (existing) {
    await supabase
      .from('genes')
      .update({
        fitness: Math.max(0.5, Math.min(10, Number(existing.fitness) + delta)),
        offspring_count: (existing.offspring_count || 0) + 1,
      })
      .eq('id', existing.id);
  }
}

async function upsertGene(geneText: string, fitness: number) {
  const normalizedText = geneText.toLowerCase().trim();

  const { data: existing } = await supabase
    .from('genes')
    .select('id')
    .eq('text', normalizedText)
    .single();

  if (!existing) {
    await supabase.from('genes').insert({
      text: normalizedText,
      fitness: Math.max(0.5, Math.min(10, 5 + fitness)),
      offspring_count: 0,
    });
  }
}

// Also support GET for easy testing
export async function GET() {
  const { data: state } = await supabase
    .from('evolution_state')
    .select('*')
    .eq('id', 1)
    .single();

  const { data: ideas } = await supabase
    .from('ideas')
    .select('name, virus_score, generation')
    .order('created_at', { ascending: false })
    .limit(5);

  const { count: geneCount } = await supabase
    .from('genes')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    status: state?.is_running ? 'running' : 'paused',
    current_generation: state?.current_generation || 1,
    last_run_at: state?.last_run_at,
    gene_count: geneCount,
    recent_ideas: ideas,
  });
}
