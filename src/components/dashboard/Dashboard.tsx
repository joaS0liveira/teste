"use client";

/**
 * Dashboard — visão global de tudo o que ouviste.
 * Responde às 4 perguntas do enunciado: quem ouves mais, o que ouves mais,
 * quando ouves e que género domina; e mostra a análise única.
 *
 * Os dados vêm de useFiltrados (já filtrados pelo período) e os cálculos das
 * funções puras de lib/, dentro de useMemo: o componente só mostra.
 */
import { useMemo } from "react";
import { formatarDataHora, formatarHora } from "@/lib/dates";
import {
  generoMaisOuvido,
  horaDePico,
  scrobblesPorHora,
  topAlbuns,
  topArtistas,
  topMusicas,
  totalArtistasDistintos,
  totalScrobbles,
} from "@/lib/stats";
import { artistasDeMomento } from "@/lib/analise";
import { useFiltrados } from "@/hooks/useFiltrados";
import { usePeriodo } from "@/hooks/usePeriodo";
import { Bloco } from "@/components/ui/Bloco";
import { EstadoCarregar, EstadoErro, EstadoVazio } from "@/components/ui/Estados";
import { GraficoHoras } from "@/components/graficos/GraficoHoras";
import { FiltroPeriodo } from "./FiltroPeriodo";
import { Totais } from "./Totais";
import { Genero } from "./Genero";
import { TopArtistas } from "./TopArtistas";
import { TopMusicas } from "./TopMusicas";
import { TopAlbuns } from "./TopAlbuns";
import { AnaliseUnica } from "./AnaliseUnica";
import { ClockCircleIcon } from "@solar-icons/react/linear/clock-circle";

export default function Dashboard() {
  const { scrobbles, referencia, status, error, recarregar } = useFiltrados();
  const { periodo, setPeriodo } = usePeriodo();

  const dados = useMemo(() => {
    const porHora = scrobblesPorHora(scrobbles);
    return {
      audicoes: totalScrobbles(scrobbles),
      artistas: totalArtistasDistintos(scrobbles),
      genero: generoMaisOuvido(scrobbles),
      porHora,
      pico: horaDePico(porHora),
      topArtistas: topArtistas(scrobbles, 20),
      topMusicas: topMusicas(scrobbles, 10),
      topAlbuns: topAlbuns(scrobbles, 8),
      analise: artistasDeMomento(scrobbles),
    };
  }, [scrobbles]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">O teu histórico de audições</h1>
          {referencia && (
            <p className="mt-1 text-sm text-texto-suave">
              Períodos contados a partir da última audição: {formatarDataHora(referencia)}
            </p>
          )}
        </div>
        <FiltroPeriodo periodo={periodo} onMudar={setPeriodo} />
      </div>

      {status === "loading" && (
        <EstadoCarregar mensagem="A carregar o histórico de audições… Da primeira vez pode demorar até um minuto." />
      )}

      {status === "error" && (
        <EstadoErro titulo="Não foi possível carregar o histórico" mensagem={error} onTentar={recarregar} />
      )}

      {status === "success" && scrobbles.length === 0 && (
        <EstadoVazio titulo="Sem audições neste período">Escolhe um período maior no filtro acima.</EstadoVazio>
      )}

      {status === "success" && scrobbles.length > 0 && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Totais audicoes={dados.audicoes} artistas={dados.artistas} className="lg:col-span-2" />
            <Genero genero={dados.genero} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Bloco
                titulo="A que horas ouves mais música"
                icone={<ClockCircleIcon size={20} />}
                descricao={
                  dados.pico !== null
                    ? `24 horas (0–23 UTC). Hora de maior escuta: ${formatarHora(dados.pico)}.`
                    : "24 horas (0–23 UTC)."
                }
              >
                <GraficoHoras
                  porHora={dados.porHora}
                  pico={dados.pico}
                  descricao={`Audições por hora do dia em UTC${dados.pico !== null ? `; mais audições às ${formatarHora(dados.pico)}` : ""}`}
                />
              </Bloco>
              <TopMusicas itens={dados.topMusicas} />
              <TopAlbuns itens={dados.topAlbuns} />
            </div>
            <div className="space-y-6">
              <TopArtistas itens={dados.topArtistas} />
              <AnaliseUnica itens={dados.analise} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
