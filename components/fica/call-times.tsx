"use client"

import { Phone } from "@phosphor-icons/react"
import { useMemo } from "react"
import { integer } from "@/lib/fica/format"
import { firstExits } from "@/lib/fica/metrics"
import type { Entity, Participant, Placement } from "@/lib/fica/types"
import { Numbers } from "./screen"

const list = new Intl.ListFormat("pt-PT")

export function CallTimes({
  entities,
  participants,
  placements,
  selectedId,
}: {
  entities: Entity[]
  participants: Participant[]
  placements: Placement[]
  selectedId: string
}) {
  const rows = useMemo(
    () =>
      firstExits(entities, participants, placements).filter(
        (row) => selectedId === "all" || row.id === selectedId
      ),
    [entities, participants, placements, selectedId]
  )
  if (rows.length === 0) return null

  const groups = [...Map.groupBy(rows, (row) => row.months)].sort(
    (a, b) => a[0] - b[0]
  )

  return (
    <section
      aria-labelledby="call-title"
      className="rounded-2xl border bg-card p-5 sm:p-6"
    >
      <h2 id="call-title" className="text-xl font-semibold">
        Quando ligar
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        A quem tem contrato temporário, antes de começarem as saídas.
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {groups.map(([months, group]) => (
          <li key={months} className="flex items-start gap-3">
            <Phone
              weight="fill"
              className="mt-1 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              <strong className="block font-semibold">
                Antes de fazer {months} meses
              </strong>
              <span className="text-sm">
                {list.format(group.map((row) => row.name))}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-prose text-sm text-muted-foreground">
        É o que aconteceu até agora. Não diz quem vai sair.
      </p>
      <Numbers>
        <p>Primeiro dia em que alguém saiu de um contrato temporário:</p>
        <ul className="flex flex-col gap-1">
          {rows.map((row) => (
            <li key={row.id}>
              {row.name}: dia {integer(row.firstDay)}, em {integer(row.exits)}{" "}
              saídas
            </li>
          ))}
        </ul>
      </Numbers>
    </section>
  )
}
