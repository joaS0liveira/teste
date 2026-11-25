import { isValidPlacement } from "./clean.ts"
import { daysBetween, REFERENCE_DATE } from "./dates.ts"
import { DURABLE_DAYS, duration } from "./metrics.ts"
import type {
  Company,
  Participant,
  Placement,
  TrainingAction,
} from "./types.ts"

/** National minimum wage for 40 hours a week. To be confirmed before any use. */
const MINIMUM: Record<string, number> = { "2024": 820, "2025": 870 }
const FULL_WEEK = 40
const FULL_TIME = 35

/** Sectors whose training goes by another name. */
const AREA_OF: Record<string, string> = { tecnologia: "informatica" }

export type ClueKey =
  | "contract"
  | "salary"
  | "hours"
  | "training"
  | "region"
  | "conditions"
  | "satisfaction"

export type ClueLevel = "weighs" | "review" | "chance" | "none" | "listen"

export type Clue = { key: ClueKey; level: ClueLevel; text: string }

export type Quality = {
  contract: number
  salary: number
  hours: number
  /** Null when the programme has no training in the company's sector. */
  training: number | null
}

type Row = Placement & { person?: Participant; company?: Company }

export type CompanyCase = ReturnType<typeof companyCases>[number]

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}
const share = <T>(rows: T[], matches: (row: T) => boolean) =>
  rows.length ? rows.filter(matches).length / rows.length : 0
const inHundred = (rate: number) => Math.round(rate * 100)

export const isTemporary = (p: Placement) => p.tipo_contrato === "temporario"
const perHour = (p: Placement) => p.salario / ((p.horas_semanais * 52) / 12)

export function belowMinimum(p: Placement): boolean {
  const minimum = MINIMUM[p.data_colocacao.slice(0, 4)]
  return (
    minimum !== undefined &&
    p.salario < (minimum * p.horas_semanais) / FULL_WEEK
  )
}

