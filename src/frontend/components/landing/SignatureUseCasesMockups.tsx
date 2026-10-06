import React from 'react';

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
  name = 'Mariã Silva',
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
 * MOCKUP 1: Documento Oficial (CIN - Carteira de Identidade Nacional / CNH)
 * Destaque:
 * - Nome Civil no documento: MARIA DA SILVA SANTOS (registro de nascimento).
 * - Campo da assinatura: MARIÃ SILVA (nome harmonizado adotado como assinatura oficial limpa).
 */
export function DocumentCinMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`relative w-full max-w-[500px] mx-auto rounded-2xl bg-[#141414]/95 p-4 sm:p-6 ring-1 ring-white/10 shadow-2xl shadow-black/80 overflow-hidden ${className}`}
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
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Brasão estilizado em vetor dourado */}
          <div className="w-9 h-9 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#f2ca50]" fill="none" stroke="currentColor">
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
            <p className="font-cinzel text-[10px] sm:text-[11px] font-bold tracking-[0.14em] text-[#f2ca50] uppercase leading-tight">
              República Federativa do Brasil
            </p>
            <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider uppercase font-medium">
              Carteira de Identidade Nacional (CIN / CNH)
            </p>
          </div>
        </div>
        <span className="font-mono text-[9px] text-[#f2ca50]/70 border border-[#f2ca50]/20 px-2 py-0.5 rounded-full bg-[#f2ca50]/5">
          VÁLIDA EM TODO O PAÍS
        </span>
      </div>

      {/* Corpo do Documento: Foto biométrica abstrata + Metadados */}
      <div className="relative z-10 grid grid-cols-12 gap-4 mt-4 items-center">
        {/* Foto biométrica / Silhueta estilizada com auréola */}
        <div className="col-span-4 sm:col-span-3 flex flex-col items-center">
          <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-gradient-to-b from-white/10 to-white/5 border border-[#f2ca50]/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#f2ca50] to-transparent animate-pulse" />
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-400/80" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <div className="mt-1 flex items-center gap-1 text-[8px] font-mono text-[#f2ca50]/80">
              <span>●</span> BIOMETRIA
            </div>
          </div>
          {/* Chip de segurança dourado */}
          <div className="mt-2 w-7 h-5 rounded bg-gradient-to-br from-[#f2ca50]/30 to-[#d4af37]/10 border border-[#f2ca50]/40 flex items-center justify-center">
            <div className="w-4 h-2.5 border border-[#f2ca50]/60 rounded-xs" />
          </div>
        </div>

        {/* Campos Oficiais com Nome de Certidão de Nascimento */}
        <div className="col-span-8 sm:col-span-9 space-y-2">
          <div>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-gray-400">
              Nome Civil (Certidão de Nascimento)
            </p>
            <p className="font-cinzel text-sm sm:text-base font-bold text-[#e5e2e1] tracking-wide">
              MARIA DA SILVA SANTOS
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] sm:text-[10px]">
            <div>
              <p className="text-[8px] uppercase tracking-wider text-gray-500">CPF</p>
              <p className="font-mono text-gray-300">***.842.109-**</p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wider text-gray-500">Nascimento</p>
              <p className="font-mono text-gray-300">26/05/1971</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] sm:text-[10px]">
            <div>
              <p className="text-[8px] uppercase tracking-wider text-gray-500">Nacionalidade</p>
              <p className="text-gray-300">Brasileira</p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wider text-gray-500">Órgão Emissor</p>
              <p className="text-gray-300">SSP / Registro Geral</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campo da Assinatura: onde vai o NOME HARMONIZADO LIMPO (Mariã Silva) */}
      <div className="relative z-10 mt-4 pt-3 border-t border-dashed border-[#f2ca50]/30">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] font-medium text-[#f2ca50] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50] animate-ping" />
            Assinatura do Titular / Holder's Signature
          </p>
        </div>

        {/* Quadro com a assinatura límpida e legível Mariã Silva */}
        <div className="relative rounded-xl bg-black/40 border border-[#f2ca50]/40 p-2 sm:p-3 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f2ca50]/5 to-transparent pointer-events-none" />
          <CleanSignatureSvg name="Mariã Silva" className="w-full h-12 sm:h-14" />
        </div>
      </div>
    </div>
  );
}

/**
 * MOCKUP 2: Perfil de Rede Social / Presença Digital (Instagram / LinkedIn / Creator)
 * Estilo: Moldura mobile minimalista escura com auréola dourada, @handle, estatísticas e selo.
 */
