import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

async function check() {
  const { data, count } = await supabase.from('apis').select('*', { count: 'exact' });
  console.log('Total APIs in database:', count || data?.length);
  
  const { data: queue } = await supabase.from('api_ingestion_queue').select('status');
  const counts = queue?.reduce((acc: any, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  console.log('Queue status:', counts);
}
check();
