// Questions and recipes are the team's proposals. They do not come from the data.
import type { Consultation, Signal, SignalKey } from "./consultation.ts"
import { inHundred, integer } from "./format.ts"

type Option = {
  answer: string
  recipe: (c: Consultation) => string
  who: string
  when: string
}

type Topic = {
  /** Short name of the signal. */
  title: string
  /** One plain sentence comparing with the other entities. */
  finding: (s: Signal) => string
  question: (c: Consultation) => string
  options: Option[]
  /** Whether we know that this is linked to people staying. */
  linkedToStaying: boolean
}

const inTen = (rate: number) => Math.round(rate * 10)
const hours = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const topics: Record<SignalKey, Topic> = {
  temporary: {
    title: "Contratos temporários a mais",
    finding: (s) =>
      inTen(s.value) === inTen(s.usual)
        ? `Em cada 100 contratos, ${inHundred(s.value)} são temporários. Nas outras entidades, ${inHundred(s.usual)}.`
        : `Em cada 10 contratos, ${inTen(s.value)} são temporários. Nas outras entidades, ${inTen(s.usual)}.`,
    question: () => "Quem decide o tipo de contrato?",
    options: [
      {
        answer: "A empresa",
        recipe: (c) =>
          `Fala com as empresas com que mais trabalhas e pede a opção permanente. Um bom argumento: com as outras entidades, as mesmas empresas fazem só ${inHundred(c.facts.companyTemporary.min)} a ${inHundred(c.facts.companyTemporary.max)} contratos temporários em cada 100.`,
        who: "Quem fala com as empresas",
        when: "Nas próximas 4 semanas",
      },
      {
        answer: "Somos nós",
        recipe: () =>
          "Antes de aceitar um contrato temporário, pergunta se há opção permanente. Se não houver, regista o motivo.",
        who: "A equipa de colocação",
        when: "A partir de amanhã",
      },
      {
        answer: "Não sei",
        recipe: () =>
          "Regista em cada colocação quem decidiu o contrato e porquê. Ao fim de 4 semanas, repete a consulta.",
        who: "A equipa de colocação",
        when: "Durante 4 semanas",
      },
    ],
    linkedToStaying: true,
  },
  ending: {
    title: "Os temporários acabam cedo",
    finding: (s) =>
      `Em cada 100 contratos temporários, só ${inHundred(s.value)} chegam aos 6 meses. Nas outras entidades, ${inHundred(s.usual)}.`,
    question: () =>
      "O que fazem quando um contrato temporário está a chegar ao fim?",
    options: [
      {
        answer: "Falamos com a empresa antes",
        recipe: (c) =>
          `Passa essa conversa para antes do dia ${c.facts.firstExitDay}, que é quando começam as saídas.`,
        who: "Quem acompanha a pessoa",
        when: "Em todos os contratos novos",
      },
      {
        answer: "Só falamos quando acaba",
        recipe: (c) =>
          `Marca uma conversa com a empresa e com a pessoa antes do dia ${c.facts.firstExitDay}, que é quando começam as saídas.`,
        who: "Quem acompanha a pessoa",
        when: "Em todos os contratos novos",
      },
      {
        answer: "Não sei",
        recipe: () =>
          "Pergunta a 5 empresas o que aconteceu nos últimos contratos que acabaram, e o que teria feito a pessoa ficar.",
        who: "Quem fala com as empresas",
        when: "Nas próximas 2 semanas",
      },
    ],
    linkedToStaying: true,
  },
  placing: {
    title: "Coloca poucas pessoas",
    finding: (s) =>
      `Em cada 100 pessoas, ${inHundred(s.value)} arranjam emprego. Nas outras entidades, ${inHundred(s.usual)}.`,
    question: () => "Onde é que as pessoas param?",
    options: [
      {
        answer: "Faltam ofertas",
        recipe: () =>
          "Escolhe três empresas que já colocam com as outras entidades e ainda pouco contigo, e marca uma conversa.",
        who: "Quem fala com as empresas",
        when: "Nas próximas 4 semanas",
      },
      {
        answer: "Há ofertas, mas não servem",
        recipe: () =>
          "Regista o motivo de cada oferta que não serviu: horário, distância, experiência ou outro.",
        who: "A equipa de colocação",
        when: "Durante 4 semanas",
      },
      {
        answer: "Não sei",
        recipe: () =>
          "Revê o percurso de quem espera há mais de um ano e anota onde parou.",
        who: "Quem acompanha as pessoas",
        when: "Nas próximas 4 semanas",
      },
    ],
    linkedToStaying: false,
  },
  training: {
    title: "Formações por concluir",
    finding: (s) =>
      `Em cada 100 formações, ${inHundred(s.value)} são concluídas. Nas outras entidades, ${inHundred(s.usual)}.`,
    question: (c) =>
      `Há ${integer(c.facts.openPastEnd)} formações "em curso" com a data de fim já passada. O que são?`,
    options: [
      {
        answer: "Já acabaram, falta registar",
        recipe: (c) =>
          `Fecha esses ${integer(c.facts.openPastEnd)} registos e repete a consulta.`,
        who: "Quem regista as formações",
        when: "Nas próximas 2 semanas",
      },
      {
        answer: "As pessoas desistiram",
        recipe: () =>
          "Regista o motivo de cada desistência, sempre com as mesmas quatro opções: emprego, horário, distância ou não servia.",
        who: "Quem regista as formações",
        when: "A partir de amanhã",
      },
      {
        answer: "Não sei",
        recipe: (c) =>
          `Escolhe ${Math.min(30, c.facts.openPastEnd)} ao acaso e conta quantas acabaram e quantas foram desistência.`,
        who: "Quem regista as formações",
        when: "Nas próximas 2 semanas",
      },
    ],
    linkedToStaying: false,
  },
  support: {
    title: "Pouco tempo de apoio",
    finding: (s) =>
      `Cada pessoa teve ${hours.format(s.value)} horas de apoio em dois anos. Nas outras entidades, ${hours.format(s.usual)}.`,
    question: () => "Como se decidem as horas de apoio?",
    options: [
      {
        answer: "São sempre as mesmas",
        recipe: (c) =>
          `Leva esta conta a quem decide: para chegar ao habitual faltaram cerca de ${integer(Math.round(c.facts.hoursToUsual / 10) * 10)} horas em dois anos.`,
        who: "Quem dirige a entidade",
        when: "Na próxima reunião de orçamento",
      },
      {
        answer: "Depende da equipa",
        recipe: () =>
          "Anota quantas horas cada pessoa recebe e compara com as que pediram ajuda.",
        who: "A equipa de acompanhamento",
        when: "Durante 4 semanas",
      },
      {
        answer: "Não sei",
        recipe: () => "Pergunta a quem faz o orçamento como se chega às horas.",
        who: "Quem dirige a entidade",
        when: "Esta semana",
      },
    ],
    linkedToStaying: false,
  },
}
