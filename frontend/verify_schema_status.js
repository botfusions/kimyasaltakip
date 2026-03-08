const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
  console.log("Verifying Schema...");

  // 1. Check materials.cas_number
  try {
    const { data: matData, error: matError } = await supabase
      .from("materials")
      .select("cas_number")
      .limit(1);
    if (matError) {
      console.log(
        "❌ materials.cas_number: MISSING (" + matError.message + ")",
      );
    } else {
      console.log("✅ materials.cas_number: EXISTS");
    }
  } catch (e) {
    console.log("❌ materials.cas_number: ERROR", e.message);
  }

  // 2. Check compliance_standards table
  try {
    const { data: stdData, error: stdError } = await supabase
      .from("compliance_standards")
      .select("*")
      .limit(1);
    if (stdError) {
      console.log(
        "❌ compliance_standards: MISSING (" + stdError.message + ")",
      );
    } else {
      console.log("✅ compliance_standards: EXISTS");
    }
  } catch (e) {
    console.log("❌ compliance_standards: ERROR", e.message);
  }

  // 3. Check restricted_substances table
  try {
    const { data: rsData, error: rsError } = await supabase
      .from("restricted_substances")
      .select("*")
      .limit(1);
    if (rsError) {
      console.log(
        "❌ restricted_substances: MISSING (" + rsError.message + ")",
      );
    } else {
      console.log("✅ restricted_substances: EXISTS");
    }
  } catch (e) {
    console.log("❌ restricted_substances: ERROR", e.message);
  }

  // 4. Check compliance_checks table
  try {
    const { data: ccData, error: ccError } = await supabase
      .from("compliance_checks")
      .select("*")
      .limit(1);
    if (ccError) {
      console.log("❌ compliance_checks: MISSING (" + ccError.message + ")");
    } else {
      console.log("✅ compliance_checks: EXISTS");
    }
  } catch (e) {
    console.log("❌ compliance_checks: ERROR", e.message);
  }
}

verifySchema();
