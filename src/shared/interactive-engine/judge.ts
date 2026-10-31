/**
 * Juiz de Correção (DEV-235 · Seção 5A).
 * Responsabilidade: reescrever a leitura e as linhas do resumo quando o consulente
 * clica em "Não, é outra coisa" ou quando a confiança cai abaixo de JUDGE_MAX (0.2).
 */

export interface CorrectionJudgeParams {
  textoCorrecao: string;
  destino: number;
  notaHoje: number;
  potencial: number;
  areaFocoAtual?: string | null;
}

export interface CorrectionJudgeResult {
  leituraAjustada: string;
  linhaResumoFoco: string;
  areaFocoInferida?: string;
}

export function applyCorrectionJudge(params: CorrectionJudgeParams): CorrectionJudgeResult {
  const limpo = params.textoCorrecao.trim();
  const primeiroNome = limpo.split(/\s+/)[0] ?? 'seu foco';

  // Extração determinística rápida de palavras-chave
  const lower = limpo.toLowerCase();
  let areaInferida = params.areaFocoAtual ?? 'carreira_negocios';

  if (lower.includes('dinheiro') || lower.includes('renda') || lower.includes('financ') || lower.includes('conta') || lower.includes('aperto')) {
    areaInferida = 'prosperidade_financeira';
  } else if (lower.includes('trabalh') || lower.includes('contrat') || lower.includes('client') || lower.includes('carg') || lower.includes('negoc')) {
    areaInferida = 'carreira_negocios';
  } else if (lower.includes('amor') || lower.includes('casal') || lower.includes('famil') || lower.includes('relac') || lower.includes('paz')) {
    areaInferida = 'relacionamentos_harmonia';
  } else if (lower.includes('confian') || lower.includes('autoestima') || lower.includes('presen') || lower.includes('falar') || lower.includes('ideia')) {
    areaInferida = 'autoestima_expressao';
  }

  const leituraAjustada = `Compreendido perfeitamente. O seu foco real está em "${limpo}". Alinhando isso ao seu Destino ${params.destino}, direcionamos os cálculos para elevar sua nota de ${params.notaHoje} para ${params.potencial} com máxima prioridade nesse objetivo.`;

  const linhaResumoFoco = `Prioridade personalizada: ${limpo.length > 50 ? limpo.slice(0, 47) + '...' : limpo}`;

  return {
    leituraAjustada,
    linhaResumoFoco,
    areaFocoInferida: areaInferida,
  };
}
