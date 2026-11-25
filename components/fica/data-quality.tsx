"use client"

import { CaretDown, CaretUp, Warning } from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/action-button"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { EmptyState } from "@/components/ui/empty-state"
import { cleanContacts, isValidPlacement } from "@/lib/fica/clean"
import { parseDate } from "@/lib/fica/dates"
import { date, inHundred, integer, percent } from "@/lib/fica/format"
import { label } from "@/lib/fica/labels"
import { temporaryExitReasons } from "@/lib/fica/metrics"
import { contactSummary, firstContact } from "@/lib/fica/programme"
import { isOddReason, isOverdue, verdicts } from "@/lib/fica/quality"
import { useTables, type Tables } from "@/lib/fica/store"
import { useWorkspace } from "@/lib/fica/workspace"
import type { Placement } from "@/lib/fica/types"
import { DataTable, PageHeader, Panel } from "./kit"
import { LoadError, Loading, Numbers } from "./screen"

const TABLES = [
  "acompanhamentos",
  "colocacoes",
  "empresas_parceiras",
  "acoes_formacao",
  "participantes",
] as const

const PAGE = 20
const DAY_MS = 86_400_000

type Original = { id: string; original: string; now: string }
type Rule = {
  title: string
  kind: "Corrigido" | "Assinalado" | "Excluído"
  category: string
  why: string
  rows: Original[]
}

export function DataQuality() {
  const data = useTables(TABLES)
  return (
    <>
      <PageHeader
        title="Qualidade dos Dados"
        lead="O que está nos ficheiros, o que a app corrige, e o que fica de fora. Os originais nunca mudam."
      />
      {data.status === "loading" && <Loading />}
      {data.status === "error" && <LoadError retry={data.retry} />}
      {data.status === "ready" && <Content {...data.tables} />}
    </>
  )
}

function buildRules(
  cleaned: ReturnType<typeof cleanContacts>,
  {
    colocacoes,
    empresas_parceiras,
    acoes_formacao,
  }: Pick<Tables, (typeof TABLES)[number]>
): Rule[] {
  const companyIds = new Set(empresas_parceiras.map((c) => c.id))
  return [
    {
      title: "Contactos com data num pico",
      kind: "Assinalado",
      category: "Datas",
      why: "Um dia com mais de 10 vezes os contactos de um dia normal não é fiável. Os contactos contam, mas não se usa a data. A app não inventa outra.",
      rows: cleaned.contacts
        .filter((c) => c.dateStatus === "unreliable")
        .map((c) => ({
          id: c.raw.id,
          original: c.raw.data,
          now: "Sem data fiável",
        })),
    },
    {
      title: "Resultado em contactos não dados como realizados",
      kind: "Assinalado",
      category: "Contradições",
      why: "Só um contacto realizado pode ter resultado. O resultado é ignorado.",
      rows: cleaned.contacts
        .filter((c) => c.raw.resultado_contacto && !c.result)
        .map((c) => ({
          id: c.raw.id,
          original: `${label(c.raw.resultado_contacto!)} (${label(c.raw.estado).toLowerCase()})`,
          now: "Resultado ignorado",
        })),
    },
    {
      title: "Datas escritas como dd/mm/aaaa",
      kind: "Corrigido",
      category: "Datas",
      why: "Havia dois formatos de data misturados. Estas são sempre dia/mês e passam a aaaa-mm-dd.",
      rows: cleaned.contacts
        .filter((c) => parseDate(c.raw.data) !== c.raw.data)
        .map((c) => ({
          id: c.raw.id,
          original: c.raw.data,
          now:
            (parseDate(c.raw.data) ?? "Data inválida") +
            (c.dateStatus === "unreliable" ? " (num pico)" : ""),
        })),
    },
    {
      title: "Contactos agendados com data já passada",
      kind: "Assinalado",
      category: "Registos por fechar",
      why: "Não se sabe se aconteceram. Aparecem como por confirmar.",
      rows: cleaned.contacts
        .filter((c) => c.toConfirm)
        .map((c) => ({
          id: c.raw.id,
          original: `Agendado, ${c.raw.data}`,
          now: "Por confirmar",
        })),
    },
    {
      title: "Contactos repetidos",
      kind: "Excluído",
      category: "Duplicados",
      why: "O mesmo contacto aparecia mais de uma vez, com o mesmo código. Fica um.",
      rows: cleaned.removed.map((raw) => ({
        id: raw.id,
        original: `${label(raw.tipo_contacto)}, ${raw.data}`,
        now: "Repetição removida",
      })),
    },
    {
      title: "Colocações numa empresa que não existe",
      kind: "Assinalado",
      category: "Referências",
      why: "O código da empresa não está na lista de empresas. A colocação conta.",
      rows: colocacoes
        .filter((p) => !companyIds.has(p.id_empresa))
        .map((p) => ({
          id: p.id,
          original: p.id_empresa,
          now: "Empresa não identificada",
        })),
    },
    {
      title: "Colocações que acabam antes de começar",
      kind: "Excluído",
      category: "Datas",
      why: "As datas não podem estar certas. A pessoa conta como não colocada.",
      rows: colocacoes
        .filter((p) => !isValidPlacement(p))
        .map((p) => ({
          id: p.id,
          original: `${p.data_colocacao} a ${p.data_fim}`,
          now: "Não colocada",
        })),
    },
    {
      title: "Contratos permanentes com motivo de termo",
      kind: "Assinalado",
      category: "Contradições",
      why: "Um contrato permanente não chega ao termo. A colocação conta, e o motivo não é usado para explicar saídas.",
      rows: colocacoes.filter(isOddReason).map((p) => ({
        id: p.id,
        original: "Permanente, termo do contrato",
        now: "Motivo por confirmar",
      })),
    },
    {
      title: "Formações em curso depois da data de fim",
      kind: "Assinalado",
      category: "Registos por fechar",
      why: "A data de fim já passou e o resultado continua em curso. A app não adivinha o resultado.",
      rows: acoes_formacao.filter(isOverdue).map((a) => ({
        id: a.id,
        original: `Em curso, fim a ${a.data_fim}`,
        now: "Por confirmar",
      })),
    },
  ]
}

