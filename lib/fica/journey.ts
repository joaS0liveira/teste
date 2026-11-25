import { isValidPlacement } from "./clean.ts"
import { daysBetween, REFERENCE_DATE } from "./dates.ts"
import type { Company, Participant, Placement } from "./types.ts"

export type Stage = "new" | "waiting" | "employed" | "left"
export const STAGES: Stage[] = ["waiting", "left", "new", "employed"]
export const STAGE_LABEL: Record<Stage, string> = {
  new: "À procura há menos de um ano",
  waiting: "À procura há um ano ou mais",
  employed: "Empregada",
  left: "Saiu do emprego",
}

export type Barrier =
  "experiencia" | "documentacao" | "horarios" | "distancia" | "nenhuma"
export const BARRIERS: Barrier[] = [
  "experiencia",
  "documentacao",
  "horarios",
  "distancia",
  "nenhuma",
]
export const BARRIER_LABEL: Record<Barrier, string> = {
  experiencia: "Falta de experiência",
  documentacao: "Documentação",
  horarios: "Horários",
  distancia: "Distância",
  nenhuma: "Nenhuma identificada",
}

export type Journey = {
  id: string
  region: string
  entityId: string
  barrier: Barrier
  stage: Stage
  hasPlan: boolean
}

export function journeys(
  participants: Participant[],
  placements: Placement[],
  plans: { id_participante: string }[]
): Journey[] {
  const placementOf = new Map(
    placements.filter(isValidPlacement).map((p) => [p.id_participante, p])
  )
  const planned = new Set(plans.map((p) => p.id_participante))
  return participants.map((p) => {
    const placement = placementOf.get(p.id)
    const stage: Stage = placement
      ? placement.data_fim
        ? "left"
        : "employed"
      : daysBetween(p.data_entrada, REFERENCE_DATE) >= 365
        ? "waiting"
        : "new"
    return {
      id: p.id,
      region: p.regiao,
      entityId: p.entidade_social_id,
      barrier: p.barreiras_emprego as Barrier,
      stage,
      hasPlan: planned.has(p.id),
    }
  })
}

/** People who left and have an action plan dated after leaving. */
export function plannedAfterLeaving(
  placements: Placement[],
  plans: { id_participante: string; data: string }[]
) {
  const leavers = placements.filter((p) => isValidPlacement(p) && p.data_fim)
  const followed = leavers.filter((p) =>
    plans.some(
      (plan) =>
        plan.id_participante === p.id_participante && plan.data > p.data_fim!
    )
  )
  return { left: leavers.length, followed: followed.length }
}

export type PlanStep = {
  id: string
  title: string
  detail?: string
  /** Answers that change what comes next. */
  options?: { label: string; next: PlanStep[] }[]
  /** Used when someone says this step did not move forward. */
  instead?: PlanStep
}

const step = (
  id: string,
  title: string,
  detail?: string,
  instead?: PlanStep
): PlanStep => ({ id, title, detail, instead })

const SEARCH: Record<
  Barrier,
  (region: string | null, c: Company[]) => PlanStep[]
