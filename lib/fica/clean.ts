import { parseDate, REFERENCE_DATE } from "./dates.ts"
import type { Contact, DateStatus, Placement, RawContact } from "./types.ts"

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

/** Removes repeats, normalises dates and flags the ones that cannot be trusted. */
export function cleanContacts(rows: RawContact[]) {
  const unique = new Map<string, RawContact>()
  const removed: RawContact[] = []
  for (const row of rows)
    if (unique.has(row.id)) removed.push(row)
    else unique.set(row.id, row)

  const perDay = new Map<string, number>()
  const parsed = [...unique.values()].map((raw) => {
    const date = parseDate(raw.data)
    if (date) perDay.set(date, (perDay.get(date) ?? 0) + 1)
    return { raw, date }
  })

  const medianPerDay = median([...perDay.values()])
  const spikeDays = new Set(
    [...perDay].filter(([, n]) => n > 10 * medianPerDay).map(([day]) => day)
  )

  let converted = 0
  let ignoredResults = 0
  const contacts = parsed.map(({ raw, date }): Contact => {
    const wasConverted = date !== null && date !== raw.data
    if (wasConverted) converted++
    const reliable = date !== null && !spikeDays.has(date)
    const dateStatus: DateStatus = !reliable
      ? "unreliable"
      : wasConverted
        ? "converted"
        : "certain"
    // Empty results come as "" in the source, not as null.
    const result = raw.resultado_contacto || null
    const done = raw.estado === "realizado"
    if (result && !done) ignoredResults++
    return {
      raw,
      date: reliable ? date : null,
      dateStatus,
      result: done ? result : null,
      toConfirm:
        raw.estado === "agendado" && date !== null && date <= REFERENCE_DATE,
    }
  })

  return {
    contacts,
    perDay,
    spikeDays,
    medianPerDay,
    removed,
    converted,
    ignoredResults,
  }
}

export function isValidPlacement(placement: Placement): boolean {
  return !placement.data_fim || placement.data_fim >= placement.data_colocacao
}
