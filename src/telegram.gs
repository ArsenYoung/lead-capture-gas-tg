/**
 * Sends formatted messages to Telegram and reports validation and API outcomes.
 *
 * @param {string} text Message prepared with HTML tags.
 * @return {{success:boolean, statusCode?:number, error?:string, body?:string, parsed?:*}}
 */
function sendTelegramMessage(text) {
  const validation = validateTelegramConfig();
  if (!validation.success) {
    Logger.log("Telegram config error: " + validation.error);
    return validation;
  }

  const url = getTelegramUrl();
  const chatId =
    TELEGRAM_CHAT_ID === undefined || TELEGRAM_CHAT_ID === null
      ? ""
      : String(TELEGRAM_CHAT_ID);
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };

  const params = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, params);
    const statusCode =
      typeof response.getResponseCode === "function"
        ? response.getResponseCode()
        : null;
    const body = response.getContentText();
    Logger.log("Telegram HTTP " + statusCode + " response: " + body);

    const parsed = safeJsonParse(body);
    const telegramOk =
      parsed.success && parsed.data && parsed.data.ok === true;

    if (statusCode && (statusCode < 200 || statusCode >= 300)) {
      const errorMessage = `Telegram API returned status code ${statusCode}`;
      return {
        success: false,
        statusCode: statusCode,
        error: errorMessage,
        body,
        parsed: parsed.success ? parsed.data : undefined
      };
    }

    if (!telegramOk) {
      const description =
        parsed.success && parsed.data && parsed.data.description
          ? parsed.data.description
          : "Telegram API reported an error";
      return {
        success: false,
        statusCode: statusCode,
        error: description,
        body,
        parsed: parsed.success ? parsed.data : undefined
      };
    }

    return {
      success: true,
      statusCode: statusCode,
      body,
      parsed: parsed.success ? parsed.data : undefined
    };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    Logger.log("Telegram fetch failed: " + message);
    return { success: false, error: message };
  }
}

/**
 * Validates that the Telegram integration tokens are configured.
 *
 * @return {{success:boolean,error?:string}}
 */
function validateTelegramConfig() {
  const token = TELEGRAM_TOKEN ? String(TELEGRAM_TOKEN) : "";
  if (!token || token.includes("YOURS")) {
    return { success: false, error: "Telegram token is not configured." };
  }

  const chatId =
    TELEGRAM_CHAT_ID === undefined || TELEGRAM_CHAT_ID === null
      ? ""
      : String(TELEGRAM_CHAT_ID);
  if (!chatId || chatId.includes("YOURS")) {
    return { success: false, error: "Telegram chat ID is not configured." };
  }

  return { success: true };
}
