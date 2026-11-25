"use client"

import { useMemo } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { euros, integer, millionEuros, percent } from "@/lib/fica/format"
import { BARRIER_LABEL } from "@/lib/fica/journey"
import { label } from "@/lib/fica/labels"
import { spendingTotals, trainingImpact } from "@/lib/fica/metrics"
import { placementByTraining, trainingByBarrier } from "@/lib/fica/programme"
import { useFica, useTables, type Tables } from "@/lib/fica/store"
import {
  Bars,
  DataTable,
  FilterBar,
  Kpi,
  Note,
  PageHeader,
  Panel,
  Ready,
} from "./kit"

const TABLES = [
  "entidades_sociais",
  "participantes",
  "colocacoes",
  "empresas_parceiras",
  "acoes_formacao",
  "custos_formacao",
] as const

const STATES = {
  completed: "Concluiu pelo menos uma",
  ongoing: "Nenhuma concluída, com uma em curso",
  dropped: "Desistiu de todas",
  none: "Sem formação registada",
}

export function Training() {
  const data = useTables(TABLES)
  return (
    <>
      <PageHeader
        title="Formação e Desenvolvimento"
        lead="Quanto se investe, em que estado está, e se corresponde às necessidades."
      />
      <Ready data={data}>{(tables) => <Content {...tables} />}</Ready>
    </>
  )
}

