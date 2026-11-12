/**
 * Orquestra entrevista adaptativa (JEV mock + escritor mock + resumo).
 */

import { runJevTypedMockDecision } from './jev-typed-mock';
import { writeQuestionMock } from './writer-mock';
import { buildProfileSummary } from './profile-summary';
import {
  checkSessionGuard,
  createSessionGuardState,
  recordQuestion,
  type SessionGuardState,
} from './session-guard';
import type { AdaptiveInterviewRequest } from './schemas';
import { isJevMockOnlyMode } from './config';

export interface AdaptiveInterviewStepResult {
  enabled: true;
  jevMockOnly: boolean;
  sessionGuard: SessionGuardState;
  sessionGuardOk: boolean;
  guardReason?: string;
  decision: ReturnType<typeof runJevTypedMockDecision>;
  writer: ReturnType<typeof writeQuestionMock>;
  profileSummary?: ReturnType<typeof buildProfileSummary>;
  allowCorrectAnswer: boolean;
  askedCount: number;
}

export function runAdaptiveInterviewStep(
  req: AdaptiveInterviewRequest,
  priorGuard?: SessionGuardState
): AdaptiveInterviewStepResult {
  const startedAt = req.startedAtMs ?? Date.now();
  let guard = priorGuard ?? createSessionGuardState(startedAt);
  const check = checkSessionGuard(guard);
  const decision = runJevTypedMockDecision(req);

  if (check.ok && decision.nextStepId !== 'resumo_perfil' && decision.nextStepId !== 'fim_coleta') {
    guard = recordQuestion(guard);
  }

  const writer = writeQuestionMock(req, decision);
  const profileSummary =
    decision.nextStepId === 'resumo_perfil' || decision.nextStepId === 'fim_coleta'
      ? buildProfileSummary(req)
      : undefined;

  return {
    enabled: true,
    jevMockOnly: isJevMockOnlyMode(),
    sessionGuard: guard,
    sessionGuardOk: check.ok,
    guardReason: check.ok ? undefined : check.message,
    decision,
    writer,
    profileSummary,
    allowCorrectAnswer: true,
    askedCount: guard.questionCount,
  };
}
