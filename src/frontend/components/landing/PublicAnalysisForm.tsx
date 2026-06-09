import React, { useState } from 'react';
import { track } from '../../lib/analytics';

interface FormErrors {
  nome?: string;
  data?: string;
  email?: string;
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

    try {
      const response = await fetch('/api/teste-bloqueio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: nome.trim(),
          data_nascimento: data,
          email: email.trim().toLowerCase(),
        }),
      });

      const data_result = await response.json();

      if (!response.ok) {
        if (response.status === 409 || data_result.error === 'already_requested') {
          setShowDuplicateModal(true);
        } else {
          setApiError(data_result.error ?? 'Erro ao solicitar análise');
        }
        return;
      }

      setShowSuccessModal(true);
      track('analise_gratis_submit');

      // Limpar formulário após envio com sucesso
      setNome('');
      setData('');
      setEmail('');
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
        className="bg-[#1a1a1a] border border-[#D4AF37]/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
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

        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {apiError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#2DD4BF] via-[#0D9488] to-[#0F766E] text-[#e5e2e1] font-bold text-lg py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-[#0D9488]/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/25 bg-[#131313] p-6 sm:p-8 shadow-2xl shadow-black/60 relative animate-fade-in">
            {/* Ícone de sucesso */}
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37] mx-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="font-cinzel text-2xl font-bold text-[#e5e2e1] text-center mb-4">
              Análise Solicitada!
            </h2>

            <div className="space-y-4 text-sm text-gray-300 text-center leading-relaxed">
              <p>
                Em alguns minutos, você receberá um e-mail contendo o PDF da análise vibracional completa do seu nome.
              </p>
              <p className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 text-xs text-gray-400 italic">
                💡 Caso não veja a mensagem em sua caixa de entrada, verifique sua pasta de <strong>Spam</strong> ou de <strong>Promoções</strong>, e certifique-se de que digitou seu e-mail corretamente.
              </p>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-[#D4AF37] hover:bg-[#f2ca50] text-[#131313] font-bold py-3.5 rounded-xl transition-colors tracking-wide uppercase text-xs"
              >
                Entendido
              </button>
            </div>
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
