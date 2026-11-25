"use client"

import { ArrowBendDownRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/action-button"
import {
  EMPTY_PLAN,
  isDone,
  visibleSteps,
  type PlanStep,
} from "@/lib/fica/journey"
import { useWorkspace } from "@/lib/fica/workspace"
import { cn } from "@/lib/utils"

/** A plan that changes with the answers, and when a step does not move. */
export function PlanView({
  planKey,
  steps,
}: {
  planKey: string
  steps: PlanStep[]
}) {
  const state = useWorkspace((s) => s.plans[planKey]) ?? EMPTY_PLAN
  const update = useWorkspace((s) => s.updatePlan)
  const reset = useWorkspace((s) => s.resetPlan)
  const visible = visibleSteps(steps, state)
  const done = visible.filter((s) => isDone(s, state)).length
  const started =
    state.done.length + state.stuck.length + Object.keys(state.answers).length
  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

  return (
    <div>
      <div
        aria-hidden="true"
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-chart-1 transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${(done / visible.length) * 100}%` }}
        />
      </div>
      <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
        {done} de {visible.length} passos
      </p>
      <ol className="mt-4 flex flex-col gap-3">
        {visible.map((item) => {
          const complete = isDone(item, state)
          const stuck = state.stuck.includes(item.id)
          return (
            <li
              key={item.id}
              className={cn(
                "rounded-xl border p-4",
                complete && !stuck && "border-chart-1 bg-accent"
              )}
            >
              {item.options ? (
                <fieldset>
                  <legend className="font-semibold">{item.title}</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.options.map((option, i) => (
                      <label
                        key={option.label}
                        className="flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
                      >
                        <input
                          type="radio"
                          name={`${planKey}-${item.id}`}
                          className="sr-only"
                          checked={state.answers[item.id] === i}
                          onChange={() =>
                            update(planKey, (s) => ({
                              ...s,
                              answers: { ...s.answers, [item.id]: i },
                            }))
                          }
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <>
                  <p className="font-semibold">{item.title}</p>
                  {item.detail && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="md"
                      className="h-11 aria-pressed:bg-primary aria-pressed:bg-none aria-pressed:text-primary-foreground"
                      aria-pressed={state.done.includes(item.id)}
                      onClick={() =>
                        update(planKey, (s) => ({
                          ...s,
                          done: toggle(s.done, item.id),
                          stuck: s.stuck.filter((x) => x !== item.id),
                        }))
                      }
                    >
                      Feito
                    </Button>
                    {item.instead && (
                      <Button
                        size="md"
                        variant="quiet"
                        className="h-11 aria-pressed:bg-chart-2/20 aria-pressed:text-warning"
                        aria-pressed={stuck}
                        onClick={() =>
                          update(planKey, (s) => ({
                            ...s,
                            stuck: toggle(s.stuck, item.id),
                            done: s.done.filter((x) => x !== item.id),
                          }))
                        }
                      >
                        Não avançou
                      </Button>
                    )}
                  </div>
                  {stuck && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-warning">
                      <ArrowBendDownRight
                        weight="bold"
                        className="size-4 rtl:-scale-x-100"
                        aria-hidden="true"
                      />
                      O plano mudou. Vê o passo seguinte.
                    </p>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ol>
      {started > 0 && (
        <Button
          size="md"
          variant="quiet"
          className="mt-4 h-11"
          onClick={() => reset(planKey)}
        >
          Recomeçar este plano
        </Button>
      )}
    </div>
  )
}
