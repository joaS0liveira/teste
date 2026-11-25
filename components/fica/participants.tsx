"use client"

import { ArrowRight } from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { Select } from "@/components/ui/select-field"
import { integer, percent } from "@/lib/fica/format"
import {
  BARRIER_LABEL,
  BARRIERS,
  planFor,
  type Barrier,
} from "@/lib/fica/journey"
import { label } from "@/lib/fica/labels"
import { toObservedJobs } from "@/lib/fica/retention"
import { useFica, useTables, type Tables } from "@/lib/fica/store"
import type { Company, Participant, TrainingAction } from "@/lib/fica/types"
import {
  Bars,
  DataTable,
  FilterBar,
  Kpi,
  Note,
  PageHeader,
  Panel,
  Ready,
  Split,
} from "./kit"
import { PlanView } from "./plan-view"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "empresas_parceiras",
  "acoes_formacao",
] as const

const FOCUS: Record<Barrier, string> = {
  experiencia: "Formações, estágios e uma primeira oportunidade profissional.",
  documentacao:
    "Uma lista do que falta, e o encaminhamento certo para cada documento.",
  horarios: "Registar a disponibilidade e procurar horários compatíveis.",
  distancia: "Empresas por localização e alternativas de transporte.",
  nenhuma:
    "Acompanhamento regular. Sem barreira registada não quer dizer sem risco.",
}

export function Participants() {
  const data = useTables(TABLES)
  return (
    <>
      <PageHeader
        title="Participantes e Barreiras"
        lead="O que impede de começar, e o que se pode fazer em cada caso."
      />
      <Ready data={data}>{(tables) => <Content {...tables} />}</Ready>
    </>
  )
}

function Content(t: Pick<Tables, (typeof TABLES)[number]>) {
  const entity = useFica((s) => s.filters.entity)
  const [barrier, setBarrier] = useState<Barrier>("experiencia")
  const people = t.participantes.filter(
    (p) => entity === "all" || p.entidade_social_id === entity
  )
  const placedIds = useMemo(() => {
    const valid = new Set(
      toObservedJobs(t.participantes, t.colocacoes).map((j) => j.id)
    )
    return new Set(
      t.colocacoes.filter((p) => valid.has(p.id)).map((p) => p.id_participante)
    )
  }, [t.participantes, t.colocacoes])
  const placed = people.filter((p) => placedIds.has(p.id)).length
  const rows = BARRIERS.map((b) => {
    const own = people.filter((p) => p.barreiras_emprego === b)
    return {
      id: b,
      people: own.length,
      placed: own.filter((p) => placedIds.has(p.id)).length,
    }
  })

  return (
    <>
      <FilterBar
        fields={["entity"]}
        entities={t.entidades_sociais}
        companies={t.empresas_parceiras}
      />
      {people.length === 0 ? (
        <EmptyState title="Sem participantes com este filtro" />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Panel id="placed" title="Com e sem colocação válida">
              <dl className="mb-5">
                <Kpi value={integer(people.length)} label="Participantes" />
              </dl>
              <Split
                parts={[
                  {
                    label: "Com colocação válida",
                    value: placed,
                    className: "bg-chart-1",
                  },
                  {
                    label: "Sem colocação válida",
                    value: people.length - placed,
                    className: "bg-chart-3",
                  },
                ]}
              />
              <div className="mt-4">
                <Note>
                  Sem colocação válida registada não quer dizer desempregado. Só
                  quer dizer que o programa não registou uma.
                </Note>
              </div>
            </Panel>
            <Panel
              id="barriers"
              title="Barreiras à integração"
              text="Escolhe uma barreira para ver o que fazer."
            >
              <Bars
                selected={barrier}
                onSelect={(id) => setBarrier(id as Barrier)}
                rows={rows.map((r) => ({
                  id: r.id,
                  label: BARRIER_LABEL[r.id],
                  value: r.people,
                  text: `${integer(r.people)} (${percent(r.people / people.length)})`,
                }))}
              />
            </Panel>
          </div>

          <Intervention
            key={barrier}
            barrier={barrier}
            people={people.filter((p) => p.barreiras_emprego === barrier)}
            companies={t.empresas_parceiras}
            actions={t.acoes_formacao}
          />

          <Panel
            id="table"
            title="Barreira e colocação"
            text="Quantas pessoas com cada barreira têm uma colocação válida."
          >
            <DataTable
              caption="Participantes e colocações por barreira"
              rows={rows}
              rowKey={(r) => r.id}
              count={(r) => r.people}
              initialSort="people"
              filename="rj-connect-barreiras"
              columns={[
                {
                  key: "name",
                  title: "Barreira",
                  value: (r) => BARRIER_LABEL[r.id],
                },
                {
                  key: "people",
                  title: "Participantes",
                  value: (r) => r.people,
                  cell: (r) => integer(r.people),
                },
                {
                  key: "placed",
                  title: "Com colocação válida",
                  value: (r) => r.placed,
                  cell: (r) => integer(r.placed),
                },
                {
                  key: "rate",
                  title: "Parte com colocação",
                  value: (r) => (r.people ? r.placed / r.people : 0),
                  cell: (r) => percent(r.people ? r.placed / r.people : 0),
                },
              ]}
            />
          </Panel>
        </>
      )}
    </>
  )
}

