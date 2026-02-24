
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    console.log('Starting seed (Re-run)...');

    // 0. Ensure Compliance Standard
    let { data: existingStandard } = await supabase
        .from('kts_compliance_standards')
        .select('id')
        .eq('name', 'TEST-STANDARD-GLOBAL-BAN')
        .single();

    let standardId;
    if (existingStandard) {
        standardId = existingStandard.id;
    } else {
        const { data: newStandard } = await supabase
            .from('kts_compliance_standards')
            .insert({
                name: 'TEST-STANDARD-GLOBAL-BAN',
                version: 'v1.0',
                description: 'Global banned list for testing',
                is_active: true
            })
            .select()
            .single();
        standardId = newStandard.id;
        console.log('Created Standard:', standardId);
    }

    // 1. Ensure Restricted Substance
    let { data: existingSubstance } = await supabase
        .from('kts_restricted_substances')
        .select('id')
        .eq('cas_number', '999-99-9')
        .single();

    let substanceId;
    if (existingSubstance) {
        substanceId = existingSubstance.id;
    } else {
        const { data: newSubstance } = await supabase
            .from('kts_restricted_substances')
            .insert({
                standard_id: standardId,
                chemical_name: 'TEST-BANNED-SUBSTANCE',
                cas_number: '999-99-9',
                notes: 'Testing banned substance compliance',
                limit_value: 0,
                limit_unit: 'mg/kg'
            })
            .select()
            .single();
        substanceId = newSubstance.id;
        console.log('Created Substance:', substanceId);
    }

    // 2. Ensure Material
    let { data: existingMaterial } = await supabase
        .from('kts_materials')
        .select('id')
        .eq('code', 'TEST-MAT-999')
        .single();

    let materialId;
    if (existingMaterial) {
        materialId = existingMaterial.id;
    } else {
        const { data: newMaterial } = await supabase
            .from('kts_materials')
            .insert({
                code: 'TEST-MAT-999',
                name: 'TEST-BANNED-MATERIAL',
                unit: 'kg',
                category: 'Kimyasal',
                cas_number: '999-99-9',
                is_active: true,
                critical_level: 0
            })
            .select()
            .single();
        materialId = newMaterial.id;
        console.log('Created Material:', materialId);
    }

    // 3. RECIPE - FORCE RECREATE
    // Fetch IDs
    const { data: users } = await supabase.from('kts_users').select('id').limit(1);
    const userId = users[0].id;
    const { data: products } = await supabase.from('kts_products').select('id').limit(1);
    const productId = products[0].id;
    const { data: types } = await supabase.from('kts_usage_types').select('id').limit(1);
    const usageTypeId = types[0].id;

    console.log('Deleting existing test recipe if any...');
    // Find recipe by unique key (product_id + version) OR just code
    const { data: oldRecipe } = await supabase
        .from('kts_recipes')
        .select('id')
        .eq('version_code', 'TEST-BANNED')
        .maybeSingle();

    if (oldRecipe) {
        await supabase.from('kts_recipe_items').delete().eq('recipe_id', oldRecipe.id);
        await supabase.from('kts_recipes').delete().eq('id', oldRecipe.id);
        console.log('Deleted old test recipe.');
    }

    console.log('Creating fresh test recipe...');
    const { data: newRecipe, error: recError } = await supabase
        .from('kts_recipes')
        .insert({
            product_id: productId,
            usage_type_id: usageTypeId,
            version: 999,
            version_code: 'TEST-BANNED',
            status: 'draft',
            created_by: userId,
            notes: 'Test recipe with banned substance (Auto-generated)',
            recipe_name_no: 'TEST-RECIPE-BANNED'
        })
        .select()
        .single();

    if (recError) {
        console.error('Error creating recipe:', recError);
        return;
    }
    console.log('Created fresh recipe:', newRecipe.id);

    // 4. Add Recipe Item
    const { error: itemError } = await supabase
        .from('kts_recipe_items')
        .insert({
            recipe_id: newRecipe.id,
            material_id: materialId,
            quantity: 10,
            unit: 'kg',
            sort_order: 1
        });

    if (itemError) {
        console.error('Error adding items:', itemError);
    } else {
        console.log('Added banned material (10kg) to recipe.');
    }

    console.log('SEED COMPLETE.');
}

seedData();
