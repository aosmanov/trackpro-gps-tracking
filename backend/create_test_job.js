const { supabaseAdmin } = require('./config/supabase');

async function createTestJob() {
  try {
    // Create a test job with tracking code 1080A0
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        job_number: 'TEST-001',
        tracking_code: '1080A0',
        customer_address: '123 Main Street, Boston, Massachusetts, United States',
        service_type: 'Test Service',
        description: 'Test job for debugging',
        status: 'pending',
        company_id: 1,
        customer_id: 1
      })
      .select()
      .single();
    
    if (error) {
      console.log('Error creating test job:', error.message);
    } else {
      console.log('Test job created successfully:');
      console.log('Tracking Code:', job.tracking_code);
      console.log('Customer Address:', job.customer_address);
      console.log('Status:', job.status);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

createTestJob();