> = {
  experiencia: () => [
    {
      id: "exp",
      title: "O que falta para ganhar experiência?",
      options: [
        {
          label: "Nunca trabalhou",
          next: [
            step(
              "exp-estagio",
              "Procurar um estágio na área que a pessoa escolher",
              "Os estágios já existem nas formações do programa."
            ),
            step(
              "exp-primeiro",
              "Pedir a uma empresa parceira uma primeira experiência de 3 meses",
              undefined,
              step("exp-visita", "Começar por uma visita de um dia à empresa")
            ),
          ],
        },
        {
          label: "Trabalhou, mas noutra área",
          next: [
            step(
              "exp-transferir",
              "Escrever três tarefas que já fez e que servem na nova área"
            ),
            step(
              "exp-formacao",
              "Escolher uma formação curta na área da empresa",
              "E acompanhar até ficar concluída."
            ),
          ],
        },
        {
          label: "Não se sabe",
          next: [step("exp-conversa", "Marcar uma conversa de 20 minutos")],
        },
      ],
    },
  ],
  documentacao: () => [
    {
      id: "doc",
      title: "Que documento falta?",
      options: [
        {
          label: "Identificação",
          next: [
            step("doc-id", "Marcar atendimento e juntar os documentos pedidos"),
            step(
              "doc-id-2",
              "Confirmar que o documento chegou",
              undefined,
              step("doc-id-3", "Ir com a pessoa ao atendimento")
            ),
          ],
        },
        {
          label: "Morada ou residência",
          next: [
            step("doc-mor", "Pedir o comprovativo à junta ou ao senhorio"),
            step(
              "doc-mor-2",
              "Confirmar a entrega",
              undefined,
              step("doc-mor-3", "Encaminhar para o apoio social")
            ),
          ],
        },
        {
          label: "Certificados ou currículo",
          next: [
            step("doc-cert", "Pedir segunda via dos certificados"),
            step("doc-cv", "Escrever o currículo com a pessoa"),
          ],
        },
        {
          label: "Não se sabe",
          next: [step("doc-lista", "Rever a lista de documentos com a pessoa")],
        },
      ],
    },
  ],
  horarios: () => [
    {
      id: "hor",
      title: "Que horário é possível?",
      options: [
        {
          label: "Só de manhã ou só de tarde",
          next: [
            step(
              "hor-parcial",
              "Pedir às empresas parceiras horários até 25 horas",
              undefined,
              step("hor-parcial-2", "Perguntar por fins de semana")
            ),
          ],
        },
        {
          label: "Não pode noites nem fins de semana",
          next: [step("hor-fixo", "Procurar horário fixo de segunda a sexta")],
        },
        {
          label: "Tem alguém a cargo",
          next: [
            step("hor-cuidar", "Encaminhar para apoio a quem cuida"),
            step("hor-flex", "Pedir horário flexível na proposta à empresa"),
          ],
        },
        {
          label: "Não se sabe",
          next: [step("hor-conversa", "Escrever a semana possível da pessoa")],
        },
      ],
    },
  ],
  distancia: (region, companies) => {
    const near = companies.filter((c) => !region || c.regiao === region)
    return [
      step(
        "dis-perto",
        region
          ? `Falar com as empresas parceiras da região ${region}`
          : "Falar com as empresas parceiras da região da pessoa",
        near.length
          ? near.map((c) => c.nome_ficticio).join(", ")
          : "Não há empresas parceiras nesta região.",
        step(
          "dis-outra",
          "Procurar na região vizinha, com transporte visto antes"
        )
      ),
      step(
        "dis-transporte",
        "Ver com a pessoa o caminho, a hora e o preço do transporte",
        "Os dados não têm transportes: é preciso confirmar."
      ),
    ]
  },
  nenhuma: () => [
    step("nen-conversa", "Marcar uma conversa para perceber o que falta"),
    {
      id: "nen",
      title: "Apareceu alguma dificuldade?",
      options: [
        {
          label: "Sim",
          next: [
            step("nen-registar", "Registar a nova barreira e mudar de plano"),
          ],
        },
        {
          label: "Não",
          next: [step("nen-ofertas", "Apresentar a pessoa a duas empresas")],
        },
      ],
    },
  ],
}

const FIRST_DAYS: PlanStep[] = [
  step("emp-15", "Falar com a pessoa e com a empresa ao dia 15"),
  step(
    "emp-45",
    "Ouvir os dois lados ao dia 45",
    "As perguntas estão no caso da empresa.",
    step("emp-45b", "Juntar os dois numa conversa de 15 minutos")
  ),
  {
    id: "emp-contrato",
    title: "O contrato é temporário?",
    options: [
      {
        label: "Sim",
        next: [
          step(
            "emp-fim",
            "Perguntar à empresa pela continuação, um mês antes do fim"
          ),
        ],
      },
      {
        label: "Não",
        next: [step("emp-75", "Rever ao dia 75 e fechar o plano")],
      },
    ],
  },
]

const AFTER: PlanStep = {
  id: "sai",
  title: "O que aconteceu ao emprego?",
  options: [
    {
      label: "Mudou de empresa",
      next: [
        step(
          "sai-nova",
          "Registar a nova empresa e continuar o acompanhamento lá",
          "A pessoa não começa do zero."
        ),
      ],
    },
    {
      label: "O contrato acabou",
      next: [
        step("sai-fim", "Perguntar à empresa se há nova vaga"),
        step(
          "sai-voltar",
          "Retomar o plano da barreira, já com a experiência nova"
        ),
      ],
    },
    {
      label: "Saiu por vontade própria",
      next: [
        step("sai-motivo", "Ouvir o motivo e juntá-lo ao caso da empresa"),
        step(
          "sai-voltar",
          "Retomar o plano da barreira, já com a experiência nova"
        ),
      ],
    },
    {
      label: "Não se sabe",
      next: [step("sai-ligar", "Ligar nos próximos 7 dias")],
    },
  ],
}

export function planFor(
  barrier: Barrier,
  stage: Stage,
  region: string | null,
  companies: Company[]
): PlanStep[] {
  if (stage === "employed") return FIRST_DAYS
  const search = SEARCH[barrier](region, companies)
  const review = step("rever", "Rever o plano daqui a 15 dias")
  if (stage === "left") return [AFTER, ...search, review]
  return [...search, review]
}

/** Answers and "did not move forward" marks decide which steps are on the plan. */
export type PlanState = {
  done: string[]
  answers: Record<string, number>
  stuck: string[]
}

export const EMPTY_PLAN: PlanState = { done: [], answers: {}, stuck: [] }

export function visibleSteps(plan: PlanStep[], state: PlanState): PlanStep[] {
  return plan.flatMap((item) => {
    const chosen = state.answers[item.id]
    const next =
      item.options && chosen !== undefined ? item.options[chosen].next : []
    const instead =
      item.instead && state.stuck.includes(item.id) ? [item.instead] : []
    return [item, ...instead, ...visibleSteps(next, state)]
  })
}

export function isDone(item: PlanStep, state: PlanState): boolean {
  return item.options
    ? state.answers[item.id] !== undefined
    : state.done.includes(item.id) || state.stuck.includes(item.id)
}
