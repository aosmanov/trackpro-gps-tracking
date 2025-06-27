const { supabaseAdmin } = require('./config/supabase');

async function checkWebSocketUser() {
  try {
    const userId = '5c91524c-7a97-4831-8161-6f12cb54c51b';
    
    console.log('Checking WebSocket user:', userId);
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*, companies(*)')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.log('❌ User query error:', error.message);
      return;
    }
    
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    
    console.log('✅ User found:');
    console.log('👤 Name:', user.first_name, user.last_name);
    console.log('📧 Email:', user.email);
    console.log('👔 Role:', user.role);
    console.log('🏢 Company ID:', user.company_id);
    console.log('🏢 Company:', user.companies?.name);
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkWebSocketUser();