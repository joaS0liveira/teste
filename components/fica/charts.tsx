"use client"

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { integer, percent } from "@/lib/fica/format"
import { kaplanMeier, type Job } from "@/lib/fica/retention"

const tick = { fill: "var(--muted-foreground)" }
const LAST = 365

export type Series = {
  key: string
  name: string
  ink: string
  dash?: string
  jobs: Job[]
}

/** Estimated share still in the job, with the 95% band when there is one line. */
export function SurvivalChart({ series }: { series: Series[] }) {
  const lines = series
    .filter((s) => s.jobs.length > 0)
    .map((s) => ({ ...s, km: kaplanMeier(s.jobs, LAST) }))
  const single = lines.length === 1
  // One mark per week, or the line would disappear under them.
  const marks = new Set(
    single ? lines[0].km.marks.map((m) => Math.floor(m.day / 7) * 7) : []
  )
  const data = Array.from({ length: LAST + 1 }, (_, day) => ({
    day,
    ...Object.fromEntries(
      lines.flatMap((l) => {
        const point = l.km.curve[day]
        return point
          ? [
              [l.key, point.rate],
              ...(single ? [["band", [point.low, point.high]]] : []),
              ...(single && marks.has(day) ? [["mark", point.rate]] : []),
            ]
          : []
      })
    ),
  }))
  const summary = lines
    .map(
      (l) =>
        `${l.name}: ${[90, 180, 365].map((d) => `${percent(l.km.at(d).rate)} aos ${Math.round(d / 30)} meses`).join(", ")}`
    )
    .join(". ")

  return (
    <div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-2">
            <svg width="24" height="8" aria-hidden="true">
              <line
                x1="0"
                x2="24"
                y1="4"
                y2="4"
                stroke={l.ink}
                strokeWidth="3"
                strokeDasharray={l.dash}
              />
            </svg>
            {l.name}
            <span className="text-muted-foreground">
              {integer(l.jobs.length)} colocações, {integer(l.km.censored)}{" "}
              ainda sem saída
            </span>
          </li>
        ))}
      </ul>
      <div role="img" aria-label={`Permanência estimada. ${summary}.`}>
        <ChartContainer
          config={{}}
          className="mt-3 aspect-auto h-72 w-full sm:h-80"
        >
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
            accessibilityLayer={false}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[0, LAST]}
              ticks={[0, 90, 180, 270, 365]}
              tickFormatter={(d: number) =>
                d === 0 ? "início" : `${Math.round(d / 30)} m`
              }
              tick={tick}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickFormatter={(v: number) => `${v * 100}%`}
              tick={tick}
              width={44}
              axisLine={false}
              tickLine={false}
            />
            {[90, 180, 365].map((d) => (
              <ReferenceLine
                key={d}
                x={d}
                stroke="var(--border)"
                strokeWidth={1.5}
              />
            ))}
            <ChartTooltip
              content={({ active, label }) =>
                active && label !== undefined ? (
                  <div className="rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-md">
                    <p className="mb-1 font-medium">Dia {label}</p>
                    {lines.map((l) => {
                      const point = l.km.curve[Number(label)]
                      return point ? (
                        <p key={l.key} className="flex justify-between gap-4">
                          <span>{l.name}</span>
                          <span className="font-medium tabular-nums">
                            {percent(point.rate)}
                            {single &&
                              ` (${percent(point.low)} a ${percent(point.high)})`}
                          </span>
                        </p>
                      ) : null
                    })}
                  </div>
                ) : null
              }
            />
            {single && (
              <Area
                dataKey="band"
                type="stepAfter"
                stroke="none"
                fill={lines[0].ink}
                fillOpacity={0.14}
                isAnimationActive={false}
                activeDot={false}
              />
            )}
            {single && (
              <Line
                dataKey="mark"
                stroke="none"
                isAnimationActive={false}
                activeDot={false}
                dot={CensorTick}
              />
            )}
            {lines.map((l) => (
              <Line
                key={l.key}
                dataKey={l.key}
                type="stepAfter"
                stroke={l.ink}
                strokeWidth={2.5}
                strokeDasharray={l.dash}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  )
}

/** Someone still in the job, seen only up to this day. */
function CensorTick({
  cx,
  cy,
  index,
}: {
  cx?: number
  cy?: number | null
  index?: number
}) {
  if (cx === undefined || cy === undefined || cy === null)
    return <g key={index} />
  return (
    <line
      key={index}
      x1={cx}
      x2={cx}
      y1={cy - 5}
      y2={cy + 5}
      stroke="var(--foreground)"
      strokeOpacity={0.45}
    />
  )
}

/** Simple columns. The highlighted one carries a text label too. */
export function Columns({
  data,
  highlight,
  caption,
  unit,
}: {
  data: { label: string; value: number }[]
  highlight?: string
  caption: string
  unit: string
}) {
  return (
    <div role="img" aria-label={caption}>
      <ChartContainer config={{}} className="aspect-auto h-64 w-full">
        <BarChart
          data={data.map((d) => ({
            ...d,
            fill: d.label === highlight ? "var(--chart-2)" : "var(--chart-1)",
          }))}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tick={tick}
            tickLine={false}
            interval={data.length > 12 ? "preserveStartEnd" : 0}
            minTickGap={4}
          />
          <YAxis
            tick={tick}
            width={44}
            axisLine={false}
            tickLine={false}
            tickFormatter={integer}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-md">
                  <p className="font-medium">{label}</p>
                  <p>
                    {integer(Number(payload[0].value))} {unit}
                  </p>
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
