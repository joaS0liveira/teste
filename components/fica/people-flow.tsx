"use client"

import { ArrowCounterClockwise, User } from "@phosphor-icons/react"
import { useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/action-button"
import { cn } from "@/lib/utils"

const LAST = 3
const STEP_MS = 1800

/** A hundred people: who finds work, who is still there six months later. */
export function PeopleFlow({
  placed,
  stayed,
}: {
  placed: number
  stayed: number
}) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState(0)
  const shown = reduce ? LAST : phase

  useEffect(() => {
    if (reduce || phase >= LAST) return
    const timer = setTimeout(() => setPhase(phase + 1), STEP_MS)
    return () => clearTimeout(timer)
  }, [phase, reduce])

  const sentences = [
    "Chegam 100 pessoas.",
    `${placed} arranjam emprego.`,
    `${placed - stayed} já não estão lá 6 meses depois.`,
    `Ficam ${stayed}.`,
  ]

  return (
    <div>
      <p aria-hidden="true" className="min-h-9 text-2xl font-semibold">
        {sentences[shown]}
      </p>
      <p className="sr-only">
        Em cada 100 pessoas, {placed} arranjam emprego e {stayed} ainda lá estão
        6 meses depois.
      </p>
      <div
        aria-hidden="true"
        className="mt-4 grid max-w-xl grid-cols-10 gap-x-1 gap-y-2 sm:grid-cols-20"
      >
        {Array.from({ length: 100 }, (_, i) => {
          const never = i >= placed && shown >= 1
          const left = i >= stayed && i < placed && shown >= 2
          return (
            <span
              key={i}
              className={cn(
                "flex justify-center transition-[color,opacity,translate] duration-700 ease-out motion-reduce:transition-none",
                never
                  ? "text-muted-foreground opacity-40"
                  : left
                    ? "translate-y-1 text-chart-2"
                    : "text-chart-1"
              )}
              style={{ transitionDelay: reduce ? "0ms" : `${(i % 20) * 30}ms` }}
            >
              <User
                weight={never ? "light" : left ? "regular" : "fill"}
                className="size-6"
              />
            </span>
          )
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <li className="flex items-center gap-1.5">
          <User
            weight="fill"
            className="size-5 text-chart-1"
            aria-hidden="true"
          />
          {stayed} ficam
        </li>
        <li className="flex items-center gap-1.5">
          <User className="size-5 text-chart-2" aria-hidden="true" />
          {placed - stayed} saem antes
        </li>
        <li className="flex items-center gap-1.5">
          <User
            weight="light"
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
          {100 - placed} não arranjam emprego no 1.º ano
        </li>
      </ul>
      {!reduce && phase === LAST && (
        <Button
          size="md"
          className="mt-4 h-11"
          icon={ArrowCounterClockwise}
          iconWeight="bold"
          onClick={() => setPhase(0)}
        >
          Ver outra vez
        </Button>
      )}
    </div>
  )
}
