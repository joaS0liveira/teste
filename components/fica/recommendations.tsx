"use client"

import { ArrowRight } from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo } from "react"
import { pilot } from "@/lib/fica/consultation"
import { integer, percent } from "@/lib/fica/format"
import { shortName } from "@/lib/fica/metrics"
import { groupSummary, toObservedJobs } from "@/lib/fica/retention"
import { useTables, type Tables } from "@/lib/fica/store"
import { Kpi, Note, PageHeader, Panel, Ready } from "./kit"

const TABLES = ["entidades_sociais", "participantes", "colocacoes"] as const

const MOMENTS = [
  {
    letter: "A",
    title: "Antes da colocação",
    actions: [
      {
        text: "Escolher o apoio pela barreira da pessoa",
        href: "/participantes",
        link: "Barreiras",
      },
      {
        text: "Ligar cada formação à necessidade a que responde",
        href: "/formacao",
        link: "Formação",
      },
      {
        text: "Combinar com a empresa o tipo de contrato e a duração, por escrito",
        href: "/empresas",
        link: "Empresas",
      },
      {
        text: "Perguntar à pessoa e à empresa o que cada uma espera",
        href: "/empresas",
        link: "Ouvir os dois lados",
      },
    ],
  },
  {
    letter: "B",
    title: "Durante a colocação",
    actions: [
      {
        text: "Contactos aos 45 e 75 dias, como proposta a testar",
        href: "/acompanhamento",
        link: "Acompanhamento",
      },
      {
        text: "Olhar primeiro para os grupos com mais saídas esperadas",
        href: "/radar",
        link: "Radar",
      },
      {
        text: "Falar com a empresa antes do fim do contrato temporário",
        href: "/empresas",
        link: "Empresas",
      },
      {
        text: "Registar o que foi combinado e rever na data marcada",
        href: "/acompanhamento",
        link: "Plano de Integração",
      },
    ],
  },
  {
    letter: "C",
    title: "Após a saída",
    actions: [
      {
        text: "Ouvir o motivo dos dois lados nos primeiros dias",
        href: "/empresas",
        link: "Ouvir os dois lados",
      },
      {
        text: "Abrir um plano novo: só 55 de 1 044 pessoas que saíram têm um plano posterior",
        href: "/percursos?etapa=left",
        link: "Percursos",
      },
      {
        text: "Registar a colocação seguinte, para medir a continuidade",
        href: "/permanencia",
        link: "Permanência",
      },
    ],
  },
  {
    letter: "D",
    title: "Avaliação dos resultados",
    actions: [
      {
        text: "Medir a permanência aos 3, 6 e 12 meses, com o número de casos",
        href: "/permanencia",
        link: "Permanência",
      },
      {
        text: "Testar uma mudança de cada vez, com grupo de comparação",
        href: "/simulador",
        link: "E se?",
      },
      {
        text: "Corrigir os registos que impedem de medir",
        href: "/qualidade",
        link: "Qualidade",
      },
    ],
  },
]

const STEPS = [
  [
    "Definir a pergunta",
    "Por exemplo: os contactos aos 45 e 75 dias aumentam a permanência aos 6 meses?",
  ],
  [
    "Escolher quem entra",
    "Colocações novas, com critérios escritos antes de começar.",
  ],
  [
    "Sortear",
    "Metade recebe já o acompanhamento reforçado, metade mantém o habitual. O acompanhamento habitual não se retira a ninguém.",
  ],
  [
    "Registar tudo",
    "Quem foi contactado, quando e o que se combinou. Também quem não se conseguiu contactar.",
  ],
  [
    "Comparar",
    "Permanência aos 6 meses nos dois grupos, com intervalo de 95%, contando toda a gente sorteada.",
  ],
  [
    "Decidir",
    "Alargar, mudar ou parar. E publicar o resultado, mesmo que não seja o esperado.",
  ],
]

const TOOLS = [
  ["/radar", "Radar de saídas", "Quantas saídas são esperadas e onde."],
  ["/empresas", "Casos por empresa", "Pistas, conversa e medidas combinadas."],
  ["/percursos", "Percursos", "Planos por barreira, etapa e região."],
  ["/tarefas", "Registos por fechar", "Contactos e formações em aberto."],
  ["/simulador", "E se?", "Menos contratos temporários: o que muda."],
  ["/custos", "Custos", "Por colocação e por emprego que dura."],
]

export function Recommendations() {
  const data = useTables(TABLES)
  return (
    <>
      <PageHeader
        title="Onde podemos agir?"
        lead="Propostas para antes, durante e depois da colocação, e a forma de saber se resultam."
      />
      <Ready data={data}>{(tables) => <Content {...tables} />}</Ready>
    </>
  )
}

