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
    { id: 'pdf-resumo', title: 'Seu mapa em 1 página', level: 0 },
    { id: 'pdf-intro-leitura', title: 'Como ler este relatório', level: 0 },
    ...buildEssenciaTocEntries().map((e) => (e.id === 'pdf-essencia' ? { ...e, title: 'Parte 1 · Você hoje' } : e)),
    { id: 'pdf-mapa', title: 'O que este mapa mostrou', level: 0 },
    { id: 'pdf-score', title: 'Como chegamos à sua nota', level: 1 },
    ...(hasPotencialCta ? [{ id: 'pdf-nome-social', title: 'Potencial da sua assinatura', level: 1 as const }] : []),
  ];
}

/** Sumário pago (DEV-327 / DEV-322) — inclui ranking quando há candidatos do chat. */
export function buildPaidTocEntries(hasRanking: boolean, options: { hasConclusion?: boolean } = {}): PdfTocEntry[] {
  const entry = (id: string, title: string, level: 0 | 1 | 2 | 3): PdfTocEntry => ({ id, title, level });
  return [
    entry('pdf-resumo', 'Resumo em 1 página', 0),
    entry('pdf-intro-leitura', 'Como ler este relatório', 0),
    ...(hasRanking ? [entry('pdf-ranking', 'Opções avaliadas', 0)] : []),
    entry('pdf-essencia', 'Parte 1 · Você hoje', 0),
    entry('pdf-essencia-destino', 'O Destino: A Estrada Imutável', 1),
    entry('pdf-essencia-expressao', 'Os Números do Nome', 1),
    entry('pdf-essencia-motivacao', 'Motivação', 2),
    entry('pdf-essencia-impressao', 'Impressão', 2),
    entry('pdf-essencia-missao', 'Missão', 2),
    entry('pdf-essencia-arquetipo', 'Arquétipo Vibracional (Nascimento)', 1),
    entry('pdf-essencia-triangulo-vida', 'Triângulo da Vida (Nascimento)', 1),
    entry('pdf-essencia-karma', 'O Peso do Passado: Débitos e Tendências', 1),
    entry('pdf-essencia-debitos', 'Débitos kármicos', 2),
    entry('pdf-essencia-licoes', 'Lições kármicas', 2),
    entry('pdf-essencia-tendencias', 'Tendências ocultas', 2),
    entry('pdf-harmonizacao', 'Parte 2 · O que muda para você', 0),
    entry('pdf-harmonizacao-estrela', 'Estrela comparativa', 1),
    entry('pdf-harmonizacao-mapa', 'Mapa Vibracional', 1),
    entry('pdf-harmonizacao-comparativa', 'Antes e depois, item por item', 1),
    entry('pdf-harmonizacao-corpo', 'Tabela comparativa', 2),
    entry('pdf-nome-harmonizado', 'Parte 3 · Seu nome novo', 0),
    entry('pdf-harmonizado-arquetipo', 'Arquétipo do nome novo', 1),
    entry('pdf-harmonizado-triangulo-vida', 'Triângulo da Vida do nome novo', 1),
    ...(options.hasConclusion ? [entry('pdf-conclusao', 'Conclusão: O Encerramento do Seu Mapa', 1)] : []),
    entry('pdf-guia', 'Parte 4 · Como usar', 0),
    entry('pdf-score', 'Como chegamos às sugestões', 1),
    entry('pdf-treino', 'Folha de treino de assinatura', 1),
    entry('pdf-anexos', 'Anexos', 0),
    entry('pdf-anexos-triangulos', 'Triângulos complementares', 1),
    entry('pdf-essencia-triangulo-pessoal', 'Triângulo Pessoal (Nascimento × Novo)', 2),
    entry('pdf-harmonizado-triangulo-pessoal', 'Triângulo Pessoal (Nome novo)', 3),
    entry('pdf-essencia-triangulo-social', 'Triângulo Social (Nascimento × Novo)', 2),
    entry('pdf-harmonizado-triangulo-social', 'Triângulo Social (Nome novo)', 3),
    entry('pdf-essencia-triangulo-destino', 'Triângulo do Destino (Nascimento × Novo)', 2),
    entry('pdf-harmonizado-triangulo-destino', 'Triângulo do Destino (Nome novo)', 3),
    entry('pdf-anexos-ciclos', 'Ciclos do nome', 1),
    entry('pdf-arcanos', 'Os Arcanos da Sua Análise', 1),
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
