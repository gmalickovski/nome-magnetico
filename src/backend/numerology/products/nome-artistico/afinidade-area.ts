/**
 * Afinidade do número de Expressão com a área artística (DEV-321).
 *
 * Tabela configurável e simbólica: só desempata nomes já válidos (zero bloqueio e
 * nota mínima). Não entra na fórmula do score (DEV-260). Editar aqui muda apenas o
 * motor de nome artístico.
 */

import { reduzirNumero } from '../../core';
import type { AreaArtistica } from '../../../../shared/interactive-engine/ramos/artistico';

/** O que cada Expressão favorece no palco, em linguagem do cliente (sem números no texto). */
export const QUALIDADE_ARTISTICA_POR_EXPRESSAO: Record<number, string> = {
  1: 'protagonismo e presença de quem lidera a cena',
  2: 'sensibilidade, parceria e trabalho em dupla',
  3: 'comunicação, carisma e brilho no palco',
  4: 'constância, técnica e carreira construída passo a passo',
  5: 'versatilidade, movimento e facilidade para mudar de personagem',
  6: 'voz acolhedora, afeto e conexão com o público',
  7: 'profundidade, mistério e trabalho autoral',
  8: 'alcance comercial, força e projeção de marca',
  9: 'emoção, mensagem e alcance amplo',
  11: 'inspiração, intuição e magnetismo',
  22: 'grandes projetos e obra que deixa marca',
};

/** Peso de 0 a 1 por área. Números ausentes valem 0,3 (neutros). */
export const AFINIDADE_EXPRESSAO_POR_AREA: Record<AreaArtistica, Partial<Record<number, number>>> = {
  cantor: { 3: 1, 5: 0.9, 6: 0.9, 11: 0.9, 1: 0.7, 9: 0.7, 8: 0.5 },
  ator: { 5: 1, 3: 0.9, 7: 0.8, 11: 0.8, 1: 0.6, 9: 0.6 },
  personagem: { 5: 1, 3: 1, 1: 0.7, 9: 0.6, 11: 0.6 },
  criador_conteudo: { 3: 1, 5: 0.9, 1: 0.8, 8: 0.7, 11: 0.7 },
  escritor: { 7: 1, 3: 0.8, 9: 0.8, 11: 0.8, 2: 0.6, 4: 0.5 },
  dj_produtor: { 5: 1, 8: 0.9, 1: 0.8, 4: 0.7, 3: 0.6, 22: 0.7 },
  outra: { 3: 0.9, 5: 0.9, 1: 0.8, 11: 0.8 },
};

const PESO_NEUTRO = 0.3;

function expressaoChave(expressao: number): number {
  const comMestres = reduzirNumero(expressao, true);
  return comMestres === 11 || comMestres === 22 ? comMestres : reduzirNumero(expressao, false);
}

export function afinidadeExpressaoArea(expressao: number, area: string | null | undefined): number {
  const tabela = AFINIDADE_EXPRESSAO_POR_AREA[(area as AreaArtistica) ?? 'outra'] ?? AFINIDADE_EXPRESSAO_POR_AREA.outra;
  const chave = expressaoChave(expressao);
  return tabela[chave] ?? tabela[reduzirNumero(chave, false)] ?? PESO_NEUTRO;
}

/** Frase curta para o card: por que esse nome favorece a área. Sem números (regra do palpite). */
export function explicarAfinidade(expressao: number, area: string | null | undefined, rotuloArea: string): string {
  const qualidade = QUALIDADE_ARTISTICA_POR_EXPRESSAO[expressaoChave(expressao)];
  if (!qualidade) return '';
  const forte = afinidadeExpressaoArea(expressao, area) >= 0.8;
  return forte
    ? `Este nome favorece ${qualidade}, uma combinação forte para ${rotuloArea}.`
    : `Este nome traz ${qualidade} para o seu trabalho como ${rotuloArea}.`;
}
