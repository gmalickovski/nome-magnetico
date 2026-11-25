import type { QuestionnaireStepId } from '../questionnaire-adaptive';
import type { InterviewLine } from './schemas';

/** Mapeia passos do questionário para linhas de entrevista DEV-274. */
export const STEP_TO_INTERVIEW_LINE: Record<QuestionnaireStepId, InterviewLine> = {
  nome_uso: 'uso',
  sobrenomes_uso: 'sobrenomes',
  relacao_nome: 'identidade',
  onde_assina: 'uso',
  estilo_presenca: 'identidade',
  area_foco: 'objetivos',
  subfoco: 'objetivos',
  abertura_mudanca: 'tolerancia_mudanca',
  // DEV-303
  preferencias_assinatura: 'tolerancia_mudanca',
  prioridade_conflito: 'tolerancia_mudanca',
  // DEV-320 (fora do roteiro do mock adaptativo; mapeados só para completar o tipo)
  motivo_harmonizacao: 'objetivos',
  area_artistica: 'objetivos',
  detalhe_artistico: 'identidade',
  genero_persona: 'identidade',
  imagem_artistica: 'identidade',
  tipo_nome_artistico: 'tolerancia_mudanca',
  outros_usos: 'uso',
  // DEV-326
  bebe_pais: 'sobrenomes',
  bebe_situacao: 'objetivos',
  bebe_data_tipo: 'objetivos',
  bebe_sexo: 'identidade',
  bebe_dados: 'sobrenomes',
  bebe_estilo: 'identidade',
};

export const INTERVIEW_LINE_ORDER: InterviewLine[] = [
  'objetivos',
  'identidade',
  'uso',
  'sobrenomes',
  'tolerancia_mudanca',
];
