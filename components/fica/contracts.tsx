import { integer, percent } from "@/lib/fica/format"
import { label } from "@/lib/fica/labels"
import {
  exitsStart,
  HORIZONS,
  retentionAt,
  type Job,
} from "@/lib/fica/retention"
import { cn } from "@/lib/utils"

const CONTRACTS = ["permanente", "temporario"] as const

/** 3, 6 and 12 months side by side, with cases and interval. */
export function ContractTable({ jobs }: { jobs: Job[] }) {
  const groups = CONTRACTS.map((type) => {
    const own = jobs.filter((j) => j.contract === type)
    return {
      type,
      own,
      rates: HORIZONS.map((d) => retentionAt(own, d)),
      start: exitsStart(own),
    }
  })
  return (
    <>
      <table className="w-full text-sm">
        <caption className="sr-only">
          Permanência aos 3, 6 e 12 meses por tipo de contrato
        </caption>
        <thead>
          <tr className="border-b text-muted-foreground">
            <th scope="col" className="py-2 text-start font-medium">
              Ainda no emprego
            </th>
            {groups.map(({ type, own }) => (
              <th key={type} scope="col" className="py-2 text-end font-medium">
                <span
                  aria-hidden="true"
                  className={cn(
                    "me-2 inline-block size-2.5 rounded-sm",
                    type === "permanente" ? "bg-chart-1" : "bg-chart-2"
                  )}
                />
                {label(type)}
                <span className="block text-xs font-normal">
                  {integer(own.length)} colocações
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HORIZONS.map((days, i) => (
            <tr key={days} className="border-b">
              <th scope="row" className="py-3 text-start font-medium">
                {Math.round(days / 30)} meses
              </th>
              {groups.map(({ type, rates }) => {
                const r = rates[i]
                return (
                  <td key={type} className="py-3 text-end tabular-nums">
                    <span className="font-heading text-xl font-semibold">
                      {r.eligible ? percent(r.rate) : "—"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {r.eligible
                        ? `${percent(r.low)} a ${percent(r.high)}`
                        : "sem casos"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {integer(r.eligible)} casos
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
          <tr>
            <th scope="row" className="py-3 text-start font-medium">
              As saídas começam
              <span className="block text-xs font-normal text-muted-foreground">
                primeiros 5% de saídas
              </span>
            </th>
            {groups.map(({ type, start }) => (
              <td key={type} className="py-3 text-end tabular-nums">
                {start === null ? "não chega a 5%" : `dia ${integer(start)}`}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted-foreground">
        Os ficheiros só têm dois tipos de contrato.
      </p>
    </>
  )
}