function Content(tables: Pick<Tables, (typeof TABLES)[number]>) {
  const cleaned = useMemo(
    () => cleanContacts(tables.acompanhamentos),
    [tables.acompanhamentos]
  )
  const rules = useMemo(() => buildRules(cleaned, tables), [cleaned, tables])

  if (cleaned.contacts.length === 0)
    return <EmptyState title="Ainda não há dados para mostrar" />

  const unreliable = cleaned.contacts.filter(
    (c) => c.dateStatus === "unreliable"
  ).length

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Verdicts cleaned={cleaned} tables={tables} />
      <section
        aria-labelledby="spike-title"
        className="rounded-2xl border bg-card p-5 sm:p-6"
      >
        <h2 id="spike-title" className="text-xl font-semibold text-balance">
          {inHundred(unreliable / cleaned.contacts.length)} em cada 100
          contactos têm uma data em que não confiamos
        </h2>
        <p className="mt-2 max-w-prose text-sm">
          Não usamos essas datas e não inventamos outras. Os números sobre
          empregos não dependem delas.
        </p>
        <Numbers>
          <p>
            {integer(unreliable)} de {integer(cleaned.contacts.length)}{" "}
            contactos ({percent(unreliable / cleaned.contacts.length)}).
          </p>
          <ContactsPerDay cleaned={cleaned} />
        </Numbers>
      </section>

      <section
        aria-labelledby="rules-title"
        className="rounded-2xl border bg-card p-5 sm:p-6"
      >
        <h2 id="rules-title" className="text-xl font-semibold">
          O que a app corrigiu, assinalou ou excluiu
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Os ficheiros originais não mudam. As correções são feitas ao carregar,
          e o mesmo registo pode cair em mais de uma regra.
        </p>
        <ul className="mt-4 divide-y">
          {rules.map((rule, index) => (
            <RuleItem key={rule.title} rule={rule} id={`rule-${index}`} />
          ))}
        </ul>
      </section>

      <Categories rules={rules} />
      <ExitReasons placements={tables.colocacoes} />
      <Divergences cleaned={cleaned} tables={tables} />
      <History cleaned={cleaned} rules={rules} />
    </div>
  )
}

