/**
 * Queue existing APIs for re-ingestion to populate capabilities field
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function queueReingest() {
  // Get APIs without capabilities
  const { data: apis } = await supabase
    .from('apis')
    .select('id, title, capabilities');

  const withoutCaps = apis?.filter(a => !a.capabilities || a.capabilities.length === 0) || [];

  console.log(`Found ${withoutCaps.length} APIs without capabilities\n`);

  if (withoutCaps.length === 0) {
    console.log('All APIs have capabilities!');
    return;
  }

  // Delete the old entries (without capabilities) from apis table
  // so the re-ingestion will create fresh entries
  const idsToDelete = withoutCaps.map(a => a.id);

  console.log('Removing old entries from apis table...');
  const { error: deleteError } = await supabase
    .from('apis')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('Error deleting old entries:', deleteError);
    return;
  }

  // Check what's already in queue
  const { data: existingQueue } = await supabase
    .from('api_ingestion_queue')
    .select('api_name');

  const existingNames = new Set(existingQueue?.map(q => q.api_name) || []);

  // Add to queue
  const toQueue = withoutCaps
    .filter(a => !existingNames.has(a.title))
    .map(a => ({
      api_name: a.title,
      status: 'pending'
    }));

  if (toQueue.length === 0) {
    console.log('All APIs already in queue!');
    return;
  }

  console.log(`Adding ${toQueue.length} APIs to queue...\n`);

  const { error } = await supabase
    .from('api_ingestion_queue')
    .insert(toQueue);

  if (error) {
    console.error('Error adding to queue:', error);
    return;
  }

  console.log(`✅ Added ${toQueue.length} APIs to re-ingestion queue`);
  console.log('They will be processed by the cron job (5 every 5 minutes)');
  console.log(`Estimated time: ${Math.ceil(toQueue.length / 5) * 5} minutes`);
}

queueReingest();
