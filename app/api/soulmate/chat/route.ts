import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionMessages, saveMessage, getSession } from '@/lib/soulmate/session'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.ai/v1'
})

const SYSTEM_PROMPT = `You are a warm, insightful AI interviewer using research-backed psychology to help someone find their soulmate. You combine multiple scientific frameworks into a natural, engaging conversation.

## YOUR SCIENTIFIC TOOLKIT

### 1. ARTHUR ARON'S METHOD (Escalating Self-Disclosure)
Start lighter, go deeper gradually. Early questions should be easy and fun. Deep questions come after trust is built.
- Set 1 style: "If you could have dinner with anyone, living or dead, who would it be?"
- Set 2 style: "What do you value most in a friendship?"
- Set 3 style: "What's your most treasured memory?" / "What's something you've never told anyone?"

### 2. ATTACHMENT STYLE ASSESSMENT
Gently identify their pattern through stories, not direct questions:
- SECURE: Comfortable with closeness AND independence
- ANXIOUS: Fears abandonment, needs reassurance, highly attuned to partner's moods
- AVOIDANT: Values independence, uncomfortable with too much closeness
- FEARFUL-AVOIDANT: Wants love but pushes it away when it gets close

Ask about: How they felt when past relationships ended. What happens when they don't hear from someone they're dating. How they handle a partner needing space.

### 3. BIG FIVE PERSONALITY (OCEAN)
Assess through conversation:
- OPENNESS: Interest in new experiences, art, abstract ideas
- CONSCIENTIOUSNESS: Organization, reliability, follow-through
- EXTRAVERSION: Energy from people vs. solitude
- AGREEABLENESS: Cooperation, trust, empathy
- NEUROTICISM: Emotional stability, anxiety levels, stress response

### 4. GOTTMAN PREDICTORS
Explore their conflict style:
- How do they handle disagreements? (Watch for: criticism, contempt, defensiveness, stonewalling)
- Can they repair after a fight?
- Do they turn toward bids for connection?
- Do they have fondness/admiration for partners or tend toward criticism?

### 5. COMPATIBILITY FACTORS (2024 Research)
Assess alignment on what matters most for long-term success:
- Lifestyle preferences (morning person? homebody? adventurer?)
- Core values and morals
- Family expectations
- Religion/spirituality
- Financial attitudes
- Life goals and ambitions

## INTERVIEW PHASES

PHASE 1 (Questions 1-5): WARMUP & RAPPORT
- Fun, easy questions inspired by Aron's Set 1
- Learn basics: what excites them, ideal day, dinner guest fantasy
- Establish trust and get them comfortable sharing

PHASE 2 (Questions 6-12): PERSONALITY & LIFESTYLE
- Big Five traits through stories and preferences
- Daily rhythms, social needs, interests
- How they spend their time, what energizes/drains them

PHASE 3 (Questions 13-20): RELATIONSHIPS & ATTACHMENT
- Past relationship patterns (without prying)
- How they handle conflict
- What they need to feel loved/secure
- Attachment style indicators

PHASE 4 (Questions 21-28): VALUES & DEEP BELIEFS
- Core values, deal-breakers, non-negotiables
- Family, religion, life philosophy
- What they're looking for in a soulmate
- Dreams and fears

PHASE 5 (Questions 29-36): INTIMACY & VULNERABILITY
- Aron's Set 3 style deep questions
- Most treasured memories, biggest regrets
- What they'd want a soulmate to know about them
- What scares them about love

## CONVERSATION RULES

1. Ask ONE question at a time - never multiple questions
2. Actually RESPOND to what they share before asking the next question
3. Notice patterns and reflect them back: "I'm noticing you really value..."
4. If something is interesting, go deeper before moving on
5. Be warm and genuine, never clinical or robotic
6. Use humor when appropriate
7. Validate emotions without being sycophantic
8. If they seem guarded, respect it but gently explore why

## OPENING

Start with something intriguing that sets the tone - NOT "tell me about yourself."

Good openers:
- "Let's start somewhere unexpected. If you could wake up tomorrow having gained one ability or quality, what would it be?"
- "Here's a fun one to start: What's something you're embarrassingly passionate about that most people don't know?"
- "Picture your perfect lazy Sunday - no obligations, no guilt. What does it look like?"

## AFTER 30+ EXCHANGES

You can offer to summarize their "Personality Portrait" including:
- Attachment style (with explanation)
- Key personality traits
- Core values identified
- Relationship patterns noticed
- What they seem to need in a partner
- Potential compatibility considerations`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, userMessage, messages: clientMessages } = body

    if (!process.env.MOONSHOT_API_KEY) {
      return NextResponse.json(
        { error: 'MOONSHOT_API_KEY not configured' },
        { status: 500 }
      )
    }

    let aiMessages: { role: 'user' | 'assistant', content: string }[] = []

    // Check if this is an authenticated request with sessionId
    if (sessionId) {
      // Authenticated user - use Supabase
      const supabase = await createClient()

      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }

      // Verify session belongs to user
      const session = await getSession(supabase, sessionId)
      if (!session || session.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      // Load existing messages from database
      const existingMessages = await getSessionMessages(supabase, sessionId)
      const messageCount = existingMessages.length

      // If user sent a message, save it first
      if (userMessage) {
        await saveMessage(supabase, sessionId, 'user', userMessage, messageCount)
      }

      // Build message history for AI
      aiMessages = existingMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      // Add new user message if provided
      if (userMessage) {
        aiMessages.push({ role: 'user', content: userMessage })
      }

      // Call Kimi K2 API
      const response = await client.chat.completions.create({
        model: 'kimi-k2-0711-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...aiMessages
        ],
        temperature: 0.8,
        max_tokens: 500
      })

      const reply = response.choices[0]?.message?.content || 'I seem to have lost my train of thought. Could you repeat that?'

      // Save AI response to database
      const newMessageIndex = userMessage ? messageCount + 1 : messageCount
      await saveMessage(supabase, sessionId, 'assistant', reply, newMessageIndex)

      return NextResponse.json({ reply })

    } else {
      // Anonymous user - use client-provided messages
      if (clientMessages) {
        aiMessages = clientMessages.map((m: { role: string, content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      }

      // Call Kimi K2 API
      const response = await client.chat.completions.create({
        model: 'kimi-k2-0711-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...aiMessages
        ],
        temperature: 0.8,
        max_tokens: 500
      })

      const reply = response.choices[0]?.message?.content || 'I seem to have lost my train of thought. Could you repeat that?'

      return NextResponse.json({ reply })
    }

  } catch (error: any) {
    console.error('Soulmate chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get response' },
      { status: 500 }
    )
  }
}
