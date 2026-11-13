import { useId, type ReactNode } from "react";

/** Painel de uma secção do dashboard ou da página do artista, com ícone Solar no título. */
export function Bloco({
  titulo,
  icone,
  descricao,
  acao,
  children,
  className = "",
}: {
  titulo: string;
  /** Ícone Solar (linear) que identifica o bloco. */
  icone?: ReactNode;
  descricao?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`rounded-2xl border border-borda bg-superficie p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {icone && (
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-superficie-alta text-destaque">
              {icone}
            </span>
          )}
          <div>
            <h2 id={id} className="text-base font-semibold text-balance">{titulo}</h2>
            {descricao && <p className="mt-1 text-sm text-texto-suave">{descricao}</p>}
          </div>
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}
