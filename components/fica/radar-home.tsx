"use client"

import { ArrowRight, Check, Copy } from "@phosphor-icons/react"
import { useReducedMotion } from "motion/react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { companyCases } from "@/lib/fica/company"
import { REFERENCE_DATE } from "@/lib/fica/dates"
import { date, inHundred, integer } from "@/lib/fica/format"
import { journeys, plannedAfterLeaving } from "@/lib/fica/journey"
import { shortName } from "@/lib/fica/metrics"
import { activeJobs, backtest, expectedExits, toJobs } from "@/lib/fica/risk"
import { useTables, type Tables } from "@/lib/fica/store"
import { useWorkspace } from "@/lib/fica/workspace"
import { cn } from "@/lib/utils"
import { Radar, type RadarGroup } from "./radar"
import { LoadError, Loading, Numbers } from "./screen"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "empresas_parceiras",
  "acoes_formacao",
  "planos_acao",
] as const

type View = "company" | "region" | "entity"
const views: { value: View; label: string }[] = [
  { value: "company", label: "Empresas" },
  { value: "region", label: "Regiões" },
  { value: "entity", label: "Entidades" },
]

const UNKNOWN = "P99"
const list = new Intl.ListFormat("pt-PT")

export function RadarHome() {
  const data = useTables(TABLES)
  return (
    <>
      {data.status === "loading" && <Loading />}
      {data.status === "error" && <LoadError retry={data.retry} />}
      {data.status === "ready" && <Content {...data.tables} />}
    </>
  )
}

type Props = Pick<Tables, (typeof TABLES)[number]>

