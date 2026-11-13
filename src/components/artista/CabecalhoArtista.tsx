import type { ArtistInfo } from "@/types";
import type { EstadoPedido } from "@/hooks/useEntradaEmCache";
import { separarLista } from "@/lib/filters";
import { SquareArrowRightUpIcon } from "@solar-icons/react/linear/square-arrow-right-up";
import { Capa } from "@/components/ui/Capa";

/** Cabeçalho: quem é o artista — foto, nome, tags, links e biografia (dados do perfil). */
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
    <section className="flex flex-col gap-6 sm:flex-row">
      <Capa src={info?.image_url} alt={info ? `Foto de ${info.name}` : ""} className="size-36 rounded-2xl" />
      <div className="min-w-0 flex-1 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-balance">{info?.name ?? nome}</h1>

        {perfil.status === "loading" && (
          <p role="status" className="text-sm text-texto-suave">A carregar o perfil…</p>
        )}
        {perfil.status === "not-found" && (
          <p className="text-sm text-texto-suave">A Last.fm não tem perfil para este artista.</p>
        )}
        {perfil.status === "error" && (
          <p role="alert" className="text-sm text-perigo">
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
                <li key={tag} className="rounded-full bg-superficie-alta px-3 py-1 text-xs">
                  {tag}
                </li>
              ))}
            </ul>
            <ul aria-label="Links externos" className="flex flex-wrap gap-4">
              {links.map((l) => (
                <li key={l.rotulo}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-destaque hover:underline"
                  >
                    {l.rotulo}
                    <SquareArrowRightUpIcon size={14} aria-hidden="true" />
                    <span className="sr-only">(abre noutro separador)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="max-w-[70ch] whitespace-pre-line text-sm text-texto-suave">
              {info.bio_summary || info.bio_content}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
