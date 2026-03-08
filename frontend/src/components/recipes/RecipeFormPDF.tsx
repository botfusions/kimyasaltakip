"use client";

import React from "react";
import { generateBarcodeDataURL } from "../../lib/barcode";

interface Recipe {
  id: string;
  barcode: string;
  recipe_name_no: string;
  color_code: string;
  yarn_code: string;
  planning_date: string;
  start_date: string;
  finish_date: string;
  batch_ratio: string;
  process_wash_count: number;
  product: {
    code: string;
    name: string;
  };
  recipe_materials: Array<{
    material: {
      code: string;
      name: string;
    };
    quantity: number;
    unit: string;
    notes?: string;
  }>;
}

interface RecipeFormPDFProps {
  recipe: Recipe;
}

/**
 * RATEKS-style Recipe Form Component
 * Matches the original paper form layout
 */
export default function RecipeFormPDF({ recipe }: RecipeFormPDFProps) {
  const barcodeDataURL = generateBarcodeDataURL(recipe.barcode);
  const today = new Date().toLocaleDateString("tr-TR");

  return (
    <div
      className="bg-white p-8 text-black"
      style={{ width: "210mm", minHeight: "297mm" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-gray-800 pb-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-700">RATEKS</h1>
          <p className="text-sm text-gray-600 mt-1">Reçete Form No:</p>
        </div>
        <div className="text-right">
          <p className="text-xs">{today}</p>
          {barcodeDataURL && (
            <img
              src={barcodeDataURL}
              alt="Barcode"
              className="mt-2"
              style={{ height: "60px" }}
            />
          )}
        </div>
      </div>

      {/* Form Details - Grid Layout */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
        <div className="flex">
          <span className="font-semibold w-40">Reçete İsim No:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.recipe_name_no || "-"}
          </span>
        </div>
        <div className="flex">
          <span className="font-semibold w-40">Planlama Tarihi:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.planning_date
              ? new Date(recipe.planning_date).toLocaleDateString("tr-TR")
              : "-"}
          </span>
        </div>

        <div className="flex">
          <span className="font-semibold w-40">Renk No:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.color_code || "-"}
          </span>
        </div>
        <div className="flex">
          <span className="font-semibold w-40">İş Pan Tarihi:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.start_date
              ? new Date(recipe.start_date).toLocaleDateString("tr-TR")
              : "-"}
          </span>
        </div>

        <div className="flex">
          <span className="font-semibold w-40">Prosesteki Yık. Pros:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.process_wash_count || "-"}
          </span>
        </div>
        <div className="flex">
          <span className="font-semibold w-40">Başy Tarihi:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.finish_date
              ? new Date(recipe.finish_date).toLocaleDateString("tr-TR")
              : "-"}
          </span>
        </div>

        <div className="flex">
          <span className="font-semibold w-40">Sicim Kodu:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.yarn_code || "-"}
          </span>
        </div>
        <div className="flex">
          <span className="font-semibold w-40">Bangay Örm:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.batch_ratio || "-"}
          </span>
        </div>

        <div className="flex col-span-2">
          <span className="font-semibold w-40">Renk İsalik:</span>
          <span className="flex-1 border-b border-gray-400">
            {recipe.product.name}
          </span>
        </div>
      </div>

      {/* Materials Table */}
      <div className="border-2 border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-800">
              <th className="border-r border-gray-400 px-2 py-2 text-left font-semibold">
                Sok Kodu
              </th>
              <th className="border-r border-gray-400 px-2 py-2 text-left font-semibold">
                İsim
              </th>
              <th className="border-r border-gray-400 px-2 py-2 text-left font-semibold">
                Tamm
              </th>
              <th className="border-r border-gray-400 px-2 py-2 text-center font-semibold w-20">
                Lot
              </th>
              <th className="border-r border-gray-400 px-2 py-2 text-center font-semibold w-24">
                Reçete Miktar
              </th>
              <th className="border-r border-gray-400 px-2 py-2 text-center font-semibold w-16">
                Ç
              </th>
              <th className="border-r border-gray-400 px-2 py-2 text-center font-semibold w-24">
                Lot No
              </th>
              <th className="border-r border-gray-400 px-2 py-2 text-center font-semibold w-24">
                Melöz
              </th>
              <th className="px-2 py-2 text-center font-semibold w-16">Ç3</th>
            </tr>
          </thead>
          <tbody>
            {recipe.recipe_materials.map((material, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="border-r border-gray-300 px-2 py-2 font-mono text-xs">
                  {material.material.code}
                </td>
                <td className="border-r border-gray-300 px-2 py-2">
                  {material.material.name}
                </td>
                <td className="border-r border-gray-300 px-2 py-2 text-center">
                  {material.unit}
                </td>
                <td className="border-r border-gray-300 px-2 py-2"></td>
                <td className="border-r border-gray-300 px-2 py-2 text-right font-medium">
                  {material.quantity}
                </td>
                <td className="border-r border-gray-300 px-2 py-2"></td>
                <td className="border-r border-gray-300 px-2 py-2"></td>
                <td className="border-r border-gray-300 px-2 py-2"></td>
                <td className="px-2 py-2"></td>
              </tr>
            ))}
            {/* Empty rows for manual additions */}
            {[...Array(Math.max(0, 15 - recipe.recipe_materials.length))].map(
              (_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-2 py-2 h-8"></td>
                  <td className="border-r border-gray-300 px-2 py-2"></td>
                  <td className="border-r border-gray-300 px-2 py-2"></td>
                  <td className="border-r border-gray-300 px-2 py-2"></td>
                  <td className="border-r border-gray-300 px-2 py-2"></td>
                  <td className="border-r border-gray-300 px-2 py-2"></td>
                  <td className="border-r border-gray-300 px-2 py-2"></td>
                  <td className="border-r border-gray-300 px-2 py-2"></td>
                  <td className="px-2 py-2"></td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-between text-xs text-gray-600">
        <div>
          <p>Sayfa: 1/1</p>
        </div>
        <div className="text-right">
          <p>Barkod: {recipe.barcode}</p>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-12 grid grid-cols-3 gap-8 text-sm">
        <div className="text-center">
          <div className="border-t-2 border-gray-400 pt-2 mt-8">Hazırlayan</div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-400 pt-2 mt-8">
            Kontrol Eden
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-400 pt-2 mt-8">Onaylayan</div>
        </div>
      </div>
    </div>
  );
}
