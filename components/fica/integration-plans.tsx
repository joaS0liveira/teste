"use client"

import {
  CalendarPlus,
  Check,
  Plus,
  Trash,
  Warning,
} from "@phosphor-icons/react"
import { useState } from "react"
import { Button } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { Select } from "@/components/ui/select-field"
import { TextField } from "@/components/ui/text-field"
import { daysBetween } from "@/lib/fica/dates"
import { date, integer } from "@/lib/fica/format"
import {
  BARRIER_LABEL,
  BARRIERS,
  planFor,
  type Barrier,
  type PlanStep,
} from "@/lib/fica/journey"
import { shortName } from "@/lib/fica/metrics"
import { addDays } from "@/lib/fica/risk"
import type { Company, Entity } from "@/lib/fica/types"
import {
  fromToday,
  useWorkspace,
  type IntegrationPlan,
} from "@/lib/fica/workspace"
import { Kpi, Note } from "./kit"

const SITUATIONS = [
  "À procura de emprego",
  "Empregada há menos de 6 meses",
  "Empregada há 6 meses ou mais",
  "Saiu do emprego",
]
const FOLLOW_UP = [45, 75]
const QUIET_DAYS = 45

/** What to do next with one plan, and what does not add up. */
function warnings(plan: IntegrationPlan, today: string): string[] {
  const open = plan.actions.filter((a) => !a.completed)
  const last = plan.actions
    .flatMap((a) => (a.completed ? [a.completed] : []))
    .sort()
    .at(-1)
  const overdue = open.filter((a) => a.planned < today).length
  const out = []
  if (plan.actions.length === 0) out.push("Sem ações: junta o próximo passo.")
  if (overdue > 0)
    out.push(
      overdue === 1 ? "Uma ação em atraso." : `${overdue} ações em atraso.`
    )
  if (last && daysBetween(last, today) > QUIET_DAYS)
    out.push(`Sem ação concluída há mais de ${QUIET_DAYS} dias.`)
  if (plan.actions.some((a) => a.completed && a.completed > today))
    out.push("Há uma conclusão com data no futuro: confirma.")
  if (plan.jobStart && plan.situation === SITUATIONS[0])
    out.push("Tem início de emprego, mas está como à procura: confirma.")
  if (!plan.jobStart && plan.situation.startsWith("Empregada"))
    out.push("Está empregada e falta a data de início.")
  return out
}

/** A question is not an action: what counts are the steps behind its answers. */
const titles = (s: PlanStep): string[] =>
  s.options ? s.options.flatMap((o) => o.next.flatMap(titles)) : [s.title]

