import React from 'react';
import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from './LandingSectionIntro';
import { getRevealItemProps, useLandingSectionReveal } from './useLandingSectionReveal';
import {
  DocumentCinMockup,
  SocialProfileMockup,
  ContractMockup,
  BrandingCardMockup,
} from './SignatureUseCasesMockups';

interface UseCaseItem {
  id: string;
  stepNumber: string;
  eyebrow: string;
  title: string;
  description: string;
  bulletPoints: string[];
  MockupComponent: React.ComponentType<{ className?: string }>;
}

const USE_CASES: UseCaseItem[] = [
  {
    id: 'documentos-oficiais',
    stepNumber: '01',
    eyebrow: '01 · Identidade e Registro',
    title: 'Sua Assinatura Muda, Seu Nome Civil Continua',
    description:
      'A assinatura é a forma como você traça seu nome. Seu nome civil nos registros pode permanecer o de nascimento, enquanto você adota uma grafia clara nas situações do cotidiano.',
    bulletPoints: [
      'Grafie a assinatura escolhida com legibilidade e conforto',
      'Seu nome de certidão permanece como está hoje',
      'Traço reconhecível no seu ritmo, sem cronograma imposto',
    ],
    MockupComponent: DocumentCinMockup,
  },
  {
    id: 'redes-sociais',
    stepNumber: '02',
    eyebrow: '02 · Presença Digital',
    title: 'Perfis, Redes Sociais e Nome Artístico',
    description:
      'Use a versão que você escolheu no nome de exibição, no @ e na bio do Instagram, LinkedIn, YouTube e TikTok. É a forma mais simples de apresentar o seu novo nome para quem acompanha o seu conteúdo e o seu trabalho.',
    bulletPoints: [
      'Nome de exibição, @ e bio no Instagram, LinkedIn e TikTok',
      'Canais de vídeo, podcasts, newsletters e páginas pessoais',
      'Nome artístico ou público alinhado ao seu cálculo',
    ],
    MockupComponent: SocialProfileMockup,
  },
  {
    id: 'contratos-negocios',
    stepNumber: '03',
    eyebrow: '03 · Rotina de Trabalho',
    title: 'Propostas, Acordos e Rotina Digital',
    description:
      'Em orçamentos, propostas comerciais, recibos e plataformas digitais do dia a dia, você adota um padrão visual único. Sua assinatura deixa de variar a cada folha e ganha firmeza em todas as suas entregas.',
    bulletPoints: [
      'Propostas comerciais, orçamentos e termos de serviço',
      'Plataformas de assinatura eletrônica e documentos em PDF',
      'Padrão visual consistente do primeiro contato à entrega',
    ],
    MockupComponent: ContractMockup,
  },
  {
    id: 'marca-pessoal',
    stepNumber: '04',
    eyebrow: '04 · Marca Pessoal e Autoria',
    title: 'E-mails, Cartões e Projetos Autorais',
    description:
      'Leve a mesma identidade para o rodapé dos seus e-mails, cartões de visita, apresentações, certificados e capas de cursos ou livros. Uma assinatura pensada por você, presente em tudo o que leva a sua autoria.',
    bulletPoints: [
      'Assinatura de e-mail profissional e papelaria corporativa',
      'Cartões de visita, crachás, portfólios e apresentações',
      'Capas de livros, cursos, certificados e obras autorais',
    ],
    MockupComponent: BrandingCardMockup,
  },
];

interface UseCaseRowProps {
  item: UseCaseItem;
  mockupFirst: boolean;
}

