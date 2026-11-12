import { z } from 'zod';
import { QUESTIONNAIRE_STEP_ORDER } from '../questionnaire-adaptive';

export const interviewLineSchema = z.enum([
  'objetivos',
  'uso',
  'identidade',
  'sobrenomes',
  'tolerancia_mudanca',
  'contradicao',
]);

export const adaptiveAnswerSchema = z.object({
  stepId: z.enum(QUESTIONNAIRE_STEP_ORDER as [string, ...string[]]),
  optionIds: z.array(z.string().max(80)).max(5).optional(),
  freeText: z.string().max(500).optional(),
});

export const adaptiveInterviewRequestSchema = z.object({
  sessionId: z.string().min(8).max(64),
  nomeCompleto: z.string().min(2).max(150),
  dataNascimento: z.string().min(8).max(20),
  startedAtMs: z.number().int().positive().optional(),
  answers: z.array(adaptiveAnswerSchema).max(30),
  /** Corrigir resposta de um passo já respondido */
  correctStepId: z
    .enum(QUESTIONNAIRE_STEP_ORDER as [string, ...string[]])
    .optional(),
  numerologySnapshot: z
    .object({
      destino: z.number().int().min(1).max(33),
      notaHoje: z.number().min(0).max(100),
      potencial: z.number().min(0).max(100),
    })
  .optional(),
  profileConfirmed: z.boolean().optional(),
  profileEdits: z.record(z.string(), z.string().max(300)).optional(),
});

export type AdaptiveInterviewRequest = z.infer<typeof adaptiveInterviewRequestSchema>;
export type AdaptiveAnswer = z.infer<typeof adaptiveAnswerSchema>;
export type InterviewLine = z.infer<typeof interviewLineSchema>;
