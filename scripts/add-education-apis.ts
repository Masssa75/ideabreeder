import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const apis = [
  // Education APIs (Claude's research)
  { name: 'Thailand Schools Dataset API', source: 'discovery:phuket-education' },
  { name: 'Thailand Ministry of Education Catalog API', source: 'discovery:phuket-education' },
  { name: 'UNESCO UIS Education API', source: 'discovery:phuket-education' },
  { name: 'World Bank EdStats API', source: 'discovery:phuket-education' },
  { name: 'Bangkok Schools Dataset API', source: 'discovery:phuket-education' },

  // Kimi K2 with rethink - the "holy shit" APIs
  { name: 'Phuket Smart City CCTV Crowd Density API', source: 'discovery:phuket-rethink' },
  { name: 'Thai Marine Department Vessel Tracking API', source: 'discovery:phuket-rethink' },
  { name: 'Phuket Electronic Wristband Tourist Tracker API', source: 'discovery:phuket-rethink' },
  { name: 'Thailand Beach Water Quality Monitoring API', source: 'discovery:phuket-rethink' },
  { name: 'Phuket Ao Por Smart Port Passenger Manifest API', source: 'discovery:phuket-rethink' },
  { name: 'Phuket Temple Events Real-time Database', source: 'discovery:phuket-rethink' },
  { name: 'Thailand Tourism Police Incident Reporting API', source: 'discovery:phuket-rethink' },
  { name: 'Phuket Dive Site Conditions Live Feed', source: 'discovery:phuket-rethink' },
  { name: 'Phuket Business License GPS Database', source: 'discovery:phuket-rethink' },
  { name: 'Phuket Air Quality Sensor Network API', source: 'discovery:phuket-rethink' },
  { name: 'Thai SIM Card Registration Tourist Tracker API', source: 'discovery:phuket-rethink' },
  { name: 'Phuket Coral Reef Health Monitoring API', source: 'discovery:phuket-rethink' },
];

async function addToQueue() {
  // Check existing
  const { data: existingQueue } = await supabase
    .from('api_ingestion_queue')
    .select('api_name');

  const { data: existingApis } = await supabase
    .from('apis')
    .select('title');

  const existingNames = new Set([
    ...(existingQueue?.map(e => e.api_name.toLowerCase()) || []),
    ...(existingApis?.map(e => e.title.toLowerCase()) || [])
  ]);

  const toAdd = apis
    .filter(a => {
      const lower = a.name.toLowerCase();
      return !existingNames.has(lower);
    })
    .map(a => ({
      api_name: a.name,
      status: 'pending',
      source: a.source
    }));

  console.log(`Found ${apis.length} APIs total`);
  console.log(`${apis.length - toAdd.length} already in system`);
  console.log(`${toAdd.length} new APIs to add\n`);

  if (toAdd.length === 0) {
    console.log('All APIs already in queue or database');
    return;
  }

  console.log('Adding:');
  toAdd.forEach(a => console.log(`  + ${a.api_name} (${a.source})`));

  const { error } = await supabase.from('api_ingestion_queue').insert(toAdd);
  if (error) {
    console.error('\nError:', error);
  } else {
    console.log(`\n✅ Added ${toAdd.length} APIs to queue`);
  }
}

addToQueue();
