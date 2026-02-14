const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lsppsvspgpifuirzxqic.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcHBzdnNwZ3BpZnVpcnp4cWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkxNzQzOSwiZXhwIjoyMDY1NDkzNDM5fQ.15UoyVZkOlLxxjNNc7h73jEKOOa8enUab7X1gkyQ_4E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRole() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'selam@botfusions.com')
        .single();

    if (error) {
        console.error('Error fetching user:', error);
    } else {
        console.log('User Role Info:', users);
    }
}

checkUserRole();
