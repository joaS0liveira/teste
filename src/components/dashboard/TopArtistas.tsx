"use client";

import Link from "next/link";
import { Microphone3Icon } from "@solar-icons/react/linear/microphone-3";
import type { ItemRanking } from "@/types";
import { plural } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { useImagemArtista } from "@/hooks/useImagemArtista";
import { Bloco } from "@/components/ui/Bloco";
import { Capa } from "@/components/ui/Capa";

/** Top 20 artistas: foto, nome (clicável para a página do artista) e contagem, em cartões. */
export function TopArtistas({ itens }: { itens: ItemRanking[] }) {
  return (
    <Bloco titulo="Top 20 artistas" icone={<Microphone3Icon size={28} />} descricao="Quem ouves mais no período." centrado>
      <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {itens.map((item, i) => (
          <CartaoArtista key={item.chave} item={item} posicao={i + 1} />
        ))}
      </ol>
    </Bloco>
  );
}

/** Cada cartão pede a sua foto (a capa dos scrobbles não é a foto do artista). */
function CartaoArtista({ item, posicao }: { item: ItemRanking; posicao: number }) {
  const nome = item.artista ?? item.nome;
  const foto = useImagemArtista(nome);
  return (
    <li className="flex flex-col items-center gap-2.5 rounded-2xl border border-borda bg-superficie px-3 py-5 text-center">
      <Capa src={foto.data} className="size-22 rounded-full border-2 border-borda-forte" />
      <Link href={caminhoArtista(nome)} className="w-full truncate font-bold hover:text-destaque">
        {item.nome}
      </Link>
      <span className="text-sm tabular-nums text-texto-suave">
        <span className="font-bold text-destaque">#{posicao}</span> · {plural(item.contagem, "audição", "audições")}
      </span>
    </li>
  );
}
