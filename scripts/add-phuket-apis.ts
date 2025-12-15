import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const apis = [
  // Claude's research
  'Thailand Open Government Data API',
  'TAT Developer Portal API',
  'Open-Meteo Marine Weather API',
  'World Weather Online Marine API',
  'MarineTraffic AIS API',
  'AISHub Vessel Tracking API',
  'AQICN Air Quality API',
  'FlightAware AeroAPI',
  'Aviation Edge Flight API',
  'Divesites API',
  // Kimi K2 finds
  'Amadeus Travel API',
  'Foursquare Places API',
  'Booking.com Demand API',
  'Skyscanner Flights API',
  'Thai Meteorological Department API',
  'Geoapify Places API',
  'Fixer.io Currency API',
  'Unsplash API',
  'Smart City Phuket Data Platform',
  'Google Places API',
  'Wikipedia API'
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
      const lower = a.toLowerCase();
      return !existingNames.has(lower);
    })
    .map(a => ({
      api_name: a,
      status: 'pending',
      source: 'discovery:phuket-tourism'
    }));

  console.log(`Found ${apis.length} APIs total`);
  console.log(`${apis.length - toAdd.length} already in system`);
  console.log(`${toAdd.length} new APIs to add\n`);

  if (toAdd.length === 0) {
    console.log('All APIs already in queue or database');
    return;
  }

  console.log('Adding:');
  toAdd.forEach(a => console.log(`  + ${a.api_name}`));

  const { error } = await supabase.from('api_ingestion_queue').insert(toAdd);
  if (error) {
    console.error('\nError:', error);
  } else {
    console.log(`\n✅ Added ${toAdd.length} APIs to queue`);
  }
}

addToQueue();
