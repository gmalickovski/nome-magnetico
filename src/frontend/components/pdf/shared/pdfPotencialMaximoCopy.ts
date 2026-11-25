import { ehNotaAlta, ganhoEmPontos, textoPontos } from '../../../../shared/free-analysis-bridge';

export function formatNotaPdf(nota: number): string {
  if (!Number.isFinite(nota)) return 'n/d';
  return Number.isInteger(nota) ? String(nota) : String(nota);
}

export type PotencialPdfCopyComCta = {
  destaque: string;
  apoio: string;
  /** Distância em pontos entre a nota de hoje e a nota máxima (DEV-343). */
  ganho: string;
  texto: string;
  botao: string;
  aviso: string;
};

export type PotencialPdfCopySemCta = {
  destaque: string;
  texto: string;
};

const BOTAO_MARKETING = 'Ver meu nome sem bloqueios';
const BOTAO_NOTA_ALTA = 'Ver o ajuste fino do meu nome';

export function buildPotencialPdfCopyComCta(
  notaBase: number,
  potencialMax: number,
): PotencialPdfCopyComCta {
  const base = formatNotaPdf(notaBase);
  const max = formatNotaPdf(potencialMax);
  const pontos = textoPontos(ganhoEmPontos(notaBase, potencialMax));
  const notaAlta = ehNotaAlta(notaBase);
  return {
    destaque: `A nota máxima que o seu nome pode alcançar: ${max}`,
    apoio: `Hoje, a nota do seu nome de nascimento é ${base}.`,
    ganho: notaAlta
      ? `Seu nome já está bem. Um ajuste fino pode levá-lo ${pontos} mais perto do máximo.`
      : `São ${pontos} a mais do que a nota de hoje.`,
    texto: notaAlta
      ? 'Na análise completa, você compara versões do seu nome e vê se um ajuste faz sentido. Se preferir, também dá para criar um nome artístico ou escolher o nome do bebê.'
      : 'Na análise completa, um chat conduz você até as versões do seu nome sem bloqueios, cada uma com nota de 0 a 100. Você escolhe o que quer manter e compara antes de decidir.',
    botao: notaAlta ? BOTAO_NOTA_ALTA : BOTAO_MARKETING,
    aviso: `Essa nota pode diminuir conforme o que você quiser manter na conversa, como sobrenomes ou o quanto o nome pode mudar. Só mostramos opções com nota acima de ${base}.`,
  };
}

export function buildPotencialPdfCopySemCta(notaBase: number): PotencialPdfCopySemCta {
  const base = formatNotaPdf(notaBase);
  return {
    destaque: `O seu nome já está na nota máxima que encontramos: ${base}`,
    texto:
      'Não encontramos uma assinatura com nota maior que a do seu nome de nascimento. Por isso, não indicamos a análise completa para você agora. Você pode seguir usando o seu nome como está.',
  };
}

/** Travessão (U+2014) não entra na copy do PDF. */
export function copyPotencialPdfSemTravessao(text: string): boolean {
  return !text.includes('—');
}
