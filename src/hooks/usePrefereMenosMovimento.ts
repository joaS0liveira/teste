/**
 * hooks/usePrefereMenosMovimento.ts — respeita a preferência do sistema
 * "reduzir movimento" (prefers-reduced-motion).
 *
 * Usa useSyncExternalStore: no servidor devolve `false`, no cliente acompanha
 * a media query (e muda se a pessoa mudar a preferência com a página aberta).
 */
import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function subscrever(avisar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}

export function usePrefereMenosMovimento(): boolean {
  return useSyncExternalStore(
    subscrever,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}
