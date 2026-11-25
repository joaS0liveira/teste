const percentFormat = new Intl.NumberFormat("pt-PT", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const integerFormat = new Intl.NumberFormat("pt-PT", {
  maximumFractionDigits: 0,
  useGrouping: "always",
})
const euroFormat = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
})
const pointsFormat = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
})
const millionFormat = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const percent = (rate: number) => percentFormat.format(rate)
/** For sentences such as "23 in every 100 people". */
export const inHundred = (rate: number) => Math.round(rate * 100)
export const integer = (value: number) => integerFormat.format(value)
export const euros = (value: number) => euroFormat.format(value)
export const millionEuros = (value: number) =>
  `${millionFormat.format(value / 1_000_000)}\u00a0M€`
/** Difference between two rates, in percentage points. */
export const points = (difference: number) =>
  pointsFormat.format(difference * 100)
export const date = (iso: string) => iso.split("-").reverse().join("/")
