"use client";

import type { GeneroContagem } from "@/types";
import { formatarHora } from "@/lib/dates";
import { formatarNumero, plural } from "@/lib/formatar";
import { useImagemArtista } from "@/hooks/useImagemArtista";
import { Capa } from "@/components/ui/Capa";

/**
 * Totais e género mais ouvido, em palco: a foto do artista em destaque a cinzento
 * (vinda da API), as audições ao centro e os outros números nos 4 cantos.
 */
export function Palco({
  artista,
  audicoes,
  artistas,
  genero,
  pico,
  fraseDoPeriodo,
}: {
  artista: string;
  audicoes: number;
  artistas: number;
  genero: GeneroContagem | null;
  pico: number | null;
  fraseDoPeriodo: string;
}) {
  const foto = useImagemArtista(artista);
  const cantos = [
    { rotulo: "Artistas distintos", valor: formatarNumero(artistas), lugar: "md:top-12 md:left-12" },
    {
      rotulo: "Género mais ouvido",
      valor: genero ? genero.genero : "Sem etiquetas",
      extra: genero ? `em ${plural(genero.contagem, "audição", "audições")}` : undefined,
      lugar: "md:top-12 md:right-12 md:text-right",
    },
    { rotulo: "Hora de pico", valor: pico !== null ? `${formatarHora(pico)} UTC` : "—", lugar: "md:bottom-12 md:left-12" },
    { rotulo: "Período", valor: fraseDoPeriodo, lugar: "md:right-12 md:bottom-12 md:text-right" },
  ];

  return (
    <section aria-labelledby="titulo-totais" className="relative overflow-hidden border-b border-borda-forte bg-superficie-cinza">
      <h2 id="titulo-totais" className="sr-only">Totais</h2>
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-12 sm:px-6 md:min-h-[660px] md:justify-center">
        <div className="relative">
          <Capa src={foto.data} alt={`Foto de ${artista}, a cinzento`} className="h-[400px] w-[320px] grayscale md:h-[560px] md:w-[460px]" />
          <p className="titulo-display absolute inset-0 flex flex-col items-center justify-center text-center text-5xl leading-[0.95] text-destaque [text-shadow:0_2px_16px_rgb(255_255_255/0.9)] md:text-7xl">
            <span className="tabular-nums">{formatarNumero(audicoes)}</span>
            <span>audições</span>
          </p>
        </div>
        <dl className="mt-8 grid w-full grid-cols-2 gap-6 md:contents">
          {cantos.map((c) => (
            <div key={c.rotulo} className={`md:absolute ${c.lugar}`}>
              <dt className="font-display text-sm font-extrabold tracking-wide text-destaque uppercase italic">{c.rotulo}</dt>
              <dd className="font-display text-2xl font-black text-destaque italic first-letter:uppercase md:text-3xl">{c.valor}</dd>
              {c.extra && <dd className="text-sm text-texto-suave">{c.extra}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
