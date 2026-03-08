const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/[^a-z0-9İığüşöç\s]/g, '');
}

function normalizeCode(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9İığüşöç]/g, '').trim();
}

function matchMaterial(productCode, productName, materials) {
    const normalizedProductCode = normalizeCode(productCode);
    const normalizedProductName = normalizeString(productName);

    let bestMatch = { materialId: null, materialName: null, confidence: 0 };

    for (const material of materials) {
        const normalizedMaterialCode = normalizeCode(material.stock_code);
        const normalizedMaterialName = normalizeString(material.name);

        if (normalizedProductCode !== '' && normalizedProductCode === normalizedMaterialCode) {
            return { materialId: material.id, materialName: material.name, materialCode: material.stock_code, confidence: 1.0 };
        }

        if (normalizedProductCode !== '' && normalizedMaterialCode !== '' &&
            (normalizedProductCode.includes(normalizedMaterialCode) || normalizedMaterialCode.includes(normalizedProductCode))) {
            if (0.8 > bestMatch.confidence) {
                bestMatch = { materialId: material.id, materialName: material.name, materialCode: material.stock_code, confidence: 0.8 };
            }
        }

        if (normalizedProductName && normalizedMaterialName &&
            (normalizedProductName.includes(normalizedMaterialName) || normalizedMaterialName.includes(normalizedProductName))) {
            if (0.6 > bestMatch.confidence) {
                bestMatch = { materialId: material.id, materialName: material.name, materialCode: material.stock_code, confidence: 0.6 };
            }
        }
    }
    return bestMatch;
}

async function runMatchingSimulation() {
    const { data: inv } = await supabase.from('kts_incoming_invoices').select('*').order('created_at', { ascending: false }).limit(1).single();
    const { data: materials } = await supabase.from('kts_materials').select('*');

    if (!inv || !materials) return;

    const lines = inv.parsed_data.lines || [];
    const matchResults = [];
    let matchedCount = 0;

    console.log(`--- Matching Simulation for Invoice ${inv.invoice_number} ---`);
    lines.forEach(line => {
        const match = matchMaterial(line.productCode, line.productName, materials);
        const result = {
            ...line,
            materialId: match.materialId,
            materialName: match.materialName,
            materialCode: match.materialCode,
            confidence: match.confidence,
            matched: match.materialId && match.confidence >= 0.6
        };
        matchResults.push(result);
        if (result.matched) matchedCount++;
        
        console.log(`${line.productCode} -> ${match.materialName || 'NOT FOUND'} (Conf: ${match.confidence})`);
    });

    // Update DB with results
    await supabase.from('kts_incoming_invoices').update({
        match_result: matchResults,
        matched_count: matchedCount,
        unmatched_count: lines.length - matchedCount,
        status: matchedCount > 0 ? 'matched' : 'processing'
    }).eq('id', inv.id);

    console.log(`\nMatched: ${matchedCount} / ${lines.length}`);
}

runMatchingSimulation();
