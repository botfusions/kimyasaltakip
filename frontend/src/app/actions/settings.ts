"use server";

import { createClient } from "../../lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kts_settings")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("getSettings Hatası:", error);
    return { data: null, error: error.message };
  }
}

export async function getSettingByKey(key: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kts_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data.value, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateSetting(key: string, value: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Yetkisiz erişim. Sadece Admin ayarları değiştirebilir.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("kts_settings")
      .update({
        value,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("key", key);

    if (error) throw error;

    revalidatePath("/dashboard/settings");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("updateSetting Hatası:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk update multiple settings at once
 */
export async function updateSettings(settingsData: Record<string, string>) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Yetkisiz erişim. Sadece Admin ayarları değiştirebilir.");
    }

    const supabase = await createClient();

    // Update each setting
    for (const [key, value] of Object.entries(settingsData)) {
      const { error } = await supabase
        .from("kts_settings")
        .update({
          value,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("key", key);

      if (error) throw error;
    }

    revalidatePath("/dashboard/settings");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("updateSettings Hatası:", error);
    return { success: false, error: error.message };
  }
}
