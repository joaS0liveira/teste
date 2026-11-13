"use client";

import Link from "next/link";
import { Microphone3Icon } from "@solar-icons/react/linear/microphone-3";
import type { ItemRanking } from "@/types";
import { formatarNumero, plural } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { useImagemArtista } from "@/hooks/useImagemArtista";
import { Bloco } from "@/components/ui/Bloco";
import { Capa } from "@/components/ui/Capa";

/** Top 20 artistas: foto, nome (clicável para a página do artista) e contagem. O n.º 1 em grande, à esquerda. */
export function TopArtistas({ itens }: { itens: ItemRanking[] }) {
  const primeiro = itens[0];
  return (
    <Bloco titulo="Top 20 artistas" icone={<Microphone3Icon size={22} />} descricao="Quem ouves mais no período." variante="separador">
      <div className="flex flex-wrap gap-5">
        {primeiro && <PrimeiroLugar item={primeiro} />}
        <ol className="grid min-w-0 flex-[999_1_520px] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {itens.map((item, i) => (
            <CartaoArtista key={item.chave} item={item} posicao={i + 1} />
          ))}
        </ol>
      </div>
    </Bloco>
  );
}

function PrimeiroLugar({ item }: { item: ItemRanking }) {
  const nome = item.artista ?? item.nome;
  const foto = useImagemArtista(nome);
  return (
    <div className="flex flex-[1_1_240px] flex-col gap-2 sm:max-w-72">
      <Capa src={foto.data} alt={`Foto de ${nome}`} className="aspect-square w-full border-2 border-borda-forte" />
      <p className="font-display text-sm font-extrabold tracking-wide text-destaque uppercase italic">N.º 1 do período</p>
      <Link href={caminhoArtista(nome)} className="font-display text-3xl font-black italic hover:text-destaque">
        {item.nome}
      </Link>
      <p className="text-texto-suave">{plural(item.contagem, "audição", "audições")}</p>
    </div>
  );
}

/** Cada cartão pede a sua foto (a capa dos scrobbles não é a foto do artista). */
function CartaoArtista({ item, posicao }: { item: ItemRanking; posicao: number }) {
  const nome = item.artista ?? item.nome;
  const foto = useImagemArtista(nome);
  return (
    <li className="flex flex-col items-center gap-2 border border-borda px-2 py-4 text-center">
      <Capa src={foto.data} className="size-16 rounded-full border-2 border-borda-forte" />
      <Link href={caminhoArtista(nome)} className="w-full truncate text-sm font-bold hover:text-destaque">
        {item.nome}
      </Link>
      <span className="text-xs tabular-nums text-texto-suave">
        <span className="font-display font-black text-destaque italic">#{posicao}</span> · {formatarNumero(item.contagem)}
      </span>
    </li>
  );
}
