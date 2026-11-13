"use client";

/**
 * Dashboard — visão global de tudo o que ouviste.
 * Responde às 4 perguntas do enunciado: quem ouves mais, o que ouves mais,
 * quando ouves e que género domina; e mostra a análise única.
 *
 * Os dados vêm de useFiltrados (já filtrados pelo período) e os cálculos das
 * funções puras de lib/, dentro de useMemo: o componente só mostra.
 */
import { useMemo, useState } from "react";
import { ClockCircleIcon } from "@solar-icons/react/linear/clock-circle";
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
import { Bloco, Painel } from "@/components/ui/Bloco";
import { EstadoCarregar, EstadoErro, EstadoVazio } from "@/components/ui/Estados";
import { GraficoHoras } from "@/components/graficos/GraficoHoras";
import { FiltroPeriodo, OPCOES_PERIODO } from "./FiltroPeriodo";
import { Destaque } from "./Destaque";
import { Resumo } from "./Resumo";
import { TopArtistas } from "./TopArtistas";
import { TopMusicas } from "./TopMusicas";
import { TopAlbuns } from "./TopAlbuns";
import { AnaliseUnica } from "./AnaliseUnica";

export default function Dashboard() {
  const { scrobbles, referencia, status, error, recarregar } = useFiltrados();
  const { periodo, setPeriodo } = usePeriodo();
  // Artista em destaque no topo: escolha local; sem escolha (ou fora do Top 20 do período) → o n.º 1.
  const [escolha, setEscolha] = useState<string | null>(null);

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

  const escolhido = dados.topArtistas.find((a) => a.chave === escolha) ?? dados.topArtistas[0] ?? null;
  const frase = OPCOES_PERIODO.find((o) => o.valor === periodo)?.frase ?? "";
  const pronto = status === "success" && scrobbles.length > 0;

  return (
    <>
      <Destaque
        subtitulo={
          referencia
            ? `O teu histórico de audições. Períodos contados a partir da última audição: ${formatarDataHora(referencia)}.`
            : "O teu histórico de audições."
        }
        artistas={dados.topArtistas}
        escolhido={pronto ? escolhido : null}
        onEscolher={setEscolha}
        fraseDoPeriodo={frase}
        filtro={<FiltroPeriodo periodo={periodo} onMudar={setPeriodo} />}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {status === "loading" && (
          <EstadoCarregar mensagem="A carregar o histórico de audições… Da primeira vez pode demorar até um minuto." />
        )}

        {status === "error" && (
          <EstadoErro titulo="Não foi possível carregar o histórico" mensagem={error} onTentar={recarregar} />
        )}

        {status === "success" && scrobbles.length === 0 && (
          <EstadoVazio titulo="Sem audições neste período">Escolhe um período maior no filtro acima.</EstadoVazio>
        )}

        {pronto && (
          <div className="divide-y divide-borda [&>*]:py-14">
            <Resumo
              audicoes={dados.audicoes}
              artistas={dados.artistas}
              genero={dados.genero}
              artistaDaFoto={dados.topArtistas[0]?.artista ?? ""}
            />

            <TopArtistas itens={dados.topArtistas} />

            <Bloco
              titulo="A que horas ouves"
              icone={<ClockCircleIcon size={28} />}
              descricao={`24 horas (0–23 UTC).${dados.pico !== null ? ` Hora de maior escuta: ${formatarHora(dados.pico)}.` : ""}`}
              centrado
            >
              <Painel>
                <GraficoHoras
                  porHora={dados.porHora}
                  pico={dados.pico}
                  altura={280}
                  descricao={`Audições por hora do dia em UTC${dados.pico !== null ? `; mais audições às ${formatarHora(dados.pico)}` : ""}`}
                />
              </Painel>
            </Bloco>

            <div className="grid gap-10 lg:grid-cols-2">
              <TopMusicas itens={dados.topMusicas} />
              <TopAlbuns itens={dados.topAlbuns} />
            </div>

            <AnaliseUnica itens={dados.analise} />
          </div>
        )}
      </div>
    </>
  );
}
