import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { companyCases, contractsByEntity } from "./company.ts"
import {
  BARRIERS,
  EMPTY_PLAN,
  journeys,
  planFor,
  plannedAfterLeaving,
  STAGES,
  visibleSteps,
  type PlanStep,
} from "./journey.ts"
import { compare, satisfactionOf, type Answers } from "./listen.ts"
import { trainingImpact } from "./metrics.ts"
import { activeJobs, backtest, expectedExits, toJobs } from "./risk.ts"
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
const companies = load<T.Company>("empresas_parceiras")
const plans = load<{ id_participante: string; data: string }>("planos_acao")
const jobs = toJobs(participants, placements)

test("radar: 2025 replayed with only what was known at the time", () => {
  const result = backtest(jobs, 100)
  assert.equal(result.actual, 867)
  assert.equal(Math.round(result.expected), 866)
  assert.equal(result.reached, 519)
  assert.equal(Math.round(result.random), 82)
})

test("radar: the next 30 days", () => {
  const active = activeJobs(jobs)
  assert.equal(active.length, 1_371)
  assert.equal(expectedExits(active).toFixed(1), "105.7")
  assert.ok(active.every((j) => j.risk >= 0 && j.risk <= 1))
})

const cases = companyCases(
  companies,
  participants,
  placements,
  load<T.TrainingAction>("acoes_formacao")
)
const company = (id: string) => cases.find((c) => c.id === id)!

test("companies: turnover in jobs with 180 days of observation", () => {
  assert.equal(cases.length, 17)
  assert.equal(
    cases.reduce((n, c) => n + c.seen, 0),
    1_704
  )
  assert.deepEqual([company("P14").seen, company("P14").gone], [98, 45])
  assert.deepEqual([company("P08").seen, company("P08").gone], [81, 37])
  assert.deepEqual([company("P09").seen, company("P09").gone], [93, 24])
})

test("companies: only one is out of the usual, and the mix explains it", () => {
  assert.deepEqual(
    cases.filter((c) => c.status === "unusual").map((c) => c.id),
    ["P14"]
  )
  assert.equal(company("P14").explainedByMix, true)
})

test("companies: pay below the proportional minimum in four of them", () => {
  assert.deepEqual(
    cases
      .filter((c) => c.below > 0)
      .map((c) => c.id)
      .sort(),
    ["P05", "P08", "P13", "P16"]
  )
  assert.equal(
    cases.reduce((n, c) => n + c.below, 0),
    119
  )
})

test("companies: the same company behaves differently by entity", () => {
  const rows = contractsByEntity(participants, placements, "P13")
  assert.equal(rows[0].entityId, "E03")
  assert.ok(rows[0].temporary > 0.8)
})

test("journeys: every person is in one stage", () => {
  const all = journeys(participants, placements, plans)
  const count = (stage: string) => all.filter((j) => j.stage === stage).length
  assert.deepEqual(STAGES.map(count), [884, 1_044, 1_201, 1_371])
  assert.equal(all.filter((j) => !j.hasPlan).length, 4_117)
  assert.deepEqual(plannedAfterLeaving(placements, plans), {
    left: 1_044,
    followed: 55,
  })
})

test("plans: step ids never repeat, and answers change the plan", () => {
  const ids = (steps: PlanStep[]): string[] =>
    steps.flatMap((s) => [
      s.id,
      ...(s.instead ? [s.instead.id] : []),
      ...(s.options ?? []).flatMap((o) => ids(o.next)),
    ])
  for (const barrier of BARRIERS)
    for (const stage of STAGES) {
      const plan = planFor(barrier, stage, "Norte", companies)
      assert.ok(plan.length > 0)
      // "sai-voltar" is shared by two answers of the same question on purpose.
      const list = ids(plan).filter((id) => id !== "sai-voltar")
      assert.equal(new Set(list).size, list.length, `${barrier} ${stage}`)
    }
  const plan = planFor("documentacao", "waiting", null, companies)
  const before = visibleSteps(plan, EMPTY_PLAN).length
  const after = visibleSteps(plan, { ...EMPTY_PLAN, answers: { doc: 0 } })
  assert.equal(after.length, before + 2)
  const stuck = visibleSteps(plan, {
    ...EMPTY_PLAN,
    answers: { doc: 0 },
    stuck: ["doc-id-2"],
  })
  assert.ok(stuck.some((s) => s.id === "doc-id-3"))
})

test("listening: agreement, disagreement and silence", () => {
  const all = (value: 0 | 1 | 2): Answers => ({
    contract: value,
    salary: value,
    hours: value,
    conditions: value,
    satisfaction: value,
  })
  assert.ok(compare([], []).every((r) => r.state === "unheard"))
  assert.ok(compare([all(2)], []).every((r) => r.state === "half"))
  assert.ok(compare([all(2)], [all(2)]).every((r) => r.state === "good"))
  assert.ok(compare([all(2)], [all(0)]).every((r) => r.state === "disagree"))
  assert.ok(compare([all(0)], [all(0)]).every((r) => r.state === "bad"))
  assert.equal(satisfactionOf(compare([all(2)], [])), null)
  assert.equal(satisfactionOf(compare([all(2)], [all(2)])), 1)
})

test("training: whom the money reached", () => {
  const impact = trainingImpact(
    placements,
    load<T.TrainingAction>("acoes_formacao"),
    load<T.TrainingCost>("custos_formacao")
  )
  assert.equal(impact.actions, 8_622)
  assert.equal(Math.round(impact.cost), 8_310_435)
  assert.equal(Math.round(impact.hours), 741_801)
  assert.equal(Math.round(impact.unplaced), 3_632_729)
})

test("training: no programme training for farming or hotels", () => {
  for (const id of ["P05", "P08", "P13", "P16"])
    assert.equal(company(id).quality.training, null)
})
