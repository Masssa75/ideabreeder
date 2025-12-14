import { NextRequest, NextResponse } from 'next/server';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json();

    if (!idea) {
      return NextResponse.json({ error: 'No idea provided' }, { status: 400 });
    }

    const prompt = `You are a ruthless startup evaluator. Score this startup idea on the VIRUS framework.

STARTUP IDEA:
Name: ${idea.name}
Description: ${idea.description}
Hook: ${idea.hook}

Score each dimension from 0-10:

V - VIRALITY: Does using the product naturally create shareable content? Is there a built-in loop where users spread it?
I - IMMEDIACY: How fast can this generate revenue? Days, weeks, or months to first dollar?
R - RECURRENCE: How often would users engage? Daily, weekly, monthly, or one-time?
U - URGENCY: How painful is the problem? Hair-on-fire, annoying, or nice-to-have?
S - SIMPLICITY: How fast can a solo developer build an MVP? Weekend, weeks, or months?

Be critical and realistic. Most ideas should score 4-7 on each dimension. Only exceptional ideas get 8+.

Respond with ONLY a JSON object (no markdown):
{
  "virality": <0-10>,
  "immediacy": <0-10>,
  "recurrence": <0-10>,
  "urgency": <0-10>,
  "simplicity": <0-10>,
  "reasoning": "Brief explanation of the scores"
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

    const virusScore = scores.virality + scores.immediacy + scores.recurrence + scores.urgency + scores.simplicity;

    return NextResponse.json({
      scores: {
        virality: scores.virality,
        immediacy: scores.immediacy,
        recurrence: scores.recurrence,
        urgency: scores.urgency,
        simplicity: scores.simplicity
      },
      virus_score: virusScore,
      reasoning: scores.reasoning
    });

  } catch (error) {
    console.error('Score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
