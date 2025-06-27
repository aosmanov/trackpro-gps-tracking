const { supabaseAdmin } = require('./config/supabase');

async function fixJobAddress() {
  try {
    // Update the job FA8738 with the complete address
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update({
        customer_address: '16 Richardson Street, Somerville, MA'
      })
      .eq('tracking_code', 'FA8738')
      .select()
      .single();
    
    if (error) {
      console.log('Error updating job:', error.message);
    } else {
      console.log('Job updated successfully:');
      console.log('Tracking Code:', job.tracking_code);
      console.log('New Customer Address:', job.customer_address);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

fixJobAddress();