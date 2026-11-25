"use client"

import { CaretRight, Warning } from "@phosphor-icons/react"
import { MotionConfig, motion } from "motion/react"
import Link from "next/link"
import { useState } from "react"
import { Segmented } from "@/components/ui/segmented-control"
import { inHundred } from "@/lib/fica/format"
import type { EntitySummary } from "@/lib/fica/metrics"
import { EASE_IN_OUT } from "@/lib/motion-tokens"
import { cn } from "@/lib/utils"

type Metric = "placedRate" | "durableRate"

const options: { value: Metric; label: string }[] = [
  { value: "placedRate", label: "Colocadas" },
  { value: "durableRate", label: "Ainda empregadas" },
]

const rank = (summaries: EntitySummary[], metric: Metric) =>
  [...summaries].sort((a, b) => b[metric] - a[metric])

export function EntityRanking({ summaries }: { summaries: EntitySummary[] }) {
  const [metric, setMetric] = useState<Metric>("placedRate")
  const ranked = rank(summaries, metric)
  const gap = (s: EntitySummary) => s.placedRate - s.durableRate
  const widest = summaries.reduce((a, b) => (gap(b) > gap(a) ? b : a))
  const place = (m: Metric) => rank(summaries, m).indexOf(widest) + 1

  return (
    <section
      aria-labelledby="ranking-title"
      className="rounded-2xl border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ranking-title" className="text-xl font-semibold">
          Examinar uma entidade
        </h2>
        <Segmented
          label="Ordenar as entidades por"
          options={options}
          value={metric}
          onValueChange={setMetric}
          size="md"
          className="h-11"
        />
      </div>
      <p
        aria-live="polite"
        className="mt-3 min-h-10 text-sm text-muted-foreground"
      >
        {metric === "placedRate"
          ? "Em cada 100 pessoas, quantas arranjaram emprego no 1.º ano."
          : `Em cada 100 pessoas, quantas ainda estavam empregadas 6 meses depois. ${widest.name} passa do ${place("placedRate")}.º para o ${place("durableRate")}.º lugar.`}
      </p>

      <MotionConfig reducedMotion="user">
        <ol className="mt-2 flex flex-col">
          {ranked.map((entity, index) => {
            const isWidest = entity === widest
            return (
              <motion.li
                key={entity.id}
                layout="position"
                transition={{ duration: 0.8, ease: EASE_IN_OUT }}
                className="relative grid grid-cols-[1.75rem_4.5rem_minmax(0,1fr)_2rem_1.25rem] items-center gap-x-2 rounded-lg py-1.5 hover:bg-accent sm:grid-cols-[2rem_6rem_minmax(0,1fr)_3rem_6.5rem]"
              >
                <span className="text-sm text-muted-foreground tabular-nums">
                  {index + 1}.º
                </span>
                <span className={cn("text-sm", isWidest && "font-semibold")}>
                  <Link
                    href={`/consulta/${entity.id}`}
                    prefetch={false}
                    className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
                  >
                    <span className="sr-only">Examinar </span>
                    {entity.name}
                  </Link>
                </span>
                <span aria-hidden="true" className="h-4 rounded-e bg-muted">
                  <span
                    className={cn(
                      "block h-full rounded-e transition-[width] duration-[800ms] ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none",
                      isWidest ? "bg-chart-2" : "bg-chart-1"
                    )}
                    style={{ width: `${entity[metric] * 100}%` }}
                  />
                </span>
                <span className="text-end font-semibold tabular-nums">
                  {inHundred(entity[metric])}
                  <span className="sr-only"> em cada 100</span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex items-center justify-end gap-1 text-sm font-medium text-primary"
                >
                  <span className="hidden sm:inline">Examinar</span>
                  <CaretRight weight="bold" className="size-4 rtl:rotate-180" />
                </span>
                {isWidest && (
                  <span className="col-span-2 col-start-3 flex items-start gap-1.5 text-sm text-warning">
                    <Warning
                      weight="fill"
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    Maior diferença entre colocar e ficar
                  </span>
                )}
              </motion.li>
            )
          })}
        </ol>
      </MotionConfig>
    </section>
  )
}