function UseCaseRow({ item, mockupFirst }: UseCaseRowProps) {
  const reveal = useLandingSectionReveal();
  const Mockup = item.MockupComponent;

  const textReveal = getRevealItemProps(reveal.revealed, 0, reveal.reduceMotion);
  const mockupReveal = getRevealItemProps(reveal.revealed, 120, reveal.reduceMotion);

  return (
    <div
      ref={reveal.ref}
      className={`flex flex-col ${
        mockupFirst ? 'lg:flex-row-reverse' : 'lg:flex-row'
      } items-center justify-between gap-7 sm:gap-9 md:gap-10 lg:gap-10 xl:gap-16 w-full min-w-0`}
    >
      {/* Coluna de Texto:
          - Smartphone (<640px) e Tablet 10" em pé (640px–1023px): empilhada no topo, centralizada com largura de leitura confortável.
          - Tablet 12"–13" (lg: 1024px+) e Desktop (xl: 1280px+): lado a lado em zigue-zague, reservando 52% no lg para máxima legibilidade. */}
      <div
        className={`w-full lg:w-[52%] xl:w-1/2 flex-1 min-w-0 flex flex-col justify-center text-center lg:text-left ${textReveal.className}`}
        style={textReveal.style}
      >
        <p className="nm-eyebrow mb-2">
          {item.eyebrow}
        </p>

        <h3 className="nm-h3 mb-3 max-w-[28ch] sm:max-w-[36ch] md:max-w-[40ch] lg:max-w-[28ch] mx-auto lg:mx-0">
          {item.title}
        </h3>

        <p className="nm-body mb-5 max-w-[54ch] sm:max-w-[60ch] lg:max-w-[56ch] mx-auto lg:mx-0">
          {item.description}
        </p>

        <div className="space-y-2.5 max-w-[50ch] sm:max-w-[56ch] lg:max-w-[54ch] mx-auto lg:mx-0 text-left">
          {item.bulletPoints.map((bullet, bIdx) => (
            <div key={bIdx} className="flex items-start gap-2.5">
              <span className="text-[#D4AF37] text-sm shrink-0 leading-none mt-1">✦</span>
              <span className="nm-body">{bullet}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coluna de Mockup:
          - Smartphone e Tablet 10" em pé: fica abaixo do texto, centralizado em escala intermediária.
          - Tablet 12"–13" (lg) e Desktop (xl): lado a lado com o texto. */}
      <div
        className={`w-full lg:w-[48%] xl:w-1/2 flex-1 min-w-0 flex items-center justify-center ${mockupReveal.className}`}
        style={mockupReveal.style}
      >
        <div className="w-full flex items-center justify-center">
          <Mockup />
        </div>
      </div>
    </div>
  );
}

export function SignatureUseCasesSection() {
  const headerReveal = useLandingSectionReveal();

  return (
    <section
      id="onde-usar"
      className={`relative bg-[#111111] scroll-mt-20 overflow-x-clip ${landingSectionSpacingClass}`}
      aria-label="Onde usar a sua nova assinatura no dia a dia"
    >
      {/* Brilhos decorativos cósmicos sutis de fundo */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-[5%] w-[320px] h-[320px] lg:w-[480px] lg:h-[480px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-[5%] w-[300px] h-[300px] lg:w-[440px] lg:h-[440px] bg-[#d7c6ff]/5 rounded-full blur-[100px]" />
      </div>

      <div className={`relative ${landingSectionShellClass}`}>
        {/* Cabeçalho Geral da Seção 4 no Topo */}
        <div ref={headerReveal.ref} className="mb-12 sm:mb-16 md:mb-20">
          <LandingSectionIntro
            label="Onde Usar no Dia a Dia"
            title="Uma assinatura só sua para usar no dia a dia"
            description="Use o nome escolhido em redes sociais, cartões e apresentações profissionais. Isso não altera seu nome civil. Para contratos, bancos e documentos, confirme as exigências da instituição ou do cartório. Uma mudança significativa no traço da assinatura pode tornar necessária a atualização da identidade ou da firma cadastrada."
            align="center"
            revealed={headerReveal.revealed}
            reduceMotion={headerReveal.reduceMotion}
          />
        </div>

        {/* 4 Exemplos Empilhados em Zigue-zague ocupando a largura útil da seção */}
        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 lg:space-y-24 w-full">
          {USE_CASES.map((item, idx) => (
            <UseCaseRow
              key={item.id}
              item={item}
              mockupFirst={idx % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
