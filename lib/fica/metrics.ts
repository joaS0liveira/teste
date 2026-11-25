import { isValidPlacement } from "./clean.ts"
import { daysBetween, REFERENCE_DATE } from "./dates.ts"
import type {
  Company,
  ContractType,
  Entity,
  Participant,
  Placement,
  SupportResource,
  TrainingAction,
  TrainingCost,
} from "./types.ts"

const COHORT_DAYS = 545
const FIRST_YEAR_DAYS = 365
export const DURABLE_DAYS = 180

/** Days in the job so far, or until it ended. */
export function duration(placement: Placement): number {
  return daysBetween(
    placement.data_colocacao,
    placement.data_fim ?? REFERENCE_DATE
  )
}

function isInCohort(participant: Participant): boolean {
  return daysBetween(participant.data_entrada, REFERENCE_DATE) >= COHORT_DAYS
}

/** How many people of the cohort were placed, and how many stayed. */
export function cohortOutcome(
  participants: Participant[],
  placements: Placement[],
  durableDays = DURABLE_DAYS
) {
  const placementOf = new Map(
    placements.filter(isValidPlacement).map((p) => [p.id_participante, p])
  )
  const cohort = participants.filter(isInCohort)
  const firstYear = cohort.flatMap((person) => {
    const placement = placementOf.get(person.id)
    return placement &&
      daysBetween(person.data_entrada, placement.data_colocacao) <=
        FIRST_YEAR_DAYS
      ? [placement]
      : []
  })
  const durable = firstYear.filter(
    (p) => !p.data_fim || duration(p) >= durableDays
  )
  return {
    cohort: cohort.length,
    placed: firstYear.length,
    durable: durable.length,
    placedRate: cohort.length ? firstYear.length / cohort.length : 0,
    durableRate: cohort.length ? durable.length / cohort.length : 0,
  }
}

export type CurvePoint = { day: number; rate: number }

/** Kaplan-Meier. Jobs without an end are censored at the reference date. */
export function survivalCurve(placements: Placement[]): CurvePoint[] {
  const leaving = new Map<number, { ended: number; censored: number }>()
  for (const placement of placements) {
    const day = duration(placement)
    const entry = leaving.get(day) ?? { ended: 0, censored: 0 }
    if (placement.data_fim) entry.ended++
    else entry.censored++
    leaving.set(day, entry)
  }
  let atRisk = placements.length
  let rate = 1
  const curve: CurvePoint[] = [{ day: 0, rate }]
  for (const [day, { ended, censored }] of [...leaving].sort(
    (a, b) => a[0] - b[0]
  )) {
    if (ended) {
      rate *= 1 - ended / atRisk
      curve.push({ day, rate })
    }
    atRisk -= ended + censored
  }
  return curve
}

export function survivalAt(curve: CurvePoint[], day: number): number {
  return curve.findLast((point) => point.day <= day)?.rate ?? 1
}

export function shortName(entity: Entity): string {
  return entity.nome.replace("Entidade Social ", "")
}

/** Some placements point to a company that is not in the list. */
export function companyName(companies: Company[], id: string): string {
  return (
    companies.find((c) => c.id === id)?.nome_ficticio ??
    "Empresa não identificada"
  )
}

/** Valid placements together with the entity that follows the person. */
export function validPlacements(
  participants: Participant[],
  placements: Placement[]
) {
  const entityOf = new Map(
    participants.map((p) => [p.id, p.entidade_social_id])
  )
  return placements
    .filter(isValidPlacement)
    .map((p) => ({ ...p, entityId: entityOf.get(p.id_participante) }))
}

/**
 * Share of people who stay 180 days, by company, next to what the mix of
 * entity and contract would predict. Only placements observed for 180 days.
 */
