/**
 * Add Verified APIs to Ingestion Queue
 *
 * This script adds manually researched and verified APIs to the ingestion queue.
 * Each API has been verified to exist via URL checks and web research.
 *
 * Usage: npx tsx scripts/add-verified-apis.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import verifiedApis from './verified-api-queue.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function addToQueue() {
  console.log('\n📋 Adding Verified APIs to Ingestion Queue\n');
  console.log(`Source: verified-api-queue.json`);
  console.log(`Created: ${verifiedApis.metadata.created_at}`);
  console.log(`Method: ${verifiedApis.metadata.created_by}`);
  console.log(`Total APIs: ${verifiedApis.metadata.total_apis}\n`);

  // Get existing APIs and queue items
  const { data: existingApis } = await supabase.from('apis').select('title');
  const { data: existingQueue } = await supabase.from('api_ingestion_queue').select('api_name');

  const existingNames = new Set([
    ...(existingApis?.map(a => a.title.toLowerCase()) || []),
    ...(existingQueue?.map(q => q.api_name.toLowerCase()) || [])
  ]);

  const toAdd = verifiedApis.apis
    .filter(api => !existingNames.has(api.name.toLowerCase()))
    .map(api => ({
      api_name: api.name,
      status: 'pending',
      source: api.source,
      // Store additional metadata as JSON string in a notes field if available
      // For now, the source field captures provenance
    }));

  console.log(`Already in system: ${verifiedApis.apis.length - toAdd.length}`);
  console.log(`New APIs to add: ${toAdd.length}\n`);

  if (toAdd.length === 0) {
    console.log('✅ All verified APIs are already in the system');
    return;
  }

  // Group by category for display
  const byCategory: Record<string, string[]> = {};
  toAdd.forEach(api => {
    const fullApi = verifiedApis.apis.find(a => a.name === api.api_name);
    const cat = fullApi?.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(api.api_name);
  });

  console.log('APIs to add:\n');
  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`  ${cat}:`);
    byCategory[cat].forEach(name => console.log(`    + ${name}`));
  });

  const { error } = await supabase.from('api_ingestion_queue').insert(toAdd);

  if (error) {
    console.error('\n❌ Error:', error);
  } else {
    console.log(`\n✅ Added ${toAdd.length} verified APIs to queue`);
    console.log('\nThese will be processed by the ingestion system.');
    console.log('Each API was manually verified to exist before being added.');
  }
}

// Also create a summary of what we found
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('VERIFIED API RESEARCH SUMMARY');
  console.log('='.repeat(60) + '\n');

  const categories: Record<string, typeof verifiedApis.apis> = {};
  verifiedApis.apis.forEach(api => {
    if (!categories[api.category]) categories[api.category] = [];
    categories[api.category].push(api);
  });

  Object.keys(categories).sort().forEach(cat => {
    console.log(`\n## ${cat} (${categories[cat].length})`);
    categories[cat].forEach(api => {
      console.log(`\n  ${api.name}`);
      console.log(`  URL: ${api.url}`);
      console.log(`  Auth: ${api.auth}`);
      console.log(`  Viral: ${api.viral_potential}`);
    });
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--summary')) {
    printSummary();
  } else if (args.includes('--dry-run')) {
    console.log('\n🔍 DRY RUN - Not adding to database\n');
    printSummary();
  } else {
    await addToQueue();
  }
}

main();
