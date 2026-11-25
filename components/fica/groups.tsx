"use client"

import { ArrowRight, Star, Warning } from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo } from "react"
import {
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { REFERENCE_DATE } from "@/lib/fica/dates"
import { date, integer, percent } from "@/lib/fica/format"
import { companyName, entitySummaries, shortName } from "@/lib/fica/metrics"
import {
  applyFilters,
  exitsByMonth,
  groupSummary,
  SMALL_GROUP,
  toObservedJobs,
  type Job,
  type Rate,
} from "@/lib/fica/retention"
import { useFica, useTables, type Tables } from "@/lib/fica/store"
import { cn } from "@/lib/utils"
import { Columns, SurvivalChart } from "./charts"
import { EntityRanking } from "./entity-ranking"
import {
  DataTable,
  Drill,
  FilterBar,
  interval,
  Note,
  PageHeader,
  Panel,
  Ready,
  type Column,
} from "./kit"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "empresas_parceiras",
] as const

export function Groups() {
  const data = useTables(TABLES)
  return (
    <>
      <PageHeader
        title="Entidades e Empresas"
        lead="Mais colocações não significam necessariamente melhores resultados de permanência."
      />
      <Ready data={data}>{(tables) => <Content {...tables} />}</Ready>
    </>
  )
}

type Summary = ReturnType<typeof groupSummary>
type Row = Summary & {
  id: string
  name: string
  people: number
  placedRate: number
}

const rateColumn = <R extends Summary>(
  key: "three" | "six" | "twelve",
  title: string
): Column<R> => ({
  key,
  title,
  value: (r) => (r[key].eligible ? r[key].rate : -1),
  cell: (r) => <RateCell rate={r[key]} />,
})

function RateCell({ rate }: { rate: Rate }) {
  if (rate.eligible === 0) return <>—</>
  return (
    <span title={interval(rate)}>
      {percent(rate.rate)}{" "}
      <span className="text-xs text-muted-foreground">
        ({integer(rate.eligible)})
      </span>
      {rate.eligible < SMALL_GROUP && (
        <span className="block text-xs">poucos casos</span>
      )}
    </span>
  )
}

const sharedColumns = <R extends Summary>(): Column<R>[] => [
  {
    key: "jobs",
    title: "Colocações",
    value: (r) => r.jobs,
    cell: (r) => integer(r.jobs),
  },
  rateColumn("three", "3 meses"),
  rateColumn("six", "6 meses"),
  rateColumn("twelve", "12 meses"),
  {
    key: "temporaryRate",
    title: "Temporários",
    value: (r) => r.temporaryRate,
    cell: (r) => (r.jobs ? percent(r.temporaryRate) : "—"),
  },
  {
    key: "exits",
    title: "Saídas",
    value: (r) => r.exits,
    cell: (r) => integer(r.exits),
  },
  {
    key: "exitMedian",
    title: "Dia da saída",
    value: (r) => r.exitMedian ?? -1,
    cell: (r) => (r.exitMedian === null ? "—" : integer(r.exitMedian)),
  },
]

