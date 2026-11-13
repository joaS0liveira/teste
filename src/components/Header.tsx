import Link from "next/link";
import { RadioIcon } from "@solar-icons/react/linear/radio";

/**
 * Cabeçalho comum a todas as páginas: o logótipo, que leva ao dashboard.
 * - Ícone Solar de rádio num círculo vermelho (skills solar-icons e impeccable:
 *   ícones de uma biblioteca real, nunca caracteres ou emoji).
 * - O logótipo não é <h1>: cada página tem o seu próprio título principal.
 */
export default function Header() {
  return (
    <header className="w-full border-b border-borda-forte bg-fundo">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="fmdata — ir para o dashboard" className="flex min-h-11 items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-destaque text-sobre-destaque">
            <RadioIcon size={16} strokeWidth={2} />
          </span>
          <span className="font-display text-xl font-black italic text-destaque [font-stretch:125%]">fmdata.</span>
        </Link>
        <span className="hidden text-[11px] font-bold tracking-[0.2em] text-destaque uppercase sm:block">
          Análise do teu Last.fm
        </span>
      </div>
    </header>
  );
}
