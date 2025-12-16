import { SupabaseClient } from '@supabase/supabase-js'

export interface SoulmateSession {
  id: string
  user_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  message_count: number
  created_at: string
  last_activity_at: string
  completed_at: string | null
}

export interface SoulmateMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  message_index: number
  created_at: string
}

/**
 * Get the active session for a user, or create a new one
 */
export async function getOrCreateSession(
  supabase: SupabaseClient,
  userId: string
): Promise<SoulmateSession | null> {
  // First, try to get an existing in-progress session
  const { data: existingSession, error: fetchError } = await supabase
    .from('soulmate_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSession && !fetchError) {
    return existingSession
  }

  // No active session, create a new one
  const { data: newSession, error: createError } = await supabase
    .from('soulmate_sessions')
    .insert({
      user_id: userId,
      status: 'in_progress',
      message_count: 0,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating session:', createError)
    return null
  }

  return newSession
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SoulmateMessage[]> {
  const { data, error } = await supabase
    .from('soulmate_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('message_index', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data || []
}

/**
 * Save a new message to the session
 */
export async function saveMessage(
  supabase: SupabaseClient,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  messageIndex: number
): Promise<SoulmateMessage | null> {
  const { data, error } = await supabase
    .from('soulmate_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      message_index: messageIndex,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving message:', error)
    return null
  }

  // Update session last activity and message count
  await supabase
    .from('soulmate_sessions')
    .update({
      last_activity_at: new Date().toISOString(),
      message_count: messageIndex + 1,
    })
    .eq('id', sessionId)

  return data
}

/**
 * Mark a session as completed
 */
export async function completeSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('soulmate_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Error completing session:', error)
    return false
  }

  return true
}

/**
 * Get session by ID
 */
export async function getSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SoulmateSession | null> {
  const { data, error } = await supabase
    .from('soulmate_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching session:', error)
    return null
  }

  return data
}
