/**
 * Calculate Levenshtein distance for string similarity
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Normalize string for comparison (lowercase, trim, remove non-alphanumeric)
 */
export function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9İığüşöç\s]/g, ''); // Keep Turkish characters and spaces for better matching
}

/**
 * Normalize code for comparison (lowercase, remove all non-alphanumeric, remove spaces)
 */
export function normalizeCode(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9İığüşöç]/g, '')
        .trim();
}
