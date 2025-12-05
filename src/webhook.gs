/**
 * Receives external POST requests (webhook) and safely stores leads.
 */
function doPost(e) {
  const debugContext = buildDebugContext(e);
  Logger.log("Webhook triggered. Debug: " + JSON.stringify(debugContext));

  const payloadResult = safeParseWebhookPayload(e);
  if (!payloadResult.success) {
    Logger.log("Payload parsing error: " + payloadResult.error);
    return createErrorResponse("invalid_payload", payloadResult.error, debugContext);
  }

  const lead = normalizeLeadData(payloadResult.data);
  const sheetResult = getLeadSheet();
  if (!sheetResult.success) {
    Logger.log("Sheet access error: " + sheetResult.error);
    return createErrorResponse("sheet_error", sheetResult.error, debugContext);
  }

  const appendResult = appendLeadRow(sheetResult.sheet, lead);
  if (!appendResult.success) {
    Logger.log("Sheet append error: " + appendResult.error);
    return createErrorResponse("sheet_append_failed", appendResult.error, debugContext);
  }

  const telegramResult = sendTelegramMessage(buildTelegramText(lead));
  if (!telegramResult.success) {
    Logger.log("Telegram delivery warning: " + telegramResult.error);
  }

  return createSuccessResponse(lead, telegramResult);
}

/**
 * Builds debug payload for logging and error responses.
 */
function buildDebugContext(e) {
  const contents = e && e.postData ? e.postData.contents : null;
  const preview =
    typeof contents === "string" ? contents.substring(0, 1000) : null;

  return {
    timestamp: new Date().toISOString(),
    hasEvent: !!e,
    postDataType: e && e.postData ? e.postData.type : null,
    postDataLength: e && e.postData ? e.postData.length : null,
    contentsSample: preview
  };
}

/**
 * Validates incoming POST data and parses JSON safely.
 */
function safeParseWebhookPayload(e) {
  if (!e) {
    return { success: false, error: "Request event is missing." };
  }

  if (!e.postData) {
    return { success: false, error: "Request is missing postData." };
  }

  const contents = e.postData.contents;
  if (!contents) {
    return { success: false, error: "Request body is empty." };
  }

  const parseResult = safeJsonParse(contents);
  if (!parseResult.success) {
    return {
      success: false,
      error: "JSON parsing failed: " + parseResult.error
    };
  }

  if (parseResult.data === null || typeof parseResult.data !== "object") {
    return {
      success: false,
      error: "Parsed payload is not an object."
    };
  }

  return { success: true, data: parseResult.data };
}

/**
 * Normalizes submitted lead data to consistent strings.
 */
function normalizeLeadData(payload) {
  return {
    name: normalizeString(payload.name),
    email: normalizeString(payload.email),
    phone: normalizeString(payload.phone),
    company: normalizeString(payload.company),
    website: normalizeString(payload.website),
    service: normalizeString(payload.service),
    budget: normalizeString(payload.budget),
    source: normalizeString(payload.source, "Webflow"),
    message:
      payload && payload.message !== undefined && payload.message !== null
        ? String(payload.message).trim()
        : ""
  };
}

/**
 * Ensures the lead sheet exists before writing.
 */
function getLeadSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActive();
    if (!spreadsheet) {
      return { success: false, error: "Unable to open the active spreadsheet." };
    }

    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return {
        success: false,
        error: `Sheet "${SHEET_NAME}" was not found.`
      };
    }

    return { success: true, sheet: sheet };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Appends a normalized lead row and reports failures.
 */
function appendLeadRow(sheet, lead) {
  try {
    sheet.appendRow(buildLeadRow(lead));
    return { success: true };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Builds the row values that are written to the sheet.
 */
function buildLeadRow(lead) {
  const phoneValue = lead.phone === "N/A" ? lead.phone : "'" + lead.phone;
  return [
    new Date(),
    lead.name,
    lead.email,
    phoneValue,
    lead.company,
    lead.website,
    lead.service,
    lead.budget,
    lead.source,
    lead.message
  ];
}

/**
 * Creates the Telegram text payload using escaped values.
 */
function buildTelegramText(lead) {
  const rows = [
    "<b>📩 New Marketing Lead</b>",
    `<b>Name:</b> ${escapeHtml(lead.name)}`,
    `<b>Email:</b> ${escapeHtml(lead.email)}`,
    `<b>Phone:</b> ${escapeHtml(lead.phone)}`,
    `<b>Company:</b> ${escapeHtml(lead.company)}`,
    `<b>Website:</b> ${escapeHtml(lead.website)}`,
    `<b>Service:</b> ${escapeHtml(lead.service)}`,
    `<b>Budget:</b> ${escapeHtml(lead.budget)}`,
    `<b>Source:</b> ${escapeHtml(lead.source)}`
  ];

  if (lead.message) {
    rows.push(`<b>Message:</b> ${escapeHtml(lead.message)}`);
  }

  return rows.join("\n");
}

/**
 * Builds the JSON response returned to the caller on success.
 */
function createSuccessResponse(lead, telegramResult) {
  const telegramResponse = telegramResult
    ? {
        success: !!telegramResult.success,
        statusCode: telegramResult.statusCode,
        error: telegramResult.success ? null : telegramResult.error,
        body: telegramResult.body
      }
    : null;

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      lead: lead,
      telegram: telegramResponse,
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Builds the JSON error response returned to the caller.
 */
function createErrorResponse(code, message, debug) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "error",
      error_code: code,
      error: message,
      debug: debug
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
