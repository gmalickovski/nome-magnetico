import React, { useMemo, useRef, useState } from 'react';
import {
  landingSectionShellClass,
  landingSectionSpacingClass,
  landingSplitGridClass,
} from './LandingSectionIntro';
import { getRevealItemProps, useLandingSectionReveal } from './useLandingSectionReveal';
import { useScrollProgress } from './useScrollProgress';
import {
  DocumentCinMockup,
  SocialProfileMockup,
  ContractMockup,
  BrandingCardMockup,
} from './SignatureUseCasesMockups';

interface UseCaseItem {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  bulletPoints: string[];
  MockupComponent: React.ComponentType<{ className?: string }>;
}

const USE_CASES: UseCaseItem[] = [
  {
    id: 'documentos-oficiais',
    stepNumber: '01',
    title: 'Documentos Pessoais: CNH, RG e CIN',
    description:
      'A legislação brasileira assegura sua liberdade para assinar como desejar em documentos oficiais, desde que mantida a consistência grafotécnica. No documento, o nome de certidão de nascimento permanece no registro civil, enquanto o seu Nome Harmonizado — Mariã Silva — é adotado como a assinatura oficial límpida, ancorando essa frequência em todas as esferas cívicas da sua vida.',
    bulletPoints: [
      'O nome civil de certidão permanece inalterado no documento',
      'O nome harmonizado (Mariã Silva) é firmado no campo oficial de assinatura',
      'Assinatura límpida, legível e ascendente, sem traços que cruzem letras',
    ],
    MockupComponent: DocumentCinMockup,
  },
  {
    id: 'redes-sociais',
    stepNumber: '02',
    title: 'Nome Artístico & Redes Sociais',
    description:
      'No Instagram, LinkedIn, YouTube e no seu ecossistema digital, seu nome é a primeira frequência que o mundo recebe. Adotar a variação harmonizada no @handle, no nome de exibição e na biografia elimina bloqueios de visibilidade e atrai conexões e oportunidades alinhadas ao seu propósito de Destino.',
    bulletPoints: [
      'Perfis no Instagram, LinkedIn, YouTube e TikTok',
      'Nome artístico e assinatura de conteúdo digital',
      'Fortalecimento do magnetismo e da percepção de valor',
    ],
    MockupComponent: SocialProfileMockup,
  },
  {
    id: 'contratos-negocios',
    stepNumber: '03',
    title: 'Contratos, Sociedades & Bancos',
    description:
      'Em contratos de prestação de serviços, abertura de empresas, fechamento de propostas e transações bancárias — físicas ou via Gov.br e DocuSign. A assinatura límpida com seu nome harmonizado — Mariã Silva —, escrita de forma limpa e ascendente sem letras que cruzem por cima, equilibra a energia de realização material e destravamento comercial.',
    bulletPoints: [
      'Contratos de prestação de serviços e parcerias comerciais',
      'Assinatura digital avançada (Gov.br, DocuSign, Clicksign)',
      'Abertura de contas bancárias e documentos societários',
    ],
    MockupComponent: ContractMockup,
  },
  {
    id: 'marca-pessoal',
    stepNumber: '04',
    title: 'Marca Pessoal, E-mails & Cartões',
    description:
      'Em assinaturas de e-mail profissional, cartões de visita, crachás, capas de livros, certificados e obras autorais. Cada repetição consciente da sua assinatura harmonizada condiciona sua mente e seu campo vibracional ao novo padrão de clareza, abundância e realização.',
    bulletPoints: [
      'Rodapé e assinatura de e-mails profissionais',
      'Cartões de visita, timbrados e papelaria executiva',
      'Obras autorais, capas de livros e cursos',
    ],
    MockupComponent: BrandingCardMockup,
  },
];

