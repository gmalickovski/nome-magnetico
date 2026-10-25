import React from 'react';
import { landingMockupFloatClass } from './LandingSectionIntro';

const GOLD = '#D4AF37';
const GOLD_LIGHT = '#f2ca50';

interface MockupProps {
  className?: string;
}

/**
 * Assinatura harmonizada límpida e legível em SVG.
 * Regras cabalísticas da assinatura:
 * - Legível (escrita limpa, sem rabiscos ou traços cortantes negativos).
 * - Traçado suavemente ascendente (-2 graus) para emanar expansão e prosperidade.
 * - Mantém o acento de harmonização exato (Mariã Silva / João Silva).
 */
export function CleanSignatureSvg({
  name = 'Ana Paula Férreira',
  className = 'w-full h-12 sm:h-14',
}: {
  name?: string;
  className?: string;
}) {
  const reactId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `goldGrad-${reactId}`;
  const glowId = `sigGlow-${reactId}`;

  return (
    <svg
      viewBox="0 0 320 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`Assinatura harmonizada limpa e legível de ${name}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2ca50" />
          <stop offset="45%" stopColor="#ffe57f" />
          <stop offset="85%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#f2ca50" />
        </linearGradient>
        <filter id={glowId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#f2ca50" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Rotação ascendente suave de 2 graus (regra: traço ascendente sem cruzar letras) */}
      <g transform="rotate(-2.5 160 32)">
        {/* Texto manuscrito/caligráfico límpido e 100% legível */}
        <text
          x="160"
          y="38"
          textAnchor="middle"
          fill={`url(#${gradId})`}
          filter={`url(#${glowId})`}
          style={{
            fontFamily: "'Segoe Script', 'Caveat', 'Dancing Script', 'Alex Brush', 'Playfair Display', cursive, sans-serif",
            fontSize: '34px',
            fontWeight: 600,
            letterSpacing: '1.5px',
          }}
        >
          {name}
        </text>

        {/* Linha guia suave de sustentação ascendente na base */}
        <line
          x1="36"
          y1="48"
          x2="284"
          y2="42"
          stroke={`url(#${gradId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="4 3"
          opacity="0.75"
        />
      </g>
    </svg>
  );
}

/**
 * Base flexível compartilhada entre os mockups da Seção 4:
 * Aproveita a largura disponível da coluna em smartphones, tablets e desktops,
 * mantendo altura visual equilibrada (~280px–320px) com o bloco de texto ao lado.
 */
const MOCKUP_CARD_WIDTH = 'w-full max-w-[460px] sm:max-w-[500px] lg:max-w-[540px] mx-auto';

/**
 * MOCKUP 1: Documento Oficial (CIN - Carteira de Identidade Nacional / CNH)
 * Proporção real de cartão ISO/IEC 7810 ID-1: 85.6mm × 53.98mm (~1.586 : 1).
 */
export function DocumentCinMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`${MOCKUP_CARD_WIDTH} aspect-[85.6/54] ${landingMockupFloatClass} relative overflow-hidden flex flex-col justify-between p-4 sm:p-5 lg:p-6 select-none ${className}`}
    >
      {/* Padrão geométrico de fundo estilo cédula de segurança */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #f2ca50 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Aura dourada superior */}
      <div
        className="absolute -top-16 -right-16 w-44 h-44 bg-[#f2ca50]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Cabeçalho Oficial do Documento */}
      <div className="relative z-10 flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Brasão estilizado em vetor dourado */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#f2ca50]" fill="none" stroke="currentColor">
              <path
                d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 7l1.5 3.5L17 11l-2.5 2.5.5 3.5-3-1.8-3 1.8.5-3.5L7 11l3.5-.5L12 7z"
                fill="#f2ca50"
                fillOpacity="0.4"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div>
            <p className="font-cinzel text-[9px] sm:text-[10px] font-bold tracking-[0.14em] text-[#f2ca50] uppercase leading-tight">
              República Federativa do Brasil
            </p>
            <p className="text-[8px] sm:text-[9px] text-gray-400 tracking-wider uppercase font-medium">
              Carteira de Identidade Nacional (CIN)
            </p>
          </div>
        </div>
        <span className="font-mono text-[8px] text-[#f2ca50]/80 border border-[#f2ca50]/20 px-2 py-0.5 rounded-full bg-[#f2ca50]/5 whitespace-nowrap">
          DOCUMENTO OFICIAL
        </span>
      </div>

      {/* Corpo do Documento: Foto biométrica abstrata + Metadados */}
      <div className="relative z-10 grid grid-cols-12 gap-3 my-auto items-center py-1">
        {/* Foto biométrica / Silhueta estilizada com auréola */}
        <div className="col-span-4 sm:col-span-3 flex flex-col items-center">
          <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg bg-gradient-to-b from-white/10 to-white/5 border border-[#f2ca50]/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#f2ca50] to-transparent animate-pulse" />
            <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400/80" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <div className="mt-0.5 flex items-center gap-0.5 text-[7px] font-mono text-[#f2ca50]/80">
              <span>●</span> BIOMETRIA
            </div>
          </div>
        </div>

        {/* Campos Oficiais com Nome de Certidão de Nascimento */}
        <div className="col-span-8 sm:col-span-9 space-y-1.5">
          <div>
            <p className="text-[7px] sm:text-[8px] uppercase tracking-wider text-gray-400">
              Nome Civil (Certidão de Nascimento)
            </p>
            <p className="font-cinzel text-xs sm:text-sm font-bold text-[#e5e2e1] tracking-wide leading-tight">
              ANA PAULA FERREIRA LIMA
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[8px] sm:text-[9px]">
            <div>
              <p className="text-[7px] uppercase tracking-wider text-gray-500">CPF</p>
              <p className="font-mono text-gray-300">***.842.109-**</p>
            </div>
            <div>
              <p className="text-[7px] uppercase tracking-wider text-gray-500">Nascimento</p>
              <p className="font-mono text-gray-300">15/03/1985</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[8px] sm:text-[9px]">
            <div>
              <p className="text-[7px] uppercase tracking-wider text-gray-500">Nacionalidade</p>
              <p className="text-gray-300">Brasileira</p>
            </div>
            <div>
              <p className="text-[7px] uppercase tracking-wider text-gray-500">Órgão</p>
              <p className="text-gray-300">SSP / Registro Civil</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campo da Assinatura: onde vai o NOME HARMONIZADO LIMPO */}
      <div className="relative z-10 pt-2 border-t border-dashed border-[#f2ca50]/30 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.16em] font-medium text-[#f2ca50] flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#f2ca50] animate-ping" />
            Assinatura do Titular
          </p>
        </div>

        {/* Quadro com a assinatura límpida e legível Ana Paula Férreira */}
        <div className="relative rounded-lg bg-black/40 border border-[#f2ca50]/40 p-1.5 sm:p-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f2ca50]/5 to-transparent pointer-events-none" />
          <CleanSignatureSvg name="Ana Paula Férreira" className="w-full h-8 sm:h-10" />
        </div>
      </div>
    </div>
  );
}

/**
 * MOCKUP 2: Perfil de Rede Social / Presença Digital
 * Recorte superior da tela de smartphone com proporções reais de interface mobile
 * e corte suave na parte inferior (grade de publicações).
 */
export function SocialProfileMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`w-full max-w-[400px] sm:max-w-[440px] mx-auto ${landingMockupFloatClass} rounded-t-[2.2rem] rounded-b-2xl border-t-2 border-x-2 border-b border-white/15 relative overflow-hidden flex flex-col justify-between p-4 sm:p-5 select-none ${className}`}
    >
      {/* Brilho de fundo místico roxo e dourado */}
      <div
        className="absolute -top-12 -left-12 w-44 h-44 bg-[#d7c6ff]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-12 -right-12 w-44 h-44 bg-[#f2ca50]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Barra superior de smartphone com Notch */}
      <div className="relative z-10 flex flex-col items-center pb-2 border-b border-white/10 shrink-0">
        <div className="w-20 h-3 bg-black/60 rounded-full mb-1.5 border border-white/5" />
        <div className="w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-[#e5e2e1] tracking-wide">
              @anapaulaferreira
            </span>
            <span className="w-3.5 h-3.5 rounded-full bg-[#f2ca50] text-[#131313] flex items-center justify-center text-[9px] font-bold">
              ✓
            </span>
          </div>
          <span className="text-gray-400 text-xs">•••</span>
        </div>
      </div>

      {/* Header do Perfil: Avatar com anel dourado + Métricas */}
      <div className="relative z-10 flex items-center gap-4 my-3 shrink-0">
        <div className="relative shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#f2ca50] via-[#d7c6ff] to-[#f2ca50]">
            <div className="w-full h-full rounded-full bg-[#161616] flex items-center justify-center overflow-hidden border border-black">
              <span className="font-cinzel text-base sm:text-lg font-bold text-[#f2ca50]">
                AP
              </span>
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#f2ca50] text-[#131313] border-2 border-[#131313] flex items-center justify-center text-[8px] font-bold">
            ✦
          </span>
        </div>

        <div className="flex-1 grid grid-cols-3 text-center gap-2">
          <div>
            <p className="font-mono text-xs sm:text-sm font-bold text-[#e5e2e1]">142</p>
            <p className="text-[10px] text-gray-400">posts</p>
          </div>
          <div>
            <p className="font-mono text-xs sm:text-sm font-bold text-[#f2ca50]">48.6K</p>
            <p className="text-[10px] text-gray-400">seguidores</p>
          </div>
          <div>
            <p className="font-mono text-xs sm:text-sm font-bold text-[#e5e2e1]">1.2K</p>
            <p className="text-[10px] text-gray-400">conexões</p>
          </div>
        </div>
      </div>

      {/* Nome e Biografia Profissional */}
      <div className="relative z-10 space-y-1 shrink-0">
        <h4 className="font-cinzel text-sm sm:text-base font-bold text-[#e5e2e1] leading-tight">
          Ana Paula Férreira
        </h4>
        <p className="text-xs text-[#d7c6ff]/90 font-medium leading-tight">
          Diretora Criativa & Consultora Estratégica
        </p>
        <p className="text-[11px] text-gray-400 leading-snug">
          Projetos autorais, comunicação e posicionamento de marca.
        </p>
        <p className="text-[11px] font-mono text-[#f2ca50]/90 flex items-center gap-1 pt-0.5">
          <span>🔗</span> anapaulaferreira.com.br
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 mt-3 pt-2.5 border-t border-white/5 shrink-0">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="rounded-full bg-[#f2ca50] text-[#131313] py-1.5 text-xs font-bold tracking-wide flex items-center justify-center gap-1"
        >
          <span>Seguir</span>
          <span className="text-[9px]">✦</span>
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="rounded-full bg-white/5 border border-white/10 text-[#e5e2e1] py-1.5 text-xs font-medium flex items-center justify-center"
        >
          Mensagem
        </button>
      </div>
    </div>
  );
}

/**
 * MOCKUP 3: Folha de Ofício de Contrato (Crop da Parte Inferior da Folha)
 * Representa fielmente o recorte inferior de uma folha A4/Ofício de contrato:
 * - Topo cortado com fade mostrando as linhas finais das cláusulas do documento.
 * - Parte inferior da folha com local/data, a linha horizontal clássica de assinatura
 *   e a assinatura "Ana Paula Férreira" posicionada sobre a linha.
 */
export function ContractMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`${MOCKUP_CARD_WIDTH} relative pt-2 select-none ${className}`}
    >
      {/* Fade superior que cria o efeito de recorte (crop) vindo do meio da folha de ofício */}
      <div
        className="relative mx-auto w-full rounded-b-xl rounded-t-sm bg-gradient-to-b from-[#1c1b1a] via-[#181716] to-[#151413] border-x border-b border-white/15 shadow-[0_24px_50px_rgba(0,0,0,0.65)] overflow-hidden px-5 sm:px-8 pt-6 pb-5"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 100%)',
        }}
      >
        {/* Margem lateral esquerda típica de folha de ofício / laudas contratuais */}
        <div
          className="absolute inset-y-0 left-3 sm:left-4 w-px bg-[#f2ca50]/15 pointer-events-none"
          aria-hidden="true"
        />

        {/* Linhas fictícias da cláusula anterior cortada no topo da folha */}
        <div className="space-y-2 mb-3.5 opacity-55">
          <div className="h-1.5 bg-white/15 rounded-full w-full" />
          <div className="h-1.5 bg-white/15 rounded-full w-11/12" />
          <div className="h-1.5 bg-white/15 rounded-full w-3/4" />
        </div>

        {/* Último parágrafo legível de fechamento do contrato + linhas fictícias */}
        <div className="space-y-2 mb-4">
          <p className="text-[10px] sm:text-[11px] text-gray-300 leading-relaxed font-serif">
            <span className="font-bold text-[#e5e2e1] uppercase tracking-wider text-[9.5px] sm:text-[10px] font-sans mr-1.5">
              Cláusula 9ª:
            </span>
            E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em meio físico e digital para que produza todos os seus efeitos.
          </p>
          <div className="space-y-1.5 pt-0.5 opacity-65">
            <div className="h-1.5 bg-white/15 rounded-full w-full" />
            <div className="h-1.5 bg-white/15 rounded-full w-4/5" />
          </div>
          <p className="text-[10px] text-gray-400 text-right pt-1 font-serif italic">
            São Paulo, 15 de março de 2026.
          </p>
        </div>

        {/* Área de assinatura no pé da folha de ofício */}
        <div className="mt-2 pt-2 flex flex-col items-center text-center relative">
          {/* Assinatura harmonizada posicionada logo acima da linha de assinatura */}
          <div className="w-full max-w-[280px] sm:max-w-[310px] -mb-2 z-10">
            <CleanSignatureSvg name="Ana Paula Férreira" className="w-full h-11 sm:h-12" />
          </div>

          {/* Linha clássica horizontal de assinatura do contrato */}
          <div className="w-full max-w-[300px] sm:max-w-[340px] border-b border-[#f2ca50]/60 mb-2" />

          {/* Identificação formal abaixo da linha */}
          <p className="font-cinzel text-xs sm:text-sm font-bold text-[#e5e2e1] tracking-wide leading-tight">
            ANA PAULA FERREIRA LIMA
          </p>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-gray-400 mt-0.5">
            Contratante / Titular · CPF ***.842.109-**
          </p>
        </div>

        {/* Rodapé da folha de ofício */}
        <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[8px] sm:text-[9px] text-gray-500 font-mono">
          <span>INSTRUMENTO PARTICULAR · #DOC-2026-NM</span>
          <span className="text-[#f2ca50]/80">Página 3 de 3</span>
        </div>
      </div>
    </div>
  );
}

/**
 * MOCKUP 4: Marca Pessoal & Cartão de Visita / Autoria
 * Proporção real de Cartão de Visita: 90mm × 50mm (~1.75 : 1).
 */
export function BrandingCardMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`${MOCKUP_CARD_WIDTH} aspect-[1.72/1] ${landingMockupFloatClass} rounded-xl relative overflow-hidden flex flex-col justify-between p-4 sm:p-5 lg:p-6 select-none ${className}`}
    >
      {/* Topo do cartão: Monograma 'AP' + Identidade */}
      <div className="flex items-center justify-between shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f2ca50]/20 to-[#d4af37]/5 border border-[#f2ca50]/40 flex items-center justify-center shadow-inner">
          <span className="font-cinzel text-base font-bold text-[#f2ca50] tracking-wider">
            AP
          </span>
        </div>
        <div className="text-right">
          <p className="font-cinzel text-[9px] sm:text-[10px] tracking-[0.2em] text-[#f2ca50] uppercase font-bold">
            Studio AP
          </p>
          <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-widest font-mono">
            Consultoria & Autoria
          </p>
        </div>
      </div>

      {/* Nome do Profissional / Autor */}
      <div className="my-auto py-1">
        <h4 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] tracking-wide mb-0.5">
          Ana Paula Férreira
        </h4>
        <p className="text-[11px] sm:text-xs text-[#d7c6ff] font-medium tracking-wide">
          Estrategista Criativa & Consultora de Marca
        </p>
      </div>

      {/* Assinatura limpa e legível sem rabiscos */}
      <div className="py-1 border-y border-white/5 my-1 bg-black/20 rounded-md px-2 shrink-0">
        <CleanSignatureSvg name="Ana Paula Férreira" className="w-full h-8 sm:h-10" />
      </div>

      {/* Informações de contato e autoridade */}
      <div className="grid grid-cols-2 gap-2 text-[9px] sm:text-[10px] text-gray-400 pt-1 shrink-0">
        <div className="truncate">
          <p className="text-[7px] uppercase tracking-wider text-gray-500">E-mail Profissional</p>
          <p className="text-[#e5e2e1] font-mono truncate">contato@anapaulaferreira.com</p>
        </div>
        <div className="text-right">
          <p className="text-[7px] uppercase tracking-wider text-gray-500">Presença & Mídia</p>
          <p className="text-[#f2ca50] font-mono">@anapaulaferreira</p>
        </div>
      </div>
    </div>
  );
}
