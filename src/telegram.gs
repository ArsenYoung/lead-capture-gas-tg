/**
 * Sends formatted messages to Telegram.
 */
function sendTelegramMessage(text) {
  const url = getTelegramUrl();

  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: "HTML"
  };

  const params = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, params);
  Logger.log("Telegram response: " + response.getContentText());
}
