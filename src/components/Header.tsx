import Link from "next/link";
import { HeadphonesRoundSoundIcon } from "@solar-icons/react/linear/headphones-round-sound";
import { ChartSquareIcon } from "@solar-icons/react/linear/chart-square";

/**
 * Cabeçalho comum a todas as páginas.
 * - Logótipo redondo e navegação em maiúsculas pequenas (estilo de referência).
 * - O logótipo não é <h1>: cada página tem o seu próprio título principal.
 * - Ícones Solar, nunca caracteres ou emoji (skills solar-icons e impeccable).
 */
export default function Header() {
  return (
    <header className="w-full border-b border-borda bg-fundo/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-full">
          <span className="flex size-11 items-center justify-center rounded-full bg-destaque-forte text-sobre-destaque">
            <HeadphonesRoundSoundIcon size={22} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight">
              fm<span className="text-destaque">data.</span>
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.2em] text-texto-suave sm:block">Análise do teu Last.fm</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-destaque transition-colors hover:text-destaque-claro"
          >
            <ChartSquareIcon size={18} aria-hidden="true" /> Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
