import React, { useEffect, useRef, useState } from 'react';
import type { CandidateSuggestion } from './chat-types.js';
import { Pill } from '../../ui/Pill.js';
import { toggleSelection } from './selection.js';
import {
  ChatSuggestionCard,
  ChatSuggestionSectionHeader,
} from '../../shared/chat-ui/ChatSuggestionCard.js';
import { mapCandidateToHarmonySuggestion } from './harmony-suggestion-mapper.js';
import { ChatBackButton } from './ChatBackButton.js';
import { dividirPorSecao, temSecoesArtisticas } from './artistic-suggestions-client.js';
import { ORDEM_SECOES_BEBE, dividirPorGrupoBebe, temSecoesBebe } from './baby-suggestions-client.js';
import { TITULO_SECAO_BEBE } from '../../../../shared/interactive-engine/ramos/bebe.js';

export interface SuggestionPickerProps {
  suggestions: CandidateSuggestion[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  regenerateNotice?: string | null;
  canRegenerate?: boolean;
  extraActionSlot?: React.ReactNode;
  extraNoticeSlot?: React.ReactNode;
  /** DEV-317: área "Teste um nome seu" (texto, campo e avisos). Fica sempre no fim, depois do "Gerar mais". */
  manualSlot?: React.ReactNode;
  /** DEV-317: muda quando a análise termina; rola até o início das sugestões. */
  scrollSistemaToken?: number;
  /** DEV-317: card a mostrar inteiro depois de testar um nome. */
  scrollCandidato?: { id: string; n: number } | null;
  /** DEV-324: volta ao palpite. */
  onBack?: () => void;
  /** DEV-326: no caminho do bebê não há palpite; o rótulo do botão é outro. */
  backLabel?: string;
  /** DEV-326: o teste de nome usa o nome de nascimento do usuário; não se aplica ao bebê. */
  semTesteManual?: boolean;
  className?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SuggestionPicker({
  suggestions,
  selectedId,
  onSelect,
  onRegenerate,
  isRegenerating = false,
  regenerateNotice = null,
  canRegenerate = true,
  extraActionSlot,
  extraNoticeSlot,
  manualSlot,
  scrollSistemaToken = 0,
  scrollCandidato = null,
  onBack,
  backLabel = 'Voltar ao palpite',
  semTesteManual = false,
  className = '',
}: SuggestionPickerProps) {
  const sistemaRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!scrollSistemaToken) return;
    const id = window.setTimeout(() => {
      sistemaRef.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, 120);
    return () => window.clearTimeout(id);
  }, [scrollSistemaToken]);
  const sistema = suggestions.filter((s) => s.origem !== 'manual');
  const manuais = suggestions.filter((s) => s.origem === 'manual');
  const [manuaisAbertos, setManuaisAbertos] = useState(true);
  const [sistemaAberto, setSistemaAberto] = useState(true);
  useEffect(() => {
    if (!scrollCandidato) return;
    setManuaisAbertos(true);
    const id = window.setTimeout(() => {
      document
        .getElementById(`candidate-${scrollCandidato.id}`)
        ?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, 160);
    return () => window.clearTimeout(id);
  }, [scrollCandidato]);
  const totalManuais = useRef(manuais.length);
  useEffect(() => {
    // Nome novo testado: abre a lista para a pessoa ver o card na hora.
    if (manuais.length > totalManuais.current) setManuaisAbertos(true);
    totalManuais.current = manuais.length;
  }, [manuais.length]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [stagger, setStagger] = useState(false);
  const [touchPulseId, setTouchPulseId] = useState<string | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStagger(true);
      return;
    }
    setStagger(true);
  }, [suggestions.length]);

  const handleCardClick = (id: string) => {
    setTouchPulseId(id);
    window.setTimeout(() => setTouchPulseId(null), 120);
    const nextSelected = toggleSelection(selectedId, id);
    onSelect(nextSelected);
  };

  // DEV-317: a ordem vem do motor (Principal, Maior nota e depois a ordem de tentativas). Não reordenar.
  const renderCard = (sug: CandidateSuggestion, index: number) => {
    const isCurrentSelected = selectedId === sug.id;
    const touchPulse = touchPulseId === sug.id;
    const card = mapCandidateToHarmonySuggestion(sug);
    return (
      <ChatSuggestionCard
        key={sug.id}
        id={`candidate-${sug.id}`}
        card={card}
        selected={isCurrentSelected}
        touchPulse={touchPulse}
        principal={Boolean(sug.principal)}
        maiorNota={Boolean(sug.maiorNota)}
        origem={sug.origem === 'manual' ? 'manual' : 'gerado'}
        destaque={sug.destaque}
        stagger={stagger}
        delayIndex={index}
        onSelect={() => handleCardClick(sug.id)}
      />
    );
  };

  const cabecalho = (
    id: string,
    titulo: string,
    total: number,
    aberto: boolean,
    alternar: () => void,
    controla: string,
    cor: string,
  ) => (
    <div className="flex items-center justify-between gap-3">
      <h3 id={id} className={`font-cinzel text-base sm:text-lg font-bold ${cor}`}>
        {titulo}
        {total > 0 && <span className="ml-2 font-inter text-xs font-medium text-chat-muted">({total})</span>}
      </h3>
      {total > 0 && (
        <button
          type="button"
          onClick={alternar}
          aria-expanded={aberto}
          aria-controls={controla}
          aria-label={`${aberto ? 'Esconder' : 'Mostrar'} ${titulo}`}
          title={aberto ? 'Esconder' : 'Mostrar'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-chat-ink transition-colors duration-300 hover:bg-white/5"
        >
          <svg
            className={`h-5 w-5 transition-transform duration-300 ${aberto ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div ref={rootRef} className={`w-full space-y-4 ${className}`}>
      <section
        ref={sistemaRef}
        aria-labelledby="system-names-title"
        className="scroll-mt-3 rounded-2xl bg-[#161616] p-4 sm:p-5 space-y-4"
      >
        {cabecalho('system-names-title', 'Sugestões do sistema', sistema.length, sistemaAberto, () => setSistemaAberto((v) => !v), 'system-names-list', 'text-gold')}
        {sistemaAberto && (
          <div id="system-names-list" className="w-full min-w-0 flex flex-col gap-3 sm:gap-3.5">
            {temSecoesBebe(sistema) ? (
              // DEV-326: caminho do bebê, seções por grupo (nomes dos pais, menina, menino, neutros).
              (() => {
                const g = dividirPorGrupoBebe(sistema);
                let inicio = 0;
                return (
                  <>
                    {ORDEM_SECOES_BEBE.map((grupo) => {
                      const itens = g[grupo];
                      if (itens.length === 0) return null;
                      const { titulo, dica } = TITULO_SECAO_BEBE[grupo];
                      const de = inicio;
                      inicio += itens.length;
                      return (
                        <div key={grupo} className="flex flex-col gap-3 sm:gap-3.5" role="group" aria-label={titulo}>
                          <ChatSuggestionSectionHeader titulo={titulo} count={itens.length} dica={dica} />
                          {itens.map((sug, i) => renderCard(sug, de + i))}
                        </div>
                      );
                    })}
                    <p className="text-xs text-chat-muted">O relatório em PDF do caminho do bebê ainda não está disponível.</p>
                  </>
                );
              })()
            ) : temSecoesArtisticas(sistema) ? (
              // DEV-321: ramo artístico, duas seções (próximos do nascimento e nomes novos).
              (() => {
                const s = dividirPorSecao(sistema);
                const grupo = (titulo: string, dica: string, itens: typeof sistema, inicio: number) =>
                  itens.length > 0 && (
                    <div className="flex flex-col gap-3 sm:gap-3.5" role="group" aria-label={titulo}>
                      <ChatSuggestionSectionHeader titulo={titulo} count={itens.length} dica={dica} />
                      {itens.map((sug, i) => renderCard(sug, inicio + i))}
                    </div>
                  );
                return (
                  <>
                    {grupo('Nomes artísticos próximos do seu', 'Formas do seu próprio nome, pensadas para o palco.', s.proximos, 0)}
                    {grupo('Nomes totalmente novos', 'Nomes criados para o seu estilo e testados no seu mapa.', s.novos, s.proximos.length)}
                    {s.outros.map((sug, i) => renderCard(sug, s.proximos.length + s.novos.length + i))}
                  </>
                );
              })()
            ) : (
              sistema.map((sug, index) => renderCard(sug, index))
            )}
          </div>
        )}

        {regenerateNotice && (
          <p className="text-xs text-amber-300/90 leading-relaxed px-0.5" role="status">
            {regenerateNotice}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 pt-1">
          {onBack && (
            <ChatBackButton
              onClick={onBack}
              disabled={isRegenerating}
              label={backLabel}
              className="self-start"
            />
          )}
          <Pill
            label={isRegenerating ? 'Gerando novas opções...' : 'Gerar outras opções'}
            size="lg"
            disabled={isRegenerating || !canRegenerate}
            onClick={onRegenerate}
            className="w-full sm:w-auto shrink-0"
          />
          {extraActionSlot}
        </div>
        {!canRegenerate && sistema.length > 0 && (
          <p className="text-xs text-chat-muted leading-relaxed">Você já viu todas as sugestões desta rodada.</p>
        )}
        {extraNoticeSlot}
      </section>

      {manualSlot && !semTesteManual && (
        <section aria-labelledby="manual-names-title" className="rounded-2xl bg-[#161616] p-4 sm:p-5 space-y-4">
          {cabecalho('manual-names-title', 'Suas sugestões', manuais.length, manuaisAbertos, () => setManuaisAbertos((v) => !v), 'manual-names-list', 'text-gold')}
          {manualSlot}
          {manuais.length > 0 && manuaisAbertos && (
            <div id="manual-names-list" className="w-full min-w-0 flex flex-col gap-3 sm:gap-3.5">
              {[...manuais].reverse().map((sug, index) => renderCard(sug, index))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default SuggestionPicker;
