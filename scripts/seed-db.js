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
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function seed() {
  const usersToSeed = [
    { email: 'arjun@example.com', password: 'password123', fullName: 'Arjun Dev', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
    { email: 'riya@example.com', password: 'password123', fullName: 'Riya Sen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }
  ];

  const userIds = {};

  for (const item of usersToSeed) {
    console.log(`Signing up user: ${item.email}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: item.email,
      password: item.password,
      options: {
        data: {
          full_name: item.fullName,
          avatar_url: item.avatar
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        console.log(`User ${item.email} already exists. Fetching profile...`);
        
        // Find existing user from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('display_name', item.fullName)
          .maybeSingle();

        if (profileError || !profileData) {
          console.log(`Logging in to get ID for ${item.email}...`);
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: item.email,
            password: item.password
          });
          if (signInError) {
            console.error(`Failed to get user ID for ${item.email}:`, signInError);
            continue;
          }
          userIds[item.email] = signInData.user.id;
        } else {
          userIds[item.email] = profileData.id;
        }
      } else {
        console.error(`Failed to sign up ${item.email}:`, signUpError);
        continue;
      }
    } else {
      userIds[item.email] = signUpData.user.id;
      console.log(`Successfully signed up ${item.email} with ID: ${userIds[item.email]}`);
    }

    // Explicitly update profile display metadata
    if (userIds[item.email]) {
      await supabase.from('profiles').upsert({
        id: userIds[item.email],
        display_name: item.fullName,
        avatar_url: item.avatar
      });
    }
  }

  const arjunId = userIds['arjun@example.com'];
  const riyaId = userIds['riya@example.com'];

  if (!arjunId || !riyaId) {
    console.error('Could not retrieve IDs for both seeded users. Aborting content seeding.');
    return;
  }

  console.log('\nSeeding Pace space...');
  const paceId = 'c5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2';
  
  const { data: paceData, error: paceError } = await supabase
    .from('paces')
    .upsert({
      id: paceId,
      owner_id: arjunId,
      title: 'Marina Sunset Drives',
      description: 'auto rides, bad karaoke, and the sea looking like a secret',
      mood: 'late-night',
      cover_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75',
      color_theme: 'from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25'
    })
    .select()
    .single();

  if (paceError) {
    console.error('Failed to seed pace:', paceError);
    return;
  }
  console.log('Pace seeded:', paceData.title);

  // Add members
  console.log('Adding members to pace...');
  await supabase.from('pace_members').upsert([
    { pace_id: paceId, user_id: arjunId, role: 'owner' },
    { pace_id: paceId, user_id: riyaId, role: 'member' }
  ]);

  // Seed memories
  console.log('Seeding memories...');
  await supabase.from('memories').upsert([
    {
      id: 'd1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
      pace_id: paceId,
      author_id: riyaId,
      type: 'photo',
      caption: 'Marina was louder than all of us tonight.',
      mood: 'alive',
      media_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75',
      location_name: 'Marina Beach'
    },
    {
      id: 'd2f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
      pace_id: paceId,
      author_id: arjunId,
      type: 'text',
      caption: 'I think we will miss the version of ourselves that only existed in this city, under these lights.',
      mood: 'core-memory',
      location_name: 'Besant Nagar Avenue'
    }
  ]);

  // Seed direct conversation
  console.log('Seeding conversation...');
  const convId = 'e1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2';
  await supabase.from('conversations').upsert({
    id: convId,
    type: 'direct',
    title: 'Arjun & Riya'
  });

  await supabase.from('conversation_members').upsert([
    { conversation_id: convId, user_id: arjunId },
    { conversation_id: convId, user_id: riyaId }
  ]);

  // Seed messages
  console.log('Seeding messages...');
  await supabase.from('messages').upsert([
    {
      id: 'f1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
      conversation_id: convId,
      sender_id: arjunId,
      type: 'text',
      content: 'Hey Riya, did you upload the Marina sunset pictures yet?'
    },
    {
      id: 'f2f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
      conversation_id: convId,
      sender_id: riyaId,
      type: 'text',
      content: 'Yes! Just uploaded them to our shared Marina Sunset Drives pace! They look so nostalgic 🌊✨'
    }
  ]);

  console.log('\nSeeding completed successfully!');
}

seed();