function Content(t: Pick<Tables, (typeof TABLES)[number]>) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {MOMENTS.map((m) => (
          <section
            key={m.letter}
            aria-labelledby={`moment-${m.letter}`}
            className="rounded-2xl border bg-card p-6"
          >
            <h2
              id={`moment-${m.letter}`}
              className="flex items-center gap-3 text-lg font-semibold"
            >
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-primary font-heading text-primary-foreground"
              >
                {m.letter}
              </span>
              {m.title}
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {m.actions.map((a) => (
                <li key={a.text} className="flex flex-col">
                  {a.text}
                  <Link
                    href={a.href}
                    className="inline-flex min-h-7 items-center gap-1 self-start font-medium text-primary underline-offset-4 hover:underline print:hidden"
                  >
                    {a.link}
                    <ArrowRight
                      weight="bold"
                      className="size-3.5 rtl:rotate-180"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <CaseE03 tables={t} />

      <Panel
        id="evaluation"
        title="Como saber se resultou"
        text="Seis passos. Sem eles, uma melhoria pode ser só acaso ou um ano melhor."
      >
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex gap-3 rounded-xl border p-4">
              <span
                aria-hidden="true"
                className="font-heading text-2xl font-semibold text-primary"
              >
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-muted-foreground">
                  {text}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel id="tools" title="Ferramentas" className="print:hidden">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map(([href, title, text]) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full flex-col gap-1 rounded-xl border p-4 hover:border-primary hover:bg-accent"
              >
                <span className="flex items-center justify-between font-semibold">
                  {title}
                  <ArrowRight
                    weight="bold"
                    className="size-4 text-primary rtl:rotate-180"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm text-muted-foreground">{text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}

function CaseE03({
  tables,
}: {
  tables: Pick<Tables, (typeof TABLES)[number]>
}) {
  const { own, rest, test, name } = useMemo(() => {
    const jobs = toObservedJobs(tables.participantes, tables.colocacoes)
    const ids = new Set(
      tables.participantes
        .filter((p) => p.entidade_social_id === "E03")
        .map((p) => p.id)
    )
    const valid = new Set(jobs.map((j) => j.id))
    return {
      own: groupSummary(jobs.filter((j) => j.entityId === "E03")),
      rest: groupSummary(jobs.filter((j) => j.entityId !== "E03")),
      test: pilot(
        tables.colocacoes.filter(
          (p) => ids.has(p.id_participante) && valid.has(p.id)
        )
      ),
      name: shortName(tables.entidades_sociais.find((e) => e.id === "E03")!),
    }
  }, [tables])
  return (
    <Panel
      id="e03"
      title={`Caso: reforçar o acompanhamento na E03 ${name}`}
      text="É uma proposta a testar. Os dados não provam que o acompanhamento seja a causa da diferença."
      aside={
        <Link
          href="/consulta/E03"
          className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline print:hidden"
        >
          Abrir a consulta
          <ArrowRight
            weight="bold"
            className="size-4 rtl:rotate-180"
            aria-hidden="true"
          />
        </Link>
      }
    >
      <dl className="grid gap-3 sm:grid-cols-3">
        <Kpi
          value={percent(own.six.rate)}
          label="Ficam 6 meses na E03"
          detail={`${percent(rest.six.rate)} nas outras entidades`}
        />
        <Kpi
          value={percent(own.temporaryRate)}
          label="Contratos temporários na E03"
          detail={`${percent(rest.temporaryRate)} nas outras entidades`}
        />
        {test && (
          <Kpi
            value={`${integer(test.perGroup)} por grupo`}
            label="Colocações para o teste"
            detail={`cerca de ${integer(test.months)} meses a juntar casos e 6 a observar`}
            hint="Para detetar mais 20 pontos de permanência, com 80% de potência e 5% de erro, ao ritmo do último ano."
          />
        )}
      </dl>
      <ol className="mt-5 flex list-decimal flex-col gap-2 ps-5 text-sm">
        <li>Perguntar à E03 e às empresas como se decide o contrato.</li>
        <li>
          Todas as semanas, lista de colocações a chegar aos 45 e aos 75 dias.
        </li>
        <li>Conversa com a pessoa e com a empresa, registada no plano.</li>
        <li>
          Pedido concreto antes do fim do contrato: renovar, prolongar ou dizer
          porque não.
        </li>
        <li>Comparar com o grupo que mantém o acompanhamento habitual.</li>
      </ol>
      <div className="mt-5">
        <Note>
          Parte da diferença acompanha o tipo de contrato e parte aparece mesmo
          com contratos iguais. O acompanhamento é uma pista que se pode testar,
          não uma explicação demonstrada, e não é uma avaliação de quem trabalha
          na E03.
        </Note>
      </div>
    </Panel>
  )
}
