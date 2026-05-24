import React, { useState, useEffect } from 'react';
import TriangleVisualization from './TriangleVisualization';

interface Props {
  birthName: string;
  birthDate: string; // formato DD/MM/AAAA ou o que vier do BD
}

export function LiveNameTester({ birthName, birthDate }: Props) {
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  // Helper para converter DB date (YYYY-MM-DD) para exibição se precisar,
  // mas vamos assumir que birthDate vem do BD como YYYY-MM-DD.
  const formatDatePTBR = (dbDate: string) => {
    if (!dbDate) return '';
    const parts = dbDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dbDate;
  };

  const dbDateString = birthDate; // formato DB YYYY-MM-DD
  const formatUserBR = formatDatePTBR(birthDate); // formato visual

  const handleGenerateAnalysis = async (nomeParaAnalisar: string) => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: nomeParaAnalisar,
          data_nascimento: formatUserBR,
          product_type: 'nome_social',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao gerar análise definitiva');
      }

      const { analysisId } = await res.json();
      window.location.href = `/app/resultado/${analysisId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na geração');
      setGenerating(false);
    }
  };

  const testName = async (nameToTest: string) => {
    if (nameToTest.trim().length < 2) {
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_candidato: nameToTest,
          data_nascimento_db: birthDate // api espera postgres YYYY-MM-DD
        }),
      });

      if (!res.ok) {
        throw new Error('Erro na análise');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro genérico');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      testName(candidateName);
    }, 600);
    return () => clearTimeout(timer);
  }, [candidateName]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[#D4AF37] font-cinzel text-xl font-bold mb-4">Referências de Nascimento</h2>
          <div className="flex flex-col md:flex-row gap-6 md:gap-12">
            <div>
              <span className="text-gray-400 text-sm block mb-1">Nome Original</span>
              <span className="text-white font-medium text-lg">{birthName}</span>
            </div>
            <div className="hidden md:block w-px bg-white/10"></div>
            <div>
              <span className="text-gray-400 text-sm block mb-1">Data de Nascimento</span>
              <span className="text-white font-medium text-lg">{formatUserBR}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => handleGenerateAnalysis(birthName)}
            disabled={generating}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 hover:border-[#D4AF37]/50 focus:outline-none transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {generating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               'Analisar Nome Original'
             )}
          </button>
        </div>
      </div>

      {/* Input de Teste */}
      <div className="bg-[#111111] border border-[#D4AF37]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Efeito Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
        
        <h3 className="text-xl font-cinzel font-bold text-white mb-2">Editor de Nome Social</h3>
        <p className="text-gray-400 text-sm mb-6">
          Teste variações do seu nome e veja o impacto numerológico em tempo real.
        </p>

        <div className="relative">
          <input
            type="text"
            value={candidateName}
            onChange={e => setCandidateName(e.target.value)}
            className="w-full bg-black/50 border border-[#D4AF37]/30 rounded-xl px-4 py-4 text-xl font-medium text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            placeholder="Digite o nome para testar..."
          />
          {loading && (
             <div className="absolute right-4 top-4">
               <div className="w-6 h-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></div>
             </div>
          )}
        </div>
      </div>

      {/* Resultados em Tempo Real */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {result && !error && (
        <div className="space-y-6">
           {/* Compatibilidade & Números */}
           <div className="grid md:grid-cols-2 gap-6">
              
              {/* Box de Compatibilidade */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                 <h4 className="text-gray-400 text-sm tracking-wider uppercase mb-2">Compatibilidade</h4>
                 <div className="text-4xl font-bold font-cinzel mb-2">
                    {result.score >= 90 ? (
                      <span className="text-emerald-400">{result.score}% Excelente</span>
                    ) : result.score >= 70 ? (
                      <span className="text-emerald-400">{result.score}% Bom</span>
                    ) : result.score >= 40 ? (
                      <span className="text-yellow-400">{result.score}% Aceitável</span>
                    ) : (
                      <span className="text-red-400">{result.score}% Tensão Vibracional</span>
                    )}
                 </div>
                 <p className="text-gray-300 text-sm">{result.compatibilidade?.descricao || ''}</p>
              </div>

              {/* Box de Números Principais */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <span className="block text-xs text-gray-400 uppercase">Expressão</span>
                    <span className="block text-2xl font-bold text-[#D4AF37]">{result.numeros.expressao}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-400 uppercase">Destino</span>
                    <span className="block text-2xl font-bold text-emerald-400">{result.numeros.destino}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-400 uppercase">Motivação</span>
                    <span className="block text-2xl font-bold text-purple-400">{result.numeros.motivacao}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-400 uppercase">Impressão</span>
                    <span className="block text-2xl font-bold text-white">{result.numeros.impressao}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-400 uppercase">Missão</span>
                    <span className="block text-2xl font-bold text-yellow-400">{result.numeros.missao}</span>
                  </div>
              </div>
           </div>

           {/* Triângulos */}
           <div className="mt-8">
              <h3 className="font-cinzel text-xl text-[#D4AF37] font-bold mb-6">Mapa dos Triângulos</h3>
              <TriangleVisualization
                vida={result.triangulos.vida}
                pessoal={result.triangulos.pessoal}
                social={result.triangulos.social}
                destino={result.triangulos.destino}
                bloqueios={result.bloqueios}
                nome={candidateName}
              />

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                   <div className="text-2xl font-bold text-red-400 mb-1">{result.debitosCarmicos ? result.debitosCarmicos.length : 0}</div>
                   <div className="text-gray-400 text-sm">Débitos Kármicos</div>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                   <div className="text-2xl font-bold text-yellow-400 mb-1">{result.tendenciasOcultas ? result.tendenciasOcultas.length : 0}</div>
                   <div className="text-gray-400 text-sm">Tendências Ocultas</div>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                   <div className="text-2xl font-bold text-purple-400 mb-1">{result.licoesCarmicas ? result.licoesCarmicas.length : 0}</div>
                   <div className="text-gray-400 text-sm">Lições Kármicas</div>
                 </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => handleGenerateAnalysis(candidateName)}
                  disabled={generating}
                  className="w-full md:w-auto px-8 py-4 rounded-xl bg-[#D4AF37] text-black font-bold text-lg hover:bg-yellow-400 focus:outline-none transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  {generating ? (
                     <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  ) : (
                     'Gerar Relatório Deste Nome'
                  )}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
