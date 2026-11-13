/**
 * hooks/useFiltrados.ts — o hook que o dashboard inteiro consome.
 *
 * Junta useScrobbles + usePeriodos e devolve, para cada secção, as reproduções
 * já limpas (sem "a tocar agora") e filtradas pelo período dessa secção.
 * Cada período só é filtrado uma vez, mesmo que várias secções o usem.
 * Fica em "loading" até a store estar hidratada, para não mostrar
 * "Tudo" e saltar logo a seguir para os períodos guardados.
 */
import { useMemo } from "react";
import type { Periodo, PeriodosPorSeccao, Scrobble, Seccao, Status } from "@/types";
import { dataDeReferencia } from "@/lib/dates";
import { filtrarPorPeriodo } from "@/lib/filters";
import { useHydrated } from "./useHydrated";
import { usePeriodos } from "./usePeriodo";
import { useScrobbles } from "./useScrobbles";

export interface EstadoFiltrados {
  /** Reproduções de cada secção, no período escolhido nessa secção. */
  porSeccao: Record<Seccao, Scrobble[]>;
  /** Reproduções com data, de sempre (para saber se o histórico está vazio). */
  todas: Scrobble[];
  /** Reprodução mais recente: a âncora dos períodos. */
  referencia: Date | null;
  periodos: PeriodosPorSeccao;
  setPeriodo: (seccao: Seccao, periodo: Periodo) => void;
  status: Status;
  error: string | null;
  recarregar: () => void;
}

export function useFiltrados(): EstadoFiltrados {
  const hidratado = useHydrated();
  const { periodos, setPeriodo } = usePeriodos();
  const { data: historico, status, error, recarregar } = useScrobbles();

  const referencia = useMemo(() => dataDeReferencia(historico), [historico]);
  const todas = useMemo(() => filtrarPorPeriodo(historico, "tudo"), [historico]);

  const porSeccao = useMemo(() => {
    const porPeriodo = new Map<Periodo, Scrobble[]>();
    const filtrar = (p: Periodo) => {
      if (!porPeriodo.has(p)) porPeriodo.set(p, filtrarPorPeriodo(historico, p));
      return porPeriodo.get(p) as Scrobble[];
    };
    return Object.fromEntries(
      (Object.keys(periodos) as Seccao[]).map((s) => [s, filtrar(periodos[s])]),
    ) as Record<Seccao, Scrobble[]>;
  }, [historico, periodos]);

  return {
    porSeccao,
    todas,
    referencia,
    periodos,
    setPeriodo,
    status: hidratado ? status : "loading",
    error,
    recarregar,
  };
}
