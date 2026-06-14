const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    // 1. Sign in as riya@example.com
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'riya@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('Sign-in failed:', authError);
      return;
    }
    console.log('Signed in as:', authData.user.email);

    // 2. Try to upload a dummy text to avatars/test.txt
    const dummyBlob = Buffer.from('hello world');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pace-media')
      .upload('avatars/test-' + Date.now() + '.txt', dummyBlob, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload to avatars/ failed:', uploadError);
    } else {
      console.log('Upload to avatars/ succeeded:', uploadData);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testUpload();
