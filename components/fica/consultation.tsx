"use client"

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  Printer,
  Warning,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusPill } from "@/components/ui/status-pill"
import {
  consult,
  type Consultation as Result,
  type Signal,
  type SignalKey,
} from "@/lib/fica/consultation"
import { REFERENCE_DATE } from "@/lib/fica/dates"
import { date, inHundred, percent } from "@/lib/fica/format"
import { topics } from "@/lib/fica/questions"
import { useTables, type Tables } from "@/lib/fica/store"
import { cn } from "@/lib/utils"
import { PeopleFlow } from "./people-flow"
import { LoadError, Loading, Numbers } from "./screen"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "acoes_formacao",
  "custos_formacao",
  "recursos_acompanhamento",
] as const

const list = new Intl.ListFormat("pt-PT")

type Answers = Partial<Record<SignalKey, number>>

export function Consultation({ id }: { id: string }) {
  const data = useTables(TABLES)
  return (
    <>
      <Link
        href="/entidades-empresas"
        className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline print:hidden"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        Entidades e Empresas
      </Link>
      {data.status === "loading" && <Loading />}
      {data.status === "error" && <LoadError retry={data.retry} />}
      {data.status === "ready" &&
        (data.tables.entidades_sociais.some((e) => e.id === id) ? (
          <Content id={id} tables={data.tables} />
        ) : (
          <EmptyState
            title="Entidade não encontrada"
            description="Volta à sala de espera e escolhe uma das oito."
          />
        ))}
    </>
  )
}

type Step =
  { kind: "see" | "found" | "test" | "sheet" } | { kind: "ask"; signal: Signal }

function Content({
  id,
  tables,
}: {
  id: string
  tables: Pick<Tables, (typeof TABLES)[number]>
}) {
  const result = useMemo(
    () =>
      consult(
        {
          entities: tables.entidades_sociais,
          participants: tables.participantes,
          placements: tables.colocacoes,
          actions: tables.acoes_formacao,
          trainingCosts: tables.custos_formacao,
          resources: tables.recursos_acompanhamento,
        },
        id
      ),
    [id, tables]
  )
  const { signals } = result
  const testable =
    result.pilot && signals.some((s) => topics[s.key].linkedToStaying)
  const steps: Step[] = [
    { kind: "see" },
    { kind: "found" },
    ...signals.map((signal) => ({ kind: "ask" as const, signal })),
    ...(testable ? [{ kind: "test" as const }] : []),
    { kind: "sheet" },
  ]

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (!moved.current) return
    heading.current?.focus()
    window.scrollTo({ top: 0 })
  }, [index])

  const go = (to: number) => {
    moved.current = true
    setIndex(to)
  }
  const step = steps[index]
  const waiting = step.kind === "ask" && answers[step.signal.key] === undefined

  return (
    <>
      <p className="text-sm text-muted-foreground print:hidden">
        Consulta de {result.name}, passo {index + 1} de {steps.length}
      </p>
      <div aria-hidden="true" className="mt-2 flex gap-1 print:hidden">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i <= index ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <section
        aria-labelledby="step-title"
        className="mt-5 rounded-2xl bg-card p-4 sm:p-8 print:p-0"
      >
        <h1
          id="step-title"
          ref={heading}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-balance outline-none sm:text-3xl"
        >
          {step.kind === "see" && result.name}
          {step.kind === "found" && foundTitle(result)}
          {step.kind === "ask" && topics[step.signal.key].question(result)}
          {step.kind === "test" && "Como saber se a receita resulta"}
          {step.kind === "sheet" && `Folha da consulta: ${result.name}`}
        </h1>
        <div className="mt-5">
          {step.kind === "see" && (
            <PeopleFlow
              placed={inHundred(result.outcome.placedRate)}
              stayed={inHundred(result.outcome.durableRate)}
            />
          )}
          {step.kind === "found" && <Found result={result} />}
          {step.kind === "ask" && (
            <Ask
              key={step.signal.key}
              result={result}
              signal={step.signal}
              answer={answers[step.signal.key]}
              onAnswer={(answer) =>
                setAnswers({ ...answers, [step.signal.key]: answer })
              }
            />
          )}
          {step.kind === "test" && <Test result={result} />}
          {step.kind === "sheet" && <Sheet result={result} answers={answers} />}
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        {index > 0 ? (
          <Button size="md" className="h-11" onClick={() => go(index - 1)}>
            Voltar
          </Button>
        ) : (
          <span />
        )}
        {index < steps.length - 1 ? (
          <span className="flex items-center gap-3">
            {waiting && (
              <span className="text-sm text-muted-foreground">
                Escolhe uma resposta
              </span>
            )}
            <button
              type="button"
              disabled={waiting}
              onClick={() => go(index + 1)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Continuar
              <ArrowRight
                weight="bold"
                className="size-4 rtl:rotate-180"
                aria-hidden="true"
              />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            <Printer weight="bold" className="size-4" aria-hidden="true" />
            Imprimir
          </button>
        )}
      </div>
    </>
  )
}

