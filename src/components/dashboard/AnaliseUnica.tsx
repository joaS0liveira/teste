import Link from "next/link";
import type { ReactNode } from "react";
import { StarsIcon } from "@solar-icons/react/linear/stars";
import { MoonStarsIcon } from "@solar-icons/react/linear/moon-stars";
import { SunriseIcon } from "@solar-icons/react/linear/sunrise";
import { SunIcon } from "@solar-icons/react/linear/sun";
import { MoonIcon } from "@solar-icons/react/linear/moon";
import { MOMENTOS, PERGUNTA_ANALISE, type ArtistaDeMomento, type MomentoDoDia } from "@/lib/analise";
import { formatarPercentagem, plural } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { Bloco } from "@/components/ui/Bloco";
import { EstadoVazio } from "@/components/ui/Estados";

/** Rótulo de cada momento, no cartão. */
const ROTULO: Record<MomentoDoDia, string> = {
  madrugada: "De madrugada",
  manhã: "De manhã",
  tarde: "À tarde",
  noite: "À noite",
};

/** Ícone Solar de cada momento do dia. */
const ICONE: Record<MomentoDoDia, typeof SunIcon> = {
  madrugada: MoonStarsIcon,
  manhã: SunriseIcon,
  tarde: SunIcon,
  noite: MoonIcon,
};

/** A análise única: a pergunta como título e a resposta por baixo, em grelha horizontal. */
export function AnaliseUnica({ itens, filtro }: { itens: ArtistaDeMomento[]; filtro?: ReactNode }) {
  return (
    <Bloco
      titulo={PERGUNTA_ANALISE}
      icone={<StarsIcon size={22} />}
      descricao="A nossa análise única: artistas com pelo menos 10 reproduções no período que juntam 70% ou mais num só momento do dia (horas UTC)."
      variante="separador"
      filtro={filtro}
    >
      {itens.length === 0 ? (
        <EstadoVazio titulo="Nenhum artista se concentra num só momento do dia">
          Neste período, nenhum artista com 10 ou mais reproduções junta 70% delas no mesmo momento do dia.
        </EstadoVazio>
      ) : (
        // Em grelha, na horizontal: 1 coluna no telemóvel, 2 no tablet, 4 no computador.
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {itens.map((a) => {
            const { de, ate } = MOMENTOS.find((m) => m.momento === a.momento) ?? MOMENTOS[0];
            const Icone = ICONE[a.momento];
            return (
              <li key={a.artista} className="flex min-w-0 flex-col gap-2 border border-borda p-4">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-destaque">
                  <Icone size={18} aria-hidden="true" />
                  {ROTULO[a.momento]}
                </p>
                <p className="font-display text-4xl leading-none font-black tabular-nums text-destaque italic">
                  {formatarPercentagem(a.percentagem)}
                </p>
                <Link href={caminhoArtista(a.artista)} className="truncate text-lg font-bold hover:text-destaque">
                  {a.artista}
                </Link>
                <div className="h-2 overflow-hidden bg-superficie-alta">
                  <div className="h-full bg-destaque" style={{ width: `${a.percentagem}%` }} />
                </div>
                <p className="text-sm text-texto-suave">
                  {a.noMomento} de {plural(a.total, "reprodução", "reproduções")}, entre as {de}h e as {ate}h
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Bloco>
  );
}
