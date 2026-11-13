"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import type { ItemRanking } from "@/types";
import { formatarNumero } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";

/**
 * Topo do dashboard: papel quadriculado com linhas finas e, ao centro, o cartão
 * com "Música", o artista em destaque, a lista para escolher outro artista do
 * Top 20 e o filtro de período. Não acrescenta dados: o destaque é do Top 20.
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
  filtro: ReactNode;
}) {
  const idLista = useId();
  const nome = escolhido ? (escolhido.artista ?? escolhido.nome) : "";
  const posicao = escolhido ? artistas.indexOf(escolhido) + 1 : 0;

  return (
    <section className="papel relative overflow-hidden border-b border-borda-forte">
      {/* Linhas de desenho técnico (decoração) */}
      <div aria-hidden="true" className="hidden lg:block">
        <div className="absolute top-10 left-10 h-56 w-72 border border-borda" />
        <div className="absolute top-20 left-16 h-px w-60 bg-borda" />
        <div className="absolute top-14 right-14 size-56 rounded-full border border-borda" />
        <div className="absolute top-28 right-28 size-28 rounded-full border border-borda" />
        <div className="absolute right-10 bottom-9 left-10 h-px bg-borda" />
      </div>

      <div className="relative mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex w-full max-w-2xl flex-col gap-6 border-2 border-borda-forte bg-superficie p-6 sm:p-8">
          <div>
            <h1 className="titulo-display text-6xl leading-[0.9] text-destaque sm:text-8xl">Música</h1>
            <p className="mt-3 text-texto-suave">{subtitulo}</p>
          </div>

          {escolhido && (
            <>
              <p className="font-display text-5xl leading-none font-black text-balance italic sm:text-6xl">{escolhido.nome}</p>
              <div className="flex flex-wrap items-stretch gap-3">
                <div className="flex border-2 border-borda-forte">
                  <span className="flex items-center bg-destaque px-4 font-display text-3xl font-black italic tabular-nums text-sobre-destaque">
                    {formatarNumero(escolhido.contagem)}
                  </span>
                  <span className="flex flex-col justify-center px-4 py-2">
                    <span className="font-bold">{posicao === 1 ? "Artista mais ouvido" : `N.º ${posicao} do período`}</span>
                    <span className="text-sm text-texto-suave">audições {fraseDoPeriodo}</span>
                  </span>
                </div>
                <Link
                  href={caminhoArtista(nome)}
                  className="titulo-display inline-flex min-h-12 items-center gap-2 border-2 border-borda-forte px-5 text-destaque transition-colors hover:bg-destaque hover:text-sobre-destaque"
                >
                  Ver artista <ArrowRightIcon size={18} aria-hidden="true" />
                </Link>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={idLista} className="text-sm font-bold text-texto-suave">
                  Escolher artista em destaque
                </label>
                <select
                  id={idLista}
                  value={escolhido.chave}
                  onChange={(e) => onEscolher(e.target.value)}
                  className="min-h-12 border-2 border-borda-forte bg-superficie px-3"
                >
                  {artistas.map((a, i) => (
                    <option key={a.chave} value={a.chave}>
                      {i + 1}. {a.nome} ({formatarNumero(a.contagem)})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {filtro}
        </div>
      </div>
    </section>
  );
}
