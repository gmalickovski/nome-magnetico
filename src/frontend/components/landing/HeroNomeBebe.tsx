import React, { useState, useEffect } from 'react';

interface BabyCandidate {
  name: string;
  score: number;
  label: string;
  details: string;
  colorClass: string;
  isGold: boolean;
}

const BABY_CANDIDATES: BabyCandidate[] = [
  {
    name: 'ARTHUR CASTILHO',
    score: 48,
    label: 'Aceitável',
    details: '1 Bloqueio de Instabilidade familiar no Triângulo Pessoal',
    colorClass: 'text-yellow-400',
    isGold: false,
  },
  {
    name: 'GAEL CASTILHO',
    score: 76,
    label: 'Bom',
    details: 'Sem bloqueios. Harmonia aceitável com o Destino do bebê.',
    colorClass: 'text-lime-400',
    isGold: false,
  },
  {
    name: 'BENJAMIN CASTILHO',
    score: 97,
    label: 'Excelente',
    details: 'Nome de Ouro ✦ Perfeita harmonia de Expressão e Destino.',
    colorClass: 'text-[#E8A598]',
    isGold: true,
  },
];

export function HeroNomeBebe() {
  const [activeIndex, setActiveIndex] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % BABY_CANDIDATES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto bg-[#181818]/40 backdrop-blur-md p-6 rounded-2xl ring-1 ring-white/5 shadow-2xl shadow-black/80 flex flex-col gap-6">
      <div className="text-center">
        <p className="text-[10px] tracking-[0.15em] font-semibold text-[#E8A598] uppercase mb-1">
          Ranking de Nomes de Bebê
        </p>
        <h3 className="font-cinzel text-lg font-bold text-white">
          Encontrando o "Nome de Ouro"
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {BABY_CANDIDATES.map((cand, idx) => {
          const isActive = activeIndex === idx;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl transition-all duration-500 relative ring-1 ${
                isActive
                  ? cand.isGold
                    ? 'bg-[#E8A598]/5 ring-[#E8A598]/40 shadow-lg shadow-[#E8A598]/10 scale-[1.02]'
                    : 'bg-white/[0.04] ring-[#D4AF37]/30 scale-[1.01]'
                  : 'bg-[#111]/30 ring-white/[0.02] opacity-60'
              }`}
            >
              {/* Gold light indicator */}
              {isActive && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  cand.isGold 
                    ? 'bg-gradient-to-b from-[#E8A598] to-[#C97B63]' 
                    : 'bg-gradient-to-b from-[#f2ca50] to-[#d4af37]'
                }`} />
              )}

              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">👶</span>
                  <span className="font-cinzel font-bold text-sm text-white tracking-wider">
                    {cand.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {cand.isGold && (
                    <span className="hidden sm:inline-block bg-[#E8A598]/10 text-[#E8A598] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Nome de Ouro
                    </span>
                  )}
                  <span className={`font-cinzel font-bold text-xs ${cand.colorClass}`}>
                    Score {cand.score}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 pl-7 transition-opacity duration-300">
                {cand.details}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
