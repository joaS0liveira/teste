"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { MusicNote2Icon } from "@solar-icons/react/bold/music-note-2";
import { AltArrowDownIcon } from "@solar-icons/react/linear/alt-arrow-down";
import { AltArrowRightIcon } from "@solar-icons/react/linear/alt-arrow-right";
import { CalendarIcon } from "@solar-icons/react/linear/calendar";
import type { ItemRanking } from "@/types";
import { formatarNumero } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";

/**
 * Versão pequena do cartão "Música", a flutuar à direita.
 * - Só aparece quando o cartão do topo (`alvo`) sai do ecrã.
 * - Fechado, mostra só "| MÚSICA". Abre ao passar o rato por cima, ao clicar
 *   (telemóvel) ou com o teclado; fecha ao sair com o rato ou com Esc.
 * - Usa o mesmo estado do topo: mudar aqui o artista ou o período muda o dashboard.
 */
export function MenuFlutuante({
  alvo,
  artistas,
  escolhido,
  onEscolher,
  fraseDoPeriodo,
  filtro,
}: {
  alvo: RefObject<HTMLElement | null>;
  artistas: ItemRanking[];
  escolhido: ItemRanking | null;
  onEscolher: (chave: string) => void;
  fraseDoPeriodo: string;
  filtro: ReactNode;
}) {
  const [visivel, setVisivel] = useState(false);
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  const idLista = useId();

  // Vigia o cartão do topo: o menu aparece quando ele deixa de se ver.
  useEffect(() => {
    const elemento = alvo.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(([entrada]) => {
      setVisivel(!entrada.isIntersecting);
      if (entrada.isIntersecting) setAberto(false);
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [alvo]);

  // Esc ou um toque fora fecham o menu aberto.
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    const aoTocarFora = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("pointerdown", aoTocarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("pointerdown", aoTocarFora);
    };
  }, [aberto]);

  const nome = escolhido ? (escolhido.artista ?? escolhido.nome) : "";
  const posicao = escolhido ? artistas.indexOf(escolhido) + 1 : 0;

  return (
    <div
      ref={raiz}
      inert={!visivel}
      onPointerEnter={(e) => e.pointerType === "mouse" && setAberto(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setAberto(false)}
      className={`fixed top-4 right-3 z-40 flex flex-col items-end motion-safe:transition sm:top-6 sm:right-6 ${
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
      }`}
    >
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((a) => !a)}
        className="flex min-h-11 items-center gap-2 rounded-xl border-2 border-destaque bg-superficie/95 py-1.5 pr-3 pl-2.5 shadow-[0_10px_30px_-8px_rgb(200_30_38/0.5)] backdrop-blur-sm"
      >
        <span aria-hidden="true" className="h-6 w-1.5 rounded-full bg-destaque" />
        <span className="titulo-display text-xl text-destaque">Música</span>
        <span className="sr-only">: artista em destaque e período</span>
        <AltArrowDownIcon
          size={18}
          aria-hidden="true"
          className={`text-destaque motion-safe:transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        // pt-2 em vez de margem: o rato não "cai" no espaço entre o botão e o painel
        <div id={idPainel} className="pt-2">
          <div className="flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-4 rounded-2xl border-2 border-destaque bg-superficie p-4 shadow-[0_0_0_5px_rgb(200_30_38/0.08),0_20px_50px_-12px_rgb(200_30_38/0.5)]">
            {escolhido && (
              <>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destaque text-sobre-destaque shadow-[0_0_0_3px_white,0_0_0_5px_rgb(200_30_38/0.35)]"
                  >
                    <MusicNote2Icon size={22} />
                  </span>
                  <p className="min-w-0 flex-1 truncate font-display text-2xl font-black italic">{escolhido.nome}</p>
                  <Link
                    href={caminhoArtista(nome)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg bg-destaque px-3 font-display text-xs font-extrabold text-sobre-destaque uppercase italic hover:bg-destaque-claro"
                  >
                    Ver <AltArrowRightIcon size={14} aria-hidden="true" />
                  </Link>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-destaque px-2 py-0.5 font-display text-xl font-black italic tabular-nums text-sobre-destaque">
                    {formatarNumero(escolhido.contagem)}
                  </span>
                  <span className="text-sm leading-tight">
                    <span className="font-bold">{posicao === 1 ? "Artista mais ouvido" : `N.º ${posicao} do período`}</span>
                    <span className="block text-texto-suave">reproduções {fraseDoPeriodo}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={idLista} className="inline-flex items-center gap-2 text-sm font-bold text-destaque">
                    <CalendarIcon size={18} aria-hidden="true" /> Escolher artista em destaque
                  </label>
                  <div className="relative">
                    <select
                      id={idLista}
                      value={escolhido.chave}
                      onChange={(e) => onEscolher(e.target.value)}
                      className="min-h-11 w-full appearance-none rounded-lg border border-destaque/60 bg-superficie pr-10 pl-3 text-sm"
                    >
                      {artistas.map((a, i) => (
                        <option key={a.chave} value={a.chave}>
                          {i + 1}. {a.nome} ({formatarNumero(a.contagem)})
                        </option>
                      ))}
                    </select>
                    <AltArrowDownIcon
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-destaque"
                    />
                  </div>
                </div>
              </>
            )}

            {filtro}
          </div>
        </div>
      )}
    </div>
  );
}
