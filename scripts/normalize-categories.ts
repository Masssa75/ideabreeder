import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const categoryMap: Record<string, string> = {
  'government': 'Government', 'Government': 'Government', 'Legal': 'Government',
  'Financial': 'Finance', 'Financial Data': 'Finance', 'Finance': 'Finance', 
  'Financial APIs': 'Finance', 'Business Intelligence': 'Finance',
  'Medical & Scientific': 'Science', 'Medical Research': 'Science', 'Medical': 'Science',
  'Scientific Database': 'Science', 'Scientific/Healthcare': 'Science', 'Science': 'Science',
  'health': 'Science', 'Science & Geospatial': 'Science',
  'Space Exploration': 'Space', 'space': 'Space', 'Aerospace': 'Space', 'Astronomy': 'Space',
  'Geospatial': 'Geospatial', 'Earth Observation': 'Geospatial', 'Geocoding & Location': 'Geospatial',
  'Weather & Climate': 'Weather', 'Environmental Data': 'Weather', 'environment': 'Weather',
  'transportation': 'Transportation', 'Transportation & Logistics': 'Transportation',
  'Development': 'Developer', 'Developer Tools': 'Developer', 'Package Registry': 'Developer', 'Technology': 'Developer',
  'News & Media': 'Media', 'entertainment': 'Media', 'Social Media': 'Media', 'social': 'Media', 
  'Knowledge': 'Media', 'music': 'Media',
  'AI/ML': 'AI', 'AI & Machine Learning': 'AI', 'AI/ML APIs': 'AI', 'Computer Vision & AI': 'AI',
  'Communications': 'Communication', 'Communication': 'Communication',
  'Network & Infrastructure': 'Infrastructure', 'Cloud Infrastructure': 'Infrastructure',
  'Historical Data': 'Historical', 'Historical Archives': 'Historical', 'Books & Literature': 'Historical',
  'Food & Nutrition': 'Food', 'Food & Beverage': 'Food',
  'Gaming': 'Fun', 'Animals': 'Fun', 'Animals & Nature': 'Fun', 'Data Generation': 'Fun',
};

async function normalize() {
  const { data: apis } = await supabase.from('apis').select('id, category');
  let updated = 0;
  
  for (const api of apis || []) {
    const newCategory = categoryMap[api.category] || api.category;
    if (newCategory !== api.category) {
      await supabase.from('apis').update({ category: newCategory }).eq('id', api.id);
      updated++;
    }
  }
  
  console.log('Updated:', updated, 'APIs');
  
  const { data: result } = await supabase.from('apis').select('category');
  const cats = [...new Set(result?.map(a => a.category) || [])];
  console.log('Categories:', cats.sort());
}

normalize();
