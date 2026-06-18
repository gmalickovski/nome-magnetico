import React, { useState, useEffect } from 'react';

export function HeroNomeEmpresa() {
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setToggle((prev) => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Radar vertices (points relative to center cx=100, cy=100)
  // Vertex 0: Top (Expressão)
  // Vertex 1: Top-Right (Destino Sócio)
  // Vertex 2: Bottom-Right (Destino Empresa)
  // Vertex 3: Bottom (Estabilidade)
  // Vertex 4: Bottom-Left (Crescimento)
  // Vertex 5: Top-Left (Fluidez)
  
  // Distorted name data (low values on some vertices)
  const distortedPoints = "100,50 135,80 125,120 100,120 75,110 70,80";
  
  // Harmonized name data (full hexagon)
  const harmonizedPoints = "100,30 160,65 160,135 100,170 40,135 40,65";

  return (
    <div className="w-full max-w-xl mx-auto bg-[#181818]/40 backdrop-blur-md p-6 rounded-2xl ring-1 ring-white/5 shadow-2xl shadow-black/80 flex flex-col md:flex-row gap-6 items-center">
      
      {/* Esquerda: Info */}
      <div className="w-full md:w-[50%] flex flex-col gap-4">
        <div>
          <p className="text-[10px] tracking-[0.15em] font-semibold text-[#7FB3E8] uppercase mb-1">
            Branding Vibracional
          </p>
          <h3 className="font-cinzel text-base font-bold text-white">
            Compatibilidade Corporativa
          </h3>
        </div>

        <div className="space-y-3">
          <div className={`p-3 rounded-xl transition-all duration-500 ring-1 ${
            !toggle
              ? 'bg-red-500/5 ring-red-500/20 opacity-100 scale-[1.02]'
              : 'bg-[#111]/10 ring-white/[0.01] opacity-40 scale-95'
          }`}>
            <p className="font-cinzel font-bold text-xs text-red-400">NOME: "MKT DIGITAL LTDA"</p>
            <p className="text-[10px] text-gray-400 mt-1">Bloqueios de instabilidade e conflito societário. Baixa compatibilidade com sócios.</p>
          </div>

          <div className={`p-3 rounded-xl transition-all duration-500 ring-1 ${
            toggle
              ? 'bg-[#4A7FC1]/10 ring-[#4A7FC1]/40 opacity-100 scale-[1.02]'
              : 'bg-[#111]/10 ring-white/[0.01] opacity-40 scale-95'
          }`}>
            <p className="font-cinzel font-bold text-xs text-[#7FB3E8]">NOME: "VORTEX BRANDING"</p>
            <p className="text-[10px] text-gray-400 mt-1">Livre de bloqueios. Forte alinhamento comercial e prosperidade com o sócio principal.</p>
          </div>
        </div>
      </div>

      {/* Direita: Radar SVG Chart */}
      <div className="w-full md:w-[50%] flex flex-col items-center justify-center p-2">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Grid circles/hexagons */}
            <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" className="stroke-white/5 fill-none" strokeWidth="1" />
            <polygon points="100,45 148,72 148,128 100,155 52,128 52,72" className="stroke-white/5 fill-none" strokeWidth="1" />
            <polygon points="100,70 126,85 126,115 100,130 74,115 74,85" className="stroke-white/5 fill-none" strokeWidth="1" />
            
            {/* Center axes lines */}
            <line x1="100" y1="20" x2="100" y2="180" className="stroke-white/5" strokeWidth="1" />
            <line x1="30" y1="60" x2="170" y2="140" className="stroke-white/5" strokeWidth="1" />
            <line x1="30" y1="140" x2="170" y2="60" className="stroke-white/5" strokeWidth="1" />

            {/* Labels on vertices */}
            <text x="100" y="14" className="text-[9px] fill-gray-500 font-semibold" textAnchor="middle">Expressão</text>
            <text x="176" y="62" className="text-[9px] fill-gray-500 font-semibold" textAnchor="start">Sócio</text>
            <text x="176" y="144" className="text-[9px] fill-gray-500 font-semibold" textAnchor="start">Empresa</text>
            <text x="100" y="192" className="text-[9px] fill-gray-500 font-semibold" textAnchor="middle">Estabilidade</text>
            <text x="24" y="144" className="text-[9px] fill-gray-500 font-semibold" textAnchor="end">Crescimento</text>
            <text x="24" y="62" className="text-[9px] fill-gray-500 font-semibold" textAnchor="end">Fluidez</text>

            {/* Distorted Name polygon (Red) */}
            <polygon
              points={distortedPoints}
              className={`fill-red-500/10 stroke-red-500 transition-all duration-1000 ${
                !toggle ? 'opacity-90 stroke-[2]' : 'opacity-20 stroke-[1]'
              }`}
            />

            {/* Harmonized Name polygon (Blue/Gold) */}
            <polygon
              points={harmonizedPoints}
              className={`fill-[#4A7FC1]/20 stroke-[#7FB3E8] transition-all duration-1000 ${
                toggle ? 'opacity-90 stroke-[2.5]' : 'opacity-20 stroke-[1]'
              }`}
            />
          </svg>
        </div>
      </div>
      
    </div>
  );
}
