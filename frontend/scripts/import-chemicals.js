const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables manually if dotenv is not present
// For local execution, we assume the user provides the service role key
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lsppsvspgpifuirzxqic.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.",
  );
  console.error("Please run the script like this:");
  console.error(
    "  SET SUPABASE_SERVICE_ROLE_KEY=your_service_role_key && node scripts/import-chemicals.js",
  );
  console.error("  (or export SUPABASE_SERVICE_ROLE_KEY=... on Linux/Mac)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const JSON_FILE_PATH = path.join(
  __dirname,
  "../../docs/extract-data-2026-02-02.json",
);

async function importData() {
  console.log(`Reading JSON file from: ${JSON_FILE_PATH}`);

  try {
    const fileContent = fs.readFileSync(JSON_FILE_PATH, "utf8");
    const jsonData = JSON.parse(fileContent);

    const products = jsonData.powerbi_products;

    if (!products || !Array.isArray(products)) {
      throw new Error(
        'Invalid JSON format: "powerbi_products" array not found.',
      );
    }

    console.log(`Found ${products.length} products to import.`);

    const BATCH_SIZE = 1000;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE).map((p) => ({
        product_name: p.product_name,
        manufacturer: p.manufacturer,
        category: p.category,
        general_function: p.general_function,
        type: p.type,
        target_age_under_3: p.target_age_under_3,
        target_age_over_3: p.target_age_over_3,
        // created_at and updated_at will be handled by default values or triggers
      }));

      const { error } = await supabase
        .from("chemical_products")
        .upsert(batch, { onConflict: "product_name, manufacturer" }); // Assuming unique constraint or just insert

      // Note: If no unique constraint, upsert might act as insert.
      // Better to use insert if we are sure it's fresh, or delete all first.
      // Since we created the table, we can assume it's fresh or we want to append.
      // However, verify if 'onConflict' works without a unique constraint.
      // If not, we should probably just use .insert() and ignore duplicates if needed,
      // or just truncate table before running.

      if (error) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
        errorCount += batch.length;
      } else {
        processedCount += batch.length;
        process.stdout.write(
          `\rImported ${processedCount} / ${products.length} products...`,
        );
      }
    }

    console.log("\nImport completed.");
    console.log(`Successfully imported: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error("Fatal error during import:", error);
    process.exit(1);
  }
}

// Check if we should delete existing data first
// For this script, we'll append to be safe, but suggest user to truncate if needed.
console.log("Starting import process...");
importData();
