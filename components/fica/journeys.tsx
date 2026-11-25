"use client"

import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { Select } from "@/components/ui/select-field"
import { inHundred, integer } from "@/lib/fica/format"
import {
  BARRIER_LABEL,
  BARRIERS,
  journeys,
  planFor,
  plannedAfterLeaving,
  STAGE_LABEL,
  STAGES,
  type Barrier,
  type Journey,
  type Stage,
} from "@/lib/fica/journey"
import { shortName } from "@/lib/fica/metrics"
import { useTables, type Tables } from "@/lib/fica/store"
import { cn } from "@/lib/utils"
import { PlanView } from "./plan-view"
import { LoadError, Loading, ScreenHeader } from "./screen"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "empresas_parceiras",
  "planos_acao",
] as const

export function Journeys() {
  const data = useTables(TABLES)
  return (
    <>
      <ScreenHeader title="Percursos" />
      {data.status === "loading" && <Loading />}
      {data.status === "error" && <LoadError retry={data.retry} />}
      {data.status === "ready" && <Content {...data.tables} />}
    </>
  )
}

type Props = Pick<Tables, (typeof TABLES)[number]>

function Content(tables: Props) {
  const requested = useSearchParams().get("etapa")
  const people = useMemo(
    () => journeys(tables.participantes, tables.colocacoes, tables.planos_acao),
    [tables.participantes, tables.colocacoes, tables.planos_acao]
  )
  const after = useMemo(
    () => plannedAfterLeaving(tables.colocacoes, tables.planos_acao),
    [tables.colocacoes, tables.planos_acao]
  )

  return (
    <div className="mt-5 flex flex-col gap-6">
      <p className="max-w-prose text-xl text-balance">
        Depois de perder o emprego, só{" "}
        <strong className="font-semibold">
          {inHundred(after.followed / after.left)} em cada 100
        </strong>{" "}
        têm um novo plano registado. Aqui o acompanhamento continua.
      </p>
      <Groups
        people={people}
        tables={tables}
        initialStage={STAGES.find((s) => s === requested) ?? "waiting"}
      />
      <p className="max-w-prose text-sm text-muted-foreground">
        Os planos são propostas da equipa. Ficam guardados só neste aparelho. Os
        dados não provam que ter um plano registado ajude a ficar: serve para
        ninguém ficar esquecido.
      </p>
    </div>
  )
}

function Groups({
  people,
  tables,
  initialStage,
}: {
  people: Journey[]
  tables: Props
  initialStage: Stage
}) {
  const [region, setRegion] = useState("all")
  const [entity, setEntity] = useState("all")
  const [stage, setStage] = useState<Stage>(initialStage)
  const [barrier, setBarrier] = useState<Barrier>("experiencia")

  const regions = [...new Set(people.map((p) => p.region))].sort()
  const shown = people.filter(
    (p) =>
      (region === "all" || p.region === region) &&
      (entity === "all" || p.entityId === entity)
  )
  const count = (b: Barrier, s: Stage) =>
    shown.filter((p) => p.barrier === b && p.stage === s).length
  const max = Math.max(
    1,
    ...BARRIERS.flatMap((b) => STAGES.map((s) => count(b, s)))
  )
  const group = shown.filter((p) => p.barrier === barrier && p.stage === stage)
  const without = group.filter((p) => !p.hasPlan).length
  const steps = planFor(
    barrier,
    stage,
    region === "all" ? null : region,
    tables.empresas_parceiras
  )

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <Select
          label="Região"
          value={region}
          onValueChange={setRegion}
          options={[
            { value: "all", label: "Todas as regiões" },
            ...regions.map((r) => ({ value: r, label: r })),
          ]}
        />
        <Select
          label="Entidade"
          value={entity}
          onValueChange={setEntity}
          options={[
            { value: "all", label: "Todas as entidades" },
            ...tables.entidades_sociais.map((e) => ({
              value: e.id,
              label: shortName(e),
            })),
          ]}
        />
      </div>

      <section
        aria-labelledby="map-title"
        className="rounded-2xl bg-card p-5 sm:p-7"
      >
        <h2 id="map-title" className="text-xl font-semibold">
          Onde estão as pessoas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolhe uma etapa e uma barreira para abrir o plano.
        </p>
        <div
          role="radiogroup"
          aria-label="Etapa"
          className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4"
        >
          {STAGES.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer flex-col rounded-xl border p-4 has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name="stage"
                className="sr-only"
                checked={stage === s}
                onChange={() => setStage(s)}
              />
              <span className="font-heading text-3xl font-semibold tracking-tight">
                {integer(shown.filter((p) => p.stage === s).length)}
              </span>
              <span className="text-sm">{STAGE_LABEL[s]}</span>
            </label>
          ))}
        </div>
        <div
          role="radiogroup"
          aria-label="Barreira"
          className="mt-5 flex flex-col gap-2"
        >
          {BARRIERS.map((b) => {
            const n = count(b, stage)
            return (
              <label
                key={b}
                className="grid min-h-12 cursor-pointer grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-x-4 rounded-xl border px-4 py-2 has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring sm:grid-cols-[11rem_minmax(0,1fr)_3.5rem]"
              >
                <span className="flex items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="barrier"
                    className="size-4 shrink-0 accent-primary"
                    checked={barrier === b}
                    onChange={() => setBarrier(b)}
                  />
                  {BARRIER_LABEL[b]}
                </span>
                <span
                  aria-hidden="true"
                  className="order-last col-span-2 mt-1 h-3 rounded-e bg-muted sm:order-none sm:col-span-1 sm:mt-0"
                >
                  <span
                    className={cn(
                      "block h-full rounded-e transition-[width] duration-500 motion-reduce:transition-none",
                      barrier === b ? "bg-chart-2" : "bg-chart-1"
                    )}
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </span>
                <span className="text-end font-semibold tabular-nums">
                  {integer(n)}
                </span>
              </label>
            )
          })}
        </div>
      </section>

      <section
        aria-labelledby="plan-title"
        className="rounded-2xl bg-card p-5 sm:p-7"
      >
        <h2 id="plan-title" className="text-xl font-semibold">
          {BARRIER_LABEL[barrier]}: {STAGE_LABEL[stage].toLowerCase()}
        </h2>
        {group.length === 0 ? (
          <EmptyState
            title="Ninguém neste grupo"
            description="Muda a região, a entidade, a etapa ou a barreira."
          />
        ) : (
          <>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
              {integer(group.length)}{" "}
              {group.length === 1 ? "pessoa" : "pessoas"}
              {region !== "all" && `, região ${region}`}. {integer(without)} sem
              nenhum plano registado. Este plano é o guia do grupo; para um caso
              concreto, usa o Plano de Integração.
            </p>
            <PlanView
              key={`${barrier}-${stage}-${region}-${entity}`}
              planKey={`group:${barrier}:${stage}:${region}:${entity}`}
              steps={steps}
            />
          </>
        )}
      </section>
    </>
  )
}
