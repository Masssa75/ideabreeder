import { NextRequest, NextResponse } from 'next/server';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

interface EvolutionContext {
  generation: number;
  genePoolSize: number;
  topPatterns?: string[];
  underexploredGenes?: string[];
  recentNames?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { genes, context } = await request.json() as { genes: string[]; context?: EvolutionContext };

    if (!genes || genes.length === 0) {
      return NextResponse.json({ error: 'No genes provided' }, { status: 400 });
    }

    const genesText = genes.map((g: string) => `"${g}"`).join(', ');

    // Build context section if available
    let contextSection = '';
    if (context) {
      contextSection = `
CURRENT STATE:
- Generation: ${context.generation}
- Gene pool size: ${context.genePoolSize} genes
${context.recentNames?.length ? `- Recent ideas: ${context.recentNames.slice(0, 5).join(', ')}` : ''}
${context.underexploredGenes?.length ? `- Underexplored genes worth testing: ${context.underexploredGenes.join(', ')}` : ''}
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
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: 'kimi-k2-0905-preview',
        messages: [
          { role: 'system', content: 'You are a creative startup idea generator. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Moonshot API error:', error);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let idea;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      idea = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse:', content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ idea, genes_used: genes });

  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
