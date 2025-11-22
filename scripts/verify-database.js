/**
 * Verify Database Setup
 * Run: node scripts/verify-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying database setup...\n');

  try {
    // Check tables exist
    console.log('📊 Checking tables...');
    const tables = ['members', 'member_skills', 'skills', 'events', 'google_oauth_tokens'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: OK`);
      }
    }

    // Check admin user
    console.log('\n👤 Checking admin user...');
    const { data: admin, error: adminError } = await supabase
      .from('members')
      .select('*')
      .eq('email', 'gavipraise@gmail.com')
      .single();

    if (adminError || !admin) {
      console.log('  ❌ Admin user not found');
    } else {
      console.log(`  ✅ Admin user found: ${admin.name} (${admin.email})`);
      console.log(`     Role: ${admin.role}`);
    }

    // Check skills
    console.log('\n📚 Checking skills...');
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*');

    if (skillsError) {
      console.log(`  ❌ Error: ${skillsError.message}`);
    } else {
      console.log(`  ✅ Found ${skills?.length || 0} skills`);
      if (skills && skills.length > 0) {
        skills.slice(0, 3).forEach(skill => {
          console.log(`     - ${skill.name} (${skill.level})`);
        });
      }
    }

    console.log('\n✅ Database setup verified!');
    console.log('\nNext steps:');
    console.log('  1. Restart your dev server: npm run dev');
    console.log('  2. Test admin login at: http://localhost:3000/admin/login');
    console.log('  3. Email: gavipraise@gmail.com');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifySetup();