function Intervention({
  barrier,
  people,
  companies,
  actions,
}: {
  barrier: Barrier
  people: Participant[]
  companies: Company[]
  actions: TrainingAction[]
}) {
  return (
    <Panel
      id="intervention"
      title={`O que fazer: ${BARRIER_LABEL[barrier].toLowerCase()}`}
      text={FOCUS[barrier]}
      aside={
        <Link
          href="/percursos"
          className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Percursos por região e entidade
          <ArrowRight
            weight="bold"
            className="size-4 rtl:rotate-180"
            aria-hidden="true"
          />
        </Link>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Passos propostos</h3>
          <PlanView
            planKey={`barreira-${barrier}`}
            steps={planFor(barrier, "waiting", null, companies)}
          />
        </div>
        <div>
          {barrier === "experiencia" && <Internships actions={actions} />}
          {barrier === "documentacao" && <Documents />}
          {barrier === "horarios" && (
            <>
              <h3 className="mb-3 font-semibold">O que os dados têm</h3>
              <Note tone="warning">
                Os ficheiros têm as horas por semana de cada colocação, mas não
                o horário (manhã, noite, turnos) nem a disponibilidade das
                pessoas. Sem isso, a app não pode filtrar oportunidades por
                horário. Falta registar: dias, horas de início e de fim, e
                turnos, dos dois lados.
              </Note>
            </>
          )}
          {barrier === "distancia" && (
            <Distance people={people} companies={companies} />
          )}
          {barrier === "nenhuma" && (
            <>
              <h3 className="mb-3 font-semibold">Acompanhamento regular</h3>
              <ul className="flex list-disc flex-col gap-2 ps-5 text-sm">
                <li>Um contacto por mês enquanto procura emprego.</li>
                <li>Depois da colocação, contactos aos 45 e 75 dias.</li>
                <li>
                  Perguntar de novo pelas barreiras: podem não ter sido ditas à
                  entrada.
                </li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                São propostas a testar. Os dados não provam que resultam.
              </p>
            </>
          )}
        </div>
      </div>
    </Panel>
  )
}

function Internships({ actions }: { actions: TrainingAction[] }) {
  const own = actions.filter((a) => a.tipo_formacao === "estagio")
  const rows = [...Map.groupBy(own, (a) => a.area)].map(([area, list]) => ({
    id: area,
    label: label(area).replace(/^./, (c) => c.toUpperCase()),
    value: list.length,
    text: integer(list.length),
  }))
  return (
    <>
      <h3 className="mb-3 font-semibold">Estágios já feitos no programa</h3>
      <Bars rows={rows.sort((a, b) => b.value - a.value)} />
      <p className="mt-3 text-sm text-muted-foreground">
        Há {integer(own.length)} ações de estágio registadas. Não há estágios em
        agricultura nem em hotelaria, e há empresas parceiras nesses setores.
      </p>
    </>
  )
}

const DOCUMENTS = [
  ["Documento de identificação válido", "Instituto dos Registos e Notariado"],
  [
    "Título de residência, se for preciso",
    "Agência para a Integração, Migrações e Asilo",
  ],
  ["Número fiscal (NIF)", "Serviço de Finanças"],
  ["Número da Segurança Social (NISS)", "Segurança Social"],
  ["Inscrição no centro de emprego", "Serviço público de emprego"],
  ["Certificados de habilitações", "Escola ou entidade formadora"],
] as const

function Documents() {
  const [have, setHave] = useState<string[]>([])
  return (
    <>
      <h3 className="mb-3 font-semibold">Lista de documentos</h3>
      <ul className="flex flex-col">
        {DOCUMENTS.map(([name, where]) => (
          <li key={name}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={have.includes(name)}
                onChange={() =>
                  setHave(
                    have.includes(name)
                      ? have.filter((x) => x !== name)
                      : [...have, name]
                  )
                }
              />
              <span className="text-sm">
                {name}
                {!have.includes(name) && (
                  <span className="block text-muted-foreground">
                    Em falta. Encaminhar: {where}
                  </span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="mt-3 text-sm font-semibold">
        {have.length === DOCUMENTS.length
          ? "Está tudo."
          : `Faltam ${DOCUMENTS.length - have.length} documentos.`}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Lista de apoio à conversa, a rever pela equipa. Nada fica guardado. Os
        ficheiros não dizem que documentos faltam a cada pessoa.
      </p>
    </>
  )
}

function Distance({
  people,
  companies,
}: {
  people: Participant[]
  companies: Company[]
}) {
  const regions = [...new Set(people.map((p) => p.regiao))].sort()
  const [region, setRegion] = useState(regions[0] ?? "")
  const near = companies.filter((c) => c.regiao === region)
  return (
    <>
      <h3 className="mb-3 font-semibold">Empresas por localização</h3>
      <Select
        label="Região de quem procura"
        className="w-full sm:w-56"
        value={region}
        onValueChange={setRegion}
        options={regions.map((r) => ({ value: r, label: r }))}
      />
      <p aria-live="polite" className="mt-3 text-sm">
        {integer(people.filter((p) => p.regiao === region).length)} pessoas com
        esta barreira. {integer(near.length)}{" "}
        {near.length === 1 ? "empresa parceira" : "empresas parceiras"} na mesma
        região:
      </p>
      <ul className="mt-2 divide-y text-sm">
        {near.map((c) => (
          <li key={c.id}>
            <Link
              href={`/empresas/${c.id}`}
              prefetch={false}
              className="flex min-h-11 items-center justify-between gap-3 hover:text-primary"
            >
              <span className="font-medium">{c.nome_ficticio}</span>
              <span className="text-muted-foreground">{label(c.setor)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        Os ficheiros só têm a região. Para sugerir transportes falta o concelho
        das pessoas e das empresas.
      </p>
    </>
  )
}
