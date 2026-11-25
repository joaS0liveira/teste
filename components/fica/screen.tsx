"use client"

import { CaretDown } from "@phosphor-icons/react"
import { EmptyState } from "@/components/ui/empty-state"
import { Spinner } from "@/components/ui/loader"
import { Select } from "@/components/ui/select-field"
import { REFERENCE_DATE } from "@/lib/fica/dates"
import { date } from "@/lib/fica/format"
import { shortName } from "@/lib/fica/metrics"
import { useFica } from "@/lib/fica/store"
import type { Entity } from "@/lib/fica/types"

export function ScreenHeader({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados até {date(REFERENCE_DATE)}
        </p>
      </div>
      {children}
    </div>
  )
}

/** Exact values and method, out of the way until someone asks. */
export function Numbers({
  summary = "Ver os números",
  children,
}: {
  summary?: string
  children: React.ReactNode
}) {
  return (
    <details className="group mt-3 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-medium text-primary underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
        <CaretDown
          weight="bold"
          className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
        {summary}
      </summary>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </details>
  )
}

export function Loading() {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <Spinner size="lg" label="A carregar os dados…" showLabel />
    </div>
  )
}

export function LoadError({ retry }: { retry: () => void }) {
  return (
    <EmptyState
      tone="error"
      title="Não foi possível carregar os dados"
      description="Confirma a ligação e tenta outra vez."
      onRetry={retry}
      labels={{ retry: "Tentar outra vez" }}
    />
  )
}

export function EntityFilter({ entities }: { entities: Entity[] }) {
  const entityId = useFica((s) => s.entityId)
  return (
    <Select
      label="Entidade"
      className="w-full sm:w-56"
      value={entityId}
      onValueChange={(value) => useFica.setState({ entityId: value })}
      options={[
        { value: "all", label: "Todas as entidades" },
        ...entities.map((e) => ({ value: e.id, label: shortName(e) })),
      ]}
    />
  )
}
