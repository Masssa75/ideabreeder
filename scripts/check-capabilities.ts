import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function stats() {
  const { data: all } = await supabase.from('apis').select('id, title, capabilities');

  const withCaps = all?.filter(a => a.capabilities && a.capabilities.length > 0) || [];
  const withoutCaps = all?.filter(a => !a.capabilities || a.capabilities.length === 0) || [];

  console.log('=== DataGold Capabilities Stats ===\n');
  console.log('Total APIs:', all?.length || 0);
  console.log('APIs with capabilities:', withCaps.length);
  console.log('APIs without capabilities:', withoutCaps.length);

  if (withCaps.length > 0) {
    console.log('\n--- APIs WITH capabilities: ---');
    withCaps.forEach(a => console.log(`  ✅ ${a.title} (${a.capabilities.length} capabilities)`));
  }

  if (withoutCaps.length > 0) {
    console.log('\n--- APIs WITHOUT capabilities (need re-ingestion): ---');
    withoutCaps.forEach(a => console.log(`  ❌ ${a.title}`));
  }
}

stats();
