import IntelligenceSettingsClient from "../../../../components/settings/IntelligenceSettingsClient";

export const metadata = {
  title: "İstihbarat Yönetimi | Kimyasal Takip Sistemi",
  description: "Canlı dış kaynak ve bilgi senkronizasyonu yönetimi.",
};

export default function IntelligenceSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bilgi Bankası (RAG) Kaynakları
        </h1>
        <p className="text-gray-500">
          AI Uzman Botu&apos;nun soruları cevaplarken kullandığı (RAG - Retrieval Augmented Generation) veri kaynaklarını yönetin.
        </p>
      </div>

      <IntelligenceSettingsClient />
    </div>
  );
}
