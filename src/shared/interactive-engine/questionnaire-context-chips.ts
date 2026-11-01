/**
 * Chips "Seu contexto" a partir das respostas persistidas do questionário.
 */

export interface QuestionnaireContextInput {
  nomeUsoBase: string | null;
  sobrenomesObrigatorios: string[];
  relacaoNome: string | null;
  ondeAssinaRaw: string[];
  nomeArtistico: string | null;
  estiloPresenca: string[];
  areaFoco: string | null;
  subfocosOrdenados: string[];
  aberturaMudanca: string | null;
}

const RELACAO_LABELS: Record<string, string> = {
  gosto_muito: 'Gosto muito',
  falta_algo: 'Gosto, mas sinto que falta algo',
  nao_representa: 'Não me representa',
  nunca_pensei: 'Nunca pensei nisso',
};

const ONDE_LABELS: Record<string, string> = {
  contratos_documentos: 'Contratos e documentos',
  redes_sociais: 'Redes sociais',
  email_cartao: 'E-mail e cartão',
  marca_negocio: 'Minha marca ou negócio',
  arte_criativo: 'Arte ou trabalho criativo',
};

const ESTILO_PRESENCA_LABELS: Record<string, string> = {
  firme_confiavel: 'Firme e confiável',
  leve_acolhimento: 'Leveza e acolhimento',
  criatividade: 'Criatividade marcante',
  elegancia_discreta: 'Elegância discreta',
};

const AREA_LABELS: Record<string, string> = {
  prosperidade_financeira: 'Dinheiro e prosperidade',
  carreira_negocios: 'Carreira e negócios',
  relacionamentos_harmonia: 'Relacionamentos',
  autoestima_expressao: 'Autoestima e expressão',
};

const ABERTURA_LABELS: Record<string, string> = {
  quase_nada: 'Quase nada, só um detalhe',
  acento_ou_letra: 'Um acento ou letra a mais',
  tirar_trocar_sobrenome: 'Tirar ou trocar um sobrenome',
  o_que_fizer_sentido: 'O que fizer sentido',
};

const SUBFOCO_LABELS: Record<string, string> = {
  reter_ganhos: 'Ganho, mas não sobra',
  aumentar_renda: 'Quero ganhar mais',
  organizar_estabilidade: 'Quero organizar',
  fechar_contratos: 'Medo de arriscar',
  lideranca_promocao: 'Buscando reconhecimento',
  novo_ciclo_profissional: 'Mudando de área',
  foco_execucao: 'Quero crescer onde estou',
  harmonia_afetiva: 'Amor',
  paz_familiar: 'Família',
  novas_conexoes: 'Amizades',
  voz_seguranca: 'Trabalho em equipe',
  autoconfianca_identidade: 'Mais confiança',
};

export function buildQuestionnaireContextChips(collect: QuestionnaireContextInput): string[] {
  const chips: string[] = [];

  if (collect.nomeUsoBase?.trim()) chips.push(collect.nomeUsoBase.trim());
  for (const s of collect.sobrenomesObrigatorios) chips.push(s);
  if (collect.relacaoNome && RELACAO_LABELS[collect.relacaoNome]) {
    chips.push(RELACAO_LABELS[collect.relacaoNome]!);
  }
  for (const id of collect.ondeAssinaRaw) {
    if (ONDE_LABELS[id]) chips.push(ONDE_LABELS[id]!);
  }
  if (collect.nomeArtistico?.trim()) chips.push(collect.nomeArtistico.trim());
  for (const id of collect.estiloPresenca) {
    if (ESTILO_PRESENCA_LABELS[id]) chips.push(ESTILO_PRESENCA_LABELS[id]!);
  }
  if (collect.areaFoco && AREA_LABELS[collect.areaFoco]) {
    chips.push(AREA_LABELS[collect.areaFoco]!);
  }
  for (const id of collect.subfocosOrdenados) {
    if (SUBFOCO_LABELS[id]) chips.push(SUBFOCO_LABELS[id]!);
  }
  if (collect.aberturaMudanca && ABERTURA_LABELS[collect.aberturaMudanca]) {
    chips.push(ABERTURA_LABELS[collect.aberturaMudanca]!);
  }

  return [...new Set(chips)];
}
