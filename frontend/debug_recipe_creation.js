
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service key to bypass RLS for setup/debugging, 
// but we ultimately want to know why the USER failed.
// So we should try to sign in as the user.

async function debugRecipe() {
    console.log('--- Debugging Recipe Creation ---');

    // 1. Login
    const authClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email: 'test_compliance@kimyasal.com',
        password: 'password123'
    });

    if (authError) {
        console.error('Login failed:', authError);
        return;
    }

    console.log('Logged in as:', authData.user.email, 'Role:', authData.user.user_metadata.role);

    // Create client with user session
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
    });

    // 2. Check Prerequisites
    console.log('\n--- Checking Prerequisites ---');

    // Check Usage Types
    const { data: usageTypes, error: utError } = await userClient.from('usage_types').select('*');
    if (utError) console.error('Error fetching usage_types:', utError);
    else console.log('Usage Types found:', usageTypes?.length);

    if (!usageTypes || usageTypes.length === 0) {
        console.error('CRITICAL: No usage_types found for user!');
        // If empty, try fetching with service key to see if they exist at all
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { count } = await adminClient.from('usage_types').select('*', { count: 'exact', head: true });
        console.log('Total usage_types in DB (admin view):', count);
        return;
    }

    // Check Products
    const { data: products, error: prodError } = await userClient.from('products').select('*').limit(1);
    if (prodError) console.error('Error fetching products:', prodError);
    else console.log('Products found:', products?.length, products?.length > 0 ? products[0].id : 'None');

    // 3. Simulate Recipe Insert
    console.log('\n--- Simulating Recipe Insert ---');

    const usageTypeId = usageTypes[0].id; // Use first available usage type

    const recipeData = {
        usage_type_id: usageTypeId,
        version_code: `DEBUG-${Date.now()}`,
        status: 'draft',
        recipe_name_no: 'DEBUG-RECIPE',
        created_by: authData.user.id
        // color_code: 'DEBUG-COLOR',
        // ... other fields
    };

    console.log('Attempting insert with:', recipeData);

    const { data: recipe, error: recipeError } = await userClient
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();

    if (recipeError) {
        console.error('Recipe Insert Failed:', recipeError);
    } else {
        console.log('Recipe Insert Success:', recipe.id);

        // 4. Simulate Compliance Check (RLS Test)
        console.log('\n--- Simulating Compliance Check RLS ---');

        // Try to read compliance standards
        const { data: standards, error: stdError } = await userClient.from('compliance_standards').select('*');
        if (stdError) console.error('Error reading compliance_standards:', stdError);
        else console.log('Compliance Standards read:', standards.length);

        // Try to insert compliance check
        if (standards && standards.length > 0) {
            const checkData = {
                recipe_id: recipe.id,
                standard_id: standards[0].id,
                status: 'pass',
                report: { message: 'Debug check' },
                checked_at: new Date().toISOString(),
                checked_by: authData.user.id
            };

            console.log('Attempting verify compliance_check insert...');
            const { error: checkError } = await userClient.from('compliance_checks').insert(checkData);

            if (checkError) {
                console.error('Compliance Check Insert FAILED (RLS issue likely):', checkError);
            } else {
                console.log('Compliance Check Insert SUCCESS');
            }
        }

        // Cleanup
        console.log('\n--- Cleanup ---');
        const { error: delError } = await userClient.from('recipes').delete().eq('id', recipe.id);
        if (delError) console.error('Error cleaning up recipe:', delError);
        else console.log('Recipe cleanup success');
    }
}

debugRecipe();
