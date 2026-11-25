import { daysBetween, REFERENCE_DATE } from "./dates.ts"
import {
  cohortOutcome,
  DURABLE_DAYS,
  duration,
  firstExits,
  shortName,
  validPlacements,
} from "./metrics.ts"
import type {
  Entity,
  Participant,
  Placement,
  SupportResource,
  TrainingAction,
  TrainingCost,
} from "./types.ts"

export type SignalKey =
  "temporary" | "ending" | "placing" | "training" | "support"

export type ConsultationData = {
  entities: Entity[]
  participants: Participant[]
  placements: Placement[]
  actions: TrainingAction[]
  trainingCosts: TrainingCost[]
  resources: SupportResource[]
}

type Measure = { value: number; n: number }

/** In the order the screens show them: what touches staying comes first. */
const ORDER: SignalKey[] = [
  "temporary",
  "ending",
  "placing",
  "training",
  "support",
]
/** Which way is worse. */
const WORSE: Record<SignalKey, 1 | -1> = {
  temporary: 1,
  ending: -1,
  placing: -1,
  training: -1,
  support: -1,
}

// Two-sided 0.1% and 5%.
const Z_CLEAR = 3.2905
const Z_WATCH = 1.96

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

const share = <T>(rows: T[], matches: (row: T) => boolean): Measure => ({
  value: rows.length ? rows.filter(matches).length / rows.length : 0,
  n: rows.length,
})

const isTemporary = (p: Placement) => p.tipo_contrato === "temporario"
const stayed = (p: Placement) => !p.data_fim || duration(p) >= DURABLE_DAYS
const observed = (p: Placement) =>
  daysBetween(p.data_colocacao, REFERENCE_DATE) >= DURABLE_DAYS

/** The rows behind every measure, split by entity once. */
function prepare(data: ConsultationData) {
  const personOf = new Map(data.participants.map((p) => [p.id, p]))
  const providerOf = new Map(
    data.trainingCosts.map((c) => [c.id_acao, c.fornecedor])
  )
  const valid = validPlacements(data.participants, data.placements)
  const actions = data.actions.map((a) => ({
    ...a,
    person: personOf.get(a.id_participante),
    provider: providerOf.get(a.id) ?? "",
  }))
  return { personOf, valid, actions }
}

export type Consultation = ReturnType<typeof consult>
export type Signal = Consultation["signals"][number]

