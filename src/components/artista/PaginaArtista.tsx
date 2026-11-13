"use client";

/**
 * Página do artista — visão detalhada de um artista. Sempre all-time
 * (ignora o filtro de período). Responde às 4 perguntas do enunciado:
 * quem é este artista, quanto o ouves, quando o ouves e com quem se parece.
 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { ArrowLeftIcon } from "@solar-icons/react/linear/arrow-left";
import { formatarHora } from "@/lib/dates";
import { horaDePico, scrobblesPorHora } from "@/lib/stats";
import {
  albunsDoArtista,
  artistasSemelhantes,
  resumoDoArtista,
  scrobblesPorMes,
  topMusicasDoArtista,
  ultimasAudicoes,
} from "@/lib/artist";
import { nomeDaRota } from "@/lib/rotas";
import { useArtistInfo } from "@/hooks/useArtistInfo";
import { useScrobblesDoArtista } from "@/hooks/useScrobblesDoArtista";
import { Bloco } from "@/components/ui/Bloco";
import { EstadoCarregar, EstadoErro, EstadoVazio } from "@/components/ui/Estados";
import { ListaMusicas } from "@/components/ui/ListaMusicas";
import { GraficoHoras } from "@/components/graficos/GraficoHoras";
import { GraficoMeses } from "@/components/graficos/GraficoMeses";
import { CabecalhoArtista } from "./CabecalhoArtista";
import { EstatisticasArtista } from "./EstatisticasArtista";
import { AlbunsArtista } from "./AlbunsArtista";
import { UltimasAudicoes } from "./UltimasAudicoes";
import { Semelhantes } from "./Semelhantes";
import { MusicNotesIcon } from "@solar-icons/react/linear/music-notes";
import { ClockCircleIcon } from "@solar-icons/react/linear/clock-circle";
import { CalendarIcon } from "@solar-icons/react/linear/calendar";

export default function PaginaArtista() {
  // useParams devolve o nome codificado (armadilha do enunciado): descodificar.
  const nome = nomeDaRota(useParams<{ nome: string }>().nome);
  const historico = useScrobblesDoArtista(nome);
  const perfil = useArtistInfo(nome);
  const { doArtista, todos } = historico;

  const dados = useMemo(() => {
    const porHora = scrobblesPorHora(doArtista);
    return {
      resumo: resumoDoArtista(doArtista, todos),
      musicas: topMusicasDoArtista(doArtista, 10),
      albuns: albunsDoArtista(doArtista),
      porMes: scrobblesPorMes(doArtista),
      porHora,
      pico: horaDePico(porHora),
      ultimas: ultimasAudicoes(doArtista, 10),
    };
  }, [doArtista, todos]);

  const semelhantes = useMemo(
    () => (perfil.data ? artistasSemelhantes(perfil.data, todos) : []),
    [perfil.data, todos],
  );

  if (historico.status === "loading") {
    return (
      <Pagina>
        <EstadoCarregar mensagem="A carregar o histórico de audições… Da primeira vez pode demorar até um minuto." />
      </Pagina>
    );
  }

  if (historico.status === "error") {
    return (
      <Pagina>
        <EstadoErro titulo="Não foi possível carregar o histórico" mensagem={historico.error} onTentar={historico.recarregar} />
      </Pagina>
    );
  }

  // Não encontrado: mensagem clara, sem rebentar a página.
  if (!historico.existe) {
    return (
      <Pagina>
        <EstadoVazio titulo="Artista não encontrado">
          <p>“{nome}” não aparece no teu histórico de audições.</p>
          <Link href="/" className="mt-3 inline-block text-destaque underline">
            Voltar ao dashboard
          </Link>
        </EstadoVazio>
      </Pagina>
    );
  }

  return (
    <Pagina>
      <CabecalhoArtista nome={nome} perfil={perfil} />
      <EstatisticasArtista resumo={dados.resumo} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloco titulo="Top 10 músicas" icone={<MusicNotesIcon size={20} />} descricao="As faixas deste artista que mais ouves.">
          <ListaMusicas itens={dados.musicas} mostrarAlbum={false} />
        </Bloco>
        <Bloco
          titulo="Relógio 24h"
          icone={<ClockCircleIcon size={20} />}
          descricao={`A que horas ouves este artista (UTC)${dados.pico !== null ? `. Mais vezes às ${formatarHora(dados.pico)}.` : "."}`}
        >
          <GraficoHoras porHora={dados.porHora} pico={dados.pico} altura={260} descricao={`Audições de ${nome} por hora do dia em UTC`} />
        </Bloco>
      </div>

      <AlbunsArtista albuns={dados.albuns} />

      <Bloco titulo="Scrobbles por mês" icone={<CalendarIcon size={20} />} descricao="A evolução da tua escuta ao longo do tempo.">
        <GraficoMeses pontos={dados.porMes} descricao={`Audições de ${nome} por mês`} />
      </Bloco>

      <div className="grid gap-6 lg:grid-cols-2">
        <UltimasAudicoes audicoes={dados.ultimas} />
        <Semelhantes artistas={semelhantes} aCarregar={perfil.status === "loading"} />
      </div>
    </Pagina>
  );
}

function Pagina({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-texto-suave hover:text-texto">
        <ArrowLeftIcon size={18} aria-hidden="true" /> Dashboard
      </Link>
      {children}
    </div>
  );
}
