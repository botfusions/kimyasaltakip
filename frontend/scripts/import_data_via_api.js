const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Manually parse .env.local to avoid dotenv issues
const envPath = path.join(__dirname, "../.env.local");
console.log("Loading env from:", envPath);

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
    const updateVal = parts.slice(1).join("=").trim(); // Handle values with =
    envVars[key] = updateVal;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseKey)
  console.log(
    "Service Key found (starts with):",
    supabaseKey.substring(0, 10) + "...",
  );
else console.log("Service Key NOT found in parsed env.");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials. Please check .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importData() {
  console.log("Starting data import...");

  // 1. Get Admin User for 'created_by'
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error("Error fetching user:", userError);
    return;
  }
  const userId = users[0].id;
  console.log("Using User ID:", userId);

  // Data to Import
  const materials = [
    {
      code: "33905C",
      name: "RUCO-FLOW BBA",
      unit: "kg",
      category: "Kimyasal",
      is_active: true,
      critical_level: 100,
    },
    {
      code: "25-0035",
      name: "RUCOGEN PVN",
      unit: "kg",
      category: "Kimyasal",
      is_active: true,
      critical_level: 500,
    },
  ];

  const stockMovements = [
    {
      code: "33905C",
      qty: 100,
      supplier: "RUDOLF DURANER KİMYEVİ MADDELER TİC. ve SAN. A.Ş.",
      ref: "RUD2025000017302",
      notes: "Örnek Fatura: RUD2025000017302 (XML)",
    },
    {
      code: "25-0035",
      qty: 1000,
      supplier: "RUDOLF DURANER KİMYEVİ MADDELER TİC. ve SAN. A.Ş.",
      ref: "7350213672",
      notes: "Örnek Fatura: 7350213672 (PDF)",
    },
  ];

  // 2. Insert/Update Materials
  for (const mat of materials) {
    const { data, error } = await supabase
      .from("materials")
      .upsert(mat, { onConflict: "code" })
      .select()
      .single();

    if (error) {
      console.error(`Error upserting material ${mat.code}:`, error);
    } else {
      console.log(`Material processed: ${mat.name} (${data.id})`);
    }
  }

  // 3. Insert Stock Movements
  for (const mov of stockMovements) {
    // Get Material ID
    const { data: matData } = await supabase
      .from("materials")
      .select("id")
      .eq("code", mov.code)
      .single();

    if (!matData) {
      console.error(`Material not found for movement: ${mov.code}`);
      continue;
    }

    const payload = {
      material_id: matData.id,
      movement_type: "in",
      quantity: mov.qty,
      supplier: mov.supplier,
      created_by: userId,
      notes: mov.notes,
      reference_id: mov.ref, // Now TEXT, so this works
      reference_type: "external_invoice",
    };

    const { error } = await supabase.from("stock_movements").insert(payload);

    if (error) {
      console.error(`Error inserting movement for ${mov.code}:`, error);
    } else {
      console.log(`Stock movement added for ${mov.code}: +${mov.qty}kg`);
    }
  }

  console.log("Import completed.");
}

importData();
