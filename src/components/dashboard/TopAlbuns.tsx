import type { ItemRanking } from "@/types";
import { plural } from "@/lib/formatar";
import { Bloco } from "@/components/ui/Bloco";
import { Capa } from "@/components/ui/Capa";
import { AlbumIcon } from "@solar-icons/react/linear/album";

/** Top 8 álbuns em grelha visual: capa como fundo, com título, artista e plays. */
export function TopAlbuns({ itens }: { itens: ItemRanking[] }) {
  return (
    <Bloco titulo="Top 8 álbuns" icone={<AlbumIcon size={20} />} descricao="Os álbuns mais ouvidos.">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {itens.map((a) => (
          <li key={a.chave} className="relative aspect-square overflow-hidden rounded-xl">
            <Capa src={a.imagem} className="absolute inset-0 size-full" />
            {/* Sombra por baixo do texto: legível sobre qualquer capa */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="line-clamp-2 font-semibold text-white">{a.nome}</p>
              <p className="truncate text-sm text-slate-200">{a.subtitulo}</p>
              <p className="text-xs tabular-nums text-slate-300">{plural(a.contagem, "play", "plays")}</p>
            </div>
          </li>
        ))}
      </ul>
    </Bloco>
  );
}
