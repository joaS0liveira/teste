import Link from "next/link";
import type { ArtistInfo } from "@/types";
import type { EstadoPedido } from "@/hooks/useEntradaEmCache";
import { separarLista } from "@/lib/filters";
import { ArrowLeftIcon } from "@solar-icons/react/linear/arrow-left";
import { SquareArrowRightUpIcon } from "@solar-icons/react/linear/square-arrow-right-up";
import { Capa } from "@/components/ui/Capa";

/** Cabeçalho: quem é o artista — foto (como fundo), nome, tags e links (dados do perfil). */
export function CabecalhoArtista({ nome, perfil }: { nome: string; perfil: EstadoPedido<ArtistInfo> }) {
  const info = perfil.data;
  const links = info
    ? [
        { rotulo: "Last.fm", url: info.url_lastfm },
        { rotulo: "Wikipedia", url: info.url_wikipedia },
        { rotulo: "MusicBrainz", url: info.url_musicbrainz },
      ].filter((l): l is { rotulo: string; url: string } => Boolean(l.url))
    : [];

  return (
    <section className="relative overflow-hidden border-b border-borda">
      {info?.image_url && <Capa src={info.image_url} alt="" className="absolute inset-0 size-full object-[center_25%]" />}
      <div className="absolute inset-0 bg-linear-to-t from-fundo via-fundo/70 to-fundo/30" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-5 px-4 pt-8 pb-12 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 text-texto-suave hover:text-texto">
          <ArrowLeftIcon size={18} aria-hidden="true" /> Dashboard
        </Link>
        <h1 className="mt-16 text-6xl leading-[0.9] font-black tracking-tight text-balance uppercase sm:mt-24 sm:text-8xl">
          {info?.name ?? nome}
        </h1>

        {perfil.status === "loading" && (
          <p role="status" className="text-texto-suave">A carregar o perfil…</p>
        )}
        {perfil.status === "not-found" && <p className="text-texto-suave">A Last.fm não tem perfil para este artista.</p>}
        {perfil.status === "error" && (
          <p role="alert" className="text-perigo">
            Não foi possível carregar o perfil.{" "}
            <button type="button" onClick={perfil.recarregar} className="underline">
              Tentar de novo
            </button>
          </p>
        )}

        {info && (
          <>
            <ul aria-label="Tags" className="flex flex-wrap gap-2">
              {separarLista(info.tags).map((tag) => (
                <li key={tag} className="rounded-full border border-destaque px-3.5 py-1.5 text-sm font-semibold text-destaque">
                  {tag}
                </li>
              ))}
            </ul>
            <ul aria-label="Links externos" className="flex flex-wrap gap-5">
              {links.map((l) => (
                <li key={l.rotulo}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-destaque hover:text-destaque-claro"
                  >
                    {l.rotulo}
                    <SquareArrowRightUpIcon size={16} aria-hidden="true" />
                    <span className="sr-only">(abre noutro separador)</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
