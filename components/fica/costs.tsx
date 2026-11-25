"use client"

import { Warning } from "@phosphor-icons/react"
import { useMemo } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { euros, inHundred, millionEuros, percent } from "@/lib/fica/format"
import {
  entityCosts,
  entitySummaries,
  spendingTotals,
} from "@/lib/fica/metrics"
import { useTables, type Tables } from "@/lib/fica/store"
import { cn } from "@/lib/utils"
import { LoadError, Loading, Numbers, ScreenHeader } from "./screen"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "acoes_formacao",
  "custos_formacao",
  "recursos_acompanhamento",
] as const

export function Costs() {
  const data = useTables(TABLES)
  return (
    <>
      <ScreenHeader title="Quanto custa cada emprego?" />
      {data.status === "loading" && <Loading />}
      {data.status === "error" && <LoadError retry={data.retry} />}
      {data.status === "ready" && <Content {...data.tables} />}
    </>
  )
}

function Content({
  entidades_sociais: entities,
  participantes: participants,
  colocacoes: placements,
  acoes_formacao: actions,
  custos_formacao: trainingCosts,
  recursos_acompanhamento: resources,
}: Pick<Tables, (typeof TABLES)[number]>) {
  const rows = useMemo(() => {
    const summaries = entitySummaries(entities, participants, placements)
    const costs = entityCosts(
      summaries,
      participants,
      actions,
      trainingCosts,
      resources
    )
    return summaries
      .map(({ id, name }) => ({ id, name, ...costs.get(id)! }))
      .sort((a, b) => a.perDurable - b.perDurable)
  }, [entities, participants, placements, actions, trainingCosts, resources])
  const totals = useMemo(
    () => spendingTotals(actions, trainingCosts, resources),
    [actions, trainingCosts, resources]
  )

  if (rows.length === 0)
    return <EmptyState title="Ainda não há dados para mostrar" />

  const max = Math.max(...rows.flatMap((r) => [r.perPlacement, r.perDurable]))
  const gap = (r: (typeof rows)[number]) => r.perDurable - r.perPlacement
  const widest = rows.reduce((a, b) => (gap(b) > gap(a) ? b : a))
  const narrowest = rows.reduce((a, b) => (gap(b) < gap(a) ? b : a))
  const trainingShare = totals.training / (totals.training + totals.support)

  return (
    <div className="mt-5 flex flex-col gap-6">
      <div className="max-w-prose text-xl text-balance">
        <p>
          {widest.name}: cada emprego custa {euros(widest.perPlacement)}.{" "}
          <strong className="font-semibold">
            Cada emprego que dura 6 meses custa {euros(widest.perDurable)}.
          </strong>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {narrowest.name}, onde quase todas ficam:{" "}
          {euros(narrowest.perPlacement)} e {euros(narrowest.perDurable)}.
        </p>
      </div>

      <section
        aria-labelledby="costs-title"
        className="rounded-2xl bg-card p-4 sm:p-6"
      >
        <h2 id="costs-title" className="text-xl font-semibold">
          As 8 entidades
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-6 rounded-e bg-chart-3" />
            Cada emprego
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-6 rounded-e bg-chart-1" />
            Cada emprego que dura 6 meses
          </li>
        </ul>
        <ul className="mt-5 flex flex-col gap-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="grid gap-x-4 gap-y-1 sm:grid-cols-[6rem_minmax(0,1fr)]"
            >
              <span
                className={cn("text-sm", row === widest && "font-semibold")}
              >
                {row.name}
              </span>
              <div className="flex flex-col gap-0.5">
                <Bar
                  label="Cada emprego"
                  value={row.perPlacement}
                  max={max}
                  className="bg-chart-3"
                />
                <Bar
                  label="Cada emprego que dura 6 meses"
                  value={row.perDurable}
                  max={max}
                  className="bg-chart-1"
                  strong
                />
                {row === widest && (
                  <Attention>Maior diferença entre os dois custos</Attention>
                )}
              </div>
            </li>
          ))}
        </ul>
        <Numbers summary="Como se faz a conta">
          <p className="max-w-prose">
            Custo por pessoa = apoio médio da entidade + formação média de quem
            entrou até 04/07/2024. Divide-se pela percentagem de pessoas
            colocadas, ou pela percentagem que fica 180 dias ou mais.
          </p>
        </Numbers>
      </section>

      <section
        aria-labelledby="spending-title"
        className="rounded-2xl bg-card p-4 sm:p-6"
      >
        <h2 id="spending-title" className="text-xl font-semibold">
          Em cada 100 € gastos, {inHundred(trainingShare)} € são para formação e{" "}
          {inHundred(1 - trainingShare)} € para apoio
        </h2>
        <dl className="mt-5 flex flex-col gap-5">
          <Spending
            term="Formação"
            value={totals.training}
            max={totals.training}
            part={totals.dropout}
          >
            <Attention>
              {millionEuros(totals.dropout)} em formações com desistência (
              {percent(totals.dropoutRate)})
            </Attention>
          </Spending>
          <Spending term="Apoio" value={totals.support} max={totals.training} />
        </dl>
        <p className="mt-5 max-w-prose text-sm text-muted-foreground">
          Estes dados não mostram se a formação ajuda as pessoas a ficar, nem
          provam que não ajuda.
        </p>
      </section>
    </div>
  )
}

function Bar({
  label,
  value,
  max,
  className,
  strong,
}: {
  label: string
  value: number
  max: number
  className: string
  strong?: boolean
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2">
      <span className="h-4" aria-hidden="true">
        <span
          className={cn("block h-full rounded-e", className)}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </span>
      <span
        className={cn(
          "text-end text-sm tabular-nums",
          strong && "font-semibold"
        )}
      >
        <span className="sr-only">{label}: </span>
        {euros(value)}
      </span>
    </div>
  )
}

function Spending({
  term,
  value,
  max,
  part = 0,
  children,
}: {
  term: string
  value: number
  max: number
  part?: number
  children?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <dt className="text-sm">{term}</dt>
        <dd className="text-2xl font-semibold tracking-tight">
          {millionEuros(value)}
        </dd>
      </div>
      <div
        aria-hidden="true"
        className="mt-1 flex h-5 gap-0.5"
        style={{ width: `${(value / max) * 100}%` }}
      >
        <span
          className="h-full bg-chart-1 last:rounded-e"
          style={{ flexGrow: value - part }}
        />
        {part > 0 && (
          <span
            className="h-full rounded-e bg-chart-2"
            style={{ flexGrow: part }}
          />
        )}
      </div>
      {children}
    </div>
  )
}

function Attention({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-start gap-1.5 text-sm text-warning">
      <Warning
        weight="fill"
        className="mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
      <span>{children}</span>
    </p>
  )
}
