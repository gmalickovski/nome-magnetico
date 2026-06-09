import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { DateInput } from '../ui/DateInput';

export function InitialAnalysisModal() {
  const [open, setOpen] = useState(true);
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | 'Neutro'>('Feminino');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (nome.trim().length < 2) {
      setError('Por favor, informe seu nome completo de registro.');
      setLoading(false);
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) {
      setError('Por favor, informe uma data de nascimento válida (DD/MM/AAAA).');
      setLoading(false);
      return;
    }

    try {
      // 1. Chamar o endpoint /api/analyze para processar a análise gratuita
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: 'analise_gratuita',
          nome_completo: nome.trim(),
          data_nascimento: dataNascimento,
          nome_ja_escolhido: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar sua análise.');
      }

      // 2. Fechar o modal e recarregar a página para o Astro exibir o card com o score gerado
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.');
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => {}} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h3 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-2">
            Configuração Inicial
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Para gerar o score inicial do seu nome de nascimento e calcular seus bloqueios energéticos, preencha os dados abaixo.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1.5">
              Nome Completo de Registro <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Maria Oliveira Silva"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1.5">
              Data de Nascimento <span className="text-red-400">*</span>
            </label>
            <DateInput
              value={dataNascimento}
              onChangeValue={setDataNascimento}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-1.5">
              Sexo <span className="text-red-400">*</span>
            </label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value as any)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23D4AF37%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-no-repeat bg-[position:right_1rem_center]"
            >
              <option value="Feminino" className="bg-neutral-900 border-none">Feminino</option>
              <option value="Masculino" className="bg-neutral-900 border-none">Masculino</option>
              <option value="Neutro" className="bg-neutral-900 border-none">Neutro</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-xs p-3 bg-red-500/10 rounded-xl border border-red-500/20 leading-relaxed">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#f2ca50] to-[#d4af37] text-[#131313] font-bold uppercase tracking-wider text-xs hover:from-yellow-400 hover:to-[#f2ca50] disabled:opacity-50 transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:scale-[1.01]"
        >
          {loading ? 'Processando...' : 'Gerar Meu Score'}
        </button>
      </form>
    </Modal>
  );
}
