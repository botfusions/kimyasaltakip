"use client";

import { useState, useEffect } from "react";
import { sendTestEmail } from "../../../actions/test-email";
import { getSettingByKey } from "../../../actions/settings";

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [recipients, setRecipients] = useState("");

  useEffect(() => {
    const fetchRecipients = async () => {
      const { data } = await getSettingByKey("REPORT_RECEIVER_EMAILS");
      if (data) {
        setRecipients(data);
      } else {
        setRecipients("aziz.guc@goldstarteks.com"); // Fallback
      }
    };
    fetchRecipients();
  }, []);

  const handleSendTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await sendTestEmail();
      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Beklenmeyen hata: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📧 Email Sistemi Test</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Email Gönderimi Test</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Resend API entegrasyonunuzun çalışıp çalışmadığını test edin. Test
            email <strong>{recipients}</strong> adresine gönderilecek.
          </p>
        </div>

        <button
          onClick={handleSendTest}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? "Gönderiliyor..." : "🚀 Test Email Gönder"}
        </button>

        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success
                ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            <p className="font-medium">
              {result.success ? "✅ Başarılı!" : "❌ Hata"}
            </p>
            <p className="text-sm mt-1">{result.message}</p>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
          <h3 className="font-semibold text-sm mb-2">ℹ️ Geçerli Ayarlar</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <strong>API Key:</strong> re_imv7Z... (gizli)
            </p>
            <p>
              <strong>Gönderici:</strong> onboarding@resend.dev
            </p>
            <p>
              <strong>Alıcı:</strong> {recipients}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
