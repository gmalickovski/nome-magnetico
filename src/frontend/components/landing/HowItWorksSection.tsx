import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Sua Frequência Vibracional',
    description:
      'Nossa Inteligência Analítica mapeia seus 5 Números Fundamentais — Expressão, Destino, Motivação, Missão e Personalidade — revelando a "assinatura matemática" única do seu nome de nascimento.',
    icon: '🔢',
    keyword: 'Mapa Numerológico',
  },
  {
    number: '02',
    title: 'Os Bloqueios Invisíveis',
    description:
      'Analisamos os 4 Triângulos Cabalísticos (Vida, Pessoal, Social e Destino) para identificar as sequências que criam atrito energético — os bloqueios que, sem você saber, sabotam carreira, relacionamentos e prosperidade há anos.',
    icon: '🔍',
    keyword: 'Bloqueios Energéticos',
  },
  {
    number: '03',
    title: 'Seu Arquétipo de Marca',
    description:
      'A mesma inteligência que determina o posicionamento de marcas como Apple e Nike é aplicada ao seu nome. Revelamos seu Arquétipo Junguiano — o perfil magnético que define como o mundo percebe você.',
    icon: '🎭',
    keyword: 'Arquétipo Pessoal',
  },
  {
    number: '04',
    title: 'Sua Assinatura Harmonizada',
    description:
      'Com base em toda a análise, geramos variações do seu nome para usar como assinatura social, profissional e digital. A recomendação preserva sua identidade e busca maior harmonia entre Expressão e Destino.',
    icon: '✨',
    keyword: 'Assinatura Harmonizada',
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="py-20 md:py-32 bg-[#1a1a1a]"
      aria-label="Como funciona o Método Nome Magnético"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-3">
            O Método
          </p>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-4">
            Da Teoria à Transformação: Como o Método Funciona
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Durante séculos, a sabedoria da Cabala ficou restrita a poucos iniciados. O{' '}
            <strong className="text-gray-300">Método Nome Magnético</strong> combina essa tradição com
            análise vibracional avançada — processando{' '}
            <strong className="text-[#D4AF37]">milhares de combinações numéricas</strong> para
            encontrar exatamente onde estão seus bloqueios e como superá-los.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
          {steps.map((step, idx) => (
            <div key={step.number} className="relative" role="listitem">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent z-0 -translate-y-1/2"
                  aria-hidden="true"
                />
              )}

              <div className="relative z-10 bg-white/5 border border-[#D4AF37]/20 rounded-2xl p-6 hover:border-[#D4AF37]/40 hover:bg-white/[0.08] transition-all duration-500 h-full flex flex-col">
                <div className="font-cinzel text-4xl font-bold text-[#D4AF37]/20 mb-3" aria-hidden="true">
                  {step.number}
                </div>
                <div className="text-3xl mb-4" aria-hidden="true">{step.icon}</div>
                <h3 className="font-cinzel text-lg font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-1">{step.description}</p>
                <div className="mt-4">
                  <span className="inline-block text-xs text-[#D4AF37]/60 border border-[#D4AF37]/20 rounded-full px-2 py-0.5">
                    {step.keyword}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nota de posicionamento da IA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-xs max-w-xl mx-auto leading-relaxed">
            A precisão da análise vem do cruzamento dos cálculos da numerologia cabalística com
            padrões de mais de cem combinações vibracionais por nome — algo impossível de fazer
            manualmente sem meses de estudo especializado.
          </p>
        </div>
      </div>
    </section>
  );
}
