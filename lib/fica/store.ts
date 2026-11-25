"use client"

import { useEffect } from "react"
import { create } from "zustand"
import { NO_FILTERS, type Filters } from "./retention.ts"
import type {
  ActionPlan,
  Company,
  ContractType,
  Entity,
  Participant,
  Placement,
  RawContact,
  SupportResource,
  TrainingAction,
  TrainingCost,
} from "./types.ts"

export type Tables = {
  entidades_sociais: Entity[]
  participantes: Participant[]
  colocacoes: Placement[]
  empresas_parceiras: Company[]
  acoes_formacao: TrainingAction[]
  custos_formacao: TrainingCost[]
  recursos_acompanhamento: SupportResource[]
  planos_acao: ActionPlan[]
  acompanhamentos: RawContact[]
}
type TableName = keyof Tables

type Store = {
  tables: Partial<Tables>
  failed: TableName[]
  load: (names: readonly TableName[]) => void
  /** Entity id, or "all". */
  entityId: string
  /** Filters of the people lists, kept when coming back from a person. */
  contract: "all" | ContractType
  list: "contact" | "waiting"
  query: string
  /** Shared by every page of analysis. */
  filters: Filters
}

const inFlight = new Set<TableName>()

// Filled in the browser only, so a module-level store leaks nothing between requests.
export const useFica = create<Store>()((set, get) => ({
  tables: {},
  failed: [],
  entityId: "all",
  contract: "all",
  list: "contact",
  query: "",
  filters: NO_FILTERS,
  load: (names) => {
    for (const name of names) {
      if (get().tables[name] || inFlight.has(name)) continue
      inFlight.add(name)
      set((s) => ({ failed: s.failed.filter((f) => f !== name) }))
      fetch(`/data/${name}.json`)
        .then((response) => {
          if (!response.ok) throw new Error(`${name}: ${response.status}`)
          return response.json()
        })
        .then(
          (rows) => {
            inFlight.delete(name)
            set((s) => ({ tables: { ...s.tables, [name]: rows } }))
          },
          () => {
            inFlight.delete(name)
            set((s) => ({ failed: [...s.failed, name] }))
          }
        )
    }
  },
}))

export type Loaded<T> =
  | { status: "error"; retry: () => void }
  | { status: "loading" }
  | { status: "ready"; tables: T }

/** Loads only the tables a screen needs. `names` must be a stable array. */
export function useTables<N extends TableName>(
  names: readonly N[]
): Loaded<Pick<Tables, N>> {
  const tables = useFica((s) => s.tables)
  const failed = useFica((s) => s.failed)
  const load = useFica((s) => s.load)

  useEffect(() => load(names), [load, names])

  if (names.some((name) => failed.includes(name)))
    return { status: "error" as const, retry: () => load(names) }
  if (names.some((name) => !tables[name])) return { status: "loading" as const }
  return { status: "ready" as const, tables: tables as Pick<Tables, N> }
}
