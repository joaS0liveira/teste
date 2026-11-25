"use client"

import { CaretDown } from "@phosphor-icons/react"
import { useState } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/text-field"
import { REFERENCE_DATE } from "@/lib/fica/dates"
import { date } from "@/lib/fica/format"
import {
  CATEGORIES,
  QUESTIONS,
  type Category,
  type Kind,
  type Question,
} from "@/lib/fica/study"
import { PageHeader } from "./kit"

const KIND_HELP: Record<Kind, string> = {
  Facto: "está nos dados",
  Hipótese: "explicação possível, por provar",
  Recomendação: "proposta de ação",
  Definição: "como a app usa a palavra",
}

/** Search without caring about accents or capitals. */
const plain = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

const matches = (q: Question, words: string[]) => {
  const text = plain([q.question, ...q.answer, q.limit ?? ""].join(" "))
  return words.every((w) => text.includes(w))
}

export function Study() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<Category | "all">("all")
  const words = plain(query).split(/\s+/).filter(Boolean)
  const found = QUESTIONS.filter(
    (q) => (category === "all" || q.category === category) && matches(q, words)
  )

  return (
    <>
      <PageHeader
        title="Conheça o Estudo"
        lead={`${QUESTIONS.length} perguntas e respostas curtas. Dados até ${date(REFERENCE_DATE)}.`}
      />
      <div className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4 print:hidden">
          <SearchField
            label="Procurar nas perguntas e respostas"
            placeholder="Ex.: E03, salário, censurados"
            className="max-w-xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            labels={{ clear: "Limpar a procura" }}
          />
          <div
            role="group"
            aria-label="Categoria"
            className="flex flex-wrap gap-2"
          >
            {[{ id: "all" as const, title: "Todas" }, ...CATEGORIES].map(
              (c) => (
                <button
                  key={c.id}
                  type="button"
                  className="min-h-11 rounded-xl border bg-card px-4 text-sm font-medium hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.title}
                </button>
              )
            )}
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {found.length === 1
              ? "1 pergunta encontrada"
              : `${found.length} perguntas encontradas`}
          </p>
        </div>

        {found.length === 0 ? (
          <EmptyState
            title="Nenhuma pergunta encontrada"
            description="Experimenta outra palavra ou escolhe Todas."
          />
        ) : (
          CATEGORIES.filter((c) => found.some((q) => q.category === c.id)).map(
            (c) => (
              <section key={c.id} aria-labelledby={`category-${c.id}`}>
                <h2
                  id={`category-${c.id}`}
                  className="mb-3 text-lg font-semibold"
                >
                  {c.title}
                </h2>
                <ul className="flex flex-col gap-2">
                  {found
                    .filter((q) => q.category === c.id)
                    .map((q) => (
                      <li key={q.question}>
                        <Answer question={q} />
                      </li>
                    ))}
                </ul>
              </section>
            )
          )
        )}

        <dl className="grid gap-3 rounded-2xl border bg-card p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(KIND_HELP) as Kind[]).map((kind) => (
            <div key={kind}>
              <dt className="font-semibold">{kind}</dt>
              <dd className="text-muted-foreground">{KIND_HELP[kind]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

function Answer({ question: q }: { question: Question }) {
  return (
    <details className="group rounded-2xl border bg-card open:border-primary">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-medium [&::-webkit-details-marker]:hidden">
        {q.question}
        <CaretDown
          weight="bold"
          className="size-4 shrink-0 text-primary transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className="flex max-w-prose flex-col gap-3 px-5 pb-5">
        <p className="text-sm font-semibold text-primary">
          {q.kind}{" "}
          <span className="font-normal text-muted-foreground">
            ({KIND_HELP[q.kind]})
          </span>
        </p>
        {q.answer.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {q.limit && (
          <p className="rounded-xl bg-accent px-4 py-3 text-sm">
            <strong className="font-semibold">Limite: </strong>
            {q.limit}
          </p>
        )}
      </div>
    </details>
  )
}
