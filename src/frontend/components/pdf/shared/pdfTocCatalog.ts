import type { PdfTocEntry } from './PDFTableOfContents.ts';

/** Entradas do sumário gratuito (preserva ids raiz da revisão Growth 05/11). */
export function buildGratuitoTocEntries(): PdfTocEntry[] {
  return [
    { id: 'pdf-intro-leitura', title: 'Como ler este relatório', level: 0 },
    { id: 'pdf-essencia', title: 'A Essência — nome de nascimento', level: 0 },
    { id: 'pdf-essencia-cinco-numeros', title: 'Cinco números da essência', level: 1 },
    { id: 'pdf-essencia-triangulos', title: 'Os quatro triângulos (nascimento)', level: 1 },
    { id: 'pdf-essencia-karma', title: 'Débitos, lições e tendências', level: 1 },
    { id: 'pdf-mapa', title: 'O que este mapa mostrou', level: 0 },
    { id: 'pdf-score', title: 'Como calculamos o score', level: 0 },
    { id: 'pdf-nome-social', title: 'Compare outras formas de assinar', level: 0 },
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
    { id: 'pdf-essencia-cinco-numeros', title: 'Cinco números da essência', level: 1 },
    { id: 'pdf-essencia-triangulos', title: 'Os quatro triângulos (nascimento)', level: 1 },
    { id: 'pdf-essencia-karma', title: 'Débitos, lições e tendências', level: 1 },
    { id: 'pdf-harmonizacao', title: 'Harmonização — assinatura e estrela', level: 0 },
    { id: 'pdf-harmonizacao-comparativa', title: 'Harmonização — leitura comparativa', level: 1 },
    { id: 'pdf-harmonizacao-corpo', title: 'Corpo da assinatura harmonizada', level: 1 },
    { id: 'pdf-arquetipo', title: 'Arquétipo da expressão', level: 1 },
    { id: 'pdf-guia', title: 'Guia de uso da assinatura', level: 0 },
    { id: 'pdf-score', title: 'Como calculamos o score', level: 0 },
    { id: 'pdf-treino', title: 'Folha de treino de assinatura', level: 0 },
  ];
}

export function gratuitoTocAnchorIds(): string[] {
  return buildGratuitoTocEntries().map((e) => e.id);
}

export function paidTocAnchorIds(hasRanking: boolean): string[] {
  return buildPaidTocEntries(hasRanking).map((e) => e.id);
}
