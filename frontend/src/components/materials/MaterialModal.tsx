"use client";

import { useState, FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { createMaterial, updateMaterial } from "../../app/actions/materials";

interface Material {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
  safety_info: string | null;
  storage_conditions: string | null;
  min_stock: number | null;
  max_stock: number | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  material: Material | null;
  onClose: (updatedMaterial?: Material) => void;
}

const MATERIAL_TYPES = [
  { value: "chemical", label: "Kimyasal" },
  { value: "raw_material", label: "Ham Madde" },
  { value: "packaging", label: "Ambalaj" },
  { value: "consumable", label: "Sarf Malzeme" },
];

const UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "l", label: "Litre (L)" },
  { value: "ml", label: "Mililitre (mL)" },
  { value: "pcs", label: "Adet" },
  { value: "m", label: "Metre (m)" },
  { value: "m2", label: "Metrekare (m²)" },
];

export default function MaterialModal({ material, onClose }: Props) {
  const isEditing = !!material;

  const [formData, setFormData] = useState({
    code: material?.code || "",
    name: material?.name || "",
    type: material?.type || "chemical",
    unit: material?.unit || "kg",
    safety_info: material?.safety_info || "",
    storage_conditions: material?.storage_conditions || "",
    min_stock: material?.min_stock?.toString() || "",
    max_stock: material?.max_stock?.toString() || "",
    is_active: material?.is_active ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formDataObj = new FormData();
      formDataObj.append("code", formData.code);
      formDataObj.append("name", formData.name);
      formDataObj.append("type", formData.type);
      formDataObj.append("unit", formData.unit);
      formDataObj.append("safety_info", formData.safety_info);
      formDataObj.append("storage_conditions", formData.storage_conditions);
      formDataObj.append("min_stock", formData.min_stock);
      formDataObj.append("max_stock", formData.max_stock);
      formDataObj.append("is_active", formData.is_active.toString());

      const result = isEditing
        ? await updateMaterial(material.id, formDataObj)
        : await createMaterial(formDataObj);

      if (result.error) {
        setError(result.error);
      } else {
        onClose(result.data);
      }
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => onClose()}
      title={isEditing ? "Malzeme Düzenle" : "Yeni Malzeme"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Code and Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Malzeme Kodu"
            type="text"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="örn. CHM-001"
            required
            helperText="Benzersiz malzeme kodu"
          />

          <Input
            label="Malzeme Adı"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="örn. Sodyum Hidroksit"
            required
          />
        </div>

        {/* Type and Unit Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Malzeme Tipi <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              required
            >
              {MATERIAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Birim <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              required
            >
              {UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock Limits Row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Minimum Stok"
            type="number"
            step="0.01"
            value={formData.min_stock}
            onChange={(e) =>
              setFormData({ ...formData, min_stock: e.target.value })
            }
            placeholder="örn. 10"
            helperText="Uyarı seviyesi için"
          />

          <Input
            label="Maksimum Stok"
            type="number"
            step="0.01"
            value={formData.max_stock}
            onChange={(e) =>
              setFormData({ ...formData, max_stock: e.target.value })
            }
            placeholder="örn. 100"
            helperText="İdeal stok seviyesi"
          />
        </div>

        {/* Safety Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Güvenlik Bilgileri
          </label>
          <textarea
            value={formData.safety_info}
            onChange={(e) =>
              setFormData({ ...formData, safety_info: e.target.value })
            }
            placeholder="Örn. Yanıcı, koruyucu ekipman kullanın. Göz ve cilt temasından kaçının."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Opsiyonel - GHS sembolleri, tehlike uyarıları, güvenlik önlemleri
          </p>
        </div>

        {/* Storage Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Saklama Koşulları
          </label>
          <textarea
            value={formData.storage_conditions}
            onChange={(e) =>
              setFormData({ ...formData, storage_conditions: e.target.value })
            }
            placeholder="Örn. Serin ve kuru yerde saklayın. Doğrudan güneş ışığından koruyun. 15-25°C sıcaklıkta."
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Opsiyonel - Sıcaklık, nem, ışık koşulları
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
            className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
          />
          <label
            htmlFor="is_active"
            className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Aktif Malzeme
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onClose()}
            className="flex-1"
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={isLoading}
          >
            {isEditing ? "Güncelle" : "Oluştur"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
