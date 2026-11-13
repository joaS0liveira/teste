"use client";

import type { AlbumDoArtista } from "@/types";
import { coberturaDoAlbum } from "@/lib/artist";
import { plural } from "@/lib/formatar";
import { useAlbumInfo } from "@/hooks/useAlbumInfo";
import { Bloco } from "@/components/ui/Bloco";
import { Capa } from "@/components/ui/Capa";
import { AlbumIcon } from "@solar-icons/react/linear/album";

/** Álbuns do artista, agrupados por álbum, com "Ouviste X de Y faixas". */
export function AlbunsArtista({ albuns }: { albuns: AlbumDoArtista[] }) {
  return (
    <Bloco titulo="Álbuns" icone={<AlbumIcon size={20} />} descricao="Os álbuns deste artista e quanto os ouves.">
      <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {albuns.map((album) => (
          <LinhaAlbum key={album.chave} album={album} />
        ))}
      </ul>
    </Bloco>
  );
}

/** Cada álbum pede a sua info (o "Y" de "X de Y") — o hook fica aqui, nunca num ciclo. */
function LinhaAlbum({ album }: { album: AlbumDoArtista }) {
  const info = useAlbumInfo(album.artista, album.nome);
  const { ouvidas, total } = coberturaDoAlbum(album, info.data);

  return (
    <li className="flex items-center gap-3 border-b border-borda py-3">
      <Capa src={album.imagem} className="size-14 rounded-md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{album.nome}</p>
        <p className="text-sm text-texto-suave">{plural(album.contagem, "audição", "audições")}</p>
        <p className="text-sm text-texto-suave">
          {info.status === "loading"
            ? "A ver o álbum…"
            : total !== null
              ? `Ouviste ${ouvidas} de ${total} faixas`
              : plural(ouvidas, "faixa ouvida", "faixas ouvidas")}
        </p>
        {total !== null && total > 0 && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-superficie-alta" aria-hidden="true">
            <div className="h-full rounded-full bg-destaque" style={{ width: `${Math.min(100, (ouvidas / total) * 100)}%` }} />
          </div>
        )}
      </div>
    </li>
  );
}
