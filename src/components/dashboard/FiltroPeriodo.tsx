import { useId } from "react";
import type { Periodo } from "@/types";

export const OPCOES_PERIODO: { valor: Periodo; rotulo: string; frase: string }[] = [
  { valor: "tudo", rotulo: "Tudo", frase: "desde o início" },
  { valor: "30d", rotulo: "30 dias", frase: "nos últimos 30 dias" },
  { valor: "14d", rotulo: "14 dias", frase: "nos últimos 14 dias" },
  { valor: "7d", rotulo: "7 dias", frase: "nos últimos 7 dias" },
  { valor: "24h", rotulo: "24 horas", frase: "nas últimas 24 horas" },
];

/** O filtro de período: tudo, últimos 30, 14, 7 dias ou 24 horas. Aplica-se a todo o dashboard. */
export function FiltroPeriodo({ periodo, onMudar }: { periodo: Periodo; onMudar: (p: Periodo) => void }) {
  const rotulo = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={rotulo} className="text-sm font-bold text-texto-suave">Período</span>
      <div role="group" aria-labelledby={rotulo} className="flex flex-wrap border-2 border-borda-forte bg-superficie">
        {OPCOES_PERIODO.map(({ valor, rotulo: texto }, i) => {
          const ativo = valor === periodo;
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => onMudar(valor)}
              className={`min-h-11 flex-auto px-3 text-sm transition-colors ${i > 0 ? "border-l border-borda" : ""} ${
                ativo ? "bg-destaque font-bold text-sobre-destaque" : "hover:bg-superficie-alta"
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
