/**
 * Reset completed queue items to pending for re-ingestion with capabilities
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function resetQueue() {
  // Get completed items
  const { data: completed } = await supabase
    .from('api_ingestion_queue')
    .select('id, api_name')
    .eq('status', 'completed');

  console.log(`Found ${completed?.length || 0} completed items\n`);

  if (!completed || completed.length === 0) {
    console.log('No completed items to reset');
    return;
  }

  // Check which ones are NOT in the apis table (need re-ingestion)
  const { data: existingApis } = await supabase
    .from('apis')
    .select('title');

  const existingTitles = new Set(existingApis?.map(a => a.title) || []);
  const toReset = completed.filter(c => !existingTitles.has(c.api_name));

  console.log(`${toReset.length} items need re-ingestion (not in apis table)\n`);

  if (toReset.length === 0) {
    console.log('All completed APIs are still in the database');
    return;
  }

  // Reset to pending
  const ids = toReset.map(t => t.id);
  const { error } = await supabase
    .from('api_ingestion_queue')
    .update({ status: 'pending', processed_at: null, result_hook: null })
    .in('id', ids);

  if (error) {
    console.error('Error resetting queue:', error);
    return;
  }

  console.log(`✅ Reset ${toReset.length} items to pending`);
  console.log(`Total pending now: ${toReset.length + 14}`); // 14 were already pending
  console.log(`Estimated processing time: ${Math.ceil((toReset.length + 14) / 5) * 5} minutes`);
}

resetQueue();
