import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase.from('apis').select('title, category');
  if (error) { console.error(error); return; }

  const byCategory: Record<string, string[]> = {};
  data.forEach(api => {
    const cat = api.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(api.title);
  });

  console.log('TOTAL APIs:', data.length);
  console.log('');
  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`## ${cat} (${byCategory[cat].length})`);
    byCategory[cat].forEach(t => console.log(`- ${t}`));
    console.log('');
  });
}

main();
