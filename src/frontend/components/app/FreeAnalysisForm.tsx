/**
 * FreeAnalysisForm — formulário da Análise Gratuita do Nome de Nascimento.
 * Disponível uma única vez por usuário. Envia is_free: true para /api/analyze.
 */

import { useState, useEffect } from 'react';
import { DateInput } from '../ui/DateInput';
import { track } from '../../lib/analytics';

export default function FreeAnalysisForm() {
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pré-preenche os campos se o usuário veio da prévia na landing page
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pendingFreeAnalysis');
      if (raw) {
        const { nome: n, data: d } = JSON.parse(raw);
        if (n) setNome(n);
        if (d) setData(d);
        sessionStorage.removeItem('pendingFreeAnalysis');
      }
    } catch {}
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!data) {
      setError('Informe sua data de nascimento.');
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      setError('A data de nascimento deve estar no formato DD/MM/AAAA.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: 'analise_gratuita',
          nome_completo: nome.trim(),
          data_nascimento: data,
          nome_ja_escolhido: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao iniciar análise.');

      track('analise_gratis_submit');
      window.location.href = '/app?gen_free_pdf=1';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-8">

      {/* Alerta de uso único — visível antes dos campos */}
      <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <span className="text-amber-400 text-lg flex-shrink-0 mt-0.5">⚠️</span>
        <div>
          <p className="text-amber-300 font-semibold text-sm mb-1">Esta análise só pode ser realizada uma vez.</p>
          <p className="text-amber-200/70 text-sm leading-relaxed">
            Após gerar o relatório, esta opção não estará mais disponível. Revise cuidadosamente o preenchimento antes de confirmar.
          </p>
        </div>
      </div>

      {/* Campos do formulário */}
      <div className="glass rounded-xl p-5 space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nome Completo de Nascimento <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Informe exatamente como consta na certidão de nascimento — sem apelidos, abreviações ou variações.
          </p>
          <input
            type="text"
            value={nome}
            onChange={e => { setNome(e.target.value); setError(''); }}
            placeholder="Ex: Maria da Silva Santos"
            className="input-dark w-full"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Data de Nascimento <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Sua data real de nascimento — usada para calcular seu Número de Destino.
          </p>
          <div className="w-full sm:w-1/2">
            <DateInput
              value={data}
              onChangeValue={v => { setData(v); setError(''); }}
              className="input-dark w-full"
              required
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Analisando seu nome...
          </span>
        ) : (
          'Gerar Análise Gratuita'
        )}
      </button>
    </form>
  );
}
