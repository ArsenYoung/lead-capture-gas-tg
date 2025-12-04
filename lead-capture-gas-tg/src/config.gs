/**
 * CONFIG: Stores bot tokens and project settings
 */

// Insert your Telegram bot token
const TELEGRAM_TOKEN = "YOURS_TELEGRAM_TOKEN";

// Chat ID where notifications will be delivered
const TELEGRAM_CHAT_ID = "YOURS_TELEGRAM_CHAT_ID";

// Your Google Sheet name
const SHEET_NAME = "Leads";

// Generates the Telegram Bot API URL
function getTelegramUrl() {
  return `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
}
