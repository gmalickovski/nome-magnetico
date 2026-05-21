/**
 * FreePDFAutoGenerator
 *
 * Gerencia o download do PDF da Análise Gratuita no painel do usuário.
 *
 * Comportamento:
 *  - existingAnalysisId fornecido → mostra botão de download direto.
 *  - autoRun=true + leadNome + leadData → cria análise automaticamente (primeiro login
 *    via landing page) e dispara o download assim que ficar pronto.
 *  - Sem dados → exibe link para a landing page de prévia.
 */

import { useState, useEffect, useRef } from 'react';
import { PDFFeedbackButton } from './PDFFeedbackButton';

interface Props {
  /** ID de análise já concluída — pula criação */
  existingAnalysisId?: string | null;
  /** Nome do lead para criação automática */
  leadNome?: string | null;
  /** Data de nascimento do lead (DD/MM/AAAA) */
  leadData?: string | null;
  /** Disparar criação + download automaticamente ao montar */
  autoRun?: boolean;
}

type Stage = 'ready' | 'creating' | 'error' | 'no_data';

export function FreePDFAutoGenerator({ existingAnalysisId, leadNome, leadData, autoRun }: Props) {
  const triggered = useRef(false);

  const initialStage: Stage = existingAnalysisId
    ? 'ready'
    : autoRun && leadNome && leadData
      ? 'creating'
      : 'no_data';

  const [stage, setStage]         = useState<Stage>(initialStage);
  const [analysisId, setAnalysisId] = useState<string | null>(existingAnalysisId ?? null);
  const [errorMsg, setErrorMsg]   = useState('');

  useEffect(() => {
    if (stage === 'creating' && !triggered.current) {
      triggered.current = true;
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function runAnalysis() {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type:     'analise_gratuita',
          nome_completo:    leadNome,
          data_nascimento:  leadData,
          nome_ja_escolhido: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao gerar análise.');

      const id = json.analysisId ?? json.id;
      if (!id) throw new Error('ID de análise não retornado.');

      setAnalysisId(id);
      setStage('ready');

      // Limpa o param da URL sem recarregar a página
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('gen_free_pdf');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    } catch (e) {
      setStage('error');
      setErrorMsg(e instanceof Error ? e.message : 'Erro inesperado.');
    }
  }

  // ── Estados visuais ──────────────────────────────────────────────────────────

  if (stage === 'creating') {
    if (autoRun) {
      return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-6 shadow-2xl shadow-black/70">
            <div className="flex items-center gap-4">
              <svg className="h-9 w-9 animate-spin text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-[#e5e2e1]">Preparando sua análise gratuita...</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  Estamos criando seu relatório. O download começa automaticamente em instantes.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <span className="flex-shrink-0 inline-flex items-center gap-2 bg-[#0F766E]/10 border border-[#0F766E]/30 text-[#2DD4BF] font-medium text-sm px-5 py-2.5 rounded-lg cursor-wait select-none">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Gerando análise…
      </span>
    );
  }

  if (stage === 'error') {
    return (
      <span className="flex items-center gap-3">
        <span className="text-red-400 text-sm">{errorMsg}</span>
        <button
          onClick={() => { setStage('creating'); triggered.current = false; }}
          className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-200 transition-colors"
        >
          Tentar novamente
        </button>
      </span>
    );
  }

  if (stage === 'ready' && analysisId) {
    return (
      <PDFFeedbackButton
        analysisId={analysisId}
        productType="analise_gratuita"
        isFree={true}
        showFab={false}
        autoDownload={!!autoRun}
        label="Baixar Análise Gratuita"
        className={autoRun ? 'hidden' : 'flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/10 px-5 py-2.5 text-sm font-bold text-[#2DD4BF] transition-all duration-300 hover:bg-[#0F766E]/20 cursor-pointer'}
      />
    );
  }

  // no_data — redireciona para a landing page
  return (
    <a
      href="/analise-gratuita"
      className="flex-shrink-0 inline-flex items-center gap-2 bg-[#0F766E]/10 border border-[#0F766E]/30 text-[#2DD4BF] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#0F766E]/20 transition-all duration-300"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Gerar PDF Gratuito
    </a>
  );
}
