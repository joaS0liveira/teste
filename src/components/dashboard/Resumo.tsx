"use client";

import type { GeneroContagem } from "@/types";
import { Chart2Icon } from "@solar-icons/react/linear/chart-2";
import { TagIcon } from "@solar-icons/react/linear/tag";
import { formatarNumero, plural } from "@/lib/formatar";
import { useImagemArtista } from "@/hooks/useImagemArtista";
import { Capa } from "@/components/ui/Capa";

/**
 * Totais (n.º de audições e de artistas distintos) e género mais ouvido,
 * ao lado da foto redonda do artista mais ouvido (organização da maqueta).
 */
export function Resumo({
  audicoes,
  artistas,
  genero,
  artistaDaFoto,
}: {
  audicoes: number;
  artistas: number;
  genero: GeneroContagem | null;
  artistaDaFoto: string;
}) {
  const foto = useImagemArtista(artistaDaFoto);
  return (
    <section aria-labelledby="titulo-totais" className="flex flex-wrap items-center gap-10">
      <Capa src={foto.data} alt={`Foto de ${artistaDaFoto}`} className="size-44 rounded-full border-4 border-destaque sm:size-52" />
      <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-5">
        <div>
          <h2 id="titulo-totais" className="inline-flex items-center gap-3 text-sm font-bold tracking-[0.2em] text-destaque uppercase">
            <Chart2Icon size={20} aria-hidden="true" /> Totais
          </h2>
          <p className="mt-2 text-lg text-texto-suave">O volume de escuta no período escolhido.</p>
        </div>
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-3">
          <div>
            <dt className="text-sm text-texto-suave">Audições</dt>
            <dd className="text-4xl font-extrabold tabular-nums sm:text-5xl">{formatarNumero(audicoes)}</dd>
          </div>
          <div>
            <dt className="text-sm text-texto-suave">Artistas distintos</dt>
            <dd className="text-4xl font-extrabold tabular-nums sm:text-5xl">{formatarNumero(artistas)}</dd>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <dt className="flex items-center gap-1.5 text-sm text-texto-suave">
              <TagIcon size={16} aria-hidden="true" /> Género mais ouvido
            </dt>
            {genero ? (
              <>
                <dd className="text-2xl font-extrabold first-letter:uppercase sm:text-3xl">{genero.genero}</dd>
                <dd className="text-sm text-texto-suave">em {plural(genero.contagem, "audição", "audições")}</dd>
              </>
            ) : (
              <dd className="text-texto-suave">As audições deste período não têm etiquetas.</dd>
            )}
          </div>
        </dl>
      </div>
    </section>
  );
}
