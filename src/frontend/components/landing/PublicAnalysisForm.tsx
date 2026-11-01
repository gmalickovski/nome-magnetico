import React, { useCallback, useState } from 'react';
import { track } from '../../lib/analytics';
import { marketingBodyFields } from '../../lib/utm';
import { TurnstileWidget } from './TurnstileWidget';

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';
const HONEYPOT_FIELD = 'website_url';

interface FormErrors {
  nome?: string;
  data?: string;
  email?: string;
}

interface FreeAnalysisPreview {
  firstName: string;
  score: number;
  nivelCodigo: string;
  nivelRotulo: string;
  potencial: number;
  marcaDaDataPresente: boolean;
}

function isValidEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

export function PublicAnalysisForm() {
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [preview, setPreview] = useState<FreeAnalysisPreview | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  function handleDataInput(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/[^\d/]/g, '');
    value = value.replace(/\//g, '');
    if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5, 9)}`;
    setData(value);
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!nome.trim() || nome.trim().length < 2) {
      errs.nome = 'Informe seu nome completo';
    }
    if (!data || !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      errs.data = 'Data no formato DD/MM/AAAA';
    }
    if (!email.trim() || !isValidEmail(email)) {
      errs.email = 'Informe um e-mail válido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setApiError('Confirme a verificação de segurança antes de continuar.');
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, string | boolean> = {
        nome_completo: nome.trim(),
        data_nascimento: data,
        email: email.trim().toLowerCase(),
        ...marketingBodyFields(optIn),
        [HONEYPOT_FIELD]: honeypot,
      };
      if (TURNSTILE_SITE_KEY && turnstileToken) {
        payload['cf-turnstile-response'] = turnstileToken;
      }

      const response = await fetch('/api/teste-bloqueio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data_result = await response.json();

      if (!response.ok) {
        if (response.status === 409 || data_result.error === 'already_requested') {
          setShowDuplicateModal(true);
        } else if (response.status === 429) {
          setApiError(data_result.error ?? 'Limite de solicitações atingido. Tente mais tarde.');
        } else {
          setApiError(data_result.error ?? 'Erro ao solicitar análise');
        }
        return;
      }

      const previewData: FreeAnalysisPreview | null = data_result?.preview ?? null;
      setPreview(previewData);
      setSubmittedEmail(email.trim().toLowerCase());
      setShowSuccessModal(true);
      track('analise_gratis_submit', {
        score: previewData?.score,
        potencial: previewData?.potencial,
        nivel: previewData?.nivelCodigo,
      });
      if (previewData) {
        track('analise_gratis_preview_view', {
          score: previewData.score,
          potencial: previewData.potencial,
          nivel: previewData.nivelCodigo,
        });
      }

      // Limpar formulário após envio com sucesso
      setNome('');
      setData('');
      setEmail('');
      setOptIn(false);
    } catch {
      setApiError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1a1a] border border-[#D4AF37]/20 rounded-2xl p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        <div className="space-y-2">
          <label htmlFor="pub-nome" className="block text-sm font-semibold uppercase tracking-wider text-gray-400">
            Nome Completo de Nascimento
          </label>
          <input
            id="pub-nome"
            type="text"
            value={nome}
            onChange={e => { setNome(e.target.value); setErrors(prev => ({ ...prev, nome: undefined })); }}
            placeholder="Seu nome completo como registrado em cartório"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 text-base focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/35 transition-all duration-300"
            autoComplete="name"
            required
          />
          {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="pub-data" className="block text-sm font-semibold uppercase tracking-wider text-gray-400">
              Data de Nascimento
            </label>
            <input
              id="pub-data"
              type="text"
              value={data}
              onChange={e => { handleDataInput(e); setErrors(prev => ({ ...prev, data: undefined })); }}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 text-base focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/35 transition-all duration-300"
              required
            />
            {errors.data && <p className="text-red-400 text-xs mt-1">{errors.data}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="pub-email" className="block text-sm font-semibold uppercase tracking-wider text-gray-400">
              Seu Melhor E-mail
            </label>
            <input
              id="pub-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
              placeholder="seu@email.com"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 text-base focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/35 transition-all duration-300"
              autoComplete="email"
              required
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        <label
          htmlFor="pub-opt-in"
          className="flex items-start gap-3 cursor-pointer py-1 min-h-[44px]"
        >
          <input
            id="pub-opt-in"
            name="opt_in"
            type="checkbox"
            checked={optIn}
            disabled={loading}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#bea5ff]/50"
          />
          <span className="text-sm leading-relaxed text-[#e5e2e1]">
            Quero receber dicas e novidades do Nome Magnético por e-mail
          </span>
        </label>

        <div
          className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <label htmlFor="pub-website">Website</label>
          <input
            id="pub-website"
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {TURNSTILE_SITE_KEY ? (
          <TurnstileWidget
            siteKey={TURNSTILE_SITE_KEY}
            onToken={handleTurnstileToken}
            onExpire={() => setTurnstileToken('')}
          />
        ) : null}

        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {apiError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#2DD4BF] via-[#0D9488] to-[#0F766E] text-[#e5e2e1] font-bold text-base sm:text-lg py-3.5 sm:py-4 px-6 rounded-full hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-[#0D9488]/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-[#e5e2e1]/30 border-t-[#e5e2e1] rounded-full animate-spin" />
              Processando e Gerando PDF...
            </>
          ) : (
            'Receber Minha Análise'
          )}
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          Sua análise gratuita será enviada em formato PDF premium diretamente para seu e-mail.
        </p>
      </form>

      {/* Popup de Confirmação */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4AF37]/30 bg-[#131313] p-6 sm:p-8 shadow-2xl shadow-black/70 relative animate-fade-in my-auto">
            {/* Badge de envio do PDF */}
            <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-3.5 py-1.5 text-xs font-medium text-[#2DD4BF] w-fit mx-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>PDF completo de 9 páginas enviado para {submittedEmail || 'seu e-mail'}</span>
            </div>

            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#e5e2e1] text-center mb-2">
              {preview?.firstName ? `${preview.firstName}, aqui está a prévia do seu diagnóstico` : 'Análise Solicitada com Sucesso'}
            </h2>

            {preview ? (
              <div className="mt-5 space-y-5">
                {/* Placar comparativo: Nota Hoje vs Potencial Harmonizado */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4 text-center">
                    <p className="nm-score-eyebrow mb-1">
                      Sua Nota Hoje
                    </p>
                    <p className="font-cinzel text-2xl sm:text-3xl font-bold text-[#e5e2e1]">
                      {preview.score}<span className="text-sm text-gray-500 font-normal">/100</span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-amber-400">
                      {preview.nivelRotulo}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] p-4 text-center">
                    <p className="nm-score-eyebrow mb-1">
                      Potencial da Assinatura
                    </p>
                    <p className="font-cinzel text-2xl sm:text-3xl font-bold text-[#f2ca50]">
                      até {preview.potencial}<span className="text-sm text-[#D4AF37]/70 font-normal">/100</span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#e5e2e1]">
                      Com Nome Social Harmonizado
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-300 text-center leading-relaxed">
                  Enquanto o PDF detalhado chega na sua caixa de entrada, veja como criamos 3 opções de assinatura magnética prontas para destravar o seu potencial máximo.
                </p>

                <div className="space-y-3 pt-1">
                  <a
                    href="/nome-social?utm_source=modal_resultado_gratis&utm_medium=upsell_imediato&utm_campaign=analise_gratis"
                    onClick={() =>
                      track('upsell_modal_click', {
                        score: preview.score,
                        potencial: preview.potencial,
                        nivel: preview.nivelCodigo,
                      })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] hover:bg-[#f2ca50] px-5 py-4 text-center text-xs sm:text-sm font-bold uppercase tracking-wide text-[#131313] shadow-lg shadow-[#D4AF37]/20 transition-colors"
                  >
                    <span>Ver Como Chegar a {preview.potencial}/100 no Nome Social</span>
                    <span aria-hidden="true">→</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full rounded-xl border border-white/10 bg-transparent hover:bg-white/5 py-3 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Fechar e aguardar o PDF no meu e-mail
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 text-center">
                  Caso não encontre o e-mail em até 2 minutos, confira as abas Spam e Promoções.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 text-sm text-gray-300 text-center leading-relaxed mt-4">
                  <p>
                    Em alguns minutos, você receberá um e-mail contendo o PDF da análise vibracional completa do seu nome.
                  </p>
                  <p className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 text-xs text-gray-400 italic">
                    Caso não veja a mensagem em sua caixa de entrada, verifique sua pasta de <strong>Spam</strong> ou de <strong>Promoções</strong>.
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <a
                    href="/nome-social?utm_source=modal_resultado_gratis&utm_medium=upsell_imediato&utm_campaign=analise_gratis"
                    onClick={() => track('upsell_modal_click')}
                    className="block w-full text-center bg-[#D4AF37] hover:bg-[#f2ca50] text-[#131313] font-bold py-3.5 rounded-xl transition-colors tracking-wide uppercase text-xs"
                  >
                    Conhecer a Harmonização do Nome Social →
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full text-gray-400 hover:text-gray-200 py-2 text-xs transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Popup de Análise Já Solicitada */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/25 bg-[#131313] p-6 sm:p-8 shadow-2xl shadow-black/60 relative animate-fade-in text-center">
            {/* Ícone de alerta celestial */}
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37] mx-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="font-cinzel text-2xl font-bold text-[#e5e2e1] text-center mb-4">
              Você já solicitou sua análise gratuita!
            </h2>

            <div className="space-y-4 text-sm text-gray-300 leading-relaxed mb-8">
              <p>
                Para acessá-la novamente faça o <strong>login</strong> caso já tenha cadastro, ou faça o <strong>cadastro</strong> caso ainda não possua uma conta.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={`/auth/login?email=${encodeURIComponent(email)}`}
                className="block w-full bg-[#D4AF37] hover:bg-[#f2ca50] text-[#131313] font-bold py-3.5 rounded-xl transition-colors tracking-wide uppercase text-xs shadow-lg shadow-[#D4AF37]/20"
              >
                Entrar (Fazer Login)
              </a>
              <a
                href={`/auth/cadastro?email=${encodeURIComponent(email)}`}
                className="block w-full bg-transparent hover:bg-white/5 border border-white/20 text-[#e5e2e1] font-bold py-3.5 rounded-xl transition-colors tracking-wide uppercase text-xs"
              >
                Cadastrar (Criar Conta)
              </a>
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="mt-4 text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
