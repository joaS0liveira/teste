"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import type { ItemRanking } from "@/types";
import { formatarNumero } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { useImagemArtista } from "@/hooks/useImagemArtista";
import { Capa } from "@/components/ui/Capa";

/**
 * Topo do dashboard: "Música", o artista em destaque com a foto (vinda da API)
 * como fundo, uma lista para escolher outro artista do Top 20 e o filtro de período.
 * Não acrescenta dados: o artista em destaque é um dos do Top 20 do período.
 */
export function Destaque({
  subtitulo,
  artistas,
  escolhido,
  onEscolher,
  fraseDoPeriodo,
  filtro,
}: {
  subtitulo: string;
  artistas: ItemRanking[];
  escolhido: ItemRanking | null;
  onEscolher: (chave: string) => void;
  fraseDoPeriodo: string;
  /** O filtro de período, mostrado por cima da foto. */
  filtro: ReactNode;
}) {
  const idLista = useId();
  const nome = escolhido ? (escolhido.artista ?? escolhido.nome) : "";
  const foto = useImagemArtista(nome);
  const posicao = escolhido ? artistas.indexOf(escolhido) + 1 : 0;

  return (
    <section className="relative overflow-hidden border-b border-borda">
      {foto.data && <Capa src={foto.data} alt="" className="absolute inset-0 size-full object-[center_25%]" />}
      <div className="absolute inset-0 bg-linear-to-r from-fundo via-fundo/90 to-fundo/30" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-7 px-4 py-14 sm:px-6 sm:py-20">
        <div>
          <h1 className="text-6xl leading-[0.9] font-black tracking-tight text-destaque uppercase sm:text-8xl">Música</h1>
          <p className="mt-4 max-w-[52ch] text-lg text-texto-suave">{subtitulo}</p>
        </div>

        {escolhido && (
          <div className="flex flex-col gap-4">
            <p className="text-5xl leading-none font-extrabold tracking-tight text-balance sm:text-7xl">{escolhido.nome}</p>
            <div className="flex flex-wrap items-stretch gap-3">
              <div className="flex overflow-hidden rounded-xl">
                <span className="flex items-center bg-destaque-forte px-4 text-2xl font-extrabold tabular-nums text-sobre-destaque">
                  {formatarNumero(escolhido.contagem)}
                </span>
                <span className="flex flex-col justify-center bg-fundo/90 px-4 py-2.5">
                  <span className="font-bold">{posicao === 1 ? "Artista mais ouvido" : `N.º ${posicao} do período`}</span>
                  <span className="text-sm text-texto-suave">audições {fraseDoPeriodo}</span>
                </span>
              </div>
              <Link
                href={caminhoArtista(nome)}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-destaque px-5 font-bold text-destaque transition-colors hover:bg-destaque hover:text-sobre-destaque"
              >
                Ver artista <ArrowRightIcon size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4">
          {escolhido && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={idLista} className="text-sm font-semibold text-texto-suave">
                Escolher artista em destaque
              </label>
              <select
                id={idLista}
                value={escolhido.chave}
                onChange={(e) => onEscolher(e.target.value)}
                className="min-h-12 min-w-64 rounded-xl border border-borda-forte bg-superficie px-3.5 text-texto"
              >
                {artistas.map((a, i) => (
                  <option key={a.chave} value={a.chave}>
                    {i + 1}. {a.nome} ({formatarNumero(a.contagem)})
                  </option>
                ))}
              </select>
            </div>
          )}
          {filtro}
        </div>
      </div>
    </section>
  );
}
