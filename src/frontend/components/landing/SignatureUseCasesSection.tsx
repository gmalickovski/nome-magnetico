import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  landingSectionShellClass,
  landingSectionStackGapClass,
} from './LandingSectionIntro';
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

/** Card para a visualização mobile com entrada suave via scroll */
function MobileUseCaseCard({
  item,
  reduceMotion,
}: {
  item: UseCaseItem;
  reduceMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;

    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const Mockup = item.MockupComponent;

  return (
    <article
      ref={cardRef}
      className={`rounded-2xl bg-[#161616]/95 border border-[#D4AF37]/25 p-6 sm:p-7 shadow-2xl shadow-black/80 transition-all duration-700 ease-out flex flex-col gap-6 ${
        reduceMotion || revealed
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      <div>
        <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#e5e2e1] mb-3 leading-tight">
          {item.title}
        </h3>

        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4">
          {item.description}
        </p>

        <ul className="space-y-2 mb-2 text-xs sm:text-sm text-gray-400">
          {item.bulletPoints.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#f2ca50] text-sm shrink-0 leading-none">✦</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mockup flutuando livremente no mobile sem container com borda dourada externa */}
      <div className="pt-2 flex justify-center w-full">
        <Mockup />
      </div>
    </article>
  );
}

export function SignatureUseCasesSection() {
  const { ref, progress, reduceMotion } = useScrollProgress<HTMLElement>();
  const [manualIndex, setManualIndex] = useState<number | null>(null);

  // Mapeia o progresso do scroll no desktop para a etapa ativa (0 a 3)
  const activeIndex = useMemo(() => {
    if (manualIndex !== null) return manualIndex;
    if (reduceMotion) return 0;

    if (progress < 0.25) return 0;
    if (progress < 0.5) return 1;
    if (progress < 0.75) return 2;
    return 3;
  }, [progress, reduceMotion, manualIndex]);

  // Se o usuário clicar manualmente em um marcador, sincroniza o scroll suave para a etapa correspondente
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

  return (
    <section
      id="onde-usar"
      ref={ref}
      className={`relative bg-[#111111] scroll-mt-28 ${
        reduceMotion ? 'py-20 md:py-28' : 'lg:h-[380vh] py-20 lg:py-0'
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
          reduceMotion ? 'py-24' : 'sticky top-0 h-screen'
        } overflow-x-clip`}
      >
        <div className={`relative ${landingSectionShellClass} w-full flex items-center justify-center`}>
          {/*
            Divisão estrita em 2 colunas perfeitamente alinhadas e centralizadas na horizontal:
            - Lado Esquerdo: Marcadores verticais no lado esquerdo + Título Grande + Texto objetivo
            - Lado Direito: Itens/mockups FLUTUANDO LIVREMENTE sem container de borda dourada
          */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 ${landingSectionStackGapClass} items-center justify-items-center w-full max-w-6xl mx-auto`}>
            {/* ── LADO ESQUERDO: Marcadores Verticais + Título Grande + Explicações Objetivas ── */}
            <aside className="w-full max-w-xl mx-auto min-w-0 order-1 flex items-center">
              <div className="flex items-center gap-6 sm:gap-8 w-full">
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

                {/* Bloco de Texto Ativo:
                    Rolando para baixo (scroll down): sai para cima (-translate-y-12) e próximo entra de baixo (+translate-y-12 -> 0).
                    Rolando para cima (scroll up): sai para baixo (+translate-y-12) e anterior entra de cima (-translate-y-12 -> 0).
                */}
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
                        className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform w-full ${transformClass}`}
                        aria-hidden={!isActive}
                      >
                        {/* Título Grande mantido como solicitado */}
                        <h3 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e5e2e1] mb-4 leading-tight text-balance">
                          {item.title}
                        </h3>

                        {/* Explicação clara e objetiva */}
                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 max-w-prose">
                          {item.description}
                        </p>

                        {/* Bullets de destaque objetivos */}
                        <div className="space-y-3">
                          {item.bulletPoints.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300">
                              <span className="text-[#f2ca50] text-sm shrink-0 leading-none">✦</span>
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

            {/* ── LADO DIREITO: ITENS FLUTUANDO LIVREMENTE (SEM CONTAINER DE BORDA DOURADA) ────── */}
            <div className="w-full max-w-xl mx-auto min-w-0 order-2 flex items-center justify-center relative min-h-[460px]">
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
                    className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] w-full flex justify-center items-center ${mockupTransform}`}
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

      {/* ── EXPERIÊNCIA MOBILE / TABLET (< 1024px) ──────────────────────── */}
      <div className="lg:hidden">
        <div className={landingSectionShellClass}>
          <div className="flex flex-col gap-6" role="list">
            {USE_CASES.map((item) => (
              <MobileUseCaseCard
                key={item.id}
                item={item}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
