import type { ResumoArtista } from "@/types";
import { HeartIcon } from "@solar-icons/react/linear/heart";
import { formatarData } from "@/lib/dates";
import { formatarNumero, formatarPercentagem } from "@/lib/formatar";
import { Bloco } from "@/components/ui/Bloco";
import { GraphUpIcon } from "@solar-icons/react/linear/graph-up";

/** Cards de estatísticas: total, percentagem, favoritas, primeira e última reprodução. */
export function EstatisticasArtista({ resumo }: { resumo: ResumoArtista }) {
  const cartoes = [
    { rotulo: "Audições", valor: formatarNumero(resumo.total) },
    { rotulo: "Do teu total", valor: formatarPercentagem(resumo.percentagem) },
    { rotulo: "Favoritas", valor: resumo.favoritas === 0 ? "Nenhuma" : formatarNumero(resumo.favoritas), favoritas: true },
    { rotulo: "Primeira reprodução", valor: resumo.primeira ? formatarData(resumo.primeira) : "—" },
    { rotulo: "Última reprodução", valor: resumo.ultima ? formatarData(resumo.ultima) : "—" },
  ];

  return (
    <Bloco titulo="Estatísticas" icone={<GraphUpIcon size={20} />} descricao="Resumo da tua relação com este artista.">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cartoes.map((c) => (
          <div key={c.rotulo}>
            <dt className="flex items-center gap-1 text-sm text-texto-suave">
              {c.favoritas && <HeartIcon size={16} aria-hidden="true" />}
              {c.rotulo}
            </dt>
            <dd className="text-xl font-semibold tabular-nums">{c.valor}</dd>
          </div>
        ))}
      </dl>
    </Bloco>
  );
}
