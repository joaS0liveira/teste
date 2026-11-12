import { useId, type ReactNode } from "react";

/** Painel de uma secção do dashboard ou da página do artista. */
export function Bloco({
  titulo,
  descricao,
  acao,
  children,
  className = "",
}: {
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`rounded-2xl border border-borda bg-superficie p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={id} className="text-base font-semibold text-balance">{titulo}</h2>
          {descricao && <p className="mt-1 text-sm text-texto-suave">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}
