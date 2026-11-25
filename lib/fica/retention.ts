import { isValidPlacement } from "./clean.ts"
import { daysBetween, REFERENCE_DATE } from "./dates.ts"
import { duration } from "./metrics.ts"
import type { ContractType, Participant, Placement } from "./types.ts"

/** 3, 6 and 12 months. */
export const HORIZONS = [90, 180, 365] as const
export type HorizonDays = (typeof HORIZONS)[number]

/** Groups smaller than this are flagged and never ranked. */
export const SMALL_GROUP = 20

export type Job = {
  id: string
  companyId: string
  entityId: string
  contract: ContractType
  start: string
  ended: boolean
  reason: string | null
  /** Days in the job, until it ended or until the reference date. */
  days: number
  /** Days between the start and the reference date. */
  observed: number
}

export function toObservedJobs(
  participants: Participant[],
  placements: Placement[]
): Job[] {
  const entityOf = new Map(
    participants.map((p) => [p.id, p.entidade_social_id])
  )
  return placements.filter(isValidPlacement).map((p) => ({
    id: p.id,
    companyId: p.id_empresa,
    entityId: entityOf.get(p.id_participante) ?? "",
    contract: p.tipo_contrato,
    start: p.data_colocacao,
    ended: p.data_fim !== null,
    reason: p.motivo_saida || null,
    days: duration(p),
    observed: daysBetween(p.data_colocacao, REFERENCE_DATE),
  }))
}

export type Filters = {
  /** "2024-1" is the first half of 2024. */
  period: string
  contract: string
  entity: string
  company: string
  /** Smallest observation time, in days. */
  observation: string
}

export const NO_FILTERS: Filters = {
  period: "all",
  contract: "all",
  entity: "all",
  company: "all",
  observation: "all",
}

export const halfYear = (iso: string) =>
  `${iso.slice(0, 4)}-${Number(iso.slice(5, 7)) <= 6 ? 1 : 2}`

export function applyFilters(jobs: Job[], f: Filters): Job[] {
  return jobs.filter(
    (j) =>
      (f.period === "all" || halfYear(j.start) === f.period) &&
      (f.contract === "all" || j.contract === f.contract) &&
      (f.entity === "all" || j.entityId === f.entity) &&
      (f.company === "all" || j.companyId === f.company) &&
      (f.observation === "all" || j.observed >= Number(f.observation))
  )
}

export type Rate = {
  /** Jobs observed long enough to answer. */
  eligible: number
  stayed: number
  rate: number
  low: number
  high: number
}

/** 95% Wilson interval. */
export function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [0, 0]
  const z = 1.96
  const p = k / n
  const denominator = 1 + (z * z) / n
  const center = p + (z * z) / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return [
    Math.max(0, (center - margin) / denominator),
    Math.min(1, (center + margin) / denominator),
  ]
}

/**
 * Share still in the job after some days, among the jobs that started at least
 * that many days before the reference date. A job seen for two months counts
 * neither as a stay nor as an exit at six.
 */
export function retentionAt(jobs: Job[], days: number): Rate {
  const eligible = jobs.filter((j) => j.observed >= days)
  const stayed = eligible.filter((j) => !j.ended || j.days >= days).length
  const [low, high] = wilson(stayed, eligible.length)
  return {
    eligible: eligible.length,
    stayed,
    rate: eligible.length ? stayed / eligible.length : 0,
    low,
    high,
  }
}

export type KmPoint = { day: number; rate: number; low: number; high: number }

