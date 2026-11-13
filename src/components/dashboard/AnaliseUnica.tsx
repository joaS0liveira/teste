import Link from "next/link";
import { StarsIcon } from "@solar-icons/react/linear/stars";
import { MOMENTOS, PERGUNTA_ANALISE, type ArtistaDeMomento, type MomentoDoDia } from "@/lib/analise";
import { formatarPercentagem, plural } from "@/lib/formatar";
import { caminhoArtista } from "@/lib/rotas";
import { Bloco } from "@/components/ui/Bloco";
import { EstadoVazio } from "@/components/ui/Estados";

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
      icone={<StarsIcon size={22} />}
      descricao="A nossa análise única: artistas com pelo menos 10 reproduções no período que juntam 70% ou mais num só momento do dia (horas UTC)."
      variante="separador"
    >
      {itens.length === 0 ? (
        <EstadoVazio titulo="Nenhum artista se concentra num só momento do dia">
          Neste período, nenhum artista com 10 ou mais reproduções junta 70% delas no mesmo momento do dia.
        </EstadoVazio>
      ) : (
        <ul className="grid gap-3">
          {itens.map((a) => {
            const { de, ate } = MOMENTOS.find((m) => m.momento === a.momento) ?? MOMENTOS[0];
            return (
              <li key={a.artista} className="border border-borda px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={caminhoArtista(a.artista)} className="truncate text-lg font-bold hover:text-destaque">
                    {a.artista}
                  </Link>
                  <span className="shrink-0 font-display font-black tabular-nums text-destaque italic">
                    {formatarPercentagem(a.percentagem)} {NO_MOMENTO[a.momento]}
                  </span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden bg-superficie-alta">
                  <div className="h-full bg-destaque" style={{ width: `${a.percentagem}%` }} />
                </div>
                <p className="mt-2 text-sm text-texto-suave">
                  {a.noMomento} de {plural(a.total, "reprodução", "reproduções")} entre as {de}h e as {ate}h
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Bloco>
  );
}