export function IntegrationPlans({
  entities,
  companies,
  knownIds,
}: {
  entities: Entity[]
  companies: Company[]
  knownIds: Set<string>
}) {
  const plans = useWorkspace((s) => s.integration)
  const savePlan = useWorkspace((s) => s.savePlan)
  const [code, setCode] = useState("")
  const [entityId, setEntityId] = useState(entities[0]?.id ?? "")
  const [barrier, setBarrier] = useState<Barrier>("experiencia")
  const [openId, setOpenId] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const today = fromToday(0)
  const selected = plans.find((p) => p.id === openId)

  const create = () => {
    const id = code.trim()
    const problem = !id
      ? "Escreve um código."
      : plans.some((p) => p.id === id)
        ? "Já existe um plano com este código."
        : knownIds.has(id)
          ? "Este código existe nos ficheiros. Usa um código interno que não identifique ninguém."
          : undefined
    setError(problem)
    if (problem) return
    savePlan({
      id,
      entityId,
      barrier,
      goal: "",
      training: "",
      situation: SITUATIONS[0],
      jobStart: null,
      actions: [],
    })
    setOpenId(id)
    setCode("")
  }

  const actions = plans.flatMap((p) => p.actions)
  const open = actions.filter((a) => !a.completed)
  const quiet = plans.filter((p) => {
    const last = p.actions
      .flatMap((a) => (a.completed ? [a.completed] : []))
      .sort()
      .at(-1)
    return !last || daysBetween(last, today) > QUIET_DAYS
  }).length

  return (
    <div className="flex flex-col gap-6">
      <Note>
        Demonstração. Os planos são escritos por ti, com um código interno, e
        ficam só neste navegador. A app não mostra perfis reais e não escolhe
        quem deve ser apoiado.
      </Note>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi value={integer(plans.length)} label="Planos criados aqui" />
        <Kpi
          value={integer(open.filter((a) => a.planned < today).length)}
          label="Ações em atraso"
          detail={`à data de hoje, ${date(today)}`}
        />
        <Kpi
          value={integer(actions.length - open.length)}
          label="Ações concluídas"
        />
        <Kpi
          value={integer(plans.filter((p) => p.actions.length === 0).length)}
          label="Planos sem ações"
        />
        <Kpi
          value={integer(quiet)}
          label="Sem acompanhamento recente"
          detail={`nada concluído nos últimos ${QUIET_DAYS} dias`}
        />
      </dl>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          create()
        }}
        className="grid items-start gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <TextField
          label="Código interno"
          description="Sem nomes nem códigos dos ficheiros. Ex.: INT-01"
          value={code}
          error={error}
          onChange={(e) => setCode(e.target.value)}
        />
        <Select
          label="Entidade"
          value={entityId}
          onValueChange={setEntityId}
          options={entities.map((e) => ({
            value: e.id,
            label: `${e.id} ${shortName(e)}`,
          }))}
        />
        <Select
          label="Barreira"
          value={barrier}
          onValueChange={(v) => setBarrier(v as Barrier)}
          options={BARRIERS.map((b) => ({
            value: b,
            label: BARRIER_LABEL[b],
          }))}
        />
        <Button
          type="submit"
          size="md"
          variant="primary"
          className="h-11 self-center"
          icon={Plus}
          iconWeight="bold"
        >
          Criar plano
        </Button>
      </form>

      {plans.length === 0 ? (
        <EmptyState
          title="Ainda não há planos"
          description="Cria o primeiro para ver os lembretes e os próximos passos."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <ul className="flex flex-col gap-2">
            {plans.map((p) => {
              const alerts = warnings(p, today)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={p.id === openId}
                    onClick={() => setOpenId(p.id)}
                    className="w-full rounded-xl border p-3 text-start text-sm hover:bg-accent aria-pressed:border-primary aria-pressed:bg-accent"
                  >
                    <span className="block font-semibold break-words">
                      {p.id}
                    </span>
                    <span className="block text-muted-foreground">
                      {p.entityId} · {BARRIER_LABEL[p.barrier]}
                    </span>
                    {alerts.length > 0 && (
                      <span className="mt-1 flex items-center gap-1.5 text-warning">
                        <Warning
                          weight="fill"
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        {alerts.length === 1
                          ? "1 alerta"
                          : `${alerts.length} alertas`}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          {selected ? (
            <Plan
              key={selected.id}
              plan={selected}
              companies={companies}
              today={today}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Escolhe um plano para o abrir.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Plan({
  plan,
  companies,
  today,
}: {
  plan: IntegrationPlan
  companies: Company[]
  today: string
}) {
  const save = useWorkspace((s) => s.savePlan)
  const remove = useWorkspace((s) => s.removePlan)
  const [text, setText] = useState("")
  const [planned, setPlanned] = useState(fromToday(15))
  const set = (change: Partial<IntegrationPlan>) => save({ ...plan, ...change })
  const add = (action: { text: string; planned: string }) =>
    set({
      actions: [
        ...plan.actions,
        { id: crypto.randomUUID(), completed: null, ...action },
      ],
    })
  const alerts = warnings(plan, today)
  const suggestions = planFor(
    plan.barrier,
    plan.situation === SITUATIONS[3]
      ? "left"
      : plan.situation.startsWith("Empregada")
        ? "employed"
        : "waiting",
    null,
    companies
  )
    .flatMap(titles)
    .filter((title) => !plan.actions.some((a) => a.text === title))
    .filter((title, i, all) => all.indexOf(title) === i)
    .slice(0, 5)
  const open = plan.actions
    .filter((a) => !a.completed)
    .toSorted((a, b) => a.planned.localeCompare(b.planned))
  const history = plan.actions
    .filter((a) => a.completed)
    .toSorted((a, b) => b.completed!.localeCompare(a.completed!))
  const missingCalls = plan.jobStart
    ? FOLLOW_UP.filter(
        (d) => !plan.actions.some((a) => a.text === `Contacto aos ${d} dias`)
      )
    : []

  return (
    <article
      aria-label={`Plano ${plan.id}`}
      className="flex min-w-0 flex-col gap-5 rounded-xl border p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold break-words">Plano {plan.id}</h3>
        <Button
          size="md"
          variant="quiet"
          className="h-11"
          icon={Trash}
          onClick={() => {
            if (confirm(`Apagar o plano ${plan.id}? Não dá para desfazer.`))
              remove(plan.id)
          }}
        >
          Apagar
        </Button>
      </div>
      {alerts.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-xl bg-chart-2/12 p-4 text-sm text-warning">
          {alerts.map((a) => (
            <li key={a} className="flex items-start gap-2">
              <Warning
                weight="fill"
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {a}
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Objetivo"
          placeholder="Ex.: estágio até março"
          value={plan.goal}
          onChange={(e) => set({ goal: e.target.value })}
        />
        <TextField
          label="Formação recomendada"
          value={plan.training}
          onChange={(e) => set({ training: e.target.value })}
        />
        <Select
          label="Situação de emprego"
          value={plan.situation}
          onValueChange={(situation) => set({ situation })}
          options={SITUATIONS.map((s) => ({ value: s, label: s }))}
        />
        <TextField
          type="date"
          label="Início do emprego"
          description="Se já tiver um"
          value={plan.jobStart ?? ""}
          onChange={(e) => set({ jobStart: e.target.value || null })}
        />
      </div>

      {missingCalls.length > 0 && (
        <Button
          size="md"
          className="h-11 self-start"
          icon={CalendarPlus}
          onClick={() =>
            set({
              actions: [
                ...plan.actions,
                ...missingCalls.map((d) => ({
                  id: crypto.randomUUID(),
                  text: `Contacto aos ${d} dias`,
                  planned: addDays(plan.jobStart!, d),
                  completed: null,
                })),
              ],
            })
          }
        >
          Marcar contactos aos {missingCalls.join(" e ")} dias
        </Button>
      )}

      <section aria-label="Ações planeadas">
        <h4 className="font-semibold">Ações planeadas</h4>
        {open.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma ação em aberto.
          </p>
        ) : (
          <ul className="mt-2 divide-y text-sm">
            {open.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2"
              >
                <span className="min-w-40 flex-1">
                  {a.text}
                  <span className="block text-muted-foreground">
                    {a.planned < today
                      ? `Em atraso, era para ${date(a.planned)}`
                      : `Prevista para ${date(a.planned)}`}
                  </span>
                </span>
                <Button
                  size="md"
                  className="h-11"
                  icon={Check}
                  iconWeight="bold"
                  aria-label={`Concluir: ${a.text}`}
                  onClick={() =>
                    set({
                      actions: plan.actions.map((x) =>
                        x.id === a.id ? { ...x, completed: today } : x
                      ),
                    })
                  }
                >
                  Concluída
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!text.trim() || !planned) return
            add({ text: text.trim(), planned })
            setText("")
          }}
          className="mt-3 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
        >
          <TextField
            label="Nova ação"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <TextField
            type="date"
            label="Data prevista"
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
          />
          <Button
            type="submit"
            size="md"
            className="h-10"
            disabled={!text.trim() || !planned}
          >
            Juntar
          </Button>
        </form>
      </section>

      {suggestions.length > 0 && (
        <section aria-label="Próximos passos sugeridos">
          <h4 className="font-semibold">Próximos passos sugeridos</h4>
          <ul className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => add({ text: s, planned: fromToday(15) })}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-start text-sm hover:border-primary hover:bg-accent"
                >
                  <Plus
                    weight="bold"
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Histórico">
        <h4 className="font-semibold">Histórico de acompanhamento</h4>
        {history.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Ainda nada concluído.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {history.map((a) => (
              <li key={a.id} className="flex items-start gap-2">
                <Check
                  weight="bold"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  {date(a.completed!)}: {a.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}
