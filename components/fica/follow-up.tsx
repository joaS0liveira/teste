"use client"

import { ArrowRight, Bell } from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo } from "react"
import { cleanContacts } from "@/lib/fica/clean"
import { parseDate, REFERENCE_DATE } from "@/lib/fica/dates"
import { date, integer, percent } from "@/lib/fica/format"
import {
  contactSummary,
  documentSupport,
  firstContact,
  planStates,
} from "@/lib/fica/programme"
import { toObservedJobs, type Job } from "@/lib/fica/retention"
import { useFica, useTables, type Tables } from "@/lib/fica/store"
import { CallTimes } from "./call-times"
import { IntegrationPlans } from "./integration-plans"
import { FilterBar, Kpi, Note, PageHeader, Panel, Ready, Split } from "./kit"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "empresas_parceiras",
  "planos_acao",
  "acoes_formacao",
  "acompanhamentos",
] as const

export function FollowUp() {
  const data = useTables(TABLES)
  return (
    <>
      <PageHeader
        title="Acompanhamento e Planos de Ação"
        lead="O que está registado, o que falta fazer e quando agir."
      />
      <Ready data={data}>{(tables) => <Content {...tables} />}</Ready>
    </>
  )
}

function Content(t: Pick<Tables, (typeof TABLES)[number]>) {
  const entity = useFica((s) => s.filters.entity)
  const v = useMemo(() => {
    const people = t.participantes.filter(
      (p) => entity === "all" || p.entidade_social_id === entity
    )
    const ids = new Set(people.map((p) => p.id))
    const mine = <T extends { id_participante: string }>(rows: T[]) =>
      rows.filter((r) => ids.has(r.id_participante))
    // Spikes are found on the whole file, then the contacts are narrowed down.
    const whole = cleanContacts(t.acompanhamentos)
    const cleaned = {
      ...whole,
      contacts: whole.contacts.filter((c) => ids.has(c.raw.id_participante)),
      removed: mine(whole.removed),
    }
    const plans = mine(t.planos_acao)
    return {
      people,
      plans: planStates(plans),
      documents: documentSupport(people, plans),
      contacts: contactSummary(people, cleaned),
      first: firstContact(people, cleaned, parseDate),
      openTraining: mine(t.acoes_formacao).filter(
        (a) =>
          a.resultado === "em_curso" &&
          a.data_fim !== null &&
          a.data_fim <= REFERENCE_DATE
      ).length,
      toConfirm: cleaned.contacts.filter((c) => c.toConfirm).length,
      jobs: toObservedJobs(t.participantes, t.colocacoes).filter(
        (j) => entity === "all" || j.entityId === entity
      ),
    }
  }, [t, entity])
  const knownIds = useMemo(
    () => new Set(t.participantes.map((p) => p.id)),
    [t.participantes]
  )
  const { plans, documents, contacts } = v

  return (
    <>
      <FilterBar
        fields={["entity"]}
        entities={t.entidades_sociais}
        companies={t.empresas_parceiras}
      />

      <Panel
        id="plans"
        title="Planos de ação registados"
        text={`${integer(plans.people)} pessoas, ${integer(plans.actions)} ações, em ${integer(v.people.length)} participantes.`}
      >
        <Split
          parts={[
            {
              label: "Concluídas",
              value: plans.done,
              className: "bg-chart-1",
            },
            {
              label: "Em curso",
              value: plans.ongoing,
              className: "bg-chart-1/45",
            },
            {
              label: "Suspensas",
              value: plans.suspended,
              className: "bg-chart-2",
            },
          ]}
        />
        <div className="mt-6 grid items-center gap-6 lg:grid-cols-2">
          <p>
            <span className="block font-heading text-4xl font-semibold tracking-tight">
              {integer(documents.helped)}{" "}
              <span className="text-2xl">de {integer(documents.people)}</span>
            </span>
            <span className="text-sm">
              pessoas com barreira de documentação têm uma ação de apoio à
              documentação registada.
            </span>
          </p>
          <Note>
            A ausência de uma ação registada não significa necessariamente que o
            apoio não tenha acontecido. Representa uma oportunidade para
            melhorar a documentação e rastreabilidade das intervenções.
          </Note>
        </div>
      </Panel>

      <Panel
        id="contacts"
        title="Contactos de acompanhamento"
        text={`${integer(contacts.distinct + contacts.duplicates)} linhas nos ficheiros, ${integer(contacts.duplicates)} repetidas, ${integer(contacts.distinct)} contactos distintos.`}
      >
        <Split
          parts={[
            {
              label: "Realizados",
              value: contacts.done,
              className: "bg-chart-1",
            },
            {
              label: "Não realizados",
              value: contacts.notDone,
              className: "bg-chart-2",
            },
            {
              label: "Agendados, com data já passada",
              value: contacts.scheduled,
              className: "bg-chart-3",
            },
          ]}
        />
        <div className="mt-5">
          <Note tone="warning">
            {integer(contacts.usefulNotDone)} contactos não realizados têm
            resultado &quot;útil&quot;. É uma contradição no registo: a app
            ignora o resultado e mostra o caso na Qualidade dos Dados.
          </Note>
        </div>
      </Panel>

      <Indicators
        rows={[
          {
            value: integer(v.people.length - plans.people),
            title: "Participantes sem plano registado",
            text: `${percent((v.people.length - plans.people) / Math.max(1, v.people.length))} do total`,
          },
          {
            value: integer(contacts.withoutContact),
            title: "Sem nenhum contacto realizado",
            text: "Depois de ler os dois formatos de data.",
          },
          {
            value: integer(v.toConfirm),
            title: "Contactos agendados por confirmar",
            text: "A data já passou e não se sabe se aconteceram.",
            href: "/tarefas",
          },
          {
            value: integer(v.openTraining),
            title: "Formações em curso fora de prazo",
            text: "A data de fim já passou.",
            href: "/tarefas",
          },
          {
            value: "Não medido",
            title: "Sem acompanhamento recente",
            text: "Os registos de 22 a 30/12/2025 não são fiáveis, e são os mais recentes.",
          },
          {
            value: "Não medido",
            title: "Tempo até ao primeiro contacto",
            text: `A mediana daria ${v.first.median.toLocaleString("pt-PT")} dias, mas ${integer(v.first.unreliable)} de ${integer(v.first.people)} primeiros contactos caem em dias não fiáveis.`,
          },
        ]}
      />

      <Calls jobs={v.jobs} />

      <CallTimes
        entities={t.entidades_sociais}
        participants={t.participantes}
        placements={t.colocacoes}
        selectedId={entity}
      />

      <Panel
        id="plan-builder"
        title="Plano de Integração"
        text="Barreiras, objetivos, formação, ações, datas e histórico num só sítio."
      >
        <IntegrationPlans
          entities={t.entidades_sociais}
          companies={t.empresas_parceiras}
          knownIds={knownIds}
        />
      </Panel>
    </>
  )
}