function Content(t: Pick<Tables, (typeof TABLES)[number]>) {
  const filters = useFica((s) => s.filters)
  const all = useMemo(
    () => toObservedJobs(t.participantes, t.colocacoes),
    [t.participantes, t.colocacoes]
  )
  const jobs = useMemo(() => applyFilters(all, filters), [all, filters])

  const summaries = useMemo(
    () => entitySummaries(t.entidades_sociais, t.participantes, t.colocacoes),
    [t.entidades_sociais, t.participantes, t.colocacoes]
  )
  const entityRows: Row[] = t.entidades_sociais
    .filter((e) => filters.entity === "all" || e.id === filters.entity)
    .map((e) => {
      const people = t.participantes.filter(
        (p) => p.entidade_social_id === e.id
      ).length
      return {
        id: e.id,
        name: shortName(e),
        people,
        placedRate: people
          ? all.filter((j) => j.entityId === e.id).length / people
          : 0,
        ...groupSummary(jobs.filter((j) => j.entityId === e.id)),
      }
    })
  const companyRows = [...Map.groupBy(jobs, (j) => j.companyId)].map(
    ([id, rows]) => ({
      id,
      name: companyName(t.empresas_parceiras, id),
      region: t.empresas_parceiras.find((c) => c.id === id)?.regiao ?? "—",
      ...groupSummary(rows),
    })
  )

  return (
    <>
      <FilterBar
        entities={t.entidades_sociais}
        companies={t.empresas_parceiras}
      />
      <p aria-live="polite" className="-mt-3 text-sm text-muted-foreground">
        {integer(jobs.length)} de {integer(all.length)} colocações válidas.
        Contado até {date(REFERENCE_DATE)}. Grupos com menos de {SMALL_GROUP}{" "}
        casos ficam assinalados e no fim.
      </p>

      <Contrast all={all} tables={t} />

      <Panel
        id="quantity"
        title="Quantidade e estabilidade"
        text="Cada ponto é uma entidade. Mais à direita, mais colocações com 6 meses de observação. Mais acima, mais empregos que duraram 6 meses. A linha vertical é o intervalo de 95%."
      >
        <Quantity rows={entityRows} />
      </Panel>

      <Panel
        id="entities"
        title="Por entidade"
        text="Carrega no nome para ver a curva de permanência. Entre parênteses, os casos com tempo de observação suficiente; o intervalo de 95% aparece ao passar o rato. O dia da saída é a mediana, só entre quem saiu. Quando os intervalos se cruzam, não há ordem definitiva."
      >
        <DataTable
          caption="Resultados por entidade"
          rows={entityRows}
          rowKey={(r) => r.id}
          count={(r) => r.jobs}
          initialSort="six"
          filename="rj-connect-entidades"
          columns={[
            {
              key: "name",
              title: "Entidade",
              value: (r) => `${r.id} ${r.name}`,
              cell: (r) => (
                <Drill filters={{ entity: r.id }}>
                  {r.id} {r.name}
                </Drill>
              ),
            },
            {
              key: "people",
              title: "Participantes",
              value: (r) => r.people,
              cell: (r) => integer(r.people),
            },
            {
              key: "placedRate",
              title: "Com colocação",
              value: (r) => r.placedRate,
              cell: (r) => percent(r.placedRate),
            },
            ...sharedColumns<Row>(),
          ]}
        />
      </Panel>

      <EntityExits jobs={jobs} entity={filters.entity} />

      <Panel
        id="companies"
        title="Por empresa"
        text="Não há sinal de que a empresa, por si só, explique a permanência: em todo o programa, as diferenças entre empresas cabem no acaso (p = 0,20)."
      >
        <DataTable
          caption="Resultados por empresa"
          rows={companyRows}
          rowKey={(r) => r.id}
          count={(r) => r.jobs}
          initialSort="jobs"
          filename="rj-connect-empresas"
          columns={[
            {
              key: "name",
              title: "Empresa",
              value: (r) => r.name,
              cell: (r) => <Drill filters={{ company: r.id }}>{r.name}</Drill>,
            },
            { key: "region", title: "Região", value: (r) => r.region },
            ...sharedColumns<(typeof companyRows)[number]>(),
          ]}
        />
      </Panel>

      <div>
        <EntityRanking summaries={summaries} />
        <p className="mt-2 max-w-prose text-xs text-muted-foreground">
          Aqui a base é outra: todas as pessoas que entraram há 18 meses ou
          mais, colocadas ou não. Por isso os valores não são iguais aos da
          tabela. Não muda com os filtros.
        </p>
      </div>

      <section aria-labelledby="tools" className="print:hidden">
        <h2 id="tools" className="text-lg font-semibold">
          Trabalhar com uma entidade ou uma empresa
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            {
              href: "/empresas",
              title: "Empresas",
              text: "O que pode estar mal, ouvir os dois lados e combinar medidas.",
            },
            {
              href: "/consulta/E03",
              title: "Consulta a uma entidade",
              text: "Sinais, perguntas e o próximo passo.",
            },
            {
              href: "/custos",
              title: "Custos",
              text: "Quanto custa cada colocação e cada emprego que dura.",
            },
          ].map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="flex h-full flex-col gap-1 rounded-2xl border bg-card p-5 hover:border-primary"
              >
                <span className="flex items-center justify-between font-semibold">
                  {tool.title}
                  <ArrowRight
                    weight="bold"
                    className="size-4 text-primary rtl:rotate-180"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm text-muted-foreground">
                  {tool.text}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

/** Always the whole programme, so that the definition never moves. */
function Contrast({
  all,
  tables,
}: {
  all: Job[]
  tables: Pick<Tables, (typeof TABLES)[number]>
}) {
  const of = (id: string) => ({
    id,
    name: shortName(tables.entidades_sociais.find((e) => e.id === id)!),
    ...groupSummary(all.filter((j) => j.entityId === id)),
  })
  const cards = [of("E03"), of("E07")]
  return (
    <section
      aria-label="Duas entidades muito diferentes"
      className="grid gap-4 lg:grid-cols-2"
    >
      {cards.map((c, i) => {
        const CardIcon = i === 0 ? Warning : Star
        return (
          <article
            key={c.id}
            className={cn(
              "rounded-2xl border bg-card p-6",
              i === 0 ? "border-chart-2" : "border-chart-1"
            )}
          >
            <h2 className="flex items-center gap-2 font-semibold">
              <CardIcon
                weight="fill"
                className={cn(
                  "size-5",
                  i === 0 ? "text-chart-2" : "text-primary"
                )}
                aria-hidden="true"
              />
              {c.id} {c.name}
            </h2>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
              <span className="font-heading text-4xl font-semibold tracking-tight">
                {integer(c.six.eligible)} → {integer(c.six.stayed)}
              </span>
              <span className="text-xl font-semibold">
                {percent(c.six.rate)}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Intervalo de 95%: {percent(c.six.low)} a {percent(c.six.high)}.{" "}
              {percent(c.temporaryRate)} dos contratos são temporários.
            </p>
          </article>
        )
      })}
      <p className="max-w-prose text-sm text-muted-foreground lg:col-span-2">
        O primeiro número são as colocações válidas que começaram pelo menos 180
        dias antes de {date(REFERENCE_DATE)}. O segundo são as que duraram 180
        dias ou mais. Ao todo, a E03 tem {integer(cards[0].jobs)} colocações
        válidas e a E07 tem {integer(cards[1].jobs)}: as mais recentes ainda não
        têm tempo de observação. Este quadro não muda com os filtros.
      </p>
    </section>
  )
}

function Quantity({ rows }: { rows: Row[] }) {
  const points = rows
    .filter((r) => r.six.eligible >= SMALL_GROUP)
    .map((r) => ({
      id: r.id,
      name: r.name,
      x: r.six.eligible,
      y: r.six.rate,
      low: r.six.low,
      high: r.six.high,
      text: interval(r.six),
    }))
    .sort((a, b) => a.x - b.x)
  if (points.length === 0)
    return (
      <p className="text-sm">
        Nenhuma entidade tem {SMALL_GROUP} casos com estes filtros.
      </p>
    )
  const tick = { fill: "var(--muted-foreground)" }
  return (
    <div
      role="img"
      aria-label={points
        .map((p) => `${p.id}: ${p.x} colocações, ${percent(p.y)}`)
        .join(". ")}
    >
      <ChartContainer config={{}} className="aspect-auto h-80 w-full">
        <ScatterChart
          margin={{ top: 16, right: 24, bottom: 20, left: 0 }}
          accessibilityLayer={false}
        >
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, (max: number) => Math.ceil((max + 20) / 100) * 100]}
            tick={tick}
            tickLine={false}
            tickFormatter={integer}
            label={{
              value: "Colocações com 6 meses de observação",
              position: "bottom",
              fill: "var(--muted-foreground)",
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(v: number) => `${v * 100}%`}
            tick={tick}
            width={44}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as
                (typeof points)[number] | undefined
              return active && p ? (
                <div className="rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-md">
                  <p className="font-medium">
                    {p.id} {p.name}: {percent(p.y)}
                  </p>
                  <p>{p.text}</p>
                </div>
              ) : null
            }}
          />
          {points.map((p) => (
            <ReferenceLine
              key={p.id}
              segment={[
                { x: p.x, y: p.low },
                { x: p.x, y: p.high },
              ]}
              stroke="var(--chart-1)"
              strokeOpacity={0.5}
              strokeWidth={2}
            />
          ))}
          {/* Labels go above or below the interval, in turns, so they never touch. */}
          {points.map((p, i) => (
            <ReferenceDot
              key={p.id}
              x={p.x}
              y={i % 2 ? p.high : p.low}
              r={0}
              label={{
                value: p.id,
                position: i % 2 ? "top" : "bottom",
                fill: "var(--foreground)",
                fontSize: 12,
              }}
            />
          ))}
          <Scatter
            data={points}
            fill="var(--chart-1)"
            isAnimationActive={false}
          />
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}

