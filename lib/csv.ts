// A CSV cell. A value starting with = + - @ (or a tab or return) would run as a formula in a spreadsheet, and names and notes come
// from public forms, so it gets a leading apostrophe. Quotes are doubled and line breaks become spaces.
export const csvCell = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/\n/g, " ").replace(/"/g, '""')}"`
}
export const toCsv = (columns: string[], rows: string[][]) => [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