export function companyCases(
  companies: Company[],
  participants: Participant[],
  placements: Placement[],
  actions: TrainingAction[]
) {
  const personOf = new Map(participants.map((p) => [p.id, p]))
  const companyOf = new Map(companies.map((c) => [c.id, c]))
  const completed = new Map<string, TrainingAction[]>()
  for (const action of actions)
    if (action.conclusao)
      completed.set(action.id_participante, [
        ...(completed.get(action.id_participante) ?? []),
        action,
      ])

  const valid: Row[] = placements.filter(isValidPlacement).map((p) => ({
    ...p,
    person: personOf.get(p.id_participante),
    company: companyOf.get(p.id_empresa),
  }))
  const observed = valid.filter(
    (p) => daysBetween(p.data_colocacao, REFERENCE_DATE) >= DURABLE_DAYS
  )
  const left = (p: Placement) =>
    p.data_fim !== null && duration(p) < DURABLE_DAYS
  const usual = share(observed, left)

  // What the same contracts, with the same entities, usually give.
  const mixKey = (p: Row) =>
    `${p.person?.entidade_social_id} ${p.tipo_contrato}`
  const mixRate = new Map(
    [...Map.groupBy(observed, mixKey)].map(([key, rows]) => [
      key,
      share(rows, left),
    ])
  )
  const areas = new Set(actions.map((a) => a.area))
  const areaOf = (c?: Company) => c && (AREA_OF[c.setor] ?? c.setor)
  const trainedForSector = (p: Row) =>
    (completed.get(p.id_participante) ?? []).some(
      (a) =>
        a.area === areaOf(p.company) &&
        a.data_fim !== null &&
        a.data_fim <= p.data_colocacao
    )

  const ids = [...new Set(valid.map((p) => p.id_empresa))].sort()
  return ids
    .map((id) => {
      const company = companyOf.get(id)
      const own = valid.filter((p) => p.id_empresa === id)
      const others = valid.filter((p) => p.id_empresa !== id)
      const seen = observed.filter((p) => p.id_empresa === id)
      const gone = seen.filter(left).length
      const rate = gone / seen.length
      const z = (rate - usual) / Math.sqrt((usual * (1 - usual)) / seen.length)
      const expectedRows = seen.map((p) => mixRate.get(mixKey(p))!)
      const expected = expectedRows.reduce((a, b) => a + b, 0)
      const zMix =
        (gone - expected) /
        Math.sqrt(expectedRows.reduce((a, r) => a + r * (1 - r), 0))

      const temporary = share(own, isTemporary)
      const temporaryOthers = share(others, isTemporary)
      const below = own.filter(belowMinimum).length
      const belowActive = own.filter(
        (p) => !p.data_fim && belowMinimum(p)
      ).length
      const pay = median(own.map(perHour))
      const peers = others.filter((p) => p.company?.setor === company?.setor)
      const payPeers = peers.length ? median(peers.map(perHour)) : null
      const hours = median(own.map((p) => p.horas_semanais))
      const hoursOthers = median(others.map((p) => p.horas_semanais))
      const trained = areas.has(areaOf(company) ?? "")
        ? share(own, trainedForSector)
        : null
      const sameRegion = share(own, (p) => p.person?.regiao === company?.regiao)

      const status: "unusual" | "watch" | "usual" =
        z >= 1.96
          ? "unusual"
          : rate - usual >= 0.03 || below > 0
            ? "watch"
            : "usual"

      const clues: Clue[] = [
        temporary - temporaryOthers >= 0.03
          ? {
              key: "contract",
              level: "weighs",
              text: `Em cada 100 contratos, ${inHundred(temporary)} são temporários. Nas outras empresas, ${inHundred(temporaryOthers)}. É o que mais anda a par com as saídas.`,
            }
          : {
              key: "contract",
              level: "none",
              text: `Em cada 100 contratos, ${inHundred(temporary)} são temporários. Nas outras empresas, ${inHundred(temporaryOthers)}.`,
            },
        below > 0
          ? {
              key: "salary",
              level: "review",
              text: `${below} de ${own.length} colocações ficam abaixo do salário mínimo em proporção às horas. ${belowActive} ainda estão ativas.`,
            }
          : {
              key: "salary",
              level: "none",
              text:
                payPeers === null
                  ? "Nenhuma colocação abaixo do mínimo em proporção às horas."
                  : `Nenhuma colocação abaixo do mínimo. Paga ${euro(pay)} por hora; as outras do setor, ${euro(payPeers)}.`,
            },
        Math.abs(hours - hoursOthers) >= 3
          ? {
              key: "hours",
              level: "weighs",
              text: `Metade trabalha ${hours} horas ou menos por semana. Nas outras, ${hoursOthers}.`,
            }
          : {
              key: "hours",
              level: "none",
              text: `${hours} horas por semana a meio da tabela, quase igual às outras (${hoursOthers}).`,
            },
        company
          ? {
              key: "training",
              level: "chance",
              text:
                trained === null
                  ? `O programa não tem nenhuma formação na área desta empresa. Ninguém chega preparado.`
                  : `${inHundred(trained)} em cada 100 chegaram com formação concluída na área da empresa.`,
            }
          : {
              key: "training",
              level: "none",
              text: "Não se sabe o setor desta empresa.",
            },
        {
          key: "region",
          level: "none",
          text: company
            ? `${inHundred(sameRegion)} em cada 100 vivem na região da empresa. No conjunto, isso não muda quem fica.`
            : "Não se sabe a região desta empresa.",
        },
        {
          key: "conditions",
          level: "listen",
          text: "Os dados não falam das condições. É preciso perguntar.",
        },
        {
          key: "satisfaction",
          level: "listen",
          text: "Os dados não falam da satisfação. É preciso perguntar.",
        },
      ]

      const quality: Quality = {
        contract: 1 - temporary,
        salary: 1 - below / own.length,
        hours: share(own, (p) => p.horas_semanais >= FULL_TIME),
        training: trained,
      }

      return {
        id,
        name: company?.nome_ficticio ?? "Empresa não identificada",
        sector: company?.setor ?? null,
        region: company?.regiao ?? null,
        placements: own.length,
        active: own.filter((p) => !p.data_fim).length,
        activeTemporary: own.filter((p) => !p.data_fim && isTemporary(p))
          .length,
        seen: seen.length,
        gone,
        rate,
        usual,
        z,
        /** What is left after counting the contracts and the entities. */
        zMix,
        explainedByMix: status === "unusual" && zMix < 1,
        below,
        belowActive,
        status,
        clues,
        quality,
      }
    })
    .sort((a, b) => b.rate - a.rate)
}

/** Average of all companies, to draw next to each one. */
export function averageQuality(cases: CompanyCase[]): Quality {
  const mean = (key: keyof Quality) => {
    const known = cases.flatMap((c) => c.quality[key] ?? [])
    return known.reduce((a, b) => a + b, 0) / known.length
  }
  return {
    contract: mean("contract"),
    salary: mean("salary"),
    hours: mean("hours"),
    training: mean("training"),
  }
}

/** The same company with two kinds of contract, by entity. The best argument there is. */
export function contractsByEntity(
  participants: Participant[],
  placements: Placement[],
  companyId: string
) {
  const entityOf = new Map(
    participants.map((p) => [p.id, p.entidade_social_id])
  )
  const own = placements.filter(
    (p) => isValidPlacement(p) && p.id_empresa === companyId
  )
  return [...Map.groupBy(own, (p) => entityOf.get(p.id_participante) ?? "")]
    .map(([entityId, rows]) => ({
      entityId,
      count: rows.length,
      temporary: share(rows, isTemporary),
    }))
    .filter((row) => row.count >= 10)
    .sort((a, b) => b.temporary - a.temporary)
}

function euro(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`
}
