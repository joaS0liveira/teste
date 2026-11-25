"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export type RadarGroup = {
  id: string
  /** Short, to fit around the circle. */
  label: string
  expected: number
  /** Expected exits among the people who would be contacted. */
  covered: number
}

const SIZE = 440
const CENTER = SIZE / 2
const RIM = 168

/** Whole dots per group that add up to the rounded total. */
function dotsPerGroup(values: number[]): number[] {
  const floors = values.map(Math.floor)
  let missing =
    Math.round(values.reduce((a, b) => a + b, 0)) -
    floors.reduce((a, b) => a + b, 0)
  const order = values
    .map((v, i) => [v - floors[i], i] as const)
    .sort((a, b) => b[0] - a[0])
  for (const [, i] of order) {
    if (missing <= 0) break
    floors[i]++
    missing--
  }
  return floors
}

/** Repeatable, so the dots do not jump between renders. */
function scatter(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function Radar({
  groups,
  selectedId,
  onSelect,
}: {
  groups: RadarGroup[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const slice = 360 / groups.length
  const dots = useMemo(() => {
    const counts = dotsPerGroup(groups.map((g) => g.expected))
    return groups.flatMap((group, g) =>
      Array.from({ length: counts[g] }, (_, i) => {
        const angle =
          ((g * slice -
            90 +
            slice * (0.14 + 0.72 * scatter(g * 97 + i * 13 + 1))) *
            Math.PI) /
          180
        const distance =
          30 + (RIM - 44) * Math.sqrt(scatter(g * 41 + i * 29 + 7))
        return {
          key: `${group.id}-${i}`,
          group: group.id,
          order: i,
          x: CENTER + distance * Math.cos(angle),
          y: CENTER + distance * Math.sin(angle),
        }
      })
    )
  }, [groups, slice])
  const coveredOf = new Map(
    groups.map((g) => [g.id, Math.round(g.covered)] as const)
  )

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full select-none"
      aria-hidden="true"
    >
      <g fill="none" stroke="#4b3a86">
        {[58, 113, RIM].map((r) => (
          <circle key={r} cx={CENTER} cy={CENTER} r={r} />
        ))}
      </g>
      <g className="radar-sweep">
        <path
          d={`M${CENTER} ${CENTER}L${CENTER} ${CENTER - RIM}A${RIM} ${RIM} 0 0 1 ${CENTER + RIM * Math.sin(0.7)} ${CENTER - RIM * Math.cos(0.7)}Z`}
          fill="#f4862a"
          opacity=".14"
        />
        <line
          x1={CENTER}
          y1={CENTER}
          x2={CENTER + RIM * Math.sin(0.7)}
          y2={CENTER - RIM * Math.cos(0.7)}
          stroke="#f4862a"
          strokeWidth="2"
        />
      </g>
      {groups.map((group, g) => {
        const start = ((g * slice - 90) * Math.PI) / 180
        const end = (((g + 1) * slice - 90) * Math.PI) / 180
        const middle = (start + end) / 2
        const at = (angle: number, r: number) =>
          `${CENTER + r * Math.cos(angle)} ${CENTER + r * Math.sin(angle)}`
        const selected = group.id === selectedId
        return (
          <g
            key={group.id}
            onClick={() => onSelect(group.id)}
            className="group cursor-pointer"
          >
            <path
              d={`M${CENTER} ${CENTER}L${at(start, RIM + 46)}A${RIM + 46} ${RIM + 46} 0 ${slice > 180 ? 1 : 0} 1 ${at(end, RIM + 46)}Z`}
              className={cn(
                "transition-opacity",
                selected
                  ? "fill-white/10"
                  : "fill-transparent group-hover:fill-white/5"
              )}
            />
            <text
              x={CENTER + (RIM + 24) * Math.cos(middle)}
              y={CENTER + (RIM + 24) * Math.sin(middle) + 5}
              textAnchor="middle"
              fontSize={groups.length > 10 ? 13 : 14}
              fontWeight={selected ? 700 : 500}
              fill={selected ? "#ffffff" : "#d3c8f0"}
            >
              {group.label}
            </text>
          </g>
        )
      })}
      <g className="pointer-events-none">
        {dots.map((dot) => {
          const covered = dot.order < (coveredOf.get(dot.group) ?? 0)
          const dim = selectedId !== null && dot.group !== selectedId
          return (
            <g key={dot.key} opacity={dim ? 0.25 : 1}>
              {covered && (
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r="8"
                  fill="none"
                  stroke="#5ed0e0"
                  strokeWidth="1.5"
                />
              )}
              <circle
                cx={dot.x}
                cy={dot.y}
                r="4.5"
                fill={covered ? "#5ed0e0" : "#f4862a"}
                className="transition-[fill] duration-500 motion-reduce:transition-none"
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
