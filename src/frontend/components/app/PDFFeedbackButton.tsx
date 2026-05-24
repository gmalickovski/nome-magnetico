import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { track } from '../../lib/analytics';

interface Props {
  analysisId: string;
  productType: string;
  isFree?: boolean;
  fabOnly?: boolean;
  /** URL direta do PDF — se fornecida, substitui /api/generate-pdf?id=... */
  pdfUrl?: string;
  /** Texto do botão (desktop) */
  label?: string;
  /** Classe CSS do botão desktop — sobrescreve o padrão */
  className?: string;
  /** Exibe o FAB mobile (padrão: true) */
  showFab?: boolean;
  /** Dispara o download automaticamente ao montar o componente */
  autoDownload?: boolean;
  /** Se a análise foi gerada por um analista */
  isAnalyst?: boolean;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function PDFFeedbackButton({
  analysisId,
  productType,
  isFree = false,
  fabOnly = false,
  pdfUrl,
  label,
  className,
  showFab = true,
  autoDownload = false,
  isAnalyst = false,
}: Props) {
  const [modalOpen, setModalOpen]         = useState(false);
  const [status, setStatus]               = useState<Status>('idle');
  const [elapsed, setElapsed]             = useState(0);
  const [rating, setRating]               = useState(0);
  const [hover, setHover]                 = useState(0);
  const [comment, setComment]             = useState('');
  const [feedbackSent, setFeedbackSent]   = useState(false);
  const [feedbackError, setFeedbackError] = useState(false);
  const [mounted, setMounted]             = useState(false);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const fabRef       = useRef<HTMLButtonElement | null>(null);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const upsellViewed = useRef(false);

  // Garante que o portal só monta no client (SSR safe)
  useEffect(() => { setMounted(true); }, []);

  // Auto-download ao montar quando solicitado (primeiro login via landing page)
  useEffect(() => {
    if (autoDownload) {
      const t = setTimeout(() => handleDownload(), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opacidade do FAB ao rolar / interagir (só na instância fabOnly)
  useEffect(() => {
    if (!fabOnly) return;
    const btn = fabRef.current;
    if (!btn) return;
    const fade = () => {
      btn.style.opacity = '0.3';
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
      restoreTimer.current = setTimeout(() => { btn.style.opacity = '1'; }, 800);
    };
    ['scroll', 'touchstart', 'touchmove'].forEach(ev =>
      window.addEventListener(ev, fade, { passive: true }),
    );
    return () => {
      ['scroll', 'touchstart', 'touchmove'].forEach(ev =>
        window.removeEventListener(ev, fade),
      );
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    };
  }, [fabOnly]);

  // Timer de segundos decorridos durante o loading
  useEffect(() => {
    if (status === 'loading') {
      setElapsed(0);
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status]);

  // Trava scroll do body somente via overflow — sem position:fixed para não quebrar stacking context
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  useEffect(() => {
    if (!isFree || status !== 'done' || upsellViewed.current) return;
    upsellViewed.current = true;
    track('upsell_view', { produto: 'nome_social', origem: 'pdf_download_modal' });
  }, [isFree, status]);

  function closeModal() {
    setModalOpen(false);
    setTimeout(() => {
      if (status !== 'loading') {
        setStatus('idle');
        setElapsed(0);
        setRating(0);
        setComment('');
        setFeedbackSent(false);
        setFeedbackError(false);
      }
    }, 300);
  }

  async function handleDownload() {
    setModalOpen(true);
    setStatus('loading');
    setFeedbackSent(false);
    setFeedbackError(false);

    try {
      // Usa pdfUrl direto se fornecido; senão constrói via analysisId
      const baseUrl = pdfUrl ?? `/api/generate-pdf?id=${analysisId}`;
      const resolvedUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

      // Detecta se o usuário está em um dispositivo móvel
      const isMobile = /iPad|iPhone|iPod|android|webos|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent || navigator.vendor || (window as any).opera
      );

      if (isMobile) {
        // No mobile, faz um fetch inicial para "aquecer" o servidor (gera o PDF na API)
        // Isso permite exibir a tela de loading enquanto a API faz o cálculo pesado.
        const res = await fetch(resolvedUrl, {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        if (!res.ok) throw new Error('pdf_error');

        // Uma vez concluído, redirecionamos para a rota para que o download seja disparado
        // nativamente pelo navegador, sem problemas de popup blocker ou restrição de blob no WebView.
        // Graças ao cache temporário de 15s no servidor, o download inicia imediatamente!
        window.location.href = resolvedUrl;

        setStatus('done');
        track('pdf_downloaded', { produto: productType as never });
      } else {
        // No desktop, mantemos o fluxo de Blob forçado via elemento <a> que funciona perfeitamente
        const res = await fetch(resolvedUrl, {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        if (!res.ok) throw new Error('pdf_error');

        const disposition = res.headers.get('Content-Disposition') ?? '';
        const filenameMatch = disposition.match(/filename="([^"]+)"/);
        let filename = filenameMatch?.[1] ?? `analise-${productType}-nome-magnetico.pdf`;

        // Adiciona um sufixo temporal AAAAMMDD-HHMM para evitar colisões e cache local agressivo no OS
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timeStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
        filename = filename.replace('.pdf', `-${timeStr}.pdf`);

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus('done');
        track('pdf_downloaded', { produto: productType as never });
      }
    } catch {
      setStatus('error');
    }
  }

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!rating && !comment.trim()) return;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id:  analysisId || undefined,
          product_type: productType,
          is_free:      isFree,
          rating:       rating || undefined,
          comment:      comment.trim() || undefined,
        }),
      });
      setFeedbackSent(true);
    } catch {
      setFeedbackError(true);
    }
  }

  const downloadIcon = (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );

  // ── Modal via Portal — renderiza direto no document.body, escapando
  //    qualquer stacking context de pai (header fixo, transforms, etc.)
  const modal = mounted && modalOpen ? createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.58)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && status !== 'loading') closeModal(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '16px',
          padding: '24px',
          background: '#111111',
          border: '1px solid rgba(212,175,55,0.20)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* ── Status: loading / done / error ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {status === 'loading' && (
              <svg style={{ width: '32px', height: '32px', color: '#D4AF37', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {status === 'done' && (
              <svg style={{ width: '32px', height: '32px', color: isAnalyst ? '#10b981' : '#D4AF37' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status === 'error' && (
              <svg style={{ width: '32px', height: '32px', color: '#f87171' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {status === 'loading' && (
              <>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#e5e2e1', margin: 0 }}>
                  {isAnalyst ? 'Baixando análise...' : 'Preparando seu documento…'}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                  {isAnalyst ? 'Aguarde um instante...' : (elapsed < 3 ? 'Iniciando geração do PDF' : elapsed < 10 ? 'Montando as seções da análise' : 'Quase lá, finalizando…')}
                  {' '}<span style={{ color: '#4b5563' }}>({elapsed}s)</span>
                </p>
              </>
            )}
            {status === 'done' && (
              <>
                <p style={{ fontSize: '14px', fontWeight: 700, color: isAnalyst ? '#10b981' : '#D4AF37', margin: 0 }}>
                  {isAnalyst ? 'Download concluído!' : 'Documento pronto!'}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                  {isAnalyst ? 'Download realizado com sucesso.' : 'Download iniciado automaticamente.'}
                </p>
              </>
            )}
            {status === 'error' && (
              <>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', margin: 0 }}>Erro ao gerar PDF</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Tente novamente ou entre em contato com o suporte.</p>
              </>
            )}
          </div>

          {status !== 'loading' && (
            <button
              onClick={closeModal}
              style={{ flexShrink: 0, width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}
              aria-label="Fechar"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Divider ── */}
        {status !== 'error' && !isAnalyst && (
          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.15), transparent)' }} />
        )}

        {isFree && status === 'done' && !isAnalyst && (
          <div
            style={{
              borderRadius: '14px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(190,165,255,0.08))',
              outline: '1px solid rgba(212,175,55,0.22)',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>
              Próximo passo
            </p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#e5e2e1', margin: '0 0 6px', lineHeight: 1.35 }}>
              Seu diagnóstico mostrou o mapa. O Nome Social mostra a solução.
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 12px', lineHeight: 1.5 }}>
              Veja quais variações do seu nome reduzem bloqueios, melhoram o score e geram um PDF completo com ranking, arcanos e guia de ativação.
            </p>
            <a
              href="/nome-social"
              onClick={() => track('cta_pdf_download_upsell_nome_social', { produto: 'nome_social', origem: 'pdf_download_modal' })}
              style={{
                display: 'inline-flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                background: '#D4AF37',
                color: '#131313',
                padding: '11px 14px',
                fontSize: '12px',
                fontWeight: 800,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Fazer Minha Análise Completa
            </a>
          </div>
        )}

        {/* ── Formulário de feedback ── */}
        {status !== 'error' && !feedbackSent && !isAnalyst && (
          <form onSubmit={handleFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#e5e2e1', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                Enquanto isso, nos diga o que achou
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                Sua opinião nos ajuda a melhorar as análises e a experiência da plataforma.
              </p>
            </div>

            {/* Estrelas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} role="group" aria-label="Avaliação de 1 a 5 estrelas">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s', transform: 'scale(1)' }}
                  aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                >
                  <svg style={{ width: '24px', height: '24px', transition: 'color 0.15s' }}
                    fill={(hover || rating) >= star ? '#D4AF37' : 'none'}
                    stroke={(hover || rating) >= star ? '#D4AF37' : '#4b4b4b'}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              ))}
              {rating > 0 && (
                <span style={{ fontSize: '12px', color: '#D4AF37', marginLeft: '4px', fontWeight: 500 }}>
                  {['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente!'][rating]}
                </span>
              )}
            </div>

            {/* Textarea */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Deixe um comentário ou sugestão (opcional)…"
              rows={3}
              maxLength={1000}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#e5e2e1',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />

            <button
              type="submit"
              disabled={!rating && !comment.trim()}
              style={{
                width: '100%',
                border: '1px solid rgba(212,175,55,0.40)',
                color: '#D4AF37',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '10px',
                borderRadius: '12px',
                background: 'transparent',
                cursor: 'pointer',
                opacity: (!rating && !comment.trim()) ? 0.3 : 1,
                transition: 'background 0.2s',
              }}
            >
              Enviar feedback
            </button>
          </form>
        )}

        {/* ── Feedback enviado ── */}
        {feedbackSent && !isAnalyst && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#D4AF37', margin: '0 0 4px' }}>Obrigado pelo feedback! ✦</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Sua opinião é muito importante para nós.</p>
          </div>
        )}

        {/* ── Erro ao enviar feedback ── */}
        {feedbackError && !isAnalyst && (
          <p style={{ fontSize: '12px', color: '#f87171', textAlign: 'center', margin: 0 }}>Não foi possível enviar o feedback agora.</p>
        )}

        {/* ── Botão Fechar para Analista ── */}
        {isAnalyst && status !== 'loading' && (
          <button
            onClick={closeModal}
            style={{
              width: '100%',
              background: '#D4AF37',
              color: '#131313',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '11px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'background 0.2s',
            }}
          >
            Fechar
          </button>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* ── Botão desktop (omitido quando fabOnly) ── */}
      {!fabOnly && (
        <button
          onClick={handleDownload}
          className={
            className ??
            'hidden md:inline-flex items-center gap-2 bg-[#D4AF37] text-[#131313] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-[0_2px_16px_rgba(212,175,55,0.35)] hover:bg-[#f2ca50] hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)] active:scale-95 transition-all duration-300'
          }
        >
          {downloadIcon}
          {label ?? 'Baixar Análise Completa'}
        </button>
      )}

      {/* ── FAB mobile (condicional via showFab) ── */}
      {showFab && (
        <button
          ref={fabRef}
          onClick={handleDownload}
          className="md:hidden fixed bottom-[116px] left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 bg-[#D4AF37] text-[#131313] text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full shadow-[0_4px_24px_rgba(212,175,55,0.4)] hover:bg-[#f2ca50] hover:shadow-[0_4px_32px_rgba(212,175,55,0.55)] active:scale-95 transition-all duration-300"
          style={{ opacity: 1, transition: 'opacity 0.4s ease, background-color 0.3s, box-shadow 0.3s, transform 0.1s' }}
          id="pdf-download-btn"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {label ?? 'Baixar Análise Completa'}
        </button>
      )}

      {/* ── Modal (Portal → document.body) ── */}
      {modal}
    </>
  );
}
