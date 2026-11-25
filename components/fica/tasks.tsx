"use client"

import { ArrowCounterClockwise, DownloadSimple } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { Segmented } from "@/components/ui/segmented-control"
import { Select } from "@/components/ui/select-field"
import { cleanContacts } from "@/lib/fica/clean"
import { downloadCsv } from "@/lib/fica/csv"
import { REFERENCE_DATE } from "@/lib/fica/dates"
import { date, integer } from "@/lib/fica/format"
import { label } from "@/lib/fica/labels"
import { shortName } from "@/lib/fica/metrics"
import { useTables, type Tables } from "@/lib/fica/store"
import { useWorkspace } from "@/lib/fica/workspace"
import { LoadError, Loading, ScreenHeader } from "./screen"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "acoes_formacao",
  "acompanhamentos",
] as const

const PAGE = 15

type Queue = "contacts" | "training"
type Task = {
  id: string
  region: string
  entityId: string
  title: string
  detail: string
}

const QUEUES: Record<
  Queue,
  { label: string; title: string; choices: string[] }
> = {
  contacts: {
    label: "Contactos",
    title: "contactos agendados já passaram e ninguém disse se aconteceram",
    choices: ["Aconteceu", "Não aconteceu"],
  },
  training: {
    label: "Formações",
    title: 'formações continuam "em curso" depois da data de fim',
    choices: ["Concluída", "Desistiu", "Continua"],
  },
}

export function Tasks() {
  const data = useTables(TABLES)
  return (
    <>
      <ScreenHeader title="Tarefas em atraso" />
      {data.status === "loading" && <Loading />}
      {data.status === "error" && <LoadError retry={data.retry} />}
      {data.status === "ready" && <Content {...data.tables} />}
    </>
  )
}

function Content({
  entidades_sociais,
  participantes,
  acoes_formacao,
  acompanhamentos,
}: Pick<Tables, (typeof TABLES)[number]>) {
  const decisions = useWorkspace((s) => s.decisions)
  const decide = useWorkspace((s) => s.decide)
  const [queue, setQueue] = useState<Queue>("contacts")
  const [region, setRegion] = useState("all")
  const [entity, setEntity] = useState("all")
  const [shown, setShown] = useState(PAGE)

  const all = useMemo(() => {
    const person = new Map(participantes.map((p) => [p.id, p]))
    const { contacts } = cleanContacts(acompanhamentos)
    const task = (
      id: string,
      personId: string,
      title: string,
      detail: string
    ): Task => ({
      id,
      region: person.get(personId)?.regiao ?? "",
      entityId: person.get(personId)?.entidade_social_id ?? "",
      title,
      detail,
    })
    return {
      contacts: contacts
        .filter((c) => c.toConfirm)
        .toSorted((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
        .map((c) =>
          task(
            c.raw.id,
            c.raw.id_participante,
            `Contacto: ${label(c.raw.tipo_contacto).toLowerCase()}`,
            c.date
              ? `Agendado para ${date(c.date)}`
              : `Data não fiável no registo: ${c.raw.data}`
          )
        ),
      training: acoes_formacao
        .filter(
          (a) =>
            a.resultado === "em_curso" &&
            a.data_fim !== null &&
            a.data_fim <= REFERENCE_DATE
        )
        .toSorted((a, b) => a.data_fim!.localeCompare(b.data_fim!))
        .map((a) =>
          task(
            a.id,
            a.id_participante,
            `${label(a.tipo_formacao)} (${label(a.area)})`,
            `Devia ter acabado a ${date(a.data_fim!)}`
          )
        ),
    } satisfies Record<Queue, Task[]>
  }, [participantes, acoes_formacao, acompanhamentos])

  const inScope = all[queue].filter(
    (t) =>
      (region === "all" || t.region === region) &&
      (entity === "all" || t.entityId === entity)
  )
  const open = inScope.filter((t) => !decisions[t.id])
  const closed = inScope.filter((t) => decisions[t.id])
  const last = closed.at(-1)
  const config = QUEUES[queue]
  const regions = [...new Set(participantes.map((p) => p.regiao))].sort()
  const pick =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setShown(PAGE)
    }

  return (
    <div className="mt-5 flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <Segmented
          label="Fila"
          size="md"
          className="h-11"
          value={queue}
          onValueChange={(value: Queue) => pick(setQueue)(value)}
          options={(Object.keys(QUEUES) as Queue[]).map((value) => ({
            value,
            label: QUEUES[value].label,
          }))}
        />
        <Select
          label="Região"
          className="w-full sm:w-48"
          value={region}
          onValueChange={pick(setRegion)}
          options={[
            { value: "all", label: "Todas as regiões" },
            ...regions.map((r) => ({ value: r, label: r })),
          ]}
        />
        <Select
          label="Entidade"
          className="w-full sm:w-52"
          value={entity}
          onValueChange={pick(setEntity)}
          options={[
            { value: "all", label: "Todas as entidades" },
            ...entidades_sociais.map((e) => ({
              value: e.id,
              label: shortName(e),
            })),
          ]}
        />
      </div>

      <section
        aria-labelledby="queue-title"
        className="rounded-2xl bg-card p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 id="queue-title" aria-live="polite">
            <span className="block font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              {integer(open.length)}
            </span>
            <span className="text-sm">{config.title}</span>
          </h2>
          {closed.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {last && (
                <Button
                  size="md"
                  variant="quiet"
                  className="h-11"
                  icon={ArrowCounterClockwise}
                  iconWeight="bold"
                  onClick={() => closed.forEach((t) => decide(t.id, null))}
                >
                  Repor {integer(closed.length)}
                </Button>
              )}
              <Button
                size="md"
                className="h-11"
                icon={DownloadSimple}
                iconWeight="bold"
                onClick={() =>
                  downloadCsv(`rj-connect-${queue}-decididos.csv`, [
                    ["Registo", "Região", "O quê", "Decisão"],
                    ...closed.map((t) => [
                      t.id,
                      t.region,
                      `${t.title}. ${t.detail}`,
                      decisions[t.id],
                    ]),
                  ])
                }
              >
                Exportar {integer(closed.length)} decididos
              </Button>
            </div>
          )}
        </div>

        {open.length === 0 ? (
          <EmptyState
            title="Nada por fazer aqui"
            description="Muda a fila, a região ou a entidade."
          />
        ) : (
          <ul className="mt-5 divide-y">
            {open.slice(0, shown).map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3"
              >
                <span className="min-w-52 flex-1 text-sm">
                  <span className="block font-semibold">{t.title}</span>
                  <span className="text-muted-foreground">
                    Registo {t.id}, {t.region}. {t.detail}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  {config.choices.map((choice) => (
                    <Button
                      key={choice}
                      size="md"
                      className="h-11"
                      aria-label={`${choice}: ${t.title}, registo ${t.id}`}
                      onClick={() => decide(t.id, choice)}
                    >
                      {choice}
                    </Button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
        {open.length > shown && (
          <Button
            size="md"
            className="mt-4 h-11"
            onClick={() => setShown(shown + PAGE)}
          >
            Mostrar mais
          </Button>
        )}
      </section>
      <p className="max-w-prose text-sm text-muted-foreground">
        Os ficheiros originais não mudam. O que decidires fica neste aparelho e
        pode ser exportado.
      </p>
    </div>
  )
}
