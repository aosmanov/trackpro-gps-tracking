const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'your_supabase_url') {
  console.warn('⚠️  Supabase credentials not configured. Please update your .env file with valid Supabase credentials.');
  console.warn('⚠️  Server will start but database operations will fail until credentials are configured.');
}

// Service role client (for server-side operations)
let supabaseAdmin = null;
let supabase = null;

if (supabaseUrl && supabaseServiceKey && supabaseUrl !== 'your_supabase_url') {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Anon client (for client-side operations)  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

module.exports = {
  supabase,
  supabaseAdmin
};