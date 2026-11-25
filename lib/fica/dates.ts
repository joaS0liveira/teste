/** The data ends here. Days are counted up to this date, never up to today. */
export const REFERENCE_DATE = "2025-12-31"

const DAY_MS = 86_400_000

/** Accepts yyyy-mm-dd and dd/mm/yyyy (always day first). Null if not a real date. */
export function parseDate(value: string | null): string | null {
  const slash = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const iso = slash ? `${slash[3]}-${slash[2]}-${slash[1]}` : value
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const time = Date.parse(iso)
  const real =
    !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === iso
  return real ? iso : null
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS)
}
