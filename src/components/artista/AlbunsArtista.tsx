"use client";

import { AlbumIcon } from "@solar-icons/react/linear/album";
import type { AlbumDoArtista } from "@/types";
import { coberturaDoAlbum } from "@/lib/artist";
import { plural } from "@/lib/formatar";
import { useAlbumInfo } from "@/hooks/useAlbumInfo";
import { Bloco } from "@/components/ui/Bloco";
import { Capa } from "@/components/ui/Capa";

/** Álbuns do artista, agrupados por álbum, com "Ouviste X de Y faixas". */
export function AlbunsArtista({ albuns }: { albuns: AlbumDoArtista[] }) {
  return (
    <Bloco titulo="Álbuns" icone={<AlbumIcon size={28} />} descricao="Os álbuns deste artista e quanto os ouves." centrado>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {albuns.map((album) => (
          <CartaoAlbum key={album.chave} album={album} />
        ))}
      </ul>
    </Bloco>
  );
}

/** Cada álbum pede a sua info (o "Y" de "X de Y") — o hook fica aqui, nunca num ciclo. */
function CartaoAlbum({ album }: { album: AlbumDoArtista }) {
  const info = useAlbumInfo(album.artista, album.nome);
  const { ouvidas, total } = coberturaDoAlbum(album, info.data);

  return (
    <li className="overflow-hidden rounded-2xl border border-borda bg-superficie">
      <Capa src={album.imagem} className="aspect-square w-full" />
      <div className="p-3.5">
        <p className="truncate text-lg font-extrabold">{album.nome}</p>
        <p className="text-sm text-texto-suave">{plural(album.contagem, "audição", "audições")}</p>
        <p className="mt-2 text-sm">
          {info.status === "loading"
            ? "A ver o álbum…"
            : total !== null
              ? `Ouviste ${ouvidas} de ${total} faixas`
              : plural(ouvidas, "faixa ouvida", "faixas ouvidas")}
        </p>
        {total !== null && total > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-alta" aria-hidden="true">
            <div className="h-full rounded-full bg-destaque" style={{ width: `${Math.min(100, (ouvidas / total) * 100)}%` }} />
          </div>
        )}
      </div>
    </li>
  );
}
