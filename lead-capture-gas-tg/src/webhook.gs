/**
 * Receives external POST requests (webhook)
 * and stores incoming leads into Google Sheets.
 */
function doPost(e) {
  try {
    // Debug logs (Cloud Logs)
    Logger.log("RAW e: " + JSON.stringify(e));
    Logger.log("POST DATA: " + e.postData);
    Logger.log("CONTENTS: " + (e.postData && e.postData.contents));

    // Parse JSON body
    const data = JSON.parse(e.postData.contents);

    const name = data.name || "N/A";
    const email = data.email || "N/A";
    const phone = data.phone || "N/A";
    const company = data.company || "N/A";
    const website = data.website || "N/A";
    const service = data.service || "N/A";
    const budget = data.budget || "N/A";
    const source = data.source || "Webflow";
    const message = data.message || "";

    // Write to Google Sheets
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    sheet.appendRow([
      new Date(),
      name,
      email,
      "'" + phone,
      company,
      website,
      service,
      budget,
      source,
      message
    ]);

    // Build Telegram message text
    const tgText =
      "<b>📩 New Marketing Lead</b>\n\n" +
      `<b>Name:</b> ${name}\n` +
      `<b>Email:</b> ${email}\n` +
      `<b>Phone:</b> ${phone}\n` +
      `<b>Company:</b> ${company}\n` +
      `<b>Website:</b> ${website}\n` +
      `<b>Service:</b> ${service}\n` +
      `<b>Budget:</b> ${budget}\n` +
      `<b>Source:</b> ${source}\n` +
      (message ? `<b>Message:</b> ${message}` : "");

    // Telegram API call
    const tgResponse = UrlFetchApp.fetch(getTelegramUrl(), {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: tgText,
        parse_mode: "HTML"
      }),
      muteHttpExceptions: true
    }).getContentText();

    // Return success + raw Telegram response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        telegram_raw_response: tgResponse
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("ERROR: " + err);

    // Return debug info on failure
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        error: String(err),
        debug: {
          raw: e,
          postData: e.postData,
          contents: e.postData && e.postData.contents
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
