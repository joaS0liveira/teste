import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { cleanContacts, isValidPlacement } from "./clean.ts"
import { toCsv } from "./csv.ts"
import { parseDate } from "./dates.ts"
import * as format from "./format.ts"
import * as metrics from "./metrics.ts"
import { buildTimeline } from "./timeline.ts"
import type * as T from "./types.ts"

const load = <Row>(name: string): Row[] =>
  JSON.parse(
    readFileSync(
      new URL(`../../public/data/${name}.json`, import.meta.url),
      "utf8"
    )
  )

const entities = load<T.Entity>("entidades_sociais")
const participants = load<T.Participant>("participantes")
const placements = load<T.Placement>("colocacoes")
const rawContacts = load<T.RawContact>("acompanhamentos")
const cleaned = cleanContacts(rawContacts)
const pct = (rate: number) => (rate * 100).toFixed(1)
const count = (status: T.DateStatus) =>
  cleaned.contacts.filter((c) => c.dateStatus === status).length

test("contacts: repeats, median and spike", () => {
  assert.equal(rawContacts.length, 25_969)
  assert.equal(cleaned.contacts.length, 25_430)
  assert.equal(cleaned.removed.length, 539)
  assert.equal(cleaned.medianPerDay, 20)
  assert.equal(cleaned.spikeDays.size, 9)
})

test("contacts: date status", () => {
  assert.equal(count("unreliable"), 12_030)
  assert.equal(count("certain"), 10_679)
  assert.equal(count("converted"), 2_721)
  assert.equal(cleaned.converted, 5_209)
  assert.ok(
    cleaned.contacts.every(
      (c) => (c.date === null) === (c.dateStatus === "unreliable")
    )
  )
})

test("contacts: ignored results and to confirm", () => {
  assert.equal(cleaned.ignoredResults, 9_333)
  assert.equal(cleaned.contacts.filter((c) => c.toConfirm).length, 5_091)
  assert.ok(
    cleaned.contacts.every((c) => !c.result || c.raw.estado === "realizado")
  )
})

test("dates: day first, and impossible dates are rejected", () => {
  assert.equal(parseDate("05/03/2025"), "2025-03-05")
  assert.equal(parseDate("2025-03-05"), "2025-03-05")
  assert.equal(parseDate("03/25/2025"), null)
  assert.equal(parseDate("2025-02-30"), null)
  assert.equal(parseDate(""), null)
})

test("placements and cohort", () => {
  const valid = placements.filter(isValidPlacement)
  assert.equal(placements.length, 2_461)
  assert.equal(valid.length, 2_415)
  assert.equal(valid.filter((p) => !p.data_fim).length, 1_371)
  const outcome = metrics.cohortOutcome(participants, placements)
  assert.equal(outcome.cohort, 1_223)
  assert.equal(outcome.placed, 786)
  assert.equal(pct(outcome.placedRate), "64.3")
  assert.equal(outcome.durable, 517)
  assert.equal(pct(outcome.durableRate), "42.3")
})

test("people lists", () => {
  const risk = metrics.activeInRiskWindow(placements)
  const temporary = risk.filter((p) => p.tipo_contrato === "temporario")
  assert.equal(risk.length, 432)
  assert.equal(temporary.length, 256)
  assert.equal(risk.length - temporary.length, 176)
  assert.equal(metrics.waitingOverAYear(participants, placements).length, 844)
  assert.equal(
    metrics.waitingOverAYear(participants, placements.filter(isValidPlacement))
      .length,
    884
  )
})

// cohort, placed, durable, temporary, survival at 180 days, € per placement, € per lasting job
const expected = {
  E01: [138, "54.3", "44.2", "41.8", "80.5", 3680, 4524],
  E02: [131, "62.6", "47.3", "48.4", "76.0", 3248, 4296],
  E03: [238, "84.0", "22.7", "87.7", "24.3", 2323, 8602],
  E04: [126, "48.4", "32.5", "53.6", "71.1", 4352, 6476],
  E05: [133, "60.2", "48.1", "45.8", "77.2", 3383, 4229],
  E06: [169, "68.0", "53.8", "58.2", "73.6", 2851, 3602],
  E07: [108, "68.5", "66.7", "28.4", "94.8", 3221, 3310],
  E08: [180, "55.0", "40.0", "54.2", "74.0", 3642, 5007],
}

