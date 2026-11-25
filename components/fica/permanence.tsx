"use client"

import { useMemo, useState } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { Segmented } from "@/components/ui/segmented-control"
import { REFERENCE_DATE } from "@/lib/fica/dates"
import { date, integer, percent } from "@/lib/fica/format"
import { label } from "@/lib/fica/labels"
import {
  applyFilters,
  continuity,
  exitMedian,
  exitsByMonth,
  HORIZONS,
  kaplanMeier,
  restrictedMean,
  retentionAt,
  riskTable,
  SMALL_GROUP,
  toObservedJobs,
  type Job,
} from "@/lib/fica/retention"
import { useFica, useTables, type Tables } from "@/lib/fica/store"
import { Columns, SurvivalChart, type Series } from "./charts"
import { ContractTable } from "./contracts"
import {
  DataTable,
  FilterBar,
  Hint,
  Kpi,
  Note,
  PageHeader,
  Panel,
  RateKpi,
  Ready,
  Split,
} from "./kit"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "empresas_parceiras",
] as const

export function Permanence() {
  const data = useTables(TABLES)
  return (
    <>
      <PageHeader
        title="Permanência no Emprego"
        lead="Uma colocação não é, por si só, uma integração que dura. Aqui vê-se quanto tempo dura, e para quem."
      />
      <Ready data={data}>{(tables) => <Content {...tables} />}</Ready>
    </>
  )
}

function Content(t: Pick<Tables, (typeof TABLES)[number]>) {
  const filters = useFica((s) => s.filters)
  const all = useMemo(
    () => toObservedJobs(t.participantes, t.colocacoes),
    [t.participantes, t.colocacoes]
  )
  const jobs = useMemo(() => applyFilters(all, filters), [all, filters])
  return (
    <>
      <FilterBar
        entities={t.entidades_sociais}
        companies={t.empresas_parceiras}
      />
      <p aria-live="polite" className="-mt-3 text-sm text-muted-foreground">
        {integer(jobs.length)} de {integer(all.length)} colocações válidas.
        Contado até {date(REFERENCE_DATE)}.
        <Hint>
          Não há filtro por duração do emprego: escolher só os empregos longos
          faria a permanência parecer maior. Em vez disso, filtra-se pelo tempo
          que cada colocação já teve para ser observada.
        </Hint>
      </p>
      {jobs.length === 0 ? (
        <EmptyState
          title="Nenhuma colocação com estes filtros"
          description="Limpa os filtros ou muda um deles."
        />
      ) : (
        <Results jobs={jobs} contract={filters.contract} />
      )}
    </>
  )
}