function EntityExits({ jobs, entity }: { jobs: Job[]; entity: string }) {
  const { counts, busiest } = exitsByMonth(jobs)
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel
        id="exits"
        title={
          entity === "all"
            ? "Evolução das saídas, todas as entidades"
            : `Evolução das saídas da ${entity}`
        }
        text={
          busiest
            ? `O ${busiest.month}.º mês de emprego tem mais saídas: ${integer(busiest.exits)}.`
            : "Não há saídas com estes filtros."
        }
      >
        <Columns
          unit="saídas"
          highlight={busiest ? `${busiest.month}.º` : undefined}
          caption={`Saídas por mês de emprego: ${counts.map((c) => `${c.month}.º ${c.exits}`).join(", ")}`}
          data={counts.map((c) => ({
            label: `${c.month}.º`,
            value: c.exits,
          }))}
        />
      </Panel>
      <Panel
        id="entity-curve"
        title={
          entity === "all"
            ? "Curva de todas as entidades"
            : `Curva da ${entity}`
        }
        text="Muda a entidade ou a empresa nos filtros para comparar."
      >
        {jobs.length > 0 ? (
          <SurvivalChart
            series={[
              {
                key: "total",
                name: entity === "all" ? "Todas" : entity,
                ink: "var(--chart-1)",
                jobs,
              },
            ]}
          />
        ) : (
          <Note>Sem colocações com estes filtros.</Note>
        )}
      </Panel>
    </div>
  )
}