function Content(tables: Props) {
  const jobs = useMemo(
    () => toJobs(tables.participantes, tables.colocacoes),
    [tables.participantes, tables.colocacoes]
  )
  const active = useMemo(() => activeJobs(jobs), [jobs])
  const total = expectedExits(active)
  const [view, setView] = useState<View>("company")
  const [calls, setCalls] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const names = useMemo(
    () => ({
      company: new Map(
        tables.empresas_parceiras.map((c) => [c.id, c.nome_ficticio])
      ),
      entity: new Map(
        tables.entidades_sociais.map((e) => [e.id, shortName(e)])
      ),
    }),
    [tables.empresas_parceiras, tables.entidades_sociais]
  )
  const groups = useMemo(() => {
    const keyOf = (job: (typeof active)[number]) =>
      view === "company"
        ? job.companyId
        : view === "region"
          ? job.region
          : job.entityId
    const chosen = new Set(active.slice(0, calls).map((job) => job.id))
    return [...Map.groupBy(active, keyOf)]
      .map(([id, rows]) => {
        const reached = rows.filter((job) => chosen.has(job.id))
        return {
          id,
          name:
            view === "company"
              ? (names.company.get(id) ?? "Empresa não identificada")
              : view === "entity"
                ? (names.entity.get(id) ?? id)
                : id,
          label:
            view === "company"
              ? id === UNKNOWN
                ? "?"
                : id.slice(1)
              : view === "entity"
                ? (names.entity.get(id) ?? id)
                : id,
          active: rows.length,
          expected: expectedExits(rows),
          calls: reached.length,
          covered: expectedExits(reached),
        }
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [active, calls, view, names])

  const covered = expectedExits(active.slice(0, calls))
  const byExpected = groups.toSorted((a, b) => b.expected - a.expected)
  const byCalls = groups
    .filter((g) => g.calls > 0)
    .sort((a, b) => b.calls - a.calls)
  const selected = groups.find((g) => g.id === selectedId)
  const about = (n: number) => Math.round(n)

  const opening = `Nos próximos 30 dias, cerca de ${integer(total)} pessoas podem sair do emprego. Eu sei onde.`
  const [said, setSaid] = useState<string | null>(null)

  const ask = {
    where: () => {
      const entities = [...Map.groupBy(active, (j) => j.entityId)]
        .map(
          ([id, rows]) => [names.entity.get(id), expectedExits(rows)] as const
        )
        .sort((a, b) => b[1] - a[1])
      const [first, second] = entities
      const companies = [...Map.groupBy(active, (j) => j.companyId)]
        .map(([id, rows]) => [id, expectedExits(rows)] as const)
        .filter(([id]) => id !== UNKNOWN)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
      setSaid(
        `Cerca de ${about(first[1])} são pessoas acompanhadas por ${first[0]}, e ${about(second[1])} por ${second[0]}. Nas empresas, começa por ${list.format(companies.map(([id]) => names.company.get(id)!))}.`
      )
    },
    why: () => {
      const temporary = active.filter((j) => j.contract === "temporario")
      setSaid(
        `${inHundred(expectedExits(temporary) / total)} em cada 100 destas saídas são de contratos temporários a chegar à idade em que costumam acabar. Não olho para o perfil das pessoas.`
      )
    },
    what: () => {
      const n = calls || 100
      setCalls(n)
      const reach = expectedExits(active.slice(0, n))
      setSaid(
        `Com ${n} conversas chegas a tempo a cerca de ${about(reach)} destas saídas. Ao acaso seriam ${about((total * n) / active.length)}. O plano está pronto aqui em baixo.`
      )
    },
    trust: () => {
      const result = backtest(jobs)
      setSaid(
        `Testei-me em 2025, mês a mês, só com o que se sabia em cada dia. Previ ${integer(result.expected)} saídas e houve ${integer(result.actual)}. Com 100 conversas por mês chegava a ${inHundred(result.reached / result.actual)} em cada 100. Ao acaso, ${inHundred(result.random / result.actual)}. No pior mês errei por 15.`
      )
    },
  }

  const planText = [
    `Plano de conversas, ${calls} no total`,
    ...byCalls.map((g) => `${g.name}: ${g.calls}`),
    "Perguntar à empresa e à pessoa: o que falta para continuar?",
  ].join("\n")

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="radar-title"
        className="grid gap-x-8 gap-y-5 overflow-hidden rounded-3xl bg-[#1f1147] p-5 text-[#f3eeff] sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center"
      >
        <div className="order-2 lg:order-1">
          <Radar
            groups={groups as RadarGroup[]}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          />
          <ul className="mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-[#d3c8f0]">
            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full bg-[#f4862a]"
              />
              saída esperada
            </li>
            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full bg-[#5ed0e0] ring-2 ring-[#5ed0e0]/50 ring-offset-2 ring-offset-[#1f1147]"
              />
              conversa a tempo
            </li>
          </ul>
        </div>
        <div className="order-1 lg:order-2">
          <h1 id="radar-title" className="sr-only">
            Radar das próximas saídas
          </h1>
          <Typed text={said ?? opening} />
          <div className="mt-5 flex flex-wrap gap-2">
            <Ask onClick={ask.where}>Onde?</Ask>
            <Ask onClick={ask.why}>Porquê?</Ask>
            <Ask onClick={ask.what}>O que faço?</Ask>
            <Ask onClick={ask.trust}>Posso confiar em ti?</Ask>
          </div>
          <div className="mt-6">
            <label
              htmlFor="calls"
              className="flex items-baseline justify-between gap-3 text-sm text-[#d3c8f0]"
            >
              Quantas conversas consegues fazer este mês?
              <span className="text-2xl font-semibold text-white tabular-nums">
                {calls}
              </span>
            </label>
            <input
              id="calls"
              type="range"
              min={0}
              max={200}
              step={25}
              value={calls}
              onChange={(event) => {
                setCalls(Number(event.target.value))
                setCopied(false)
              }}
              className="mt-1 h-11 w-full cursor-pointer accent-[#f4862a]"
            />
            <p aria-live="polite" className="min-h-6 text-sm text-[#d3c8f0]">
              {calls > 0 &&
                `Chegas a tempo a cerca de ${about(covered)} de ${about(total)}. Falar a tempo não garante que a pessoa fique.`}
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Ver o radar por"
            className="mt-4 inline-flex rounded-full bg-white/10 p-1"
          >
            {views.map((v) => (
              <label
                key={v.value}
                className="cursor-pointer rounded-full px-4 py-2 text-sm has-checked:bg-white has-checked:font-medium has-checked:text-[#1f1147] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#f4862a]"
              >
                <input
                  type="radio"
                  name="view"
                  className="sr-only"
                  checked={view === v.value}
                  onChange={() => {
                    setView(v.value)
                    setSelectedId(null)
                  }}
                />
                {v.label}
              </label>
            ))}
          </div>
          {selected && (
            <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm">
              <p className="text-base font-semibold">{selected.name}</p>
              <p className="mt-1 text-[#d3c8f0]">
                {integer(selected.active)} pessoas empregadas. Cerca de{" "}
                {about(selected.expected)}{" "}
                {about(selected.expected) === 1 ? "pode" : "podem"} sair nos
                próximos 30 dias.
              </p>
              {view === "company" && (
                <Link
                  href={`/empresas/${selected.id}`}
                  className="mt-2 inline-flex min-h-11 items-center gap-2 font-medium text-[#ffb072] underline-offset-4 hover:underline"
                >
                  Abrir o caso
                  <ArrowRight
                    weight="bold"
                    className="size-4 rtl:rotate-180"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {calls > 0 && (
        <section
          aria-labelledby="calls-title"
          className="rounded-2xl bg-card p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="calls-title" className="text-xl font-semibold">
              O teu plano de {calls} conversas
            </h2>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard
                  .writeText(planText)
                  .then(() => setCopied(true))
              }
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              {copied ? (
                <Check weight="bold" className="size-4" aria-hidden="true" />
              ) : (
                <Copy weight="bold" className="size-4" aria-hidden="true" />
              )}
              <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
            {byCalls.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-3 border-b py-2 text-sm"
              >
                <span>{g.name}</span>
                <span className="font-semibold tabular-nums">{g.calls}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Uma pergunta aos dois lados: o que falta para continuar?
          </p>
        </section>
      )}

      <Cases {...tables} />
      <Numbers summary="Ver o radar em lista">
        <ul className="max-w-md">
          {byExpected.map((g) => (
            <li
              key={g.id}
              className="flex justify-between gap-3 border-b py-1.5"
            >
              <span>{g.name}</span>
              <span className="tabular-nums">
                {g.expected.toFixed(1).replace(".", ",")} saídas esperadas
              </span>
            </li>
          ))}
        </ul>
      </Numbers>
      <p className="text-sm text-muted-foreground">
        Dados até {date(REFERENCE_DATE)}. O radar conta os 30 dias seguintes e
        usa só a entidade, o contrato e o tempo de casa.
      </p>
    </div>
  )
}

function Ask({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-full border border-white/25 px-4 text-sm font-medium hover:bg-white/10"
    >
      {children}
    </button>
  )
}

/** Says the sentence letter by letter; whole at once with reduced motion. */
function Typed({ text }: { text: string }) {
  return (
    <>
      <p aria-live="polite" className="sr-only">
        {text}
      </p>
      <TypedText key={text} text={text} />
    </>
  )
}

function TypedText({ text }: { text: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (reduce || shown >= text.length) return
    const timer = setTimeout(() => setShown(shown + 2), 18)
    return () => clearTimeout(timer)
  }, [reduce, shown, text])
  return (
    <p
      aria-hidden="true"
      className={cn(
        "min-h-40 font-heading leading-snug font-semibold text-balance",
        text.length > 110 ? "text-xl" : "text-2xl sm:text-[1.75rem]"
      )}
    >
      {reduce ? text : text.slice(0, shown)}
    </p>
  )
}

function Cases({
  empresas_parceiras,
  participantes,
  colocacoes,
  acoes_formacao,
  planos_acao,
}: Props) {
  const agreements = useWorkspace((s) => s.agreements)
  const cases = useMemo(
    () =>
      companyCases(
        empresas_parceiras,
        participantes,
        colocacoes,
        acoes_formacao
      ),
    [empresas_parceiras, participantes, colocacoes, acoes_formacao]
  )
  const people = useMemo(
    () => journeys(participantes, colocacoes, planos_acao),
    [participantes, colocacoes, planos_acao]
  )
  const worst = cases.find((c) => c.status === "unusual") ?? cases[0]
  const paid = cases
    .filter((c) => c.belowActive > 0)
    .toSorted((a, b) => b.belowActive - a.belowActive)
  const waiting = people.filter((p) => p.stage === "waiting").length
  const after = useMemo(
    () => plannedAfterLeaving(colocacoes, planos_acao),
    [colocacoes, planos_acao]
  )

  const rows = [
    {
      href: `/empresas/${worst.id}`,
      kind: "Empresa",
      title: `${worst.name}: de ${worst.seen} pessoas, ${worst.gone} saíram antes dos 6 meses`,
      text: worst.explainedByMix
        ? "Sai do normal. O tipo de contrato e a entidade explicam quase tudo."
        : "Vale a pena investigar.",
    },
    ...(paid.length
      ? [
          {
            href: `/empresas/${paid[0].id}`,
            kind: "Empresa",
            title: `${paid[0].name}: ${paid[0].belowActive} pessoas ganham abaixo do mínimo`,
            text: `Em proporção às horas. Acontece em ${paid.length} empresas.`,
          },
        ]
      : []),
    {
      href: "/percursos?etapa=left",
      kind: "Percurso",
      title: `${integer(after.left)} pessoas saíram do emprego e só ${after.followed} têm um novo plano`,
      text: "Continuar o acompanhamento, sem começar do zero.",
    },
    {
      href: "/percursos?etapa=waiting",
      kind: "Percurso",
      title: `${integer(waiting)} pessoas procuram há um ano ou mais`,
      text: "Um plano por barreira e por região.",
    },
  ]

  return (
    <section aria-labelledby="cases-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="cases-title" className="text-xl font-semibold">
          Casos à tua espera
        </h2>
        {Object.keys(agreements).length > 0 && (
          <span className="text-sm text-muted-foreground">
            {Object.keys(agreements).length} com acordo em curso
          </span>
        )}
      </div>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <li key={row.title}>
            <Link
              href={row.href}
              className="group flex h-full flex-col rounded-2xl bg-card p-5 transition-colors hover:bg-accent"
            >
              <span
                className={cn(
                  "self-start rounded-full px-3 py-1 text-xs font-medium",
                  row.kind === "Empresa"
                    ? "bg-chart-2/15 text-warning"
                    : "bg-primary/10 text-primary"
                )}
              >
                {row.kind}
              </span>
              <span className="mt-3 text-lg leading-snug font-semibold text-balance">
                {row.title}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                {row.text}
              </span>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Abrir
                <ArrowRight
                  weight="bold"
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none rtl:rotate-180"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
