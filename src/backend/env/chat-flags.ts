import { readServerEnv } from './runtime';

/**
 * Fluxo com a pergunta de caminho (harmonizar o meu nome, nome artístico, nome do bebê),
 * DEV-320 e DEV-326. Ligado por padrão; `NM_CHAT_MOTIVO_ARTISTICO=false`, `0` ou `off` desliga e
 * volta ao roteiro da DEV-303. Lido no servidor (páginas e endpoints); o chat recebe por prop.
 */
export function isFluxoMotivoAtivo(): boolean {
  const raw = (readServerEnv('NM_CHAT_MOTIVO_ARTISTICO') ?? '').toLowerCase();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}
