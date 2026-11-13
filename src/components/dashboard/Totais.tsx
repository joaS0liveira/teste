import { formatarNumero } from "@/lib/formatar";
import { Bloco } from "@/components/ui/Bloco";
import { Chart2Icon } from "@solar-icons/react/linear/chart-2";

/** Totais: n.º de audições e n.º de artistas distintos no período. */
export function Totais({ audicoes, artistas, className }: { audicoes: number; artistas: number; className?: string }) {
  return (
    <Bloco titulo="Totais" icone={<Chart2Icon size={20} />} descricao="O volume de escuta no período escolhido." className={className}>
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-texto-suave">Audições</dt>
          <dd className="text-3xl font-semibold tabular-nums">{formatarNumero(audicoes)}</dd>
        </div>
        <div>
          <dt className="text-sm text-texto-suave">Artistas distintos</dt>
          <dd className="text-3xl font-semibold tabular-nums">{formatarNumero(artistas)}</dd>
        </div>
      </dl>
    </Bloco>
  );
}
