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
    name: 'JULIANA MARTINS ROCHA',
    type: 'Nome de Nascimento',
    score: 81,
    label: 'Favorável',
    colorClass: 'text-lime-400',
    gradientClass: 'from-lime-600 to-lime-400',
    ringGradient: '#a3e635',
    bloqueios: 'Nome completo da certidão',
    vibracao: 'Boa base, com pontos a afinar',
    ringClass: 'ring-lime-400/30',
    barClass: 'bg-lime-400',
  },
  {
    name: 'JULIANA M. ROCHA',
    type: 'Assinatura Atual',
    score: 83,
    label: 'Favorável',
    colorClass: 'text-lime-400',
    gradientClass: 'from-lime-600 to-lime-400',
    ringGradient: '#a3e635',
    bloqueios: 'Abreviação do primeiro sobrenome',
    vibracao: 'Boa base, com pontos a afinar',
    ringClass: 'ring-lime-400/30',
    barClass: 'bg-lime-400',
  },
  {
    name: 'JULIANA MÁRTINS ROCHA',
    type: 'Acento Sutil',
    score: 65,
    label: 'Equilíbrio Parcial',
    colorClass: 'text-yellow-400',
    gradientClass: 'from-yellow-500 to-yellow-400',
    ringGradient: '#facc15',
    bloqueios: 'Inclusão de acento na assinatura',
    vibracao: 'Forças claras, alguns pontos',
    ringClass: 'ring-yellow-400/30',
    barClass: 'bg-yellow-400',
  },
  {
    name: 'JULIANA MARTINS',
    type: 'Nome Encurtado',
    score: 87,
    label: 'Harmonioso',
    colorClass: 'text-emerald-400',
    gradientClass: 'from-emerald-600 to-emerald-400',
    ringGradient: '#34d399',
    bloqueios: 'Uso do primeiro sobrenome',
    vibracao: 'Em harmonia com a sua data',
    ringClass: 'ring-emerald-400/30',
    barClass: 'bg-emerald-400',
  },
  {
    name: 'JULIANA ROCHA',
    type: 'Nome Harmonizado',
    score: 93,
    label: 'Harmonioso',
    colorClass: 'text-emerald-400',
    gradientClass: 'from-emerald-600 to-emerald-400',
    ringGradient: '#34d399',
    bloqueios: 'Saiu "Martins", sem acento',
    vibracao: 'Em harmonia com a sua data',
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
    <div className="w-full max-w-[380px] sm:max-w-[400px] lg:max-w-[390px] xl:max-w-[615px] flex flex-col xl:flex-row gap-3.5 xl:gap-5 items-center nm-floating-card p-4 sm:p-5 lg:p-4 xl:p-6">
      
      {/* Lista de Opções:
          - < 1280px (mobile, tablet e telas ~11" lg): fica empilhada abaixo do círculo com 100% da largura, sem cortar nomes.
          - >= 1280px (xl desktop): fica à esquerda (58% da largura) ao lado do círculo. */}
      <div className="w-full xl:w-[58%] flex flex-col gap-2 xl:gap-2.5 order-2 xl:order-1">
        {CANDIDATES.map((cand, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left py-2 xl:py-2.5 px-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                isSelected
                  ? `bg-white/[0.05] ring-1 ${cand.ringClass}`
                  : 'bg-[#111]/30 ring-1 ring-white/[0.02] hover:bg-white/[0.02]'
              }`}
            >
              {/* Dynamic indicator bar */}
              {isSelected && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${cand.barClass}`} />
              )}
              
              <div className="flex justify-between items-center pl-2 gap-2">
                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${
                    isSelected ? cand.colorClass : 'text-gray-500'
                  }`}>
                    {cand.type}
                  </p>
                  <p className={`font-cinzel font-bold text-xs sm:text-[13px] xl:text-[13.5px] tracking-wide whitespace-nowrap mt-0.5 ${
                    isSelected ? 'text-[#e5e2e1]' : 'text-gray-400 group-hover:text-gray-300'
                  }`}>
                    {cand.name}
                  </p>
                </div>
                
                <span className={`text-sm sm:text-base font-bold font-cinzel shrink-0 ${
                  isSelected ? cand.colorClass : 'text-gray-600'
                }`}>
                  {cand.score}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Visor Circular do Score:
          - < 1280px (mobile, tablet e telas ~11" lg): fica no topo do card empilhado, centralizado sem vazar das bordas.
          - >= 1280px (xl desktop): fica à direita (42% da largura). */}
      <div className="w-full xl:w-[42%] flex flex-col items-center justify-center p-1 xl:p-2 order-1 xl:order-2">
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 lg:w-40 lg:h-40 xl:w-52 xl:h-52 flex items-center justify-center">
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
            <span className={`font-cinzel text-5xl xl:text-6xl font-bold tracking-tight ${activeCandidate.colorClass}`}>
              {displayedScore}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Pontos</span>
            <span className={`text-xs xl:text-sm font-bold uppercase mt-1 tracking-wider ${activeCandidate.colorClass}`}>
              {activeCandidate.label}
            </span>
          </div>
        </div>

        {/* Info card details (sempre visíveis sem cortar com reticências) */}
        <div className="w-full text-center mt-2.5 xl:mt-4 px-1">
          <p className="text-xs font-semibold text-gray-300 transition-all duration-500 leading-snug">
            {activeCandidate.bloqueios}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 xl:mt-1 transition-all duration-500 leading-snug">
            {activeCandidate.vibracao}
          </p>
        </div>
      </div>
    </div>
  );
}
