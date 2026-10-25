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
      'Você não precisa alterar sua certidão nem abrir processo em cartório. O seu nome oficial permanece exatamente como está hoje, enquanto a nova assinatura passa a representar a forma limpa e legível como você assina.',
    bulletPoints: [
      'Seu nome de certidão continua exatamente o mesmo',
      'Zero burocracia: sem cartório e sem processo judicial',
      'Traço único e legível para assinar sempre do mesmo jeito',
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
      } items-center justify-between gap-8 sm:gap-10 lg:gap-14 xl:gap-16 w-full min-w-0`}
    >
      {/* Coluna de Texto: no mobile/tablet fica sempre em cima (flex-col); no desktop alterna via flex-row / flex-row-reverse */}
      <div
        className={`w-full lg:w-1/2 flex-1 min-w-0 flex flex-col justify-center text-center lg:text-left ${textReveal.className}`}
        style={textReveal.style}
      >
        <p className="nm-eyebrow mb-2">
          {item.eyebrow}
        </p>

        <h3 className="nm-h3 mb-3">
          {item.title}
        </h3>

        <p className="nm-body mb-5 max-w-[56ch] mx-auto lg:mx-0">
          {item.description}
        </p>

        <div className="space-y-2.5 max-w-[54ch] mx-auto lg:mx-0 text-left">
          {item.bulletPoints.map((bullet, bIdx) => (
            <div key={bIdx} className="flex items-start gap-2.5">
              <span className="text-[#D4AF37] text-sm shrink-0 leading-none mt-1">✦</span>
              <span className="nm-body">{bullet}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coluna de Mockup: no mobile/tablet fica sempre abaixo do texto */}
      <div
        className={`w-full lg:w-1/2 flex-1 min-w-0 flex items-center justify-center ${mockupReveal.className}`}
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
            title="Uma Assinatura Só Sua Para Usar em Todo Lugar"
            description="Seu nome de registro continua intacto. Veja como aplicar a versão escolhida na sua rotina profissional, nas redes sociais e em cada lugar onde você assina."
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