function Verdicts({
  cleaned,
  tables,
}: {
  cleaned: ReturnType<typeof cleanContacts>
  tables: Pick<Tables, (typeof TABLES)[number]>
}) {
  const rows = verdicts(
    cleaned,
    tables.colocacoes,
    tables.empresas_parceiras,
    tables.acoes_formacao
  )
  return (
    <Panel
      id="verdicts"
      title="Estado dos registos"
      text="Cada registo conta uma vez, pelo problema mais sério que tem."
    >
      <DataTable
        caption="Registos válidos, corrigidos, assinalados e excluídos"
        rows={rows}
        rowKey={(r) => r.name}
        initialSort="total"
        filename="rj-connect-qualidade"
        columns={[
          { key: "name", title: "Ficheiro", value: (r) => r.name },
          {
            key: "total",
            title: "Registos",
            value: (r) => r.total,
            cell: (r) => integer(r.total),
          },
          ...(
            [
              ["valid", "Válidos", "Usados tal como estão."],
              [
                "corrected",
                "Corrigidos",
                "Usados depois de uma correção segura, como o formato da data.",
              ],
              [
                "flagged",
                "Assinalados",
                "Contam, mas o campo com problema não é usado.",
              ],
              [
                "excluded",
                "Excluídos",
                "Ficam fora das contas. Continuam nos ficheiros.",
              ],
            ] as const
          ).map(([key, title, hint]) => ({
            key,
            title,
            hint,
            value: (r: (typeof rows)[number]) => r.counts[key],
            cell: (r: (typeof rows)[number]) => (
              <>
                {integer(r.counts[key])}{" "}
                <span className="text-xs text-muted-foreground">
                  ({percent(r.counts[key] / r.total)})
                </span>
              </>
            ),
          })),
        ]}
      />
    </Panel>
  )
}

function Categories({ rules }: { rules: Rule[] }) {
  return (
    <Panel
      id="categories"
      title="Problemas por categoria e o que se faz"
      text="O critério é sempre o mesmo: corrigir só o que é certo, assinalar o que é duvidoso, excluir só o que é impossível ou repetido."
    >
      <DataTable
        caption="Problemas por categoria"
        rows={rules}
        rowKey={(r) => r.title}
        initialSort="rows"
        filename="rj-connect-problemas"
        columns={[
          { key: "title", title: "Problema", value: (r) => r.title },
          { key: "category", title: "Categoria", value: (r) => r.category },
          { key: "kind", title: "Tratamento", value: (r) => r.kind },
          {
            key: "rows",
            title: "Casos",
            value: (r) => r.rows.length,
            cell: (r) => integer(r.rows.length),
          },
        ]}
      />
    </Panel>
  )
}

