"use client";

import Link from "next/link";
import { useId, useRef, type ReactNode } from "react";
import { MusicNote2Icon } from "@solar-icons/react/bold/music-note-2";
import { SquareArrowRightUpIcon } from "@solar-icons/react/linear/square-arrow-right-up";
import { AltArrowRightIcon } from "@solar-icons/react/linear/alt-arrow-right";
import { AltArrowDownIcon } from "@solar-icons/react/linear/alt-arrow-down";
import { CalendarIcon } from "@solar-icons/react/linear/calendar";
import type { ItemRanking } from "@/types";
import { formatarNumero } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { MenuFlutuante } from "./MenuFlutuante";

/** Alturas (em %) das barras decorativas ao lado do título: um equalizador parado. */
const BARRAS = [18, 30, 22, 45, 34, 60, 40, 72, 55, 88, 64, 100, 70, 52, 80, 58, 92, 66, 48, 74, 38, 56, 28, 20];

/**
 * Topo do dashboard: papel quadriculado com linhas finas, que passa por baixo do
 * cabeçalho e, ao centro, o cartão com "Música", o artista em destaque, a
 * lista para escolher outro artista do Top 20 e o filtro de período.
 * Não acrescenta dados: o destaque é do Top 20.
 * Quando o cartão sai do ecrã, aparece a versão pequena (MenuFlutuante) à direita.
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
  const cartao = useRef<HTMLDivElement>(null);

  return (
    <>
      <section className="papel relative -mt-(--altura-cabecalho) overflow-hidden border-b border-borda-forte pt-(--altura-cabecalho)">
        {/* Linhas de desenho técnico (decoração) */}
        <div aria-hidden="true" className="hidden lg:block">
          <div className="absolute top-28 left-10 h-56 w-72 border border-borda" />
          <div className="absolute top-38 left-16 h-px w-60 bg-borda" />
          <div className="absolute top-32 right-14 size-56 rounded-full border border-borda" />
          <div className="absolute top-46 right-28 size-28 rounded-full border border-borda" />
          <div className="absolute right-10 bottom-9 left-10 h-px bg-borda" />
        </div>

        <div className="relative mx-auto flex max-w-7xl justify-center px-4 py-10 sm:px-6 sm:py-16">
          <div ref={cartao} className="relative w-full max-w-3xl">
            {/* Patilhas no topo do cartão (decoração) */}
            <span aria-hidden="true" className="absolute -top-2 left-8 h-4 w-24 rounded-t-lg border-2 border-b-0 border-destaque bg-superficie/90" />
            <span aria-hidden="true" className="absolute -top-2 right-8 h-4 w-32 rounded-t-lg border-2 border-b-0 border-destaque bg-superficie/90" />

            <div className="relative flex flex-col gap-5 rounded-3xl border-2 border-destaque bg-superficie/85 p-5 shadow-[0_0_0_6px_rgb(200_30_38/0.08),0_24px_60px_-12px_rgb(200_30_38/0.45)] backdrop-blur-sm sm:p-8">
              <div>
                <div className="flex items-end gap-3">
                  <span aria-hidden="true" className="w-1.5 self-stretch rounded-full bg-destaque sm:w-2" />
                  <h1 className="titulo-display text-5xl leading-[0.95] text-destaque sm:text-7xl">Música</h1>
                  <div aria-hidden="true" className="ml-auto hidden h-14 flex-1 items-end justify-end gap-1 sm:flex">
                    {BARRAS.map((h, i) => (
                      <span key={i} className="w-1.5 rounded-t-sm bg-destaque/35" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm text-texto-suave">{subtitulo}</p>
              </div>

              {escolhido && (
                <>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-4 border-t border-borda pt-5">
                    <div className="flex min-w-0 flex-[1_1_16rem] items-center gap-4 sm:gap-5">
                      <span
                        aria-hidden="true"
                        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-destaque text-sobre-destaque shadow-[0_0_0_4px_white,0_0_0_6px_rgb(200_30_38/0.35)] sm:size-16"
                      >
                        <MusicNote2Icon size={30} />
                      </span>
                      <p className="min-w-0 flex-1 font-display text-3xl leading-tight font-black break-words italic sm:text-5xl">
                        {escolhido.nome}
                      </p>
                    </div>
                    <Link
                      href={caminhoArtista(nome)}
                      className="titulo-display inline-flex min-h-12 items-center gap-2 rounded-xl bg-destaque px-5 text-sm text-sobre-destaque shadow-[0_8px_20px_rgb(200_30_38/0.4)] transition hover:bg-destaque-claro"
                    >
                      <SquareArrowRightUpIcon size={18} aria-hidden="true" /> Ver artista
                      <AltArrowRightIcon size={18} aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex min-w-12 items-center justify-center rounded-md bg-destaque px-3 py-1.5 font-display text-3xl font-black italic tabular-nums text-sobre-destaque">
                      {formatarNumero(escolhido.contagem)}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-bold">{posicao === 1 ? "Artista mais ouvido" : `N.º ${posicao} do período`}</span>
                      <span className="text-sm text-texto-suave">reproduções {fraseDoPeriodo}</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={idLista} className="inline-flex items-center gap-2 text-sm font-bold text-destaque">
                      <CalendarIcon size={20} aria-hidden="true" /> Escolher artista em destaque
                    </label>
                    <div className="relative">
                      <select
                        id={idLista}
                        value={escolhido.chave}
                        onChange={(e) => onEscolher(e.target.value)}
                        className="min-h-12 w-full appearance-none rounded-lg border border-destaque/60 bg-superficie pr-11 pl-4"
                      >
                        {artistas.map((a, i) => (
                          <option key={a.chave} value={a.chave}>
                            {i + 1}. {a.nome} ({formatarNumero(a.contagem)})
                          </option>
                        ))}
                      </select>
                      <AltArrowDownIcon
                        size={20}
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-destaque"
                      />
                    </div>
                  </div>
                </>
              )}

              {filtro}
            </div>
          </div>
        </div>
      </section>

      <MenuFlutuante
        alvo={cartao}
        artistas={artistas}
        escolhido={escolhido}
        onEscolher={onEscolher}
        fraseDoPeriodo={fraseDoPeriodo}
        filtro={filtro}
      />
    </>
  );
}
