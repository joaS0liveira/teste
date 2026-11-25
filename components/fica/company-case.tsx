"use client"

import {
  ArrowLeft,
  Check,
  CheckCircle,
  Copy,
  Ear,
  Info,
  Lightbulb,
  Scales,
  Warning,
  type Icon,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import {
  averageQuality,
  companyCases,
  contractsByEntity,
  type ClueKey,
  type ClueLevel,
  type CompanyCase,
} from "@/lib/fica/company"
import { date, inHundred, integer, percent } from "@/lib/fica/format"
import { label } from "@/lib/fica/labels"
import {
  compare,
  satisfactionOf,
  TOPICS,
  type TopicResult,
} from "@/lib/fica/listen"
import { shortName } from "@/lib/fica/metrics"
import { activeJobs, expectedExits, toJobs } from "@/lib/fica/risk"
import { useTables, type Tables } from "@/lib/fica/store"
import { fromToday, repliesOf, useWorkspace } from "@/lib/fica/workspace"
import { cn } from "@/lib/utils"
import { capital } from "./companies"
import { AXES, Fingerprint } from "./fingerprint"
import { LoadError, Loading, Numbers } from "./screen"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "empresas_parceiras",
  "acoes_formacao",
] as const

export function CompanyCasePage({ id }: { id: string }) {
  const data = useTables(TABLES)
  return (
    <>
      <Link
        href="/empresas"
        className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        Empresas
      </Link>
      {data.status === "loading" && <Loading />}
      {data.status === "error" && <LoadError retry={data.retry} />}
      {data.status === "ready" && <Content id={id} tables={data.tables} />}
    </>
  )
}

const CLUE_TITLE: Record<ClueKey, string> = {
  contract: "Contrato",
  salary: "Salário",
  hours: "Horário",
  training: "Formação",
  region: "Região",
  conditions: "Condições",
  satisfaction: "Satisfação",
}

const LEVELS: Record<
  ClueLevel,
  { text: string; tone: StatusTone; icon: Icon }
> = {
  weighs: { text: "Pesa", tone: "warning", icon: Scales },
  review: { text: "Rever já", tone: "warning", icon: Warning },
  chance: { text: "Oportunidade", tone: "brand", icon: Lightbulb },
  none: { text: "Sem sinal", tone: "neutral", icon: CheckCircle },
  listen: { text: "Falta ouvir", tone: "brand", icon: Ear },
}
const ORDER: ClueLevel[] = ["review", "weighs", "chance", "listen", "none"]

const STATES: Record<
  TopicResult["state"],
  { text: string; tone: StatusTone; icon: Icon }
> = {
  unheard: { text: "Por ouvir", tone: "neutral", icon: Ear },
  half: { text: "Falta um lado", tone: "neutral", icon: Ear },
  good: { text: "De acordo, está bem", tone: "positive", icon: CheckCircle },
  bad: { text: "De acordo, está mal", tone: "warning", icon: Warning },
  disagree: { text: "Não estão de acordo", tone: "warning", icon: Scales },
  mixed: { text: "Assim-assim", tone: "neutral", icon: Info },
}

type Props = { id: string; tables: Pick<Tables, (typeof TABLES)[number]> }

