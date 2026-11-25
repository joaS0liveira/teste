import type { Quality } from "@/lib/fica/company"
import { cn } from "@/lib/utils"

export const AXES = [
  { key: "contract", label: "Contrato" },
  { key: "salary", label: "Salário" },
  { key: "hours", label: "Horário" },
  { key: "training", label: "Formação" },
  { key: "satisfaction", label: "Satisfação" },
] as const

type Values = Record<(typeof AXES)[number]["key"], number | null>

const R = 70
const point = (i: number, value: number, r = R): [number, number] => {
  const angle = ((i * 72 - 90) * Math.PI) / 180
  return [100 + r * value * Math.cos(angle), 100 + r * value * Math.sin(angle)]
}
const path = (values: (number | null)[]) =>
  values
    .map((v, i) => point(i, Math.max(v ?? 0, 0.04)).map((n) => n.toFixed(1)))
    .map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`)
    .join("") + "Z"

/** The shape of a company: five sides of quality, next to the average. */
export function Fingerprint({
  quality,
  satisfaction,
  average,
  labels = false,
  className,
}: {
  quality: Quality
  satisfaction: number | null
  average?: Quality
  labels?: boolean
  className?: string
}) {
  const values: Values = { ...quality, satisfaction }
  const list = AXES.map((axis) => values[axis.key])
  return (
    <svg
      viewBox={labels ? "-10 6 220 190" : "20 20 160 160"}
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      {[0.33, 0.66, 1].map((ring) => (
        <path
          key={ring}
          d={path([ring, ring, ring, ring, ring])}
          className="fill-none stroke-border"
        />
      ))}
      {average && (
        <path
          d={path([
            average.contract,
            average.salary,
            average.hours,
            average.training,
            0,
          ])}
          className="fill-none stroke-muted-foreground"
          strokeDasharray="4 3"
          strokeWidth="1.5"
        />
      )}
      <path
        d={path(list)}
        className="fill-chart-1/25 stroke-chart-1"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {list.map((value, i) => {
        const [x, y] = point(i, Math.max(value ?? 0, 0.04))
        return value === null ? (
          <circle
            key={i}
            cx={point(i, 1)[0]}
            cy={point(i, 1)[1]}
            r="4"
            className="fill-card stroke-chart-2"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
        ) : (
          <circle key={i} cx={x} cy={y} r="3.5" className="fill-chart-1" />
        )
      })}
      {labels &&
        AXES.map((axis, i) => {
          const [x, y] = point(i, 1, R + 22)
          return (
            <text
              key={axis.key}
              x={x}
              y={y + 4}
              textAnchor={x > 130 ? "start" : x < 70 ? "end" : "middle"}
              fontSize="11"
              className="fill-foreground"
              dx={x > 130 ? -14 : x < 70 ? 14 : 0}
            >
              {axis.label}
            </text>
          )
        })}
    </svg>
  )
}
