// @ts-nocheck
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          account_id: string
          created_at: string
          id: string
          id_token: string | null
          password: string | null
          provider_id: string
          refresh_token: string | null
          refresh_token_expires_at: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          account_id: string
          created_at?: string
          id: string
          id_token?: string | null
          password?: string | null
          provider_id: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          account_id?: string
          created_at?: string
          id?: string
          id_token?: string | null
          password?: string | null
          provider_id?: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_earning: {
        Row: {
          affiliate_relationship_id: string
          affiliate_workspace_id: string
          commission_percent: number
          created_at: string
          earning_amount_ore: number
          id: string
          invoice_amount_ore: number
          invoice_id: string
          paid_out_at: string | null
          paid_out_reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_relationship_id: string
          affiliate_workspace_id: string
          commission_percent: number
          created_at?: string
          earning_amount_ore: number
          id: string
          invoice_amount_ore: number
          invoice_id: string
          paid_out_at?: string | null
          paid_out_reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_relationship_id?: string
          affiliate_workspace_id?: string
          commission_percent?: number
          created_at?: string
          earning_amount_ore?: number
          id?: string
          invoice_amount_ore?: number
          invoice_id?: string
          paid_out_at?: string | null
          paid_out_reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_earning_affiliate_relationship_id_affiliate_relations"
            columns: ["affiliate_relationship_id"]
            isOneToOne: false
            referencedRelation: "affiliate_relationship"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earning_affiliate_workspace_id_workspace_id_fk"
            columns: ["affiliate_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earning_invoice_id_invoice_id_fk"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_relationship: {
        Row: {
          affiliate_workspace_id: string
          commission_percent: number
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          referred_workspace_id: string
          updated_at: string
        }
        Insert: {
          affiliate_workspace_id: string
          commission_percent?: number
          created_at?: string
          id: string
          is_active?: boolean
          notes?: string | null
          referred_workspace_id: string
          updated_at?: string
        }
        Update: {
          affiliate_workspace_id?: string
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          referred_workspace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_relationship_affiliate_workspace_id_workspace_id_fk"
            columns: ["affiliate_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_relationship_referred_workspace_id_workspace_id_fk"
            columns: ["referred_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deneme: {
        Row: {
          id: number
          yaz─▒i: string
        }
Insert: {
  id: number
  yaz─▒i: string
}
Update: {
  id ?: number
  yaz─▒i ?: string
}
Relationships: []
      }
image_generation: {
  Row: {
    created_at: string
    error_message: string | null
    id: string
    metadata: Json | null
    original_image_url: string
    parent_id: string | null
    project_id: string
    prompt: string
    result_image_url: string | null
    status: string
    updated_at: string
    user_id: string
    version: number
    workspace_id: string
  }
  Insert: {
    created_at ?: string
    error_message ?: string | null
    id: string
    metadata ?: Json | null
    original_image_url: string
    parent_id ?: string | null
    project_id: string
    prompt: string
    result_image_url ?: string | null
    status ?: string
    updated_at ?: string
    user_id: string
    version ?: number
    workspace_id: string
  }
  Update: {
    created_at ?: string
    error_message ?: string | null
    id ?: string
    metadata ?: Json | null
    original_image_url ?: string
    parent_id ?: string | null
    project_id ?: string
    prompt ?: string
    result_image_url ?: string | null
    status ?: string
    updated_at ?: string
    user_id ?: string
    version ?: number
    workspace_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "image_generation_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "image_generation_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "image_generation_workspace_id_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
    },
  ]
}
invitation: {
  Row: {
    accepted_at: string | null
    created_at: string
    email: string
    expires_at: string
    id: string
    role: string
    token: string
    workspace_id: string
  }
  Insert: {
    accepted_at ?: string | null
    created_at ?: string
    email: string
    expires_at: string
    id: string
    role ?: string
    token: string
    workspace_id: string
  }
  Update: {
    accepted_at ?: string | null
    created_at ?: string
    email ?: string
    expires_at ?: string
    id ?: string
    role ?: string
    token ?: string
    workspace_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "invitation_workspace_id_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
    },
  ]
}
invoice: {
  Row: {
    created_at: string
    currency: string
    due_date: string | null
    fiken_contact_id: number | null
    fiken_invoice_id: number | null
    fiken_invoice_number: string | null
    id: string
    issue_date: string | null
    notes: string | null
    paid_at: string | null
    status: string
    total_amount_ore: number
    updated_at: string
    workspace_id: string
  }
  Insert: {
    created_at ?: string
    currency ?: string
    due_date ?: string | null
    fiken_contact_id ?: number | null
    fiken_invoice_id ?: number | null
    fiken_invoice_number ?: string | null
    id: string
    issue_date ?: string | null
    notes ?: string | null
    paid_at ?: string | null
    status ?: string
    total_amount_ore: number
    updated_at ?: string
    workspace_id: string
  }
  Update: {
    created_at ?: string
    currency ?: string
    due_date ?: string | null
    fiken_contact_id ?: number | null
    fiken_invoice_id ?: number | null
    fiken_invoice_number ?: string | null
    id ?: string
    issue_date ?: string | null
    notes ?: string | null
    paid_at ?: string | null
    status ?: string
    total_amount_ore ?: number
    updated_at ?: string
    workspace_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "invoice_workspace_id_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
    },
  ]
}
invoice_line_item: {
  Row: {
    amount_ore: number
    created_at: string
    description: string
    id: string
    invoice_id: string | null
    project_id: string | null
    quantity: number
    status: string
    updated_at: string
    video_project_id: string | null
    workspace_id: string
  }
  Insert: {
    amount_ore: number
    created_at ?: string
    description: string
    id: string
    invoice_id ?: string | null
    project_id ?: string | null
    quantity ?: number
    status ?: string
    updated_at ?: string
    video_project_id ?: string | null
    workspace_id: string
  }
  Update: {
    amount_ore ?: number
    created_at ?: string
    description ?: string
    id ?: string
    invoice_id ?: string | null
    project_id ?: string | null
    quantity ?: number
    status ?: string
    updated_at ?: string
    video_project_id ?: string | null
    workspace_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "invoice_line_item_invoice_id_invoice_id_fk"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "invoice_line_item_project_id_project_id_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "invoice_line_item_video_project_id_video_project_id_fk"
            columns: ["video_project_id"]
            isOneToOne: false
            referencedRelation: "video_project"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "invoice_line_item_workspace_id_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
    },
  ]
}
materials: {
  Row: {
    category: string | null
    code: string
    created_at: string
    critical_level: number
    description: string | null
    id: string
    is_active: boolean
    name: string
    safety_info: Json | null
    supplier_info: Json | null
    unit: string
    updated_at: string
  }
  Insert: {
    category ?: string | null
    code: string
    created_at ?: string
    critical_level ?: number
    description ?: string | null
    id ?: string
    is_active ?: boolean
    name: string
    safety_info ?: Json | null
    supplier_info ?: Json | null
    unit ?: string
    updated_at ?: string
  }
  Update: {
    category ?: string | null
    code ?: string
    created_at ?: string
    critical_level ?: number
    description ?: string | null
    id ?: string
    is_active ?: boolean
    name ?: string
    safety_info ?: Json | null
    supplier_info ?: Json | null
    unit ?: string
    updated_at ?: string
  }
  Relationships: []
}
music_track: {
  Row: {
    artist: string | null
    attribution: string | null
    audio_url: string
    bpm: number | null
    category: string
    created_at: string
    duration_seconds: number
    id: string
    is_active: boolean
    license_type: string
    mood: string | null
    name: string
    preview_url: string | null
    waveform_url: string | null
  }
  Insert: {
    artist ?: string | null
    attribution ?: string | null
    audio_url: string
    bpm ?: number | null
    category: string
    created_at ?: string
    duration_seconds: number
    id: string
    is_active ?: boolean
    license_type ?: string
    mood ?: string | null
    name: string
    preview_url ?: string | null
    waveform_url ?: string | null
  }
  Update: {
    artist ?: string | null
    attribution ?: string | null
    audio_url ?: string
    bpm ?: number | null
    category ?: string
    created_at ?: string
    duration_seconds ?: number
    id ?: string
    is_active ?: boolean
    license_type ?: string
    mood ?: string | null
    name ?: string
    preview_url ?: string | null
    waveform_url ?: string | null
  }
  Relationships: []
}
production_logs: {
  Row: {
    actual_duration_minutes: number | null
    batch_number: string
    completed_at: string | null
    created_at: string
    estimated_duration_minutes: number | null
    id: string
    machine_info: Json | null
    notes: string | null
    operator_id: string
    quality_check_passed: boolean | null
    quantity: number
    recipe_id: string
    started_at: string | null
    status: string
    supervisor_id: string | null
    unit: string
    updated_at: string
  }
  Insert: {
    actual_duration_minutes ?: number | null
    batch_number: string
    completed_at ?: string | null
    created_at ?: string
    estimated_duration_minutes ?: number | null
    id ?: string
    machine_info ?: Json | null
    notes ?: string | null
    operator_id: string
    quality_check_passed ?: boolean | null
    quantity: number
    recipe_id: string
    started_at ?: string | null
    status ?: string
    supervisor_id ?: string | null
    unit ?: string
    updated_at ?: string
  }
  Update: {
    actual_duration_minutes ?: number | null
    batch_number ?: string
    completed_at ?: string | null
    created_at ?: string
    estimated_duration_minutes ?: number | null
    id ?: string
    machine_info ?: Json | null
    notes ?: string | null
    operator_id ?: string
    quality_check_passed ?: boolean | null
    quantity ?: number
    recipe_id ?: string
    started_at ?: string | null
    status ?: string
    supervisor_id ?: string | null
    unit ?: string
    updated_at ?: string
  }
  Relationships: [
    {
      foreignKeyName: "production_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "production_logs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "production_logs_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
  ]
}
production_materials: {
  Row: {
    actual_quantity: number | null
    created_at: string
    deducted_at: string | null
    id: string
    material_id: string
    notes: string | null
    planned_quantity: number
    production_log_id: string
    stock_deducted: boolean
    unit: string
    updated_at: string
    variance_percent: number | null
  }
  Insert: {
    actual_quantity ?: number | null
    created_at ?: string
    deducted_at ?: string | null
    id ?: string
    material_id: string
    notes ?: string | null
    planned_quantity: number
    production_log_id: string
    stock_deducted ?: boolean
    unit ?: string
    updated_at ?: string
    variance_percent ?: number | null
  }
  Update: {
    actual_quantity ?: number | null
    created_at ?: string
    deducted_at ?: string | null
    id ?: string
    material_id ?: string
    notes ?: string | null
    planned_quantity ?: number
    production_log_id ?: string
    stock_deducted ?: boolean
    unit ?: string
    updated_at ?: string
    variance_percent ?: number | null
  }
  Relationships: [
    {
      foreignKeyName: "production_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "production_materials_production_log_id_fkey"
            columns: ["production_log_id"]
            isOneToOne: false
            referencedRelation: "production_logs"
            referencedColumns: ["id"]
    },
  ]
}
products: {
  Row: {
    base_color: string | null
    code: string
    created_at: string
    created_by: string | null
    description: string | null
    id: string
    is_active: boolean
    name: string
    updated_at: string
  }
  Insert: {
    base_color ?: string | null
    code: string
    created_at ?: string
    created_by ?: string | null
    description ?: string | null
    id ?: string
    is_active ?: boolean
    name: string
    updated_at ?: string
  }
  Update: {
    base_color ?: string | null
    code ?: string
    created_at ?: string
    created_by ?: string | null
    description ?: string | null
    id ?: string
    is_active ?: boolean
    name ?: string
    updated_at ?: string
  }
  Relationships: [
    {
      foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
  ]
}
project: {
  Row: {
    completed_count: number
    created_at: string
    id: string
    image_count: number
    name: string
    room_type: string | null
    status: string
    style_template_id: string
    thumbnail_url: string | null
    updated_at: string
    user_id: string
    workspace_id: string
  }
  Insert: {
    completed_count ?: number
    created_at ?: string
    id: string
    image_count ?: number
    name: string
    room_type ?: string | null
    status ?: string
    style_template_id: string
    thumbnail_url ?: string | null
    updated_at ?: string
    user_id: string
    workspace_id: string
  }
  Update: {
    completed_count ?: number
    created_at ?: string
    id ?: string
    image_count ?: number
    name ?: string
    room_type ?: string | null
    status ?: string
    style_template_id ?: string
    thumbnail_url ?: string | null
    updated_at ?: string
    user_id ?: string
    workspace_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "project_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "project_workspace_id_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
    },
  ]
}
recipe_items: {
  Row: {
    created_at: string
    id: string
    material_id: string
    notes: string | null
    quantity: number
    recipe_id: string
    sort_order: number
    unit: string
  }
  Insert: {
    created_at ?: string
    id ?: string
    material_id: string
    notes ?: string | null
    quantity: number
    recipe_id: string
    sort_order ?: number
    unit ?: string
  }
  Update: {
    created_at ?: string
    id ?: string
    material_id ?: string
    notes ?: string | null
    quantity ?: number
    recipe_id ?: string
    sort_order ?: number
    unit ?: string
  }
  Relationships: [
    {
      foreignKeyName: "recipe_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
    },
  ]
}
recipes: {
  Row: {
    approved_at: string | null
    approved_by: string | null
    approved_by_manager: string | null
    barcode: string | null
    batch_ratio: string | null
    color_code: string | null
    created_at: string
    created_by: string
    finish_date: string | null
    id: string
    manager_approved_at: string | null
    notes: string | null
    planning_date: string | null
    process_wash_count: number | null

    product_id: string
    recipe_name_no: string | null
    cauldron_quantity: number | null
    start_date: string | null
    status: string
    total_weight_check: number | null
    updated_at: string
    usage_type_id: string
    validation_errors: Json | null
    version: number
    yarn_code: string | null
  }
  Insert: {
    approved_at ?: string | null
    approved_by ?: string | null
    approved_by_manager ?: string | null
    barcode ?: string | null
    batch_ratio ?: string | null
    color_code ?: string | null
    created_at ?: string
    created_by: string
    finish_date ?: string | null
    id ?: string
    manager_approved_at ?: string | null
    notes ?: string | null
    planning_date ?: string | null
    process_wash_count ?: number | null
    product_id: string
    recipe_name_no ?: string | null
    start_date ?: string | null
    status ?: string
    total_weight_check ?: number | null
    updated_at ?: string
    usage_type_id: string
    validation_errors ?: Json | null
    version ?: number
    yarn_code ?: string | null
  }
  Update: {
    approved_at ?: string | null
    approved_by ?: string | null
    approved_by_manager ?: string | null
    barcode ?: string | null
    batch_ratio ?: string | null
    color_code ?: string | null
    created_at ?: string
    created_by ?: string
    finish_date ?: string | null
    id ?: string
    manager_approved_at ?: string | null
    notes ?: string | null
    planning_date ?: string | null
    process_wash_count ?: number | null
    product_id ?: string
    recipe_name_no ?: string | null
    start_date ?: string | null
    status ?: string
    total_weight_check ?: number | null
    updated_at ?: string
    usage_type_id ?: string
    validation_errors ?: Json | null
    version ?: number
    yarn_code ?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "recipes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "recipes_approved_by_manager_fkey"
            columns: ["approved_by_manager"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "recipes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "recipes_usage_type_id_fkey"
            columns: ["usage_type_id"]
            isOneToOne: false
            referencedRelation: "usage_types"
            referencedColumns: ["id"]
    },
  ]
}
session: {
  Row: {
    created_at: string
    expires_at: string
    id: string
    impersonated_by: string | null
    ip_address: string | null
    token: string
    updated_at: string
    user_agent: string | null
    user_id: string
  }
  Insert: {
    created_at ?: string
    expires_at: string
    id: string
    impersonated_by ?: string | null
    ip_address ?: string | null
    token: string
    updated_at ?: string
    user_agent ?: string | null
    user_id: string
  }
  Update: {
    created_at ?: string
    expires_at ?: string
    id ?: string
    impersonated_by ?: string | null
    ip_address ?: string | null
    token ?: string
    updated_at ?: string
    user_agent ?: string | null
    user_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "session_impersonated_by_user_id_fk"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "session_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
    },
  ]
}
settings: {
  Row: {
    category: string
    created_at: string
    data_type: string
    description: string | null
    id: string
    is_editable: boolean
    key: string
    updated_at: string
    updated_by: string | null
    value: string
  }
  Insert: {
    category ?: string
    created_at ?: string
    data_type ?: string
    description ?: string | null
    id ?: string
    is_editable ?: boolean
    key: string
    updated_at ?: string
    updated_by ?: string | null
    value: string
  }
  Update: {
    category ?: string
    created_at ?: string
    data_type ?: string
    description ?: string | null
    id ?: string
    is_editable ?: boolean
    key ?: string
    updated_at ?: string
    updated_by ?: string | null
    value ?: string
  }
  Relationships: [
    {
      foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
  ]
}
stock: {
  Row: {
    id: string
    last_movement_at: string | null
    last_updated: string
    location: string | null
    material_id: string
    quantity: number
    reserved_quantity: number
    updated_by: string | null
  }
  Insert: {
    id ?: string
    last_movement_at ?: string | null
    last_updated ?: string
    location ?: string | null
    material_id: string
    quantity ?: number
    reserved_quantity ?: number
    updated_by ?: string | null
  }
  Update: {
    id ?: string
    last_movement_at ?: string | null
    last_updated ?: string
    location ?: string | null
    material_id ?: string
    quantity ?: number
    reserved_quantity ?: number
    updated_by ?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "stock_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "stock_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
  ]
}
stock_movements: {
  Row: {
    batch_number: string | null
    created_at: string
    created_by: string
    id: string
    material_id: string
    movement_type: string
    notes: string | null
    quantity: number
    reference_id: string | null
    reference_type: string | null
    supplier: string | null
    total_cost: number | null
    unit_cost: number | null
  }
  Insert: {
    batch_number ?: string | null
    created_at ?: string
    created_by: string
    id ?: string
    material_id: string
    movement_type: string
    notes ?: string | null
    quantity: number
    reference_id ?: string | null
    reference_type ?: string | null
    supplier ?: string | null
    total_cost ?: number | null
    unit_cost ?: number | null
  }
  Update: {
    batch_number ?: string | null
    created_at ?: string
    created_by ?: string
    id ?: string
    material_id ?: string
    movement_type ?: string
    notes ?: string | null
    quantity ?: number
    reference_id ?: string | null
    reference_type ?: string | null
    supplier ?: string | null
    total_cost ?: number | null
    unit_cost ?: number | null
  }
  Relationships: [
    {
      foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
    },
  ]
}
usage_rules: {
  Row: {
    created_at: string
    error_message: string | null
    id: string
    is_active: boolean
    material_id: string
    max_ratio: number | null
    min_ratio: number | null
    priority: number
    rule_type: string
    updated_at: string
    usage_type_id: string
  }
  Insert: {
    created_at ?: string
    error_message ?: string | null
    id ?: string
    is_active ?: boolean
    material_id: string
    max_ratio ?: number | null
    min_ratio ?: number | null
    priority ?: number
    rule_type: string
    updated_at ?: string
    usage_type_id: string
  }
  Update: {
    created_at ?: string
    error_message ?: string | null
    id ?: string
    is_active ?: boolean
    material_id ?: string
    max_ratio ?: number | null
    min_ratio ?: number | null
    priority ?: number
    rule_type ?: string
    updated_at ?: string
    usage_type_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "usage_rules_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "usage_rules_usage_type_id_fkey"
            columns: ["usage_type_id"]
            isOneToOne: false
            referencedRelation: "usage_types"
            referencedColumns: ["id"]
    },
  ]
}
usage_types: {
  Row: {
    color_code: string | null
    created_at: string
    description: string | null
    id: string
    is_active: boolean
    name: string
    updated_at: string
  }
  Insert: {
    color_code ?: string | null
    created_at ?: string
    description ?: string | null
    id ?: string
    is_active ?: boolean
    name: string
    updated_at ?: string
  }
  Update: {
    color_code ?: string | null
    created_at ?: string
    description ?: string | null
    id ?: string
    is_active ?: boolean
    name ?: string
    updated_at ?: string
  }
  Relationships: []
}
user: {
  Row: {
    banned: boolean
    created_at: string
    email: string
    email_verified: boolean
    id: string
    image: string | null
    is_system_admin: boolean
    name: string
    role: string
    updated_at: string
    workspace_id: string | null
  }
  Insert: {
    banned ?: boolean
    created_at ?: string
    email: string
    email_verified ?: boolean
    id: string
    image ?: string | null
    is_system_admin ?: boolean
    name: string
    role ?: string
    updated_at ?: string
    workspace_id ?: string | null
  }
  Update: {
    banned ?: boolean
    created_at ?: string
    email ?: string
    email_verified ?: boolean
    id ?: string
    image ?: string | null
    is_system_admin ?: boolean
    name ?: string
    role ?: string
    updated_at ?: string
    workspace_id ?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "user_workspace_id_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
    },
  ]
}
users: {
  Row: {
    created_at: string
    created_by: string | null
    email: string
    id: string
    is_active: boolean
    last_login_at: string | null
    name: string
    phone: string | null
    role: string
    signature_id: string | null
    updated_at: string
  }
  Insert: {
    created_at ?: string
    created_by ?: string | null
    email: string
    id ?: string
    is_active ?: boolean
    last_login_at ?: string | null
    name: string
    phone ?: string | null
    role: string
    signature_id ?: string | null
    updated_at ?: string
  }
  Update: {
    created_at ?: string
    created_by ?: string | null
    email ?: string
    id ?: string
    is_active ?: boolean
    last_login_at ?: string | null
    name ?: string
    phone ?: string | null
    role ?: string
    signature_id ?: string | null
    updated_at ?: string
  }
  Relationships: [
    {
      foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
    },
  ]
}
verification: {
  Row: {
    created_at: string
    expires_at: string
    id: string
    identifier: string
    updated_at: string
    value: string
  }
  Insert: {
    created_at ?: string
    expires_at: string
    id: string
    identifier: string
    updated_at ?: string
    value: string
  }
  Update: {
    created_at ?: string
    expires_at ?: string
    id ?: string
    identifier ?: string
    updated_at ?: string
    value ?: string
  }
  Relationships: []
}
video_clip: {
  Row: {
    clip_url: string | null
    created_at: string
    duration_seconds: number
    end_image_generation_id: string | null
    end_image_url: string | null
    error_message: string | null
    id: string
    image_generation_id: string | null
    metadata: Json | null
    motion_prompt: string | null
    room_label: string | null
    room_type: string
    sequence_order: number
    source_image_url: string
    status: string
    transition_clip_url: string | null
    transition_type: string
    updated_at: string
    video_project_id: string
  }
  Insert: {
    clip_url ?: string | null
    created_at ?: string
    duration_seconds ?: number
    end_image_generation_id ?: string | null
    end_image_url ?: string | null
    error_message ?: string | null
    id: string
    image_generation_id ?: string | null
    metadata ?: Json | null
    motion_prompt ?: string | null
    room_label ?: string | null
    room_type: string
    sequence_order: number
    source_image_url: string
    status ?: string
    transition_clip_url ?: string | null
    transition_type ?: string
    updated_at ?: string
    video_project_id: string
  }
  Update: {
    clip_url ?: string | null
    created_at ?: string
    duration_seconds ?: number
    end_image_generation_id ?: string | null
    end_image_url ?: string | null
    error_message ?: string | null
    id ?: string
    image_generation_id ?: string | null
    metadata ?: Json | null
    motion_prompt ?: string | null
    room_label ?: string | null
    room_type ?: string
    sequence_order ?: number
    source_image_url ?: string
    status ?: string
    transition_clip_url ?: string | null
    transition_type ?: string
    updated_at ?: string
    video_project_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "video_clip_end_image_generation_id_image_generation_id_fk"
            columns: ["end_image_generation_id"]
            isOneToOne: false
            referencedRelation: "image_generation"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "video_clip_image_generation_id_image_generation_id_fk"
            columns: ["image_generation_id"]
            isOneToOne: false
            referencedRelation: "image_generation"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "video_clip_video_project_id_video_project_id_fk"
            columns: ["video_project_id"]
            isOneToOne: false
            referencedRelation: "video_project"
            referencedColumns: ["id"]
    },
  ]
}
video_project: {
  Row: {
    actual_cost: number | null
    aspect_ratio: string
    clip_count: number
    completed_clip_count: number
    created_at: string
    description: string | null
    duration_seconds: number | null
    error_message: string | null
    estimated_cost: number
    final_video_url: string | null
    generate_native_audio: boolean
    id: string
    metadata: Json | null
    music_track_id: string | null
    music_volume: number
    name: string
    status: string
    thumbnail_url: string | null
    trigger_access_token: string | null
    trigger_run_id: string | null
    updated_at: string
    user_id: string
    workspace_id: string
  }
  Insert: {
    actual_cost ?: number | null
    aspect_ratio ?: string
    clip_count ?: number
    completed_clip_count ?: number
    created_at ?: string
    description ?: string | null
    duration_seconds ?: number | null
    error_message ?: string | null
    estimated_cost ?: number
    final_video_url ?: string | null
    generate_native_audio ?: boolean
    id: string
    metadata ?: Json | null
    music_track_id ?: string | null
    music_volume ?: number
    name: string
    status ?: string
    thumbnail_url ?: string | null
    trigger_access_token ?: string | null
    trigger_run_id ?: string | null
    updated_at ?: string
    user_id: string
    workspace_id: string
  }
  Update: {
    actual_cost ?: number | null
    aspect_ratio ?: string
    clip_count ?: number
    completed_clip_count ?: number
    created_at ?: string
    description ?: string | null
    duration_seconds ?: number | null
    error_message ?: string | null
    estimated_cost ?: number
    final_video_url ?: string | null
    generate_native_audio ?: boolean
    id ?: string
    metadata ?: Json | null
    music_track_id ?: string | null
    music_volume ?: number
    name ?: string
    status ?: string
    thumbnail_url ?: string | null
    trigger_access_token ?: string | null
    trigger_run_id ?: string | null
    updated_at ?: string
    user_id ?: string
    workspace_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "video_project_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
    },
    {
      foreignKeyName: "video_project_workspace_id_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
    },
  ]
}
workspace: {
  Row: {
    contact_email: string | null
    contact_person: string | null
    created_at: string
    id: string
    logo: string | null
    name: string
    onboarding_completed: boolean
    organization_number: string | null
    plan: string
    primary_color: string | null
    secondary_color: string | null
    slug: string
    status: string
    suspended_at: string | null
    suspended_reason: string | null
    updated_at: string
  }
  Insert: {
    contact_email ?: string | null
    contact_person ?: string | null
    created_at ?: string
    id: string
    logo ?: string | null
    name: string
    onboarding_completed ?: boolean
    organization_number ?: string | null
    plan ?: string
    primary_color ?: string | null
    secondary_color ?: string | null
    slug: string
    status ?: string
    suspended_at ?: string | null
    suspended_reason ?: string | null
    updated_at ?: string
  }
  Update: {
    contact_email ?: string | null
    contact_person ?: string | null
    created_at ?: string
    id ?: string
    logo ?: string | null
    name ?: string
    onboarding_completed ?: boolean
    organization_number ?: string | null
    plan ?: string
    primary_color ?: string | null
    secondary_color ?: string | null
    slug ?: string
    status ?: string
    suspended_at ?: string | null
    suspended_reason ?: string | null
    updated_at ?: string
  }
  Relationships: []
}
workspace_pricing: {
  Row: {
    created_at: string
    fiken_contact_id: number | null
    id: string
    image_project_price_ore: number | null
    updated_at: string
    video_project_price_ore: number | null
    workspace_id: string
  }
  Insert: {
    created_at ?: string
    fiken_contact_id ?: number | null
    id: string
    image_project_price_ore ?: number | null
    updated_at ?: string
    video_project_price_ore ?: number | null
    workspace_id: string
  }
  Update: {
    created_at ?: string
    fiken_contact_id ?: number | null
    id ?: string
    image_project_price_ore ?: number | null
    updated_at ?: string
    video_project_price_ore ?: number | null
    workspace_id ?: string
  }
  Relationships: [
    {
      foreignKeyName: "workspace_pricing_workspace_id_workspace_id_fk"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspace"
            referencedColumns: ["id"]
    },
  ]
}
    }
Views: {
  [_ in never]: never
}
Functions: {
  generate_recipe_barcode: { Args: never; Returns: string }
  match_documents:
        | {
    Args: { match_count?: number; query_embedding: string }
            Returns: {
      content: string
              id: number
              similarity: number
    }[]
  }
    | {
    Args: {
      filter?: Json
              match_count?: number
              query_embedding: string
    }
            Returns: {
      content: string
              id: number
              metadata: Json
              similarity: number
    }[]
  }
  match_volkan_chat_bot_v1: {
    Args: {
      match_count ?: number
      match_threshold ?: number
      query_embedding: string
    }
    Returns: {
      content: string
      id: number
      metadata: Json
      similarity: number
    } []
  }
  match_volkan_chat_bot_v2: {
    Args: {
      match_count ?: number
      match_threshold ?: number
      query_embedding: string
    }
    Returns: {
      content: string
      id: number
      metadata: Json
      similarity: number
    } []
  }
}
Enums: {
  [_ in never]: never
}
CompositeTypes: {
  [_ in never]: never
}
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
