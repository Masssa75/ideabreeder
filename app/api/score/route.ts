import { NextRequest, NextResponse } from 'next/server';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json();

    if (!idea) {
      return NextResponse.json({ error: 'No idea provided' }, { status: 400 });
    }

    const prompt = `You are the scoring engine for an evolutionary startup idea breeder.

HOW THIS WORKS:
- Ideas are generated from a gene pool of concept fragments
- Your scores determine which genes survive and propagate
- High scores boost the fitness of genes used in this idea
- Low scores reduce their fitness, making them less likely to be selected
- The system evolves based on your judgment

YOUR RESPONSIBILITY:
Score honestly. The evolution depends on accurate feedback. Don't inflate scores to be nice - that would corrupt the gene pool. Don't be harsh just to seem critical - that would kill good ideas.

IDEA TO EVALUATE:
Name: ${idea.name}
Description: ${idea.description}
Hook: ${idea.hook}

SCORE EACH DIMENSION (0-10):

U - UTILITY: Does this solve a real, painful problem? Would people genuinely need this?
S - SIMPLICITY: Can a solo dev build an MVP quickly? Is the core concept clear?
E - ECONOMICS: Is there a clear path to revenue? Would people pay for this?
F - FREQUENCY: How often would people use this? Daily, weekly, one-time?
U - UNIQUENESS: Is this a fresh approach or a rehash of existing solutions?
L - LEVERAGE: Does this take advantage of new technology (AI, etc.) in a meaningful way?

Be calibrated. Average ideas should score 4-6. Only truly exceptional dimensions get 8+.

Respond with ONLY valid JSON:
{
  "utility": <0-10>,
  "simplicity": <0-10>,
  "economics": <0-10>,
  "frequency": <0-10>,
  "uniqueness": <0-10>,
  "leverage": <0-10>,
  "reasoning": "What makes this idea strong or weak? What would improve it?"
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
          { role: 'system', content: 'You are a critical startup evaluator. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Moonshot API error:', error);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let scores;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      scores = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse:', content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const totalScore = scores.utility + scores.simplicity + scores.economics + scores.frequency + scores.uniqueness + scores.leverage;

    return NextResponse.json({
      scores: {
        utility: scores.utility,
        simplicity: scores.simplicity,
        economics: scores.economics,
        frequency: scores.frequency,
        uniqueness: scores.uniqueness,
        leverage: scores.leverage
      },
      virus_score: totalScore, // keeping field name for compatibility
      reasoning: scores.reasoning
    });

  } catch (error) {
    console.error('Score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
