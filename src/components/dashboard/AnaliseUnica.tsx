import Link from "next/link";
import { MOMENTOS, PERGUNTA_ANALISE, type ArtistaDeMomento, type MomentoDoDia } from "@/lib/analise";
import { formatarPercentagem, plural } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { Bloco } from "@/components/ui/Bloco";
import { EstadoVazio } from "@/components/ui/Estados";
import { StarsIcon } from "@solar-icons/react/linear/stars";

const NO_MOMENTO: Record<MomentoDoDia, string> = {
  madrugada: "de madrugada",
  manhã: "de manhã",
  tarde: "à tarde",
  noite: "à noite",
};

/** A análise única: a pergunta como título e a resposta por baixo. */
export function AnaliseUnica({ itens }: { itens: ArtistaDeMomento[] }) {
  return (
    <Bloco
      titulo={PERGUNTA_ANALISE}
      icone={<StarsIcon size={20} />}
      descricao="Artistas com pelo menos 10 audições no período que juntam 70% ou mais num só momento do dia (horas UTC)."
    >
      {itens.length === 0 ? (
        <EstadoVazio titulo="Nenhum artista se concentra num só momento do dia">
          Neste período, nenhum artista com 10 ou mais audições junta 70% delas no mesmo momento do dia.
        </EstadoVazio>
      ) : (
        <ul className="space-y-4">
          {itens.map((a) => {
            const { de, ate } = MOMENTOS.find((m) => m.momento === a.momento) ?? MOMENTOS[0];
            return (
              <li key={a.artista}>
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={caminhoArtista(a.artista)} className="truncate font-medium hover:text-destaque">
                    {a.artista}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums">
                    {formatarPercentagem(a.percentagem)} {NO_MOMENTO[a.momento]}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-superficie-alta">
                  <div className="h-full rounded-full bg-destaque" style={{ width: `${a.percentagem}%` }} />
                </div>
                <p className="mt-1 text-xs text-texto-suave">
                  {a.noMomento} de {plural(a.total, "audição", "audições")} entre as {de}h e as {ate}h
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Bloco>
  );
}
