import React, { useState, useEffect, useRef } from 'react';
import type {
  ChatMessage,
  ResultPanelData,
  RadarAxesData,
  ReadingSummaryItem,
  CandidateSuggestion,
  DecideLiveResponse,
} from './chat-types.js';
import { ChatProgress } from './ChatProgress.js';
import { SummaryButton } from './SummaryButton.js';
import { NmBubble } from './NmBubble.js';
import { UserBubble } from './UserBubble.js';
import { PillGroup } from './PillGroup.js';
import { GuessButtons } from './GuessButtons.js';
import { SummaryDrawer } from './SummaryDrawer.js';
import { ChatInlineDateReply } from './ChatInlineDateReply.js';
import { ChatProfileConfirmBlock } from './ChatProfileConfirmBlock.js';
import {
  validateBirthDate,
  validateBirthName,
  validateGender,
} from './chat-onboarding-validation.js';
import { SuggestionPicker } from './SuggestionPicker.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';
import { ChatInlineTextReply } from './ChatInlineTextReply.js';
import {
  INITIAL_COLLECT_STATE,
  applyAnswerToCollectState,
  buildDecideLiveBody,
  mapDecideLiveResponse,
  mergeCollectFromApi,
  shouldShowRadar,
  shouldShowSummary,
  type ChatCollectState,
} from './decide-live-bridge.js';

export interface NomeSocialChatProps {
  birthName?: string;
  birthDate?: string;
  profileGender?: string;
  userId?: string;
  /** Painel SSR do nome de nascimento (score_v3 oficial). */
  initialBirthPanel?: ResultPanelData | null;
}

const GENDER_OPTIONS = [
  { id: 'Feminino', label: 'Feminino' },
  { id: 'Masculino', label: 'Masculino' },
  { id: 'Neutro', label: 'Prefiro não informar / Outro' },
];

function buildInitialOnboardingMessages(birthName: string, birthDate: string): ChatMessage[] {
  if (birthName.trim() && birthDate.trim()) {
    return [
      {
        id: 'msg-profile-confirm',
        sender: 'assistant',
        type: 'profile_confirm',
        stepId: 'onboarding_confirm',
        eyebrow: 'CERTIDÃO DE NASCIMENTO',
        wide: true,
        content: 'Antes de começarmos, vamos confirmar seus dados de certidão.',
      },
    ];
  }

  return [
    {
      id: 'msg-ask-nome',
      sender: 'assistant',
      type: 'text_input',
      stepId: 'onboarding_nome',
      eyebrow: 'CERTIDÃO DE NASCIMENTO',
      wide: true,
      content: 'Como está seu nome completo exatamente na certidão de nascimento?',
    },
  ];
}

function isOnboardingStepId(stepId?: string): boolean {
  return Boolean(stepId?.startsWith('onboarding_'));
}

function isInteractionPending(
  msg: ChatMessage,
  currentStepId: string,
  answers: Record<string, string>,
  birthConfirmed: boolean
): boolean {
  if (!msg.stepId || birthConfirmed) return false;
  if (isOnboardingStepId(msg.stepId)) {
    return !answers[msg.stepId];
  }
  if (!birthConfirmed) return false;
  return msg.stepId === currentStepId && !answers[msg.stepId];
}

