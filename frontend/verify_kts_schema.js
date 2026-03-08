const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyKtsSchema() {
  console.log("Verifying KTS Schema...");
  const tables = [
    "kts_users",
    "kts_products",
    "kts_usage_types",
    "kts_recipes",
    "kts_materials",
    "kts_recipe_items",
    "kts_stock",
    "kts_stock_movements",
    "kts_production_logs",
    "kts_compliance_standards",
    "kts_restricted_substances",
    "kts_compliance_checks",
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error) {
        console.log(`❌ ${table}: ERROR (${error.message})`);
      } else {
        console.log(`✅ ${table}: EXISTS`);
      }
    } catch (e) {
      console.log(`❌ ${table}: EXCEPTION (${e.message})`);
    }
  }
}

verifyKtsSchema();
