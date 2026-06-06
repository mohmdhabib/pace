import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually
const envPath = '.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  try {
    console.log('Fetching profiles from database...');
    const { data: profiles, error: err } = await supabase.from('profiles').select('*');
    if (err) {
      console.error('Error fetching profiles:', err);
    } else {
      console.log('Database Profiles:', profiles);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkProfiles();
