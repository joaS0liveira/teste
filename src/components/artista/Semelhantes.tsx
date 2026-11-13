import Link from "next/link";
import type { ArtistaSemelhante } from "@/types";
import { caminhoArtista } from "@/lib/rotas";
import { Bloco } from "@/components/ui/Bloco";
import { UsersGroupRoundedIcon } from "@solar-icons/react/linear/users-group-rounded";

/** Artistas semelhantes (do perfil): só os que já ouves são clicáveis. */
export function Semelhantes({ artistas, aCarregar }: { artistas: ArtistaSemelhante[]; aCarregar: boolean }) {
  return (
    <Bloco titulo="Artistas semelhantes" icone={<UsersGroupRoundedIcon size={24} />} descricao="Artistas parecidos, com destaque para os que já ouves. Só esses abrem a página.">
      {aCarregar ? (
        <p role="status" className="text-sm text-texto-suave">A carregar…</p>
      ) : artistas.length === 0 ? (
        <p className="text-sm text-texto-suave">O perfil não indica artistas semelhantes.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {artistas.map((a) => (
            <li key={a.nome}>
              {a.ouvido ? (
                <Link
                  href={caminhoArtista(a.nome)}
                  className="inline-flex min-h-11 items-center rounded-full bg-destaque-forte px-4 font-bold text-sobre-destaque hover:bg-destaque-claro"
                >
                  {a.nome}
                </Link>
              ) : (
                <span className="inline-flex min-h-11 items-center rounded-full border border-borda-forte px-4 text-texto-suave">
                  {a.nome}
                  <span className="sr-only"> (ainda não ouviste)</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Bloco>
  );
}
