/**
 * LLM Escritor de Textos Curtos (DEV-235 · Leitura do momento).
 * Sem potencial/nota harmonizada antes da escolha de sugestão.
 */

import type { AreaFocoNomeMagnetico, SubfocoMomento } from './copy';
import { buildProfilePalpiteText } from './chat-profile-copy';
import { profilePalpiteHasNoDigits } from './chat-profile-copy';

export interface WriterHypothesisParams {
  nome: string;
  areaFoco: AreaFocoNomeMagnetico;
  destino: number;
  notaHoje: number;
  subfocoMomento?: SubfocoMomento | null;
  relatoUsuario?: string;
  alertaComplianceLegal?: boolean;
  ondeAssina?: string[];
}

function templateFallback(params: WriterHypothesisParams): string {
  return buildProfilePalpiteText({
    nomeCompleto: params.nome,
    areaFoco: params.areaFoco,
    subfocoMomento: params.subfocoMomento,
    ondeAssina: params.ondeAssina ?? [],
    relatoUsuario: params.relatoUsuario,
    alertaComplianceLegal: Boolean(params.alertaComplianceLegal),
  });
}

/** Pré-escolha: palpite de perfil sem números (LLM desativado — só template). */
export async function writeHypothesis(params: WriterHypothesisParams): Promise<string> {
  const fallback = templateFallback(params);
  if (!profilePalpiteHasNoDigits(fallback)) {
    return buildProfilePalpiteText({
      nomeCompleto: params.nome,
      areaFoco: params.areaFoco,
      relatoUsuario: params.relatoUsuario,
      alertaComplianceLegal: params.alertaComplianceLegal,
    });
  }
  return fallback;
}
