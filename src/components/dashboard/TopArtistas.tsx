"use client";

import Link from "next/link";
import type { ItemRanking } from "@/types";
import { formatarNumero } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { useImagemArtista } from "@/hooks/useImagemArtista";
import { Bloco } from "@/components/ui/Bloco";
import { Capa } from "@/components/ui/Capa";
import { Microphone3Icon } from "@solar-icons/react/linear/microphone-3";

/** Top 20 artistas: foto, nome (clicável para a página do artista) e contagem. */
export function TopArtistas({ itens }: { itens: ItemRanking[] }) {
  return (
    <Bloco titulo="Top 20 artistas" icone={<Microphone3Icon size={20} />} descricao="Quem ouves mais no período.">
      <ol className="divide-y divide-borda">
        {itens.map((item, i) => (
          <LinhaArtista key={item.chave} item={item} posicao={i + 1} />
        ))}
      </ol>
    </Bloco>
  );
}

/** Cada linha pede a sua foto (a capa dos scrobbles não é a foto do artista). */
function LinhaArtista({ item, posicao }: { item: ItemRanking; posicao: number }) {
  const nome = item.artista ?? item.nome;
  const foto = useImagemArtista(nome);
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-6 shrink-0 text-right text-sm tabular-nums text-texto-suave">{posicao}</span>
      <Capa src={foto.data} className="size-10 rounded-full" />
      <Link href={caminhoArtista(nome)} className="min-w-0 flex-1 truncate font-medium hover:text-destaque">
        {item.nome}
      </Link>
      <span className="shrink-0 text-sm tabular-nums text-texto-suave">{formatarNumero(item.contagem)}</span>
    </li>
  );
}