export function consult(data: ConsultationData, entityId: string) {
  const { personOf, valid, actions } = prepare(data)

  const measure = (id: string): Record<SignalKey, Measure> => {
    const own = valid.filter((p) => p.entityId === id)
    const people = data.participants.filter((p) => p.entidade_social_id === id)
    const outcome = cohortOutcome(people, data.placements)
    const hours = data.resources
      .filter((r) => r.id_entidade === id)
      .reduce((sum, r) => sum + r.horas_acompanhamento, 0)
    return {
      temporary: share(own, isTemporary),
      ending: share(
        own.filter((p) => isTemporary(p) && observed(p)),
        stayed
      ),
      placing: { value: outcome.placedRate, n: outcome.cohort },
      training: share(
        actions.filter((a) => a.person?.entidade_social_id === id),
        (a) => a.conclusao
      ),
      support: { value: hours / people.length, n: people.length },
    }
  }

  const measures = new Map(data.entities.map((e) => [e.id, measure(e.id)]))

  const assess = (id: string, key: SignalKey) => {
    const { value, n } = measures.get(id)![key]
    const usual = median(
      [...measures]
        .filter(([other]) => other !== id)
        .map(([, m]) => m[key].value)
    )
    const worse = (value - usual) * WORSE[key]
    let level: "clear" | "watch" | null = null
    if (key === "support") {
      const ratio = value / usual
      if (ratio < 2 / 3) level = "clear"
      else if (ratio < 3 / 4) level = "watch"
    } else {
      const z = worse / Math.sqrt((usual * (1 - usual)) / n)
      if (worse >= 0.1 && z > Z_CLEAR) level = "clear"
      else if (worse >= 0.05 && z > Z_WATCH) level = "watch"
    }
    return { key, value, usual, level }
  }

  const hasClear = (id: string) =>
    ORDER.some((key) => assess(id, key).level === "clear")

  /** The best entity on this measure, among those with no clear signal. */
  const learnFrom = (key: SignalKey) =>
    data.entities
      .filter((e) => e.id !== entityId && !hasClear(e.id))
      .sort(
        (a, b) =>
          (measures.get(a.id)![key].value - measures.get(b.id)![key].value) *
          WORSE[key]
      )[0]

  // What the entity would have with its own mix, at the rate of the others.
  const explains = <T>(
    own: T[],
    others: T[],
    key: (row: T) => string | undefined,
    matches: (row: T) => boolean
  ) => {
    const usual = share(others, matches).value
    const expected =
      [...Map.groupBy(own, key)].reduce((sum, [value, group]) => {
        const same = others.filter((row) => key(row) === value)
        const rate = same.length ? share(same, matches).value : usual
        return sum + rate * group.length
      }, 0) / own.length
    return Math.abs(expected - usual) >= 0.03
  }

  const mine = valid.filter((p) => p.entityId === entityId)
  const rest = valid.filter((p) => p.entityId !== entityId)
  const person = (p: Placement) => personOf.get(p.id_participante)

  /** Causes the data can rule out, as short Portuguese labels. */
  const ruledOut = (key: SignalKey): string[] => {
    const profile = [
      (p?: Participant) => p?.regiao,
      (p?: Participant) => p?.situacao_inicial,
      (p?: Participant) => p?.barreiras_emprego,
      (p?: Participant) => p?.nivel_qualificacao,
    ]
    const out: string[] = []
    if (key === "temporary" || key === "ending") {
      const keep = (p: Placement) =>
        key === "temporary" || (isTemporary(p) && observed(p))
      const matches = key === "temporary" ? isTemporary : stayed
      const own = mine.filter(keep)
      const others = rest.filter(keep)
      if (!explains(own, others, (p) => p.id_empresa, matches))
        out.push("as empresas")
      if (
        profile.every(
          (f) => !explains(own, others, (p) => f(person(p)), matches)
        )
      )
        out.push("o perfil das pessoas")
    }
    if (key === "training") {
      const isMine = (a: (typeof actions)[number]) =>
        a.person?.entidade_social_id === entityId
      const own = actions.filter(isMine)
      const others = actions.filter((a) => !isMine(a))
      const done = (a: (typeof actions)[number]) => a.conclusao
      if (!explains(own, others, (a) => a.provider, done))
        out.push("quem dá a formação")
      if (!explains(own, others, (a) => a.tipo_formacao + a.area, done))
        out.push("o tipo de formação")
      if (
        profile.every((f) => !explains(own, others, (a) => f(a.person), done))
      )
        out.push("o perfil das pessoas")
    }
    if (key === "support") {
      const perHour = (id: string) => {
        const own = data.resources.filter((r) => r.id_entidade === id)
        const sum = (k: "custo" | "horas_acompanhamento") =>
          own.reduce((total, r) => total + r[k], 0)
        return sum("custo") / sum("horas_acompanhamento")
      }
      const usual = median(
        data.entities.filter((e) => e.id !== entityId).map((e) => perHour(e.id))
      )
      if (Math.abs(perHour(entityId) / usual - 1) < 0.1)
        out.push("o preço de cada hora")
    }
    return out
  }

  const entity = data.entities.find((e) => e.id === entityId)!
  const people = data.participants.filter(
    (p) => p.entidade_social_id === entityId
  )
  const signals = ORDER.map((key) => assess(entityId, key)).flatMap(
    ({ level, ...signal }) => {
      if (!level) return []
      const teacher = learnFrom(signal.key)
      return [
        {
          ...signal,
          level,
          ruledOut: ruledOut(signal.key),
          learnFrom: teacher && shortName(teacher),
        },
      ]
    }
  )

  // How often the same companies use temporary contracts with the other entities.
  const companyRates = [...Map.groupBy(rest, (p) => p.id_empresa)].map(
    ([, group]) => share(group, isTemporary).value
  )
  const supportMeasure = assess(entityId, "support")

  return {
    id: entityId,
    name: shortName(entity),
    outcome: cohortOutcome(people, data.placements),
    signals,
    /** Where this entity is the reference for the others. */
    strongest: ORDER.filter(
      (key) =>
        key !== "placing" &&
        data.entities.every(
          (e) =>
            e.id === entityId ||
            (measures.get(entityId)![key].value -
              measures.get(e.id)![key].value) *
              WORSE[key] <
              0
        )
    ),
    facts: {
      companyTemporary: {
        min: Math.min(...companyRates),
        max: Math.max(...companyRates),
      },
      firstExitDay: firstExits(
        data.entities,
        data.participants,
        data.placements
      ).find((r) => r.id === entityId)?.firstDay,
      openPastEnd: actions.filter(
        (a) =>
          a.person?.entidade_social_id === entityId &&
          a.resultado === "em_curso" &&
          a.data_fim !== null &&
          a.data_fim <= REFERENCE_DATE
      ).length,
      hoursToUsual: Math.max(
        0,
        (supportMeasure.usual - supportMeasure.value) * people.length
      ),
    },
    pilot: pilot(mine),
  }
}

const GAIN = 0.2
/** Above this there is little left to gain, and a pilot this size proves nothing. */
const HIGHEST_GOAL = 0.9

/**
 * People and months needed to detect 20 points more staying, among everyone
 * placed (80% power, 5% error). Covers fewer and longer temporary contracts.
 */
export function pilot(placements: Placement[]) {
  const base = share(placements.filter(observed), stayed).value
  const goal = base + GAIN
  const lastYear = placements.filter(
    (p) => daysBetween(p.data_colocacao, REFERENCE_DATE) < 365
  ).length
  if (goal > HIGHEST_GOAL || lastYear === 0) return null
  const mean = (base + goal) / 2
  const perGroup = Math.ceil(
    (1.96 * Math.sqrt(2 * mean * (1 - mean)) +
      0.84 * Math.sqrt(base * (1 - base) + goal * (1 - goal))) **
      2 /
      GAIN ** 2
  )
  const months = Math.ceil((2 * perGroup) / (lastYear / 12))
  return { base, goal, perGroup, months, review: months + 6 }
}
