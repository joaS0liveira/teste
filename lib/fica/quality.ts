import { isValidPlacement, type cleanContacts } from "./clean.ts"
import { parseDate, REFERENCE_DATE } from "./dates.ts"
import type { Company, Placement, TrainingAction } from "./types.ts"

export type Verdict = "valid" | "corrected" | "flagged" | "excluded"

type Counts = Record<Verdict, number>

/** Each record gets one verdict, the most serious one, so the counts add up. */
export function verdicts(
  cleaned: ReturnType<typeof cleanContacts>,
  placements: Placement[],
  companies: Company[],
  actions: TrainingAction[]
): { name: string; total: number; counts: Counts }[] {
  const companyIds = new Set(companies.map((c) => c.id))
  const contacts: Verdict[] = [
    ...cleaned.removed.map(() => "excluded" as const),
    ...cleaned.contacts.map((c) =>
      c.dateStatus === "unreliable" ||
      c.toConfirm ||
      (c.raw.resultado_contacto && !c.result)
        ? "flagged"
        : parseDate(c.raw.data) !== c.raw.data
          ? "corrected"
          : "valid"
    ),
  ]
  const jobs = placements.map((p): Verdict =>
    !isValidPlacement(p)
      ? "excluded"
      : !companyIds.has(p.id_empresa) || isOddReason(p)
        ? "flagged"
        : "valid"
  )
  const training = actions.map((a): Verdict =>
    isOverdue(a) ? "flagged" : "valid"
  )
  return [
    { name: "Contactos", rows: contacts },
    { name: "Colocações", rows: jobs },
    { name: "Ações de formação", rows: training },
  ].map(({ name, rows }) => {
    const count = (v: Verdict) => rows.filter((r) => r === v).length
    return {
      name,
      total: rows.length,
      counts: {
        valid: count("valid"),
        corrected: count("corrected"),
        flagged: count("flagged"),
        excluded: count("excluded"),
      },
    }
  })
}

/** A permanent contract does not reach its term. */
export const isOddReason = (p: Placement) =>
  isValidPlacement(p) &&
  p.tipo_contrato === "permanente" &&
  p.motivo_saida === "termo_contrato"

export const isOverdue = (a: TrainingAction) =>
  a.resultado === "em_curso" &&
  a.data_fim !== null &&
  a.data_fim <= REFERENCE_DATE
