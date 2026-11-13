import { MusicNotesIcon } from "@solar-icons/react/linear/music-notes";
import type { ItemRanking } from "@/types";
import { plural } from "@/lib/formatar";
import { Bloco } from "@/components/ui/Bloco";
import { Capa } from "@/components/ui/Capa";

/** Top 10 músicas em grelha, como os álbuns: capa como fundo, posição, faixa, álbum e contagem. */
export function TopMusicas({ itens }: { itens: ItemRanking[] }) {
  return (
    <Bloco titulo="Top 10 músicas" icone={<MusicNotesIcon size={20} />} descricao="As faixas que mais ouves no período.">
      <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {itens.map((m, i) => (
          <li key={m.chave} className="relative aspect-square overflow-hidden border border-borda">
            <Capa src={m.imagem} className="absolute inset-0 size-full" />
            {/* Sombra escura por baixo do texto branco: legível sobre qualquer capa */}
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
            <span className="absolute top-0 left-0 bg-destaque px-2 py-0.5 font-display text-lg font-black text-sobre-destaque italic">
              <span className="sr-only">Posição </span>
              {i + 1}
            </span>
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <p className="line-clamp-2 text-sm leading-tight font-extrabold text-white">{m.nome}</p>
              {m.album && <p className="truncate text-xs text-white/85">{m.album}</p>}
              <p className="mt-1 inline-block bg-destaque px-1.5 py-0.5 text-[11px] font-extrabold tabular-nums text-sobre-destaque">
                {plural(m.contagem, "audição", "audições")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Bloco>
  );
}
