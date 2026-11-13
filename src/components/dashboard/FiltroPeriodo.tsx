import type { Periodo } from "@/types";

const OPCOES: { valor: Periodo; rotulo: string }[] = [
  { valor: "tudo", rotulo: "Tudo" },
  { valor: "30d", rotulo: "30 dias" },
  { valor: "14d", rotulo: "14 dias" },
  { valor: "7d", rotulo: "7 dias" },
  { valor: "24h", rotulo: "24 horas" },
];

/** O filtro de período: tudo, últimos 30, 14, 7 dias ou 24 horas. Aplica-se a todo o dashboard. */
export function FiltroPeriodo({ periodo, onMudar }: { periodo: Periodo; onMudar: (p: Periodo) => void }) {
  return (
    <div role="group" aria-label="Período" className="flex flex-wrap gap-1 rounded-xl border border-borda bg-superficie p-1">
      {OPCOES.map(({ valor, rotulo }) => {
        const ativo = valor === periodo;
        return (
          <button
            key={valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => onMudar(valor)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              ativo ? "bg-destaque-forte font-semibold text-sobre-destaque" : "text-texto-suave hover:bg-superficie-alta hover:text-texto"
            }`}
          >
            {rotulo}
          </button>
        );
      })}
    </div>
  );
}
