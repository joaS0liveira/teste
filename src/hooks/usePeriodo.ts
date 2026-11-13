/**
 * hooks/usePeriodo.ts — os filtros de período do dashboard, um por secção
 * (a página do artista é sempre all-time).
 *
 * Seletores separados: o componente só re-renderiza quando os períodos mudam.
 */
import type { PeriodosPorSeccao, Periodo, Seccao } from "@/types";
import { useStore } from "@/store/useStore";

export function usePeriodos(): {
  periodos: PeriodosPorSeccao;
  setPeriodo: (seccao: Seccao, periodo: Periodo) => void;
} {
  const periodos = useStore((s) => s.periodos);
  const setPeriodo = useStore((s) => s.setPeriodo);
  return { periodos, setPeriodo };
}