/** Kaplan-Meier with a 95% band (Greenwood, log-log). */
export function kaplanMeier(jobs: Job[], lastDay = 365) {
  const leaving = new Map<number, { ended: number; censored: number }>()
  for (const job of jobs) {
    const entry = leaving.get(job.days) ?? { ended: 0, censored: 0 }
    if (job.ended) entry.ended++
    else entry.censored++
    leaving.set(job.days, entry)
  }
  let atRisk = jobs.length
  let rate = 1
  let variance = 0
  const steps: KmPoint[] = [{ day: 0, rate: 1, low: 1, high: 1 }]
  const marks: { day: number; rate: number }[] = []
  for (const [day, { ended, censored }] of [...leaving].sort(
    (a, b) => a[0] - b[0]
  )) {
    if (ended) {
      rate *= 1 - ended / atRisk
      if (atRisk > ended) variance += ended / (atRisk * (atRisk - ended))
      let low = 0
      let high = 0
      if (rate > 0 && rate < 1) {
        const spread = (1.96 * Math.sqrt(variance)) / Math.abs(Math.log(rate))
        low = rate ** Math.exp(spread)
        high = rate ** Math.exp(-spread)
      }
      steps.push({ day, rate, low, high })
    }
    if (censored) marks.push({ day, rate })
    atRisk -= ended + censored
  }
  const at = (day: number) => steps.findLast((s) => s.day <= day) ?? steps[0]
  return {
    /** One point per day, up to the last day anyone was still observed. */
    curve: Array.from(
      {
        length: Math.min(lastDay, Math.max(0, ...jobs.map((j) => j.days))) + 1,
      },
      (_, day) => ({ ...at(day), day })
    ),
    at,
    median: steps.find((s) => s.rate <= 0.5)?.day ?? null,
    censored: jobs.filter((j) => !j.ended).length,
    marks: marks.filter((m) => m.day <= lastDay),
  }
}

/** Mean days in the job within the first year: the area under the curve. */
export function restrictedMean(jobs: Job[], limit = 365): number | null {
  const { curve } = kaplanMeier(jobs, limit)
  if (curve.length <= limit) return null
  return curve.slice(0, limit).reduce((sum, point) => sum + point.rate, 0)
}

/** First day with at least 5% of exits estimated. */
export const exitsStart = (jobs: Job[]): number | null =>
  kaplanMeier(jobs, 730).curve.find((p) => p.rate <= 0.95)?.day ?? null

/** Who is still followed at each day, and why the others are not. */
export const riskTable = (jobs: Job[], days: number[]) =>
  days.map((day) => ({
    day,
    atRisk: jobs.filter((j) => j.days >= day).length,
    ended: jobs.filter((j) => j.ended && j.days < day).length,
    censored: jobs.filter((j) => !j.ended && j.days < day).length,
  }))

/** One line of the tables of entities and companies. */
export function groupSummary(jobs: Job[]) {
  const [three, six, twelve] = HORIZONS.map((d) => retentionAt(jobs, d))
  return {
    jobs: jobs.length,
    temporaryRate: jobs.length
      ? jobs.filter((j) => j.contract === "temporario").length / jobs.length
      : 0,
    exits: jobs.filter((j) => j.ended).length,
    exitMedian: exitMedian(jobs),
    three,
    six,
    twelve,
  }
}

/** Exits by month of job (30 days), and the busiest month. */
export function exitsByMonth(jobs: Job[], months = 12) {
  const counts = Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    exits: 0,
  }))
  for (const job of jobs)
    if (job.ended) {
      const index = Math.floor(job.days / 30)
      if (index < months) counts[index].exits++
    }
  const busiest = counts.reduce((a, b) => (b.exits > a.exits ? b : a))
  return { counts, busiest: busiest.exits > 0 ? busiest : null }
}

export const exitMedian = (jobs: Job[]): number | null => {
  const days = jobs
    .filter((j) => j.ended)
    .map((j) => j.days)
    .sort((a, b) => a - b)
  if (days.length === 0) return null
  const middle = Math.floor(days.length / 2)
  return days.length % 2 ? days[middle] : (days[middle - 1] + days[middle]) / 2
}

/**
 * Where each person stands. The files hold one placement per person, so a move
 * to another company is declared but never seen.
 */
export function continuity(jobs: Job[]) {
  const ended = jobs.filter((j) => j.ended)
  return {
    same: jobs.filter((j) => !j.ended && j.observed >= 180).length,
    recent: jobs.filter((j) => !j.ended && j.observed < 180).length,
    moved: ended.filter((j) => j.reason === "mudanca_emprego").length,
    left: ended.filter((j) => j.reason && j.reason !== "mudanca_emprego")
      .length,
    unknown: ended.filter((j) => !j.reason).length,
  }
}

/** Placements by month of start. */
export function timeline(jobs: Job[]) {
  const months = new Map<string, number>()
  for (const job of jobs) {
    const month = job.start.slice(0, 7)
    months.set(month, (months.get(month) ?? 0) + 1)
  }
  return [...months]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, placements]) => ({ month, placements }))
}
