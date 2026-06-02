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

async function checkInvites() {
  try {
    console.log('Fetching invites from database...');
    const { data, error } = await supabase.from('pace_invites').select('*').limit(5);
    if (error) {
      console.error('Error fetching invites:', error);
    } else {
      console.log('Active Invites:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkInvites();
