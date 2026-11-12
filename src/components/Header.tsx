import Link from "next/link";
import { HeadphonesRoundSoundIcon } from "@solar-icons/react/linear/headphones-round-sound";

/**
 * Cabeçalho comum a todas as páginas.
 * - O logótipo não é <h1>: cada página tem o seu próprio título principal.
 * - Ícone Solar em vez do carácter ♫ (skill impeccable: ícones de uma
 *   biblioteca real, não glifos Unicode).
 */
export default function Header() {
  return (
    <header className="w-full border-b border-borda bg-fundo">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-lg">
          <span className="flex size-10 items-center justify-center rounded-xl bg-destaque-forte text-white">
            <HeadphonesRoundSoundIcon size={22} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight">
              fm<span className="text-destaque">data</span>
            </span>
            <span className="hidden text-xs text-texto-suave sm:block">Análise do teu Last.fm</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-destaque transition-colors hover:text-violet-300">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
