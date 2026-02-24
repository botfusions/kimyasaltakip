import { normalizeString } from '../string-utils';

/**
 * Service to match invoice items with database materials
 */
export class MatchingEngine {
    /**
     * Match invoice line product code with materials in database
     * Uses fuzzy matching for better accuracy
     */
    static matchMaterial(
        productCode: string,
        productName: string,
        materials: Array<{ id: string; code: string; name: string }>
    ): { materialId: string | null; confidence: number } {
        if (!materials || materials.length === 0) {
            return { materialId: null, confidence: 0 };
        }

        const normalizedProductCode = normalizeString(productCode);
        const normalizedProductName = normalizeString(productName);

        let bestMatch: { materialId: string | null; confidence: number } = {
            materialId: null,
            confidence: 0,
        };

        for (const material of materials) {
            const normalizedMaterialCode = normalizeString(material.code);
            const normalizedMaterialName = normalizeString(material.name);

            // Exact code match = 100% confidence
            if (normalizedProductCode === normalizedMaterialCode) {
                return { materialId: material.id, confidence: 1.0 };
            }

            // Partial code match
            if (
                normalizedProductCode !== '' && normalizedMaterialCode !== '' &&
                (normalizedProductCode.includes(normalizedMaterialCode) ||
                    normalizedMaterialCode.includes(normalizedProductCode))
            ) {
                const confidence = 0.8;
                if (confidence > bestMatch.confidence) {
                    bestMatch = { materialId: material.id, confidence };
                }
            }

            // Name similarity (simple substring match)
            if (normalizedProductName && normalizedMaterialName) {
                if (normalizedProductName.includes(normalizedMaterialName)) {
                    const confidence = 0.6;
                    if (confidence > bestMatch.confidence) {
                        bestMatch = { materialId: material.id, confidence };
                    }
                }
            }
        }

        return bestMatch;
    }
}