export function NomeSocialChat({
  birthName: initialBirthName = '',
  birthDate: initialBirthDate = '',
  profileGender: initialProfileGender = '',
  userId = '',
  initialBirthPanel = null,
}: NomeSocialChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [confirmedName, setConfirmedName] = useState(initialBirthName);
  const [confirmedDate, setConfirmedDate] = useState(initialBirthDate);
  const [draftNome, setDraftNome] = useState(initialBirthName);
  const [draftDate, setDraftDate] = useState(initialBirthDate);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [stepIndex, setStepIndex] = useState(0);
  const [currentStepId, setCurrentStepId] = useState('nome_nascimento');
  const [remaining, setRemaining] = useState(7);
  const totalSteps = 8;

  const [birthConfirmed, setBirthConfirmed] = useState(false);
  const [collectState, setCollectState] = useState<ChatCollectState>(INITIAL_COLLECT_STATE);
  const [sobrenomesDetectados, setSobrenomesDetectados] = useState<string[]>([]);
  const [radarAxes, setRadarAxes] = useState<RadarAxesData | null>(null);
  const [summaryItems, setSummaryItems] = useState<ReadingSummaryItem[]>([]);
  const [basePanel, setBasePanel] = useState<ResultPanelData | null>(initialBirthPanel);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CandidateSuggestion[]>([]);
  const [analysisId, setAnalysisId] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftGender, setDraftGender] = useState(initialProfileGender);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const hasRegisteredBirthName =
    Boolean(initialBirthName.trim()) && Boolean(initialBirthDate.trim());

  useEffect(() => {
    setDraftNome(initialBirthName);
    setDraftDate(initialBirthDate);
    setDraftGender(initialProfileGender);
    setMessages(buildInitialOnboardingMessages(initialBirthName, initialBirthDate));
    setBasePanel(hasRegisteredBirthName ? initialBirthPanel : null);
  }, [
    initialBirthName,
    initialBirthDate,
    initialProfileGender,
    initialBirthPanel,
    hasRegisteredBirthName,
  ]);

  const appendUserBubble = (content: string, stepId: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        type: 'text',
        content,
        stepId,
      },
    ]);
  };

  const saveBaseProfile = async (nome: string, dataNascimento: string, gender: string) => {
    const res = await fetch('/api/user/save-base-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_name: nome.trim(),
        birth_date: dataNascimento,
        gender,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao salvar perfil');
    }
  };

  const runDecideLive = async (nome: string, dataNascimento: string) => {
    setConfirmedName(nome);
    setConfirmedDate(dataNascimento);
    setLoading(true);
    setOnboardingError(null);

    try {
      const res = await fetch('/api/decide-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildDecideLiveBody(nome, dataNascimento, {
            ...INITIAL_COLLECT_STATE,
            sobrenomesDecididos: false,
          })
        ),
      });

      if (!res.ok) throw new Error('Falha ao processar resposta inicial');
      const raw = await res.json();
      if (raw.error) throw new Error(raw.error);
      const responseData = mapDecideLiveResponse(raw);
      if (Array.isArray(raw.sobrenomesDetectados)) {
        setSobrenomesDetectados(raw.sobrenomesDetectados);
      }
      setBirthConfirmed(true);
      const mergedCollect = mergeCollectFromApi(INITIAL_COLLECT_STATE, raw);
      setCollectState(mergedCollect);
      if (shouldShowRadar(mergedCollect) && responseData.radarAxes) {
        setRadarAxes(responseData.radarAxes);
      }

      applyDecisionResponse(responseData);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          type: 'text',
          content: 'Houve uma instabilidade temporária. Por favor, tente novamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const finalizeOnboarding = async (nome: string, dataNascimento: string, gender: string) => {
    const genderErr = validateGender(gender);
    if (genderErr) {
      setOnboardingError(genderErr);
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      onboarding_confirm: 'ok',
      onboarding_done: `${nome} · ${dataNascimento}`,
    }));
    setOnboardingError(null);

    try {
      const mustSave =
        !initialBirthName ||
        !initialBirthDate ||
        gender !== initialProfileGender ||
        nome.trim() !== initialBirthName.trim() ||
        dataNascimento !== initialBirthDate;
      if (mustSave) {
        setLoading(true);
        await saveBaseProfile(nome, dataNascimento, gender);
      }
      await runDecideLive(nome, dataNascimento);
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : 'Erro ao salvar dados.');
      setLoading(false);
    }
  };

  const handleOnboardingNome = (text: string) => {
    const err = validateBirthName(text);
    if (err) {
      setOnboardingError(err);
      return;
    }
    setOnboardingError(null);
    const nome = text.trim();
    setConfirmedName(nome);
    setDraftNome(nome);
    setAnswers((prev) => ({ ...prev, onboarding_nome: nome }));
    appendUserBubble(nome, 'onboarding_nome');
    setMessages((prev) => [
      ...prev,
      {
        id: `ask-data-${Date.now()}`,
        sender: 'assistant',
        type: 'date_input',
        stepId: 'onboarding_data',
        eyebrow: 'DATA DE NASCIMENTO',
        wide: true,
        content: 'Qual a sua data de nascimento, no formato da certidão?',
      },
    ]);
  };

  const handleOnboardingData = (dataNascimento: string) => {
    const err = validateBirthDate(dataNascimento);
    if (err) {
      setOnboardingError(err);
      return;
    }
    setOnboardingError(null);
    setConfirmedDate(dataNascimento);
    setDraftDate(dataNascimento);
    setAnswers((prev) => ({ ...prev, onboarding_data: dataNascimento }));
    appendUserBubble(dataNascimento, 'onboarding_data');

    const nomeAtual = (confirmedName || draftNome).trim();
    const genderKnown = Boolean(draftGender || initialProfileGender);
    if (genderKnown) {
      void finalizeOnboarding(nomeAtual, dataNascimento, draftGender || initialProfileGender);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ask-gender-${Date.now()}`,
        sender: 'assistant',
        type: 'pills',
        stepId: 'onboarding_gender',
        eyebrow: 'SEXO / GÊNERO',
        wide: true,
        content: 'Por último, qual sexo / gênero você prefere usar nesta leitura?',
        options: GENDER_OPTIONS,
      },
    ]);
  };

  const handleOnboardingGender = (label: string, genderId: string) => {
    const err = validateGender(genderId);
    if (err) {
      setOnboardingError(err);
      return;
    }
    setOnboardingError(null);
    setDraftGender(genderId);
    setAnswers((prev) => ({ ...prev, onboarding_gender: genderId }));
    appendUserBubble(label, 'onboarding_gender');
    void finalizeOnboarding((confirmedName || draftNome).trim(), draftDate, genderId);
  };

  const askOnboardingGender = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `ask-gender-${Date.now()}`,
        sender: 'assistant',
        type: 'pills',
        stepId: 'onboarding_gender',
        eyebrow: 'SEXO / GÊNERO',
        wide: true,
        content: 'Por último, qual sexo / gênero você prefere usar nesta leitura?',
        options: GENDER_OPTIONS,
      },
    ]);
  };

  const handleConfirmExistingProfile = () => {
    setAnswers((prev) => ({ ...prev, onboarding_confirm: 'ok' }));
    appendUserBubble(`${draftNome} · ${draftDate}`, 'onboarding_confirm');
    const gender = draftGender || initialProfileGender;
    if (!gender) {
      askOnboardingGender();
      return;
    }
    void finalizeOnboarding(draftNome.trim(), draftDate, gender);
  };

  const handleEditExistingProfile = () => {
    setAnswers({});
    setConfirmedName('');
    setConfirmedDate('');
    setDraftNome(initialBirthName);
    setDraftDate(initialBirthDate);
    setDraftGender(initialProfileGender);
    setBirthConfirmed(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `ask-nome-edit-${Date.now()}`,
        sender: 'assistant',
        type: 'text_input',
        stepId: 'onboarding_nome',
        eyebrow: 'CERTIDÃO DE NASCIMENTO',
        wide: true,
        content: 'Sem problemas. Digite novamente seu nome completo de certidão.',
      },
    ]);
  };

  const applyDecisionResponse = (data: DecideLiveResponse) => {
    if (data.summary) setSummaryItems(data.summary);
    if (data.panel) setBasePanel(data.panel);
    if (data.remaining !== undefined) setRemaining(data.remaining);
    if (data.analysisId) setAnalysisId(data.analysisId);
    if (data.providerUsed) {
      console.info('[chat] motor interativo:', data.providerUsed);
    }

    if (data.previewTop3 && data.previewTop3.length > 0) {
      setSuggestions(data.previewTop3);
    }

    setCurrentStepId(data.next_step);
    setStepIndex(Math.max(1, totalSteps - data.remaining));

    const newMsgs: ChatMessage[] = [];

    if (data.reading) {
      newMsgs.push({
        id: `reading-${Date.now()}`,
        sender: 'assistant',
        type: 'text',
        eyebrow: 'LEITURA DO MOMENTO',
        content: data.reading,
      });
    }

    if (data.next_question) {
      const q = data.next_question;
      const msgType =
        q.tipo === 'palpite' ? 'guess' : q.tipo === 'escolha' ? 'pills' : 'text_input';

      newMsgs.push({
        id: `q-${Date.now()}`,
        sender: 'assistant',
        type: msgType,
        stepId: data.next_step,
        eyebrow: q.eyebrow,
        content: q.prompt,
        hypotheticalText: q.palpiteTexto,
        options: q.options,
      });
    }

    if (
      data.next_step === 'fim_coleta' ||
      data.next_step === 'conclusao' ||
      (data.previewTop3 && data.previewTop3.length > 0)
    ) {
      newMsgs.push({
        id: `suggestions-${Date.now()}`,
        sender: 'assistant',
        type: 'suggestions',
        wide: true,
        content: '',
      });
    }

    setMessages((prev) => [...prev, ...newMsgs]);
  };

  const handleUserAnswer = async (text: string, optionId?: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      type: 'text',
      content: text,
      stepId: currentStepId,
    };
    setMessages((prev) => [...prev, userMsg]);

    const updatedAnswers = {
      ...answers,
      [currentStepId]: optionId || text,
    };
    setAnswers(updatedAnswers);

    const nextCollect = applyAnswerToCollectState(
      collectState,
      currentStepId,
      text,
      optionId,
      sobrenomesDetectados
    );
    setCollectState(nextCollect);
    setLoading(true);

    try {
      const res = await fetch('/api/decide-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildDecideLiveBody(confirmedName, confirmedDate, nextCollect)),
      });

      if (!res.ok) throw new Error('Erro ao processar etapa');
      const raw = await res.json();
      if (raw.error) throw new Error(raw.error);
      const responseData = mapDecideLiveResponse(raw);
      if (Array.isArray(raw.sobrenomesDetectados)) {
        setSobrenomesDetectados(raw.sobrenomesDetectados);
      }
      const mergedCollect = mergeCollectFromApi(nextCollect, raw);
      setCollectState(mergedCollect);
      if (shouldShowRadar(mergedCollect) && responseData.radarAxes) {
        setRadarAxes(responseData.radarAxes);
      }

      applyDecisionResponse(responseData);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          type: 'text',
          content: 'Desculpe, ocorreu uma instabilidade. Poderia enviar novamente?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuessExact = () => {
    handleUserAnswer('Na mosca');
  };

  const handleGuessPartial = () => {
    handleUserAnswer('Em parte');
  };

  const handleGuessOther = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              type: 'text_input',
              content: 'Então, o que é? Conta com as suas palavras...',
            }
          : m
      )
    );
  };

  const handleLiveScore = async (text: string) => {
    if (!text || text.length < 3) return;
    try {
      const res = await fetch('/api/score-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          profile: {
            nomeCompleto: confirmedName,
            dataNascimento: confirmedDate,
            areaFoco: collectState.areaFoco,
            subfocoMomento: collectState.subfocoMomento,
            ondeVaiUsar: collectState.ondeAssina,
            sobrenomesObrigatorios: collectState.sobrenomesObrigatorios,
            sobrenomesExcluidos: collectState.sobrenomesExcluidos,
            estiloPreferido: collectState.estiloPreferido,
            palpiteStatus: collectState.palpiteStatus,
          },
        }),
      });
      if (res.ok && shouldShowRadar(collectState)) {
        const live = await res.json();
        const axisList = live.radarAxes as Array<{ key: string; value: number }> | undefined;
        if (axisList) {
          setRadarAxes({
            momento: axisList.find((a) => a.key === 'momento')?.value ?? 0.2,
            objetivo: axisList.find((a) => a.key === 'objetivo')?.value ?? 0.2,
            uso: axisList.find((a) => a.key === 'uso')?.value ?? 0.2,
            apego_sobrenome: axisList.find((a) => a.key === 'apego_sobrenome')?.value ?? 0.5,
            urgencia: axisList.find((a) => a.key === 'urgencia')?.value ?? 0.3,
          });
        }
      }
    } catch {
      // silencioso
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/regenerate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthName: confirmedName,
          birthDate: confirmedDate,
          userId,
          answers,
        }),
      });

      if (!res.ok) throw new Error('Erro ao regenerar opções');
      const data = await res.json();

      if (data.candidates && data.candidates.length > 0) {
        setSuggestions(data.candidates);
        setActiveSuggestionId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const activeSuggestion = suggestions.find((s) => s.id === activeSuggestionId);
  const displayedPanelData = activeSuggestion ? activeSuggestion.panel : basePanel;
  const showRadarPanel = shouldShowRadar(collectState);
  const showSummaryPanel = shouldShowSummary(summaryItems);

  const summaryCount =
    (displayedPanelData ? 1 : 0) + (showRadarPanel ? 1 : 0) + summaryItems.length;

  return (
    <div className="w-full flex flex-col min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      <ChatProgress
        currentStep={stepIndex}
        totalSteps={totalSteps}
        remaining={remaining}
        className="shrink-0 sticky top-0 z-20 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        trailing={
          <div className="lg:hidden">
            <SummaryButton count={summaryCount} onClick={() => setDrawerOpen(true)} />
          </div>
        }
      />

      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-4 lg:grid lg:grid-cols-[minmax(0,640px)_320px] lg:gap-8">
        <main className="flex flex-col min-h-0 min-w-0 py-4 lg:py-6">

          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-6 pt-3">
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return <UserBubble key={msg.id} content={msg.content} />;
              }

              const pending = isInteractionPending(msg, currentStepId, answers, birthConfirmed);

              if (msg.type === 'suggestions') {
                return (
                  <NmBubble key={msg.id} wide eyebrow="OPÇÕES HARMONIZADAS">
                    <SuggestionPicker
                      suggestions={suggestions}
                      selectedId={activeSuggestionId}
                      onSelect={(id) => setActiveSuggestionId(id)}
                      onRegenerate={handleRegenerate}
                      isRegenerating={isRegenerating}
                      analysisId={analysisId}
                    />
                  </NmBubble>
                );
              }

              return (
                <NmBubble key={msg.id} wide={msg.wide} eyebrow={msg.eyebrow}>
                  <p className="text-chat-ink leading-relaxed">{msg.content}</p>

                  {msg.hypotheticalText && msg.type === 'guess' && (
                    <p className="mt-2 text-sm text-chat-muted italic leading-relaxed">
                      {msg.hypotheticalText}
                    </p>
                  )}

                  {pending && msg.type === 'guess' && (
                    <GuessButtons
                      onExact={handleGuessExact}
                      onPartial={handleGuessPartial}
                      onOther={() => handleGuessOther(msg.id)}
                      disabled={loading}
                    />
                  )}

                  {pending && msg.type === 'profile_confirm' && (
                    <ChatProfileConfirmBlock
                      nome={draftNome}
                      dataNascimento={draftDate}
                      onConfirm={handleConfirmExistingProfile}
                      onEdit={handleEditExistingProfile}
                      disabled={loading}
                    />
                  )}

                  {pending && msg.type === 'pills' && msg.options && msg.options.length > 0 && (
                    <PillGroup
                      options={msg.options}
                      onSelect={(opt) =>
                        msg.stepId === 'onboarding_gender'
                          ? handleOnboardingGender(opt.label, opt.id)
                          : handleUserAnswer(opt.label, opt.id)
                      }
                      disabled={loading}
                    />
                  )}

                  {pending && msg.type === 'date_input' && msg.stepId === 'onboarding_data' && (
                    <ChatInlineDateReply onSubmit={handleOnboardingData} disabled={loading} />
                  )}

                  {pending && msg.type === 'text_input' && (
                    <ChatInlineTextReply
                      onSend={(text) => {
                        if (msg.stepId === 'onboarding_nome') {
                          handleOnboardingNome(text);
                          return;
                        }
                        handleUserAnswer(text);
                      }}
                      onLiveScore={birthConfirmed ? handleLiveScore : undefined}
                      disabled={loading}
                      placeholder={
                        msg.stepId === 'onboarding_nome'
                          ? 'Ex.: Maria da Silva Souza'
                          : msg.stepId === 'sobrenomes'
                            ? 'Ex.: quero manter Malickovski e Correa...'
                            : 'Digite sua resposta...'
                      }
                    />
                  )}
                </NmBubble>
              );
            })}

            {onboardingError && (
              <div className="text-brand-error text-xs p-2 rounded-lg bg-brand-error/10 border border-brand-error/20">
                {onboardingError}
              </div>
            )}

            {loading && (
              <NmBubble>
                <div className="flex items-center gap-2 text-xs text-chat-muted py-1">
                  <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                  <span>Sintonizando vibrações numéricas...</span>
                </div>
              </NmBubble>
            )}

            <div ref={chatBottomRef} />
          </div>
        </main>

        <aside className="hidden lg:flex flex-col min-h-0 py-6 overflow-y-auto">
          <ChatSidebarSection
            panelData={displayedPanelData}
            showBirthStar={hasRegisteredBirthName}
            isSuggestion={Boolean(activeSuggestionId)}
            onResetToBase={() => setActiveSuggestionId(null)}
            radarAxes={radarAxes}
            showRadar={showRadarPanel}
            summaryItems={summaryItems}
            showSummary={showSummaryPanel}
          />
        </aside>
      </div>

      <SummaryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        panelData={displayedPanelData}
        showBirthStar={hasRegisteredBirthName}
        isSuggestion={Boolean(activeSuggestionId)}
        onResetToBase={() => setActiveSuggestionId(null)}
        radarAxes={radarAxes}
        summaryItems={summaryItems}
        showRadar={showRadarPanel}
        showSummary={showSummaryPanel}
      />
    </div>
  );
}

export default NomeSocialChat;