function Divergences({
  cleaned,
  tables,
}: {
  cleaned: ReturnType<typeof cleanContacts>
  tables: Pick<Tables, (typeof TABLES)[number]>
}) {
  const s = contactSummary(tables.participantes, cleaned)
  const first = firstContact(tables.participantes, cleaned, parseDate)
  const valid = tables.colocacoes.filter(isValidPlacement).length
  const rows = [
    {
      title: `${integer(tables.colocacoes.length)} ou ${integer(valid)} colocações?`,
      text: `Há ${integer(tables.colocacoes.length)} nos ficheiros. ${integer(tables.colocacoes.length - valid)} acabam antes de começar e ficam de fora. A app usa ${integer(valid)}.`,
    },
    {
      title: "Uma colocação ou uma pessoa?",
      text: "Nos ficheiros cada pessoa tem no máximo uma colocação, por isso os dois números são iguais. Não se vê uma segunda colocação depois da saída.",
    },
    {
      title: `${integer(s.withoutContactIsoOnly)} ou ${integer(s.withoutContact)} pessoas sem contacto?`,
      text: `${integer(s.withoutContactIsoOnly)} só aparece se as ${integer(cleaned.converted)} datas escritas como dd/mm/aaaa forem ignoradas. Lendo os dois formatos, são ${integer(s.withoutContact)}. A app usa ${integer(s.withoutContact)}.`,
    },
    {
      title: "170 dias até ao primeiro contacto?",
      text: `Não se confirma. Com todas as datas a mediana é ${integer(first.median)} dias, e ${integer(first.unreliable)} desses primeiros contactos caem em dias não fiáveis. A app não usa este indicador.`,
    },
    {
      title: "Porque muda o número de casos aos 3, 6 e 12 meses?",
      text: "Só conta quem começou há tempo suficiente. Quem começou há dois meses não pode dizer nada sobre os seis meses.",
    },
  ]
  return (
    <Panel
      id="divergences"
      title="Números que podem parecer diferentes"
      text="Quando dois valores não coincidem, a app explica. Nunca altera um para bater certo com o outro."
    >
      <dl className="divide-y">
        {rows.map((r) => (
          <div key={r.title} className="py-3 first:pt-0 last:pb-0">
            <dt className="font-semibold">{r.title}</dt>
            <dd className="mt-1 max-w-prose text-sm text-muted-foreground">
              {r.text}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

function History({
  cleaned,
  rules,
}: {
  cleaned: ReturnType<typeof cleanContacts>
  rules: Rule[]
}) {
  const decisions = useWorkspace((s) => s.decisions)
  const count = (kind: Rule["kind"]) =>
    rules
      .filter((r) => r.kind === kind)
      .reduce((sum, r) => sum + r.rows.length, 0)
  const steps = [
    `Leitura dos ficheiros originais, sem os alterar: ${integer(cleaned.contacts.length + cleaned.removed.length)} linhas de contactos.`,
    `Duplicados: ${integer(cleaned.removed.length)} linhas com código repetido postas de lado.`,
    `Datas: ${integer(cleaned.converted)} convertidas, ${integer(cleaned.spikeDays.size)} dias com um pico assinalados.`,
    `Contradições e referências: ${integer(count("Assinalado"))} ocorrências assinaladas (um registo pode ter mais de uma).`,
    `Decisões da equipa neste navegador: ${integer(Object.keys(decisions).length)}.`,
  ]
  return (
    <Panel
      id="history"
      title="Histórico de validação"
      text="A validação corre sempre que os dados são carregados, por esta ordem. O resultado é sempre o mesmo para os mesmos ficheiros."
      aside={
        <Link
          href="/tarefas"
          className="inline-flex min-h-8 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Fechar registos em aberto
        </Link>
      }
    >
      <ol className="flex list-decimal flex-col gap-2 ps-5 text-sm">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </Panel>
  )
}

function ExitReasons({ placements }: { placements: Placement[] }) {
  const { total, reasons } = temporaryExitReasons(placements)
  const permanentTerms = placements.filter(
    (p) =>
      isValidPlacement(p) &&
      p.tipo_contrato === "permanente" &&
      p.motivo_saida === "termo_contrato"
  ).length
  return (
    <section
      aria-labelledby="reasons-title"
      className="rounded-2xl border bg-card p-5 sm:p-6"
    >
      <h2 id="reasons-title" className="text-xl font-semibold">
        O motivo de saída não explica as saídas
      </h2>
      <p className="mt-3 flex max-w-prose items-start gap-1.5 text-sm text-warning">
        <Warning
          weight="fill"
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        Este campo não foi corrigido. Usa-o com cuidado.
      </p>
      <p className="mt-2 max-w-prose text-sm">
        Nos {integer(total)} contratos temporários que acabaram, os motivos
        repartem-se quase por igual. Não se encontrou ligação à entidade, à
        duração, ao setor nem ao perfil. Há também {integer(permanentTerms)}{" "}
        contratos permanentes com o motivo &quot;termo do contrato&quot;.
      </p>
      <table className="mt-4 w-full max-w-prose text-sm">
        <caption className="sr-only">
          Motivos de saída nos contratos temporários que acabaram
        </caption>
        <thead>
          <tr className="border-b text-muted-foreground">
            <th scope="col" className="py-2 pe-2 text-start font-medium">
              Motivo registado
            </th>
            <th scope="col" className="px-2 py-2 text-end font-medium">
              Saídas
            </th>
            <th scope="col" className="py-2 ps-2 text-end font-medium">
              Parte
            </th>
          </tr>
        </thead>
        <tbody>
          {reasons.map(({ reason, count }) => (
            <tr key={reason ?? "none"} className="border-b last:border-0">
              <th scope="row" className="py-2 pe-2 text-start font-normal">
                {reason ? label(reason) : "Sem motivo registado"}
              </th>
              <td className="px-2 py-2 text-end tabular-nums">
                {integer(count)}
              </td>
              <td className="py-2 ps-2 text-end tabular-nums">
                {percent(count / total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

const chartConfig: ChartConfig = {
  normal: { label: "Dia normal", color: "var(--chart-1)" },
  spike: { label: "Pico", color: "var(--chart-2)" },
}

function ContactsPerDay({
  cleaned,
}: {
  cleaned: ReturnType<typeof cleanContacts>
}) {
  const { perDay, spikeDays, medianPerDay } = cleaned
  const { points, ticks } = useMemo(() => {
    const days = [...perDay.keys()].sort()
    const first = Date.parse(days[0])
    const last = Date.parse(days[days.length - 1])
    const points = []
    const ticks = []
    for (let time = first; time <= last; time += DAY_MS) {
      const day = new Date(time).toISOString().slice(0, 10)
      const count = perDay.get(day) ?? 0
      const inSpike = spikeDays.has(day)
      points.push({
        time,
        normal: inSpike ? 0 : count,
        spike: inSpike ? count : 0,
      })
      if (/-(01|07)-01$/.test(day)) ticks.push(time)
    }
    return { points, ticks }
  }, [perDay, spikeDays])

  const spike = [...spikeDays].sort()
  const inSpike = spike.reduce((sum, day) => sum + perDay.get(day)!, 0)
  const summary = spike.length
    ? `Pico: ${integer(inSpike)} contactos em ${spike.length} dias, de ${date(spike[0])} a ${date(spike[spike.length - 1])}.`
    : "Não há nenhum pico."

  return (
    <>
      <p className="mt-3 flex items-start gap-1.5 text-sm text-warning">
        <Warning
          weight="fill"
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        {summary}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Num dia normal há {integer(medianPerDay)} contactos.
      </p>
      <div role="img" aria-label={`Contactos por dia. ${summary}`}>
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto h-64 w-full"
        >
          <AreaChart
            data={points}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            accessibilityLayer={false}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              ticks={ticks}
              tickFormatter={(time: number) =>
                date(new Date(time).toISOString().slice(0, 7))
              }
              tick={{ fill: "var(--muted-foreground)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)" }}
              tickFormatter={integer}
              width={48}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as
                  (typeof points)[number] | undefined
                return active && point ? (
                  <div className="rounded-lg border bg-popover p-3 text-xs text-popover-foreground">
                    <p className="font-medium">
                      {date(new Date(point.time).toISOString().slice(0, 10))}
                    </p>
                    <p>
                      {integer(point.normal + point.spike)} contactos
                      {point.spike > 0 && " (pico)"}
                    </p>
                  </div>
                ) : null
              }}
            />
            <Area
              dataKey="normal"
              type="stepAfter"
              stroke="var(--color-normal)"
              fill="var(--color-normal)"
              fillOpacity={1}
              strokeWidth={1}
              isAnimationActive={false}
            />
            <Area
              dataKey="spike"
              type="stepAfter"
              stroke="var(--color-spike)"
              fill="var(--color-spike)"
              fillOpacity={1}
              strokeWidth={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <ul className="mt-2 flex gap-6 text-sm">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm bg-chart-1" />
          Dia normal
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm bg-chart-2" />
          Pico
        </li>
      </ul>
    </>
  )
}

function RuleItem({ rule, id }: { rule: Rule; id: string }) {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(PAGE)
  return (
    <li className="py-5 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="max-w-prose min-w-0 flex-1 basis-64 text-sm">
          <h3 className="font-semibold">{rule.title}</h3>
          <p className="mt-1 text-muted-foreground">{rule.why}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {integer(rule.rows.length)}
            <span className="sr-only"> casos</span>
          </p>
          <Button
            size="md"
            className="h-11"
            icon={open ? CaretUp : CaretDown}
            iconWeight="bold"
            aria-expanded={open}
            aria-controls={id}
            aria-label={`${open ? "Esconder" : "Ver"} originais: ${rule.title}`}
            onClick={() => setOpen(!open)}
          >
            {open ? "Esconder" : "Ver originais"}
          </Button>
        </div>
      </div>
      <div id={id}>
        {open && (
          <>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="py-2 pe-2 text-start font-medium">
                    Registo
                  </th>
                  <th scope="col" className="px-2 py-2 text-start font-medium">
                    Valor original
                  </th>
                  <th scope="col" className="py-2 ps-2 text-start font-medium">
                    Na app
                  </th>
                </tr>
              </thead>
              <tbody>
                {rule.rows.slice(0, shown).map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2 pe-2 tabular-nums">{row.id}</td>
                    <td className="px-2 py-2 tabular-nums">{row.original}</td>
                    <td className="py-2 ps-2 tabular-nums">{row.now}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rule.rows.length > shown && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  A mostrar {integer(shown)} de {integer(rule.rows.length)}
                </p>
                <Button
                  size="md"
                  className="h-11"
                  onClick={() => setShown(shown + PAGE)}
                >
                  Mostrar mais
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  )
}
