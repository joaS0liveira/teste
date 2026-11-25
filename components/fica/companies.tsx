"use client"

import { Ear, Handshake, MagnifyingGlass, Warning } from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { Segmented } from "@/components/ui/segmented-control"
import { Select } from "@/components/ui/select-field"
import { StatusPill } from "@/components/ui/status-pill"
import { companyCases, type CompanyCase } from "@/lib/fica/company"
import { label } from "@/lib/fica/labels"
import { compare, satisfactionOf } from "@/lib/fica/listen"
import { useTables, type Tables } from "@/lib/fica/store"
import { repliesOf, useWorkspace } from "@/lib/fica/workspace"
import { Fingerprint } from "./fingerprint"
import { LoadError, Loading, ScreenHeader } from "./screen"

const TABLES = [
  "participantes",
  "colocacoes",
  "empresas_parceiras",
  "acoes_formacao",
] as const

export function Companies() {
  const data = useTables(TABLES)
  return (
    <>
      <ScreenHeader title="Empresas" />
      {data.status === "loading" && <Loading />}
      {data.status === "error" && <LoadError retry={data.retry} />}
      {data.status === "ready" && <Content {...data.tables} />}
    </>
  )
}

export function CompanyStatus({ status }: { status: CompanyCase["status"] }) {
  if (status === "unusual")
    return (
      <StatusPill tone="warning" icon={Warning}>
        Sai do normal
      </StatusPill>
    )
  if (status === "watch")
    return (
      <StatusPill tone="brand" icon={MagnifyingGlass} iconWeight="bold">
        A investigar
      </StatusPill>
    )
  return <StatusPill>Dentro do normal</StatusPill>
}

type Show = "cases" | "all" | "agreements"

function Content({
  participantes,
  colocacoes,
  empresas_parceiras,
  acoes_formacao,
}: Pick<Tables, (typeof TABLES)[number]>) {
  const replies = useWorkspace((s) => s.replies)
  const agreements = useWorkspace((s) => s.agreements)
  const [show, setShow] = useState<Show>("cases")
  const [region, setRegion] = useState("all")

  const cases = useMemo(
    () =>
      companyCases(
        empresas_parceiras,
        participantes,
        colocacoes,
        acoes_formacao
      ),
    [empresas_parceiras, participantes, colocacoes, acoes_formacao]
  )
  const regions = [...new Set(empresas_parceiras.map((c) => c.regiao))].sort()
  const order = { unusual: 0, watch: 1, usual: 2 }
  const shown = cases
    .filter((c) => region === "all" || c.region === region)
    .filter((c) =>
      show === "cases"
        ? c.status !== "usual"
        : show === "agreements"
          ? agreements[c.id]
          : true
    )
    .toSorted((a, b) => order[a.status] - order[b.status] || b.rate - a.rate)

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Segmented
          label="Que empresas ver"
          size="md"
          className="h-11"
          value={show}
          onValueChange={setShow}
          options={[
            { value: "cases", label: "Casos" },
            { value: "agreements", label: "Com acordo" },
            { value: "all", label: "Todas" },
          ]}
        />
        <Select
          label="Região da empresa"
          className="w-full sm:w-52"
          value={region}
          onValueChange={setRegion}
          options={[
            { value: "all", label: "Todas as regiões" },
            ...regions.map((r) => ({ value: r, label: r })),
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={
            show === "agreements"
              ? "Ainda não há acordos"
              : "Nenhuma empresa com estes filtros"
          }
          description={
            show === "agreements"
              ? "Abre um caso, ouve os dois lados e propõe um acordo."
              : "Muda a região ou vê todas."
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => {
            const own = repliesOf(replies, c.id)
            const heard = own.company.length + own.worker.length
            const results = compare(own.company, own.worker)
            const disagree = results.filter(
              (r) => r.state === "disagree"
            ).length
            return (
              <li key={c.id}>
                <Link
                  href={`/empresas/${c.id}`}
                  prefetch={false}
                  className="flex h-full flex-col rounded-2xl bg-card p-5 transition-colors hover:bg-accent"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-lg leading-tight font-semibold">
                        {c.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {c.sector
                          ? `${capital(label(c.sector))}, ${c.region}`
                          : "Sem setor nem região"}
                      </span>
                    </span>
                    <Fingerprint
                      quality={c.quality}
                      satisfaction={satisfactionOf(results)}
                      className="size-20 shrink-0"
                    />
                  </span>
                  <span className="mt-3 text-sm">
                    De {c.seen} pessoas,{" "}
                    <strong className="font-semibold">{c.gone} saíram</strong>{" "}
                    antes dos 6 meses.
                  </span>
                  <span className="mt-auto flex flex-wrap gap-2 pt-4">
                    <CompanyStatus status={c.status} />
                    {c.belowActive > 0 && (
                      <StatusPill tone="warning" icon={Warning}>
                        Salário a rever
                      </StatusPill>
                    )}
                    {disagree > 0 ? (
                      <StatusPill tone="warning" icon={Ear} iconWeight="bold">
                        {disagree === 1
                          ? "1 desacordo"
                          : `${disagree} desacordos`}
                      </StatusPill>
                    ) : heard > 0 ? (
                      <StatusPill icon={Ear} iconWeight="bold">
                        {heard === 1 ? "1 resposta" : `${heard} respostas`}
                      </StatusPill>
                    ) : null}
                    {agreements[c.id] && (
                      <StatusPill
                        tone="positive"
                        icon={Handshake}
                        iconWeight="bold"
                      >
                        Acordo em curso
                      </StatusPill>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <p className="max-w-prose text-sm text-muted-foreground">
        O desenho de cada empresa tem cinco pontas: contrato, salário, horário,
        formação e satisfação. A ponta a tracejado ainda não tem resposta.
      </p>
    </div>
  )
}

export const capital = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1)
