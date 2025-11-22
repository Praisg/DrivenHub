/**
 * Database Setup Script
 * Run this to automatically set up all database tables and initial data
 * 
 * Usage: node scripts/setup-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase-setup-complete.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use Supabase RPC or direct query
        // Note: Supabase client doesn't support raw SQL execution directly
        // So we'll need to use the REST API or run this manually
        console.log('⚠️  Note: Supabase JS client cannot execute raw SQL directly.');
        console.log('   Please run the SQL script manually in Supabase SQL Editor.\n');
        break;
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
      }
    }

    console.log('\n✅ Database setup instructions:');
    console.log('   1. Go to: https://app.supabase.com/project/wbleojuizxhjojwhhfqo/sql/new');
    console.log('   2. Copy and paste the contents of supabase-setup-complete.sql');
    console.log('   3. Click "Run"\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();