export function SignatureUseCasesSection() {
  const { ref, progress, reduceMotion } = useScrollProgress<HTMLElement>();
  const sectionReveal = useLandingSectionReveal();
  const [manualIndex, setManualIndex] = useState<number | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Mapeia o progresso do scroll para a etapa ativa (0 a 3)
  const activeIndex = useMemo(() => {
    if (manualIndex !== null) return manualIndex;
    if (reduceMotion) return 0;

    if (progress < 0.25) return 0;
    if (progress < 0.5) return 1;
    if (progress < 0.75) return 2;
    return 3;
  }, [progress, reduceMotion, manualIndex]);

  // Se o usuário clicar manualmente em um marcador ou der swipe, sincroniza o scroll suave para a etapa correspondente
  const handleSelectTab = (idx: number) => {
    setManualIndex(idx);
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const currentScrollY = window.scrollY;
      const sectionTop = currentScrollY + rect.top;
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable > 0) {
        const targetProgress = (idx + 0.5) / USE_CASES.length;
        const targetScrollY = sectionTop + targetProgress * totalScrollable;
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    }
    window.setTimeout(() => {
      setManualIndex(null);
    }, 1500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Se o swipe for horizontal com amplitude maior que 40px
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0 && activeIndex < USE_CASES.length - 1) {
        handleSelectTab(activeIndex + 1);
      } else if (deltaX > 0 && activeIndex > 0) {
        handleSelectTab(activeIndex - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const copyReveal = getRevealItemProps(sectionReveal.revealed, 0, sectionReveal.reduceMotion);
  const mockupReveal = getRevealItemProps(sectionReveal.revealed, 140, sectionReveal.reduceMotion);

  return (
    <section
      id="onde-usar"
      ref={ref}
      className={`relative bg-[#111111] scroll-mt-20 ${
        reduceMotion ? landingSectionSpacingClass : 'lg:h-[320vh] py-0'
      }`}
      aria-label="Onde e como usar sua assinatura harmonizada"
    >
      {/* Brilho cósmico sutil no fundo */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-[5%] w-[320px] h-[320px] lg:w-[480px] lg:h-[480px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-[5%] w-[300px] h-[300px] lg:w-[440px] lg:h-[440px] bg-[#d7c6ff]/5 rounded-full blur-[100px]" />
      </div>

      {/* ── EXPERIÊNCIA DESKTOP PINNED (lg: 1024px+) ────────────────────── */}
      <div
        className={`hidden lg:flex flex-col justify-center items-center w-full ${
          reduceMotion ? 'py-20 lg:py-28' : 'sticky top-0 h-screen'
        } overflow-x-clip`}
      >
        <div className={`relative ${landingSectionShellClass} flex items-center justify-center`}>
            {/*
              M3 12-Column Split Grid (5 cols Left / 7 cols Right) — 100% flush with ProductsSection and Header!
              - Lado Esquerdo (lg:col-span-5): Marcadores verticais na guia esquerda + Título + Texto + Bullets
              - Lado Direito (lg:col-span-7): Mockups flutuantes ocupando a coluna até a guia direita
            */}
            <div className={landingSplitGridClass}>
              {/* ── LADO ESQUERDO (5 Colunas): Marcadores Verticais + Título + Explicações ── */}
              <aside
                className={`lg:col-span-5 w-full min-w-0 order-1 flex items-center ${copyReveal.className}`}
                style={copyReveal.style}
              >
                <div className="flex items-center gap-6 xl:gap-8 w-full">
                  {/* Marcadores verticais no lado esquerdo no sentido da rolagem */}
                  <div
                    className="flex flex-col items-center justify-center gap-3 shrink-0"
                    role="tablist"
                    aria-label="Etapas dos casos de uso"
                  >
                    {USE_CASES.map((item, idx) => {
                      const isActive = idx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => handleSelectTab(idx)}
                          title={item.title}
                          className={`cursor-pointer transition-all duration-500 rounded-full ${
                            isActive
                              ? 'w-1.5 h-12 bg-[#f2ca50] shadow-[0_0_10px_rgba(242,202,80,0.7)]'
                              : 'w-1.5 h-3 bg-white/20 hover:bg-white/40'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Bloco de Texto Ativo */}
                  <div className="flex-1 min-w-0 relative overflow-hidden min-h-[380px] flex items-center">
                    {USE_CASES.map((item, idx) => {
                      const isActive = idx === activeIndex;
                      const isPast = idx < activeIndex;

                      const transformClass = isActive
                        ? 'opacity-100 translate-y-0 pointer-events-auto relative z-10'
                        : isPast
                        ? 'opacity-0 -translate-y-12 pointer-events-none absolute inset-x-0 top-0 z-0'
                        : 'opacity-0 translate-y-12 pointer-events-none absolute inset-x-0 top-0 z-0';

                      return (
                        <div
                          key={item.id}
                          className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform w-full ${transformClass}`}
                          aria-hidden={!isActive}
                        >
                          <p className="text-[#f2ca50] text-xs md:text-sm font-bold uppercase tracking-[0.15em] mb-3">
                            Onde Usar · Etapa {item.stepNumber}
                          </p>

                          <h3 className="font-cinzel text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-bold text-[#e5e2e1] mb-4 leading-[1.16] text-balance">
                            {item.title}
                          </h3>

                          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 max-w-[58ch] text-pretty">
                            {item.description}
                          </p>

                          <div className="space-y-3">
                            {item.bulletPoints.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300 text-pretty">
                                <span className="text-[#f2ca50] text-sm shrink-0 leading-none mt-0.5">✦</span>
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* ── LADO DIREITO (7 Colunas): Mockups Flutuantes Alinhados com a Grade ────── */}
              <div
                className={`lg:col-span-7 w-full min-w-0 order-2 flex items-center justify-center relative min-h-[440px] ${mockupReveal.className}`}
                style={mockupReveal.style}
              >
                {USE_CASES.map((item, idx) => {
                  const Mockup = item.MockupComponent;
                  const isActive = idx === activeIndex;
                  const isPast = idx < activeIndex;

                  const mockupTransform = isActive
                    ? 'opacity-100 scale-100 pointer-events-auto relative z-10'
                    : isPast
                    ? 'opacity-0 scale-95 -translate-y-6 pointer-events-none absolute inset-0 z-0'
                    : 'opacity-0 scale-95 translate-y-6 pointer-events-none absolute inset-0 z-0';

                  return (
                    <div
                      key={item.id}
                      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] w-full flex justify-center lg:justify-end items-center ${mockupTransform}`}
                      aria-hidden={!isActive}
                    >
                      <Mockup />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── EXPERIÊNCIA MOBILE / TABLET (< 1024px) PINNED ────────────────── */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`lg:hidden flex flex-col justify-between w-full ${
            reduceMotion ? 'py-16 min-h-screen' : 'sticky top-0 h-[100dvh]'
          } pt-16 pb-6 px-4 sm:px-6 overflow-hidden select-none`}
        >
          {/* TEXTO EM CIMA — depois card + seletor (mobile / tablet). */}
          <div className="shrink-0 relative w-full max-w-lg mx-auto min-h-[185px] xs:min-h-[200px] overflow-hidden flex items-center">
            {USE_CASES.map((item, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              const textTransform = isActive
                ? 'opacity-100 translate-x-0 pointer-events-auto relative z-10'
                : isPast
                ? 'opacity-0 -translate-x-12 pointer-events-none absolute inset-x-0 top-0 z-0'
                : 'opacity-0 translate-x-12 pointer-events-none absolute inset-x-0 top-0 z-0';

              return (
                <div
                  key={item.id}
                  className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform w-full text-center ${textTransform}`}
                  aria-hidden={!isActive}
                >
                  <p className="text-[#f2ca50] text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5">
                    Onde Usar · Etapa {item.stepNumber}
                  </p>
                  <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#e5e2e1] mb-2 leading-tight text-balance">
                    {item.title}
                  </h3>

                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2.5 max-w-md mx-auto line-clamp-3 xs:line-clamp-none text-pretty">
                    {item.description}
                  </p>

                  <div className="space-y-1 max-w-sm mx-auto text-left">
                    {item.bulletPoints.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-[11px] sm:text-xs text-gray-300">
                        <span className="text-[#f2ca50] text-xs shrink-0 leading-none mt-0.5">✦</span>
                        <span className="line-clamp-1 xs:line-clamp-none">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CARD (mockup) */}
          <div className="flex-1 min-h-0 flex items-center justify-center relative w-full max-w-lg mx-auto overflow-visible py-2">
            {USE_CASES.map((item, idx) => {
              const Mockup = item.MockupComponent;
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              const mockupTransform = isActive
                ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto relative z-10'
                : isPast
                ? 'opacity-0 -translate-x-12 scale-95 pointer-events-none absolute inset-0 z-0'
                : 'opacity-0 translate-x-12 scale-95 pointer-events-none absolute inset-0 z-0';

              return (
                <div
                  key={item.id}
                  className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] w-full flex justify-center items-center ${mockupTransform}`}
                  aria-hidden={!isActive}
                >
                  <div className="w-full scale-[0.92] xs:scale-[0.96] sm:scale-100 origin-center">
                    <Mockup />
                  </div>
                </div>
              );
            })}
          </div>

          {/* SELETOR abaixo do card */}
          <div
            className="flex items-center justify-center gap-2 py-2 shrink-0"
            role="tablist"
            aria-label="Etapas dos casos de uso"
          >
            {USE_CASES.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectTab(idx)}
                  title={item.title}
                  className={`cursor-pointer transition-all duration-500 rounded-full ${
                    isActive
                      ? 'w-7 h-1.5 bg-[#f2ca50] shadow-[0_0_8px_rgba(242,202,80,0.7)]'
                      : 'w-2 h-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              );
            })}
          </div>
        </div>
    </section>
  );
}
