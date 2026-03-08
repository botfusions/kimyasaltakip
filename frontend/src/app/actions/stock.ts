"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { getCurrentUser } from "./auth";
import {
  parseStockMovementFormData,
  formatZodErrors,
} from "../../lib/validations";

/**
 * Kritik stok seviyesindeki malzemeleri getir
 */
export async function getCriticalStock() {
  try {
    const supabase = await createClient();

    // view_critical_stock görünümünü kullan
    const { data, error } = await supabase
      .from("view_critical_stock")
      .select("*")
      .order("difference", { ascending: true });

    if (error) {
      console.error("Kritik stok sorgusu hatası:", error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error("getCriticalStock hatası:", error);
    return { data: [], error: error.message };
  }
}

/**
 * Genel stok istatistiklerini getir
 */
export async function getStockStats() {
  try {
    const supabase = await createClient();

    // Toplam malzeme sayısı
    const { count: totalMaterials } = await supabase
      .from("kts_materials")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Kritik stok sayısı
    const { count: criticalCount } = await supabase
      .from("view_critical_stock")
      .select("*", { count: "exact", head: true });

    // Toplam stok değeri (stock tablosundan)
    const { data: stockData } = await supabase
      .from("kts_stock")
      .select("quantity");

    const totalStockQuantity =
      stockData?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ||
      0;

    return {
      data: {
        totalMaterials: totalMaterials || 0,
        criticalStockCount: criticalCount || 0,
        totalStockQuantity: Math.round(totalStockQuantity),
      },
      error: null,
    };
  } catch (error: any) {
    console.error("getStockStats hatası:", error);
    return {
      data: {
        totalMaterials: 0,
        criticalStockCount: 0,
        totalStockQuantity: 0,
      },
      error: error.message,
    };
  }
}

/**
 * Tüm stokları getir
 */
export async function getAllStock(filters?: {
  search?: string;
  category?: string;
  low_stock_only?: boolean;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("kts_stock")
      .select(
        `
                *,
                material:kts_materials(
                    id,
                    code,
                    name,
                    unit,
                    category,
                    critical_level,
                    is_active
                )
            `,
      )
      .order("material(name)", { ascending: true });

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    let stocks = data || [];

    // Client-side filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      stocks = stocks.filter(
        (s: any) =>
          s.material?.name?.toLowerCase().includes(searchLower) ||
          s.material?.code?.toLowerCase().includes(searchLower),
      );
    }

    if (filters?.category) {
      stocks = stocks.filter(
        (s: any) => s.material?.category === filters.category,
      );
    }

    if (filters?.low_stock_only) {
      stocks = stocks.filter(
        (s: any) => s.quantity <= (s.material?.critical_level || 0),
      );
    }

    return { data: stocks, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}

/**
 * Stok hareketi ekle (giriş/çıkış/düzeltme)
 */
/**
 * Internal function to add stock movement (bypasses permission check for internal use)
 */
export async function addStockMovementInternal(
  data: {
    materialId: string;
    movementType: string;
    quantity: number;
    unitCost?: number | null;
    batchNumber?: string | null;
    supplier?: string | null;
    notes?: string | null;
    userId: string;
    referenceType?: string | null;
    referenceId?: string | null;
  },
  supabaseClient?: any,
) {
  try {
    const supabase = supabaseClient || (await createClient());

    const {
      materialId,
      movementType,
      quantity,
      unitCost,
      batchNumber,
      supplier,
      notes,
      userId,
      referenceType,
      referenceId,
    } = data;

    // 1. Stok hareketi kaydet
    const totalCost = unitCost ? quantity * unitCost : null;

    const { data: movement, error: movementError } = await supabase
      .from("kts_stock_movements")
      .insert({
        material_id: materialId,
        movement_type: movementType,
        quantity: movementType === "out" ? -quantity : quantity,
        unit_cost: unitCost,
        total_cost: totalCost,
        batch_number: batchNumber,
        supplier: supplier,
        notes: notes,
        created_by: userId,
        reference_type: referenceType,
        reference_id: referenceId,
      })
      .select()
      .single();

    if (movementError) {
      return { error: "Stok hareketi kaydedilemedi: " + movementError.message };
    }

    // 2. Stock tablosunu güncelle
    const { data: currentStock } = await supabase
      .from("kts_stock")
      .select("quantity")
      .eq("material_id", materialId)
      .single();

    const currentQuantity = currentStock?.quantity || 0;
    const newQuantity =
      movementType === "out"
        ? currentQuantity - quantity
        : currentQuantity + quantity;

    if (newQuantity < 0) {
      // Rollback movement
      await supabase.from("kts_stock_movements").delete().eq("id", movement.id);
      return { error: "Stok miktarı negatif olamaz" };
    }

    const { error: stockError } = await supabase.from("kts_stock").upsert(
      {
        material_id: materialId,
        quantity: newQuantity,
        last_movement_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "material_id" },
    );

    if (stockError) {
      // Rollback movement
      await supabase.from("kts_stock_movements").delete().eq("id", movement.id);
      return { error: "Stok güncellenemedi: " + stockError.message };
    }

    return { success: true, data: movement };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Stok hareketi ekle (giriş/çıkış/düzeltme)
 */
export async function addStockMovement(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !["admin", "warehouse"].includes(currentUser.role)) {
      return { error: "Bu işlem için yetkiniz yok" };
    }

    const materialId = formData.get("material_id") as string;
    const movementType = formData.get("movement_type") as string;

    // Validate with Zod schema
    const validation = parseStockMovementFormData(formData);
    if (!validation.success) {
      return { error: formatZodErrors(validation.error) };
    }

    const result = await addStockMovementInternal({
      materialId,
      movementType,
      quantity: validation.data.quantity,
      unitCost: validation.data.unit_cost,
      batchNumber: validation.data.batch_number,
      supplier: validation.data.supplier,
      notes: validation.data.notes,
      userId: currentUser.id,
      referenceType: "manual_adjustment",
    });

    if (result.success) {
      revalidatePath("/dashboard/stock");
    }

    return result;
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Tüm malzemelerin stok miktarını material_id -> quantity map olarak getir
 */
export async function getStockQuantityMap(): Promise<{
  data: Record<string, number>;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("kts_stock")
      .select("material_id, quantity");

    if (error) {
      console.error("getStockQuantityMap error:", error);
      return { data: {}, error: error.message };
    }

    const map: Record<string, number> = {};
    for (const row of data || []) {
      map[row.material_id] = Number(row.quantity) || 0;
    }

    return { data: map, error: null };
  } catch (error: any) {
    console.error("getStockQuantityMap exception:", error);
    return { data: {}, error: error.message };
  }
}

/**
 * Stok hareketlerini getir
 */
export async function getStockMovements(materialId: string, limit = 50) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("kts_stock_movements")
      .select(
        `
                *,
                created_by_user:kts_users!stock_movements_created_by_fkey(id, name)
            `,
      )
      .eq("material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
}
