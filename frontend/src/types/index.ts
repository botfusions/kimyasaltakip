// Kullanıcı Roller
export type UserRole = "admin" | "lab" | "boyahane" | "depo";

// Reçete Durumu
export type RecipeStatus =
  | "draft"
  | "pending"
  | "approved"
  | "active"
  | "inactive";

// Üretim Durumu
export type ProductionStatus = "started" | "completed" | "cancelled";

// Stok Hareket Tipi
export type MovementType = "entry" | "exit";

// Kural Tipi
export type RuleType = "required" | "forbidden" | "min_ratio";

// Kullanıcı
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// Ürün
export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

// Kullanım Tipi
export interface UsageType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// Malzeme
export interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  critical_level: number;
  category?: string;
  is_active: boolean;
  created_at: string;
}

// Reçete
export interface Recipe {
  id: string;
  product_id: string;
  product?: Product;
  version: number;
  usage_type_id: string;
  usage_type?: UsageType;
  status: RecipeStatus;
  created_by: string;
  created_by_user?: User;
  approved_by?: string;
  approved_by_user?: User;
  approved_at?: string;
  notes?: string;
  created_at: string;
  materials?: RecipeMaterial[];
}

// Reçete Malzemesi
export interface RecipeMaterial {
  id: string;
  recipe_id: string;
  material_id: string;
  material?: Material;
  quantity: number;
  unit: string;
  sort_order: number;
}

// Stok
export interface Stock {
  id: string;
  material_id: string;
  material?: Material;
  quantity: number;
  last_updated: string;
}

// Stok Hareketi
export interface StockMovement {
  id: string;
  material_id: string;
  material?: Material;
  movement_type: MovementType;
  quantity: number;
  reference?: string;
  created_by: string;
  created_by_user?: User;
  created_at: string;
}

// Kullanım Kuralı
export interface UsageRule {
  id: string;
  usage_type_id: string;
  usage_type?: UsageType;
  material_id: string;
  material?: Material;
  rule_type: RuleType;
  min_ratio?: number;
  created_at: string;
}

// Üretim Logu
export interface ProductionLog {
  id: string;
  recipe_id: string;
  recipe?: Recipe;
  quantity: number;
  batch_number: string;
  operator_id: string;
  operator?: User;
  started_at: string;
  completed_at?: string;
  status: ProductionStatus;
  materials?: ProductionMaterial[];
}

// Üretim Malzemesi
export interface ProductionMaterial {
  id: string;
  production_log_id: string;
  material_id: string;
  material?: Material;
  quantity_used: number;
}

// Sistem Ayarı
export interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  updated_at: string;
}
