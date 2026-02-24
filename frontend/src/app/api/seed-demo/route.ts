
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createAdminClient();

    try {
        // 1. Get a valid user (created_by)
        // Prefer 'selam@botfusions.com' if exists
        let userId: string;

        const { data: specificUser } = await supabase.auth.admin.listUsers();
        // Filter manually as listUsers doesn't support eq('email') directly in all versions, or use the array
        const targetUser = specificUser?.users.find(u => u.email === 'selam@botfusions.com');

        if (targetUser) {
            userId = targetUser.id;
        } else {
            // Fallback to first user
            const { data: anyUser, error: userError } = await supabase
                .from('kts_users')
                .select('id')
                .limit(1)
                .single();

            if (userError || !anyUser) {
                return NextResponse.json({ error: 'No users found', details: userError }, { status: 500 });
            }
            userId = anyUser.id;
        }



        /*
        // DEBUG: Check recipe schema
        // ... (commented out)
        */

        // 2. Get or Create Usage Type (Üretim)
        let usageTypeId: string;
        const { data: existingUsageType } = await supabase
            .from('kts_usage_types')
            .select('id')
            .eq('name', 'Üretim')
            .single();

        if (existingUsageType) {
            usageTypeId = existingUsageType.id;
        } else {
            const { data: newUsageType, error: usageTypeError } = await supabase
                .from('kts_usage_types')
                .insert({
                    name: 'Üretim',
                    description: 'Demo için oluşturuldu',
                    color_code: '#000000',
                    is_active: true
                })
                .select('id')
                .single();

            if (usageTypeError || !newUsageType) {
                return NextResponse.json({ error: 'Failed to create usage type', details: usageTypeError }, { status: 500 });
            }
            usageTypeId = newUsageType.id;
        }

        // 3. Upsert Materials
        const materials = [
            { code: "KIM-001", name: "Isflatic (Wetting Agent)", unit: "lt", category: "Kimyasal" },
            { code: "KIM-045", name: "Kostik (Kireç Önleyici)", unit: "kg", category: "Kimyasal" },
            { code: "BOYA-102", name: "Reaktif Mavi R-Special", unit: "kg", category: "Boya" },
            { code: "BOYA-005", name: "Reaktif Kırmızı 3B", unit: "kg", category: "Boya" },
            { code: "KIM-022", name: "Soda Külü", unit: "kg", category: "Kimyasal" },
            { code: "KIM-010", name: "Tuz (Na2SO4)", unit: "kg", category: "Kimyasal" }
        ];

        const materialMap = new Map<string, string>(); // code -> id

        for (const mat of materials) {
            const { data: existing } = await supabase
                .from('kts_materials')
                .select('id')
                .eq('code', mat.code)
                .single();

            let matId = existing?.id;

            if (!matId) {
                const { data: newMat, error: createError } = await supabase
                    .from('kts_materials')
                    .insert({
                        ...mat,
                        is_active: true,
                        critical_level: 0
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error(`Error creating material ${mat.code}:`, createError);
                    return NextResponse.json({ error: `Failed to create material ${mat.code}`, details: createError }, { status: 500 });
                }
                matId = newMat.id;
            }

            materialMap.set(mat.code, matId);
        }

        // 3.5. Upsert Product (Needed for Recipe)
        const productData = {
            code: "DEMO-FABRIC-01",
            name: "Demo Kumaş (30/1 Penye)",
            // unit: "kg", // Removed due to schema error
            created_by: userId,
            is_active: true
        };

        let productId: string;
        const { data: existingProduct } = await supabase
            .from('kts_products')
            .select('id')
            .eq('code', productData.code)
            .single();

        if (existingProduct) {
            productId = existingProduct.id;
            // Update ownership
            await supabase.from('kts_products')
                .update({ created_by: userId })
                .eq('id', productId);
        } else {
            const { data: newProduct, error: productError } = await supabase
                .from('kts_products')
                .insert(productData)
                .select('id')
                .single();

            if (productError || !newProduct) {
                return NextResponse.json({ error: 'Failed to create product', details: productError }, { status: 500 });
            }
            productId = newProduct.id;
        }

        // 4. Create Recipe
        const recipeData = {
            recipe_name_no: "X Firması Reçetesi",
            // customer_name: "X Firması", // Removed due to schema error
            // color_code: "UNK-001", // Removed just in case
            // color_name: "Demo Renk", // Removed due to schema error
            created_by: userId,
            usage_type_id: usageTypeId,
            status: "draft",
            batch_ratio: "1/10",
            product_id: productId
        };

        // Check if recipe exists
        let recipeId: string;
        const { data: existingRecipe } = await supabase
            .from('kts_recipes')
            .select('id')
            .eq('recipe_name_no', recipeData.recipe_name_no)
            .single();

        if (existingRecipe) {
            recipeId = existingRecipe.id;
            // Update ownership to ensure visibility
            await supabase.from('kts_recipes')
                .update({ created_by: userId })
                .eq('id', recipeId);
        } else {
            const { data: newRecipe, error: recipeError } = await supabase
                .from('kts_recipes')
                .insert(recipeData)
                .select('id')
                .single();

            if (recipeError || !newRecipe) {
                return NextResponse.json({ error: 'Failed to create recipe', details: recipeError }, { status: 500 });
            }
            recipeId = newRecipe.id;
        }

        // 5. Create Recipe Items
        // Based on testing, 'kg' is the accepted unit for recipe_items check constraint.
        const items = [
            { code: "KIM-001", quantity: 1.0 },
            { code: "KIM-045", quantity: 2.0 },
            { code: "BOYA-102", quantity: 2.5 },
            { code: "BOYA-005", quantity: 0.1 },
            { code: "KIM-022", quantity: 20 },
            { code: "KIM-010", quantity: 60 }
        ];

        // First delete existing items for this recipe to avoid duplicates
        await supabase.from('kts_recipe_items').delete().eq('recipe_id', recipeId);

        let sortOrder = 1;
        for (const item of items) {
            const matId = materialMap.get(item.code);
            if (!matId) continue;

            // Force unit to 'kg' as it's the only one proven to work with the constraint
            const unit = 'kg';

            const { error: itemError } = await supabase.from('kts_recipe_items').insert({
                recipe_id: recipeId,
                material_id: matId,
                quantity: item.quantity,
                unit: unit,
                sort_order: sortOrder++
            });

            if (itemError) {
                return NextResponse.json({ error: `Failed to create recipe item for ${item.code}`, details: itemError }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Seeding complete!",
            data: {
                recipeId,
                materialsCreated: materials.length,
                itemsCreated: items.length
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
