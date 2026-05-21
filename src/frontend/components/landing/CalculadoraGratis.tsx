import React, { useState } from 'react';
import { track } from '../../lib/analytics';

interface CalcResult {
  nome_primeiro: string;
  numero_expressao: number;
  numero_destino: number;
  arcano_nome: string | null;
  interpretacao_basica: string;
  quantidade_bloqueios: number;
  primeiro_bloqueio_titulo: string | null;
  cta_url: string;
}

function formatDate(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

const HIDDEN_ITEMS = [
  'Triângulo Pessoal — vida íntima e reações internas',
  'Triângulo Social — percepção do mundo e influências externas',
  'Triângulo de Destino — resultados, missão e previsões',
  'Lições Kármicas — o que você veio desenvolver nesta encarnação',
  'Número de Motivação da Alma — o desejo oculto que guia suas escolhas',
  '3 variações do seu nome já harmonizadas e prontas para assinar',
];

export function CalculadoraGratis() {
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/calcular-numero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_completo: nome.trim(), data_nascimento: data }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Erro ao calcular. Tente novamente.');
        setLoading(false);
        return;
      }

      setResult(json as CalcResult);
      track('calculadora_submit', { origem: document.referrer || 'direto' });
    } catch {
      setError('Falha na conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const temBloqueios = result.quantidade_bloqueios > 0;

    return (
      <div className="animate-fade-in space-y-5">

        {/* Cabeçalho do resultado */}
        <div className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl p-6 shadow-xl shadow-black/40">
          <div className="text-center mb-6">
            <p className="text-[#D4AF37] text-xs font-medium tracking-widest uppercase mb-2">Diagnóstico Concluído</p>
            <h3 className="font-cinzel text-2xl font-bold text-white mb-1">{result.nome_primeiro}</h3>
            <p className="text-gray-500 text-sm">Análise parcial do nome de nascimento</p>
          </div>

          {/* Números */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/30 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Número de Expressão</p>
              <p className="font-cinzel text-4xl font-bold text-[#D4AF37]">{result.numero_expressao}</p>
              {result.arcano_nome && (
                <p className="text-gray-400 text-xs mt-1">{result.arcano_nome}</p>
              )}
            </div>
            <div className="bg-black/30 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Número de Destino</p>
              <p className="font-cinzel text-4xl font-bold text-[#D4AF37]">{result.numero_destino}</p>
              <p className="text-gray-400 text-xs mt-1">Data de nascimento</p>
            </div>
          </div>

          {/* Interpretação básica */}
          <p className="text-gray-300 text-sm leading-relaxed">{result.interpretacao_basica}</p>
        </div>

        {/* Card de bloqueios — dramático se tiver */}
        {temBloqueios ? (
          <div className="bg-amber-950/50 border border-amber-500/40 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-lg">⚠</span>
              </div>
              <div>
                <p className="text-amber-300 font-bold text-base mb-1">
                  {result.quantidade_bloqueios} bloqueio{result.quantidade_bloqueios > 1 ? 's' : ''} energético{result.quantidade_bloqueios > 1 ? 's' : ''} detectado{result.quantidade_bloqueios > 1 ? 's' : ''} no seu nome
                </p>
                <p className="text-amber-500/80 text-sm leading-relaxed">
                  {result.primeiro_bloqueio_titulo
                    ? `Padrão ativo: "${result.primeiro_bloqueio_titulo}"${result.quantidade_bloqueios > 1 ? ` e mais ${result.quantidade_bloqueios - 1} outro${result.quantidade_bloqueios > 2 ? 's' : ''}` : ''}.`
                    : `Seu nome carrega padrões de repetição que criam resistência em áreas específicas da vida.`
                  }
                </p>
              </div>
            </div>
            <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-500/20">
              <p className="text-amber-400/90 text-xs leading-relaxed">
                <strong className="text-amber-300">O que isso significa:</strong> Bloqueios energéticos no nome criam padrões de repetição que resistem a todo esforço consciente — você pode trabalhar, se esforçar e fazer tudo certo, mas o resultado trava sempre no mesmo ponto. A análise completa revela exatamente quais áreas estão sendo afetadas e sugere variações do seu nome que eliminam esses padrões.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl flex-shrink-0 leading-none mt-0.5">✦</span>
              <div>
                <p className="text-emerald-400 font-semibold text-sm mb-1">Nenhum bloqueio detectado no Triângulo da Vida</p>
                <p className="text-emerald-600/80 text-xs leading-relaxed">
                  Ótimo sinal. Mas os outros 3 triângulos (Pessoal, Social e Destino) ainda não foram analisados — bloqueios podem estar presentes nessas dimensões. A análise completa verifica todos os 4 triângulos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Seção "O que você ainda não sabe" — teaser */}
        <div className="bg-[#0d0d0d] border border-[#D4AF37]/25 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
            </div>
            <div>
              <p className="text-[#D4AF37] font-semibold text-sm">Análise parcial — há muito mais sobre seu nome</p>
              <p className="text-gray-600 text-xs">Não revelado neste diagnóstico gratuito</p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {HIDDEN_ITEMS.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="text-[#D4AF37]/40 mt-0.5 flex-shrink-0">—</span>
                <span className="text-gray-500 italic">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA forte */}
        <div className="rounded-2xl overflow-hidden">
          <a
            href={result.cta_url}
            onClick={() => track('analise_resultado_cta_click', {
              produto: 'nome_social',
              origem: 'calculadora_gratis',
            })}
            className="block w-full text-center bg-[#D4AF37] text-[#1A1A1A] font-bold py-4 hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#D4AF37]/25 text-base"
          >
            {temBloqueios
              ? 'Desbloquear Minha Análise Completa'
              : 'Ver Minha Análise Numerológica Completa'
            }
          </a>
          <div className="bg-[#D4AF37]/8 text-center py-3 px-4">
            <p className="text-gray-500 text-xs">
              Acesso imediato · Gere quantas análises quiser · Resultados na hora
            </p>
          </div>
        </div>

        {/* Recalcular */}
        <button
          onClick={() => { setResult(null); setNome(''); setData(''); }}
          className="w-full text-center text-gray-600 hover:text-gray-400 text-sm transition-colors py-2"
        >
          Testar outro nome
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs text-[#76746a] font-medium uppercase tracking-widest mb-2">
          Nome Completo de Nascimento
        </label>
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Ex: Maria Aparecida Santos"
          required
          minLength={2}
          maxLength={100}
          className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/50 transition-colors text-sm"
        />
        <p className="text-gray-600 text-xs mt-1.5">Use o nome exatamente como registrado em cartório</p>
      </div>

      <div>
        <label className="block text-xs text-[#76746a] font-medium uppercase tracking-widest mb-2">
          Data de Nascimento
        </label>
        <input
          type="text"
          value={data}
          onChange={e => setData(formatDate(e.target.value))}
          placeholder="DD/MM/AAAA"
          required
          maxLength={10}
          className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/50 transition-colors text-sm font-mono"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || nome.trim().length < 2 || data.length < 10}
        className="w-full bg-[#D4AF37] text-[#1A1A1A] font-bold py-4 rounded-xl hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-[#D4AF37]/20 text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analisando...
          </span>
        ) : (
          'Detectar Bloqueios do Meu Nome'
        )}
      </button>

      <p className="text-center text-gray-600 text-xs">
        Gratuito · Sem cadastro · Resultado imediato
      </p>
    </form>
  );
}
