'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

// --- Hardcoded Seed Data (Subset for Demo) ---
const SEED_STANDARDS = [
    { name: 'ZDHC MRSL v3.1', version: '3.1', description: 'Zero Discharge of Hazardous Chemicals' },
    { name: 'Oeko-Tex Standard 100', version: '2025', description: 'Tested for harmful substances' }
];

const SEED_SUBSTANCES = [
    // ZDHC MRSL v3.1
    { standard: 'ZDHC MRSL v3.1', cas: '9016-45-9', name: 'Nonylphenol ethoxylates (NPEO)', limit: 10, unit: 'mg/kg' },
    { standard: 'ZDHC MRSL v3.1', cas: '92-87-5', name: 'Benzidine', limit: 20, unit: 'mg/kg' },
    { standard: 'ZDHC MRSL v3.1', cas: '7440-43-9', name: 'Cadmium', limit: 5, unit: 'mg/kg' },
    { standard: 'ZDHC MRSL v3.1', cas: '7439-92-1', name: 'Lead', limit: 90, unit: 'mg/kg' },
    { standard: 'ZDHC MRSL v3.1', cas: '7440-38-2', name: 'Arsenic', limit: 10, unit: 'mg/kg' },
    { standard: 'ZDHC MRSL v3.1', cas: '7440-47-3', name: 'Chromium (VI)', limit: 3, unit: 'mg/kg' },

    // Oeko-Tex Standard 100
    { standard: 'Oeko-Tex Standard 100', cas: '50-00-0', name: 'Formaldehyde', limit: 75, unit: 'mg/kg' },
    { standard: 'Oeko-Tex Standard 100', cas: '7439-92-1', name: 'Lead', limit: 90, unit: 'mg/kg' },
    { standard: 'Oeko-Tex Standard 100', cas: '7440-43-9', name: 'Cadmium', limit: 40, unit: 'mg/kg' },
    { standard: 'Oeko-Tex Standard 100', cas: '111-15-9', name: '2-Ethoxyethyl acetate', limit: 5, unit: 'mg/kg' },
];

/**
 * Ensures that basic compliance data exists.
 * Called automatically before checks.
 */
async function ensureComplianceData() {
    const supabase = await createClient();

    // Check if standards exist
    const { count } = await supabase.from('compliance_standards').select('*', { count: 'exact', head: true });

    if (count === 0) {
        console.log('Seeding compliance data...');

        // 1. Insert Standards
        const { data: standards, error: stdError } = await supabase
            .from('compliance_standards')
            .insert(SEED_STANDARDS)
            .select();

        if (stdError) {
            console.error('Error seeding standards:', stdError);
            return;
        }

        // 2. Insert Substances
        // Map standard names to IDs
        const stdMap = new Map(standards.map((s: any) => [s.name, s.id]));

        const substancesToInsert = SEED_SUBSTANCES.map(s => ({
            standard_id: stdMap.get(s.standard),
            cas_number: s.cas,
            chemical_name: s.name,
            limit_value: s.limit,
            limit_unit: s.unit
        })).filter(s => s.standard_id); // Ensure we have the ID

        if (substancesToInsert.length > 0) {
            const { error: subError } = await supabase.from('restricted_substances').insert(substancesToInsert);
            if (subError) console.error('Error seeding substances:', subError);
        }
    }
}

/**
 * Check if a recipe complies with all active standards.
 */
export async function checkRecipeCompliance(recipeId: string) {
    const currentUser = await getCurrentUser();

    // 1. Ensure data exists
    await ensureComplianceData();

    const supabase = await createClient();

    // 2. Get Recipe Items & Materials
    const { data: recipe } = await supabase
        .from('recipes')
        .select(`
            id,
            recipe_items (
                material:materials (
                    id,
                    name,
                    cas_number
                )
            )
        `)
        .eq('id', recipeId)
        .single();

    if (!recipe || !recipe.recipe_items) {
        return { error: 'Reçete veya malzeme bulunamadı' };
    }

    // Filter items that have a CAS number
    const itemsWithCas = recipe.recipe_items
        .map((item: any) => item.material)
        .filter((m: any) => m && m.cas_number);

    if (itemsWithCas.length === 0) {
        return { success: true, message: 'Kontrol edilecek CAS numaralı malzeme yok.', status: 'pass', violations: [] };
    }

    const casList = itemsWithCas.map((m: any) => m.cas_number);

    // 3. Check against Restricted Substances
    // We want to find any substance in the restricted list that matches our CAS numbers
    const { data: restrictions } = await supabase
        .from('restricted_substances')
        .select(`
            *,
            standard:compliance_standards (name)
        `)
        .in('cas_number', casList);

    const violations: any[] = [];
    const passedStandards = new Set<string>();

    if (restrictions && restrictions.length > 0) {
        // Map violations
        for (const restriction of restrictions) {
            const material = itemsWithCas.find((m: any) => m.cas_number === restriction.cas_number);
            violations.push({
                standard: (restriction.standard as any)?.name,
                material: material?.name,
                cas: restriction.cas_number,
                limit: `${restriction.limit_value} ${restriction.limit_unit}`,
                status: 'FAIL'
            });
        }
    }

    // 4. Save/Update Compliance Check Record
    // We should probably save a record per standard, but for simplicity, we'll save a summary or just return it.
    // The schema has 'compliance_checks' table.

    // Let's perform a check for each active standard to be thorough
    const { data: allStandards } = await supabase.from('compliance_standards').select('id, name').eq('is_active', true);

    if (allStandards) {
        for (const std of allStandards) {
            const stdViolations = violations.filter(v => v.standard === std.name);
            const status = stdViolations.length > 0 ? 'fail' : 'pass';

            // Upsert compliance check
            // We need a unique constraint on (recipe_id, standard_id) which we might not have explicitly defined in the create table 
            // but usually compliance_checks has an ID. We'll search first.

            const checksToUpsert = {
                recipe_id: recipeId,
                standard_id: std.id,
                status,
                report: stdViolations.length > 0 ? { violations: stdViolations } : { message: 'All clear' },
                checked_at: new Date().toISOString(),
                checked_by: currentUser?.id
            };

            // First delete old check for this recipe/standard
            const { error: delError } = await supabase
                .from('compliance_checks')
                .delete()
                .eq('recipe_id', recipeId)
                .eq('standard_id', std.id);

            if (delError) console.error('Error deleting old checks:', delError);

            const { error: insError } = await supabase
                .from('compliance_checks')
                .insert({
                    recipe_id: recipeId,
                    standard_id: std.id,
                    status: status,
                    report: violations.length > 0 ? { violations } : { message: 'All clear' },
                    checked_at: new Date().toISOString(),
                    checked_by: currentUser?.id
                });

            if (insError) console.error('Error inserting check:', insError);
        }
    }

    const hasFailures = violations.length > 0;

    return {
        success: true,
        status: hasFailures ? 'fail' : 'pass',
        violations,
        message: hasFailures
            ? `${violations.length} kısıtlı madde tespit edildi.`
            : 'Tüm standartlara uygun.'
    };
}
