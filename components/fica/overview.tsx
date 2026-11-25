"use client"

import {
  ArrowRight,
  DownloadSimple,
  Lightbulb,
  Printer,
  Warning,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/action-button"
import { downloadCsv } from "@/lib/fica/csv"
import { REFERENCE_DATE } from "@/lib/fica/dates"
import { date, integer, percent } from "@/lib/fica/format"
import { BARRIER_LABEL, BARRIERS } from "@/lib/fica/journey"
import { shortName } from "@/lib/fica/metrics"
import { documentSupport, planStates } from "@/lib/fica/programme"
import {
  exitsByMonth,
  HORIZONS,
  retentionAt,
  timeline,
  toObservedJobs,
  type Job,
} from "@/lib/fica/retention"
import { activeJobs, expectedExits, toJobs } from "@/lib/fica/risk"
import { useTables, type Tables } from "@/lib/fica/store"
import { Columns, SurvivalChart } from "./charts"
import { ContractTable } from "./contracts"
import { Hundred } from "./hundred"
import {
  Bars,
  Drill,
  interval,
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
  "planos_acao",
] as const

const MONTHS = "jan fev mar abr mai jun jul ago set out nov dez".split(" ")
const monthLabel = (iso: string) =>
  `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(2, 4)}`

export function Overview() {
  const data = useTables(TABLES)
  return (
    <>
      <PageHeader title="Integração laboral" lead="Da colocação à permanência">
        {data.status === "ready" && (
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button
              size="md"
              variant="quiet"
              className="h-11"
              icon={Printer}
              onClick={() => window.print()}
            >
              Imprimir ou guardar PDF
            </Button>
            <ExportIndicators tables={data.tables} />
          </div>
        )}
      </PageHeader>
      <Ready data={data}>{(tables) => <Content {...tables} />}</Ready>
    </>
  )
}

type Props = Pick<Tables, (typeof TABLES)[number]>

function ExportIndicators({ tables }: { tables: Props }) {
  return (
    <Button
      size="md"
      className="h-11"
      icon={DownloadSimple}
      iconWeight="bold"
      onClick={() => {
        const jobs = toObservedJobs(tables.participantes, tables.colocacoes)
        downloadCsv("rj-connect-indicadores.csv", [
          ["Indicador", "Valor", "Casos", "IC 95% de", "IC 95% a"],
          ["Participantes", tables.participantes.length, "", "", ""],
          ["Colocações válidas", jobs.length, "", "", ""],
          [
            "Sem colocação válida",
            tables.participantes.length - jobs.length,
            "",
            "",
            "",
          ],
          ...(["all", "permanente", "temporario"] as const).flatMap((type) =>
            HORIZONS.map((days) => {
              const r = retentionAt(
                type === "all" ? jobs : jobs.filter((j) => j.contract === type),
                days
              )
              return [
                `Permanência aos ${Math.round(days / 30)} meses (${type === "all" ? "todos" : type})`,
                percent(r.rate),
                r.eligible,
                percent(r.low),
                percent(r.high),
              ]
            })
          ),
          ["Data de referência", date(REFERENCE_DATE), "", "", ""],
        ])
      }}
    >
      Exportar indicadores
    </Button>
  )
}

function Content(t: Props) {
  const jobs = useMemo(
    () => toObservedJobs(t.participantes, t.colocacoes),
    [t.participantes, t.colocacoes]
  )
  const rates = HORIZONS.map((d) => retentionAt(jobs, d))
  const withJob = jobs.length
  const people = t.participantes.length
  const starts = jobs.map((j) => j.start).sort()
  const months = timeline(jobs)

  return (
    <>
      <p className="-mt-4 text-sm text-muted-foreground">
        Colocações iniciadas entre {date(starts[0])} e{" "}
        {date(starts[starts.length - 1])}. Tudo é contado até{" "}
        {date(REFERENCE_DATE)}.
      </p>

      <Hundred jobs={jobs} />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi value={integer(people)} label="Participantes" />
        <Kpi
          value={integer(withJob)}
          label="Colocações válidas"
          hint="Colocações cuja data de fim não é anterior à de início. Cada pessoa tem no máximo uma nos ficheiros."
        />
        <Kpi
          value={integer(t.entidades_sociais.length)}
          label="Entidades sociais"
        />
        <Kpi
          value={integer(t.empresas_parceiras.length)}
          label="Empresas parceiras"
        />
        <Kpi value="2" label="Anos de dados" detail="2024 e 2025" />
      </dl>
      <dl className="grid gap-3 sm:grid-cols-3">
        <RateKpi rate={rates[0]} label="Ficaram 3 meses: permanência inicial" />
        <RateKpi
          strong
          rate={rates[1]}
          label="Ficaram 6 meses: estabilidade intermédia"
        />
        <RateKpi rate={rates[2]} label="Ficaram 12 meses: sustentabilidade" />
      </dl>
      <p className="-mt-3 max-w-prose text-xs text-muted-foreground">
        Cada período só conta as colocações que já tiveram tempo de lá chegar,
        por isso os três grupos são diferentes. Os intervalos são de 95%.
      </p>

      <blockquote className="rounded-2xl border-s-4 border-primary bg-card px-6 py-5 text-lg text-balance">
        Não basta conseguir um emprego. É fundamental compreender se essa
        oportunidade se transforma numa integração profissional sustentável.
      </blockquote>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          id="curve"
          title="O emprego dura?"
          text="Parte estimada das colocações que ainda dura, dia a dia, por contrato."
          aside={<More href="/permanencia">Explorar a permanência</More>}
        >
          <SurvivalChart
            series={[
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
            ]}
          />
        </Panel>
        <Panel id="contracts" title="Permanente e temporário">
          <ContractTable jobs={jobs} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="placed" title="Com e sem colocação válida">
          <Split
            parts={[
              {
                label: "Com colocação válida",
                value: withJob,
                className: "bg-chart-1",
              },
              {
                label: "Sem colocação válida",
                value: people - withJob,
                className: "bg-chart-3",
              },
            ]}
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Sem colocação válida registada não quer dizer desempregado. A pessoa
            pode trabalhar sem que o programa o tenha registado.
          </p>
        </Panel>
        <Panel
          id="timeline"
          title="Colocações por mês de início"
          text={`Entre ${integer(Math.min(...months.map((m) => m.placements)))} e ${integer(Math.max(...months.map((m) => m.placements)))} por mês.`}
        >
          <Columns
            caption={`Colocações por mês: ${months.map((m) => `${monthLabel(m.month)} ${m.placements}`).join(", ")}`}
            unit="colocações"
            data={months.map((m) => ({
              label: monthLabel(m.month),
              value: m.placements,
            }))}
          />
        </Panel>
      </div>

      <Discoveries jobs={jobs} />

      <div className="grid gap-6 lg:grid-cols-2">
        <EntityResults jobs={jobs} tables={t} />
        <Panel
          id="barriers"
          title="Barreiras à integração"
          text="Cada participante tem uma barreira principal registada."
          aside={<More href="/participantes">Ver intervenções</More>}
        >
          <Bars
            rows={BARRIERS.map((b) => {
              const n = t.participantes.filter(
                (p) => p.barreiras_emprego === b
              ).length
              return {
                id: b,
                label: BARRIER_LABEL[b],
                value: n,
                text: `${integer(n)} (${percent(n / people)})`,
              }
            })}
          />
        </Panel>
      </div>

      <Alerts tables={t} jobs={jobs} />

      <p className="py-4 text-center font-heading text-xl font-semibold text-balance">
        Não basta arranjar emprego a alguém. A nossa aplicação mostra se esse
        emprego dura, onde se perde e quando agir.
      </p>
    </>
  )
}

function More({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline print:hidden"
    >
      {children}
      <ArrowRight
        weight="bold"
        className="size-4 rtl:rotate-180"
        aria-hidden="true"
      />
    </Link>
  )
}

function Discoveries({ jobs }: { jobs: Job[] }) {
  const six = retentionAt(jobs, 180)
  const by = (type: string) =>
    retentionAt(
      jobs.filter((j) => j.contract === type),
      180
    )
  const of = (id: string) =>
    retentionAt(
      jobs.filter((j) => j.entityId === id),
      180
    )
  const e03 = of("E03")
  const e07 = of("E07")
  const { busiest } = exitsByMonth(jobs)
  const items = [
    {
      title: `${integer(six.eligible - six.stayed)} empregos acabaram antes dos 6 meses`,
      text: `Em ${integer(six.eligible)} colocações observadas 6 meses ou mais, ${integer(six.stayed)} mantiveram-se (${percent(six.rate)}).`,
      href: "/permanencia",
    },
    {
      title: "O contrato é a maior diferença",
      text: `Aos 6 meses ficam ${percent(by("permanente").rate)} com contrato permanente e ${percent(by("temporario").rate)} com temporário. É uma associação, não uma prova de causa.`,
      href: "/permanencia",
    },
    {
      title: "Colocar mais não é o mesmo que durar mais",
      text: `A E03 colocou ${integer(e03.eligible)} e manteve ${integer(e03.stayed)}. A E07 colocou ${integer(e07.eligible)} e manteve ${integer(e07.stayed)}.`,
      href: "/entidades-empresas",
    },
    {
      title: `O ${busiest?.month}.º mês é o que tem mais saídas`,
      text: `${integer(busiest?.exits ?? 0)} saídas entre o dia ${((busiest?.month ?? 1) - 1) * 30} e o dia ${(busiest?.month ?? 1) * 30 - 1}. Agir depois disso é tarde para estas pessoas.`,
      href: "/recomendacoes",
    },
  ]
  return (
    <Panel id="discoveries" title="Principais descobertas">
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.title}>
            <Link
              href={item.href}
              className="flex h-full gap-3 rounded-xl border p-4 hover:border-primary hover:bg-accent"
            >
              <Lightbulb
                weight="fill"
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>
                <span className="block font-semibold">{item.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {item.text}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function EntityResults({ jobs, tables }: { jobs: Job[]; tables: Props }) {
  const rows = tables.entidades_sociais.map((entity) => ({
    entity,
    six: retentionAt(
      jobs.filter((j) => j.entityId === entity.id),
      180
    ),
  }))
  const max = Math.max(1, ...rows.map((r) => r.six.eligible))
  return (
    <Panel
      id="entities"
      title="Colocações e empregos que se mantiveram"
      text="Barra clara: colocações com 6 meses de observação. Barra cheia: as que duraram 6 meses."
      aside={<More href="/entidades-empresas">Comparar entidades</More>}
    >
      <ul className="flex flex-col gap-2.5">
        {rows.map(({ entity, six }) => (
          <li
            key={entity.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 text-sm sm:grid-cols-[8rem_minmax(0,1fr)_9rem]"
          >
            <Drill filters={{ entity: entity.id }}>
              {entity.id} {shortName(entity)}
            </Drill>
            <span
              aria-hidden="true"
              className="order-last col-span-2 h-4 sm:order-none sm:col-span-1"
            >
              <span
                className="block h-full rounded-e bg-chart-1/25"
                style={{ width: `${(six.eligible / max) * 100}%` }}
              >
                <span
                  className="block h-full rounded-e bg-chart-1"
                  style={{ width: `${six.rate * 100}%` }}
                />
              </span>
            </span>
            <span className="text-end tabular-nums">
              {integer(six.eligible)} → {integer(six.stayed)}{" "}
              <strong className="font-semibold">{percent(six.rate)}</strong>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Alerts({ tables, jobs }: { tables: Props; jobs: Job[] }) {
  const expected = useMemo(
    () =>
      expectedExits(
        activeJobs(toJobs(tables.participantes, tables.colocacoes))
      ),
    [tables.participantes, tables.colocacoes]
  )
  const plans = planStates(tables.planos_acao)
  const documents = documentSupport(tables.participantes, tables.planos_acao)
  const active = jobs.filter((j) => !j.ended).length
  const worst = retentionAt(
    jobs.filter((j) => j.entityId === "E03"),
    180
  )
  const items = [
    {
      title: `Cerca de ${integer(expected)} saídas esperadas nos 30 dias seguintes`,
      text: `Entre ${integer(active)} empregos ativos. É um valor de grupo, por idade do emprego, entidade e contrato.`,
      href: "/radar",
      action: "Abrir o radar",
    },
    {
      title: `E03: ${percent(worst.rate)} de permanência aos 6 meses`,
      text: `${interval(worst)}. Merece uma intervenção com avaliação.`,
      href: "/recomendacoes",
      action: "Ver a proposta",
    },
    {
      title: `${integer(documents.helped)} de ${integer(documents.people)} com barreira de documentação têm um apoio registado`,
      text: "Pode haver apoio que não foi escrito. É uma oportunidade de registo.",
      href: "/acompanhamento",
      action: "Ver o acompanhamento",
    },
    {
      title: `${integer(tables.participantes.length - plans.people)} participantes sem plano de ação registado`,
      text: `${integer(plans.suspended)} das ${integer(plans.actions)} ações registadas estão suspensas.`,
      href: "/acompanhamento",
      action: "Criar planos",
    },
  ]
  return (
    <Panel id="alerts" title="Alertas e oportunidades">
      <ul className="divide-y">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0"
          >
            <span className="flex min-w-60 flex-1 gap-3">
              <Warning
                weight="fill"
                className="mt-0.5 size-5 shrink-0 text-chart-2"
                aria-hidden="true"
              />
              <span>
                <span className="block font-semibold">{item.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {item.text}
                </span>
              </span>
            </span>
            <More href={item.href}>{item.action}</More>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Note>
          A app não prevê o que uma pessoa vai fazer e não decide quem deve ser
          contratado ou apoiado. Mostra onde a equipa deve olhar primeiro.
        </Note>
      </div>
    </Panel>
  )
}
