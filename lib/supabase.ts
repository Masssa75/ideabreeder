import { createClient } from '@supabase/supabase-js';
import { Gene, Idea, Api, ApiInsert } from './types';

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

// DataGold API functions
export async function getApis(options?: {
  category?: string;
  free?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<Api[]> {
  let query = supabase.from('apis').select('*');

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.free !== undefined) {
    query = query.eq('free', options.free);
  }
  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,hook.ilike.%${options.search}%`);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching APIs:', error);
    return [];
  }
  return data || [];
}

export async function getRandomApi(): Promise<Api | null> {
  // Get count first
  const { count } = await supabase
    .from('apis')
    .select('*', { count: 'exact', head: true });

  if (!count || count === 0) return null;

  const randomOffset = Math.floor(Math.random() * count);

  const { data, error } = await supabase
    .from('apis')
    .select('*')
    .range(randomOffset, randomOffset)
    .single();

  if (error) {
    console.error('Error fetching random API:', error);
    return null;
  }
  return data;
}

export async function getApiByTitle(title: string): Promise<Api | null> {
  const { data, error } = await supabase
    .from('apis')
    .select('*')
    .eq('title', title)
    .single();

  if (error) {
    console.error('Error fetching API by title:', error);
    return null;
  }
  return data;
}

export async function insertApi(api: ApiInsert): Promise<Api | null> {
  const { data, error } = await supabase
    .from('apis')
    .insert(api)
    .select()
    .single();

  if (error) {
    console.error('Error inserting API:', error);
    return null;
  }
  return data;
}

export async function getApiCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('apis')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categories = [...new Set(data?.map(d => d.category).filter(Boolean))];
  return categories.sort();
}

export async function getApiCount(): Promise<number> {
  const { count, error } = await supabase
    .from('apis')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting APIs:', error);
    return 0;
  }
  return count || 0;
}