test("each entity", () => {
  const summaries = metrics.entitySummaries(entities, participants, placements)
  const costs = metrics.entityCosts(
    summaries,
    participants,
    load<T.TrainingAction>("acoes_formacao"),
    load<T.TrainingCost>("custos_formacao"),
    load<T.SupportResource>("recursos_acompanhamento")
  )
  const actual = Object.fromEntries(
    summaries.map((s) => [
      s.id,
      [
        s.cohort,
        pct(s.placedRate),
        pct(s.durableRate),
        pct(s.temporaryRate),
        pct(s.survival180),
        Math.round(costs.get(s.id)!.perPlacement),
        Math.round(costs.get(s.id)!.perDurable),
      ],
    ])
  )
  assert.deepEqual(actual, expected)
})

test("at 90 days Lisboa and Algarve are level", () => {
  for (const id of ["E03", "E07"]) {
    const own = participants.filter((p) => p.entidade_social_id === id)
    const { durableRate } = metrics.cohortOutcome(own, placements, 90)
    assert.equal(pct(durableRate), "68.5")
  }
})

test("numbers are written the Portuguese way", () => {
  const plain = (text: string) => text.replace(/\s/g, " ")
  assert.equal(plain(format.percent(0.227)), "22,7%")
  assert.equal(plain(format.integer(1223)), "1 223")
  assert.equal(format.date("2025-12-31"), "31/12/2025")
})

test("spending totals", () => {
  const totals = metrics.spendingTotals(
    load<T.TrainingAction>("acoes_formacao"),
    load<T.TrainingCost>("custos_formacao"),
    load<T.SupportResource>("recursos_acompanhamento")
  )
  const plain = (text: string) => text.replace(/\s/g, " ")
  assert.equal(plain(format.millionEuros(totals.training)), "8,31 M€")
  assert.equal(plain(format.millionEuros(totals.support)), "0,40 M€")
  assert.equal(plain(format.millionEuros(totals.dropout)), "1,72 M€")
  assert.equal(pct(totals.dropoutRate), "20.7")
  assert.equal(plain(format.euros(8602)), "8 602 €")
})

test("contact order: temporary first, then longest running", () => {
  const list = metrics
    .activeInRiskWindow(placements)
    .sort(metrics.byContactOrder)
  assert.ok(list.slice(0, 256).every((p) => p.tipo_contrato === "temporario"))
  for (const part of [list.slice(0, 256), list.slice(256)]) {
    const days = part.map(metrics.duration)
    assert.deepEqual(
      days,
      [...days].sort((a, b) => b - a)
    )
  }
})

test("timeline: ordered, and without unreliable contacts", () => {
  const actions = load<T.TrainingAction>("acoes_formacao")
  for (const person of participants.slice(0, 50)) {
    const own = cleaned.contacts.filter(
      (c) => c.raw.id_participante === person.id
    )
    const events = buildTimeline(
      person.data_entrada,
      actions.filter((a) => a.id_participante === person.id),
      placements.find((p) => p.id_participante === person.id),
      own
    )
    const dates = events.map((e) => e.date)
    assert.deepEqual(dates, [...dates].sort())
    assert.equal(
      events.filter((e) => e.kind === "contact").length,
      own.filter((c) => c.dateStatus !== "unreliable").length
    )
  }
})

test("csv: no cell can run as a formula", () => {
  assert.equal(
    toCsv([["=1+1", "+1", "-1", "@a", 'a"b', 12]]),
    '\uFEFF"\'=1+1";"\'+1";"\'-1";"\'@a";"a""b";"12"'
  )
})

