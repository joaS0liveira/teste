import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { cleanContacts } from "./clean.ts"
import { verdicts } from "./quality.ts"
import { CATEGORIES, QUESTIONS } from "./study.ts"

const load = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../../public/data/${name}.json`, import.meta.url),
      "utf8"
    )
  )

test("every record gets exactly one verdict", () => {
  const rows = verdicts(
    cleanContacts(load("acompanhamentos")),
    load("colocacoes"),
    load("empresas_parceiras"),
    load("acoes_formacao")
  )
  assert.deepEqual(
    rows.map((r) => r.total),
    [25_969, 2_461, 8_622]
  )
  for (const { total, counts } of rows)
    assert.equal(
      counts.valid + counts.corrected + counts.flagged + counts.excluded,
      total
    )
  assert.equal(rows[0].counts.excluded, 539)
  assert.equal(rows[1].counts.excluded, 46)
  assert.equal(rows[2].counts.flagged, 1_249)
})

test("the study has its 28 questions", () => {
  assert.deepEqual(
    CATEGORIES.map((c) => QUESTIONS.filter((q) => q.category === c.id).length),
    [5, 7, 5, 6, 5]
  )
  assert.equal(new Set(QUESTIONS.map((q) => q.question)).size, 28)
})
