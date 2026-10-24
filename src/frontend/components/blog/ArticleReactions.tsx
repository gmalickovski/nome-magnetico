import React, { useState, useEffect, useCallback } from 'react';
import { readLocalStorage, writeLocalStorage } from '../../../utils/browser-storage';

// ── Constantes ──────────────────────────────────────────────────────────────

const REACTIONS = [
  { key: 'heart', emoji: '❤️', label: 'Amei' },
  { key: 'fire',  emoji: '🔥', label: 'Incrível' },
  { key: 'think', emoji: '🤔', label: 'Fez pensar' },
  { key: 'star',  emoji: '✨', label: 'Inspirador' },
] as const;

type ReactionKey = typeof REACTIONS[number]['key'];
type Counts = Record<ReactionKey, number>;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Gera ou recupera um UUID de sessão anônimo armazenado no localStorage */
function getSessionId(): string {
  const existing = readLocalStorage('blog-session-id');
  if (existing) return existing;
  const id = crypto.randomUUID();
  writeLocalStorage('blog-session-id', id);
  return id;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Componente ───────────────────────────────────────────────────────────────

interface Props {
  slug: string;
}

export function ArticleReactions({ slug }: Props) {
  const [counts, setCounts]           = useState<Counts>({ heart: 0, fire: 0, think: 0, star: 0 });
  const [myReactions, setMyReactions] = useState<Set<ReactionKey>>(new Set());
  const [loading, setLoading]         = useState(true);
  const [pending, setPending]         = useState<ReactionKey | null>(null);

  // Carrega contagens iniciais + reactions da sessão atual
  useEffect(() => {
    const sessionId = getSessionId();

    async function load() {
      try {
        const [countsRes, myRes] = await Promise.all([
          fetch(`/api/blog/reactions?slug=${encodeURIComponent(slug)}`),
          fetch(`/api/blog/reactions?slug=${encodeURIComponent(slug)}&session=${encodeURIComponent(sessionId)}`),
        ]);

        if (countsRes.ok) {
          const data = await countsRes.json();
          setCounts(data);
        }

        // Recupera quais reactions desta sessão estão salvas localmente
        // (o GET não filtra por sessão — usamos localStorage para isso)
        const saved = readLocalStorage(`blog-reactions-${slug}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ReactionKey[];
            setMyReactions(new Set(parsed));
          } catch { /* ignora */ }
        }
      } catch {
        // Falha silenciosa — não quebra a página
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  const handleReact = useCallback(async (key: ReactionKey) => {
    if (pending) return; // debounce
    const sessionId = getSessionId();

    setPending(key);

    // Optimistic update
    const isRemoving = myReactions.has(key);
    const newMyReactions = new Set(myReactions);
    if (isRemoving) {
      newMyReactions.delete(key);
    } else {
      newMyReactions.add(key);
    }
    setMyReactions(newMyReactions);
    setCounts(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + (isRemoving ? -1 : 1)),
    }));

    // Persiste localmente (UX instantânea em reloads)
    writeLocalStorage(`blog-reactions-${slug}`, JSON.stringify([...newMyReactions]));

    try {
      const res = await fetch('/api/blog/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, reaction: key, session_id: sessionId }),
      });

      if (res.ok) {
        const { counts: fresh } = await res.json();
        setCounts(fresh);
      }
    } catch {
      // Reverte o optimistic update em caso de falha de rede
      setMyReactions(myReactions);
      setCounts(prev => ({
        ...prev,
        [key]: Math.max(0, prev[key] + (isRemoving ? 1 : -1)),
      }));
      writeLocalStorage(`blog-reactions-${slug}`, JSON.stringify([...myReactions]));
    } finally {
      setPending(null);
    }
  }, [slug, myReactions, pending]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-1">
        {REACTIONS.map(r => (
          <div
            key={r.key}
            className="h-9 w-20 rounded-full bg-white/4 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const hasAny = Object.values(counts).some(v => v > 0);

  return (
    <div className="space-y-3">
      <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest">
        O que achou deste artigo?
      </p>

      <div className="flex flex-wrap gap-2.5">
        {REACTIONS.map(r => {
          const active  = myReactions.has(r.key);
          const isPend  = pending === r.key;
          const count   = counts[r.key];

          return (
            <button
              key={r.key}
              onClick={() => handleReact(r.key)}
              disabled={!!pending}
              title={r.label}
              aria-label={`${r.label}${count > 0 ? ` (${count})` : ''}`}
              aria-pressed={active}
              className={`
                group relative flex items-center gap-2 px-3.5 py-2 rounded-full
                transition-all duration-500 select-none
                ${active
                  ? 'bg-[#D4AF37]/12 border border-[#D4AF37]/35 text-[#D4AF37]'
                  : 'bg-white/4 border border-white/8 text-gray-400 hover:border-white/20 hover:text-gray-200 hover:bg-white/6'
                }
                ${isPend ? 'scale-95 opacity-70' : 'hover:scale-[1.04] active:scale-95'}
                disabled:cursor-not-allowed
              `}
            >
              {/* Emoji com animação de bounce no clique */}
              <span
                className={`text-base leading-none transition-transform duration-300 ${
                  isPend ? 'scale-125' : 'group-hover:scale-110'
                }`}
                aria-hidden="true"
              >
                {r.emoji}
              </span>

              {/* Label */}
              <span className="text-xs font-medium leading-none whitespace-nowrap">
                {r.label}
              </span>

              {/* Contagem — só aparece quando > 0 */}
              {count > 0 && (
                <span
                  className={`text-xs font-semibold leading-none transition-colors ${
                    active ? 'text-[#D4AF37]' : 'text-gray-500'
                  }`}
                >
                  {formatCount(count)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mensagem de agradecimento quando usuário reagiu */}
      {myReactions.size > 0 && (
        <p className="text-gray-700 text-xs transition-all duration-700">
          Obrigado pelo feedback ✦
        </p>
      )}
    </div>
  );
}