function Content({ id, tables }: Props) {
  const cases = useMemo(
    () =>
      companyCases(
        tables.empresas_parceiras,
        tables.participantes,
        tables.colocacoes,
        tables.acoes_formacao
      ),
    [tables]
  )
  const risk = useMemo(
    () => activeJobs(toJobs(tables.participantes, tables.colocacoes)),
    [tables]
  )
  const entities = useMemo(
    () =>
      contractsByEntity(tables.participantes, tables.colocacoes, id).map(
        (row) => ({
          ...row,
          name: shortName(
            tables.entidades_sociais.find((e) => e.id === row.entityId)!
          ),
        })
      ),
    [tables, id]
  )
  const replies = useWorkspace((s) => s.replies)

  const company = cases.find((c) => c.id === id)
  if (!company)
    return (
      <EmptyState
        title="Empresa não encontrada"
        description="Este código não existe nos dados."
      />
    )

  const own = repliesOf(replies, id)
  const results = compare(own.company, own.worker)
  const soon = expectedExits(risk.filter((job) => job.companyId === id))

  return (
    <div className="flex flex-col gap-6">
      <header className="grid items-center gap-6 rounded-3xl bg-[#1f1147] p-6 text-[#f3eeff] sm:p-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-sm text-[#d3c8f0]">
            {company.sector
              ? `${capital(label(company.sector))}, ${company.region}`
              : "Sem setor nem região"}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {company.name}
          </h1>
          <p className="mt-3 max-w-prose text-lg">
            De {company.seen} pessoas com 6 meses de observação,{" "}
            <strong className="font-semibold text-[#ffb072]">
              {company.gone} saíram antes
            </strong>
            . No conjunto das empresas seriam{" "}
            {Math.round(company.usual * company.seen)}.
          </p>
          <p className="mt-2 max-w-prose text-sm text-[#d3c8f0]">
            {verdict(company)}
          </p>
        </div>
        <dl className="flex gap-8 md:flex-col md:gap-4">
          <Figure value={integer(company.active)} label="empregadas agora" />
          <Figure
            value={`≈ ${Math.round(soon)}`}
            label="podem sair em 30 dias"
          />
        </dl>
      </header>

      <Clues company={company} cases={cases} results={results} />
      <Listen id={id} results={results} />
      <Deal company={company} entities={entities} results={results} />
    </div>
  )
}

function verdict(c: CompanyCase) {
  if (c.status === "unusual")
    return c.explainedByMix
      ? "Sai do normal, mas o tipo de contrato e a entidade explicam quase tudo."
      : "Sai do normal, e o contrato e a entidade não explicam tudo."
  if (c.status === "watch")
    return c.z >= 1
      ? "A investigar. A diferença pode ser acaso."
      : "A investigar por outros sinais. As saídas estão perto do normal."
  return "Dentro do normal."
}

function Figure({ value, label: text }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse justify-end md:items-end">
      <dt className="text-sm text-[#d3c8f0]">{text}</dt>
      <dd className="font-heading text-4xl font-semibold tracking-tight">
        {value}
      </dd>
    </div>
  )
}

