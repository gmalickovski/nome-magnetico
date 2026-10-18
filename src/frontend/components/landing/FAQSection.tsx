import React from 'react';
import { Accordion } from '../ui/Accordion';
import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from './LandingSectionIntro';
import { useLandingSectionReveal } from './useLandingSectionReveal';

export interface FaqItemProps {
  id: string;
  question: string;
  answer: string;
  answer_html?: string | null;
}

// Failsafe mínimo — exibido apenas se o Supabase estiver indisponível
const fallbackItems = [
  {
    id: '1',
    question: 'O que é a numerologia cabalística?',
    answer:
      'É a ciência exata de conversão de letras em números e cálculo de frequências. Baseada na tradição mística hebraica, oferece um mapa matemático profundo, unindo cabala, cálculos precisos e arquétipos junguianos.',
  },
  {
    id: '2',
    question: 'Como a mudança da assinatura remove bloqueios?',
    answer:
      'Cada letra emite uma força. Mudando letras na assinatura, a equação do seu Triângulo da Vida muda, desmanchando sequências repetitivas (como 444, de inércia ou 888 de excesso) que causam bloqueios visíveis em diversas áreas.',
  },
  {
    id: '3',
    question: 'O que o relatório completo entrega?',
    answer:
      'Uma interpretação profunda dos 5 números, o caminho de transformação de cada bloqueio, top 3 Nomes Magnéticos personalizados com scoring numérico, além do Guia Executivo de Implementação de 30 dias em PDF premium.',
  },
];

interface FAQSectionProps {
  items?: FaqItemProps[];
}

export function FAQSection({ items }: FAQSectionProps) {
  const reveal = useLandingSectionReveal();
  const source = items && items.length > 0 ? items : fallbackItems;

  const accordionItems = source.map(item => ({
    id: item.id,
    question: item.question,
    answer: (item as { answer?: string }).answer ?? '',
    answerHtml: (item as FaqItemProps).answer_html ?? undefined,
  }));

  return (
    <section
      id="faq"
      ref={reveal.ref}
      className={`${landingSectionSpacingClass} bg-[#131313] overflow-x-hidden ${reveal.className}`}
    >
      <div className={landingSectionShellClass}>
        <div className="max-w-3xl mx-auto w-full min-w-0">
          <LandingSectionIntro
            label="Dúvidas"
            title="Perguntas Frequentes"
            align="center"
            className="mb-10 md:mb-12"
            revealed={reveal.revealed}
            reduceMotion={reveal.reduceMotion}
          />

          <Accordion
            items={accordionItems}
            variant="landing"
            revealed={reveal.revealed}
            reduceMotion={reveal.reduceMotion}
          />

          <div className="text-center mt-10">
            <p className="text-gray-400 text-sm">
              Ainda tem dúvidas?{' '}
              <a href="/app/suporte" className="text-[#D4AF37] hover:underline">
                Entre em contato
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
