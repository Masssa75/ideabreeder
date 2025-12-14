import { NextRequest, NextResponse } from 'next/server';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { genes } = await request.json();

    if (!genes || genes.length === 0) {
      return NextResponse.json({ error: 'No genes provided' }, { status: 400 });
    }

    const genesText = genes.map((g: string) => `"${g}"`).join(', ');

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
