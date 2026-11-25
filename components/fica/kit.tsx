"use client"

import {
  CaretDown,
  CaretUp,
  CaretUpDown,
  DownloadSimple,
  Info,
  Warning,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useId, useState } from "react"
import { Button } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { Select } from "@/components/ui/select-field"
import { downloadCsv } from "@/lib/fica/csv"
import { integer, percent } from "@/lib/fica/format"
import { label } from "@/lib/fica/labels"
import { shortName } from "@/lib/fica/metrics"
import {
  NO_FILTERS,
  SMALL_GROUP,
  type Filters,
  type Rate,
} from "@/lib/fica/retention"
import { useFica, type Loaded } from "@/lib/fica/store"
import type { Company, Entity } from "@/lib/fica/types"
import { cn } from "@/lib/utils"
import { LoadError, Loading } from "./screen"

/** Loading, error, or the page. */
export function Ready<T>({
  data,
  children,
}: {
  data: Loaded<T>
  children: (tables: T) => React.ReactNode
}) {
  if (data.status === "loading") return <Loading />
  if (data.status === "error") return <LoadError retry={data.retry} />
  return <div className="mt-8 flex flex-col gap-6">{children(data.tables)}</div>
}

/** Opens the permanence page already filtered. */
export function Drill({
  filters,
  children,
}: {
  filters: Partial<Filters>
  children: React.ReactNode
}) {
  return (
    <Link
      href="/permanencia"
      onClick={() =>
        useFica.setState({ filters: { ...NO_FILTERS, ...filters } })
      }
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  )
}

export function PageHeader({
  title,
  lead,
  children,
}: {
  title: string
  lead?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-2 max-w-prose text-lg text-pretty text-muted-foreground">
            {lead}
          </p>
        )}
      </div>
      {children}
    </header>
  )
}

export function Panel({
  id,
  title,
  text,
  aside,
  children,
  className,
}: {
  id: string
  title: string
  text?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "min-w-0 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgb(30_15_80/0.04),0_8px_24px_-16px_rgb(30_15_80/0.18)] sm:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <h2 id={id} className="text-lg font-semibold">
            {title}
          </h2>
          {text && (
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              {text}
            </p>
          )}
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** A small explanation next to a technical word. */
export function Hint({ children }: { children: React.ReactNode }) {
  const id = useId()
  // A native popover opens above everything, so tables and cards never clip it.
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label="O que é isto?"
        className="inline-flex size-6 items-center justify-center rounded-full align-middle opacity-75 hover:opacity-100"
      >
        <Info className="size-4" aria-hidden="true" />
      </button>
      <span
        id={id}
        popover="auto"
        className="m-auto w-64 rounded-xl border bg-popover p-3 text-start text-sm font-normal text-popover-foreground shadow-lg supports-[position-area:top]:inset-auto supports-[position-area:top]:m-1.5 supports-[position-area:top]:[position-area:top] supports-[position-area:top]:[position-try-fallbacks:flip-block,flip-inline]"
      >
        {children}
      </span>
    </>
  )
}

export function Note({
  children,
  tone = "info",
}: {
  children: React.ReactNode
  tone?: "info" | "warning"
}) {
  const NoteIcon = tone === "warning" ? Warning : Info
  return (
    <p
      className={cn(
        "flex max-w-prose items-start gap-2 rounded-xl px-4 py-3 text-sm",
        tone === "warning" ? "bg-chart-2/12 text-warning" : "bg-accent"
      )}
    >
      <NoteIcon
        weight="fill"
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "info" && "text-primary"
        )}
        aria-hidden="true"
      />
      <span>{children}</span>
    </p>
  )
}

export function Kpi({
  value,
  label: text,
  detail,
  hint,
  strong,
}: {
  value: string
  label: string
  detail?: React.ReactNode
  hint?: React.ReactNode
  strong?: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col-reverse justify-end rounded-2xl border p-5",
        strong ? "border-primary bg-primary text-primary-foreground" : "bg-card"
      )}
    >
      <dt className="mt-1 text-sm">
        {text}
        {hint && <Hint>{hint}</Hint>}
        {detail && (
          <span
            className={cn(
              "mt-0.5 block text-xs",
              strong ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {detail}
          </span>
        )}
      </dt>
      <dd className="font-heading text-3xl font-semibold tracking-tight">
        {value}
      </dd>
    </div>
  )
}

