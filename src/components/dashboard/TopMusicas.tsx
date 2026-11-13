import type { ItemRanking } from "@/types";
import { Bloco } from "@/components/ui/Bloco";
import { ListaMusicas } from "@/components/ui/ListaMusicas";
import { MusicNotesIcon } from "@solar-icons/react/linear/music-notes";

/** Top 10 músicas: capa, faixa, álbum e contagem de audições. */
export function TopMusicas({ itens }: { itens: ItemRanking[] }) {
  return (
    <Bloco titulo="Top 10 músicas" icone={<MusicNotesIcon size={20} />} descricao="As faixas que mais ouves no período.">
      <ListaMusicas itens={itens} mostrarAlbum />
    </Bloco>
  );
}
