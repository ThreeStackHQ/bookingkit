/**
 * SEC-008: HTML/ICS content escaping.
 * Prevents XSS via calendar invitee data embedded in .ics content.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "\\": "&#x5C;",
};

const HTML_ESCAPE_RE = /[&<>"'/\\]/g;

export function escapeHtml(str: string): string {
  return str.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Escape special characters in iCalendar (RFC 5545) text values.
 * Backslash, semicolon, comma, and newlines must be escaped.
 */
export function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
