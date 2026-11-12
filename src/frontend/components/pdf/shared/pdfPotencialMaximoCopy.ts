export function formatNotaPdf(nota: number): string {
  if (!Number.isFinite(nota)) return 'n/d';
  return Number.isInteger(nota) ? String(nota) : String(nota);
}

export type PotencialPdfCopyComCta = {
  destaque: string;
  apoio: string;
  texto: string;
  botao: string;
  aviso: string;
};

export type PotencialPdfCopySemCta = {
  destaque: string;
  texto: string;
};

const BOTAO_MARKETING = 'Ver minhas opções de assinatura';

export function buildPotencialPdfCopyComCta(
  notaBase: number,
  potencialMax: number,
): PotencialPdfCopyComCta {
  const base = formatNotaPdf(notaBase);
  const max = formatNotaPdf(potencialMax);
  return {
    destaque: `A nota máxima que o seu nome pode alcançar: ${max}`,
    apoio: `Hoje, a nota do seu nome de nascimento é ${base}.`,
    texto:
      'Na análise completa, você vê as opções de assinatura, escolhe o que quer manter e compara cada uma antes de decidir.',
    botao: BOTAO_MARKETING,
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
  return !text.includes('\u2014');
}
