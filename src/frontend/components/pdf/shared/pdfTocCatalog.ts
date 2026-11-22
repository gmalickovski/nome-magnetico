import type { PdfTocEntry } from './PDFTableOfContents.ts';

const essenciaSubassuntos: PdfTocEntry[] = [
  { id: 'pdf-essencia-destino', title: 'Destino (data de nascimento)', level: 1 },
  { id: 'pdf-essencia-expressao', title: 'Expressão', level: 2 },
  { id: 'pdf-essencia-motivacao', title: 'Motivação', level: 2 },
  { id: 'pdf-essencia-impressao', title: 'Impressão', level: 2 },
  { id: 'pdf-essencia-missao', title: 'Missão', level: 2 },
  { id: 'pdf-essencia-triangulo-vida', title: 'Triângulo da Vida', level: 2 },
  { id: 'pdf-essencia-triangulo-pessoal', title: 'Triângulo Pessoal', level: 2 },
  { id: 'pdf-essencia-triangulo-social', title: 'Triângulo Social', level: 2 },
  { id: 'pdf-essencia-triangulo-destino', title: 'Triângulo do Destino', level: 2 },
  { id: 'pdf-essencia-debitos', title: 'Débitos kármicos', level: 2 },
  { id: 'pdf-essencia-licoes', title: 'Lições kármicas', level: 2 },
  { id: 'pdf-essencia-tendencias', title: 'Tendências ocultas', level: 2 },
];

function buildEssenciaTocEntries(): PdfTocEntry[] {
  const entry = (id: string, title: string, level: 0 | 1 | 2 | 3): PdfTocEntry => ({ id, title, level });
  return [
    entry('pdf-essencia', 'A Essência (Nome de Nascimento)', 0),
    entry('pdf-essencia-destino', 'O Destino: A Estrada Imutável', 1),
    ...essenciaSubassuntos
      .filter(
        (e) =>
          !e.id.includes('triangulo-') &&
          e.id !== 'pdf-essencia-destino' &&
          !['debitos', 'licoes', 'tendencias'].some((k) => e.id.endsWith(k))
      )
      .map((e) => (e.id === 'pdf-essencia-expressao' ? { ...e, title: 'Os Números do Nome', level: 1 as const } : e)),
    entry('pdf-essencia-arquetipo', 'Arquétipo Vibracional (Nascimento)', 1),
    entry('pdf-essencia-triangulo-vida', 'Triângulo da Vida (Nascimento)', 1),
    entry('pdf-essencia-karma', 'O Peso do Passado: Débitos e Tendências', 1),
    ...essenciaSubassuntos.filter((e) => ['debitos', 'licoes', 'tendencias'].some((k) => e.id.endsWith(k))),
  ];
}

/** Entradas do sumário gratuito (alinhado ao bloco A Essência + páginas finais). */
export function buildGratuitoTocEntries(options: { hasPotencialCta?: boolean } = {}): PdfTocEntry[] {
  const hasPotencialCta = options.hasPotencialCta !== false;
  return [
    ...buildEssenciaTocEntries(),
    { id: 'pdf-mapa', title: 'O que este mapa mostrou', level: 0 },
    { id: 'pdf-score', title: 'Como calculamos o score', level: 1 },
    ...(hasPotencialCta ? [{ id: 'pdf-nome-social', title: 'Potencial da sua assinatura', level: 1 as const }] : []),
  ];
}

