"use server";

import { createClient } from "../../lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getIntelligenceSources() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kts_intelligence_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function addIntelligenceSource(formData: {
  name: string;
  url: string;
  category: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Yetkisiz erişim. Sadece Admin kaynak ekleyebilir.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kts_intelligence_sources")
      .insert([formData])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/settings/intelligence");
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function deleteIntelligenceSource(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Yetkisiz erişim.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("kts_intelligence_sources")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/settings/intelligence");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleSourceStatus(id: string, currentStatus: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") throw new Error("Yetkisiz erişim.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("kts_intelligence_sources")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/settings/intelligence");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
