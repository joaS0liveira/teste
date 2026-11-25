"use client"

import { ArrowCounterClockwise, Info } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { Select } from "@/components/ui/select-field"
import { inHundred, integer, percent, points } from "@/lib/fica/format"
import {
  contractMix,
  expectedStay,
  shortName,
  validPlacements,
} from "@/lib/fica/metrics"
import { useFica, useTables, type Tables } from "@/lib/fica/store"
import { cn } from "@/lib/utils"
import { LoadError, Loading, Numbers, ScreenHeader } from "./screen"

const TABLES = ["entidades_sociais", "participantes", "colocacoes"] as const

export function Simulator() {
  const data = useTables(TABLES)
  return (
    <>
      <ScreenHeader title="E se houvesse menos contratos temporários?" />
      <p className="sticky top-2 z-10 mt-4 flex items-start gap-2 rounded-2xl border bg-card p-4 text-sm">
        <Info
          weight="fill"
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        Estimativa, se o padrão atual se mantiver. Não prova causa. Mexe só na
        quantidade de temporários, não no tempo que duram.
      </p>
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
}: Pick<Tables, (typeof TABLES)[number]>) {
  const filteredId = useFica((s) => s.entityId)
  const options = useMemo(() => {
    const valid = validPlacements(participants, placements)
    return entities
      .map((entity) => {
        const own = valid.filter((p) => p.entityId === entity.id)
        return {
          id: entity.id,
          name: shortName(entity),
          count: own.length,
          mix: contractMix(own),
        }
      })
      .filter((option) => option.count > 0)
  }, [entities, participants, placements])

  const [chosenId, setChosenId] = useState<string | null>(null)
  // Temporary contracts in every 10. Null until the slider moves away from today.
  const [inTen, setInTen] = useState<number | null>(null)

  if (options.length === 0)
    return <EmptyState title="Ainda não há dados para mostrar" />

  const mostTemporary = options.reduce((a, b) =>
    b.mix.temporaryRate > a.mix.temporaryRate ? b : a
  )
  const entity =
    options.find((o) => o.id === (chosenId ?? filteredId)) ?? mostTemporary
  const { mix } = entity
  const todayInTen = Math.round(mix.temporaryRate * 10)
  const shownInTen = inTen ?? todayInTen
  const rate = inTen === null ? mix.temporaryRate : inTen / 10
  const today = expectedStay(mix)
  const scenario = expectedStay(mix, rate)
  const sentence =
    shownInTen === 0
      ? "nenhum é temporário"
      : shownInTen === 1
        ? "1 é temporário"
        : `${shownInTen} são temporários`

  return (
    <div className="mt-6 flex flex-col gap-6">
      <section
        aria-label="Cenário"
        className="flex flex-col gap-6 rounded-2xl bg-card p-4 sm:p-6"
      >
        <Select
          label="Entidade"
          className="w-full sm:w-56"
          value={entity.id}
          onValueChange={(id) => {
            setChosenId(id)
            setInTen(null)
          }}
          options={options.map((o) => ({ value: o.id, label: o.name }))}
        />

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label htmlFor="temporary-rate" className="text-sm">
              Em cada 10 contratos,
              <span className="block text-2xl font-semibold tracking-tight">
                {sentence}
              </span>
            </label>
            <Button
              size="md"
              className="h-11"
              icon={ArrowCounterClockwise}
              iconWeight="bold"
              disabled={inTen === null}
              onClick={() => setInTen(null)}
            >
              Voltar a hoje ({todayInTen})
            </Button>
          </div>
          <input
            id="temporary-rate"
            type="range"
            min={0}
            max={10}
            step={1}
            value={shownInTen}
            aria-valuetext={`Em cada 10 contratos, ${sentence}`}
            onChange={(event) => {
              const next = Number(event.target.value)
              setInTen(next === todayInTen ? null : next)
            }}
            className="mt-2 h-11 w-full cursor-pointer accent-primary"
          />
          <div
            aria-hidden="true"
            className="flex justify-between text-xs text-muted-foreground"
          >
            <span>Nenhum temporário</span>
            <span>Todos temporários</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Quem fica 6 meses</h2>
          <p aria-live="polite" className="mt-1">
            {inTen === null
              ? `${entity.name}, hoje: em cada 100 pessoas colocadas, ficam ${inHundred(today)}.`
              : `${entity.name}: em cada 100 pessoas colocadas, ficariam ${inHundred(scenario)} em vez de ${inHundred(today)}.`}
          </p>
          <dl className="mt-4 flex flex-col gap-4">
            <Result term="Hoje" value={today} className="bg-chart-3" />
            <Result
              term="Neste cenário"
              value={scenario}
              className="bg-chart-1"
              strong
            />
          </dl>
          <Numbers>
            <p className="max-w-prose">
              {entity.name}, com {integer(entity.count)} colocações: hoje{" "}
              {percent(mix.temporaryRate)} dos contratos são temporários e ficam{" "}
              {percent(today)}. Com {percent(rate)}, ficariam{" "}
              {percent(scenario)} ({points(scenario - today)} pontos).
            </p>
            <p className="max-w-prose">
              Ficam 180 dias ou mais {percent(mix.temporarySurvival)} das
              pessoas com contrato temporário e {percent(mix.permanentSurvival)}{" "}
              das que têm contrato permanente. A conta junta os dois grupos na
              percentagem escolhida. O valor de hoje usa a mesma conta, por isso
              pode diferir um pouco da curva.
            </p>
          </Numbers>
        </div>
      </section>
    </div>
  )
}

function Result({
  term,
  value,
  className,
  strong,
}: {
  term: string
  value: number
  className: string
  strong?: boolean
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <dt className="text-sm">{term}</dt>
        <dd
          className={cn(
            "font-semibold tracking-tight tabular-nums",
            strong ? "text-4xl sm:text-5xl" : "text-2xl"
          )}
        >
          {inHundred(value)}
          <span className="text-sm font-normal tracking-normal text-muted-foreground">
            {" "}
            em cada 100
          </span>
        </dd>
      </div>
      <div aria-hidden="true" className="mt-1 h-5 rounded-e bg-muted">
        <div
          className={cn(
            "h-full rounded-e transition-[width] duration-300 ease-out motion-reduce:transition-none",
            className
          )}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  )
}
