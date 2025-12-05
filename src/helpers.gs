/**
 * Safely parses JSON text and returns a consistent result object.
 *
 * @param {string} value Raw JSON string.
 * @return {{success: boolean, data?: *, error?: string}}
 */
function safeJsonParse(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return { success: false, error: "Payload is empty or not a string." };
  }

  try {
    return { success: true, data: JSON.parse(value) };
  } catch (err) {
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
}

/**
 * Escapes HTML characters to keep <code>parse_mode=HTML</code> payloads valid.
 *
 * @param {string} text Raw text to escape.
 * @return {string}
 */
function escapeHtml(text) {
  if (text === undefined || text === null) {
    return "";
  }

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Converts any value into a well-formed string, falling back when the value
 * is missing or empty.
 *
 * @param {*} value Any value that should become a string.
 * @param {string} [fallback="N/A"] Fallback when the value is empty.
 * @return {string}
 */
function normalizeString(value, fallback) {
  const candidate = value === undefined || value === null ? "" : String(value).trim();
  const defaultValue = fallback === undefined ? "N/A" : fallback;
  return candidate === "" ? defaultValue : candidate;
}
