import { Suspense } from "react";
import MrlsCheckClient from "./MrlsCheckClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MRLS Uyumluluk Kontrolü | Kimyasal Takip",
  description:
    "Reçetelerin MRLS standartlarına uygunluğunu AI ile kontrol edin.",
};

export default function CompliancePage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          MRLS Uyumluluk Kontrolü 🛡️
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Marka/Müşteri MRLS listelerini (PDF) yükleyerek reçetelerinizin
          uygunluğunu yapay zeka ile denetleyin.
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center">Yükleniyor...</div>}>
        <MrlsCheckClient />
      </Suspense>
    </div>
  );
}
