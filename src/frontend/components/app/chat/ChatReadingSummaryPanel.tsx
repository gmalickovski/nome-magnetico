import React, { useMemo } from 'react';
import type { ChatReadingSummary } from './chat-types.js';
import TriangleVisualization from '../TriangleVisualization';
import KarmicDebts from '../KarmicDebts';
import KarmicLessons from '../KarmicLessons';
import HiddenTendencies from '../HiddenTendencies';
import BlockAnalysisCard from '../BlockAnalysisCard';
import ReadingTopicCard from './ReadingTopicCard.js';

function buildTrianguloDesc(nomeExibido: string): Record<string, string> {
  const primeiroNome = nomeExibido.split(' ')[0] ?? nomeExibido;
  return {
    vida: `Vibração base de cada letra — padrões gerais de existência e vitalidade de ${primeiroNome}.`,
    pessoal: `Letra + dia de nascimento — dimensão íntima e reações internas de ${primeiroNome}.`,
    social: `Letra + mês de nascimento — como o mundo percebe ${primeiroNome} nas interações externas.`,
    destino: `Letra + dia/mês reduzidos — missão, resultados e colheita ao longo da vida de ${primeiroNome}.`,
  };
}

export interface ChatReadingSummaryPanelProps {
  summary: ChatReadingSummary | null;
  loading?: boolean;
  className?: string;
}

export function ChatReadingSummaryPanel({
  summary,
  loading = false,
  className = '',
}: ChatReadingSummaryPanelProps) {
  const descricaoDetalhada = useMemo(
    () => (summary ? buildTrianguloDesc(summary.nomeExibido) : {}),
    [summary?.nomeExibido]
  );

  if (!summary && !loading) return null;

  if (loading && !summary) {
    return (
      <div
        className={`nm-floating-card p-4 sm:p-5 animate-pulse ${className}`}
      >
        <p className="text-xs text-chat-muted font-cinzel uppercase tracking-wider text-left">
          Calculando triângulos e karma…
        </p>
        <div className="mt-3 h-24 rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!summary) return null;

  const { triangulos, bloqueios, licoesCarmicas, tendenciasOcultas, debitosCarmicos, frequencias, arcanos, nomeExibido } =
    summary;

  const hasFrequencias = frequencias && Object.keys(frequencias).length > 0;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {loading && (
        <p className="text-[10px] text-chat-muted font-cinzel uppercase tracking-wider text-left">
          Atualizando leitura…
        </p>
      )}

      <ReadingTopicCard eyebrow="Anatomia vibratória" title="O Triângulo da Vida">
        <TriangleVisualization
          onlyVida
          nome={nomeExibido}
          vida={triangulos.vida as never}
          pessoal={triangulos.pessoal as never}
          social={triangulos.social as never}
          destino={triangulos.destino as never}
          bloqueios={bloqueios as never}
          arcanos={arcanos as never}
          descricaoDetalhada={descricaoDetalhada}
          productType="nome_social"
        />
      </ReadingTopicCard>

      {bloqueios.length > 0 && (
        <ReadingTopicCard eyebrow="O raio-x vibracional" title="Bloqueios energéticos">
          <div className="space-y-3">
            {bloqueios.map((bloqueio, i) => (
              <BlockAnalysisCard
                key={bloqueio.codigo}
                bloqueio={bloqueio}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </ReadingTopicCard>
      )}

      {debitosCarmicos.length > 0 && (
        <ReadingTopicCard eyebrow="O peso do passado" title="Débitos kármicos">
          <KarmicDebts debitos={debitosCarmicos} nomeCompleto={nomeExibido} />
        </ReadingTopicCard>
      )}

      {licoesCarmicas.length > 0 && (
        <ReadingTopicCard eyebrow="Lacunas energéticas" title="Lições kármicas">
          <KarmicLessons licoes={licoesCarmicas} nomeCompleto={nomeExibido} showSolution />
        </ReadingTopicCard>
      )}

      {(tendenciasOcultas.length > 0 || hasFrequencias) && (
        <ReadingTopicCard eyebrow="Frequências numéricas" title="Tendências ocultas">
          <HiddenTendencies
            tendencias={tendenciasOcultas}
            frequencias={frequencias ?? {}}
            nomeCompleto={nomeExibido}
            showSolution
          />
        </ReadingTopicCard>
      )}

    </div>
  );
}

export default ChatReadingSummaryPanel;