function Content(t: Pick<Tables, (typeof TABLES)[number]>) {
  const entity = useFica((s) => s.filters.entity)
  const v = useMemo(() => {
    const people = t.participantes.filter(
      (p) => entity === "all" || p.entidade_social_id === entity
    )
    const ids = new Set(people.map((p) => p.id))
    const actions = t.acoes_formacao.filter((a) => ids.has(a.id_participante))
    const actionIds = new Set(actions.map((a) => a.id))
    const costs = t.custos_formacao.filter((c) => actionIds.has(c.id_acao))
    const placements = t.colocacoes.filter((p) => ids.has(p.id_participante))
    return {
      people,
      actions,
      impact: trainingImpact(placements, actions, costs),
      spend: spendingTotals(actions, costs, []),
      byBarrier: trainingByBarrier(people, placements, actions),
      byState: placementByTraining(people, placements, actions),
    }
  }, [t, entity])
  const { impact, spend } = v
  const share = (n: number) => percent(impact.cost ? n / impact.cost : 0)
  const types = [...Map.groupBy(v.actions, (a) => a.tipo_formacao)].map(
    ([type, rows]) => ({
      id: type,
      label: label(type),
      value: rows.length,
      text: integer(rows.length),
    })
  )
  const areas = new Set(t.acoes_formacao.map((a) => a.area))
  const missing = [...new Set(t.empresas_parceiras.map((c) => c.setor))].filter(
    (s) => !areas.has(s) && s !== "tecnologia"
  )

  return (
    <>
      <FilterBar
        fields={["entity"]}
        entities={t.entidades_sociais}
        companies={t.empresas_parceiras}
      />
      {v.actions.length === 0 ? (
        <EmptyState title="Sem formações com este filtro" />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi
              strong
              value={millionEuros(impact.cost)}
              label="Investidos em formação"
              detail={euros(impact.cost)}
            />
            <Kpi
              value={`${integer(impact.hours)} h`}
              label="Horas de formação"
            />
            <Kpi value={integer(impact.actions)} label="Ações de formação" />
            <Kpi
              value={millionEuros(spend.dropout)}
              label="Em ações com desistência"
              detail={`${euros(spend.dropout)}, ${share(spend.dropout)} do total`}
            />
            <Kpi
              value={millionEuros(impact.unplaced)}
              label="Em pessoas sem colocação válida"
              detail={`${euros(impact.unplaced)}, ${share(impact.unplaced)} do total`}
            />
          </dl>
          <Note>
            Estes valores não representam necessariamente investimento perdido.
            A formação pode produzir outros benefícios e alguns participantes
            podem vir a conseguir emprego posteriormente. Os dois últimos
            valores cruzam-se: não se podem somar.
          </Note>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel id="states" title="Estado das ações">
              <Bars
                rows={impact.results.map((r) => ({
                  id: r.label,
                  label: r.label,
                  value: r.count,
                  text: `${integer(r.count)} (${percent(r.count / impact.actions)})`,
                }))}
              />
            </Panel>
            <Panel id="types" title="Tipo de formação">
              <Bars rows={types.sort((a, b) => b.value - a.value)} />
              {missing.length > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Há empresas parceiras em{" "}
                  {missing.map((s) => label(s).toLowerCase()).join(" e ")}, mas
                  nenhuma formação com essa área.
                </p>
              )}
            </Panel>
          </div>

          <Panel
            id="match"
            title="Necessidade, barreira, formação e resultado"
            text="Para cada barreira: quantas pessoas tiveram formação, em que estado ficou e quantas têm colocação válida."
          >
            <DataTable
              caption="Formação e colocação por barreira"
              rows={v.byBarrier}
              rowKey={(r) => r.barrier}
              count={(r) => r.people}
              initialSort="people"
              filename="rj-connect-formacao-por-barreira"
              columns={[
                {
                  key: "barrier",
                  title: "Barreira",
                  value: (r) => BARRIER_LABEL[r.barrier],
                },
                {
                  key: "people",
                  title: "Pessoas",
                  value: (r) => r.people,
                  cell: (r) => integer(r.people),
                },
                {
                  key: "trained",
                  title: "Com formação",
                  value: (r) => r.trained,
                  cell: (r) => percent(r.trained),
                },
                {
                  key: "completed",
                  title: "Concluíram",
                  hint: "Pelo menos uma ação concluída.",
                  value: (r) => r.completed,
                  cell: (r) => percent(r.completed),
                },
                {
                  key: "dropped",
                  title: "Desistiram",
                  hint: "Pelo menos uma desistência. A mesma pessoa pode ter concluído outra.",
                  value: (r) => r.dropped,
                  cell: (r) => percent(r.dropped),
                },
                {
                  key: "placed",
                  title: "Com colocação válida",
                  value: (r) => r.placed,
                  cell: (r) => percent(r.placed),
                },
              ]}
            />
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">
              O tipo de formação não diz se responde à barreira: os ficheiros
              não têm esse campo. Para medir a correspondência, a formação devia
              ser registada com a necessidade a que responde.
            </p>
          </Panel>

          <Panel
            id="outcome"
            title="Formação e colocação"
            text="Parte das pessoas com colocação válida, conforme o que aconteceu à formação."
          >
            <DataTable
              caption="Colocação por situação da formação"
              rows={v.byState}
              rowKey={(r) => r.key}
              count={(r) => r.people}
              initialSort="people"
              filename="rj-connect-formacao-e-colocacao"
              columns={[
                {
                  key: "state",
                  title: "Formação",
                  value: (r) => STATES[r.key],
                },
                {
                  key: "people",
                  title: "Pessoas",
                  value: (r) => r.people,
                  cell: (r) => integer(r.people),
                },
                {
                  key: "placed",
                  title: "Com colocação válida",
                  value: (r) => r.placed,
                  cell: (r) => integer(r.placed),
                },
                {
                  key: "rate",
                  title: "Parte",
                  value: (r) => (r.people ? r.placed / r.people : 0),
                  cell: (r) => percent(r.people ? r.placed / r.people : 0),
                },
              ]}
            />
            <div className="mt-4">
              <Note tone="warning">
                Esta diferença não prova que a formação cria ou não cria
                emprego. Quem está há pouco tempo no programa teve menos tempo
                para concluir formação e para arranjar emprego.
              </Note>
            </div>
          </Panel>
        </>
      )}
    </>
  )
}
