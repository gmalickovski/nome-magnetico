import React, { useCallback, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TurnstileWidget } from './TurnstileWidget';

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';
const HONEYPOT_FIELD = 'website_url';

interface TesteResult {
  nome: string;
  arcanoRegente: number | null;
  quantidadeBloqueios: number;
  bloqueios: Array<{ codigo: string; titulo: string; descricao: string }>;
  numerosBasicos: { expressao: number; destino: number };
  temBloqueios: boolean;
  cta: { mensagem: string; url: string };
}

interface FormErrors {
  nome?: string;
  data?: string;
  email?: string;
}

export function TesteBloqueio() {
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TesteResult | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');

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
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Informe um e-mail válido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setResult(null);
    setApiError('');

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setApiError('Confirme a verificação de segurança antes de continuar.');
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, string> = {
        nome_completo: nome.trim(),
        data_nascimento: data,
        email: email.trim().toLowerCase(),
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
        setApiError(data_result.error ?? 'Erro ao processar análise');
        return;
      }

      if (data_result.success) {
        setResult(null);
        setApiError(
          'Análise solicitada! Verifique seu e-mail em alguns minutos para receber o PDF.',
        );
      } else {
        setResult(data_result);
      }
    } catch {
      setApiError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="teste" className="pb-20 md:pb-32 pt-8 md:pt-12 bg-[#111111]">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-3">
            Gratuito
          </p>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-4">
            Teste Seu Nome Agora
          </h2>
          <p className="text-gray-400">
            Descubra em segundos se seu nome possui bloqueios energéticos.
          </p>
        </div>

        {/* Formulário */}
        {!result ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl p-8 space-y-6"
          >
            <Input
              label="Nome Completo"
              placeholder="Seu nome completo de nascimento"
              value={nome}
              onChange={e => setNome(e.target.value)}
              error={errors.nome}
              required
            />
            <Input
              label="Data de Nascimento"
              placeholder="DD/MM/AAAA"
              value={data}
              onChange={handleDataInput}
              maxLength={10}
              error={errors.data}
              hint="Digite apenas os números"
              required
            />
            <Input
              label="E-mail"
              placeholder="seu@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            <div
              className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
              aria-hidden="true"
            >
              <label htmlFor="teste-website">Website</label>
              <input
                id="teste-website"
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
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {apiError}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full text-lg py-4"
            >
              {loading ? 'Analisando...' : 'Analisar Meu Nome'}
            </Button>

            <p className="text-center text-gray-600 text-xs">
              Análise parcial gratuita. Sem cadastro necessário.
            </p>
          </form>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Resultado */}
            <div className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-1">
                  {result.nome}
                </h3>
                <p className="text-gray-400 text-sm">Resultado da análise parcial</p>
              </div>

              {/* Números */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center bg-black/30 rounded-xl p-3">
                  <div className="font-cinzel text-2xl font-bold text-[#D4AF37]">
                    {result.numerosBasicos.expressao}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">Expressão</div>
                </div>
                <div className="text-center bg-black/30 rounded-xl p-3">
                  <div className="font-cinzel text-2xl font-bold text-[#D4AF37]">
                    {result.numerosBasicos.destino}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">Destino</div>
                </div>
                <div className="text-center bg-black/30 rounded-xl p-3">
                  <div className="font-cinzel text-2xl font-bold text-purple-400">
                    {result.arcanoRegente ?? '?'}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">Arcano</div>
                </div>
              </div>

              {/* Bloqueios */}
              {result.temBloqueios ? (
                <div className="space-y-3">
                  <h4 className="font-cinzel text-sm font-bold text-red-400 uppercase tracking-wider">
                    ⚠ {result.quantidadeBloqueios} Bloqueio(s) Detectado(s)
                  </h4>
                  {result.bloqueios.map(b => (
                    <div key={b.codigo} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <h5 className="font-bold text-red-400 text-sm mb-1">{b.titulo}</h5>
                      <p className="text-gray-400 text-sm">{b.descricao}</p>
                      <p className="text-gray-600 text-xs mt-2 italic">
                        A análise completa revela o caminho de transformação...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <div className="text-emerald-400 text-2xl mb-2">✓</div>
                  <p className="text-emerald-400 font-medium">Sem bloqueios detectados!</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Sua análise completa revelará como potencializar ainda mais essa energia.
                  </p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-8 text-center mt-4 shadow-xl shadow-black/20">
              <p className="text-gray-200 font-medium mb-3 text-lg">{result.cta.mensagem}</p>
              
              <div className="text-gray-400 text-sm mb-6 space-y-3 leading-relaxed">
                <p>
                  A análise completa revela o <strong>caminho de transformação</strong> de todos os seus bloqueios, além da interpretação profunda dos 5 números da sua Numerologia Cabalística e o seu guia prático do Nome Magnético personalizado.
                </p>
                <p>
                  Você também irá verificar de forma detalhada se possui <strong>Débitos Kármicos</strong>, <strong>Lições Kármicas</strong> e <strong>Tendências Ocultas</strong> atuando em sua vida agora.
                </p>
              </div>

              <button
                onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-block bg-gradient-to-r from-[#D4AF37] to-[#f2ca50] text-[#1A1A1A] font-bold text-lg px-8 py-4 rounded-xl hover:brightness-110 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/30"
              >
                Desbloquear Minha Análise Completa
              </button>
            </div>

            <button
              onClick={() => { setResult(null); setNome(''); setData(''); }}
              className="w-full text-gray-600 hover:text-gray-400 text-sm transition-colors py-2"
            >
              Testar outro nome
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