/** Sumário pago — inclui ranking quando há candidatos do chat. */
export function buildPaidTocEntries(hasRanking: boolean, options: { hasConclusion?: boolean } = {}): PdfTocEntry[] {
  const entry = (id: string, title: string, level: 0 | 1 | 2 | 3): PdfTocEntry => ({ id, title, level });
  return [
    entry('pdf-intro-leitura', 'Como ler este relatório', 0),
    ...(hasRanking ? [entry('pdf-ranking', 'Opções avaliadas no chat', 0)] : []),
    ...buildEssenciaTocEntries(),
    entry('pdf-harmonizacao', 'A Engenharia da Harmonização', 0),
    entry('pdf-harmonizacao-estrela', 'Assinatura, Estrela Comparativa e Score', 1),
    entry('pdf-harmonizacao-mapa', 'Mapa Vibracional', 1),
    entry('pdf-harmonizacao-escudo', 'O Escudo Magnético e a Transformação', 1),
    entry('pdf-harmonizacao-comparativa', 'A Leitura Comparativa', 1),
    entry('pdf-harmonizacao-corpo', 'Os 5 Números Fundamentais', 2),
    entry('pdf-harmonizacao-triangulos-comp', 'Comparativo dos Triângulos e Arcanos', 2),
    entry('pdf-harmonizacao-karma-comp', 'Débitos, Lições e Tendências Comparativos', 2),
    entry('pdf-nome-harmonizado', 'O Nome Social (Nome Harmonizado)', 0),
    entry('pdf-harmonizado-ressonancia', 'A Ressonância e o Poder da Nova Frequência', 1),
    entry('pdf-harmonizado-numeros', 'O Destino e os Números do Nome Harmonizado', 1),
    entry('pdf-harmonizado-arquetipo', 'Arquétipo Vibracional (Harmonizado)', 1),
    entry('pdf-harmonizado-triangulo-vida', 'Triângulo da Vida (Harmonizado)', 1),
    entry('pdf-harmonizado-karma', 'O Campo Kármico (Harmonizado)', 1),
    entry('pdf-harmonizado-debitos', 'Débitos Kármicos', 2),
    entry('pdf-harmonizado-licoes', 'Lições Kármicas', 2),
    entry('pdf-harmonizado-tendencias', 'Tendências Ocultas', 2),
    ...(options.hasConclusion ? [entry('pdf-conclusao', 'Conclusão: O Encerramento do Seu Mapa', 1)] : []),
    entry('pdf-anexos', 'Anexos', 0),
    entry('pdf-anexos-triangulos', 'Leitura complementar dos triângulos', 1),
    entry('pdf-anexos-triangulos-essencia', 'Essência (Nome de Nascimento)', 2),
    ...(['pessoal', 'social', 'destino'] as const).map(k => entry(`pdf-essencia-triangulo-${k}`, k === 'destino' ? 'Triângulo do Destino (Nascimento)' : `Triângulo ${k === 'pessoal' ? 'Pessoal' : 'Social'} (Nascimento)`, 3)),
    entry('pdf-anexos-triangulos-harmonizado', 'Nome Harmonizado (Nome Social)', 2),
    ...(['pessoal', 'social', 'destino'] as const).map(k => entry(`pdf-harmonizado-triangulo-${k}`, k === 'destino' ? 'Triângulo do Destino (Harmonizado)' : `Triângulo ${k === 'pessoal' ? 'Pessoal' : 'Social'} (Harmonizado)`, 3)),
    entry('pdf-arcanos', 'Os Arcanos da Sua Análise', 1),
    entry('pdf-guia', 'Guia de uso da assinatura', 1),
    entry('pdf-score', 'Como chegamos às sugestões', 1),
    entry('pdf-treino', 'Folha de treino de assinatura', 1),
  ];
}

/** Entradas sintéticas para stress-test de sumário multipágina (>22). */
export function buildStressTocEntries(count: number): PdfTocEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pdf-stress-${i + 1}`,
    title: `Entrada de teste ${i + 1}`,
    level: (i % 4) as 0 | 1 | 2 | 3,
  }));
}

export function gratuitoTocAnchorIds(): string[] {
  return buildGratuitoTocEntries().map((e) => e.id);
}

export function paidTocAnchorIds(hasRanking: boolean): string[] {
  return buildPaidTocEntries(hasRanking, { hasConclusion: true }).map((e) => e.id);
}