export function SocialProfileMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`relative w-full max-w-[480px] mx-auto rounded-2xl bg-[#141414]/95 p-4 sm:p-6 ring-1 ring-white/10 shadow-2xl shadow-black/80 overflow-hidden ${className}`}
    >
      {/* Brilho de fundo místico roxo e dourado */}
      <div
        className="absolute -top-12 -left-12 w-48 h-48 bg-[#d7c6ff]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#f2ca50]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Barra superior de aplicativo (simulação de topo) */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">←</span>
          <span className="font-mono text-xs font-semibold text-[#e5e2e1] tracking-wide">
            joaosilva.oficial
          </span>
          <span className="w-4 h-4 rounded-full bg-[#f2ca50] text-[#131313] flex items-center justify-center text-[10px] font-bold" title="Selo de Verificação Magnética">
            ✓
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs">
          <span>🔔</span>
          <span>•••</span>
        </div>
      </div>

      {/* Header do Perfil: Avatar com anel dourado + Métricas */}
      <div className="relative z-10 flex items-center gap-4 sm:gap-6 mt-4">
        {/* Avatar com anel de fogo/aura dourada */}
        <div className="relative shrink-0">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#f2ca50] via-[#d7c6ff] to-[#f2ca50] shadow-lg shadow-[#f2ca50]/20">
            <div className="w-full h-full rounded-full bg-[#161616] flex items-center justify-center overflow-hidden border border-black">
              <span className="font-cinzel text-xl sm:text-2xl font-bold text-[#f2ca50]">
                JS
              </span>
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#f2ca50] text-[#131313] border-2 border-[#131313] flex items-center justify-center text-[9px] font-bold">
            ✦
          </span>
        </div>

        {/* Métricas do Perfil */}
        <div className="flex-1 grid grid-cols-3 text-center gap-1">
          <div>
            <p className="font-mono text-sm sm:text-base font-bold text-[#e5e2e1]">142</p>
            <p className="text-[10px] text-gray-400">publicações</p>
          </div>
          <div>
            <p className="font-mono text-sm sm:text-base font-bold text-[#f2ca50]">48.6K</p>
            <p className="text-[10px] text-gray-400">seguidores</p>
          </div>
          <div>
            <p className="font-mono text-sm sm:text-base font-bold text-[#e5e2e1]">1.2K</p>
            <p className="text-[10px] text-gray-400">conexões</p>
          </div>
        </div>
      </div>

      {/* Nome e Biografia Profissional / Artística */}
      <div className="relative z-10 mt-4 space-y-1.5">
        <h4 className="font-cinzel text-base sm:text-lg font-bold text-[#e5e2e1] leading-tight">
          João Silva
        </h4>
        <p className="text-xs text-[#d7c6ff]/90 font-medium">
          Diretor Criativo & Palestrante Internacional
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Projetos autorais, palestras e consultoria de alto impacto.
        </p>
        <p className="text-xs font-mono text-[#f2ca50]/90 flex items-center gap-1 pt-0.5">
          <span>🔗</span> joaosilva.com.br
        </p>
      </div>

      {/* Botões de Ação do Perfil */}
      <div className="relative z-10 grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="rounded-full bg-[#f2ca50] text-[#131313] py-2 text-xs font-bold tracking-wide shadow-md shadow-[#f2ca50]/20 flex items-center justify-center gap-1.5"
        >
          <span>Seguir</span>
          <span className="text-[10px]">✦</span>
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="rounded-full bg-white/5 border border-white/10 hover:border-[#f2ca50]/40 text-[#e5e2e1] py-2 text-xs font-medium tracking-wide flex items-center justify-center"
        >
          Mensagem
        </button>
      </div>

      {/* Destaques em Círculos (Stories Highlights) */}
      <div className="relative z-10 flex items-center gap-3.5 mt-4 pt-3 border-t border-white/5 overflow-x-auto pb-1">
        {[
          { label: 'Obras', icon: '📖' },
          { label: 'Palestras', icon: '🎙️' },
          { label: 'Bastidores', icon: '✨' },
          { label: 'Imprensa', icon: '📰' },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-12 h-12 rounded-full p-[1.5px] bg-[#f2ca50]/30 border border-[#f2ca50]/40 flex items-center justify-center bg-[#181818]">
              <span className="text-sm">{item.icon}</span>
            </div>
            <span className="text-[10px] text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MOCKUP 3: Contratos & Negócios (Instrumento Particular de Contrato / Acordo Comercial)
 * Destaque: Campo de assinatura com MARIÃ SILVA escrito de forma limpa, ascendente e legível.
 */
export function ContractMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`relative w-full max-w-[480px] mx-auto rounded-2xl bg-[#141414]/95 p-5 sm:p-6 ring-1 ring-white/10 shadow-2xl shadow-black/80 overflow-hidden ${className}`}
    >
      {/* Brilho dourado central sutil */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#f2ca50]/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Cabeçalho do Contrato com Selo de Autenticidade */}
      <div className="relative z-10 flex items-start justify-between pb-4 border-b border-white/10">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 border border-[#f2ca50]/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            INSTRUMENTO DE CONTRATO
          </span>
          <h4 className="font-cinzel text-sm sm:text-base font-bold text-[#e5e2e1] leading-tight">
            Contrato de Prestação & Sociedade
          </h4>
          <p className="text-[10px] text-gray-400">Identificador Digital: #DOC-2026-NM-88</p>
        </div>

        {/* Selo / Carimbo de Autenticidade Dourado */}
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#f2ca50]/70 p-1 flex flex-col items-center justify-center text-center bg-[#f2ca50]/10 shadow-lg shadow-[#f2ca50]/10 shrink-0">
          <span className="text-[#f2ca50] text-[8px] font-bold uppercase tracking-tighter leading-none">
            FIRMA
          </span>
          <span className="text-[#f2ca50] text-xs leading-none">✦</span>
          <span className="text-[#f2ca50] text-[7px] font-bold uppercase tracking-tighter leading-none">
            VÁLIDA
          </span>
        </div>
      </div>

      {/* Cláusulas simuladas com linhas e trecho legal legível */}
      <div className="relative z-10 my-4 space-y-3">
        <div className="text-[11px] text-gray-300 leading-relaxed font-sans bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="font-medium text-[#f2ca50]/90 text-[10px] uppercase tracking-wider mb-1">
            Cláusula 1ª — Da Titularidade e Representação
          </p>
          <p className="text-gray-400 text-[10px] sm:text-[11px]">
            As partes elegem por comum acordo a representação cívica e comercial, reconhecendo a plena validade da assinatura física e eletrônica firmada sob a nova assinatura harmonizada.
          </p>
        </div>

        {/* Linhas de parágrafo estilizadas */}
        <div className="space-y-1.5 px-1 opacity-70">
          <div className="h-1.5 bg-white/10 rounded-full w-full" />
          <div className="h-1.5 bg-white/10 rounded-full w-11/12" />
          <div className="h-1.5 bg-white/10 rounded-full w-4/5" />
        </div>
      </div>

      {/* Fechamento formal do contrato e assinatura límpida MARIÃ SILVA */}
      <div className="relative z-10 mt-5 pt-3 border-t border-dashed border-[#f2ca50]/30">
        <div className="flex items-center justify-between text-[9px] text-gray-400 mb-2">
          <span>São Paulo, SP — Em testemunho da verdade</span>
          <span className="font-mono text-[#f2ca50]/80">Gov.br / DocuSign ✓</span>
        </div>

        {/* Bloco de assinatura da parte */}
        <div className="rounded-xl bg-black/40 border border-[#f2ca50]/40 p-2 sm:p-3 relative overflow-hidden">
          <CleanSignatureSvg name="Mariã Silva" className="w-full h-12 sm:h-14" />
          <div className="mt-1 pt-1.5 border-t border-[#f2ca50]/20 flex items-center justify-between text-[9px] sm:text-[10px]">
            <div>
              <p className="font-cinzel font-bold text-[#e5e2e1] leading-none">MARIA DA SILVA SANTOS</p>
              <p className="text-gray-400 text-[8px] uppercase tracking-widest leading-none mt-0.5">
                Contratante / Titular
              </p>
            </div>
            <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Assinado Digitalmente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MOCKUP 4: Marca Pessoal & Cartão de Visita / Autoria
 * Destaque: Cartão executivo escuro limpo com monograma, tipografia e assinatura límpida de João Silva.
 */
export function BrandingCardMockup({ className = '' }: MockupProps) {
  return (
    <div
      className={`relative w-full max-w-[440px] mx-auto rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#121212] border border-[#f2ca50]/40 p-6 sm:p-7 shadow-2xl shadow-black/80 overflow-hidden ${className}`}
    >
      {/* Topo do cartão: Monograma 'JS' + Identidade */}
      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f2ca50]/20 to-[#d4af37]/5 border border-[#f2ca50]/40 flex items-center justify-center shadow-inner">
          <span className="font-cinzel text-lg font-bold text-[#f2ca50] tracking-wider">
            JS
          </span>
        </div>
        <div className="text-right">
          <p className="font-cinzel text-[10px] tracking-[0.2em] text-[#f2ca50] uppercase font-bold">
            Studio JS
          </p>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-mono">
            Consultoria & Autoria
          </p>
        </div>
      </div>

      {/* Nome do Profissional / Autor */}
      <div className="mb-4">
        <h4 className="font-cinzel text-xl sm:text-2xl font-bold text-[#e5e2e1] tracking-wide mb-1">
          João Silva
        </h4>
        <p className="text-xs text-[#d7c6ff] font-medium tracking-wide">
          Estrategista Criativo & Palestrante Internacional
        </p>
      </div>

      {/* Assinatura limpa e legível sem rabiscos */}
      <div className="py-2 border-y border-white/5 my-3 bg-black/20 rounded-lg px-2">
        <CleanSignatureSvg name="João Silva" className="w-full h-11 sm:h-13" />
      </div>

      {/* Informações de contato e autoridade */}
      <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] text-gray-400 pt-2">
        <div>
          <p className="text-[8px] uppercase tracking-wider text-gray-500">E-mail Profissional</p>
          <p className="text-[#e5e2e1] font-mono">contato@joaosilva.com</p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-wider text-gray-500">Presença & Mídia</p>
          <p className="text-[#f2ca50] font-mono">@joaosilva.oficial</p>
        </div>
      </div>
    </div>
  );
}
