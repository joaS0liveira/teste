"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { MusicNote2Icon } from "@solar-icons/react/bold/music-note-2";
import { SquareArrowRightUpIcon } from "@solar-icons/react/linear/square-arrow-right-up";
import { AltArrowLeftIcon } from "@solar-icons/react/linear/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/linear/alt-arrow-right";
import { PauseIcon } from "@solar-icons/react/bold/pause";
import { PlayIcon } from "@solar-icons/react/bold/play";
import type { ItemRanking } from "@/types";
import { plural } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { useImagemArtista } from "@/hooks/useImagemArtista";
import { Capa } from "@/components/ui/Capa";

/** Alturas (em %) das barras decorativas ao lado do título: um equalizador parado. */
const BARRAS = [18, 30, 22, 45, 34, 60, 40, 72, 55, 88, 64, 100, 70, 52, 80, 58, 92, 66, 48, 74, 38, 56, 28, 20];

/**
 * Topo do dashboard: papel quadriculado com linhas finas, que passa por baixo do
 * cabeçalho e, ao centro, o cartão com "Música", o artista em destaque, a sua
 * foto e as capas dos seus álbuns mais ouvidos (no período do filtro do Top 20).
 * Não acrescenta dados: o destaque é do Top 20.
 * O artista em destaque passa sozinho por todo o Top 20 (`rotacao`): uma barra de
 * tempo enche-se e, ao acabar, avança. Os botões anterior/seguinte mudam à mão. Pára ao passar o rato ou com o foco no cartão,
 * e o botão de pausa pára de vez (WCAG 2.2.2: conteúdo que se mexe sozinho).
 */
export function Destaque({
  subtitulo,
  escolhido,
  albuns,
  rotacao,
  filtro,
}: {
  subtitulo: string;
  escolhido: ItemRanking | null;
  /** Os álbuns mais ouvidos do artista em destaque (até 3). */
  albuns: ItemRanking[];
  /** Filtro de período global (de todo o dashboard). */
  filtro: ReactNode;
  rotacao: {
    /** Posição do artista em destaque no Top 20 (1 a total). */
    posicao: number;
    total: number;
    /** Quanto tempo fica cada artista. */
    passoMs: number;
    parado: boolean;
    onAnterior: () => void;
    onSeguinte: () => void;
    onAlternar: () => void;
  };
}) {
  // Rato por cima ou foco dentro do cartão: suspende a barra (e, com ela, a troca).
  const [suspenso, setSuspenso] = useState(false);
  const nome = escolhido ? (escolhido.artista ?? escolhido.nome) : "";
  const foto = useImagemArtista(nome);

  return (
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
        <div
          onPointerEnter={() => setSuspenso(true)}
          onPointerLeave={() => setSuspenso(false)}
          onFocus={() => setSuspenso(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setSuspenso(false)}
          className="relative w-full max-w-3xl"
        >
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
              <div key={escolhido.chave} className="flex flex-col gap-5 border-t border-borda pt-5 motion-safe:animate-aparecer">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
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

                <ul aria-label={`Foto e álbuns mais ouvidos de ${nome}`} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <li className="flex min-w-0 flex-col gap-1.5">
                    <Capa
                      src={foto.data}
                      alt={`Foto de ${nome}`}
                      className="aspect-square w-full rounded-xl border-2 border-destaque"
                    />
                    <p className="truncate text-sm font-bold">{escolhido.nome}</p>
                    <p className="-mt-1.5 text-xs text-texto-suave">{plural(escolhido.contagem, "reprodução", "reproduções")}</p>
                  </li>
                  {albuns.map((a) => (
                    <li key={a.chave} className="flex min-w-0 flex-col gap-1.5">
                      <Capa src={a.imagem} alt={`Capa de ${a.nome}`} className="aspect-square w-full rounded-xl border border-borda" />
                      <p className="truncate text-sm font-bold">{a.nome}</p>
                      <p className="-mt-1.5 text-xs text-texto-suave">{plural(a.contagem, "reprodução", "reproduções")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {escolhido && rotacao.total > 1 && (
              <div className="flex items-center gap-1.5 sm:gap-3">
                <button
                  type="button"
                  onClick={rotacao.onAnterior}
                  aria-label="Artista anterior"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-destaque transition hover:bg-superficie-alta"
                >
                  <AltArrowLeftIcon size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={rotacao.onAlternar}
                  aria-pressed={rotacao.parado}
                  aria-label={rotacao.parado ? "Retomar a passagem pelos artistas" : "Pausar a passagem pelos artistas"}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-destaque text-destaque transition hover:bg-destaque hover:text-sobre-destaque"
                >
                  {rotacao.parado ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
                </button>
                <button
                  type="button"
                  onClick={rotacao.onSeguinte}
                  aria-label="Artista seguinte"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-destaque transition hover:bg-superficie-alta"
                >
                  <AltArrowRightIcon size={20} aria-hidden="true" />
                </button>
                <span className="shrink-0 font-display text-sm font-black text-destaque italic tabular-nums">
                  {rotacao.posicao} <span className="font-semibold text-texto-suave not-italic">de {rotacao.total}</span>
                </span>
                {/* Barra de tempo: ao acabar a animação, passa ao artista seguinte */}
                <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-superficie-alta">
                  {!rotacao.parado && (
                    <span
                      key={rotacao.posicao}
                      onAnimationEnd={rotacao.onSeguinte}
                      className="block h-full origin-left animate-progresso rounded-full bg-destaque"
                      style={{ animationDuration: `${rotacao.passoMs}ms`, animationPlayState: suspenso ? "paused" : "running" }}
                    />
                  )}
                </span>
              </div>
            )}

            <div className="border-t border-borda pt-5">{filtro}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
