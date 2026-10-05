import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  LandingSectionIntro,
  landingSectionShellClass,
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
    tag: 'Validade Cívica & Identidade Oficial',
    title: 'Documentos Pessoais: CNH, RG e CIN',
    exampleName: 'Maria Silva',
    description:
      'A legislação brasileira assegura sua liberdade para assinar como desejar em documentos oficiais, desde que mantida a consistência grafotécnica. Ao emitir ou renovar a Carteira de Identidade Nacional (CIN), CNH ou passaporte com seu Nome Harmonizado, você ancora essa nova vibração em todas as esferas cívicas da sua vida.',
    bulletPoints: [
      'Válida na emissão da Carteira de Identidade Nacional (CIN)',
      'Aceita em CNH, passaportes e cartórios de registro',
      'Proteção jurídica através da consistência grafotécnica',
    ],
    MockupComponent: DocumentCinMockup,
  },
  {
    id: 'redes-sociais',
    stepNumber: '02',
    tag: 'Projeção Magnética & Autoridade',
    title: 'Presença Digital & Redes Sociais',
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
    tag: 'Prosperidade Comercial & Acordos',
    title: 'Contratos, Sociedades & Bancos',
    exampleName: 'Maria Silva',
    description:
      'Em contratos de prestação de serviços, abertura de empresas, fechamento de propostas e transações bancárias — físicas ou via Gov.br e DocuSign. A vibração equilibrada da assinatura harmonizada protege a energia de troca e realização material, prevenindo atritos contratuais e destravando a prosperidade nos negócios.',
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
    tag: 'Alinhamento Diário & Criação',
    title: 'Marca Pessoal, E-mails & Cartões',
    exampleName: 'João Silva',
    description:
      'Em assinaturas de e-mail profissional, cartões de visita, crachás, capas de livros, certificados e obras autorais. Cada repetição consciente da sua assinatura harmonizada condiciona sua mente e seu campo vibracional ao novo padrão de clareza, abundância e realização.',
    bulletPoints: [
      'Rodapé e assinatura de e-mails profissionais',
      'Cartões de visita, timbrados e papelaria de luxo',
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
      className={`rounded-2xl bg-[#161616]/95 border border-[#D4AF37]/25 p-5 sm:p-6 shadow-2xl shadow-black/80 transition-all duration-700 ease-out flex flex-col gap-5 ${
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

        <p className="font-cinzel text-[10px] uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-1">
          {item.tag}
        </p>

        <h3 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] mb-3 leading-tight">
          {item.title}
        </h3>

        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4">
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

      {/* Mockup do Item no Mobile */}
      <div className="pt-2">
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

    // Distribuição progressiva do scroll entre os 4 passos
    if (progress < 0.25) return 0;
    if (progress < 0.5) return 1;
    if (progress < 0.75) return 2;
    return 3;
  }, [progress, reduceMotion, manualIndex]);

  // Se o usuário clicar manualmente num pill, solta o controle manual após um tempo
  const handleSelectTab = (idx: number) => {
    setManualIndex(idx);
    window.setTimeout(() => {
      setManualIndex(null);
    }, 4000);
  };

  const currentItem = USE_CASES[activeIndex] ?? USE_CASES[0];

  return (
    <section
      id="onde-usar"
      ref={ref}
      className={`relative bg-[#111111] scroll-mt-28 lg:scroll-mt-32 ${
        reduceMotion ? 'py-20 lg:py-28' : 'lg:h-[350vh] pt-20 pb-20 lg:py-0'
      }`}
      aria-label="Onde e como usar sua assinatura harmonizada"
    >
      {/* Brilho de fundo cósmico sutil */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-[5%] w-[320px] h-[320px] lg:w-[480px] lg:h-[480px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-[5%] w-[300px] h-[300px] lg:w-[440px] lg:h-[440px] bg-[#d7c6ff]/5 rounded-full blur-[100px]" />
      </div>

      {/* ── EXPERIÊNCIA DESKTOP PINNED (lg: 1024px+) ────────────────────── */}
      <div
        className={`hidden lg:flex flex-col justify-center pt-24 pb-12 ${
          reduceMotion ? '' : 'sticky top-0 h-screen'
        } w-full overflow-hidden`}
      >
        <div className={landingSectionShellClass}>
          {/* Cabeçalho da Seção */}
          <div className="mb-8 xl:mb-10 text-center lg:text-left">
            <LandingSectionIntro
              align="left"
              label="Onde e como usar"
              title="Sua Assinatura Harmonizada no Mundo Real"
              description="Entenda como e onde aplicar seu Nome Social no dia a dia — da documentação oficial aos seus negócios e presença digital."
            />
          </div>

          {/* Grid Principal em 2 Colunas */}
          <div className="grid grid-cols-12 gap-8 xl:gap-12 items-center">
            {/* Coluna Esquerda: Texto dinâmico com transição de subida */}
            <div className="col-span-6 flex flex-col justify-between min-h-[460px]">
              <div>
                {/* Indicador de passos em pills clicáveis */}
                <div className="flex items-center gap-2 mb-6">
                  {USE_CASES.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectTab(idx)}
                        className={`transition-all duration-300 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#f2ca50] text-[#131313] shadow-md shadow-[#f2ca50]/20 scale-105'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <span className="font-cinzel">{item.stepNumber}</span>
                        <span className="hidden xl:inline text-[11px] font-normal truncate max-w-[110px]">
                          {item.title.split(':')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bloco de Texto Ativo com Transição Suave */}
                <div className="relative overflow-hidden min-h-[280px]">
                  {USE_CASES.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <div
                        key={item.id}
                        className={`transition-all duration-700 ease-[cubic-bezier(0.33,1,0.32,1)] ${
                          isActive
                            ? 'opacity-100 translate-y-0 pointer-events-auto relative z-10'
                            : 'opacity-0 translate-y-8 pointer-events-none absolute inset-x-0 top-0 z-0'
                        }`}
                        aria-hidden={!isActive}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full border border-[#f2ca50]/20">
                            CASO {item.stepNumber}
                          </span>
                          <span className="text-xs text-gray-400">
                            Exemplo com: <strong className="text-[#f2ca50]">{item.exampleName}</strong>
                          </span>
                        </div>

                        <p className="font-cinzel text-xs uppercase tracking-[0.16em] text-[#D4AF37]/80 mb-2">
                          {item.tag}
                        </p>

                        <h3 className="font-cinzel text-2xl xl:text-3xl font-bold text-[#e5e2e1] mb-4 leading-tight">
                          {item.title}
                        </h3>

                        <p className="text-gray-300 text-sm xl:text-base leading-relaxed mb-6 max-w-prose">
                          {item.description}
                        </p>

                        {/* Bullets de destaque */}
                        <div className="space-y-2.5">
                          {item.bulletPoints.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2.5 text-xs xl:text-sm text-gray-300">
                              <span className="text-[#f2ca50] text-sm shrink-0">✦</span>
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Barra de progresso de scroll sutil na base da coluna esquerda */}
              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                <span className="font-mono">
                  Etapa {activeIndex + 1} de {USE_CASES.length}
                </span>
                <div className="flex items-center gap-1.5">
                  {USE_CASES.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        idx === activeIndex
                          ? 'w-6 bg-[#f2ca50] shadow-[0_0_8px_rgba(242,202,80,0.5)]'
                          : 'w-2 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Mockup Vetorial Abstrato com Crossfade */}
            <div className="col-span-6 flex justify-center items-center">
              <div className="w-full max-w-[500px] min-h-[460px] flex items-center justify-center relative">
                {USE_CASES.map((item, idx) => {
                  const Mockup = item.MockupComponent;
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={item.id}
                      className={`transition-all duration-700 ease-[cubic-bezier(0.33,1,0.32,1)] w-full ${
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
            title="Sua Assinatura Harmonizada no Mundo Real"
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
