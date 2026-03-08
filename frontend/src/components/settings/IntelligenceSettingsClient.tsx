"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import {
  getIntelligenceSources,
  addIntelligenceSource,
  deleteIntelligenceSource,
  toggleSourceStatus,
} from "../../app/actions/intelligence";
import {
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  BrainCircuit,
  Loader2,
} from "lucide-react";

interface IntelligenceSource {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  last_synced_at: string | null;
}

export default function IntelligenceSettingsClient() {
  const [sources, setSources] = useState<IntelligenceSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("general");

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setIsLoading(true);
    const result = await getIntelligenceSources();
    if (result.data) setSources(result.data);
    setIsLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    setIsSaving(true);
    const result = await addIntelligenceSource({
      name: newName,
      url: newUrl,
      category: newCategory,
    });

    if (!result.error) {
      setNewName("");
      setNewUrl("");
      setShowAddForm(false);
      loadSources();
    } else {
      alert("Hata: " + result.error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaynağı silmek istediğinize emin misiniz?")) return;
    const result = await deleteIntelligenceSource(id);
    if (!result.error) loadSources();
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const result = await toggleSourceStatus(id, currentStatus);
    if (!result.error) loadSources();
  };

  const handleSyncManual = (id: string) => {
    setIsSyncing(id);
    // Gelecekte Python scriptini tetikleyecek olan kısım
    setTimeout(() => {
      alert("Crawl4AI Botu başlatıldı. Tarama arka planda devam edecek.");
      setIsSyncing(null);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-600" />
            AI Bilgi Bankası (RAG) Kaynakları
          </h3>
          <p className="text-sm text-gray-500">
            AI Uzman Botu&apos;nun öğrenme ve yanıtlama sürecinde (RAG) kullanılacak web kaynaklarını yönetin.
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "ghost" : "primary"}
          size="sm"
        >
          {showAddForm ? (
            "Vazgeç"
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" /> Yeni Kaynak Ekle
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Kaynak Adı
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Örn: OEKO-TEX Standard 100"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                URL (Crawl edilecek adres)
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://example.com/standards"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Kategori
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-blue-200 outline-none"
              >
                <option value="standards">Standartlar & Regülasyonlar</option>
                <option value="chemicals">Kimyasal Veritabanları</option>
                <option value="general">Genel Sektör Bilgisi</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Bilgi Bankasına Ekle ve Taramayı Başlat"
                )}
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 font-semibold">Kaynak & URL</th>
              <th className="px-6 py-4 font-semibold">Durum</th>
              <th className="px-6 py-4 font-semibold">Son Senkronizasyon</th>
              <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sources.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500 italic"
                >
                  Henüz bir dış kaynak eklenmemiş.
                </td>
              </tr>
            ) : (
              sources.map((source) => (
                <tr
                  key={source.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${source.is_active ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}
                      >
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {source.name}
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                          {source.url.substring(0, 40)}...{" "}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(source.id, source.is_active)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        source.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}
                    >
                      {source.is_active ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {source.is_active ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {source.last_synced_at
                      ? new Date(source.last_synced_at).toLocaleString("tr-TR")
                      : "Hiç taranmadı"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncManual(source.id)}
                      disabled={!source.is_active || isSyncing === source.id}
                      className="text-blue-600"
                    >
                      {isSyncing === source.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(source.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl flex gap-3">
        <BrainCircuit className="w-5 h-5 text-yellow-600 shrink-0" />
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>RAG (Bilgi Bankası) Notu:</strong> Eklediğiniz URL&apos;ler Crawl4AI ile taranır, Markdown formatına
          dönüştürülür ve Supabase Vector (pgvector) veritabanına kaydedilir. AI Uzman Botu bu
          verileri sorularınızı yanıtlarken &quot;Uzun Süreli Hafıza&quot; olarak kullanır.
        </p>
      </div>
    </div>
  );
}
