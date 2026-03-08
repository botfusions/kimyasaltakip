export async function sendTelegramAlert(message: string, error?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Silent fail if not configured (development or optional)
  if (!token || !chatId) {
    console.warn("Telegram keys missing, notification skipped.");
    return;
  }

  try {
    let text = `🚨 **REÇETE SİSTEMİ HATASI** 🚨\n\n${message}`;

    if (error) {
      text += `\n\n📌 **Detay:**\n\`${typeof error === "object" ? JSON.stringify(error, null, 2) : error}\``;
    }

    text += `\n\n🕒 ${new Date().toLocaleString("tr-TR")}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Failed to send Telegram alert:", err);
    // Do not throw, suppressing error to prevent app crash loop
  }
}
