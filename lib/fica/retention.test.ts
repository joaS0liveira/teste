import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { cleanContacts } from "./clean.ts"
import { parseDate } from "./dates.ts"
import {
  contactSummary,
  documentSupport,
  firstContact,
  placementByTraining,
  planStates,
  trainingByBarrier,
} from "./programme.ts"
import {
  applyFilters,
  continuity,
  exitMedian,
  exitsByMonth,
  kaplanMeier,
  NO_FILTERS,
  retentionAt,
  toObservedJobs,
  wilson,
  type Job,
  exitsStart,
  groupSummary,
  restrictedMean,
  riskTable,
} from "./retention.ts"
import type * as T from "./types.ts"

const load = <Row>(name: string): Row[] =>
  JSON.parse(
    readFileSync(
      new URL(`../../public/data/${name}.json`, import.meta.url),
      "utf8"
    )
  )
const participants = load<T.Participant>("participantes")
const placements = load<T.Placement>("colocacoes")
const actions = load<T.TrainingAction>("acoes_formacao")
const plans = load<T.ActionPlan>("planos_acao")
const jobs = toObservedJobs(participants, placements)
const pct = (n: number) => (n * 100).toFixed(1)
const at = (rows: typeof jobs, days: number) => {
  const r = retentionAt(rows, days)
  return [r.eligible, r.stayed, pct(r.rate), pct(r.low), pct(r.high)]
}

test("reconciliation: one placement per person, 2 461 of which 2 415 are valid", () => {
  assert.equal(placements.length, 2_461)
  assert.equal(
    new Set(placements.map((p) => p.id_participante)).size,
    placements.length
  )
  assert.equal(jobs.length, 2_415)
  assert.equal(participants.length - jobs.length, 2_085)
})

test("retention at 3, 6 and 12 months, with who could be observed", () => {
  assert.deepEqual(at(jobs, 90), [2_061, 1_947, "94.5", "93.4", "95.4"])
  assert.deepEqual(at(jobs, 180), [1_704, 1_101, "64.6", "62.3", "66.8"])
  assert.deepEqual(at(jobs, 365), [862, 371, "43.0", "39.8", "46.4"])
})

test("retention by contract", () => {
  const permanent = applyFilters(jobs, {
    ...NO_FILTERS,
    contract: "permanente",
  })
  const temporary = applyFilters(jobs, {
    ...NO_FILTERS,
    contract: "temporario",
  })
  assert.deepEqual(at(permanent, 180).slice(0, 3), [781, 752, "96.3"])
  assert.deepEqual(at(permanent, 365).slice(0, 3), [384, 371, "96.6"])
  assert.deepEqual(at(temporary, 180).slice(0, 3), [923, 349, "37.8"])
  assert.deepEqual(at(temporary, 365).slice(0, 3), [478, 0, "0.0"])
})

test("E03 and E07: what 436 and 161 placements mean", () => {
  const of = (entity: string) => applyFilters(jobs, { ...NO_FILTERS, entity })
  assert.deepEqual(at(of("E03"), 180).slice(0, 3), [436, 111, "25.5"])
  assert.deepEqual(at(of("E07"), 180).slice(0, 3), [161, 153, "95.0"])
  assert.equal(of("E03").length, 610)
  assert.equal(of("E07").length, 215)
})

test("filters combine and clear", () => {
  const some = applyFilters(jobs, {
    period: "2025-1",
    contract: "temporario",
    entity: "E03",
    company: "P08",
    observation: "180",
  })
  assert.ok(some.length > 0 && some.length < 20)
  assert.ok(
    some.every(
      (j) =>
        j.start >= "2025-01-01" &&
        j.start <= "2025-06-30" &&
        j.contract === "temporario" &&
        j.entityId === "E03" &&
        j.companyId === "P08" &&
        j.observed >= 180
    )
  )
  assert.equal(applyFilters(jobs, NO_FILTERS).length, jobs.length)
})

test("Kaplan-Meier: matches the reference, and the band contains the curve", () => {
  const km = kaplanMeier(jobs)
  assert.equal(km.median, 235)
  assert.equal(km.censored, 1_371)
  assert.ok(
    km.curve.every(
      (p) => p.rate === 1 || (p.low <= p.rate + 1e-9 && p.high >= p.rate - 1e-9)
    )
  )
  const e03 = kaplanMeier(applyFilters(jobs, { ...NO_FILTERS, entity: "E03" }))
  assert.equal(pct(e03.at(180).rate), "24.3")
  assert.deepEqual(kaplanMeier([]).curve.length, 1)
})

test("exits: the fourth month is the busiest", () => {
  const { counts, busiest } = exitsByMonth(jobs)
  assert.deepEqual(
    counts.slice(0, 8).map((c) => c.exits),
    [0, 0, 118, 202, 172, 178, 154, 93]
  )
  assert.equal(busiest?.month, 4)
  assert.equal(exitMedian(jobs), 154.5)
})

test("continuity adds up to every valid placement", () => {
  const c = continuity(jobs)
  assert.deepEqual(c, {
    same: 727,
    recent: 644,
    moved: 158,
    left: 722,
    unknown: 164,
  })
  assert.equal(
    Object.values(c).reduce((a, b) => a + b, 0),
    jobs.length
  )
})

test("Wilson interval stays between 0 and 1", () => {
  assert.deepEqual(wilson(0, 0), [0, 0])
  assert.equal(wilson(0, 50)[0], 0)
  assert.equal(wilson(50, 50)[1], 1)
})

test("plans and contacts", () => {
  assert.deepEqual(planStates(plans), {
    actions: 417,
    people: 383,
    done: 131,
    ongoing: 132,
    suspended: 154,
  })
  assert.deepEqual(documentSupport(participants, plans), {
    people: 912,
    helped: 12,
  })
  const cleaned = cleanContacts(load<T.RawContact>("acompanhamentos"))
  const s = contactSummary(participants, cleaned)
  assert.deepEqual(
    [s.distinct, s.duplicates, s.done, s.notDone, s.scheduled, s.usefulNotDone],
    [25_430, 539, 15_311, 5_028, 5_091, 1_531]
  )
  // 225 is what is left when 5 209 dates are ignored; the right number is 84.
  assert.equal(s.withoutContact, 84)
  assert.equal(s.withoutContactIsoOnly, 225)
  const f = firstContact(participants, cleaned, parseDate)
  assert.deepEqual([f.median, f.people, f.unreliable], [154, 4_416, 1_092])
})

test("training and barriers cover everyone", () => {
  const byBarrier = trainingByBarrier(participants, placements, actions)
  assert.deepEqual(
    byBarrier.map((b) => b.people),
    [920, 912, 895, 888, 885]
  )
  const states = placementByTraining(participants, placements, actions)
  assert.equal(
    states.reduce((n, s) => n + s.people, 0),
    4_500
  )
})

test("restricted mean, start of exits and people at risk", () => {
  const job = (days: number, ended: boolean) =>
    ({ days, ended, observed: 400, contract: "temporario" }) as Job
  const two = [job(100, true), job(400, false)]
  // One leaves at day 100 and the other stays: 100 full days and 265 halves.
  assert.equal(restrictedMean(two), 100 + 265 / 2)
  assert.equal(exitsStart(two), 100)
  assert.equal(restrictedMean([job(100, true)]), null)
  assert.deepEqual(riskTable(two, [0, 101]), [
    { day: 0, atRisk: 2, ended: 0, censored: 0 },
    { day: 101, atRisk: 1, ended: 1, censored: 0 },
  ])
  assert.equal(groupSummary(two).six.rate, 0.5)
})
