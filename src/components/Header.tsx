import Link from "next/link";
import { RadioIcon } from "@solar-icons/react/linear/radio";

/**
 * Cabeçalho comum a todas as páginas: só o logótipo, que leva ao dashboard.
 * - Ícone Solar de rádio, pequeno, num círculo néon (skills solar-icons e impeccable:
 *   ícones de uma biblioteca real, nunca caracteres ou emoji).
 * - O logótipo não é <h1>: cada página tem o seu próprio título principal.
 */
export default function Header() {
  return (
    <header className="w-full border-b border-borda bg-fundo">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6">
        <Link href="/" aria-label="fmdata — ir para o dashboard" className="flex min-h-11 items-center gap-3 rounded-full">
          <span className="flex size-8 items-center justify-center rounded-full bg-destaque-forte text-sobre-destaque">
            <RadioIcon size={16} strokeWidth={2} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-extrabold tracking-tight">
              fm<span className="text-destaque">data.</span>
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.2em] text-texto-suave sm:block">Análise do teu Last.fm</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
