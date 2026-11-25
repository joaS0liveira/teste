// The questions of "Conheça o Estudo". Every number comes from the engine or
// from the statistical report, always up to 31/12/2025.

export type Category =
  "problema" | "resultados" | "investigacao" | "metodologia" | "solucoes"

export const CATEGORIES: { id: Category; title: string }[] = [
  { id: "problema", title: "Problema" },
  { id: "resultados", title: "Resultados" },
  { id: "investigacao", title: "Investigação" },
  { id: "metodologia", title: "Metodologia" },
  { id: "solucoes", title: "Soluções" },
]

/** What kind of statement the answer is. */
export type Kind = "Facto" | "Hipótese" | "Recomendação" | "Definição"

export type Question = {
  category: Category
  question: string
  kind: Kind
  answer: string[]
  /** What the answer cannot say. */
  limit?: string
}

export const QUESTIONS: Question[] = [
  {
    category: "problema",
    question: "Qual é o problema que este estudo procura resolver?",
    kind: "Definição",
    answer: [
      "O programa sabe quantas pessoas colocou num emprego, mas não sabia quantas ficaram. De 1 704 colocações observadas pelo menos seis meses, 1 101 duraram seis meses: 64,6%. Nas outras 603 o emprego acabou antes.",
      "A aplicação mostra se o emprego dura, onde se perde e quando agir.",
    ],
  },
  {
    category: "problema",
    question: "Por que razão contar colocações não é suficiente?",
    kind: "Facto",
    answer: [
      "Porque duas entidades podem colocar muita gente e ter resultados opostos. Com seis meses de observação, a E03 tem 436 colocações e 111 duraram. A E07 tem 161 e 153 duraram. Quem só conta colocações vê a E03 à frente.",
    ],
  },
  {
    category: "problema",
    question: "Qual é a diferença entre conseguir emprego e manter um emprego?",
    kind: "Definição",
    answer: [
      "Conseguir emprego é um momento: o dia em que a colocação começa. Manter é um período: a mesma colocação continua aos 3, 6 ou 12 meses.",
      "Mudar de empresa não é o mesmo que perder o emprego. Há 158 saídas com o motivo mudança de emprego, e a app não as trata como fracasso de integração.",
    ],
    limit:
      "Os ficheiros têm no máximo uma colocação por pessoa. Não se vê para onde foi quem mudou.",
  },
  {
    category: "problema",
    question: "Por que foram escolhidos os períodos de 3, 6 e 12 meses?",
    kind: "Definição",
    answer: [
      "São três momentos diferentes: 3 meses (90 dias) para a permanência inicial, 6 meses (180 dias) para a estabilidade intermédia e 12 meses (365 dias) para a sustentabilidade.",
      "São os períodos pedidos pelo desafio. Nos dados, entre os 3 e os 6 meses concentram-se muitas saídas, por isso os 6 meses são o indicador principal.",
    ],
  },
  {
    category: "problema",
    question: "Qual é a importância da integração laboral sustentável?",
    kind: "Definição",
    answer: [
      "Um emprego que dura dá à pessoa tempo para ganhar experiência e estabilidade, e dá à empresa uma equipa que não recomeça de poucos em poucos meses. Para o programa, é o que separa uma colocação contada de um resultado.",
    ],
    limit:
      "Os ficheiros não medem satisfação, bem-estar nem rendimento da família. A duração é só uma parte da qualidade.",
  },
  {
    category: "resultados",
    question: "Qual é a taxa geral de permanência aos seis meses?",
    kind: "Facto",
    answer: [
      "64,6%: 1 101 de 1 704 colocações válidas com pelo menos 180 dias de observação. O intervalo de confiança de 95% vai de 62,3% a 66,8%.",
      "Aos 3 meses é 94,5% (2 061 casos) e aos 12 meses é 43,0% (862 casos). Os três grupos são diferentes, por isso não se leem como as mesmas pessoas a sair.",
    ],
  },
  {
    category: "resultados",
    question:
      "Por que existe tanta diferença entre contratos permanentes e temporários?",
    kind: "Facto",
    answer: [
      "Aos 6 meses ficam 96,3% com contrato permanente (781 casos) e 37,8% com temporário (923 casos). Aos 12 meses, nenhum dos 478 temporários observados continuava na colocação.",
      "Parte é a própria natureza do contrato, que tem um fim previsto. Mas os temporários da E03 acabam mais cedo do que os das outras entidades, por isso o contrato não explica tudo.",
    ],
    limit:
      "O motivo de saída não ajuda: só 180 das 946 saídas de temporários têm o motivo termo do contrato.",
  },
  {
    category: "resultados",
    question: "Qual entidade apresenta os melhores resultados?",
    kind: "Facto",
    answer: [
      "A E07: 95,0% aos 6 meses, com intervalo de 90,5% a 97,5% em 161 casos. O intervalo fica acima do das outras, por isso a diferença não é só acaso.",
      "Entre as entidades do meio, muitos intervalos cruzam-se. Não há uma ordem segura entre elas.",
    ],
    limit:
      "Melhor permanência não quer dizer melhor trabalho em tudo. Não se conhece a dificuldade dos casos para além do que está registado.",
  },
  {
    category: "resultados",
    question: "Por que a E03 apresenta uma taxa tão baixa?",
    kind: "Hipótese",
    answer: [
      "A E03 tem 25,5% aos 6 meses (21,6% a 29,7%), cerca de 53 pontos abaixo das outras. Cerca de 25 pontos acompanham a mistura de contratos: 87,7% são temporários. Os outros 28 vêm de os temporários da E03 acabarem mais cedo: as primeiras saídas são ao dia 60, contra cerca do dia 90 nas outras.",
      "As mesmas empresas usam mais temporários com a E03 (73% a 96%) do que com as outras entidades (42% a 58%).",
    ],
    limit:
      "Isto mostra onde está a diferença, não prova a causa. É preciso perguntar à E03 e às empresas como são combinados os contratos.",
  },
  {
    category: "resultados",
    question: "O que explica o resultado da E07?",
    kind: "Hipótese",
    answer: [
      "Na E07 só 28,4% dos contratos são temporários, e mesmo esses duram mais: a primeira saída é ao dia 159. Tem também mais horas de acompanhamento registadas por pessoa: 7,33, contra uma mediana de 3,17.",
    ],
    limit:
      "Sem a E03 e a E07, mais horas não andam com mais permanência nas outras seis. O acompanhamento é uma pista, não a explicação.",
  },
  {
    category: "resultados",
    question: "O salário influencia a permanência?",
    kind: "Facto",
    answer: [
      "Não se encontrou sinal. Acima da mediana do salário ficam 65,1% aos 6 meses, abaixo ficam 64,1%. A diferença cabe no acaso (p = 0,65), e continua a caber depois de ajustar a outros fatores (p = 0,63).",
    ],
    limit:
      "Só se compara o salário registado no início. Não se conhecem aumentos, prémios nem custos de deslocação.",
  },
  {
    category: "resultados",
    question: "Qual é o momento em que acontecem mais saídas?",
    kind: "Facto",
    answer: [
      "No 4.º mês de emprego, entre o dia 90 e o dia 119: 202 das 1 044 saídas. Entre o 3.º e o 7.º mês há mais de 100 saídas em cada mês.",
      "Nos primeiros 59 dias não há nenhuma saída registada. É esse o tempo para agir.",
    ],
  },
  {
    category: "investigacao",
    question:
      "Como sabemos que o tipo de contrato explica apenas uma parte do problema?",
    kind: "Facto",
    answer: [
      "Comparando contratos iguais. Dentro dos temporários, sair é muito mais frequente na E03 e muito menos na E07 do que nas outras: com o mesmo contrato, o ritmo de saída é cerca de 4,6 vezes maior na E03 e cerca de 0,42 vezes na E07.",
      "Se fosse só o contrato, estas diferenças desapareciam.",
    ],
  },
  {
    category: "investigacao",
    question: "Por que o perfil dos participantes não explica a diferença?",
    kind: "Facto",
    answer: [
      "Idade, qualificação, situação inicial, região e barreira, todas juntas, explicam cerca de 0,9% da variação. Juntando a entidade passa para 5,9%. As pessoas da E03 não têm um perfil registado diferente que justifique 53 pontos.",
    ],
    limit:
      "Só se avalia o que está registado. Motivação, família ou saúde não estão nos ficheiros.",
  },
  {
    category: "investigacao",
    question: "Como foi avaliada a influência das empresas?",
    kind: "Facto",
    answer: [
      "Comparou-se a permanência em cada empresa com a esperada para a sua mistura de entidades e contratos. As diferenças entre empresas cabem no acaso: p = 0,20 no total, 0,82 nos temporários e 0,26 nos permanentes.",
    ],
    limit:
      "Há 100 colocações numa empresa não identificada (P99), e 100 dos 136 grupos de empresa e entidade têm menos de 20 casos. Um efeito pequeno pode não se ver.",
  },
  {
    category: "investigacao",
    question: "Por que o acompanhamento é considerado uma pista importante?",
    kind: "Hipótese",
    answer: [
      "Porque as duas entidades dos extremos também são os extremos em horas de acompanhamento por pessoa: 1,35 na E03, 7,33 na E07, mediana de 3,17. E porque é algo que o programa pode mudar.",
    ],
    limit:
      "Com oito entidades isto é pouco. Sem essas duas, a relação até se inverte (correlação de -0,37). Não é uma causa demonstrada.",
  },
  {
    category: "investigacao",
    question:
      "Como poderíamos provar que mais acompanhamento melhora a permanência?",
    kind: "Recomendação",
    answer: [
      "Com um teste: sortear, entre colocações novas, quem recebe o acompanhamento reforçado primeiro e quem mantém o habitual, e comparar a permanência aos 6 meses.",
      "Na E03, para detetar uma melhoria de 20 pontos, são precisas cerca de 89 colocações por grupo: 6 meses a juntar casos e mais 6 a observar.",
    ],
  },
  {
    category: "metodologia",
    question: "Como foram calculadas as taxas de permanência?",
    kind: "Definição",
    answer: [
      "Para cada período conta-se só quem começou há tempo suficiente até 31/12/2025. Aos 6 meses: colocações iniciadas há 180 dias ou mais. Ficou quem ainda está na colocação ou saiu com 180 dias ou mais.",
      "Quem começou há dois meses não conta como ficou nem como saiu.",
    ],
  },
  {
    category: "metodologia",
    question: "O que significa uma margem de confiança de 95%?",
    kind: "Definição",
    answer: [
      "Quer dizer que o valor observado podia ter sido um pouco diferente por acaso. Se repetíssemos o programa muitas vezes, 95 em cada 100 intervalos calculados assim incluiriam o valor verdadeiro.",
      "Com poucos casos a margem é larga. Por isso os grupos com menos de 20 casos ficam assinalados. A app usa o intervalo de Wilson.",
    ],
  },
  {
    category: "metodologia",
    question: "O que é o método Kaplan-Meier?",
    kind: "Definição",
    answer: [
      "É uma forma de estimar quanto tempo algo dura quando parte dos casos ainda não acabou. Em cada dia, olha só para quem ainda está a ser acompanhado.",
      "Há 1 371 colocações ainda ativas. São casos censurados: sabe-se que duraram pelo menos até ali. Deitá-las fora faria o emprego parecer mais curto. Com este método, a mediana é de 235 dias.",
    ],
  },
  {
    category: "metodologia",
    question: "Por que existem colocações excluídas?",
    kind: "Facto",
    answer: [
      "Há 2 461 colocações nos ficheiros e 46 acabam antes de começar. É impossível, e não se sabe qual das datas está errada. Ficam fora das contas, e restam 2 415.",
      "Nada foi apagado: os ficheiros originais não mudam.",
    ],
  },
  {
    category: "metodologia",
    question: "Como a inconsistência dos registos pode afetar os resultados?",
    kind: "Facto",
    answer: [
      "Quase metade dos contactos (12 030 de 25 430) tem data num pico entre 22 e 30/12/2025, um sinal de registo em bloco. Por isso a app não mede o tempo até ao primeiro contacto.",
      "Há 1 531 contactos não realizados com resultado útil, 5 091 agendados com data já passada e 539 linhas repetidas. Os números sobre empregos não dependem destes contactos.",
    ],
  },
  {
    category: "metodologia",
    question: "Quais são as limitações deste estudo?",
    kind: "Facto",
    answer: [
      "São dados observados, não uma experiência: mostram associações, não causas. Há uma só colocação por pessoa, dois anos de dados e oito entidades.",
      "Não há satisfação, ambiente de trabalho, horários, concelho nem motivo de saída fiável. Sem colocação válida não quer dizer desempregado.",
    ],
  },
  {
    category: "solucoes",
    question: "Por que escolher os contactos aos 45 e 75 dias?",
    kind: "Recomendação",
    answer: [
      "Porque ficam antes das saídas. As primeiras saídas de temporários são ao dia 60 na E03 e perto do dia 90 nas outras, e o 4.º mês é o que tem mais saídas. O contacto aos 45 dias chega antes das primeiras, e o dos 75 antes do mês mais difícil.",
    ],
    limit:
      "São datas escolhidas pelos dados de saída, não datas testadas. É uma proposta a avaliar.",
  },
  {
    category: "solucoes",
    question: "Como seria implementado o reforço do acompanhamento na E03?",
    kind: "Recomendação",
    answer: [
      "Uma lista semanal das colocações temporárias que chegam aos 45 e aos 75 dias, uma conversa com a pessoa e com a empresa, e um pedido concreto à empresa antes do fim do contrato: renovar, prolongar ou dizer porquê não.",
      "Antes de começar, confirmar com a E03 como são combinados os contratos e se o registo das horas de acompanhamento está completo.",
    ],
  },
  {
    category: "solucoes",
    question: "Como poderíamos medir se as intervenções funcionaram?",
    kind: "Recomendação",
    answer: [
      "Definir antes quem entra e o que conta como sucesso, sortear a ordem de entrada, seguir os dois grupos 6 meses e comparar com intervalos de 95%. Conta-se toda a gente sorteada, mesmo quem não chegou a ser contactado.",
    ],
  },
  {
    category: "solucoes",
    question: "Que indicadores deveriam ser acompanhados no futuro?",
    kind: "Recomendação",
    answer: [
      "Permanência aos 3, 6 e 12 meses com número de casos, parte de contratos que passam a permanentes, segunda colocação depois de uma saída, contactos aos 45 e 75 dias feitos a tempo, motivo de saída ouvido dos dois lados, e parte dos registos sem problemas.",
    ],
  },
  {
    category: "solucoes",
    question: "Como este modelo poderia ser aplicado a outras entidades?",
    kind: "Recomendação",
    answer: [
      "As contas usam só datas, contrato, entidade e empresa. Com os mesmos campos, uma entidade nova aparece em todos os quadros e filtros sem mudar a aplicação.",
      "Com menos de 20 casos, a entidade é mostrada com aviso até haver dados suficientes.",
    ],
  },
]
