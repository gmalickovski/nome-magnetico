/**
 * Fluxo da votação do próximo produto (DEV-316). Funções puras, sem React e sem rede.
 *
 * Regra: o voto só é contado e o evento só sai DEPOIS da confirmação e da resposta de
 * sucesso da API. Cancelar, fechar ou Escape antes de confirmar não envia nada.
 */

export type VoteOptionId = 'nome_bebe' | 'nome_empresa' | 'outro';

export const VOTE_INTRO_COPY = 'Escolha uma opção e confirme seu voto. Não precisa de cadastro.';

/**
 * `rejected`: a API respondeu com erro. O voto não foi somado (um único incremento atômico),
 *   então tentar de novo é seguro.
 * `unknown`: a resposta se perdeu (rede, tempo esgotado). Não sabemos se o voto foi somado e,
 *   sem chave de idempotência no servidor, não prometemos que repetir seja seguro.
 */
export type VoteFailureKind = 'rejected' | 'unknown';

export interface VoteFailure {
  kind: VoteFailureKind;
  message: string;
}

export const VOTE_GENERIC_REJECTED = 'Não foi possível registrar seu voto agora. Tente de novo em instantes.';

export const VOTE_UNKNOWN_RESULT =
  'Não conseguimos confirmar se o seu voto foi registrado. Verifique sua conexão. Se tentar de novo, o voto pode ser contado mais de uma vez.';

/** Erro devolvido pela API: usa a mensagem dela quando existir. */
export function failureFromResponse(status: number, body: unknown): VoteFailure {
  const fromApi =
    body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
      ? (body as { error: string }).error.trim()
      : '';
  if (status === 429) {
    return { kind: 'rejected', message: fromApi || 'Muitos votos vindos desta conexão. Tente de novo mais tarde.' };
  }
  return { kind: 'rejected', message: fromApi || VOTE_GENERIC_REJECTED };
}

/** Falha sem resposta da API: resultado desconhecido. */
export function failureFromNetwork(): VoteFailure {
  return { kind: 'unknown', message: VOTE_UNKNOWN_RESULT };
}

export interface SubmitVoteDeps {
  fetchImpl: typeof fetch;
  /** Disparado só depois do sucesso confirmado. */
  onSuccessEvent?: (option: VoteOptionId) => void;
}

export type SubmitVoteResult = { ok: true } | { ok: false; failure: VoteFailure };

/**
 * Envia UM voto. Sem cookies, sem dados pessoais, sem retry automático.
 * O evento de analytics só sai se a API confirmar.
 */
export async function submitVote(option: VoteOptionId, deps: SubmitVoteDeps): Promise<SubmitVoteResult> {
  let res: Response;
  try {
    res = await deps.fetchImpl('/api/product-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ option }),
    });
  } catch {
    return { ok: false, failure: failureFromNetwork() };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, failure: failureFromResponse(res.status, body) };
  }
  try {
    deps.onSuccessEvent?.(option);
  } catch {
    // analytics nunca quebra a UI nem desfaz o voto
  }
  return { ok: true };
}