export function companyRetention(
  participants: Participant[],
  placements: Placement[]
) {
  const observed = validPlacements(participants, placements)
    .filter(
      (p) => daysBetween(p.data_colocacao, REFERENCE_DATE) >= DURABLE_DAYS
    )
    .map((p) => ({ ...p, stayed: !p.data_fim || duration(p) >= DURABLE_DAYS }))

  const stayRate = (group: typeof observed) =>
    group.filter((p) => p.stayed).length / group.length
  const mixOf = (p: (typeof observed)[number]) =>
    `${p.entityId} ${p.tipo_contrato}`
  const rateOfMix = new Map(
    [...Map.groupBy(observed, mixOf)].map(([mix, group]) => [
      mix,
      stayRate(group),
    ])
  )

  return [...Map.groupBy(observed, (p) => p.id_empresa)]
    .map(([id, group]) => ({
      id,
      count: group.length,
      temporaryRate:
        group.filter((p) => p.tipo_contrato === "temporario").length /
        group.length,
      stayRate: stayRate(group),
      expectedRate:
        group.reduce((sum, p) => sum + rateOfMix.get(mixOf(p))!, 0) /
        group.length,
    }))
    .sort((a, b) => b.stayRate - a.stayRate)
}

export type EntitySummary = ReturnType<typeof entitySummaries>[number]

export function entitySummaries(
  entities: Entity[],
  participants: Participant[],
  placements: Placement[]
) {
  const valid = validPlacements(participants, placements)
  return entities.map((entity) => {
    const own = valid.filter((p) => p.entityId === entity.id)
    const temporary = own.filter((p) => p.tipo_contrato === "temporario")
    return {
      id: entity.id,
      name: shortName(entity),
      ...cohortOutcome(
        participants.filter((p) => p.entidade_social_id === entity.id),
        placements
      ),
      temporaryRate: own.length ? temporary.length / own.length : 0,
      survival180: survivalAt(survivalCurve(own), DURABLE_DAYS),
    }
  })
}

/** What the simulator needs to know about the placements of one entity. */
export function contractMix(placements: Placement[]) {
  const of = (type: ContractType) =>
    placements.filter((p) => p.tipo_contrato === type)
  const temporary = of("temporario")
  const survival = (group: Placement[]) =>
    survivalAt(survivalCurve(group), DURABLE_DAYS)
  return {
    temporaryRate: placements.length ? temporary.length / placements.length : 0,
    temporarySurvival: survival(temporary),
    permanentSurvival: survival(of("permanente")),
  }
}

/** Expected share still employed at 180 days. Same formula for today and the scenario. */
export function expectedStay(
  mix: ReturnType<typeof contractMix>,
  temporaryRate = mix.temporaryRate
): number {
  return (
    temporaryRate * mix.temporarySurvival +
    (1 - temporaryRate) * mix.permanentSurvival
  )
}

/** Cost per placement and per lasting job, by entity id. */
export function entityCosts(
  summaries: EntitySummary[],
  participants: Participant[],
  actions: TrainingAction[],
  trainingCosts: TrainingCost[],
  resources: SupportResource[]
) {
  const costOf = new Map(trainingCosts.map((c) => [c.id_acao, c.custo]))
  const trainingOf = new Map<string, number>()
  for (const action of actions)
    trainingOf.set(
      action.id_participante,
      (trainingOf.get(action.id_participante) ?? 0) +
        (costOf.get(action.id) ?? 0)
    )

  return new Map(
    summaries.map((summary) => {
      const people = participants.filter(
        (p) => p.entidade_social_id === summary.id
      )
      const support = resources
        .filter((r) => r.id_entidade === summary.id)
        .reduce((sum, r) => sum + r.custo, 0)
      const training = people
        .filter(isInCohort)
        .reduce((sum, p) => sum + (trainingOf.get(p.id) ?? 0), 0)
      const perPerson = support / people.length + training / summary.cohort
      return [
        summary.id,
        {
          perPlacement: perPerson / summary.placedRate,
          perDurable: perPerson / summary.durableRate,
        },
      ]
    })
  )
}

/** Where the money went, in total. */
export function spendingTotals(
  actions: TrainingAction[],
  trainingCosts: TrainingCost[],
  resources: SupportResource[]
) {
  const dropouts = new Set(
    actions.filter((a) => a.resultado === "desistencia").map((a) => a.id)
  )
  const sum = (costs: { custo: number }[]) =>
    costs.reduce((total, c) => total + c.custo, 0)
  const training = sum(trainingCosts)
  const dropout = sum(trainingCosts.filter((c) => dropouts.has(c.id_acao)))
  return {
    training,
    dropout,
    dropoutRate: training ? dropout / training : 0,
    support: sum(resources),
  }
}

