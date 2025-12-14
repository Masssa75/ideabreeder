import { NextRequest, NextResponse } from 'next/server';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { idea, scores } = await request.json();

    if (!idea) {
      return NextResponse.json({ error: 'No idea provided' }, { status: 400 });
    }

    const prompt = `You are analyzing a startup idea to extract reusable concept fragments (genes) that could be recombined to create new ideas.

STARTUP IDEA:
Name: ${idea.name}
Description: ${idea.description}
Hook: ${idea.hook}

SCORES (for context):
Virality: ${scores.virality}/10
Immediacy: ${scores.immediacy}/10
Recurrence: ${scores.recurrence}/10
Urgency: ${scores.urgency}/10
Simplicity: ${scores.simplicity}/10

Extract 3-5 interesting concept fragments from this idea. These should be:
- Abstract enough to recombine with other concepts
- Specific enough to be meaningful
- Diverse (different types: audience, mechanic, emotion, format, etc.)

Examples of good genes: "public accountability pressure", "screenshot-ready output", "professional anxiety", "solo founders", "weekly ritual", "badge embed for virality"

Respond with ONLY a JSON object (no markdown):
{
  "genes": ["gene 1", "gene 2", "gene 3", ...]
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
          { role: 'system', content: 'You are a concept analyst. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Moonshot API error:', error);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let result;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse:', content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ genes: result.genes });

  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
