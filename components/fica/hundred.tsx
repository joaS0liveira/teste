"use client"

import { useId, useState } from "react"
import { inHundred, integer, percent } from "@/lib/fica/format"
import { kaplanMeier, type Job } from "@/lib/fica/retention"
import { cn } from "@/lib/utils"

type Group = "all" | "permanente" | "temporario"
const GROUPS: { value: Group; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "permanente", label: "Permanente" },
  { value: "temporario", label: "Temporário" },
]

/**
 * One hundred placements, month after month. It uses the estimated curve, so
 * every month speaks of the same group of people.
 */
export function Hundred({ jobs }: { jobs: Job[] }) {
  const [group, setGroup] = useState<Group>("all")
  const [month, setMonth] = useState(6)
  const id = useId()
  const own = group === "all" ? jobs : jobs.filter((j) => j.contract === group)
  const day = month === 12 ? 365 : month * 30
  const { rate, low, high } = kaplanMeier(own).at(day)
  const staying = inHundred(rate)

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="rounded-3xl bg-[#1f1147] p-6 text-[#f3eeff] sm:p-9"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div>
          <h2
            id={`${id}-title`}
            className="text-2xl font-semibold text-balance sm:text-3xl"
          >
            As pessoas colocadas num emprego conseguem permanecer nesse emprego?
          </h2>
          <p aria-live="polite" className="mt-5 text-lg text-[#d3c8f0]">
            De cada 100 colocações,{" "}
            <strong className="font-heading text-5xl font-semibold text-white">
              {staying}
            </strong>{" "}
            {month === 0 ? "começam o emprego." : "ainda duram "}
            {month > 0 && (
              <>
                ao fim de {month} {month === 1 ? "mês" : "meses"}.
              </>
            )}
          </p>
          <label
            htmlFor={`${id}-month`}
            className="mt-6 block text-sm font-medium"
          >
            Arrasta os meses
          </label>
          <input
            id={`${id}-month`}
            type="range"
            min={0}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            aria-valuetext={`${month} meses`}
            className="mt-2 h-11 w-full max-w-md accent-[#f0a24a]"
          />
          <div
            aria-hidden="true"
            className="flex max-w-md justify-between text-xs text-[#d3c8f0]"
          >
            <span>início</span>
            <span>3</span>
            <span>6</span>
            <span>9</span>
            <span>12 meses</span>
          </div>
          <div
            role="group"
            aria-label="Tipo de contrato"
            className="mt-5 flex flex-wrap gap-2"
          >
            {GROUPS.map((g) => (
              <button
                key={g.value}
                type="button"
                aria-pressed={group === g.value}
                onClick={() => setGroup(g.value)}
                className="min-h-11 rounded-xl border border-[#4b3a86] px-4 text-sm font-medium hover:border-[#b79cff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a24a] aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-[#1f1147]"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div
            aria-hidden="true"
            className="mx-auto grid max-w-80 grid-cols-10 gap-2"
          >
            {Array.from({ length: 100 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "aspect-square rounded-full border-2 transition-colors duration-300 motion-reduce:transition-none",
                  i < staying
                    ? "border-[#b79cff] bg-[#b79cff]"
                    : "border-[#f0a24a]/60"
                )}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-[#d3c8f0]">
            Cheio: ainda no emprego. Vazio: já saiu.
          </p>
        </div>
      </div>
      <p className="mt-6 text-xs text-[#d3c8f0]">
        Estimativa de Kaplan-Meier com {integer(own.length)} colocações válidas.
        {month > 0 &&
          ` Intervalo de 95%: ${percent(low)} a ${percent(high)}. Os cartões dos 3, 6 e 12 meses contam só quem já teve esse tempo de observação, por isso podem diferir um pouco.`}
      </p>
    </section>
  )
}
