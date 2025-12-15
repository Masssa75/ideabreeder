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

    // 1b. Get recent ideas for context
    const { data: recentIdeas } = await supabase
      .from('ideas')
      .select('name')
      .order('created_at', { ascending: false })
      .limit(5);

    const context = {
      generation: state.current_generation,
      genePoolSize: genes.length,
      recentNames: recentIdeas?.map(i => i.name) || []
    };

    // 2. Select genes by fitness
    const selectedGenes = selectGenesByFitness(genes, 3);
    console.log('Selected genes:', selectedGenes);

    // 3. Generate idea with context
    const idea = await generateIdea(selectedGenes, context);
    console.log('Generated:', idea.name);

    // 4. Score idea (new USEFUL framework - 6 dimensions, max 60)
    const { scores, reasoning } = await scoreIdea(idea);
    const totalScore = scores.utility + scores.simplicity + scores.economics + scores.frequency + scores.uniqueness + scores.leverage;
    console.log('Scored:', totalScore, '/60');

    // 5. Extract new genes with scores context
    const extractedGenes = await extractGenes(idea, scores);
    console.log('Extracted:', extractedGenes);

    // 6. Save idea to database
    const { error: ideaError } = await supabase.from('ideas').insert({
      name: idea.name,
      description: idea.description,
      hook: idea.hook,
      virus_score: totalScore, // keeping field name for compatibility
      scores,
      genes_used: selectedGenes,
      genes_extracted: extractedGenes,
      reasoning,
      generation: state.current_generation,
    });

    if (ideaError) console.error('Failed to save idea:', ideaError);

    // 7. Update gene fitness (normalized to -1 to +1 range, 30 is average for 6 dims)
    const fitnessDelta = (totalScore - 30) / 30;
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
      score: totalScore,
      max_score: 60,
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

async function generateIdea(genes: string[], context?: { generation: number; genePoolSize: number; recentNames?: string[] }) {
  const genesText = genes.map(g => `"${g}"`).join(', ');

  let contextSection = '';
  if (context) {
    contextSection = `
CURRENT STATE:
- Generation: ${context.generation}
- Gene pool size: ${context.genePoolSize} genes
${context.recentNames?.length ? `- Recent ideas (avoid similar): ${context.recentNames.slice(0, 5).join(', ')}` : ''}
`;
  }

  const prompt = `You are part of an evolutionary engine that breeds startup ideas.

HOW THIS WORKS:
- You receive "genes" (concept fragments) selected from a pool based on fitness scores
- Your output gets scored on how well it solves real problems
- High-scoring ideas boost the fitness of genes used, low-scoring ideas reduce it
- New genes get extracted from your ideas and added to the pool
- Over generations, the gene pool evolves toward better ideas

YOUR OBJECTIVE:
Help this engine get smarter. Don't just generate a "good sounding" idea - generate one that genuinely solves a painful problem for real people. The system is learning from your outputs.

GENES TO COMBINE:
${genesText}
${contextSection}
GUIDELINES:
- Solve real problems people actually have
- Be specific about who this is for and why they'd pay
- If you notice the genes are narrow, interpret them creatively to explore new territory
- Avoid repeating patterns from recent ideas

Respond with ONLY valid JSON:
{
  "name": "Short catchy name (2-4 words)",
  "description": "What it does, who it's for, why they need it, how it makes money.",
  "hook": "One sentence that captures the core value"
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
  const prompt = `You are the scoring engine for an evolutionary startup idea breeder.

HOW THIS WORKS:
- Ideas are generated from a gene pool of concept fragments
- Your scores determine which genes survive and propagate
- High scores boost the fitness of genes used in this idea
- Low scores reduce their fitness, making them less likely to be selected
- The system evolves based on your judgment

YOUR RESPONSIBILITY:
Score honestly. The evolution depends on accurate feedback.

IDEA TO EVALUATE:
Name: ${idea.name}
Description: ${idea.description}
Hook: ${idea.hook}

SCORE EACH DIMENSION (0-10):
U - UTILITY: Does this solve a real, painful problem?
S - SIMPLICITY: Can a solo dev build an MVP quickly?
E - ECONOMICS: Is there a clear path to revenue?
F - FREQUENCY: How often would people use this?
U - UNIQUENESS: Is this a fresh approach?
L - LEVERAGE: Does this use AI/new tech meaningfully?

Be calibrated. Average ideas score 4-6. Only exceptional dimensions get 8+.

Respond with ONLY valid JSON:
{
  "scores": { "utility": X, "simplicity": X, "economics": X, "frequency": X, "uniqueness": X, "leverage": X },
  "reasoning": "What makes this strong or weak?"
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

async function extractGenes(idea: { name: string; description: string; hook: string }, scores: Record<string, number>) {
  const prompt = `You are the gene extractor for an evolutionary startup idea breeder.

HOW THIS WORKS:
- Ideas are generated by combining "genes" (concept fragments) from a pool
- Your job is to extract new genes from this idea to add to the pool
- Good genes are abstract enough to recombine with other concepts
- The genes you extract will be used to generate future ideas

THE IDEA:
Name: ${idea.name}
Description: ${idea.description}
Hook: ${idea.hook}

SCORES:
Utility: ${scores.utility}/10, Simplicity: ${scores.simplicity}/10, Economics: ${scores.economics}/10
Frequency: ${scores.frequency}/10, Uniqueness: ${scores.uniqueness}/10, Leverage: ${scores.leverage}/10

YOUR TASK:
Extract 3-5 reusable concept fragments. Think about:
- What PROBLEM does this solve?
- What AUDIENCE is this for?
- What MECHANISM makes it work?
- What makes it DIFFERENT?

Good genes: "automates tedious paperwork", "busy parents", "AI reads documents", "replaces expensive professionals"

Respond with ONLY a JSON array:
["gene 1", "gene 2", "gene 3"]`;

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
