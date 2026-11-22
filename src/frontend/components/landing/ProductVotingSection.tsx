import React, { useCallback, useRef, useState } from 'react';
import { capturePostHogEvent } from '../../lib/analytics';
import {
  LandingSectionIntro,
  landingInteractiveCardClass,
  landingMockupFloatClass,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from './LandingSectionIntro';
import { getRevealItemProps, useLandingSectionReveal } from './useLandingSectionReveal';
import { VoteConfirmDialog } from './VoteConfirmDialog';
import { VOTE_INTRO_COPY, submitVote, type VoteFailure } from './product-vote-flow';

import type { VoteOptionId } from './product-vote-flow';

export type { VoteOptionId };

interface VoteOption {
  id: VoteOptionId;
  label: string;
  description: string;
}

const VOTE_OPTIONS: VoteOption[] = [
  {
    id: 'nome_bebe',
    label: 'Nome do Bebê',
    description: 'Escolher o nome do bebê alinhado ao sobrenome e à data de nascimento.',
  },
  {
    id: 'nome_empresa',
    label: 'Nome da Empresa',
    description: 'Avaliar marcas e nomes comerciais compatíveis com os sócios e fundação.',
  },
  {
    id: 'outro',
    label: 'Outro',
    description: 'Novos estudos numerológicos e ferramentas de autoconhecimento.',
  },
];

interface ProductVotingSectionProps {
  /** Origem apenas para contexto visual; o endpoint servidor não recebe dados pessoais */
  variant?: 'landing' | 'resultado' | 'obrigado';
}

export function ProductVotingSection({ variant = 'landing' }: ProductVotingSectionProps) {
  /** Opção escolhida que ainda espera confirmação (caixa aberta). Cancelar não registra nada. */
  const [pending, setPending] = useState<VoteOptionId | null>(null);
  /** Opção já confirmada com sucesso (mostrada na mensagem final). */
  const [selected, setSelected] = useState<VoteOptionId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [failure, setFailure] = useState<VoteFailure | null>(null);
  const reveal = useLandingSectionReveal();
  const inFlight = useRef(false);
  const originRef = useRef<HTMLElement | null>(null);

  // Escolher só abre a confirmação: nenhuma requisição e nenhum evento até confirmar.
  function openConfirm(optionId: VoteOptionId, origin: HTMLElement | null) {
    if (submitting || voted) return;
    originRef.current = origin;
    setFailure(null);
    setPending(optionId);
  }

  const cancelConfirm = useCallback(() => {
    if (inFlight.current) return;
    setPending(null);
    setFailure(null);
  }, []);

  async function confirmVote() {
    if (!pending || inFlight.current || voted) return;
    inFlight.current = true; // bloqueia clique duplo e concorrente antes do re-render
    setSubmitting(true);
    setFailure(null);
    const option = pending;
    try {
      const result = await submitVote(option, {
        fetchImpl: (input, init) => fetch(input, init),
        // O evento só sai depois do sucesso confirmado da API (e o PostHog só age com consentimento).
        onSuccessEvent: (opt) => capturePostHogEvent('product_vote_submitted', { option: opt, surface: variant }),
      });
      if (result.ok) {
        setSelected(option);
        setVoted(true);
        setPending(null);
      } else {
        setFailure(result.failure);
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  const pendingLabel = VOTE_OPTIONS.find((o) => o.id === pending)?.label ?? '';
  const confirmDialog = (
    <VoteConfirmDialog
      open={pending !== null && !voted}
      optionLabel={pendingLabel}
      submitting={submitting}
      error={failure?.message}
      confirmLabel={failure ? 'Tentar de novo' : 'Confirmar voto'}
      onConfirm={confirmVote}
      onCancel={cancelConfirm}
      returnFocusTo={originRef.current}
    />
  );

  const isCompact = variant === 'resultado' || variant === 'obrigado';

  return (
    <section
      id="votacao-proximo-produto"
      ref={variant === 'landing' ? reveal.ref : undefined}
      aria-label="Votação do próximo produto"
      className={
        variant === 'landing'
          ? `${landingSectionSpacingClass} bg-[#111111] overflow-x-hidden ${reveal.className}`
          : 'my-8'
      }
    >
      <div className={variant === 'landing' ? landingSectionShellClass : ''}>
        {variant === 'landing' ? (
          <div className="w-full min-w-0">
            <LandingSectionIntro
              label="Você Decide"
              title="Você Decide o Próximo Lançamento"
              description={VOTE_INTRO_COPY}
              align="center"
              className="mb-10 md:mb-14"
              revealed={reveal.revealed}
              reduceMotion={reveal.reduceMotion}
            />

            {voted ? (
              <div
                role="status"
                className={`${landingMockupFloatClass} bg-emerald-500/10 ring-1 ring-emerald-500/30 px-6 py-5 max-w-lg mx-auto text-center`}
              >
                <p className="font-cinzel text-base sm:text-lg font-bold text-emerald-300 mb-1 text-balance">
                  ✦ Voto contabilizado! Obrigado por participar.
                </p>
                <p className="nm-caption text-gray-300">
                  Você votou em{' '}
                  <strong className="text-[#e5e2e1]">
                    {VOTE_OPTIONS.find((o) => o.id === selected)?.label ?? selected}
                  </strong>
                  . Seu voto foi somado ao contador geral sem salvar nenhum dado pessoal.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full">
                {VOTE_OPTIONS.map((opt, idx) => {
                  const itemReveal = getRevealItemProps(
                    reveal.revealed,
                    140 + idx * 100,
                    reveal.reduceMotion,
                  );
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={submitting}
                      aria-haspopup="dialog"
                      onClick={(e) => openConfirm(opt.id, e.currentTarget)}
                      data-vote-option={opt.id}
                      className={`group flex flex-col justify-between ${landingInteractiveCardClass} p-6 md:p-8 text-left focus:outline-none focus:ring-2 focus:ring-[#d7c6ff] disabled:opacity-60 cursor-pointer min-h-[210px] ${itemReveal.className}`}
                      style={itemReveal.style}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <h3 className="nm-h3 group-hover:text-[#f2ca50] transition-colors">
                            {opt.label}
                          </h3>
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xs text-[#D4AF37] ring-1 ring-[#D4AF37]/30 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                            →
                          </span>
                        </div>
                        <p className="nm-body">
                          {opt.description}
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                        <span className="nm-caption font-semibold uppercase tracking-wider text-[#D4AF37]/80 group-hover:text-[#f2ca50] transition-colors whitespace-nowrap">
                          Votar nesta opção
                        </span>
                        <span className="text-xs text-[#bea5ff]/40 group-hover:text-[#bea5ff] transition-colors">◈</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!voted && (
              <p className="nm-caption text-center mt-6">
                Seu voto é anônimo: contamos só a opção escolhida, sem cookies e sem dados pessoais.
              </p>
            )}

          </div>
        ) : (
          <div
            className={`mx-auto nm-floating-card p-6 sm:p-8 text-center ${
              isCompact ? 'max-w-2xl' : 'max-w-3xl'
            }`}
          >
            <p className="nm-eyebrow mb-2">
              Você Decide
            </p>
            <h2 className="nm-h2 mb-3">
              Você Decide o Próximo Lançamento
            </h2>
            <p className="nm-body-lg max-w-xl mx-auto mb-6">
              {VOTE_INTRO_COPY}
            </p>

            {voted ? (
              <div
                role="status"
                className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 px-6 py-5 max-w-lg mx-auto"
              >
                <p className="font-cinzel text-base sm:text-lg font-bold text-emerald-300 mb-1">
                  ✦ Voto contabilizado! Obrigado por participar.
                </p>
                <p className="nm-caption text-gray-300">
                  Você votou em{' '}
                  <strong className="text-[#e5e2e1]">
                    {VOTE_OPTIONS.find((o) => o.id === selected)?.label ?? selected}
                  </strong>
                  . Seu voto foi somado ao contador geral sem salvar nenhum dado pessoal.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
                {VOTE_OPTIONS.map((opt) => {
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={submitting}
                      aria-haspopup="dialog"
                      onClick={(e) => openConfirm(opt.id, e.currentTarget)}
                      data-vote-option={opt.id}
                      className="group flex flex-col justify-between rounded-2xl bg-[#131313] p-4 sm:p-5 ring-1 ring-white/10 transition-all duration-300 hover:bg-[#1f1f1f] hover:ring-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#d7c6ff] disabled:opacity-60 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="nm-h3 group-hover:text-[#f2ca50] transition-colors">
                            {opt.label}
                          </h3>
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xs text-[#D4AF37] ring-1 ring-[#D4AF37]/30 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                            →
                          </span>
                        </div>
                        <p className="nm-body">
                          {opt.description}
                        </p>
                      </div>
                      <span className="nm-caption mt-4 inline-block font-semibold uppercase tracking-wider text-[#D4AF37]/80 group-hover:text-[#f2ca50]">
                        Votar nesta opção
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!voted && (
              <p className="nm-caption text-center mt-4">
                Seu voto é anônimo: contamos só a opção escolhida, sem cookies e sem dados pessoais.
              </p>
            )}

          </div>
        )}
      </div>
      {confirmDialog}
    </section>
  );
}

export default ProductVotingSection;
