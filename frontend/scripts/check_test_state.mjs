import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecipeAndMaterials() {
    console.log('Checking for recipe: TEST-94001');
    const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('id, order_code, version_code, status')
        .eq('order_code', 'TEST-94001')
        .single();

    if (recipeError) {
        console.log('Recipe not found or error:', recipeError.message);
    } else {
        console.log('Recipe found:', recipe);

        const { data: items, error: itemsError } = await supabase
            .from('recipe_items')
            .select('*, material:materials(name, code)')
            .eq('recipe_id', recipe.id);

        if (itemsError) console.error('Error fetching items:', itemsError);
        else console.log('Recipe items:', items.map(i => ({
            material: i.material.name,
            quantity: i.quantity,
            id: i.material_id
        })));
    }

    console.log('\nChecking target materials:');
    const materialNames = ['Reaktif Kırmızı 3B', 'RUCO-FLOW BBA', 'Kostik'];
    const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('id, name, current_stock')
        .in('name', materialNames);

    if (materialsError) console.error('Error fetching materials:', materialsError);
    else console.log('Materials status:', materials);
}

checkRecipeAndMaterials();
