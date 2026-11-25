"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { EMPTY_PLAN, type Barrier, type PlanState } from "./journey.ts"
import type { Answers, Side } from "./listen.ts"

export type Measure = { id: string; text: string; done: boolean }
export type Agreement = {
  measures: Measure[]
  startedOn: string
  reviewOn: string
}

export type PlanAction = {
  id: string
  text: string
  planned: string
  /** Null while it is open. */
  completed: string | null
}

/** A plan without names: an internal code that means nothing outside the app. */
export type IntegrationPlan = {
  id: string
  entityId: string
  barrier: Barrier
  goal: string
  training: string
  situation: string
  jobStart: string | null
  actions: PlanAction[]
}

type Workspace = {
  replies: Record<string, Record<Side, Answers[]>>
  agreements: Record<string, Agreement>
  plans: Record<string, PlanState>
  /** What was decided about each open record. */
  decisions: Record<string, string>
  addReply: (companyId: string, side: Side, answers: Answers) => void
  clearReplies: (companyId: string) => void
  setAgreement: (companyId: string, agreement: Agreement | null) => void
  updatePlan: (key: string, change: (state: PlanState) => PlanState) => void
  resetPlan: (key: string) => void
  decide: (recordId: string, decision: string | null) => void
  integration: IntegrationPlan[]
  savePlan: (plan: IntegrationPlan) => void
  removePlan: (id: string) => void
  menuCollapsed: boolean
  setMenuCollapsed: (collapsed: boolean) => void
}

const NO_REPLIES: Record<Side, Answers[]> = { company: [], worker: [] }

/** Kept in this browser only. Nothing is sent anywhere. */
export const useWorkspace = create<Workspace>()(
  persist(
    (set) => ({
      replies: {},
      agreements: {},
      plans: {},
      decisions: {},
      integration: [],
      menuCollapsed: false,
      setMenuCollapsed: (menuCollapsed) => set({ menuCollapsed }),
      savePlan: (plan) =>
        set((s) => ({
          integration: s.integration.some((p) => p.id === plan.id)
            ? s.integration.map((p) => (p.id === plan.id ? plan : p))
            : [...s.integration, plan],
        })),
      removePlan: (id) =>
        set((s) => ({ integration: s.integration.filter((p) => p.id !== id) })),
      addReply: (companyId, side, answers) =>
        set((s) => {
          const current = s.replies[companyId] ?? NO_REPLIES
          return {
            replies: {
              ...s.replies,
              [companyId]: { ...current, [side]: [...current[side], answers] },
            },
          }
        }),
      clearReplies: (companyId) =>
        set((s) => {
          const replies = { ...s.replies }
          delete replies[companyId]
          return { replies }
        }),
      setAgreement: (companyId, agreement) =>
        set((s) => {
          const agreements = { ...s.agreements }
          if (agreement) agreements[companyId] = agreement
          else delete agreements[companyId]
          return { agreements }
        }),
      updatePlan: (key, change) =>
        set((s) => ({
          plans: { ...s.plans, [key]: change(s.plans[key] ?? EMPTY_PLAN) },
        })),
      resetPlan: (key) =>
        set((s) => {
          const plans = { ...s.plans }
          delete plans[key]
          return { plans }
        }),
      decide: (recordId, decision) =>
        set((s) => {
          const decisions = { ...s.decisions }
          if (decision) decisions[recordId] = decision
          else delete decisions[recordId]
          return { decisions }
        }),
    }),
    { name: "rj-connect" }
  )
)

export const repliesOf = (
  replies: Workspace["replies"],
  companyId: string
): Record<Side, Answers[]> => replies[companyId] ?? NO_REPLIES

/** Today plus some days, as yyyy-mm-dd. For what people plan from now on. */
export function fromToday(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}
