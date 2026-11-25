/** Quotes a cell and stops Excel from reading it as a formula. */
function cell(value: string | number): string {
  const text = String(value)
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

/** Semicolons and a BOM, so Excel in Portuguese opens it correctly. */
export function toCsv(rows: (string | number)[][]): string {
  return "﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n")
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const url = URL.createObjectURL(
    new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" })
  )
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
