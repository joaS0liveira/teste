import type { Contact, Placement, TrainingAction } from "./types.ts"

export type TimelineEvent = { date: string } & (
  | { kind: "entry" }
  | { kind: "training"; action: TrainingAction }
  | { kind: "placement"; placement: Placement }
  | { kind: "exit"; placement: Placement }
  | { kind: "contact"; contact: Contact }
)

/** Oldest first. Contacts without a reliable date stay out. */
export function buildTimeline(
  entryDate: string,
  actions: TrainingAction[],
  placement: Placement | undefined,
  contacts: Contact[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [{ kind: "entry", date: entryDate }]
  for (const action of actions)
    events.push({ kind: "training", date: action.data_inicio, action })
  if (placement) {
    events.push({
      kind: "placement",
      date: placement.data_colocacao,
      placement,
    })
    if (placement.data_fim)
      events.push({ kind: "exit", date: placement.data_fim, placement })
  }
  for (const contact of contacts)
    if (contact.date)
      events.push({ kind: "contact", date: contact.date, contact })
  return events.sort((a, b) => a.date.localeCompare(b.date))
}
