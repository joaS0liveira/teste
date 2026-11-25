// What both sides are asked. The team's proposal: none of it comes from the data.

export type Side = "company" | "worker"
/** 2 yes, 1 more or less, 0 no. */
export type Reply = 0 | 1 | 2
export const REPLIES: { value: Reply; label: string }[] = [
  { value: 2, label: "Sim" },
  { value: 1, label: "Mais ou menos" },
  { value: 0, label: "Não" },
]

export type Topic =
  "contract" | "salary" | "hours" | "conditions" | "satisfaction"

export const TOPICS: {
  key: Topic
  label: string
  ask: Record<Side, string>
  /** When the two sides disagree. */
  disagree: string
  /** When both say it is going badly. */
  bad: string
}[] = [
  {
    key: "contract",
    label: "Contrato",
    ask: {
      company: "A pessoa sabe até quando dura o contrato e o que vem depois?",
      worker: "Sabes até quando dura o teu contrato e o que vem depois?",
    },
    disagree: "Dizer por escrito a data do fim e se há continuação.",
    bad: "Marcar uma conversa sobre a continuação antes do fim do contrato.",
  },
  {
    key: "salary",
    label: "Salário",
    ask: {
      company: "O que se paga é o que foi combinado?",
      worker: "O que recebes é o que foi combinado?",
    },
    disagree: "Rever o recibo em conjunto, com as horas e os descontos.",
    bad: "Corrigir o valor e dizer a partir de quando.",
  },
  {
    key: "hours",
    label: "Horário",
    ask: {
      company: "O horário é conhecido com antecedência e cumprido?",
      worker: "Sabes o teu horário com antecedência e ele é cumprido?",
    },
    disagree: "Publicar o horário com duas semanas de antecedência.",
    bad: "Combinar um horário fixo durante o primeiro mês.",
  },
  {
    key: "conditions",
    label: "Condições",
    ask: {
      company: "A pessoa tem quem a ajude e o material de que precisa?",
      worker: "Tens quem te ajude e o material de que precisas?",
    },
    disagree: "Escolher uma pessoa da equipa para acompanhar a chegada.",
    bad: "Ver no local o que falta e dar uma data para resolver.",
  },
  {
    key: "satisfaction",
    label: "Satisfação",
    ask: {
      company: "Queres que esta pessoa continue?",
      worker: "Queres continuar aqui?",
    },
    disagree: "Juntar os dois numa conversa de 15 minutos, com a entidade.",
    bad: "Procurar já outra colocação, para a pessoa não ficar parada.",
  },
]

export type Answers = Record<Topic, Reply>

export type TopicResult = {
  key: Topic
  company: number | null
  worker: number | null
  state: "unheard" | "half" | "good" | "bad" | "disagree" | "mixed"
}

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

/** Puts the two sides next to each other. */
export function compare(company: Answers[], worker: Answers[]): TopicResult[] {
  return TOPICS.map(({ key }) => {
    const a = mean(company.map((x) => x[key]))
    const b = mean(worker.map((x) => x[key]))
    let state: TopicResult["state"]
    if (a === null && b === null) state = "unheard"
    else if (a === null || b === null) state = "half"
    else if (Math.abs(a - b) >= 1) state = "disagree"
    else if (a >= 1.5 && b >= 1.5) state = "good"
    else if (a <= 0.5 && b <= 0.5) state = "bad"
    else state = "mixed"
    return { key, company: a, worker: b, state }
  })
}

/** 0 to 1, or null while one of the sides is missing. */
export function satisfactionOf(results: TopicResult[]): number | null {
  const r = results.find((x) => x.key === "satisfaction")!
  return r.company === null || r.worker === null
    ? null
    : (r.company + r.worker) / 4
}