/** Whom the training money reached. Not a judgement on whether it helped. */
export function trainingImpact(
  placements: Placement[],
  actions: TrainingAction[],
  trainingCosts: TrainingCost[]
) {
  const placed = new Set(
    placements.filter(isValidPlacement).map((p) => p.id_participante)
  )
  const costOf = new Map(trainingCosts.map((c) => [c.id_acao, c.custo]))
  const sum = (rows: TrainingAction[]) =>
    rows.reduce((total, a) => total + (costOf.get(a.id) ?? 0), 0)
  const count = (result: string) =>
    actions.filter((a) => a.resultado === result).length
  return {
    actions: actions.length,
    cost: sum(actions),
    hours: trainingCosts.reduce((total, c) => total + c.horas, 0),
    unplaced: sum(actions.filter((a) => !placed.has(a.id_participante))),
    results: [
      { label: "Concluída com aprovação", count: count("aprovado") },
      { label: "Concluída", count: count("concluido") },
      { label: "Em curso", count: count("em_curso") },
      { label: "Desistência", count: count("desistencia") },
    ],
  }
}

/** Jobs still running that started between 60 and 180 days ago, both included. */
export function activeInRiskWindow(placements: Placement[]): Placement[] {
  return placements.filter((p) => {
    if (p.data_fim) return false
    const days = duration(p)
    return days >= 60 && days <= 180
  })
}

/** Recorded reasons of the temporary jobs that ended, most common first. */
export function temporaryExitReasons(placements: Placement[]) {
  const ended = placements.filter(
    (p) => p.tipo_contrato === "temporario" && p.data_fim && isValidPlacement(p)
  )
  const counts = new Map<string | null, number>()
  for (const { motivo_saida } of ended)
    counts.set(motivo_saida, (counts.get(motivo_saida) ?? 0) + 1)
  return {
    total: ended.length,
    reasons: [...counts]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  }
}

/** Temporary contracts first, then the longest running. */
export function byContactOrder(a: Placement, b: Placement): number {
  const temporary = (p: Placement) => Number(p.tipo_contrato === "temporario")
  return temporary(b) - temporary(a) || duration(b) - duration(a)
}

/** People who entered a year ago or more and have none of these placements. */
export function waitingOverAYear(
  participants: Participant[],
  placements: Placement[]
): Participant[] {
  const placed = new Set(placements.map((p) => p.id_participante))
  return participants.filter(
    (p) =>
      !placed.has(p.id) && daysBetween(p.data_entrada, REFERENCE_DATE) >= 365
  )
}

/** How many people each entity could act on now. Counts only, no people. */
export function nextSteps(
  entities: Entity[],
  participants: Participant[],
  placements: Placement[]
) {
  const valid = placements.filter(isValidPlacement)
  const contact = activeInRiskWindow(valid)
  const ids = (list: Placement[]) => new Set(list.map((p) => p.id_participante))
  const contactIds = ids(contact)
  const firstIds = ids(contact.filter((p) => p.tipo_contrato === "temporario"))
  const waiting = new Set(
    waitingOverAYear(participants, placements).map((p) => p.id)
  )
  const toConfirm = new Set(
    waitingOverAYear(participants, valid)
      .map((p) => p.id)
      .filter((id) => !waiting.has(id))
  )

  return entities.map((entity) => {
    const people = participants.filter(
      (p) => p.entidade_social_id === entity.id
    )
    const count = (set: Set<string>) =>
      people.filter((p) => set.has(p.id)).length
    return {
      id: entity.id,
      name: shortName(entity),
      contact: count(contactIds),
      contactFirst: count(firstIds),
      resume: count(waiting),
      confirm: count(toConfirm),
    }
  })
}

/** The earliest day anyone left a temporary job, by entity. */
export function firstExits(
  entities: Entity[],
  participants: Participant[],
  placements: Placement[]
) {
  const valid = validPlacements(participants, placements)
  return entities.flatMap((entity) => {
    const days = valid
      .filter(
        (p) =>
          p.entityId === entity.id &&
          p.tipo_contrato === "temporario" &&
          p.data_fim
      )
      .map(duration)
    if (days.length === 0) return []
    const firstDay = Math.min(...days)
    return [
      {
        id: entity.id,
        name: shortName(entity),
        exits: days.length,
        firstDay,
        months: Math.floor(firstDay / 30),
      },
    ]
  })
}
