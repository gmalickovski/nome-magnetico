import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  LandingSectionIntro,
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
  tag: string;
  title: string;
  exampleName: string;
  description: string;
  bulletPoints: string[];
  MockupComponent: React.ComponentType<{ className?: string }>;
}

const USE_CASES: UseCaseItem[] = [
  {
    id: 'documentos-oficiais',
    stepNumber: '01',
    tag: 'A Identidade Oficial',
    title: 'Documentos Pessoais: CNH, RG e CIN',
    exampleName: 'Mariã Silva',
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
    tag: 'A Presença Digital',
    title: 'Nome Artístico & Redes Sociais',
    exampleName: 'João Silva',
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
    tag: 'Os Negócios',
    title: 'Contratos, Sociedades & Bancos',
    exampleName: 'Mariã Silva',
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
    tag: 'A Marca Pessoal',
    title: 'Marca Pessoal, E-mails & Cartões',
    exampleName: 'João Silva',
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
  index,
  total,
  reduceMotion,
}: {
  item: UseCaseItem;
  index: number;
  total: number;
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
      className={`rounded-2xl bg-[#161616]/95 border border-[#D4AF37]/35 p-5 sm:p-6 shadow-2xl shadow-black/80 transition-all duration-700 ease-out flex flex-col gap-5 ${
        reduceMotion || revealed
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full border border-[#f2ca50]/20">
            USO {item.stepNumber} DE {total.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] font-mono text-gray-400">
            Exemplo: <strong className="text-[#f2ca50]">{item.exampleName}</strong>
          </span>
        </div>

        <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-2">
          {item.tag}
        </p>

        <h3 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] mb-2 leading-tight">
          {item.title}
        </h3>

        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-4">
          {item.description}
        </p>

        <ul className="space-y-2 mb-2 text-xs text-gray-400">
          {item.bulletPoints.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#f2ca50] text-sm shrink-0 leading-none">✦</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mockup do Item no Mobile dentro do frame padrão */}
      <div className="rounded-2xl border border-[#D4AF37]/60 p-1 overflow-hidden">
        <div className="rounded-xl bg-[#131313] p-2 sm:p-3 overflow-hidden">
          <Mockup />
        </div>
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

    // Distribuição progressiva do scroll entre os 4 passos
    if (progress < 0.25) return 0;
    if (progress < 0.5) return 1;
    if (progress < 0.75) return 2;
    return 3;
  }, [progress, reduceMotion, manualIndex]);

  // Se o usuário clicar manualmente em um marcador, libera o controle manual após alguns segundos
  const handleSelectTab = (idx: number) => {
    setManualIndex(idx);
    window.setTimeout(() => {
      setManualIndex(null);
    }, 4500);
  };

  return (
    <section
      id="onde-usar"
      ref={ref}
      className={`relative bg-[#111111] scroll-mt-28 ${
        reduceMotion ? 'py-20 md:py-20' : 'lg:h-[320vh] py-20 md:py-20'
      }`}
      aria-label="Onde e como usar sua assinatura harmonizada"
    >
      {/* Brilho cósmico sutil no mesmo padrão de ProductsSection */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 md:right-[10%] w-[min(100%,280px)] h-[280px] md:w-[420px] md:h-[420px] bg-[#D4AF37]/5 rounded-full blur-[80px] md:blur-[120px]" />
      </div>

      {/* ── EXPERIÊNCIA DESKTOP PINNED (lg: 1024px+) ────────────────────── */}
      <div className="hidden lg:block w-full">
        <div className={`relative ${landingSectionShellClass}`}>
          {/*
            Padrão rigoroso idêntico a ProductsSection:
            - Grid de 2 colunas com landingSectionStackGapClass
            - Lado Esquerdo: aside com lg:sticky lg:top-28 contendo todo o texto e marcadores
            - Lado Direito: frame dourado border border-[#D4AF37] p-1 contendo apenas os mockups
          */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 ${landingSectionStackGapClass} items-start`}>
            {/* ── LADO ESQUERDO: Título, Descrição, Marcadores e Conteúdo Dinâmico ── */}
            <aside className="min-w-0 order-1 lg:sticky lg:top-28 lg:self-start">
              <div className="[&_h2]:!text-3xl [&_h2]:md:!text-4xl [&_h2]:lg:!text-5xl [&_h2]:!leading-tight">
                <LandingSectionIntro
                  align="left"
                  label="Onde e como usar"
                  title="Sua assinatura no mundo real."
                />

                <p className="text-[#e5e2e1] text-sm md:text-base leading-relaxed mt-4 mb-6 max-w-prose mx-auto lg:mx-0">
                  Da documentação oficial aos negócios e presença digital — entenda como aplicar seu Nome Social no dia a dia.
                </p>

                {/* Área de conteúdo dos casos com marcadores verticais no lado esquerdo */}
                <div className="flex items-start gap-4 sm:gap-6 mt-8">
                  {/* Marcadores verticais no estilo da Seção 2 no sentido da rolagem */}
                  <div
                    className="flex flex-col items-center gap-2.5 pt-2 shrink-0"
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
                          title={`Caso ${item.stepNumber}: ${item.title}`}
                          className={`cursor-pointer transition-all duration-500 rounded-full ${
                            isActive
                              ? 'w-1.5 h-10 bg-[#f2ca50] shadow-[0_0_8px_rgba(242,202,80,0.6)]'
                              : 'w-1.5 h-2.5 bg-white/20 hover:bg-white/40'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Textos dinâmicos dos casos com transição que acompanha a direção do scroll:
                      - Ao descer a página: o item anterior sobe (-translate-y-12) e o novo vem de baixo (+translate-y-12 -> 0).
                      - Ao subir a página: o item atual desce (+translate-y-12) e o anterior vem de cima (-translate-y-12 -> 0).
                  */}
                  <div className="flex-1 min-w-0 relative overflow-hidden min-h-[310px]">
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
                          className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${transformClass}`}
                          aria-hidden={!isActive}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-0.5 rounded-full border border-[#f2ca50]/20">
                              USO {item.stepNumber}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              Exemplo: <strong className="text-[#f2ca50] font-sans">{item.exampleName}</strong>
                            </span>
                          </div>

                          <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-2">
                            {item.tag}
                          </p>

                          <h3 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] mb-2 leading-tight">
                            {item.title}
                          </h3>

                          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-4 max-w-prose">
                            {item.description}
                          </p>

                          {/* Bullets de destaque */}
                          <div className="space-y-2">
                            {item.bulletPoints.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-2 text-xs text-gray-300">
                                <span className="text-[#f2ca50] text-xs shrink-0 mt-0.5">✦</span>
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            {/* ── LADO DIREITO: SOMENTE O MOCKUP NO MESMO FRAME PADRÃO ────── */}
            <div className="min-w-0 order-2 rounded-2xl border border-[#D4AF37] p-1 overflow-hidden">
              <div className="rounded-2xl bg-[#131313] px-3 py-5 sm:px-5 sm:py-7 min-w-0 relative overflow-hidden flex items-center justify-center min-h-[460px]">
                {USE_CASES.map((item, idx) => {
                  const Mockup = item.MockupComponent;
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={item.id}
                      className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] w-full ${
                        isActive
                          ? 'opacity-100 scale-100 relative z-10'
                          : 'opacity-0 scale-95 pointer-events-none absolute inset-0 z-0'
                      }`}
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
      </div>

      {/* ── EXPERIÊNCIA MOBILE / TABLET (< 1024px) ──────────────────────── */}
      <div className="lg:hidden">
        <div className={landingSectionShellClass}>
          <LandingSectionIntro
            label="Onde e como usar"
            title="Sua assinatura no mundo real."
            description="Entenda como aplicar sua nova assinatura nos documentos oficiais, redes sociais, contratos e dia a dia profissional."
            className="mb-8 text-center"
          />

          <div className="flex flex-col gap-6" role="list">
            {USE_CASES.map((item, index) => (
              <MobileUseCaseCard
                key={item.id}
                item={item}
                index={index}
                total={USE_CASES.length}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
