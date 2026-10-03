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
  ringClass: string;
  barClass: string;
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
    ringClass: 'ring-red-500/30',
    barClass: 'bg-red-500',
  },
  {
    name: 'JOÃO DA SILVA',
    type: 'Assinatura Atual',
    score: 32,
    label: 'Não recomendado',
    colorClass: 'text-orange-500',
    gradientClass: 'from-orange-600 to-orange-400',
    ringGradient: '#f97316',
    bloqueios: '2 Bloqueios Ativos',
    vibracao: 'Tensão Vibracional Média',
    ringClass: 'ring-orange-500/30',
    barClass: 'bg-orange-500',
  },
  {
    name: 'JOÃO A. SILVA',
    type: 'Variação Sugerida 1',
    score: 58,
    label: 'Aceitável',
    colorClass: 'text-yellow-400',
    gradientClass: 'from-yellow-500 to-yellow-400',
    ringGradient: '#facc15',
    bloqueios: '1 Bloqueio Restante',
    vibracao: 'Vibração Neutra',
    ringClass: 'ring-yellow-400/30',
    barClass: 'bg-yellow-400',
  },
  {
    name: 'JOÃO SILVA',
    type: 'Variação Sugerida 2',
    score: 81,
    label: 'Bom',
    colorClass: 'text-lime-400',
    gradientClass: 'from-lime-600 to-lime-400',
    ringGradient: '#a3e635',
    bloqueios: 'Nenhum Bloqueio Ativo',
    vibracao: 'Fluxo Positivo Geral',
    ringClass: 'ring-lime-400/30',
    barClass: 'bg-lime-400',
  },
  {
    name: 'JOÃO ALBERTO SILVA',
    type: 'Nome Harmonizado',
    score: 95,
    label: 'Excelente',
    colorClass: 'text-emerald-400',
    gradientClass: 'from-emerald-600 to-emerald-400',
    ringGradient: '#34d399',
    bloqueios: 'Livre de Bloqueios (Fluidez)',
    vibracao: 'Sinergia Perfeita (Expressão × Destino)',
    ringClass: 'ring-emerald-400/30',
    barClass: 'bg-emerald-400',
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

  // SVG Circular progress formulas - Enlarged Circle (224px diameter)
  const radius = 96;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * displayedScore) / 100;

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 items-center bg-[#181818]/40 backdrop-blur-md p-5 rounded-2xl ring-1 ring-white/5 shadow-2xl shadow-black/80 max-w-2xl mx-auto">
      
      {/* Esquerda: Lista de Opções */}
      <div className="w-full md:w-[56%] flex flex-col gap-2 order-2 md:order-1">
        {CANDIDATES.map((cand, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left py-2.5 px-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                isSelected
                  ? `bg-white/[0.04] ring-1 ${cand.ringClass} shadow-md shadow-black/30`
                  : 'bg-[#111]/30 ring-1 ring-white/[0.02] hover:bg-white/[0.02]'
              }`}
            >
              {/* Dynamic indicator bar */}
              {isSelected && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${cand.barClass}`} />
              )}
              
              <div className="flex justify-between items-center pl-2">
                <div className="min-w-0 pr-2">
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${
                    isSelected ? cand.colorClass : 'text-gray-500'
                  }`}>
                    {cand.type}
                  </p>
                  <p className={`font-cinzel font-bold text-sm tracking-wider truncate mt-0.5 ${
                    isSelected ? 'text-[#e5e2e1]' : 'text-gray-400 group-hover:text-gray-300'
                  }`}>
                    {cand.name}
                  </p>
                </div>
                
                <span className={`text-base font-bold font-cinzel shrink-0 pl-2 ${
                  isSelected ? cand.colorClass : 'text-gray-600'
                }`}>
                  {cand.score}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Direita: Visor Circular do Score (Maior e Centralizado) */}
      <div className="w-full md:w-[44%] flex flex-col items-center justify-center p-2 order-1 md:order-2">
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 224 224">
            <circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-white/5"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="112"
              cy="112"
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
            <span className={`font-cinzel text-6xl font-bold tracking-tight ${activeCandidate.colorClass}`}>
              {displayedScore}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Pontos</span>
            <span className={`text-sm font-bold uppercase mt-1 tracking-wider ${activeCandidate.colorClass}`}>
              {activeCandidate.label}
            </span>
          </div>
        </div>

        {/* Info card details */}
        <div className="w-full text-center mt-4">
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
