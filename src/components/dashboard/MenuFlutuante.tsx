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
 * Versão pequena do cartão "Música", a flutuar à esquerda.
 * - Só aparece quando o cartão do topo (`alvo`) sai do ecrã.
 * - Fechado, é só a barra vermelha presa à margem. Ao passar o rato (ou com o
 *   foco do teclado) a palavra "MÚSICA" desliza para fora e o painel abre por baixo.
 *   No telemóvel abre com um toque. Fecha ao sair com o rato, com Esc ou ao tocar fora.
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
      className={`fixed top-4 left-0 z-40 flex flex-col items-start motion-safe:transition sm:top-6 ${
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
      }`}
    >
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((a) => !a)}
        className="group flex min-h-12 min-w-11 items-center rounded-r-xl border-2 border-l-0 border-destaque bg-superficie/95 py-1.5 pr-3 pl-3 shadow-[0_10px_30px_-8px_rgb(200_30_38/0.5)] backdrop-blur-sm"
      >
        <span aria-hidden="true" className="h-8 w-1.5 shrink-0 rounded-full bg-destaque" />
        {/* A palavra desliza para fora: a largura passa de 0 à largura do texto (grelha 0fr → 1fr) */}
        <span
          className={`grid motion-safe:transition-[grid-template-columns] motion-safe:duration-300 motion-safe:ease-out group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr] ${
            aberto ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="titulo-display pl-2 text-xl text-destaque">Música</span>
            <span className="sr-only">: artista em destaque e período</span>
            <AltArrowDownIcon
              size={18}
              aria-hidden="true"
              className={`shrink-0 text-destaque motion-safe:transition-transform ${aberto ? "rotate-180" : ""}`}
            />
          </span>
        </span>
      </button>

      {aberto && (
        // pt-2 em vez de margem: o rato não "cai" no espaço entre o botão e o painel
        <div id={idPainel} className="pt-2 pl-3 motion-safe:animate-entrar-menu">
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
