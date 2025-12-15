import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const free = searchParams.get('free');
  const search = searchParams.get('search');
  const random = searchParams.get('random');
  const limit = parseInt(searchParams.get('limit') || '200');

  try {
    // Random single API for Discovery mode
    if (random === 'true') {
      const { count } = await supabase
        .from('apis')
        .select('*', { count: 'exact', head: true });

      if (!count || count === 0) {
        return NextResponse.json({ api: null });
      }

      const randomOffset = Math.floor(Math.random() * count);
      const { data, error } = await supabase
        .from('apis')
        .select('*')
        .range(randomOffset, randomOffset)
        .single();

      if (error) throw error;
      return NextResponse.json({ api: data });
    }

    // List APIs for Browse mode
    let query = supabase.from('apis').select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (free === 'true') {
      query = query.eq('free', true);
    } else if (free === 'false') {
      query = query.eq('free', false);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,hook.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    // Also get categories for filter
    const { data: catData } = await supabase
      .from('apis')
      .select('category')
      .not('category', 'is', null);

    const categories = [...new Set(catData?.map(d => d.category).filter(Boolean))].sort();

    return NextResponse.json({
      apis: data || [],
      categories,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching APIs:', error);
    return NextResponse.json({ error: 'Failed to fetch APIs' }, { status: 500 });
  }
}
