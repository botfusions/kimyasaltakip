"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  FileText,
  Download,
  Eye,
  XCircle,
  ArrowRight,
  MailCheck,
  MailX,
  Loader2,
} from "lucide-react";
import {
  getIncomingInvoices,
  getIncomingInvoiceStats,
  processIncomingInvoice,
  importIncomingInvoice,
  updateIncomingInvoiceStatus,
  triggerEmailFetch,
  getEmailFetchLogs,
} from "../../../actions/incoming-invoices";

interface IncomingInvoice {
  id: string;
  email_uid: string;
  email_from: string;
  email_subject: string;
  email_date: string;
  attachment_filename: string;
  attachment_type: string;
  attachment_size: number;
  invoice_number: string | null;
  supplier_name: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  currency: string;
  line_count: number;
  status: string;
  matched_count: number;
  unmatched_count: number;
  import_notes: string | null;
  error_message: string | null;
  created_at: string;
  imported_at: string | null;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "Bekliyor",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  processing: {
    label: "İşleniyor",
    color: "bg-blue-100 text-blue-800",
    icon: RefreshCw,
  },
  matched: {
    label: "Eşleşti",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  imported: {
    label: "İçe Aktarıldı",
    color: "bg-emerald-100 text-emerald-800",
    icon: Package,
  },
  error: {
    label: "Hata",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
  ignored: {
    label: "Yok Sayıldı",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
  },
};

export default function IncomingInvoicesPage() {
  const [invoices, setInvoices] = useState<IncomingInvoice[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchResult, setFetchResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedInvoice, setSelectedInvoice] =
    useState<IncomingInvoice | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [invoicesRes, statsRes, logsRes] = await Promise.all([
        getIncomingInvoices({ status: filter }),
        getIncomingInvoiceStats(),
        getEmailFetchLogs(5),
      ]);

      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (statsRes.data) setStats(statsRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFetchEmails() {
    setFetchResult(null);
    startTransition(async () => {
      const result = await triggerEmailFetch();
      setFetchResult(result.message || result.error || "Tamamlandı");
      loadData();
    });
  }

  async function handleProcess(id: string) {
    startTransition(async () => {
      const result = await processIncomingInvoice(id);
      if (result.success) {
        setFetchResult(
          `✅ ${result.matchedCount} eşleşme, ${result.unmatchedCount} eşleşmeme`,
        );
      } else {
        setFetchResult(`❌ ${result.error}`);
      }
      loadData();
    });
  }

  async function handleImport(id: string) {
    if (
      !confirm(
        "Bu faturayı stok girişi olarak içe aktarmak istediğinize emin misiniz?",
      )
    )
      return;

    startTransition(async () => {
      const result = await importIncomingInvoice(id);
      if (result.success) {
        setFetchResult(`✅ ${result.message}`);
      } else {
        setFetchResult(`❌ ${result.error}`);
      }
      loadData();
    });
  }

  async function handleIgnore(id: string) {
    startTransition(async () => {
      await updateIncomingInvoiceStatus(
        id,
        "ignored",
        "Manuel olarak yok sayıldı",
      );
      loadData();
    });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatCurrency(amount: number | null, currency = "TRY") {
    if (amount === null) return "-";
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Gelen E-Faturalar
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Tedarikçilerden e-posta ile gelen faturaları otomatik al ve işle
          </p>
        </div>

        <button
          onClick={handleFetchEmails}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          E-postaları Kontrol Et
        </button>
      </div>

      {/* Result notification */}
      {fetchResult && (
        <div
          className={`p-3 rounded-lg text-sm ${fetchResult.startsWith("✅") ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" : fetchResult.startsWith("❌") ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300" : "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"}`}
        >
          {fetchResult}
          <button
            onClick={() => setFetchResult(null)}
            className="ml-2 text-xs underline"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            {
              key: "total",
              label: "Toplam",
              icon: FileText,
              color: "text-gray-600",
            },
            {
              key: "pending",
              label: "Bekleyen",
              icon: Clock,
              color: "text-yellow-600",
            },
            {
              key: "matched",
              label: "Eşleşen",
              icon: CheckCircle2,
              color: "text-green-600",
            },
            {
              key: "imported",
              label: "İçe Aktarılan",
              icon: Package,
              color: "text-emerald-600",
            },
            {
              key: "error",
              label: "Hatalı",
              icon: AlertTriangle,
              color: "text-red-600",
            },
            {
              key: "ignored",
              label: "Yok Sayılan",
              icon: XCircle,
              color: "text-gray-400",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">{stats[item.key] || 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {[
          { value: "all", label: "Tümü" },
          { value: "pending", label: "Bekleyen" },
          { value: "matched", label: "Eşleşen" },
          { value: "imported", label: "İçe Aktarılan" },
          { value: "error", label: "Hatalı" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === tab.value
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <MailX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Henüz gelen fatura yok
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Gmail IMAP ayarlarını yapılandırıp &quot;E-postaları Kontrol
            Et&quot; butonuna tıklayın
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const config = statusConfig[invoice.status] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div
                key={invoice.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                      {invoice.invoice_number && (
                        <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                          #{invoice.invoice_number}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDate(invoice.email_date)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Gönderen: </span>
                        <span className="text-gray-900 dark:text-white">
                          {invoice.email_from || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tedarikçi: </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {invoice.supplier_name || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tutar: </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(
                            invoice.total_amount,
                            invoice.currency,
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Attachment info */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {invoice.attachment_filename}
                      </span>
                      <span>{invoice.attachment_type.toUpperCase()}</span>
                      <span>
                        {formatFileSize(invoice.attachment_size || 0)}
                      </span>
                      {invoice.line_count > 0 && (
                        <span>{invoice.line_count} satır</span>
                      )}
                      {invoice.matched_count > 0 && (
                        <span className="text-green-500">
                          ✅ {invoice.matched_count} eşleşme
                        </span>
                      )}
                      {invoice.unmatched_count > 0 && (
                        <span className="text-red-500">
                          ⚠️ {invoice.unmatched_count} eşleşmeme
                        </span>
                      )}
                    </div>

                    {/* Error/Notes */}
                    {invoice.error_message && (
                      <p className="text-xs text-red-500 mt-1">
                        {invoice.error_message}
                      </p>
                    )}
                    {invoice.import_notes && (
                      <p className="text-xs text-green-600 mt-1">
                        {invoice.import_notes}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 ml-4">
                    {(invoice.status === "pending" ||
                      invoice.status === "error") && (
                      <button
                        onClick={() => handleProcess(invoice.id)}
                        disabled={isPending}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="İşle ve Eşleştir"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    {invoice.status === "matched" && (
                      <button
                        onClick={() => handleImport(invoice.id)}
                        disabled={isPending}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Stok Girişi Yap"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    {invoice.status !== "imported" &&
                      invoice.status !== "ignored" && (
                        <button
                          onClick={() => handleIgnore(invoice.id)}
                          disabled={isPending}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Yok Say"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Fetch Logs */}
      {logs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Son E-posta Kontrolleri
          </h3>
          <div className="space-y-2">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800/50 rounded p-2"
              >
                <div className="flex items-center gap-3">
                  {log.status === "success" ? (
                    <MailCheck className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <MailX className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className="text-gray-500">
                    {formatDate(log.fetched_at)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <span>{log.emails_found} e-posta</span>
                  <span>{log.attachments_found} ek</span>
                  <span>{log.invoices_created} fatura</span>
                  <span>{log.duration_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
