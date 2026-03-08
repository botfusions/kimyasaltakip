const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local
const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error(".env.local file not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};

envContent.split("\n").forEach((line) => {
  line = line.trim();
  if (line && !line.startsWith("#")) {
    const parts = line.split("=");
    const key = parts[0].trim();
    const updateVal = parts.slice(1).join("=").trim();
    envVars[key] = updateVal;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log(
    "Applying migration: ALTER TABLE stock_movements ALTER COLUMN reference_id TYPE TEXT...",
  );

  // Supabase JS doesn't support raw SQL directly on the standard client unless using .rpc() with a custom function
  // OR if we use the Postgres connection string.
  // BUT, we don't have the connection string in the env file, only the URL and Key.
  // AND the previous attempts to use 'pg' failed because we lacked the connection string (DATABASE_URL).

  // WAIT. If I cannot run raw SQL via JS Client without a function, I cannot change the schema from here
  // UNLESS I have a function exposed that allows it (dangerous) OR I use the REST API to call a function.

  // However, the user provided the Service Role Key.
  // The correct way if we only have HTTP access is to use the SQL Editor in the Dashboard.
  // BUT I can try to use the 'pg' library if I can construct the connection string.
  // The connection string usually is: postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  // I don't have the password.

  // SO, I cannot execute DDL (Alter Table) from this script if I don't have the password or a pre-existing RPC function.

  // Panic check: The user said "fatura nosu supabase tablo da olmalı".
  // I can't change the schema without the password or dashboard access.

  // ALTERNATIVE: Use the `notes` field properly or `batch_number` if appropriate? No.
  // Is there any other field?
  // `reference_type` is VARCHAR.
  // `supplier` is VARCHAR.

  // Let's look at `stock_movements` columns again.
  // id, material_id, movement_type, quantity, unit_cost, total_cost, reference_type, reference_id (UUID), batch_number, supplier, notes.

  // If I cannot change the schema, I must tell the user to run the SQL.
  // "Fatura numarasını veritabanına kaydetmek için tablo yapısında küçük bir değişiklik gerekiyor."
  // I will write the SQL for them.

  console.log("Cannot execute DDL via API key. Generating SQL for user.");
}

// Rewriting logic to just generate the file.
const migrationSQL = `
-- Fatura Numaralarını kaydetmek için reference_id kolon tipini değiştirme
ALTER TABLE stock_movements ALTER COLUMN reference_id TYPE TEXT;
`;

const outputPath = path.join(__dirname, "../../migration_fix_reference_id.sql");
fs.writeFileSync(outputPath, migrationSQL);
console.log(`Migration SQL file created at: ${outputPath}`);
