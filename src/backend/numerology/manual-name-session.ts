import { randomUUID } from 'node:crypto';
import { NOME_SOCIAL_MAX_MANUAIS, normalizarChaveNome, validarNomeManual } from '../../shared/nome-social/manual-name-limits';
import type { CandidateSuggestion } from '../../frontend/components/app/chat/chat-types';

export interface ManualNameContext {
  nomeNascimento: string;
  dataNascimento: string;
  areaFoco: string | null;
  ondeAssinaRaw: string[];
  analysisId?: string;
}
interface Session {
  owner: string;
  chatKey: string;
  context: ManualNameContext;
  expiresAt: number;
  existing: Set<string>;
  results: Map<string, CandidateSuggestion>;
}
export class ManualNameSessionError extends Error {
  constructor(public code: 'expired' | 'limit' | 'invalid' | 'context' | 'capacity') { super(code); }
}

/**
 * Cota de sessão efêmera, sem tabela ou credencial nova. A avaliação é síncrona:
 * consulta, cálculo e contabilização ocorrem sem await, inclusive em cliques concorrentes.
 * IDs desconhecidos/expirados falham fechados, inclusive após reinício/troca de worker.
 */
export class ManualNameSessions {
  private sessions = new Map<string, Session>();
  constructor(private now = () => Date.now(), private ttl = 24 * 60 * 60 * 1000) {}

  start(owner: string, chatKey: string, context: ManualNameContext, existing: string[]): string {
    for (const [id, s] of this.sessions) if (s.expiresAt <= this.now()) this.sessions.delete(id);
    for (const [id, s] of this.sessions) {
      if (s.owner === owner && s.chatKey === chatKey) {
        if (JSON.stringify(s.context) !== JSON.stringify(context)) throw new ManualNameSessionError('context');
        existing.forEach(n => s.existing.add(normalizarChaveNome(n)));
        return id;
      }
    }
    if (this.sessions.size >= 1000) throw new ManualNameSessionError('capacity');
    const id = randomUUID();
    this.sessions.set(id, { owner, chatKey, context, expiresAt: this.now() + this.ttl, existing: new Set(existing.map(normalizarChaveNome)), results: new Map() });
    return id;
  }

  get(owner: string, id: string): Session {
    const s = this.sessions.get(id);
    if (!s || s.owner !== owner || s.expiresAt <= this.now()) throw new ManualNameSessionError('expired');
    return s;
  }

  evaluate(owner: string, id: string, nome: string, calculate: (context: ManualNameContext) => CandidateSuggestion) {
    const s = this.get(owner, id);
    if (validarNomeManual(nome)) throw new ManualNameSessionError('invalid');
    const key = normalizarChaveNome(nome);
    const previous = s.results.get(key);
    if (previous || s.existing.has(key)) return { duplicata: true, chave: key, candidate: previous, used: s.results.size };
    if (s.results.size >= NOME_SOCIAL_MAX_MANUAIS) throw new ManualNameSessionError('limit');
    // Se calculate lançar erro, não altera resultados nem quota.
    const candidate = calculate(s.context);
    s.results.set(key, candidate);
    return { duplicata: false, chave: key, candidate, used: s.results.size };
  }
}

export const manualNameSessions = new ManualNameSessions();
