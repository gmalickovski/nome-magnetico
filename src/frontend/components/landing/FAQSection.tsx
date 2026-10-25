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

// Failsafe mínimo: exibido apenas se o Supabase estiver indisponível
const fallbackItems = [
  {
    id: '1',
    question: 'Como a nota é calculada?',
    answer:
      'Pela numerologia cabalística, com regras fixas: o mesmo nome com a mesma data sempre dá a mesma nota. A nota usa o triângulo da Vida; cada padrão conta uma única vez, e o que vem da sua data aparece separado. A conta é aberta: veja como calculamos a sua nota na página explicativa.',
  },
  {
    id: '2',
    question: 'O que o meu nome muda e o que não muda?',
    answer:
      'A data de nascimento traz marcas que nenhum nome muda, e elas aparecem separadas como "Marca da sua data". O que a assinatura pode harmonizar são os padrões que vêm só do nome. Por isso mostramos duas coisas lado a lado: a nota de hoje e o potencial.',
  },
  {
    id: '3',
    question: 'Por que às vezes aparecem acentos?',
    answer:
      'Na numerologia cabalística, cada acento muda o valor da letra. Antes de sugerir acento, o motor tenta encurtar o nome. Quando há acento, é um só e fica só na assinatura. Ele muda o cálculo sem mudar o seu nome.',
  },
  {
    id: '4',
    question: 'O que é a numerologia cabalística?',
    answer:
      'É um sistema tradicional que atribui valores numéricos às letras e aos acentos do nome. No Nome Magnético, esse cálculo segue regras fixas para cada letra e cada acento, garantindo que o mesmo nome sempre gere o mesmo resultado.',
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
