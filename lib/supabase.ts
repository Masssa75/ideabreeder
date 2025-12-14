import { createClient } from '@supabase/supabase-js';
import { Gene, Idea } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getGenes(limit = 50): Promise<Gene[]> {
  const { data, error } = await supabase
    .from('genes')
    .select('*')
    .order('fitness', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching genes:', error);
    return [];
  }
  return data || [];
}

export async function upsertGene(text: string, fitnessDelta: number): Promise<Gene | null> {
  const normalizedText = text.toLowerCase().trim();

  const { data: existing } = await supabase
    .from('genes')
    .select('*')
    .eq('text', normalizedText)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('genes')
      .update({
        fitness: Math.max(0, Math.min(10, existing.fitness + fitnessDelta)),
        offspring_count: existing.offspring_count + 1
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) console.error('Error updating gene:', error);
    return data;
  } else {
    const { data, error } = await supabase
      .from('genes')
      .insert({
        text: normalizedText,
        fitness: 5 + fitnessDelta,
        offspring_count: 1
      })
      .select()
      .single();

    if (error) console.error('Error inserting gene:', error);
    return data;
  }
}

export async function saveIdea(idea: Omit<Idea, 'id' | 'created_at'>): Promise<Idea | null> {
  const { data, error } = await supabase
    .from('ideas')
    .insert(idea)
    .select()
    .single();

  if (error) {
    console.error('Error saving idea:', error);
    return null;
  }
  return data;
}

export async function getTopIdeas(limit = 10): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('virus_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching ideas:', error);
    return [];
  }
  return data || [];
}

export async function getLatestGeneration(): Promise<number> {
  const { data } = await supabase
    .from('ideas')
    .select('generation')
    .order('generation', { ascending: false })
    .limit(1)
    .single();

  return data?.generation || 0;
}
