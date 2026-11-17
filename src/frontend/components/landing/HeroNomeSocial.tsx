import React, { useEffect, useState } from 'react';

/**
 * Exemplo ilustrativo (nome fictício) da comparação que a análise faz:
 * assinatura atual com bloqueios x variação sem bloqueios, cada uma com nota de 0 a 100.
 * Sem consequências de vida atribuídas aos números (DEV-315).
 */
export function HeroNomeSocial() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setStep(1);
      return;
    }
    const interval = setInterval(() => setStep((s) => (s + 1) % 2), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="nm-floating-card w-full max-w-xl mx-auto p-5 sm:p-6 flex flex-col gap-5">
      <div className="text-center">
        <p className="nm-score-eyebrow mb-1">Exemplo ilustrativo</p>
        <h3 className="font-cinzel text-lg font-bold text-[#e5e2e1]">Duas assinaturas, duas notas</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className={`rounded-2xl p-4 transition-all duration-700 motion-reduce:transition-none ${
            step === 0 ? 'bg-[#2a1a1a] scale-[1.02]' : 'bg-[#141414] opacity-70'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-300">Assinatura atual</span>
            <span className="font-cinzel text-sm font-bold text-red-300">
              38<span className="text-[10px] font-normal text-gray-500">/100</span>
            </span>
          </div>
          <p className="font-cinzel text-sm sm:text-base font-bold text-gray-200 tracking-wide mb-3">
            JOÃO ALBERTO DA SILVA
          </p>
          <ul className="space-y-1.5 text-xs text-red-300/90">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Bloqueio 444 no Triângulo da Vida
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Bloqueio 888 no Triângulo da Vida
            </li>
          </ul>
        </div>

        <div
          className={`rounded-2xl p-4 transition-all duration-700 motion-reduce:transition-none ${
            step === 1 ? 'bg-[#D4AF37]/[0.10] scale-[1.02]' : 'bg-[#141414] opacity-70'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">Variação sugerida</span>
            <span className="font-cinzel text-sm font-bold text-[#f2ca50]">
              92<span className="text-[10px] font-normal text-[#D4AF37]/70">/100</span>
            </span>
          </div>
          <p className="font-cinzel text-sm sm:text-base font-bold text-[#e5e2e1] tracking-wide mb-3">
            JOÃO ALBERTO SILVA
          </p>
          <ul className="space-y-1.5 text-xs text-[#f2ca50]">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              Sem bloqueios no Triângulo da Vida
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bea5ff]" />
              Compatível com Expressão e Destino
            </li>
          </ul>
        </div>
      </div>

      <p className="nm-caption text-center">
        Nomes e notas fictícios, só para mostrar como a comparação aparece. Mudar o nome de uso não altera seus
        documentos.
      </p>
    </div>
  );
}
