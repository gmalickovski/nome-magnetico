/**
 * Ramo do bebê no chat do Nome Magnético (DEV-326).
 *
 * Tudo que é específico do caminho do bebê no front compartilhado mora aqui: opções, rótulos,
 * validações do formulário, avisos informativos e resumo da resposta. O roteiro padrão
 * (`questionnaire-adaptive.ts`, `router.ts`) só importa daqui. Só imports de tipo dos módulos
 * do roteiro (sem dependência circular em runtime).
 */

import type { QuestionOption, QuestionnaireStepId } from '../questionnaire-adaptive';

// ── Passos ───────────────────────────────────────────────────────────────────

/** Passos do caminho do bebê, na ordem em que são perguntados. */
export const BEBE_STEPS: readonly QuestionnaireStepId[] = [
  'bebe_situacao',
  'bebe_data_tipo',
  'bebe_sexo',
  'bebe_dados',
  'bebe_estilo',
];

export const BEBE_PROMPTS: Record<string, string> = {
  bebe_situacao: 'Seu bebê já nasceu?',
  bebe_data_tipo: 'Já existe uma data marcada para o nascimento?',
  bebe_sexo: 'Já sabem o sexo do bebê?',
  bebe_dados: 'Agora me conte os dados do bebê.',
  bebe_estilo: 'Que estilo de nome vocês preferem?',
};

// ── Opções ───────────────────────────────────────────────────────────────────

export type BebeSituacao = 'nao_nasceu' | 'nasceu_sem_registro' | 'nasceu_registrado';

export const BEBE_SITUACAO_OPTIONS: QuestionOption[] = [
  { id: 'nao_nasceu', label: 'Ainda não nasceu' },
  { id: 'nasceu_sem_registro', label: 'Já nasceu, ainda não foi registrado' },
  { id: 'nasceu_registrado', label: 'Já nasceu e já foi registrado' },
];

export type BebeDataTipo = 'marcada' | 'prevista';

export const BEBE_DATA_TIPO_OPTIONS: QuestionOption[] = [
  { id: 'marcada', label: 'Tenho a data marcada' },
  { id: 'prevista', label: 'Só tenho a data prevista' },
];

export type BebeSexo = 'menina' | 'menino' | 'indefinido';

export const BEBE_SEXO_OPTIONS: QuestionOption[] = [
  { id: 'menina', label: 'Menina' },
  { id: 'menino', label: 'Menino' },
  { id: 'indefinido', label: 'Ainda não sei' },
];

export const BEBE_ESTILO_OPTIONS: QuestionOption[] = [
  { id: 'classico', label: 'Clássico' },
  { id: 'moderno', label: 'Moderno' },
  { id: 'curto', label: 'Curto' },
  { id: 'biblico', label: 'Bíblico' },
  { id: 'internacional', label: 'Internacional' },
  { id: 'tanto_faz', label: 'Tanto faz' },
];

export function labelBebeSituacao(id: string | null | undefined): string | null {
  return BEBE_SITUACAO_OPTIONS.find((o) => o.id === id)?.label ?? null;
}

// ── Formulário (data, sobrenomes, nomes dos pais) ────────────────────────────

export const BEBE_MAX_NOMES_PAIS = 5;
export const BEBE_MAX_SOBRENOMES = 4;

/** Rótulo do campo de data conforme a situação. */
export function labelCampoDataBebe(situacao: string | null | undefined, dataTipo: string | null | undefined): string {
  if (situacao === 'nao_nasceu') {
    return dataTipo === 'marcada' ? 'Data marcada para o nascimento' : 'Data prevista para o nascimento';
  }
  return 'Data de nascimento do bebê';
}