function Indicators({
  rows,
}: {
  rows: { value: string; title: string; text: string; href?: string }[]
}) {
  return (
    <Panel
      id="reminders"
      title="Lembretes e pendentes"
      text={`Calculados nos ficheiros, até ${date(REFERENCE_DATE)}. São contagens de grupo.`}
    >
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <li key={r.title} className="flex flex-col rounded-xl border p-4">
            <span className="flex items-center gap-2 font-heading text-2xl font-semibold">
              <Bell
                weight="fill"
                className="size-5 text-primary"
                aria-hidden="true"
              />
              {r.value}
            </span>
            <span className="mt-1 text-sm font-medium">{r.title}</span>
            <span className="text-sm text-muted-foreground">{r.text}</span>
            {r.href && (
              <Link
                href={r.href}
                aria-label={`Resolver: ${r.title}`}
                className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Resolver
                <ArrowRight
                  weight="bold"
                  className="size-4 rtl:rotate-180"
                  aria-hidden="true"
                />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/** How many calls at 45 and 75 days, and what happens around them. */
function Calls({ jobs }: { jobs: Job[] }) {
  const active = jobs.filter((j) => !j.ended)
  const reaching = (day: number) =>
    active.filter((j) => j.days < day && j.days + 30 >= day).length
  const temporary = jobs.filter((j) => j.contract === "temporario" && j.ended)
  const between = (from: number, to: number) =>
    temporary.filter((j) => j.days >= from && j.days < to).length
  const bands = [
    { label: "Antes do dia 45", value: between(0, 45) },
    { label: "Do dia 45 ao 74", value: between(45, 75) },
    { label: "Do dia 75 ao 179", value: between(75, 180) },
    { label: "Dia 180 ou depois", value: between(180, 10_000) },
  ]
  return (
    <Panel
      id="calls"
      title="Contactos aos 45 e 75 dias"
      text="Uma proposta a testar, não um resultado comprovado. A ideia é falar com a pessoa antes de a maior parte das saídas acontecer."
      aside={
        <Link
          href="/radar"
          className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Abrir o radar de saídas
          <ArrowRight
            weight="bold"
            className="size-4 rtl:rotate-180"
            aria-hidden="true"
          />
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="grid grid-cols-2 gap-3">
          <Kpi
            value={integer(reaching(45))}
            label="Empregos a chegar ao dia 45"
            detail={`nos 30 dias depois de ${date(REFERENCE_DATE)}`}
          />
          <Kpi
            value={integer(reaching(75))}
            label="Empregos a chegar ao dia 75"
            detail={`nos 30 dias depois de ${date(REFERENCE_DATE)}`}
          />
        </dl>
        <div>
          <h3 className="text-sm font-semibold">
            Quando saíram os contratos temporários
          </h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {bands.map((b) => (
                <tr key={b.label} className="border-b last:border-0">
                  <th scope="row" className="py-2 text-start font-normal">
                    {b.label}
                  </th>
                  <td className="py-2 text-end tabular-nums">
                    {integer(b.value)}
                  </td>
                  <td className="w-20 py-2 text-end text-muted-foreground tabular-nums">
                    {temporary.length
                      ? percent(b.value / temporary.length)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  )
}
