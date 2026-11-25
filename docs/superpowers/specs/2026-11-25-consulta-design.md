# A Consulta: desenho

Estado: à espera de aprovação. Nada foi construído.

## Intenção

Hoje a RJ.connect mostra dados. Passa a ser uma consulta: a app examina a entidade, diz o que está fora do normal, pergunta o que os dados não sabem e propõe o que fazer e como testar.

- **Para quem:** quem coordena o programa ou dirige uma entidade. Não é técnico.
- **Porquê agora:** hackathon, critérios de criatividade e de adequação ao problema.
- **Sucesso:** uma pessoa faz a consulta de Lisboa em 2 minutos, sem ajuda, e sai a dizer o que está mal e o primeiro passo.

## O que não é

- Não prevê quem vai sair e não mostra pessoas: só totais.
- Não inventa causas. Os dados excluem hipóteses, a pessoa responde ao resto.
- Não culpa entidades.
- Sem IA, sem backend, sem bibliotecas novas.

## Caminhos considerados

| Caminho | Contra | Decisão |
|---|---|---|
| A. Consulta | Obriga a escrever perguntas e receitas | **Escolhido pela utilizadora** |
| B. Tapa a Fuga | Mostra onde agir, pouco sobre como | Aproveita-se só a animação, na abertura (proposta) |
| C. Paga Quem Fica | Não se sabe como as entidades são pagas | Fora |

## O percurso

### 0. Sala de espera (`/`)
A frase dos 64 e 42, e o ranking com o botão "Colocadas / Ainda empregadas", igual ao que existe. Cada entidade passa a ter "Examinar". As três tarefas saem daqui para as Pessoas.

### 1. O que se vê (`/consulta/[id]`)
Cem bonecos entram, arranjam emprego e alguns caem pelo caminho. Uma frase por momento. Com "reduzir movimento", aparece logo o estado final.

### 2. O que encontrei
Os sinais da entidade, por ordem: primeiro os que tocam em quem fica. Cada um traz uma comparação simples ("9 em cada 10 contratos são temporários; nas outras, 5") e o que já foi excluído.

### 3. Só tu sabes
Uma pergunta por sinal, com três respostas. "Não sei" é sempre uma delas.

### 4. A receita
Uma ação por sinal, que depende da resposta, com quem a faz e quando.

### 5. O teste
Quantas pessoas por grupo, quantos meses e quando rever. Só para os sinais T e D, onde se mede quem fica.

### 6. A folha
Uma página com tudo, para imprimir pelo browser. Nada é guardado.

## Os sinais

Cada entidade é comparada com a **mediana das outras sete**, para que Lisboa não distorça as restantes.

| Sinal | Medida | Ordem |
|---|---|---|
| T. Temporários a mais | % de colocações válidas com contrato temporário | 1 |
| D. Temporários acabam cedo | % que chega aos 180 dias, só com 180 dias de observação | 2 |
| C. Coloca poucas | % da coorte colocada no 1.º ano | 3 |
| F. Formações por concluir | % de formações concluídas | 4 |
| H. Pouco apoio | horas por pessoa | 5 |

- **Sinal claro:** 10 ou mais pontos e p < 0,001. Nas horas, menos de dois terços da mediana.
- **A vigiar:** 5 ou mais pontos e p < 0,05. Nas horas, menos de três quartos. O ecrã diz que pode ser acaso.
- **F e H** levam a nota: "Não se sabe se isto ajuda as pessoas a ficar."

Resultados já calculados, que os testes automáticos têm de confirmar:

| Entidade | Sinal claro | A vigiar |
|---|---|---|
| Lisboa | T (87,7 / 48,4), D (14,1 / 53,8), F (13,0 / 67,8), H (1,35 / 3,17) | |
| Sul | | C (48,4 / 62,6; p = 0,0010, por pouco) |
| Norte | | C (54,3 / 62,6) |
| Ilhas | | C (55,0 / 62,6), H (2,18 / 3,17), T (54,2 / 48,4) |
| Alentejo | | T (58,2 / 48,4), F (62,4 / 67,8) |
| Centro, Minho | | nenhum |
| Algarve | | nenhum; é a mais forte em T, D, F e H |

**Entidade sem sinais:** a consulta diz "Sem sinais", salta as perguntas e mostra com quem aprender.

**Com quem aprender:** em cada sinal, a entidade com o melhor valor. Com a nota "Estudar antes de copiar".

## Perguntas e receitas

São propostas da equipa, não vêm dos dados, e o ecrã di-lo.

**T. Quem decide o tipo de contrato?**
- *A empresa:* fala com as empresas com que mais trabalhas e pede a opção permanente. Argumento: as mesmas empresas fazem com as outras entidades entre 42% e 58% de temporários.
- *Nós:* antes de aceitar um temporário, pergunta se há opção permanente e regista o motivo.
- *Não sei:* durante 4 semanas, regista em cada colocação quem decidiu.

**D. O que fazem quando um contrato temporário se aproxima do fim?**
- *Falamos com a empresa antes:* passa essa conversa para antes do dia em que começam as saídas (Lisboa: dia 60).
- *Só quando acaba:* marca a conversa para antes desse dia.
- *Não sei:* pergunta a 5 empresas o que aconteceu nos últimos contratos que acabaram.

**C. Onde param as pessoas?**
- *Faltam ofertas:* escolhe as empresas que colocam com as outras entidades e ainda pouco contigo.
- *Há ofertas, mas não servem:* regista durante 4 semanas o motivo de cada recusa.
- *Não sei:* revê o percurso de quem espera há mais de um ano.

**F. O que é uma formação "em curso" com a data de fim passada?** (Lisboa: 489)
- *Já acabou, falta registar:* fecha esses registos e repete a consulta.
- *A pessoa desistiu:* regista o motivo nas próximas desistências.
- *Não sei:* revê 30 ao acaso e conta quantas são de cada tipo.

**H. Como se decidem as horas de apoio?**
- *São fixas:* faz a conta por pessoa e leva-a a quem decide. Para a mediana faltam cerca de 1 550 h em Lisboa, em dois anos.
- *Depende da equipa:* mede 4 semanas e compara.
- *Não sei:* pergunta a quem faz o orçamento.

## O teste

Dois grupos, com e sem a receita, escolhidos ao acaso entre todas as próximas colocações (não só as temporárias, senão não se testava a receita T). Objetivo fixo: detetar uma subida de 20 pontos em quem chega aos 180 dias (80% de poder, 5% de erro). Não se propõe teste onde a subida passaria dos 90%, porque já há pouco a ganhar. Hoje só Lisboa tem teste.

## O que acontece ao que existe

| Hoje | Passa a |
|---|---|
| Hoje | Consulta (sala de espera) |
| Entidades | Exames |
| Pessoas | Pessoas, com as três tarefas no topo |
| Custos | Custos |
| E se? | Sai do menu; abre-se a partir da receita T, com a nota de que mexe só numa das duas fugas |
| Podemos confiar? | Link no fundo, igual |

Nenhum ecrã é apagado.

## Limites

- Linguagem simples, 375 px, claro e escuro, teclado, "reduzir movimento".
- Os números da secção 6 do `PROMPT.md` não mudam.
- `public/data` nunca é alterado. Sem commit nem push.
- A Consulta carrega também formações e recursos; os contactos (5,3 MB) não.

## Decidido por quem constrói

Ficheiros e nomes em inglês, desenho dos bonecos, transições entre passos e onde fica o estado da consulta (memória, sem guardar).
