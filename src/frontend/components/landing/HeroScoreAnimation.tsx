import React, { useState, useEffect, useRef } from 'react';

interface NameCandidate {
  name: string;
  type: string;
  score: number;
  label: string;
  colorClass: string;
  gradientClass: string;
  ringGradient: string;
  bloqueios: string;
  vibracao: string;
}

const CANDIDATES: NameCandidate[] = [
  {
    name: 'JOÃO ALBERTO DA SILVA',
    type: 'Nome de Nascimento',
    score: 15,
    label: 'Crítico',
    colorClass: 'text-red-500',
    gradientClass: 'from-red-700 to-red-500',
    ringGradient: '#ef4444',
    bloqueios: '3 Bloqueios Ativos (Sabotagem)',
    vibracao: 'Tensão Vibracional Forte',
  },
  {
    name: 'JOÃO DA SILVA',
    type: 'Assinatura Atual',
    score: 32,
    label: 'Não recomendado',
    colorClass: 'text-red-400',
    gradientClass: 'from-red-500 to-red-400',
    ringGradient: '#f87171',
    bloqueios: '2 Bloqueios Ativos',
    vibracao: 'Tensão Vibracional Média',
  },
  {
    name: 'JOÃO A. SILVA',
    type: 'Variação Sugerida 1',
    score: 58,
    label: 'Aceitável',
    colorClass: 'text-amber-400',
    gradientClass: 'from-amber-500 to-amber-400',
    ringGradient: '#fbbf24',
    bloqueios: '1 Bloqueio Restante',
    vibracao: 'Vibração Neutra',
  },
  {
    name: 'JOÃO SILVA',
    type: 'Variação Sugerida 2',
    score: 81,
    label: 'Bom',
    colorClass: 'text-emerald-400',
    gradientClass: 'from-emerald-600 to-emerald-400',
    ringGradient: '#34d399',
    bloqueios: 'Nenhum Bloqueio Ativo',
    vibracao: 'Fluxo Positivo Geral',
  },
  {
    name: 'JOÃO ALBERTO SILVA',
    type: 'Nome Harmonizado',
    score: 95,
    label: 'Excelente',
    colorClass: 'text-[#f2ca50]',
    gradientClass: 'from-[#f2ca50] to-[#d4af37]',
    ringGradient: '#f2ca50',
    bloqueios: 'Livre de Bloqueios (Fluidez)',
    vibracao: 'Sinergia Perfeita (Expressão × Destino)',
  },
];

export function HeroScoreAnimation() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedScore, setDisplayedScore] = useState(CANDIDATES[0].score);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const counterRef = useRef<number | null>(null);

  const activeCandidate = CANDIDATES[activeIndex];

  // Auto-play cycling
  useEffect(() => {
    if (!isAutoPlaying) return;

    timerRef.current = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % CANDIDATES.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, isAutoPlaying]);

  // Smooth score counting animation
  useEffect(() => {
    const target = activeCandidate.score;
    const start = displayedScore;
    if (start === target) return;

    const duration = 800; // matching 800ms slow meditative transitions
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quadratic
      const ease = progress * (2 - progress);
      const currentVal = Math.round(start + (target - start) * ease);
      
      setDisplayedScore(currentVal);

      if (progress < 1) {
        counterRef.current = requestAnimationFrame(animate);
      }
    };

    counterRef.current = requestAnimationFrame(animate);

    return () => {
      if (counterRef.current) cancelAnimationFrame(counterRef.current);
    };
  }, [activeIndex]);

  const handleSelect = (index: number) => {
    setIsAutoPlaying(false);
    setActiveIndex(index);
  };

  // SVG Circular progress formulas
  const radius = 64;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * displayedScore) / 100;

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 items-center bg-[#181818]/40 backdrop-blur-md p-6 rounded-2xl ring-1 ring-white/5 shadow-2xl shadow-black/80 max-w-2xl mx-auto">
      
      {/* Esquerda: Lista de Opções */}
      <div className="w-full md:w-[60%] flex flex-col gap-2.5 order-2 md:order-1">
        <p className="text-[10px] tracking-[0.15em] font-semibold text-gray-500 uppercase px-1 mb-1">
          Selecione para simular o score:
        </p>
        {CANDIDATES.map((cand, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                isSelected
                  ? 'bg-white/[0.04] ring-1 ring-[#D4AF37]/30 shadow-md shadow-black/30'
                  : 'bg-[#111]/30 ring-1 ring-white/[0.02] hover:bg-white/[0.02]'
              }`}
            >
              {/* Gold light indicator */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#f2ca50] to-[#d4af37]" />
              )}
              
              <div className="flex justify-between items-start pl-2">
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                    {cand.type}
                  </p>
                  <p className={`font-cinzel font-bold text-sm tracking-wider truncate mt-0.5 ${
                    isSelected ? 'text-[#e5e2e1]' : 'text-gray-400 group-hover:text-gray-300'
                  }`}>
                    {cand.name}
                  </p>
                </div>
                
                <span className={`text-xs font-bold font-cinzel rounded-full px-2 py-0.5 ${
                  isSelected ? cand.colorClass : 'text-gray-600'
                }`}>
                  {cand.score}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Direita: Visor Circular do Score */}
      <div className="w-full md:w-[40%] flex flex-col items-center justify-center p-4 order-1 md:order-2">
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-white/5"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={activeCandidate.ringGradient}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke 0.8s ease' }}
            />
          </svg>

          {/* Inner Text info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`font-cinzel text-4xl font-bold tracking-tight ${activeCandidate.colorClass}`}>
              {displayedScore}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-gray-500 mt-0.5">Pontos</span>
            <span className={`text-xs font-semibold uppercase mt-1 tracking-wider ${activeCandidate.colorClass}`}>
              {activeCandidate.label}
            </span>
          </div>
        </div>

        {/* Info card details */}
        <div className="w-full text-center mt-5">
          <p className="text-xs font-semibold text-gray-300 transition-all duration-500 truncate">
            {activeCandidate.bloqueios}
          </p>
          <p className="text-[11px] text-gray-500 mt-1 transition-all duration-500 truncate">
            {activeCandidate.vibracao}
          </p>
        </div>
      </div>
    </div>
  );
}
