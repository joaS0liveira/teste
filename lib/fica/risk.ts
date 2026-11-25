import { isValidPlacement } from "./clean.ts"
import { daysBetween, REFERENCE_DATE } from "./dates.ts"
import type { ContractType, Participant, Placement } from "./types.ts"

/** How far ahead the radar looks. */
export const HORIZON = 30
const BAND = 15
/** Pulls small groups towards the average of all entities. */
const PRIOR = 10

type Job = {
  id: string
  participantId: string
  companyId: string
  entityId: string
  region: string
  contract: ContractType
  start: string
  end: string | null
}

export type ActiveJob = Job & { days: number; risk: number }

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

export function toJobs(
  participants: Participant[],
  placements: Placement[]
): Job[] {
  const person = new Map(participants.map((p) => [p.id, p]))
  return placements.filter(isValidPlacement).map((p) => ({
    id: p.id,
    participantId: p.id_participante,
    companyId: p.id_empresa,
    entityId: person.get(p.id_participante)?.entidade_social_id ?? "",
    region: person.get(p.id_participante)?.regiao ?? "",
    contract: p.tipo_contrato,
    start: p.data_colocacao,
    end: p.data_fim,
  }))
}

/**
 * Share of jobs of a given age that ended in the next 30 days, by entity and
 * contract. Uses only what was known on `today`, and never the person's profile.
 */
function learn(jobs: Job[], today: string) {
  const byEntity = new Map<string, [left: number, seen: number]>()
  const overall = new Map<string, [left: number, seen: number]>()
  const add = (
    map: Map<string, [number, number]>,
    key: string,
    left: boolean
  ) => {
    const entry = map.get(key) ?? [0, 0]
    entry[1]++
    if (left) entry[0]++
    map.set(key, entry)
  }
  for (const job of jobs) {
    if (job.start > today) continue
    const end = job.end && job.end <= today ? job.end : null
    const lasted = daysBetween(job.start, end ?? today)
    const observed = daysBetween(job.start, today)
    for (let band = 0; ; band++) {
      const age = band * BAND + Math.floor(BAND / 2)
      if (age > lasted || observed < age + HORIZON) break
      const left = end !== null && lasted < age + HORIZON
      add(byEntity, `${job.entityId} ${job.contract} ${band}`, left)
      add(overall, `${job.contract} ${band}`, left)
    }
  }
  return (job: Job, age: number) => {
    const band = Math.floor(age / BAND)
    const [left, seen] = byEntity.get(
      `${job.entityId} ${job.contract} ${band}`
    ) ?? [0, 0]
    const [allLeft, allSeen] = overall.get(`${job.contract} ${band}`) ?? [0, 0]
    const usual = allSeen ? allLeft / allSeen : 0
    return (left + PRIOR * usual) / (seen + PRIOR)
  }
}

/** Jobs running on `today` with their risk for the next 30 days, highest first. */
export function activeJobs(jobs: Job[], today = REFERENCE_DATE): ActiveJob[] {
  const riskOf = learn(jobs, today)
  return jobs
    .filter((job) => job.start <= today && (!job.end || job.end > today))
    .map((job) => {
      const days = daysBetween(job.start, today)
      return { ...job, days, risk: riskOf(job, days) }
    })
    .sort((a, b) => b.risk - a.risk)
}

export const expectedExits = (jobs: ActiveJob[]) =>
  jobs.reduce((sum, job) => sum + job.risk, 0)

/** Replays 2025 month by month with only what was known at the time. */
export function backtest(jobs: Job[], calls = 100) {
  const total = { expected: 0, actual: 0, reached: 0, random: 0 }
  for (let month = 1; month <= 12; month++) {
    const today = `2025-${String(month).padStart(2, "0")}-01`
    const limit = addDays(today, HORIZON)
    const active = activeJobs(jobs, today)
    const left = (job: ActiveJob) => job.end !== null && job.end <= limit
    const actual = active.filter(left).length
    total.expected += expectedExits(active)
    total.actual += actual
    total.reached += active.slice(0, calls).filter(left).length
    total.random += (actual * Math.min(calls, active.length)) / active.length
  }
  return total
}
