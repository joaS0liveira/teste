import { AlbumIcon } from "@solar-icons/react/linear/album";
import type { ItemRanking } from "@/types";
import { formatarNumero } from "@/lib/formatar";
import { Bloco } from "@/components/ui/Bloco";
import { Capa } from "@/components/ui/Capa";

/** Top 8 álbuns em grelha visual: capa como fundo, com título, artista e plays. */
export function TopAlbuns({ itens }: { itens: ItemRanking[] }) {
  return (
    <Bloco titulo="Top 8 álbuns" icone={<AlbumIcon size={24} />} descricao="Os álbuns mais ouvidos.">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {itens.map((a) => (
          <li key={a.chave} className="relative aspect-square overflow-hidden rounded-2xl">
            <Capa src={a.imagem} className="absolute inset-0 size-full" />
            {/* Sombra por baixo do texto: legível sobre qualquer capa */}
            <div className="absolute inset-0 bg-linear-to-t from-fundo via-fundo/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="line-clamp-2 leading-tight font-extrabold">{a.nome}</p>
              <p className="truncate text-xs text-texto-suave">{a.subtitulo}</p>
              <p className="mt-1.5 inline-block rounded-md bg-destaque-forte px-2 py-0.5 text-xs font-extrabold tabular-nums text-sobre-destaque">
                {formatarNumero(a.contagem)} plays
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Bloco>
  );
}
