import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from './chat-types.js';
import { NmBubble } from './NmBubble.js';
import { UserBubble } from './UserBubble.js';
import { ChatInlineTextReply } from './ChatInlineTextReply.js';
import { ChatInlineDateReply } from './ChatInlineDateReply.js';
import { PillGroup } from './PillGroup.js';
import { MarketingOptInField } from '../MarketingOptInField.js';
import { Button } from '../../ui/Button.js';
import { marketingBodyFields } from '../../../lib/utm';
import {
  validateBirthDate,
  validateBirthName,
  validateGender,
} from './chat-onboarding-validation.js';

const GENDER_OPTIONS = [
  { id: 'Feminino', label: 'Feminino' },
  { id: 'Masculino', label: 'Masculino' },
  { id: 'Neutro', label: 'Prefiro não informar / Outro' },
];

/**
 * Onboarding da análise gratuita no /app — fluxo conversacional inline (substitui InitialAnalysisModal).
 */
export function FreeAnalysisOnboardingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState({ nome: '', data: '', gender: '' });
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'free-welcome',
        sender: 'assistant',
        type: 'text',
        eyebrow: 'ANÁLISE GRATUITA',
        wide: true,
        content:
          'Para gerar o score inicial do seu nome de nascimento e mapear bloqueios energéticos, vamos coletar alguns dados passo a passo.',
      },
      {
        id: 'free-ask-nome',
        sender: 'assistant',
        type: 'text_input',
        stepId: 'free_nome',
        eyebrow: 'PASSO 1 DE 3',
        wide: true,
        content: 'Como está seu nome completo de registro?',
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNome = (text: string) => {
    const err = validateBirthName(text);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setDraft((d) => ({ ...d, nome: text.trim() }));
    setAnswers((a) => ({ ...a, free_nome: text.trim() }));
    setMessages((prev) => [
      ...prev,
      { id: `u-nome-${Date.now()}`, sender: 'user', type: 'text', content: text.trim() },
      {
        id: `free-ask-data-${Date.now()}`,
        sender: 'assistant',
        type: 'date_input',
        stepId: 'free_data',
        eyebrow: 'PASSO 2 DE 3',
        wide: true,
        content: 'Qual a sua data de nascimento?',
      },
    ]);
  };

  const handleData = (data: string) => {
    const err = validateBirthDate(data);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setDraft((d) => ({ ...d, data }));
    setAnswers((a) => ({ ...a, free_data: data }));
    setMessages((prev) => [
      ...prev,
      { id: `u-data-${Date.now()}`, sender: 'user', type: 'text', content: data },
      {
        id: `free-ask-gender-${Date.now()}`,
        sender: 'assistant',
        type: 'pills',
        stepId: 'free_gender',
        eyebrow: 'PASSO 3 DE 3',
        wide: true,
        content: 'Qual sexo / gênero consta ou você prefere usar na leitura?',
        options: GENDER_OPTIONS,
      },
    ]);
  };

  const handleGender = async (label: string, id: string) => {
    const err = validateGender(id);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setDraft((d) => ({ ...d, gender: id }));
    setAnswers((a) => ({ ...a, free_gender: id }));
    setMessages((prev) => [
      ...prev,
      { id: `u-gender-${Date.now()}`, sender: 'user', type: 'text', content: label },
      {
        id: `free-submit-${Date.now()}`,
        sender: 'assistant',
        type: 'custom',
        stepId: 'free_submit',
        wide: true,
        content: 'Quase lá. Confirme abaixo para gerar seu score inicial.',
      },
    ]);
  };

  const handleSubmitAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: 'analise_gratuita',
          nome_completo: draft.nome,
          data_nascimento: draft.data,
          nome_ja_escolhido: true,
          gender: draft.gender,
          ...marketingBodyFields(optIn),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar sua análise.');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.');
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl bg-white/[0.03] p-4 sm:p-6 mb-8 max-w-2xl mx-auto space-y-3">
      <div className="space-y-3 max-h-[min(70vh,520px)] overflow-y-auto pr-1">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return <UserBubble key={msg.id} content={msg.content} />;
          }

          const pending = msg.stepId ? !answers[msg.stepId] : false;

          return (
            <NmBubble key={msg.id} wide={msg.wide} eyebrow={msg.eyebrow}>
              <p className="text-chat-ink leading-relaxed">{msg.content}</p>

              {pending && msg.type === 'text_input' && msg.stepId === 'free_nome' && (
                <ChatInlineTextReply
                  onSend={handleNome}
                  disabled={loading}
                  placeholder="Ex.: Maria Oliveira Silva"
                />
              )}

              {pending && msg.type === 'date_input' && msg.stepId === 'free_data' && (
                <ChatInlineDateReply onSubmit={handleData} disabled={loading} />
              )}

              {pending && msg.type === 'pills' && msg.options && msg.stepId === 'free_gender' && (
                <PillGroup
                  options={msg.options}
                  onSelect={(opt) => handleGender(opt.label, opt.id)}
                  disabled={loading}
                />
              )}

              {msg.stepId === 'free_submit' && !answers.free_submit && (
                <div className="mt-3 space-y-4">
                  <MarketingOptInField
                    id="free-onboarding-opt-in"
                    checked={optIn}
                    onChange={setOptIn}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                      setAnswers((a) => ({ ...a, free_submit: '1' }));
                      void handleSubmitAnalysis();
                    }}
                    className="!rounded-full font-semibold w-full sm:w-auto"
                  >
                    {loading ? 'Processando...' : 'Gerar meu score'}
                  </Button>
                </div>
              )}
            </NmBubble>
          );
        })}

        {loading && (
          <NmBubble>
            <div className="flex items-center gap-2 text-xs text-chat-muted py-1">
              <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
              <span>Calculando seu mapa inicial...</span>
            </div>
          </NmBubble>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="text-red-400 text-xs p-3 bg-red-500/10 rounded-xl border border-red-500/20 leading-relaxed">
          {error}
        </div>
      )}
    </section>
  );
}

export default FreeAnalysisOnboardingChat;
