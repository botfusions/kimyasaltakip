const fs = require('fs');
const path = require('path');

const tables = [
    'users',
    'products',
    'usage_types',
    'recipes',
    'materials',
    'recipe_items',
    'stock',
    'stock_movements',
    'usage_rules',
    'production_logs',
    'production_materials',
    'settings',
    'audit_logs',
    'compliance_standards',
    'restricted_substances',
    'compliance_checks',
    'compliance_documents'
];

// Map for specific replacements context
// We want to avoid replacing "settings" variable, only "settings" table ref.

const sourceDir = path.resolve(__dirname, '../frontend/src');
const typesFile = path.resolve(__dirname, '../frontend/src/types/database.types.ts');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    tables.forEach(table => {
        const ktsTable = `kts_${table}`;

        // 1. .from('table') or .from("table")
        // Use word boundary to ensure we don't match substrings if any (though these are specific words)
        const fromRegex = new RegExp(`\\.from\\(['"]${table}['"]\\)`, 'g');
        content = content.replace(fromRegex, `.from('${ktsTable}')`);

        // 2. .table('table') - sometimes used in Supabase management API or other libs
        const tableRegex = new RegExp(`\\.table\\(['"]${table}['"]\\)`, 'g');
        content = content.replace(tableRegex, `.table('${ktsTable}')`);

        // 3. Select strings with joins/embedding: 
        // "table(*)" -> "kts_table(*)"
        // "alias:table(*)" -> "alias:kts_table(*)"
        // "table!fkey(*)" -> "kts_table!fkey(*)"
        // "alias:table!fkey(*)" -> "alias:kts_table!fkey(*)"

        // We look for the table name followed by ( or ! or preceding :

        // Case A: table(*) or table (id, name)
        // We need to match table name that is preceded by start of string, comma, space, or colon
        // and followed by ( or !
        // matching inside string literals is hard with global regex, so we act aggressively on patterns that look like SQL parts

        // Regex explanation:
        // (?<=[:,\s"']) -> lookbehind: preceded by colon, comma, space, quote
        // table -> the table name
        // (?=[\(!]) -> lookahead: followed by ( or !

        // Note: JS lookbehind support is good in Node.js 20+. 
        // If not supported, we use capturing groups.

        // Pattern: ([:, \n"']|^)table([\(!])
        const embeddingRegex = new RegExp(`([:, \\n"']|^)${table}([\\(!])`, 'g');
        content = content.replace(embeddingRegex, `$1${ktsTable}$2`);

        // 4. Special handling for database.types.ts keys
        if (filePath.endsWith('database.types.ts')) {
            // key: { ... }
            // "table": {
            //   Row: ...
            const typeKeyRegex = new RegExp(`^\\s*"?${table}"?:\\s*{`, 'gm');
            content = content.replace(typeKeyRegex, (match) => {
                return match.replace(table, ktsTable).replace(/"/g, ''); // standardize without quotes usually
            });

            // References in Relationships: referencedRelation: "table"
            const relRegex = new RegExp(`referencedRelation:\\s*"${table}"`, 'g');
            content = content.replace(relRegex, `referencedRelation: "${ktsTable}"`);
        }

        // 5. foreignKeyName often contains table name, but Supabase might auto-rename them or not? 
        // The migration renaming tables usually keeps index names unless explicitly renamed.
        // However, my migration script DID rename indexes/constraints if I recalled correctly?
        // Wait, the migration script `20260216000002_rename_tables_kts.sql` renames tables, 
        // but usually constraints like `fkey` auto-update pointer but keep name?
        // Supabase types generator might use the NEW names if I regenerated types.
        // Since I am manually modifying types, I should probably leave foreignKeyName as is 
        // UNLESS I renamed constraints in SQL.
        // My SQL script: "ALTER INDEX ... RENAME TO ..."
        // But foreign keys? "tables_created_by_fkey" -> usually follows table rename if it includes table name?
        // Actually, Postgres does NOT automatically rename constraints/indexes when table is renamed.
        // My script explicitly renames constraints?
        // Let's check the migration file content from context.
        // It says: "ALTER TABLE old_name RENAME TO new_name;"
        // Check if it updates constraints/indexes.
    });

    if (content !== originalContent) {
        console.log(`Updating references in: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

const files = getAllFiles(sourceDir);
files.push(typesFile); // Ensure types file is processed even if outside sourceDir (it is inside though)

// Deduplicate
const uniqueFiles = [...new Set(files)];

console.log(`Scanning ${uniqueFiles.length} files...`);

uniqueFiles.forEach(processFile);
console.log('Done.');
