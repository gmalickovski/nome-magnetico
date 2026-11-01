import React, { useMemo } from 'react';
import type { ChatReadingSummary } from './chat-types.js';
import TriangleVisualization from '../TriangleVisualization';
import KarmicDebts from '../KarmicDebts';
import KarmicLessons from '../KarmicLessons';
import HiddenTendencies from '../HiddenTendencies';
import BlockAnalysisCard from '../BlockAnalysisCard';

function SectionIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="px-0.5">
        <p className="font-cinzel text-[10px] uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">
          {eyebrow}
        </p>
        <h3 className="font-cinzel text-base font-bold text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

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
        className={`rounded-2xl border border-white/10 bg-chat-bubble/50 p-4 animate-pulse ${className}`}
      >
        <p className="text-xs text-chat-muted font-cinzel uppercase tracking-wider">
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
    <div className={`flex flex-col gap-8 ${className}`}>
      {loading && (
        <p className="text-[10px] text-chat-muted font-cinzel uppercase tracking-wider -mb-4">
          Atualizando leitura…
        </p>
      )}

      <SectionIntro eyebrow="Anatomia vibratória" title="Os 4 triângulos">
        <div className="rounded-2xl bg-white/[0.03] p-3 sm:p-4">
          <TriangleVisualization
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
        </div>
      </SectionIntro>

      {bloqueios.length > 0 && (
        <SectionIntro eyebrow="O raio-x vibracional" title="Bloqueios energéticos">
          <div className="space-y-3">
            {bloqueios.map((bloqueio, i) => (
              <BlockAnalysisCard
                key={bloqueio.codigo}
                bloqueio={bloqueio}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </SectionIntro>
      )}

      {debitosCarmicos.length > 0 && (
        <SectionIntro eyebrow="O peso do passado" title="Débitos kármicos">
          <KarmicDebts debitos={debitosCarmicos} nomeCompleto={nomeExibido} />
        </SectionIntro>
      )}

      {licoesCarmicas.length > 0 && (
        <SectionIntro eyebrow="Lacunas energéticas" title="Lições kármicas">
          <KarmicLessons licoes={licoesCarmicas} nomeCompleto={nomeExibido} showSolution />
        </SectionIntro>
      )}

      {(tendenciasOcultas.length > 0 || hasFrequencias) && (
        <SectionIntro eyebrow="Frequências numéricas" title="Tendências ocultas">
          <HiddenTendencies
            tendencias={tendenciasOcultas}
            frequencias={frequencias ?? {}}
            nomeCompleto={nomeExibido}
            showSolution
          />
        </SectionIntro>
      )}

    </div>
  );
}

export default ChatReadingSummaryPanel;