function Section({
  id,
  title,
  text,
  children,
}: {
  id: string
  title: string
  text: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-4 rounded-2xl bg-card p-5 sm:p-7"
    >
      <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 max-w-prose text-muted-foreground">{text}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Clues({
  company,
  cases,
  results,
}: {
  company: CompanyCase
  cases: CompanyCase[]
  results: TopicResult[]
}) {
  const average = useMemo(() => averageQuality(cases), [cases])
  const clues = company.clues
    .map((clue) => {
      const heard = results.find((r) => r.key === clue.key)
      return clue.level === "listen" &&
        heard &&
        heard.state !== "unheard" &&
        heard.state !== "half"
        ? { ...clue, text: STATES[heard.state].text + "." }
        : clue
    })
    .toSorted((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level))
  const satisfaction = satisfactionOf(results)

  return (
    <Section
      id="pistas"
      title="1. Pistas"
      text="O que os dados mostram, o que não dá sinal e o que só as pessoas sabem."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <ul className="flex flex-col divide-y">
          {clues.map((clue) => {
            const level = LEVELS[clue.level]
            const heard =
              clue.level === "listen" &&
              clue.text !== "" &&
              results.some(
                (r) =>
                  r.key === clue.key &&
                  r.state !== "unheard" &&
                  r.state !== "half"
              )
            return (
              <li
                key={clue.key}
                className="flex flex-wrap items-start gap-x-4 gap-y-2 py-3 first:pt-0"
              >
                <span className="w-24 shrink-0 font-semibold">
                  {CLUE_TITLE[clue.key]}
                </span>
                <span className="min-w-56 flex-1 text-sm">{clue.text}</span>
                {heard ? (
                  <StatusPill tone="positive" icon={CheckCircle}>
                    Ouvido
                  </StatusPill>
                ) : (
                  <StatusPill tone={level.tone} icon={level.icon}>
                    {level.text}
                  </StatusPill>
                )}
              </li>
            )
          })}
        </ul>
        <figure>
          <Fingerprint
            quality={company.quality}
            satisfaction={satisfaction}
            average={average}
            labels
            className="w-full"
          />
          <figcaption className="mt-2 text-xs text-muted-foreground">
            A cheio, esta empresa. A tracejado, a média de todas.
          </figcaption>
          <Numbers>
            <ul>
              {AXES.map((axis) => {
                const value =
                  axis.key === "satisfaction"
                    ? satisfaction
                    : company.quality[axis.key]
                return (
                  <li
                    key={axis.key}
                    className="flex justify-between gap-3 py-1"
                  >
                    <span>{AXIS_MEANING[axis.key]}</span>
                    <span className="font-medium tabular-nums">
                      {value === null ? "sem dados" : percent(value)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-muted-foreground">
              Saídas: {percent(company.rate)} contra {percent(company.usual)}. Z{" "}
              {company.z.toFixed(2).replace(".", ",")}; depois de contar
              contrato e entidade, {company.zMix.toFixed(2).replace(".", ",")}.
              Acima de 1,96 sai do normal. Mínimo: 820 € em 2024 e 870 € em
              2025, para 40 horas. Confirmar antes de usar.
            </p>
          </Numbers>
        </figure>
      </div>
    </Section>
  )
}

const AXIS_MEANING = {
  contract: "Contratos permanentes",
  salary: "Salário no mínimo ou acima",
  hours: "35 horas ou mais",
  training: "Formação na área",
  satisfaction: "Querem continuar",
}

function Listen({ id, results }: { id: string; results: TopicResult[] }) {
  const replies = repliesOf(
    useWorkspace((s) => s.replies),
    id
  )
  const clear = useWorkspace((s) => s.clearReplies)
  const heard = replies.company.length + replies.worker.length
  const disagree = results.filter((r) => r.state === "disagree")

  return (
    <Section
      id="ouvir"
      title="2. Ouvir os dois lados"
      text="Cinco perguntas iguais para a empresa e para quem lá trabalha. Sem nomes."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SideLink
          href={`/ouvir/${id}/company`}
          title="Responder como empresa"
          count={replies.company.length}
        />
        <SideLink
          href={`/ouvir/${id}/worker`}
          title="Responder como trabalhador"
          count={replies.worker.length}
        />
      </div>
      {heard > 0 && (
        <>
          {disagree.length > 0 && (
            <p className="mt-6 flex items-start gap-2 text-lg font-semibold text-warning">
              <Warning
                weight="fill"
                className="mt-1 size-5 shrink-0"
                aria-hidden="true"
              />
              {disagree.length === 1
                ? `Não estão de acordo sobre: ${topicLabel(disagree[0].key)}.`
                : `Não estão de acordo em ${disagree.length} pontos.`}
            </p>
          )}
          <p className="mt-6 text-sm text-muted-foreground">
            E é a empresa, T é quem trabalha.
          </p>
          <ul className="mt-3 flex flex-col gap-5">
            {results.map((r) => (
              <li
                key={r.key}
                className="grid items-center gap-x-5 gap-y-2 sm:grid-cols-[7rem_minmax(0,1fr)_12rem]"
              >
                <span className="font-medium">{topicLabel(r.key)}</span>
                <Track result={r} />
                <span className="sm:justify-self-end">
                  <StatusPill
                    tone={STATES[r.state].tone}
                    icon={STATES[r.state].icon}
                  >
                    {STATES[r.state].text}
                  </StatusPill>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Com menos de três pessoas, mostra isto só a quem acompanha o caso.
            </p>
            <Button size="md" className="h-11" onClick={() => clear(id)}>
              Apagar as respostas
            </Button>
          </div>
        </>
      )}
    </Section>
  )
}

const topicLabel = (key: TopicResult["key"]) =>
  TOPICS.find((t) => t.key === key)!.label

function SideLink({
  href,
  title,
  count,
}: {
  href: string
  title: string
  count: number
}) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center justify-between gap-3 rounded-xl border px-5 py-3 hover:border-primary hover:bg-accent"
    >
      <span className="font-medium">{title}</span>
      <span className="shrink-0 text-sm text-muted-foreground">
        {count === 0
          ? "por ouvir"
          : count === 1
            ? "1 resposta"
            : `${count} respostas`}
      </span>
    </Link>
  )
}

/** Where each side stands, from no to yes. */
function Track({ result }: { result: TopicResult }) {
  const { company, worker } = result
  const says = (value: number | null) =>
    value === null
      ? "por ouvir"
      : value >= 1.5
        ? "sim"
        : value > 0.5
          ? "mais ou menos"
          : "não"
  return (
    <div>
      <p className="sr-only">
        Empresa: {says(company)}. Trabalhador: {says(worker)}.
      </p>
      <div aria-hidden="true" className="relative h-9">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
        {company !== null && worker !== null && (
          <div
            className={cn(
              "absolute top-1/2 h-1 -translate-y-1/2 rounded-full",
              result.state === "disagree" ? "bg-chart-2" : "bg-chart-1"
            )}
            style={{
              insetInlineStart: `${Math.min(company, worker) * 50}%`,
              width: `${Math.abs(company - worker) * 50}%`,
            }}
          />
        )}
        {company !== null && <Marker value={company} text="E" above />}
        {worker !== null && <Marker value={worker} text="T" />}
      </div>
      <div
        aria-hidden="true"
        className="flex justify-between text-xs text-muted-foreground"
      >
        <span>Não</span>
        <span>Sim</span>
      </div>
    </div>
  )
}

function Marker({
  value,
  text,
  above = false,
}: {
  value: number
  text: string
  above?: boolean
}) {
  return (
    <span
      className={cn(
        "absolute flex size-5 -translate-x-1/2 items-center justify-center rounded-full text-[0.6875rem] font-bold ring-2 ring-card",
        above
          ? "top-0 bg-primary text-primary-foreground"
          : "bottom-0 bg-chart-2 text-white dark:text-black"
      )}
      style={{ left: `clamp(0.625rem, ${value * 50}%, calc(100% - 0.625rem))` }}
    >
      {text}
    </span>
  )
}

const REVIEW_DAYS = 45

function Deal({
  company,
  entities,
  results,
}: {
  company: CompanyCase
  entities: { name: string; count: number; temporary: number }[]
  results: TopicResult[]
}) {
  const agreement = useWorkspace((s) => s.agreements[company.id])
  const setAgreement = useWorkspace((s) => s.setAgreement)
  const [off, setOff] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const highest = entities[0]
  const lowest = entities.at(-1)
  const argument =
    highest && lowest && highest.temporary - lowest.temporary >= 0.15
      ? `Em cada 100 pessoas, com ${highest.name} fazem ${inHundred(highest.temporary)} contratos temporários e com ${lowest.name} fazem ${inHundred(lowest.temporary)}.`
      : null

  const proposals = [
    ...(company.belowActive > 0
      ? [
          {
            id: "salary",
            text: `Rever o valor pago nas ${company.belowActive} colocações ativas abaixo do mínimo em proporção às horas.`,
          },
        ]
      : []),
    ...(company.activeTemporary > 0
      ? [
          {
            id: "contract",
            text: `Dizer, um mês antes do fim, se há continuação nos ${company.activeTemporary} contratos temporários ativos.`,
          },
        ]
      : []),
    ...(argument
      ? [
          {
            id: "permanent",
            text: "Começar as próximas cinco colocações com contrato permanente.",
          },
        ]
      : []),
    ...(company.quality.training === null
      ? [
          {
            id: "training",
            text: "Fazer uma semana de acolhimento na empresa, porque o programa não tem formação nesta área.",
          },
        ]
      : []),
    ...results.flatMap((r) => {
      const topic = TOPICS.find((t) => t.key === r.key)!
      if (r.state === "disagree")
        return [{ id: `listen-${r.key}`, text: topic.disagree }]
      if (r.state === "bad") return [{ id: `listen-${r.key}`, text: topic.bad }]
      return []
    }),
  ]
  const heard = results.some((r) => r.state !== "unheard")
  const chosen = proposals.filter((p) => !off.includes(p.id))

  const message = [
    "Bom dia.",
    `Das pessoas que colocámos convosco e acompanhámos 6 meses, ${company.gone} em ${company.seen} saíram antes. Queremos que fiquem, e que seja bom para os dois lados.`,
    ...(argument && chosen.some((c) => c.id === "permanent") ? [argument] : []),
    "Propomos:",
    ...chosen.map((c) => `- ${c.text}`),
    `Podemos rever juntos a ${date(fromToday(REVIEW_DAYS))}?`,
  ].join("\n")

  if (agreement)
    return (
      <Section
        id="acordo"
        title="3. Acordo em curso"
        text={`Começou a ${date(agreement.startedOn)}. Rever a ${date(agreement.reviewOn)}.`}
      >
        <ul className="flex flex-col gap-2">
          {agreement.measures.map((m) => (
            <li key={m.id}>
              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring">
                <input
                  type="checkbox"
                  checked={m.done}
                  onChange={() =>
                    setAgreement(company.id, {
                      ...agreement,
                      measures: agreement.measures.map((x) =>
                        x.id === m.id ? { ...x, done: !x.done } : x
                      ),
                    })
                  }
                  className="mt-0.5 size-5 shrink-0 accent-primary"
                />
                <span className={cn(m.done && "line-through")}>{m.text}</span>
              </label>
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="mt-4">
          {agreement.measures.filter((m) => m.done).length} de{" "}
          {agreement.measures.length} feitas. Na revisão, ouve outra vez os dois
          lados e vê se, das próximas 10 pessoas, saem menos de{" "}
          {Math.round(company.rate * 10)} antes dos 6 meses.
        </p>
        <Button
          size="md"
          className="mt-4 h-11"
          onClick={() => setAgreement(company.id, null)}
        >
          Terminar o acordo
        </Button>
      </Section>
    )

  return (
    <Section
      id="acordo"
      title="3. Acordo"
      text={
        heard
          ? "Medidas a partir das pistas e do que os dois lados disseram."
          : "Medidas a partir das pistas. Ouve os dois lados e aparecem mais."
      }
    >
      {proposals.length === 0 ? (
        <p>
          Nada a propor por agora. Ouve os dois lados para saber se está tudo
          bem.
        </p>
      ) : (
        <>
          <fieldset>
            <legend className="sr-only">Medidas a propor</legend>
            <div className="flex flex-col gap-2">
              {proposals.map((p) => (
                <label
                  key={p.id}
                  className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
                >
                  <input
                    type="checkbox"
                    checked={!off.includes(p.id)}
                    onChange={() => {
                      setCopied(false)
                      setOff(
                        off.includes(p.id)
                          ? off.filter((x) => x !== p.id)
                          : [...off, p.id]
                      )
                    }}
                    className="mt-0.5 size-5 shrink-0 accent-primary"
                  />
                  <span>
                    {p.text}
                    {p.id === "permanent" && argument && (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        O argumento: {argument}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-6">
            <h3 className="font-semibold">A mensagem, pronta a enviar</h3>
            <p className="mt-2 rounded-xl bg-accent p-4 text-sm leading-relaxed whitespace-pre-line">
              {message}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={chosen.length === 0}
                onClick={() =>
                  setAgreement(company.id, {
                    startedOn: fromToday(0),
                    reviewOn: fromToday(REVIEW_DAYS),
                    measures: chosen.map((c) => ({ ...c, done: false })),
                  })
                }
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Começar o acordo
              </button>
              <Button
                size="md"
                className="h-11"
                icon={copied ? Check : Copy}
                iconWeight="bold"
                onClick={() =>
                  navigator.clipboard
                    .writeText(message)
                    .then(() => setCopied(true))
                }
              >
                <span aria-live="polite">
                  {copied ? "Copiada" : "Copiar a mensagem"}
                </span>
              </Button>
            </div>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            As medidas são propostas da equipa. Os dados mostram diferenças, não
            causas.
          </p>
        </>
      )}
    </Section>
  )
}
