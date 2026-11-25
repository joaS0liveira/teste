import { isValidPlacement, type cleanContacts } from "./clean.ts"
import { daysBetween } from "./dates.ts"
import { BARRIERS, type Barrier } from "./journey.ts"
import type {
  ActionPlan,
  Participant,
  Placement,
  TrainingAction,
} from "./types.ts"

/** Needs, training and what came after, by barrier. Description, not effect. */
export function trainingByBarrier(
  participants: Participant[],
  placements: Placement[],
  actions: TrainingAction[]
) {
  const placed = new Set(
    placements.filter(isValidPlacement).map((p) => p.id_participante)
  )
  const byPerson = Map.groupBy(actions, (a) => a.id_participante)
  return BARRIERS.map((barrier) => {
    const people = participants.filter((p) => p.barreiras_emprego === barrier)
    const own = people.flatMap((p) => byPerson.get(p.id) ?? [])
    const some = (test: (a: TrainingAction) => boolean) =>
      people.filter((p) => (byPerson.get(p.id) ?? []).some(test)).length
    const rate = (n: number) => (people.length ? n / people.length : 0)
    return {
      barrier,
      people: people.length,
      trained: rate(some(() => true)),
      completed: rate(some((a) => a.conclusao)),
      dropped: rate(some((a) => a.resultado === "desistencia")),
      placed: rate(people.filter((p) => placed.has(p.id)).length),
      actions: own.length,
    }
  })
}

/** Placed or not, by what happened to the training. */
export function placementByTraining(
  participants: Participant[],
  placements: Placement[],
  actions: TrainingAction[]
) {
  const placed = new Set(
    placements.filter(isValidPlacement).map((p) => p.id_participante)
  )
  const byPerson = Map.groupBy(actions, (a) => a.id_participante)
  const state = (p: Participant) => {
    const own = byPerson.get(p.id) ?? []
    if (own.length === 0) return "none"
    if (own.some((a) => a.conclusao)) return "completed"
    if (own.some((a) => a.resultado === "em_curso")) return "ongoing"
    return "dropped"
  }
  return (["completed", "ongoing", "dropped", "none"] as const).map((key) => {
    const people = participants.filter((p) => state(p) === key)
    const k = people.filter((p) => placed.has(p.id)).length
    return { key, people: people.length, placed: k }
  })
}

export function planStates(plans: ActionPlan[]) {
  const count = (state: string) =>
    plans.filter((p) => p.estado === state).length
  return {
    actions: plans.length,
    people: new Set(plans.map((p) => p.id_participante)).size,
    done: count("concluida"),
    ongoing: count("em_curso"),
    suspended: count("suspensa"),
  }
}

/** People with a barrier, and how many have an action made for it. */
export function documentSupport(
  participants: Participant[],
  plans: ActionPlan[]
) {
  const barrier: Barrier = "documentacao"
  const people = new Set(
    participants.filter((p) => p.barreiras_emprego === barrier).map((p) => p.id)
  )
  const helped = new Set(
    plans
      .filter(
        (p) =>
          p.tipo_acao === "apoio_documentacao" && people.has(p.id_participante)
      )
      .map((p) => p.id_participante)
  )
  return { people: people.size, helped: helped.size }
}

export function contactSummary(
  participants: Participant[],
  cleaned: ReturnType<typeof cleanContacts>
) {
  const { contacts } = cleaned
  const state = (s: string) => contacts.filter((c) => c.raw.estado === s).length
  const reached = new Set(
    contacts
      .filter((c) => c.raw.estado === "realizado")
      .map((c) => c.raw.id_participante)
  )
  // The number some analyses reach when dd/mm/yyyy dates are left out.
  const reachedIsoOnly = new Set(
    contacts
      .filter((c) => c.raw.estado === "realizado" && !c.raw.data.includes("/"))
      .map((c) => c.raw.id_participante)
  )
  return {
    distinct: contacts.length,
    duplicates: cleaned.removed.length,
    done: state("realizado"),
    notDone: state("nao_realizado"),
    scheduled: state("agendado"),
    withoutContact: participants.filter((p) => !reached.has(p.id)).length,
    withoutContactIsoOnly: participants.filter((p) => !reachedIsoOnly.has(p.id))
      .length,
    usefulNotDone: contacts.filter(
      (c) =>
        c.raw.estado === "nao_realizado" && c.raw.resultado_contacto === "util"
    ).length,
  }
}

/**
 * Days until the first contact that took place, with and without the dates that
 * cannot be trusted. Shown only to explain why it is not used.
 */
export function firstContact(
  participants: Participant[],
  cleaned: ReturnType<typeof cleanContacts>,
  parse: (value: string) => string | null
) {
  const entry = new Map(participants.map((p) => [p.id, p.data_entrada]))
  const first = new Map<string, { date: string; reliable: boolean }>()
  for (const c of cleaned.contacts) {
    if (c.raw.estado !== "realizado") continue
    const date = parse(c.raw.data)
    if (!date) continue
    const current = first.get(c.raw.id_participante)
    if (!current || date < current.date)
      first.set(c.raw.id_participante, {
        date,
        reliable: c.dateStatus !== "unreliable",
      })
  }
  const days = [...first]
    .map(([id, { date }]) => daysBetween(entry.get(id)!, date))
    .sort((a, b) => a - b)
  const middle = Math.floor(days.length / 2)
  return {
    median:
      days.length % 2 ? days[middle] : (days[middle - 1] + days[middle]) / 2,
    people: days.length,
    unreliable: [...first.values()].filter((f) => !f.reliable).length,
  }
}
