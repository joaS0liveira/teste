import { useId, type ReactNode } from "react";

/**
 * Secção da página (estilo da maqueta): título em maiúsculas na cor néon, com
 * um ícone Solar, e uma descrição curta por baixo. `centrado` para as secções
 * largas (títulos ao centro); as que ficam lado a lado alinham à esquerda.
 */
export function Bloco({
  titulo,
  icone,
  descricao,
  centrado = false,
  children,
  className = "",
}: {
  titulo: string;
  /** Ícone Solar (linear) que identifica a secção. */
  icone?: ReactNode;
  descricao?: ReactNode;
  centrado?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`min-w-0 ${className}`}>
      <div className={centrado ? "mb-8 text-center" : "mb-5"}>
        <h2
          id={id}
          className={`inline-flex items-center gap-3 font-extrabold uppercase tracking-wide text-balance text-destaque ${
            centrado ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
          }`}
        >
          {icone && (
            <span aria-hidden="true" className="shrink-0">
              {icone}
            </span>
          )}
          {titulo}
        </h2>
        {descricao && (
          <p className={`mt-2 text-texto-suave ${centrado ? "mx-auto max-w-[70ch]" : ""}`}>{descricao}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Caixa escura para gráficos e cartões (a "superfície" da maqueta). */
export function Painel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-borda bg-superficie p-5 sm:p-7 ${className}`}>{children}</div>;
}
