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

/** Entradas do sumário gratuito (preserva ids raiz da revisão Growth 05/11). */
export function buildGratuitoTocEntries(): PdfTocEntry[] {
  return [
    { id: 'pdf-intro-leitura', title: 'Como ler este relatório', level: 0 },
    { id: 'pdf-essencia', title: 'A Essência — nome de nascimento', level: 0 },
    ...essenciaSubassuntos,
    { id: 'pdf-mapa', title: 'O que este mapa mostrou', level: 0 },
    { id: 'pdf-score', title: 'Como calculamos o score', level: 1 },
    { id: 'pdf-nome-social', title: 'Compare outras formas de assinar', level: 1 },
  ];
}

/** Sumário pago — inclui ranking quando há candidatos do chat. */
export function buildPaidTocEntries(hasRanking: boolean): PdfTocEntry[] {
  return [
    { id: 'pdf-intro-leitura', title: 'Como ler este relatório', level: 0 },
    ...(hasRanking
      ? [{ id: 'pdf-ranking', title: 'Opções avaliadas no chat', level: 0 as const }]
      : []),
    { id: 'pdf-essencia', title: 'A Essência — nome de nascimento', level: 0 },
    ...essenciaSubassuntos,
    { id: 'pdf-harmonizacao', title: 'Harmonização — assinatura e estrela', level: 0 },
    { id: 'pdf-mapa-alinhamento', title: 'Mapa de Alinhamento Vibracional', level: 1 },
    { id: 'pdf-harmonizacao-comparativa', title: 'Harmonização — leitura comparativa', level: 1 },
    { id: 'pdf-harmonizacao-corpo', title: 'Corpo da assinatura harmonizada', level: 1 },
    { id: 'pdf-arquetipo', title: 'Arquétipo da expressão', level: 1 },
    { id: 'pdf-guia', title: 'Guia de uso da assinatura', level: 0 },
    { id: 'pdf-score', title: 'Como calculamos o score', level: 1 },
    { id: 'pdf-treino', title: 'Folha de treino de assinatura', level: 1 },
  ];
}

/** Entradas sintéticas para stress-test de sumário multipágina (>22). */
export function buildStressTocEntries(count: number): PdfTocEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pdf-stress-${i + 1}`,
    title: `Entrada de teste ${i + 1}`,
    level: (i % 3) as 0 | 1 | 2,
  }));
}

export function gratuitoTocAnchorIds(): string[] {
  return buildGratuitoTocEntries().map((e) => e.id);
}

export function paidTocAnchorIds(hasRanking: boolean): string[] {
  return buildPaidTocEntries(hasRanking).map((e) => e.id);
}
