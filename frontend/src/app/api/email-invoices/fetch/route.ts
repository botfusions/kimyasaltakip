import { NextResponse } from "next/server";
import { ImapFetcher } from "../../../../lib/email/imap-fetcher";
import { createAdminClient } from "../../../../lib/supabase/server";

/**
 * POST /api/email-invoices/fetch
 *
 * Triggers Gmail IMAP check for new invoice emails.
 * Can be called by:
 * - Cron job (external: cron-job.org, or Netlify scheduled function)
 * - Manual trigger from dashboard
 * - Webhook
 *
 * Security: Requires API secret or authenticated admin user
 */
export async function POST(request: Request) {
  try {
    // Security: Check API secret or admin auth
    const authHeader = request.headers.get("authorization");
    const cronSecret =
      process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Allow cron/webhook with secret
    if (authHeader === `Bearer ${cronSecret}`) {
      // Authorized via secret
    } else {
      // Check for authenticated admin user via cookie
      const { createClient } = await import("../../../../lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
      }

      // Check admin role
      const supabaseAdmin = createAdminClient();
      const { data: userData } = await supabaseAdmin
        .from("kts_users")
        .select("role")
        .eq("auth_id", user.id)
        .single();

      if (!userData || userData.role !== "admin") {
        return NextResponse.json(
          { error: "Sadece admin bu işlemi yapabilir" },
          { status: 403 },
        );
      }
    }

    // Initialize IMAP fetcher from settings
    const fetcher = await ImapFetcher.fromSettings();

    if (!fetcher) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gmail IMAP yapılandırması eksik veya devre dışı. Ayarlar sayfasından GMAIL_IMAP ayarlarını kontrol edin.",
        },
        { status: 400 },
      );
    }

    // Fetch new invoices
    const result = await fetcher.fetchNewInvoices();

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `✅ ${result.emailsFound} e-posta tarandı, ${result.invoicesCreated} fatura kaydedildi`
        : "❌ Fatura tarama sırasında hata oluştu",
      data: {
        emailsFound: result.emailsFound,
        attachmentsFound: result.attachmentsFound,
        invoicesCreated: result.invoicesCreated,
        durationMs: result.durationMs,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    console.error("Email fetch API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Beklenmeyen hata" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/email-invoices/fetch
 * Returns the status of email fetching (last fetch log)
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: logs, error } = await supabase
      .from("kts_email_fetch_log")
      .select("*")
      .order("fetched_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get IMAP enabled status
    const { data: setting } = await supabase
      .from("kts_settings")
      .select("value")
      .eq("key", "GMAIL_IMAP_ENABLED")
      .single();

    return NextResponse.json({
      enabled: setting?.value === "true",
      lastFetch: logs?.[0] || null,
      recentLogs: logs || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