function Results({ jobs, contract }: { jobs: Job[]; contract: string }) {
  const km = useMemo(() => kaplanMeier(jobs, 730), [jobs])
  const rates = HORIZONS.map((d) => retentionAt(jobs, d))
  const exits = jobs.filter((j) => j.ended)
  const mean = restrictedMean(jobs)
  const leaverMedian = exitMedian(jobs)
  const { counts, busiest } = exitsByMonth(jobs, 24)
  const later = counts.filter((c) => c.month > 12 && c.exits > 0)

  return (
    <>
      {jobs.length < SMALL_GROUP && (
        <Note tone="warning">
          Há menos de {SMALL_GROUP} colocações com estes filtros. Os valores
          mudam muito com uma só pessoa e não servem para comparar.
        </Note>
      )}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi value={integer(jobs.length)} label="Colocações válidas" />
        <RateKpi rate={rates[0]} label="Ficaram 3 meses" />
        <RateKpi rate={rates[1]} label="Ficaram 6 meses" strong />
        <RateKpi rate={rates[2]} label="Ficaram 12 meses" />
        <Kpi
          value={integer(exits.length)}
          label="Saídas registadas"
          detail={percent(exits.length / jobs.length)}
        />
        <Kpi
          value={km.median === null ? "—" : `${integer(km.median)} dias`}
          label="Tempo mediano no emprego"
          detail={
            km.median === null
              ? "mais de metade ainda não saiu"
              : "metade sai até aqui (estimado)"
          }
          hint="Conta também quem ainda está empregado, com o método de Kaplan-Meier."
        />
        <Kpi
          value={mean === null ? "—" : `${integer(mean)} dias`}
          label="Tempo médio no 1.º ano"
          detail={
            mean === null
              ? "ninguém foi observado 12 meses"
              : "em 365 dias possíveis (estimado)"
          }
          hint={`É a área por baixo da curva até aos 365 dias. Contar só quem saiu${leaverMedian === null ? "" : ` (mediana de ${leaverMedian.toLocaleString("pt-PT")} dias)`} deixaria de fora quem ficou.`}
        />
        <Kpi
          value={busiest ? `${busiest.month}.º mês` : "—"}
          label="Mês com mais saídas"
          detail={busiest ? `${integer(busiest.exits)} saídas` : "sem saídas"}
        />
      </dl>
      <p className="-mt-3 max-w-prose text-xs text-muted-foreground">
        As percentagens dos 3, 6 e 12 meses usam grupos diferentes: só conta
        quem começou há tempo suficiente. Não se lê como uma descida das mesmas
        pessoas. Para isso, vê a curva.
      </p>

      <Curve jobs={jobs} contract={contract} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          id="exits"
          title="Em que mês do emprego saem"
          text={
            busiest
              ? `O ${busiest.month}.º mês tem mais saídas: ${integer(busiest.exits)}. Um mês são 30 dias desde o início.`
              : "Não há saídas com estes filtros."
          }
        >
          <Columns
            unit="saídas"
            highlight={busiest ? `${busiest.month}.º` : undefined}
            caption={`Saídas por mês de emprego: ${counts
              .slice(0, 12)
              .map((c) => `${c.month}.º mês ${c.exits}`)
              .join(", ")}`}
            data={counts.slice(0, 12).map((c) => ({
              label: `${c.month}.º`,
              value: c.exits,
            }))}
          />
          {later.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Depois do 12.º mês há mais{" "}
              {integer(later.reduce((n, c) => n + c.exits, 0))} saídas.
            </p>
          )}
        </Panel>
        {contract === "all" ? (
          <Panel id="contracts" title="Comparar contratos">
            <ContractTable jobs={jobs} />
          </Panel>
        ) : (
          <Panel
            id="contracts"
            title={`Só contratos: ${label(contract).toLowerCase()}`}
          >
            <p className="text-sm">
              Para comparar os contratos, escolhe &quot;Todos os
              contratos&quot;.
            </p>
          </Panel>
        )}
      </div>

      <Continuity jobs={jobs} />
    </>
  )
}

type View = "total" | "split"

