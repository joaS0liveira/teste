import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { consult, type ConsultationData } from "./consultation.ts"

const load = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../../public/data/${name}.json`, import.meta.url),
      "utf8"
    )
  )

const data: ConsultationData = {
  entities: load("entidades_sociais"),
  participants: load("participantes"),
  placements: load("colocacoes"),
  actions: load("acoes_formacao"),
  trainingCosts: load("custos_formacao"),
  resources: load("recursos_acompanhamento"),
}
const all = Object.fromEntries(
  data.entities.map((e) => [e.id, consult(data, e.id)])
)
const at = (id: string, level: "clear" | "watch") =>
  all[id].signals.filter((s) => s.level === level).map((s) => s.key)

test("only Lisboa has clear signals", () => {
  assert.deepEqual(at("E03", "clear"), [
    "temporary",
    "ending",
    "training",
    "support",
  ])
  for (const id of Object.keys(all))
    if (id !== "E03") assert.deepEqual(at(id, "clear"), [], id)
})

test("signals to watch", () => {
  assert.deepEqual(at("E01", "watch"), ["placing"])
  assert.deepEqual(at("E04", "watch"), ["placing"])
  assert.deepEqual(at("E06", "watch"), ["temporary", "training"])
  assert.deepEqual(at("E08", "watch"), ["temporary", "placing", "support"])
  for (const id of ["E02", "E05", "E07"]) assert.deepEqual(at(id, "watch"), [])
})

test("Lisboa: values, usual values and what is ruled out", () => {
  const pct = (v: number) => (v * 100).toFixed(1)
  const [temporary, ending, training, support] = all.E03.signals
  assert.deepEqual(
    [pct(temporary.value), pct(temporary.usual)],
    ["87.7", "48.4"]
  )
  assert.deepEqual([pct(ending.value), pct(ending.usual)], ["14.1", "53.8"])
  assert.deepEqual([pct(training.value), pct(training.usual)], ["13.0", "67.8"])
  assert.equal(support.value.toFixed(2), "1.35")
  assert.equal(support.usual.toFixed(2), "3.17")
  assert.deepEqual(temporary.ruledOut, ["as empresas", "o perfil das pessoas"])
  assert.ok(training.ruledOut.includes("quem dá a formação"))
  assert.deepEqual(support.ruledOut, ["o preço de cada hora"])
})

test("Lisboa: facts used in the recipes", () => {
  const { facts } = all.E03
  assert.equal(facts.firstExitDay, 60)
  assert.equal(facts.openPastEnd, 489)
  assert.equal(Math.round(facts.companyTemporary.min * 100), 42)
  assert.equal(Math.round(facts.companyTemporary.max * 100), 58)
  assert.ok(facts.hoursToUsual > 1_500 && facts.hoursToUsual < 1_600)
})

test("nobody learns from an entity with clear signals", () => {
  for (const c of Object.values(all))
    for (const s of c.signals) assert.notEqual(s.learnFrom, "Lisboa")
  assert.deepEqual(all.E07.strongest, [
    "temporary",
    "ending",
    "training",
    "support",
  ])
})

test("pilot: only where there is enough to gain", () => {
  const lisboa = all.E03.pilot!
  assert.equal((lisboa.base * 100).toFixed(1), "25.5")
  assert.ok(lisboa.perGroup >= 80 && lisboa.perGroup <= 100)
  assert.equal(lisboa.review, lisboa.months + 6)
  assert.ok(lisboa.review <= 18)
  // Their temporary signals are only to watch, and most people already stay.
  for (const id of ["E06", "E08"]) assert.equal(all[id].pilot, null)
})
