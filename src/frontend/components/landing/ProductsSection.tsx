import React from 'react';
import { track } from '../../lib/analytics';

const products = [
  {
    id: 'nome_social',
    icon: '✨',
    name: 'Nome Social',
    tagline: 'Harmonização de assinatura pelo nome social',
    description:
      'Sua assinatura tem mais poder do que você imagina. Harmonize sua assinatura comparando o nome de nascimento com variações de nome social mais fluidas, compatíveis com o Destino e livres dos bloqueios que pesam no campo original.',
    benefits: [
      'Ranking numerológico dos candidatos com score 0–100.',
      '5 números principais, 4 triângulos e arcanos por dimensão.',
      'Bloqueios, débitos, lições kármicas e tendências ocultas.',
      'Assinatura recomendada e variações harmonizadas prontas para testar.',
    ],
    highlight: true,
    href: '/nome-social',
  },
  {
    id: 'nome_bebe',
    icon: '👶',
    name: 'Nome de Bebê',
    tagline: 'A Decisão Mais Importante do Seu Filho',
    description:
      'A certeza de dar ao seu filho o melhor começo vibracional possível. Sem bloqueios. Com um nome que ressoará com o destino dele para sempre.',
    benefits: [
      'Análise cruzada dos nomes candidatos com o Destino da criança.',
      'Ranking objetivo do pior ao "Nome de Ouro".',
      'Identificação do Arquétipo da Criança (perfil e talentos naturais).',
      'Guia dos pais para criar o bebê segundo sua natureza numérica original.',
    ],
    highlight: false,
    href: '/nome-bebe',
  },
  {
    id: 'nome_empresa',
    icon: '🏢',
    name: 'Nome Empresarial',
    tagline: 'Branding com Fundamento Vibracional',
    description:
      'A diferença entre uma marca que as pessoas esquecem e uma que atrai clientes, sócios e oportunidades com magnetismo natural.',
    benefits: [
      'Avaliação da sinergia entre o Destino dos sócios e o nome da marca.',
      'Verificação rigorosa de riscos ocultos operacionais e financeiros.',
      'Guia de Posicionamento e Arquétipo de Marca (como a Apple ou a Nike têm).',
      'Sugestões de tom de voz e ativação anual para a empresa.',
    ],
    highlight: false,
    href: '/nome-empresarial',
  },
];

export function ProductsSection() {
  return (
    <section id="produtos" className="py-20 md:py-32 bg-[#111111]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-3">
            Produtos
          </p>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-4">
            Três Produtos, Uma Missão: Harmonizar o Nome que Abre Caminhos
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Seja para você, para o seu filho ou para sua empresa — cada nome carrega uma assinatura
            vibracional própria. A análise mostra qual nome sustenta melhor a identidade que você
            quer viver.
          </p>
        </div>

        {/* Cards clicáveis */}
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => (
            <a
              key={product.id}
              href={product.href}
              onClick={() => track('cta_produto_click', {
                produto: product.id as 'nome_social' | 'nome_bebe' | 'nome_empresa',
                posicao: 'products_section',
              })}
              className={`relative rounded-2xl p-8 flex flex-col cursor-pointer group transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#D4AF37]/20 ${
                product.highlight
                  ? 'bg-white/5 border-2 border-[#D4AF37]/50'
                  : 'bg-white/3 border border-white/10 hover:border-[#D4AF37]/30 hover:bg-white/5'
              }`}
            >
              {product.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-xs font-bold px-4 py-1.5 rounded-full">
                  MAIS POPULAR
                </div>
              )}

              <div className="text-5xl mb-5">{product.icon}</div>

              <h3 className="font-cinzel text-xl font-bold text-white mb-1">{product.name}</h3>
              <p
                className={`text-sm mb-4 ${product.highlight ? 'text-[#D4AF37]' : 'text-gray-400'}`}
              >
                {product.tagline}
              </p>

              <p className="text-gray-300 text-sm leading-relaxed mb-4 font-medium">
                {product.description}
              </p>

              <div className="flex-1 space-y-2">
                {product.benefits.map((benefit) => (
                  <p key={benefit} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-[#D4AF37] font-bold">-</span>
                    <span className="leading-snug">{benefit}</span>
                  </p>
                ))}
              </div>

              <p className="mt-6 text-xs text-gray-600 group-hover:text-[#D4AF37] transition-colors duration-300">
                Ver detalhes
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
