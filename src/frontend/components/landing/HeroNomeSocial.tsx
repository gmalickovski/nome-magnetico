import React, { useState, useEffect } from 'react';

export function HeroNomeSocial() {
  const [step, setStep] = useState(0); // 0 = Before, 1 = Transitioning, 2 = After

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto bg-[#181818]/40 backdrop-blur-md p-6 rounded-2xl ring-1 ring-white/5 shadow-2xl shadow-black/80 flex flex-col gap-6">
      <div className="text-center">
        <p className="text-[10px] tracking-[0.15em] font-semibold text-gray-500 uppercase mb-1">
          Simulação da Transmutação Cabalística
        </p>
        <h3 className="font-cinzel text-lg font-bold text-white">
          Remoção de Bloqueios de Assinatura
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center relative">
        
        {/* BEFORE CARD */}
        <div className={`p-5 rounded-2xl transition-all duration-700 ring-1 ${
          step === 0 
            ? 'bg-red-500/5 ring-red-500/30 shadow-lg shadow-red-950/20 scale-[1.02]' 
            : 'bg-[#111]/30 ring-white/[0.02] opacity-60 scale-95'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-400">Antes</span>
            <span className="font-cinzel font-bold text-red-500 text-xs px-2 py-0.5 bg-red-500/10 rounded-full">Score 15</span>
          </div>
          
          <p className="font-cinzel font-bold text-base text-gray-200 tracking-wider mb-3 select-none">
            JOÃO <span className="text-red-400 line-through decoration-2">ALBERTO</span> DA SILVA
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-red-400/90">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Bloqueio 444 (Instabilidade)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-red-400/90">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Bloqueio 888 (Perda Financeira)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-red-500/70">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
              <span>Tensão Vibracional Forte</span>
            </div>
          </div>
        </div>

        {/* TRANSITION ARROW / GLOW FOR MOBILE */}
        <div className="flex md:hidden justify-center items-center py-1">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-[#D4AF37] flex items-center justify-center text-xs text-white font-bold transition-all duration-700 ${
            step === 1 ? 'animate-ping scale-110' : 'opacity-80'
          }`}>
            ✦
          </div>
        </div>

        {/* AFTER CARD */}
        <div className={`p-5 rounded-2xl transition-all duration-700 ring-1 ${
          step === 2 
            ? 'bg-[#D4AF37]/5 ring-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/10 scale-[1.02]' 
            : 'bg-[#111]/30 ring-white/[0.02] opacity-60 scale-95'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">Depois</span>
            <span className="font-cinzel font-bold text-[#D4AF37] text-xs px-2 py-0.5 bg-[#D4AF37]/10 rounded-full">Score 95</span>
          </div>

          <p className="font-cinzel font-bold text-base text-white tracking-wider mb-3 select-none">
            JOÃO ALBERTO SILVA
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>Livre de Bloqueios</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>Harmonia Expressão-Destino</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#d7c6ff]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#bea5ff]" />
              <span>Fluxo Fluido & Magnético</span>
            </div>
          </div>
        </div>

        {/* TRANSITION CONNECTOR FOR DESKTOP */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className={`w-10 h-10 rounded-full bg-[#111] ring-1 ring-white/10 flex items-center justify-center transition-all duration-700 ${
            step === 1 
              ? 'ring-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-110' 
              : 'opacity-70'
          }`}>
            <svg className={`w-5 h-5 text-purple-400 transition-transform duration-700 ${step === 1 ? 'rotate-180 scale-125' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

      </div>

      {/* Progress indicators at the bottom */}
      <div className="flex justify-center gap-2 mt-2">
        <div className={`h-1 rounded-full transition-all duration-300 ${step === 0 ? 'w-6 bg-red-500' : 'w-2 bg-gray-700'}`} />
        <div className={`h-1 rounded-full transition-all duration-300 ${step === 1 ? 'w-6 bg-purple-500' : 'w-2 bg-gray-700'}`} />
        <div className={`h-1 rounded-full transition-all duration-300 ${step === 2 ? 'w-6 bg-[#D4AF37]' : 'w-2 bg-gray-700'}`} />
      </div>
    </div>
  );
}
