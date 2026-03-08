import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTables() {
  console.log("--- Inspecting recipes table ---");
  const { data, error } = await supabase.from("recipes").select("*").limit(1);
  if (error) {
    console.error("Error selecting from recipes:", error);
  } else {
    console.log("Column names for recipes:", Object.keys(data[0] || {}));
  }

  console.log("\n--- Inspecting materials table ---");
  const { data: mData, error: mError } = await supabase
    .from("materials")
    .select("*")
    .limit(1);
  if (mError) {
    console.error("Error selecting from materials:", mError);
  } else {
    console.log("Column names for materials:", Object.keys(mData[0] || {}));
  }
}

inspectTables();