export const interval = (r: Rate) =>
  r.eligible === 0
    ? "sem casos"
    : `${percent(r.low)} a ${percent(r.high)}, em ${integer(r.eligible)} casos`

export function RateKpi({
  rate,
  label: text,
  strong,
}: {
  rate: Rate
  label: string
  strong?: boolean
}) {
  return (
    <Kpi
      strong={strong}
      value={rate.eligible ? percent(rate.rate) : "—"}
      label={text}
      detail={interval(rate)}
    />
  )
}

/** One bar split in parts, with the parts written below. */
export function Split({
  parts,
}: {
  parts: { label: string; value: number; className: string }[]
}) {
  const total = parts.reduce((sum, p) => sum + p.value, 0)
  return (
    <div>
      <div
        aria-hidden="true"
        className="flex h-8 gap-0.5 overflow-hidden rounded-lg"
      >
        {parts.map((p) => (
          <span
            key={p.label}
            className={cn("h-full min-w-1", p.className)}
            style={{ flexGrow: p.value }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className={cn("mt-1 size-3 shrink-0 rounded-sm", p.className)}
            />
            <span>
              {p.label}
              <span className="block font-semibold tabular-nums">
                {integer(p.value)}{" "}
                <span className="font-normal text-muted-foreground">
                  ({percent(total ? p.value / total : 0)})
                </span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Horizontal bars with the value at the end. */
export function Bars({
  rows,
  selected,
  onSelect,
}: {
  rows: { id: string; label: string; value: number; text: string }[]
  selected?: string
  onSelect?: (id: string) => void
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r) => {
        const content = (
          <>
            <span className="text-start text-sm">{r.label}</span>
            <span
              aria-hidden="true"
              className="order-last col-span-2 h-3.5 rounded-e bg-muted sm:order-none sm:col-span-1"
            >
              <span
                className={cn(
                  "block h-full rounded-e transition-[width] duration-500 motion-reduce:transition-none",
                  selected === r.id ? "bg-primary" : "bg-chart-1"
                )}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </span>
            <span className="text-end text-sm font-semibold tabular-nums">
              {r.text}
            </span>
          </>
        )
        const grid =
          "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[12rem_minmax(0,1fr)_8rem]"
        return (
          <li key={r.id}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={selected === r.id}
                onClick={() => onSelect(r.id)}
                className={cn(
                  grid,
                  "min-h-11 rounded-xl border border-transparent px-3 py-2 hover:bg-accent aria-pressed:border-primary aria-pressed:bg-accent"
                )}
              >
                {content}
              </button>
            ) : (
              <div className={cn(grid, "py-1")}>{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export type Column<Row> = {
  key: string
  title: string
  /** Used to sort and to export. */
  value: (row: Row) => string | number
  cell?: (row: Row) => React.ReactNode
  hint?: string
}

/** Sortable, exportable, and honest about small groups. */
export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  count,
  filename,
  initialSort,
}: {
  caption: string
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  /** Cases behind the row. Rows below 20 go last and are flagged. */
  count?: (row: Row) => number
  filename?: string
  initialSort: string
}) {
  const [sort, setSort] = useState({ key: initialSort, down: true })
  const column = columns.find((c) => c.key === sort.key) ?? columns[0]
  const small = (row: Row) => count !== undefined && count(row) < SMALL_GROUP
  const sorted = [...rows].sort((a, b) => {
    if (small(a) !== small(b)) return small(a) ? 1 : -1
    const x = column.value(a)
    const y = column.value(b)
    const order =
      typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), "pt-PT")
    return sort.down ? -order : order
  })

  if (rows.length === 0)
    return (
      <EmptyState
        title="Sem dados com estes filtros"
        description="Limpa os filtros ou escolhe outro grupo."
      />
    )

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-140 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b">
              {columns.map((c, i) => {
                const active = c.key === sort.key
                const SortIcon = !active
                  ? CaretUpDown
                  : sort.down
                    ? CaretDown
                    : CaretUp
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      active ? (sort.down ? "descending" : "ascending") : "none"
                    }
                    className={cn(
                      "py-1 font-medium text-muted-foreground",
                      i === 0 ? "pe-2 text-start" : "px-1.5 text-end"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSort({
                          key: c.key,
                          down: active ? !sort.down : true,
                        })
                      }
                      className="inline-flex min-h-11 items-center gap-1 hover:text-foreground"
                    >
                      {c.title}
                      <SortIcon
                        weight="bold"
                        className="size-3"
                        aria-hidden="true"
                      />
                    </button>
                    {c.hint && <Hint>{c.hint}</Hint>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  "border-b last:border-0 hover:bg-accent/60",
                  small(row) && "text-muted-foreground"
                )}
              >
                {columns.map((c, i) => {
                  const content = c.cell ? c.cell(row) : String(c.value(row))
                  return i === 0 ? (
                    <th
                      key={c.key}
                      scope="row"
                      className="py-2.5 pe-2 text-start font-medium"
                    >
                      {content}
                      {small(row) && (
                        <span className="ms-2 text-xs font-normal">
                          menos de {SMALL_GROUP} casos
                        </span>
                      )}
                    </th>
                  ) : (
                    <td
                      key={c.key}
                      className="px-1.5 py-2.5 text-end tabular-nums"
                    >
                      {content}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filename && (
        <Button
          size="md"
          className="mt-4 h-11"
          icon={DownloadSimple}
          iconWeight="bold"
          onClick={() =>
            downloadCsv(`${filename}.csv`, [
              columns.map((c) => c.title),
              ...sorted.map((row) => columns.map((c) => c.value(row))),
            ])
          }
        >
          Exportar tabela
        </Button>
      )}
    </>
  )
}

const PERIODS = [
  { value: "2024-1", label: "1.º semestre de 2024" },
  { value: "2024-2", label: "2.º semestre de 2024" },
  { value: "2025-1", label: "1.º semestre de 2025" },
  { value: "2025-2", label: "2.º semestre de 2025" },
]

/** The same filters on every page that uses them. */
export function FilterBar({
  entities,
  companies,
  fields = ["period", "contract", "entity", "company", "observation"],
}: {
  entities: Entity[]
  companies: Company[]
  fields?: (keyof Filters)[]
}) {
  const filters = useFica((s) => s.filters)
  const active = fields.filter((f) => filters[f] !== "all").length
  const set = (change: Partial<Filters>) =>
    useFica.setState({ filters: { ...filters, ...change } })
  const all: Record<
    keyof Filters,
    { label: string; options: { value: string; label: string }[] }
  > = {
    period: {
      label: "Início do emprego",
      options: [{ value: "all", label: "Todo o período" }, ...PERIODS],
    },
    contract: {
      label: "Contrato",
      options: [
        { value: "all", label: "Todos" },
        { value: "permanente", label: label("permanente") },
        { value: "temporario", label: label("temporario") },
      ],
    },
    entity: {
      label: "Entidade",
      options: [
        { value: "all", label: "Todas" },
        ...entities.map((e) => ({
          value: e.id,
          label: `${e.id} ${shortName(e)}`,
        })),
      ],
    },
    company: {
      label: "Empresa",
      options: [
        { value: "all", label: "Todas" },
        ...companies.map((c) => ({ value: c.id, label: c.nome_ficticio })),
        { value: "P99", label: "Empresa não identificada" },
      ],
    },
    observation: {
      label: "Tempo de observação",
      options: [
        { value: "all", label: "Qualquer" },
        { value: "90", label: "3 meses ou mais" },
        { value: "180", label: "6 meses ou mais" },
        { value: "365", label: "12 meses ou mais" },
      ],
    },
  }
  return (
    <div
      role="group"
      aria-label="Filtros"
      className="grid grid-cols-2 items-end gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] print:hidden"
    >
      {fields.map((field) => (
        <Select
          key={field}
          label={all[field].label}
          className="min-w-0"
          value={filters[field]}
          onValueChange={(value) => set({ [field]: value })}
          options={all[field].options}
        />
      ))}
      <Button
        size="md"
        variant="quiet"
        className="h-9"
        disabled={active === 0}
        onClick={() => useFica.setState({ filters: NO_FILTERS })}
      >
        Limpar filtros{active > 0 && ` (${active})`}
      </Button>
    </div>
  )
}
