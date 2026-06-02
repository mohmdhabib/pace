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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function runTest() {
  const email = `test-${Math.floor(Math.random() * 1000000)}@example.com`;
  const password = 'TestPassword123!';
  
  console.log(`Signing up temporary test user: ${email}...`);
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test Runner'
      }
    }
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError);
    return;
  }

  const user = signUpData.user;
  console.log('Sign up successful! User ID:', user.id);

  // Now, let's call ensureProfile (mirroring paceApi.js)
  console.log('Calling ensureProfile...');
  try {
    const displayName = 'Test Runner';
    const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
      display_name_arg: displayName,
      avatar_url_arg: null
    });

    if (rpcError) {
      console.log('ensure_user_profile RPC failed:', rpcError);
      console.log('Trying fallback profiles upsert...');
      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            display_name: displayName,
            avatar_url: null
          },
          { onConflict: 'id' }
        )
        .select()
        .single();
      
      if (upsertError) {
        console.error('Fallback profiles upsert failed:', upsertError);
      } else {
        console.log('Fallback profiles upsert succeeded:', upsertData);
      }
    } else {
      console.log('ensure_user_profile RPC succeeded:', rpcData);
    }
  } catch (err) {
    console.error('Unexpected error in ensureProfile:', err);
  }

  // Method 1: Try direct insert into paces
  console.log('\n--- METHOD 1: Direct Table Insert ---');
  const { data: insertData, error: insertError } = await supabase
    .from('paces')
    .insert({
      owner_id: user.id,
      title: 'Pondy Trip Direct',
      description: 'Test direct insert',
      mood: 'nostalgic',
      color_theme: 'from-[#c9beb1]/20 via-[#23211d]/30 to-[#7d8577]/20'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Direct insert failed:', insertError);
  } else {
    console.log('Direct insert succeeded! Pace:', insertData);
  }

  // Method 2: Try RPC create_pace
  console.log('\n--- METHOD 2: RPC create_pace ---');
  const { data: rpcPaceData, error: rpcPaceError } = await supabase.rpc('create_pace', {
    title_arg: 'Pondy Trip RPC',
    description_arg: 'Test RPC create_pace',
    mood_arg: 'nostalgic',
    color_theme_arg: 'from-[#c9beb1]/20 via-[#23211d]/30 to-[#7d8577]/20'
  });

  if (rpcPaceError) {
    console.error('RPC create_pace failed:', rpcPaceError);
  } else {
    console.log('RPC create_pace succeeded! Pace:', rpcPaceData);
  }
}

runTest();