const DATA_PT = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** dd/mm/aaaa válida (rejeita 31/02). */
export function dataPtValida(dataPt: string): boolean {
  const m = DATA_PT.exec(dataPt.trim());
  if (!m) return false;
  const [d, mo, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(a, mo - 1, d));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Máscara enquanto digita: 12052027 vira 12/05/2027. */
export function mascararDataPt(digitado: string): string {
  const n = digitado.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

const NOME_PARTE = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,40}$/;

function limparParte(s: string): string | null {
  const t = s.replace(/\s+/g, ' ').trim();
  return NOME_PARTE.test(t) ? t : null;
}

/**
 * Sobrenomes digitados. Com vírgula (ou " e "), cada pedaço é um sobrenome (aceita "de Souza").
 * Sem vírgula, cada palavra é um sobrenome.
 */
export function parseSobrenomesBebe(texto: string): { itens: string[]; invalidos: string[] } {
  const bruto = texto.trim();
  if (!bruto) return { itens: [], invalidos: [] };
  const pedacos = /[,;]| e /i.test(bruto) ? bruto.split(/[,;]| e /i) : bruto.split(/\s+/);
  const itens: string[] = [];
  const invalidos: string[] = [];
  for (const p of pedacos) {
    if (!p.trim()) continue;
    const ok = limparParte(p);
    if (ok) itens.push(ok);
    else invalidos.push(p.trim().slice(0, 30));
  }
  return { itens: itens.slice(0, BEBE_MAX_SOBRENOMES), invalidos };
}

/** Nomes que os pais já pensaram: separados por vírgula, ponto e vírgula ou linha. */
export function parseNomesPais(texto: string): { itens: string[]; invalidos: string[]; excedeu: boolean } {
  const pedacos = texto.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const itens: string[] = [];
  const invalidos: string[] = [];
  for (const p of pedacos) {
    const ok = limparParte(p);
    if (ok) itens.push(ok);
    else invalidos.push(p.slice(0, 30));
  }
  return { itens: itens.slice(0, BEBE_MAX_NOMES_PAIS), invalidos, excedeu: itens.length > BEBE_MAX_NOMES_PAIS };
}

export interface DadosBebe {
  data: string;
  sobrenomes: string[];
  nomesPais: string[];
  /** Só para "já nasceu e já foi registrado". */
  nomeRegistrado: string | null;
}

/** Resumo mostrado como a resposta da pessoa no chat (sem expor mais do que o necessário). */
export function resumoDadosBebe(d: DadosBebe): string {
  const partes: string[] = [d.data];
  if (d.nomeRegistrado) {
    partes.push(`nome registrado: ${d.nomeRegistrado}`);
  } else {
    if (d.sobrenomes.length > 0) partes.push(`sobrenome${d.sobrenomes.length > 1 ? 's' : ''}: ${d.sobrenomes.join(' ')}`);
    if (d.nomesPais.length > 0) partes.push(`${d.nomesPais.length} nome${d.nomesPais.length > 1 ? 's' : ''} em mente`);
  }
  return partes.join(' · ');
}

// ── Avisos informativos ──────────────────────────────────────────────────────

/**
 * Avisos só informativos, sem prazo em número: as regras de registro e de mudança de nome
 * dependem da lei e do cartório. Os prazos exatos só entram depois de confirmados com advogado.
 */
export const AVISO_BEBE_SEM_REGISTRO_TEXT =
  'Uma informação importante: o registro do nome do bebê segue as regras do cartório da sua cidade, inclusive o prazo para registrar. ' +
  'Este aviso é só informativo: para decidir, confirme no cartório ou converse com um advogado de sua confiança.';

export const AVISO_BEBE_REGISTRADO_TEXT =
  'Uma informação importante: depois do registro, mudar o nome do bebê tem regras próprias e pode exigir procedimento no cartório. ' +
  'Aqui você vê a leitura do nome já escolhido. Este aviso é só informativo: para qualquer mudança, converse com um advogado de sua confiança.';

export function avisoBebePorSituacao(situacao: string | null | undefined): string | null {
  if (situacao === 'nasceu_sem_registro') return AVISO_BEBE_SEM_REGISTRO_TEXT;
  if (situacao === 'nasceu_registrado') return AVISO_BEBE_REGISTRADO_TEXT;
  return null;
}

// ── Seções do resultado (chat) ───────────────────────────────────────────────

export type GrupoBebeChat = 'seu' | 'menina' | 'menino' | 'neutro';

export const TITULO_SECAO_BEBE: Record<GrupoBebeChat, { titulo: string; dica: string }> = {
  seu: { titulo: 'Os nomes que vocês pensaram', dica: 'A leitura de cada nome que você trouxe, no mapa do bebê.' },
  menina: { titulo: 'Sugestões para menina', dica: 'Nomes que combinam com o mapa do bebê.' },
  menino: { titulo: 'Sugestões para menino', dica: 'Nomes que combinam com o mapa do bebê.' },
  neutro: { titulo: 'Nomes neutros', dica: 'Servem para menina ou menino.' },
};
