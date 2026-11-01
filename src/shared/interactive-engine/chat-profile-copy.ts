/**
 * Copy do chat conversacional (palpite de perfil + pós-escolha) — Growth/Marca/Marketing.
 * Palpite pré-escolha: sem números. Pós-escolha: só dados do motor.
 */

import type { AreaFocoNomeMagnetico, SubfocoMomento } from './primitives';
import { SUBFOCO_QUESTIONS_BY_AREA } from './copy';

const AREA_LABEL: Record<AreaFocoNomeMagnetico, string> = {
  prosperidade_financeira: 'finanças e prosperidade',
  carreira_negocios: 'carreira e negócios',
  relacionamentos_harmonia: 'relacionamentos e harmonia',
  autoestima_expressao: 'autoestima e expressão',
};

const ONDE_LABEL: Record<string, string> = {
  identidade_registro: 'documentos e registros oficiais',
  presenca_digital: 'redes sociais e presença digital',
  rotina_trabalho: 'trabalho, contratos e propostas',
  marca_autoria: 'marca pessoal e projetos autorais',
};

function primeiroNome(nome: string): string {
  const t = nome.trim().split(/\s+/).filter(Boolean);
  return t[0] ?? nome.trim();
}

function subfocoLabel(area: AreaFocoNomeMagnetico, subfoco: string | null | undefined): string | null {
  if (!subfoco) return null;
  const spec = SUBFOCO_QUESTIONS_BY_AREA[area];
  const opt = spec.options.find((o) => o.value === subfoco);
  return opt?.label ?? null;
}

export interface ProfilePalpiteInput {
  nomeCompleto: string;
  areaFoco: AreaFocoNomeMagnetico | null;
  subfocoMomento?: SubfocoMomento | string | null;
  ondeAssina?: string[];
  sobrenomesObrigatorios?: string[];
  sobrenomesExcluidos?: string[];
  relatoUsuario?: string;
  /** Texto após "O que faltou?" (Em parte / Não). */
  textoCorrecao?: string;
  alertaComplianceLegal?: boolean;
}

/**
 * Palpite de perfil montado só com respostas do chat — sem números cabalísticos.
 */
export function buildProfilePalpiteText(input: ProfilePalpiteInput): string {
  const nome = primeiroNome(input.nomeCompleto);
  const parts: string[] = [];

  if (input.alertaComplianceLegal) {
    parts.push(
      'A numerologia ajuda a organizar clareza na rotina, sem substituir cuidados de saúde.'
    );
  }

  if (input.textoCorrecao?.trim()) {
    const cor = input.textoCorrecao.trim();
    parts.push(`${nome}, ajustei o retrato com o que você contou: "${cor}".`);
  } else {
    parts.push(`${nome}, pelo que você contou até aqui:`);
  }

  if (input.areaFoco) {
    let areaLine = `seu foco agora é ${AREA_LABEL[input.areaFoco]}`;
    const sub = subfocoLabel(input.areaFoco, input.subfocoMomento ?? null);
    if (sub) areaLine += `, com prioridade em ${sub.toLowerCase()}`;
    parts.push(areaLine.charAt(0).toUpperCase() + areaLine.slice(1) + '.');
  }

  const onde = (input.ondeAssina ?? [])
    .map((id) => ONDE_LABEL[id])
    .filter(Boolean);
  if (onde.length > 0) {
    const lista =
      onde.length === 1
        ? onde[0]
        : `${onde.slice(0, -1).join(', ')} e ${onde[onde.length - 1]}`;
    parts.push(`Você pretende usar essa assinatura em ${lista}.`);
  }

  const keep = input.sobrenomesObrigatorios?.filter(Boolean) ?? [];
  const drop = input.sobrenomesExcluidos?.filter(Boolean) ?? [];
  if (keep.length > 0) {
    parts.push(`Quer manter ${keep.join(' e ')} na assinatura.`);
  }
  if (drop.length > 0) {
    parts.push(`Prefere não usar ${drop.join(' e ')} na assinatura.`);
  }

  const relato = input.relatoUsuario?.trim();
  if (relato && !input.textoCorrecao?.trim()) {
    parts.push(`No seu relato aparece: "${relato.length > 120 ? relato.slice(0, 117) + '...' : relato}".`);
  }

  parts.push('Esse retrato combina com o seu momento?');
  return parts.join(' ');
}

export interface PostChoicePanelSlice {
  expressao: number;
  destino: number;
  motivacao: number;
  missao: number;
  impressao: number;
  bloqueiosCount: number;
  compatibilidade?: string;
}

/** Uma ou duas frases pós-escolha usando apenas números dos painéis calculados. */
export function buildPostChoiceMotorInsight(
  birth: PostChoicePanelSlice,
  chosen: PostChoicePanelSlice
): string {
  const sentences: string[] = [];

  if (birth.expressao !== chosen.expressao) {
    sentences.push(
      `Sua Expressão passa de ${birth.expressao} para ${chosen.expressao}, ressoando com Destino ${chosen.destino}.`
    );
  } else if (birth.missao !== chosen.missao) {
    sentences.push(
      `Sua Missão vibracional ajusta de ${birth.missao} para ${chosen.missao}, com Destino ${chosen.destino} como referência.`
    );
  }

  if (birth.bloqueiosCount > chosen.bloqueiosCount) {
    const diff = birth.bloqueiosCount - chosen.bloqueiosCount;
    sentences.push(
      `Esta assinatura elimina ${diff} bloqueio${diff > 1 ? 's' : ''} que apareciam no nome de registro.`
    );
  } else if (
    sentences.length === 0 &&
    chosen.compatibilidade &&
    chosen.compatibilidade !== birth.compatibilidade
  ) {
    sentences.push(
      `A compatibilidade Expressão × Destino fica ${chosen.compatibilidade.replace(/_/g, ' ')} nesta opção.`
    );
  }

  return sentences.slice(0, 2).join(' ');
}

export function buildPostSuggestionChoiceBlock(params: {
  assinaturaEscolhida: string;
  notaHoje: number;
  notaEscolhida: number;
  birth: PostChoicePanelSlice;
  chosen: PostChoicePanelSlice;
}): string {
  const head = `Com ${params.assinaturaEscolhida}, a nota vai de ${params.notaHoje} para ${params.notaEscolhida}.`;
  const insight = buildPostChoiceMotorInsight(params.birth, params.chosen);
  return insight ? `${head} ${insight}` : head;
}

/** Palpite de perfil não deve conter dígitos (pré-escolha). */
export function profilePalpiteHasNoDigits(text: string): boolean {
  return !/\d/.test(text);
}
