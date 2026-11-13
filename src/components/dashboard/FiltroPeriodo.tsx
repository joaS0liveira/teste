import { useId } from "react";
import { ClockCircleIcon } from "@solar-icons/react/linear/clock-circle";
import type { Periodo } from "@/types";

export const OPCOES_PERIODO: { valor: Periodo; rotulo: string; frase: string }[] = [
  { valor: "tudo", rotulo: "Tudo", frase: "desde o início" },
  { valor: "30d", rotulo: "30 dias", frase: "nos últimos 30 dias" },
  { valor: "14d", rotulo: "14 dias", frase: "nos últimos 14 dias" },
  { valor: "7d", rotulo: "7 dias", frase: "nos últimos 7 dias" },
  { valor: "24h", rotulo: "24 horas", frase: "nas últimas 24 horas" },
];

/**
 * O filtro de período: tudo, últimos 30, 14, 7 dias ou 24 horas. Aplica-se a todo o dashboard.
 * O tamanho da letra segue o espaço que o filtro tem (container query), não o ecrã:
 * assim serve no cartão grande do topo e no menu flutuante.
 */
export function FiltroPeriodo({ periodo, onMudar }: { periodo: Periodo; onMudar: (p: Periodo) => void }) {
  const rotulo = useId();
  return (
    <div className="@container flex flex-col gap-2">
      <span id={rotulo} className="inline-flex items-center gap-2 text-sm font-bold text-destaque">
        <ClockCircleIcon size={20} aria-hidden="true" /> Período
      </span>
      <div role="group" aria-labelledby={rotulo} className="grid grid-cols-5 gap-1 @md:gap-2">
        {OPCOES_PERIODO.map(({ valor, rotulo: texto }) => {
          const ativo = valor === periodo;
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => onMudar(valor)}
              className={`min-h-11 rounded-lg border px-1 text-xs transition @md:px-3 @md:text-base ${
                ativo
                  ? "border-destaque bg-destaque font-bold text-sobre-destaque shadow-[0_0_0_3px_white,0_6px_18px_rgb(200_30_38/0.45)]"
                  : "border-destaque/50 bg-superficie text-destaque hover:bg-superficie-alta"
              }`}
            >
              {texto}
            </button>
          );
        })}
      </div>
    </div>
  );
}