test("simulator: Lisboa", () => {
  const own = metrics
    .validPlacements(participants, placements)
    .filter((p) => p.entityId === "E03")
  const mix = metrics.contractMix(own)
  assert.equal(pct(mix.temporaryRate), "87.7")
  assert.equal(pct(metrics.expectedStay(mix)), "23.2")
  assert.equal(pct(metrics.expectedStay(mix, 0.5)), "54.8")
})

test("simulator: every entity has both kinds of contract", () => {
  const valid = metrics.validPlacements(participants, placements)
  for (const entity of entities)
    for (const type of ["temporario", "permanente"])
      assert.ok(
        valid.some((p) => p.entityId === entity.id && p.tipo_contrato === type)
      )
})

test("data screen: invalid placements and unknown company", () => {
  const companies = load<T.Company>("empresas_parceiras")
  assert.equal(placements.filter((p) => !isValidPlacement(p)).length, 46)
  assert.equal(
    placements.filter((p) => !companies.some((c) => c.id === p.id_empresa))
      .length,
    100
  )
  const inSpike = [...cleaned.spikeDays].reduce(
    (sum, day) => sum + cleaned.perDay.get(day)!,
    0
  )
  assert.equal(inSpike, 12_030)
})

test("exit reasons of temporary jobs", () => {
  const { total, reasons } = metrics.temporaryExitReasons(placements)
  assert.equal(total, 946)
  assert.deepEqual(reasons, [
    { reason: "termo_contrato", count: 180 },
    { reason: "conclusao_formacao", count: 166 },
    { reason: "desistencia", count: 154 },
    { reason: null, count: 152 },
    { reason: "outro", count: 148 },
    { reason: "mudanca_emprego", count: 146 },
  ])
})

test("companies: stay rate next to the expected one", () => {
  const rows = metrics.companyRetention(participants, placements)
  assert.equal(rows.length, 17)
  assert.equal(
    rows.reduce((sum, r) => sum + r.count, 0),
    1_704
  )
  const row = (id: string) => {
    const r = rows.find((company) => company.id === id)!
    return [r.count, pct(r.stayRate), pct(r.expectedRate), pct(r.temporaryRate)]
  }
  assert.deepEqual(row("P09"), [93, "74.2", "70.3", "48.4"])
  assert.deepEqual(row("P14"), [98, "54.1", "56.1", "64.3"])
  assert.deepEqual(row("P99"), [58, "60.3", "62.6", "56.9"])
  assert.equal(rows[0].id, "P09")
  assert.equal(rows[16].id, "P14")
})

test("next steps: counts by entity add up to the totals", () => {
  const rows = metrics.nextSteps(entities, participants, placements)
  const sum = (key: "contact" | "contactFirst" | "resume" | "confirm") =>
    rows.reduce((total, row) => total + row[key], 0)
  assert.equal(rows.length, 8)
  assert.equal(sum("contact"), 432)
  assert.equal(sum("contactFirst"), 256)
  assert.equal(sum("resume"), 844)
  assert.equal(sum("confirm"), 40)
})

test("first exits of temporary jobs", () => {
  const rows = metrics.firstExits(entities, participants, placements)
  const months = Object.fromEntries(rows.map((r) => [r.id, r.months]))
  assert.deepEqual(months, {
    E01: 3,
    E02: 3,
    E03: 2,
    E04: 3,
    E05: 3,
    E06: 3,
    E07: 5,
    E08: 3,
  })
  const day = (id: string) => rows.find((r) => r.id === id)!.firstDay
  assert.equal(day("E03"), 60)
  assert.equal(day("E05"), 90)
  assert.equal(day("E07"), 159)
})

test("sentences: in every 100 people", () => {
  const total = metrics.cohortOutcome(participants, placements)
  assert.equal(format.inHundred(total.placedRate), 64)
  assert.equal(format.inHundred(total.durableRate), 42)
})
