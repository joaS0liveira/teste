import { useId, type ReactNode } from "react";

/**
 * Secção da página, nas três formas da maqueta:
 * - "colchetes": caixa com borda vermelha e o título "[ TÍTULO ]";
 * - "separador": caixa com borda vermelha e o título num separador vermelho;
 * - "aberto": sem caixa, título centrado (para secções largas).
 * Título em letra larga, itálica e maiúscula, com um ícone Solar.
 */
export function Bloco({
  titulo,
  icone,
  descricao,
  variante = "colchetes",
  children,
  className = "",
}: {
  titulo: string;
  /** Ícone Solar (linear) que identifica a secção. */
  icone?: ReactNode;
  descricao?: ReactNode;
  variante?: "colchetes" | "separador" | "aberto";
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const marca = icone && (
    <span aria-hidden="true" className="shrink-0">
      {icone}
    </span>
  );

  if (variante === "aberto") {
    return (
      <section aria-labelledby={id} className={`min-w-0 ${className}`}>
        <div className="mb-7 text-center">
          <h2 id={id} className="titulo-display inline-flex items-center gap-3 text-3xl text-balance text-destaque sm:text-4xl">
            {marca}
            {titulo}
          </h2>
          {descricao && <p className="mx-auto mt-2 max-w-[70ch] text-texto-suave">{descricao}</p>}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section aria-labelledby={id} className={`min-w-0 border-2 border-borda-forte bg-superficie ${className}`}>
      {variante === "separador" ? (
        <div className="flex flex-wrap items-center gap-x-4 border-b-2 border-borda-forte">
          <h2 id={id} className="titulo-display inline-flex items-center gap-2.5 bg-destaque px-4 py-3 text-lg text-sobre-destaque sm:text-xl">
            {marca}
            {titulo}
          </h2>
          {descricao && <p className="px-4 py-2 text-sm text-texto-suave">{descricao}</p>}
        </div>
      ) : (
        <>
          <h2 id={id} className="titulo-display flex items-center gap-2.5 border-b-2 border-borda-forte px-4 py-3.5 text-lg text-destaque sm:px-5">
            {marca}[ {titulo} ]
          </h2>
          {descricao && <p className="px-4 pt-3 text-sm text-texto-suave sm:px-5">{descricao}</p>}
        </>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