function Curve({ jobs, contract }: { jobs: Job[]; contract: string }) {
  const [view, setView] = useState<View>("split")
  const split = contract === "all" && view === "split"
  const series: Series[] = split
    ? [
        {
          key: "permanente",
          name: "Permanente",
          ink: "var(--chart-1)",
          jobs: jobs.filter((j) => j.contract === "permanente"),
        },
        {
          key: "temporario",
          name: "Temporário",
          ink: "var(--chart-2)",
          dash: "7 4",
          jobs: jobs.filter((j) => j.contract === "temporario"),
        },
      ]
    : [
        {
          key: "total",
          name: contract === "all" ? "Todos os contratos" : label(contract),
          ink: contract === "temporario" ? "var(--chart-2)" : "var(--chart-1)",
          jobs,
        },
      ]
  const risk = riskTable(jobs, [0, 90, 180, 270, 365])
  return (
    <Panel
      id="curve"
      title="Curva de permanência (Kaplan-Meier)"
      text="Esta análise permite acompanhar a permanência no emprego mesmo quando nem todas as colocações tiveram tempo suficiente de observação."
      aside={
        contract === "all" && (
          <Segmented
            label="O que mostrar na curva"
            size="md"
            className="h-11"
            value={view}
            onValueChange={setView}
            options={[
              { value: "split", label: "Por contrato" },
              { value: "total", label: "Total, com margem" },
            ]}
          />
        )
      }
    >
      <SurvivalChart series={series} />
      {!split && (
        <p className="mt-2 text-xs text-muted-foreground">
          A faixa é o intervalo de 95%. Os traços verticais mostram as semanas
          em que há casos censurados.
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-120 text-sm">
          <caption className="pb-2 text-start font-medium">
            Quantos casos há em cada momento
            <Hint>
              Censurado quer dizer que a pessoa ainda estava empregada quando os
              dados acabaram. Não é uma saída nem um sucesso: só se sabe até
              ali.
            </Hint>
          </caption>
          <thead>
            <tr className="border-b text-muted-foreground">
              <th scope="col" className="py-2 text-start font-medium">
                Dia
              </th>
              {risk.map((r) => (
                <th
                  key={r.day}
                  scope="col"
                  className="py-2 text-end font-medium"
                >
                  {r.day === 0 ? "início" : r.day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["Ainda acompanhados", "atRisk"],
                ["Já saíram", "ended"],
                ["Censurados antes", "censored"],
              ] as const
            ).map(([name, key]) => (
              <tr key={key} className="border-b last:border-0">
                <th scope="row" className="py-2 text-start font-normal">
                  {name}
                </th>
                {risk.map((r) => (
                  <td key={r.day} className="py-2 text-end tabular-nums">
                    {integer(r[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function Continuity({ jobs }: { jobs: Job[] }) {
  const c = continuity(jobs)
  const reasons = [
    ...Map.groupBy(
      jobs.filter((j) => j.ended),
      (j) => j.reason ?? ""
    ),
  ].map(([reason, rows]) => ({
    reason: reason ? label(reason) : "Sem motivo registado",
    count: rows.length,
  }))
  const exits = jobs.filter((j) => j.ended).length
  return (
    <Panel
      id="continuity"
      title="Sair da empresa não é sempre perder o emprego"
      text="A app separa quatro situações: a mesma colocação, a mudança de empresa, a saída sem nova colocação registada e os dados que não chegam para concluir."
    >
      <Split
        parts={[
          {
            label: "Mesma colocação, há 6 meses ou mais",
            value: c.same,
            className: "bg-chart-1",
          },
          {
            label: "Mesma colocação, há menos de 6 meses (cedo para concluir)",
            value: c.recent,
            className: "bg-chart-1/45",
          },
          {
            label: "Saiu e declarou mudança de emprego",
            value: c.moved,
            className: "bg-foreground/70",
          },
          {
            label: "Saiu, sem nova colocação registada",
            value: c.left,
            className: "bg-chart-2",
          },
          {
            label: "Saiu sem motivo registado (dados insuficientes)",
            value: c.unknown,
            className: "bg-chart-3",
          },
        ]}
      />
      <div className="mt-5 flex flex-col gap-4">
        <Note tone="warning">
          Os ficheiros têm no máximo uma colocação por pessoa. A mudança de
          empresa é só o motivo declarado: não se vê para onde a pessoa foi. Por
          isso, a continuidade no mercado de trabalho não pode ser medida hoje.
          A app fica pronta para isso quando houver segundas colocações.
        </Note>
        {reasons.length > 0 && (
          <DataTable
            caption="Motivos de saída registados"
            rows={reasons}
            rowKey={(r) => r.reason}
            initialSort="count"
            filename="rj-connect-motivos-de-saida"
            columns={[
              {
                key: "reason",
                title: "Motivo registado",
                value: (r) => r.reason,
              },
              {
                key: "count",
                title: "Saídas",
                value: (r) => r.count,
                cell: (r) => integer(r.count),
              },
              {
                key: "share",
                title: "Parte das saídas",
                value: (r) => percent(r.count / exits),
              },
            ]}
          />
        )}
      </div>
    </Panel>
  )
}
