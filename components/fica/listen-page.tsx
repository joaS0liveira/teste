"use client"

import { ArrowLeft, CheckCircle } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { REPLIES, TOPICS, type Answers, type Side } from "@/lib/fica/listen"
import { useWorkspace } from "@/lib/fica/workspace"
import { cn } from "@/lib/utils"

const WHO: Record<Side, string> = {
  company: "Respostas da empresa",
  worker: "Respostas de quem trabalha",
}
const OTHER: Record<Side, { side: Side; text: string }> = {
  company: { side: "worker", text: "Ouvir agora quem trabalha" },
  worker: { side: "company", text: "Ouvir agora a empresa" },
}

/** One question at a time, big enough to answer on a phone. */
export function ListenPage({
  companyId,
  side,
}: {
  companyId: string
  side: Side
}) {
  const addReply = useWorkspace((s) => s.addReply)
  const [answers, setAnswers] = useState<Partial<Answers>>({})
  const [index, setIndex] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)
  const finished = index === TOPICS.length
  const topic = TOPICS[index]

  useEffect(() => {
    if (moved.current) heading.current?.focus()
  }, [index])

  const answer = (value: Answers[keyof Answers]) => {
    const next = { ...answers, [topic.key]: value }
    setAnswers(next)
    moved.current = true
    if (index === TOPICS.length - 1) addReply(companyId, side, next as Answers)
    setIndex(index + 1)
  }

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-xl flex-col">
      <Link
        href={`/empresas/${companyId}#ouvir`}
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        Voltar ao caso
      </Link>
      <p className="mt-2 text-sm text-muted-foreground">{WHO[side]}</p>
      <div aria-hidden="true" className="mt-2 flex gap-1">
        {TOPICS.map((t, i) => (
          <span
            key={t.key}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < index ? "bg-chart-2" : "bg-muted"
            )}
          />
        ))}
      </div>

      {finished ? (
        <div className="mt-10">
          <CheckCircle
            weight="fill"
            className="size-12 text-chart-1"
            aria-hidden="true"
          />
          <h1
            ref={heading}
            tabIndex={-1}
            className="mt-4 text-3xl font-semibold tracking-tight outline-none"
          >
            Obrigado
          </h1>
          <p className="mt-2">
            As respostas ficaram guardadas só neste aparelho, sem nomes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/empresas/${companyId}#ouvir`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 font-medium text-primary-foreground"
            >
              Ver o resultado
            </Link>
            <Link
              href={`/ouvir/${companyId}/${OTHER[side].side}`}
              className="inline-flex h-12 items-center justify-center rounded-full border px-6 font-medium hover:bg-accent"
            >
              {OTHER[side].text}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <p className="text-sm text-muted-foreground">
            {topic.label}, pergunta {index + 1} de {TOPICS.length}
          </p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="mt-2 text-3xl leading-tight font-semibold tracking-tight text-balance outline-none"
          >
            {topic.ask[side]}
          </h1>
          <div className="mt-8 flex flex-col gap-3">
            {REPLIES.map((reply) => (
              <button
                key={reply.value}
                type="button"
                onClick={() => answer(reply.value)}
                className="min-h-16 rounded-2xl border bg-card px-6 text-start text-lg font-medium hover:border-primary hover:bg-accent"
              >
                {reply.label}
              </button>
            ))}
          </div>
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              className="mt-6 min-h-11 text-sm text-muted-foreground underline underline-offset-4"
            >
              Voltar à pergunta anterior
            </button>
          )}
        </div>
      )}
    </div>
  )
}
