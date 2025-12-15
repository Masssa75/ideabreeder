import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function status() {
  // Queue stats
  const { data: queue } = await supabase
    .from('api_ingestion_queue')
    .select('status, api_name');

  const pending = queue?.filter(q => q.status === 'pending') || [];
  const processing = queue?.filter(q => q.status === 'processing') || [];
  const completed = queue?.filter(q => q.status === 'completed') || [];
  const failed = queue?.filter(q => q.status === 'failed') || [];

  console.log('=== Ingestion Queue Status ===\n');
  console.log(`Total in queue: ${queue?.length || 0}`);
  console.log(`  Pending: ${pending.length}`);
  console.log(`  Processing: ${processing.length}`);
  console.log(`  Completed: ${completed.length}`);
  console.log(`  Failed: ${failed.length}`);

  // APIs table stats
  const { data: apis } = await supabase
    .from('apis')
    .select('id, title, capabilities');

  const withCaps = apis?.filter(a => a.capabilities && a.capabilities.length > 0) || [];
  const withoutCaps = apis?.filter(a => !a.capabilities || a.capabilities.length === 0) || [];

  console.log('\n=== APIs Table ===\n');
  console.log(`Total APIs: ${apis?.length || 0}`);
  console.log(`  With capabilities: ${withCaps.length}`);
  console.log(`  Without capabilities: ${withoutCaps.length}`);

  if (pending.length > 0) {
    console.log(`\n--- Pending (first 10): ---`);
    pending.slice(0, 10).forEach(p => console.log(`  ⏳ ${p.api_name}`));
    if (pending.length > 10) console.log(`  ... and ${pending.length - 10} more`);
  }

  if (failed.length > 0) {
    console.log(`\n--- Failed: ---`);
    failed.forEach(f => console.log(`  ❌ ${f.api_name}`));
  }
}

status();