function foundTitle({ signals }: Result) {
  const clear = signals.filter((s) => s.level === "clear").length
  if (clear > 0)
    return clear === 1 ? "Encontrei um sinal" : `Encontrei ${clear} sinais`
  if (signals.length > 0)
    return signals.length === 1
      ? "Nada de grave. Há uma coisa a vigiar"
      : `Nada de grave. Há ${signals.length} coisas a vigiar`
  return "Sem sinais"
}

function Level({ level }: { level: Signal["level"] }) {
  return level === "clear" ? (
    <StatusPill tone="warning" icon={Warning}>
      Sinal claro
    </StatusPill>
  ) : (
    <StatusPill icon={Eye} iconWeight="bold">
      A vigiar, pode ser acaso
    </StatusPill>
  )
}

function Found({ result }: { result: Result }) {
  if (result.signals.length === 0)
    return (
      <div className="flex flex-col gap-4">
        <p className="flex max-w-prose items-start gap-2">
          <CheckCircle
            weight="fill"
            className="mt-0.5 size-6 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span>
            Comparei {result.name} com as outras sete entidades em cinco pontos
            e não encontrei nada que preocupe.
          </span>
        </p>
        {result.strongest.length > 0 && (
          <div>
            <p className="font-semibold">
              Pode ensinar as outras. É a melhor das oito em:
            </p>
            <ul className="mt-2 list-disc ps-5">
              {result.strongest.map((key) => (
                <li key={key}>{STRENGTH[key]}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Estudar antes de copiar: não se sabe qual destas coisas faz a
              diferença.
            </p>
          </div>
        )}
      </div>
    )

  return (
    <>
      <ol className="flex flex-col gap-6">
        {result.signals.map((signal) => (
          <li key={signal.key}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {topics[signal.key].title}
              </h2>
              <Level level={signal.level} />
            </div>
            <p className="mt-1 max-w-prose">
              {topics[signal.key].finding(signal)}
            </p>
            {signal.ruledOut.length > 0 && (
              <p className="mt-2 flex max-w-prose items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                Os dados não apontam para: {list.format(signal.ruledOut)}.
              </p>
            )}
            {(signal.key === "training" || signal.key === "support") && (
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                Não se sabe se isto ajuda as pessoas a ficar no emprego.
              </p>
            )}
          </li>
        ))}
      </ol>
      <Numbers>
        <ul className="flex flex-col gap-1">
          {result.signals.map((s) => (
            <li key={s.key}>
              {topics[s.key].title}:{" "}
              {s.key === "support"
                ? `${s.value.toFixed(2).replace(".", ",")} h contra ${s.usual.toFixed(2).replace(".", ",")} h`
                : `${percent(s.value)} contra ${percent(s.usual)}`}
            </li>
          ))}
        </ul>
        <p className="max-w-prose">
          Compara-se com a mediana das outras sete. Sinal claro: 10 pontos ou
          mais e p &lt; 0,001. A vigiar: 5 pontos ou mais e p &lt; 0,05. Nas
          horas: menos de dois terços ou de três quartos. Nos contratos que
          chegam aos 6 meses, conta só os temporários com 180 dias de
          observação.
        </p>
      </Numbers>
    </>
  )
}

const STRENGTH: Record<SignalKey, string> = {
  temporary: "menos contratos temporários",
  ending: "temporários que duram mais",
  placing: "pessoas colocadas",
  training: "formações concluídas",
  support: "horas de apoio por pessoa",
}

function Ask({
  result,
  signal,
  answer,
  onAnswer,
}: {
  result: Result
  signal: Signal
  answer: number | undefined
  onAnswer: (answer: number) => void
}) {
  const topic = topics[signal.key]
  const chosen = answer === undefined ? undefined : topic.options[answer]
  return (
    <>
      <p className="max-w-prose text-sm text-muted-foreground">
        Isto os dados não sabem. Só tu.
      </p>
      <fieldset className="mt-4">
        <legend className="sr-only">{topic.question(result)}</legend>
        <div className="flex flex-col gap-2">
          {topic.options.map((option, i) => (
            <label
              key={option.answer}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                answer === i ? "border-primary bg-accent" : "hover:bg-accent/60"
              )}
            >
              <input
                type="radio"
                name={signal.key}
                checked={answer === i}
                onChange={() => onAnswer(i)}
                className="size-5 shrink-0 accent-primary"
              />
              {option.answer}
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-live="polite">
        {chosen && (
          <div className="mt-6 rounded-xl bg-accent p-4">
            <h2 className="font-semibold">A receita</h2>
            <p className="mt-1 max-w-prose">{chosen.recipe(result)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {chosen.who}. {chosen.when}.
            </p>
            {signal.learnFrom && (
              <p className="mt-2 text-sm">
                Com quem aprender: {signal.learnFrom}. Estudar antes de copiar.
              </p>
            )}
            {signal.key === "temporary" && (
              <Link
                href="/simulador"
                className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                E se houvesse menos temporários? Ver a estimativa
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Test({ result }: { result: Result }) {
  const pilot = result.pilot!
  return (
    <div className="flex max-w-prose flex-col gap-4">
      <p>
        A receita é uma proposta. Para saber se resulta, divide ao acaso as
        próximas colocações: metade com a receita, metade sem.
      </p>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Figure value={pilot.perGroup} label="pessoas em cada grupo" />
        <Figure value={pilot.months} label="meses de colocações" />
        <Figure value={pilot.review} label="meses até rever" />
      </dl>
      <p>
        Bom sinal se, em cada 100 pessoas com a receita, chegarem aos 6 meses
        cerca de {inHundred(pilot.goal)} ou mais, e no outro grupo continuarem
        perto de {inHundred(pilot.base)}.
      </p>
      <Numbers summary="Como se faz a conta">
        <p>
          Deteta uma subida de 20 pontos, de {percent(pilot.base)} para{" "}
          {percent(pilot.goal)}, com 80% de poder e 5% de erro. Usa o ritmo de
          colocações dos últimos 12 meses e soma 6 meses de espera.
        </p>
      </Numbers>
    </div>
  )
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse justify-end">
      <dt className="text-sm">{label}</dt>
      <dd className="text-4xl font-semibold tracking-tight">{value}</dd>
    </div>
  )
}

function Sheet({ result, answers }: { result: Result; answers: Answers }) {
  const { signals, pilot, outcome } = result
  return (
    <div className="flex max-w-prose flex-col gap-6">
      <p>
        Em cada 100 pessoas, {inHundred(outcome.placedRate)} arranjam emprego e{" "}
        {inHundred(outcome.durableRate)} ainda lá estão 6 meses depois.
      </p>
      {signals.length === 0 && (
        <p>
          Sem sinais que preocupem.
          {result.strongest.length > 0 &&
            ` Pode ensinar as outras em: ${list.format(result.strongest.map((key) => STRENGTH[key]))}.`}
        </p>
      )}
      <ol className="flex flex-col gap-5">
        {signals.map((signal) => {
          const topic = topics[signal.key]
          const answer = answers[signal.key]
          const option = answer === undefined ? null : topic.options[answer]
          return (
            <li key={signal.key} className="break-inside-avoid">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{topic.title}</h2>
                <Level level={signal.level} />
              </div>
              <p className="mt-1 text-sm">{topic.finding(signal)}</p>
              {option && (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {topic.question(result)} {option.answer}.
                  </p>
                  <p className="mt-1">
                    <strong className="font-semibold">A fazer: </strong>
                    {option.recipe(result)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {option.who}. {option.when}.
                  </p>
                </>
              )}
            </li>
          )
        })}
      </ol>
      {pilot && signals.some((s) => topics[s.key].linkedToStaying) && (
        <p className="break-inside-avoid">
          <strong className="font-semibold">Testar: </strong>
          {pilot.perGroup} pessoas com a receita e {pilot.perGroup} sem. Rever
          daqui a {pilot.review} meses.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Dados até {date(REFERENCE_DATE)}. As perguntas e as receitas são
        propostas da equipa, não vêm dos dados. Os dados mostram diferenças, não
        causas.
      </p>
    </div>
  )
}
