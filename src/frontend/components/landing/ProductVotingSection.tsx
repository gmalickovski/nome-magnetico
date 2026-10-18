import React, { useState } from 'react';
import { capturePostHogEvent } from '../../lib/analytics';
import { LandingSectionIntro } from './LandingSectionIntro';

export type VoteOptionId = 'nome_bebe' | 'nome_empresa' | 'outro';

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
  const [selected, setSelected] = useState<VoteOptionId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  async function handleVote(optionId: VoteOptionId) {
    if (submitting || voted) return;
    setSelected(optionId);
    setSubmitting(true);
    setError('');

    try {
      // 1. Se o usuário aceitou cookies e o PostHog estiver ativo, dispara o evento de survey do PostHog
      capturePostHogEvent('product_vote_submitted', {
        option: optionId,
        surface: variant,
      });

      // 2. Fallback obrigatório sem cookies: conta apenas no servidor (contador agregado, zero PII)
      const res = await fetch('/api/product-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit', // Nunca envia nem recebe cookies
        body: JSON.stringify({ option: optionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Não foi possível registrar seu voto agora.');
      }

      setVoted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar voto.');
    } finally {
      setSubmitting(false);
    }
  }

  const isCompact = variant === 'resultado' || variant === 'obrigado';

  return (
    <section
      id="votacao-proximo-produto"
      aria-label="Votação do próximo produto"
      className={
        variant === 'landing'
          ? 'py-20 md:py-28 bg-[#111111]'
          : 'my-8'
      }
    >
      <div className={variant === 'landing' ? 'max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12' : ''}>
        {variant === 'landing' ? (
          <div className="w-full">
            <LandingSectionIntro
              label="Próximos Lançamentos"
              title="Qual análise você quer ver a seguir no Nome Magnético?"
              description="Toque em uma opção para votar. Votação 100% anônima e instantânea — sem cadastro e sem coleta de dados pessoais."
              align="center"
              className="mb-10 md:mb-14"
            />

            {voted ? (
              <div
                role="status"
                className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 px-6 py-5 max-w-lg mx-auto text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
              >
                <p className="font-cinzel text-base sm:text-lg font-bold text-emerald-300 mb-1">
                  ✦ Voto contabilizado! Obrigado por participar.
                </p>
                <p className="text-xs sm:text-sm text-gray-300">
                  Você votou em{' '}
                  <strong className="text-[#e5e2e1]">
                    {VOTE_OPTIONS.find((o) => o.id === selected)?.label ?? selected}
                  </strong>
                  . Seu voto foi somado ao contador geral sem salvar nenhum dado pessoal.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
                {VOTE_OPTIONS.map((opt) => {
                  const isCurrent = selected === opt.id && submitting;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleVote(opt.id)}
                      data-vote-option={opt.id}
                      className="group flex flex-col justify-between rounded-2xl bg-[#181818]/90 p-6 md:p-8 text-left ring-1 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 hover:bg-[#1f1f1f] hover:ring-[#D4AF37]/50 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#d7c6ff] disabled:opacity-60 cursor-pointer min-h-[200px]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] group-hover:text-[#f2ca50] transition-colors">
                            {opt.label}
                          </span>
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xs text-[#D4AF37] ring-1 ring-[#D4AF37]/30 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                            {isCurrent ? '…' : '→'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/80 group-hover:text-[#f2ca50] transition-colors">
                          {isCurrent ? 'Registrando voto...' : 'Votar nesta opção'}
                        </span>
                        <span className="text-xs text-[#bea5ff]/40 group-hover:text-[#bea5ff] transition-colors">◈</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <p className="mt-6 text-center text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div
            className={`mx-auto rounded-2xl bg-[#181818]/90 ring-1 ring-white/10 p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${
              isCompact ? 'max-w-2xl' : 'max-w-3xl'
            }`}
          >
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.18em] mb-2">
              Próximos Lançamentos
            </p>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#e5e2e1] mb-3 leading-tight">
              Qual análise você quer ver a seguir no Nome Magnético?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-6 leading-relaxed">
              Toque em uma opção para votar. Votação 100% anônima e instantânea — sem cadastro e sem coleta de dados pessoais.
            </p>

            {voted ? (
              <div
                role="status"
                className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 px-6 py-5 max-w-lg mx-auto"
              >
                <p className="font-cinzel text-base sm:text-lg font-bold text-emerald-300 mb-1">
                  ✦ Voto contabilizado! Obrigado por participar.
                </p>
                <p className="text-xs sm:text-sm text-gray-300">
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
                  const isCurrent = selected === opt.id && submitting;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleVote(opt.id)}
                      data-vote-option={opt.id}
                      className="group flex flex-col justify-between rounded-2xl bg-[#131313] p-4 sm:p-5 ring-1 ring-white/10 transition-all duration-300 hover:bg-[#1f1f1f] hover:ring-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#d7c6ff] disabled:opacity-60 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-cinzel text-base sm:text-lg font-bold text-[#e5e2e1] group-hover:text-[#f2ca50] transition-colors">
                            {opt.label}
                          </span>
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xs text-[#D4AF37] ring-1 ring-[#D4AF37]/30 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                            {isCurrent ? '…' : '→'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                      <span className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]/80 group-hover:text-[#f2ca50]">
                        {isCurrent ? 'Registrando voto...' : 'Votar nesta opção'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <p className="mt-4 text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductVotingSection;
