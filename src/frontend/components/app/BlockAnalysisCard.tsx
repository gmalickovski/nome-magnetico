import { useState } from 'react';

interface Bloqueio {
  codigo: string;
  titulo: string;
  descricao: string;
  triangulos?: string[];
  antidoto?: string;
}

interface BlockAnalysisCardProps {
  bloqueio: Bloqueio;
  defaultOpen?: boolean;
}

const TRIANGULO_LABELS: Record<string, string> = {
  vida: 'Vida',
  pessoal: 'Pessoal',
  social: 'Social',
  destino: 'Destino',
};

export default function BlockAnalysisCard({ bloqueio, defaultOpen = false }: BlockAnalysisCardProps) {
  return (
    <div className="rounded-2xl bg-red-500/5 overflow-hidden">
      <div className="w-full flex items-center justify-between p-5 text-left border-b border-red-500/10">
        <div className="flex items-center gap-3">
          <span className="text-red-400 text-xl leading-none">⚠</span>
          <div>
            <span className="font-cinzel text-base font-bold text-red-400">{bloqueio.codigo}</span>
            <span className="mx-2 text-gray-600">·</span>
            <span className="font-medium text-gray-200">{bloqueio.titulo}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">{bloqueio.descricao}</p>

          {bloqueio.triangulos && bloqueio.triangulos.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Aparece nos triângulos:</p>
              <div className="flex flex-wrap gap-2">
                {bloqueio.triangulos.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-xs border border-white/10">
                    {TRIANGULO_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bloqueio.antidoto && (
            <div className="rounded-xl bg-[#bea5ff]/8 border border-[#bea5ff]/25 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#c084fc] text-sm">✦</span>
                <span className="text-xs uppercase tracking-[0.12em] text-[#c084fc] font-medium">Antídoto Prático</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{bloqueio.antidoto}</p>
            </div>
          )}
        </div>
    </div>
  );
}
