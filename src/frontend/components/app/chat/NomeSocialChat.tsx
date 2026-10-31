import React, { useState, useEffect, useRef } from 'react';
import type {
  ChatMessage,
  ChatReadingSummary,
  ResultPanelData,
  RadarAxesData,
  ReadingSummaryItem,
  CandidateSuggestion,
  DecideLiveResponse,
} from './chat-types.js';
import { fetchChatReadingSummary } from './chat-reading-summary-client.js';
import { isDemoChatUser } from './demo-chat-utils.js';
import { ChatProgress } from './ChatProgress.js';
import { ChatRestartButton } from './ChatRestartButton.js';
import { MobileChatDock } from './MobileChatDock.js';
import {
  buildChatDockLayout,
  resolveChatDockScreen,
  type DockPrimaryActionId,
  type DockSecondaryActionId,
} from './mobile-dock-screen.js';
import type { SummaryPanelCloseMethod } from './SummaryDrawer.js';
import {
  getPreviousFlowStep,
  isFirstQuestionnaireStep,
  POST_BIRTH_FLOW_STEPS,
  rewindCollectStateToStep,
  type PostBirthFlowStep,
} from './chat-dock-step-back.js';
import { NmBubble } from './NmBubble.js';
import { UserBubble } from './UserBubble.js';
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
import { ChatSidebarPanelChrome } from './ChatSidebarPanelChrome.js';
import { isInteractionPending } from './chat-interaction-pending.js';
import { ChatStepInteraction, ChatChoicePills } from './ChatStepInteraction.js';
import {
  INITIAL_COLLECT_STATE,
  applyAnswerToCollectState,
  applyQuestionnaireStep,
  buildDecideLiveBody,
  buildRegenerateRequestBody,
  isRegeneratePoolExhausted,
  mapDecideLiveResponse,
  mapRegenerateApiToCandidates,
  mergeCollectFromApi,
  shouldShowRadar,
  shouldShowSummary,
  type ChatCollectState,
} from './decide-live-bridge.js';
import { ChatAdaptivePills } from './ChatAdaptivePills.js';
import {
  buildEchoAfterStep,
  isQuestionnaireStep,
} from '../../../../shared/interactive-engine/questionnaire-adaptive.js';
import {
  computeMotorRadarAxes,
  motorRadarToRecord,
} from '../../../../shared/interactive-engine/motor-radar.js';
import { buildQuestionnaireContextChips } from '../../../../shared/interactive-engine/questionnaire-context-chips.js';
import {
  clearChatSession,
  loadChatSession,
  saveChatSession,
  type PersistedChatSession,
} from './chat-session-storage.js';
import { buildPostSuggestionChoiceBlock } from '../../../../shared/interactive-engine/chat-profile-copy.js';
import { capturePostHogEvent } from '../../../lib/analytics.js';
import { Button } from '../../ui/Button.js';
import { Modal } from '../../ui/Modal.js';

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
  const totalSteps = 9;

  const [birthConfirmed, setBirthConfirmed] = useState(false);
  const [collectState, setCollectState] = useState<ChatCollectState>(INITIAL_COLLECT_STATE);
  const [sobrenomesDetectados, setSobrenomesDetectados] = useState<string[]>([]);
  const [radarAxes, setRadarAxes] = useState<RadarAxesData | null>(null);
  const [radarOverlayAxes, setRadarOverlayAxes] = useState<RadarAxesData | null>(null);
  const [summaryItems, setSummaryItems] = useState<ReadingSummaryItem[]>([]);
  const [birthReadingSummary, setBirthReadingSummary] = useState<ChatReadingSummary | null>(
    null
  );
  const [harmonizedSummaries, setHarmonizedSummaries] = useState<
    Record<string, ChatReadingSummary>
  >({});
  const [readingSummaryLoading, setReadingSummaryLoading] = useState(false);
  const [basePanel, setBasePanel] = useState<ResultPanelData | null>(initialBirthPanel);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CandidateSuggestion[]>([]);
  const [regenerateNotice, setRegenerateNotice] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [summaryBadge, setSummaryBadge] = useState(false);
  const lastSummarySnapshotRef = useRef<string>('');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [draftGender, setDraftGender] = useState(initialProfileGender);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [backToStartConfirmOpen, setBackToStartConfirmOpen] = useState(false);
  const [pendingPalpiteFeedback, setPendingPalpiteFeedback] = useState<'parcial' | 'nao' | null>(
    null
  );

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const sessionBootstrapped = useRef(false);
  const chatStartedAtRef = useRef<number | null>(null);
  const [nomeArtisticoDraft, setNomeArtisticoDraft] = useState('');

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) {
        setDrawerOpen(false);
      } else {
        setSidebarExpanded(false);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const persistReady = useRef(false);
  const demoMode = isDemoChatUser(userId);

  const hasRegisteredBirthName =
    Boolean(initialBirthName.trim()) && Boolean(initialBirthDate.trim());

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!birthConfirmed || !currentStepId) return;
    capturePostHogEvent('chat_step_viewed', { step: currentStepId });
  }, [currentStepId, birthConfirmed]);

  const applyFreshSession = () => {
    setDraftNome(initialBirthName);
    setDraftDate(initialBirthDate);
    setDraftGender(initialProfileGender);
    setConfirmedName(initialBirthName);
    setConfirmedDate(initialBirthDate);
    setAnswers({});
    setStepIndex(0);
    setCurrentStepId('nome_nascimento');
    setRemaining(7);
    setBirthConfirmed(false);
    setCollectState(INITIAL_COLLECT_STATE);
    setSobrenomesDetectados([]);
    setRadarAxes(null);
    setRadarOverlayAxes(null);
    setSummaryItems([]);
    setBirthReadingSummary(null);
    setHarmonizedSummaries({});
    setReadingSummaryLoading(false);
    setPendingPalpiteFeedback(null);
    setBasePanel(hasRegisteredBirthName ? initialBirthPanel : null);
    setActiveSuggestionId(null);
    setSuggestions([]);
    setAnalysisId(undefined);
    setOnboardingError(null);
    setMessages(buildInitialOnboardingMessages(initialBirthName, initialBirthDate));
  };

  const restoreSession = (saved: PersistedChatSession) => {
    const collectionComplete =
      saved.currentStepId === 'fim_coleta' || saved.currentStepId === 'conclusao';
    const messages = collectionComplete
      ? saved.messages
      : saved.messages.filter((m) => m.type !== 'suggestions');

    setMessages(messages);
    setAnswers(saved.answers);
    setConfirmedName(saved.confirmedName);
    setConfirmedDate(saved.confirmedDate);
    setDraftNome(saved.draftNome);
    setDraftDate(saved.draftDate);
    setDraftGender(saved.draftGender);
    setStepIndex(saved.stepIndex);
    setCurrentStepId(saved.currentStepId);
    setRemaining(saved.remaining);
    setBirthConfirmed(saved.birthConfirmed);
    setCollectState(saved.collectState);
    setSobrenomesDetectados(saved.sobrenomesDetectados);
    setRadarAxes(saved.radarAxes);
    setSummaryItems(saved.summaryItems);
    setBirthReadingSummary(saved.birthReadingSummary ?? null);
    setHarmonizedSummaries(saved.harmonizedSummaries ?? {});
    setBasePanel(saved.basePanel);
    setActiveSuggestionId(collectionComplete ? saved.activeSuggestionId : null);
    setSuggestions(collectionComplete ? saved.suggestions : []);
    setAnalysisId(saved.analysisId);
  };

  useEffect(() => {
    if (sessionBootstrapped.current) return;
    sessionBootstrapped.current = true;

    const saved = userId ? loadChatSession(userId) : null;
    if (saved && saved.messages.length > 0) {
      restoreSession(saved);
    } else {
      applyFreshSession();
    }
    persistReady.current = true;
  }, [userId]);

  useEffect(() => {
    if (!userId || !persistReady.current) return;

    const timer = window.setTimeout(() => {
      const snapshot: PersistedChatSession = {
        version: 2,
        savedAt: Date.now(),
        messages,
        answers,
        confirmedName,
        confirmedDate,
        draftNome,
        draftDate,
        draftGender,
        stepIndex,
        currentStepId,
        remaining,
        birthConfirmed,
        collectState,
        sobrenomesDetectados,
        radarAxes,
        summaryItems,
        basePanel,
        birthReadingSummary,
        harmonizedSummaries,
        activeSuggestionId,
        suggestions,
        analysisId,
      };
      saveChatSession(userId, snapshot);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    userId,
    messages,
    answers,
    confirmedName,
    confirmedDate,
    draftNome,
    draftDate,
    draftGender,
    stepIndex,
    currentStepId,
    remaining,
    birthConfirmed,
    collectState,
    sobrenomesDetectados,
    radarAxes,
    summaryItems,
    basePanel,
    birthReadingSummary,
    harmonizedSummaries,
    activeSuggestionId,
    suggestions,
    analysisId,
  ]);

  useEffect(() => {
    if (demoMode) return;
    if (!birthConfirmed || !confirmedName.trim() || birthReadingSummary) return;
    let cancelled = false;
    void fetchChatReadingSummary(confirmedName, confirmedDate).then((summary) => {
      if (!cancelled && summary) setBirthReadingSummary(summary);
    });
    return () => {
      cancelled = true;
    };
  }, [demoMode, birthConfirmed, confirmedName, confirmedDate, birthReadingSummary]);

  useEffect(() => {
    if (!birthConfirmed || !activeSuggestionId) {
      setReadingSummaryLoading(false);
      return;
    }
    if (harmonizedSummaries[activeSuggestionId]) {
      setReadingSummaryLoading(false);
      return;
    }
    const sug = suggestions.find((s) => s.id === activeSuggestionId);
    if (!sug?.nome) return;

    let cancelled = false;
    setReadingSummaryLoading(true);
    void fetchChatReadingSummary(sug.nome, confirmedDate)
      .then((summary) => {
        if (cancelled || !summary) return;
        setHarmonizedSummaries((prev) => ({ ...prev, [activeSuggestionId]: summary }));
      })
      .finally(() => {
        if (!cancelled) setReadingSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [birthConfirmed, activeSuggestionId, confirmedDate, suggestions]);

  const resetChat = () => {
    clearChatSession(userId);
    applyFreshSession();
  };

  const handleRequestReset = () => {
    setResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    capturePostHogEvent('restart_confirmed', { step: currentStepId });
    setResetConfirmOpen(false);
    resetChat();
  };

  const trimMessagesForRewind = (targetStep: PostBirthFlowStep) => {
    const targetIdx = POST_BIRTH_FLOW_STEPS.indexOf(targetStep);
    setMessages((prev) =>
      prev.filter((m) => {
        if (m.type === 'suggestions') return false;
        const sid = m.stepId;
        if (!sid || sid.startsWith('onboarding')) return true;
        if (sid === 'fim_coleta' || sid === 'conclusao') return false;
        const idx = POST_BIRTH_FLOW_STEPS.indexOf(sid as PostBirthFlowStep);
        if (idx === -1) return true;
        return idx < targetIdx;
      })
    );
    setAnswers((prev) => {
      const next = { ...prev };
      for (const s of POST_BIRTH_FLOW_STEPS.slice(targetIdx)) {
        delete next[s];
      }
      delete next.fim_coleta;
      delete next.conclusao;
      return next;
    });
  };

  const resyncAfterRewind = async (rew: ChatCollectState, targetStep: PostBirthFlowStep) => {
    setCollectState(rew);
    setLoading(true);
    setActiveSuggestionId(null);
    setSuggestions([]);
    try {
      const res = await fetch('/api/decide-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildDecideLiveBody(confirmedName, confirmedDate, rew)),
      });
      if (!res.ok) throw new Error('Erro ao voltar etapa');
      const raw = await res.json();
      const responseData = mapDecideLiveResponse(raw, {
        nomeCompleto: confirmedName,
        collect: rew,
        sobrenomesDetectados,
      });
      applyDecisionResponse(responseData, undefined, rew.nomeUsoBase ?? confirmedName);
      setCurrentStepId(raw.next_step ?? targetStep);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatDockBack = () => {
    const screen = chatDockScreen ?? 'chat_questionnaire';
    capturePostHogEvent('back_clicked', { screen, step: currentStepId });

    if (profileCollectionComplete && hasSuggestionsMessage) {
      const target: PostBirthFlowStep = 'palpite';
      const rew = rewindCollectStateToStep(collectState, target);
      trimMessagesForRewind(target);
      void resyncAfterRewind(rew, target);
      return;
    }

    if (isFirstQuestionnaireStep(currentStepId)) {
      setBackToStartConfirmOpen(true);
      return;
    }

    const prev = getPreviousFlowStep(currentStepId);
    if (!prev || prev === 'suggestions') return;
    const rew = rewindCollectStateToStep(collectState, prev);
    trimMessagesForRewind(prev);
    void resyncAfterRewind(rew, prev);
  };

  const handleConfirmBackToStart = () => {
    setBackToStartConfirmOpen(false);
    window.location.href = '/app';
  };

  const handleFinalizeAnalysis = () => {
    clearChatSession(userId);
    applyFreshSession();
  };

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
      chatStartedAtRef.current = Date.now();
      const responseData = mapDecideLiveResponse(raw, {
        nomeCompleto: nome,
        collect: INITIAL_COLLECT_STATE,
        sobrenomesDetectados: raw.sobrenomesDetectados ?? [],
      });
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
      if (mustSave && !demoMode) {
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

  const applyDecisionResponse = (
    data: DecideLiveResponse,
    echoAfterStep?: string,
    echoNome?: string | null
  ) => {
    if (data.summary) setSummaryItems(data.summary);
    if (data.readingSummary) setBirthReadingSummary(data.readingSummary);
    if (data.panel) setBasePanel(data.panel);
    if (data.remaining !== undefined) setRemaining(data.remaining);
    if (data.analysisId) setAnalysisId(data.analysisId);
    if (data.providerUsed) {
      console.info('[chat] motor interativo:', data.providerUsed);
    }

    const collectionComplete =
      data.next_step === 'fim_coleta' || data.next_step === 'conclusao';

    if (collectionComplete && data.previewTop3 && data.previewTop3.length > 0) {
      setSuggestions(data.previewTop3);
    }

    setCurrentStepId(data.next_step);
    setStepIndex(Math.max(1, totalSteps - data.remaining));

    const newMsgs: ChatMessage[] = [];

    const ecoBase = echoNome ?? collectState.nomeUsoBase ?? confirmedName;
    if (echoAfterStep && ecoBase && isQuestionnaireStep(echoAfterStep)) {
      newMsgs.push({
        id: `eco-${Date.now()}`,
        sender: 'assistant',
        type: 'text',
        content: buildEchoAfterStep(ecoBase, echoAfterStep),
      });
    }

    if (data.next_question) {
      const q = data.next_question;
      const msgType =
        q.tipo === 'questionnaire'
          ? 'questionnaire'
          : q.tipo === 'palpite'
            ? 'guess'
            : q.tipo === 'escolha'
              ? 'pills'
              : 'text_input';

      newMsgs.push({
        id: `q-${Date.now()}`,
        sender: 'assistant',
        type: msgType,
        stepId: data.next_step,
        eyebrow: q.eyebrow,
        content: q.prompt,
        options: q.options,
        hypotheticalText: JSON.stringify({
          mode: q.mode,
          maxSelect: q.maxSelect,
          minSelect: q.minSelect,
          allowOther: q.allowOther,
          otherMaxLength: q.otherMaxLength,
          caption: q.caption,
        }),
      });
    }

    if (collectionComplete) {
      const started = chatStartedAtRef.current;
      if (started) {
        capturePostHogEvent('chat_completed', {
          duration_s: Math.round((Date.now() - started) / 1000),
          steps: totalSteps,
        });
      }
      newMsgs.push({
        id: `suggestions-${Date.now()}`,
        sender: 'assistant',
        type: 'suggestions',
        wide: true,
        content: '',
      });
    }

    setMessages((prev) => {
      let merged = prev;
      for (const m of newMsgs) {
        if (m.sender === 'assistant' && m.stepId) {
          merged = merged.filter(
            (p) => !(p.sender === 'assistant' && p.stepId === m.stepId)
          );
        }
        merged = [...merged, m];
      }
      return merged;
    });
  };

  const scoreBucket = (score: number) => {
    if (score >= 90) return '90-100';
    if (score >= 70) return '70-89';
    if (score >= 40) return '40-69';
    if (score >= 20) return '20-39';
    return '0-19';
  };

  const handleSuggestionSelect = (id: string | null) => {
    if (!id && activeSuggestionId) {
      const prev = suggestions.find((s) => s.id === activeSuggestionId);
      const rank = suggestions.findIndex((s) => s.id === activeSuggestionId) + 1;
      capturePostHogEvent('suggestion_deselected', {
        rank,
        score_bucket: prev ? scoreBucket(prev.score) : undefined,
      });
    }
    if (id && basePanel) {
      const sug = suggestions.find((s) => s.id === id);
      if (sug && id !== activeSuggestionId && sug.panel) {
        const rank = suggestions.findIndex((s) => s.id === id) + 1;
        capturePostHogEvent('suggestion_selected', {
          rank,
          score_bucket: scoreBucket(sug.score),
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `sug-choice-${Date.now()}`,
            sender: 'assistant',
            type: 'text',
            content: buildPostSuggestionChoiceBlock({
              assinaturaEscolhida: sug.nome,
              notaHoje: basePanel.score,
              notaEscolhida: sug.score,
              birth: basePanel,
              chosen: sug.panel,
            }),
          },
        ]);
      }
    }
    setActiveSuggestionId(id);
  };

  const pushDecideLive = async (
    nextCollect: ChatCollectState,
    userLabel: string,
    stepId: string,
    posthogAnswer?: Record<string, unknown>
  ) => {
    appendUserBubble(userLabel, stepId);
    if (posthogAnswer) {
      capturePostHogEvent('chat_answer', { step: stepId, ...posthogAnswer });
    }
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
      const responseData = mapDecideLiveResponse(raw, {
        nomeCompleto: confirmedName,
        collect: nextCollect,
        sobrenomesDetectados,
      });
      if (Array.isArray(raw.sobrenomesDetectados)) {
        setSobrenomesDetectados(raw.sobrenomesDetectados);
      }
      const mergedCollect = mergeCollectFromApi(nextCollect, raw);
      setCollectState(mergedCollect);
      if (shouldShowRadar(mergedCollect) && responseData.radarAxes) {
        setRadarAxes(responseData.radarAxes);
      }

      applyDecisionResponse(responseData, stepId, nextCollect.nomeUsoBase ?? confirmedName);
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

  const handleQuestionnaireSingle = (stepId: string, optionId: string, label: string, otherText?: string) => {
    if (loading) return;
    const nextCollect = applyQuestionnaireStep(
      collectState,
      stepId as Parameters<typeof applyQuestionnaireStep>[1],
      { optionIds: [optionId], labels: [label], otherText },
      sobrenomesDetectados
    );
    setAnswers((prev) => ({ ...prev, [stepId]: label }));
    void pushDecideLive(nextCollect, label, stepId, {
      options: [optionId],
      primary: optionId,
      count: 1,
      has_other: Boolean(otherText?.trim()),
    });
  };

  const handleQuestionnaireMulti = (
    stepId: string,
    ordered: Array<{ id: string; label: string }>,
    otherText?: string
  ) => {
    if (loading) return;
    let nextCollect = applyQuestionnaireStep(
      collectState,
      stepId as Parameters<typeof applyQuestionnaireStep>[1],
      { optionIds: ordered.map((o) => o.id), labels: ordered.map((o) => o.label), otherText },
      sobrenomesDetectados
    );
    if (stepId === 'onde_assina' && nomeArtisticoDraft.trim()) {
      nextCollect = { ...nextCollect, nomeArtistico: nomeArtisticoDraft.trim() };
    }
    const userLabel = ordered.map((o) => o.label).join(', ');
    setAnswers((prev) => ({ ...prev, [stepId]: userLabel }));
    setNomeArtisticoDraft('');
    void pushDecideLive(nextCollect, userLabel, stepId, {
      options: ordered.map((o) => o.id),
      primary: ordered[0]?.id,
      count: ordered.length,
      has_other: Boolean(otherText?.trim()),
    });
  };

  const handleUserAnswer = async (text: string, optionId?: string) => {
    if (!text.trim() || loading) return;

    let nextCollect = applyAnswerToCollectState(
      collectState,
      currentStepId,
      text,
      optionId,
      sobrenomesDetectados
    );
    if (currentStepId === 'palpite' && pendingPalpiteFeedback) {
      nextCollect = {
        ...nextCollect,
        palpiteStatus: pendingPalpiteFeedback,
        objetivoTexto: text.trim(),
      };
      setPendingPalpiteFeedback(null);
    }
    setAnswers((prev) => ({ ...prev, [currentStepId]: optionId || text }));
    await pushDecideLive(nextCollect, text, currentStepId);
  };

  const handleGuessExact = () => {
    capturePostHogEvent('chat_guess_answered', { result: 'acertou' });
    handleUserAnswer('Na mosca');
  };

  const handleGuessPartial = (messageId: string) => {
    capturePostHogEvent('chat_guess_answered', { result: 'parcial' });
    setPendingPalpiteFeedback('parcial');
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              type: 'text_input',
              content: 'O que faltou?',
            }
          : m
      )
    );
  };

  const handleGuessOther = (messageId: string) => {
    capturePostHogEvent('chat_guess_answered', { result: 'nao' });
    setPendingPalpiteFeedback('nao');
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              type: 'text_input',
              content: 'O que faltou?',
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
          const record = Object.fromEntries(axisList.map((a) => [a.key, a.value])) as RadarAxesData;
          setRadarAxes({
            expressao: record.expressao ?? 0.35,
            motivacao: record.motivacao ?? 0.35,
            destino: record.destino ?? 0.35,
            harmonia_triangulo: record.harmonia_triangulo ?? 0.35,
            sequencias: record.sequencias ?? 0.35,
          });
        }
      }
    } catch {
      // silencioso
    }
  };

  const handleRegenerate = async () => {
    if (!confirmedName.trim() || !confirmedDate.trim()) return;
    setIsRegenerating(true);
    setRegenerateNotice(null);
    try {
      const nomesExcluidos = suggestions.map((s) => s.nome);
      const res = await fetch('/api/regenerate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildRegenerateRequestBody({
            analysisId,
            nomeNascimento: confirmedName,
            dataNascimento: confirmedDate,
            collect: collectState,
            nomesExcluidos,
          })
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao regenerar opções');
      }

      if (isRegeneratePoolExhausted(data, nomesExcluidos)) {
        setRegenerateNotice(
          'Não encontramos outras assinaturas diferentes dentro dos filtros do seu questionário. Você pode revisar sobrenomes ou abertura para mudança, ou escolher uma das opções acima.'
        );
        return;
      }

      const novos = mapRegenerateApiToCandidates(data, 3);
      if (novos.length > 0) {
        setSuggestions(novos);
        setActiveSuggestionId(null);
      } else {
        setRegenerateNotice(
          'Não há novas combinações disponíveis agora. Tente ajustar sobrenomes ou o quanto você topa mudar o nome.'
        );
      }
    } catch (err) {
      console.error(err);
      setRegenerateNotice(
        err instanceof Error ? err.message : 'Não foi possível gerar novas opções. Tente de novo.'
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const activeSuggestion = suggestions.find((s) => s.id === activeSuggestionId);

  const contextChips = React.useMemo(
    () => buildQuestionnaireContextChips(collectState),
    [collectState]
  );

  React.useEffect(() => {
    if (!activeSuggestion?.nome || !confirmedDate.trim()) {
      setRadarOverlayAxes(null);
      return;
    }
    try {
      const record = motorRadarToRecord(
        computeMotorRadarAxes(activeSuggestion.nome, confirmedDate)
      );
      setRadarOverlayAxes(record);
    } catch {
      setRadarOverlayAxes(null);
    }
  }, [activeSuggestionId, activeSuggestion?.nome, confirmedDate]);
  const starPanelData = activeSuggestion ? activeSuggestion.panel : basePanel;
  const profileCollectionComplete =
    currentStepId === 'fim_coleta' || currentStepId === 'conclusao';
  const showScoreCard = Boolean(basePanel);
  const showStarDetail = birthConfirmed && Boolean(basePanel);
  const showRadarPanel = shouldShowRadar(collectState);
  const showSummaryPanel = shouldShowSummary(summaryItems);
  const showReadingSummaryPanel = birthConfirmed && Boolean(basePanel);
  const activeReadingSummary = activeSuggestionId
    ? harmonizedSummaries[activeSuggestionId] ?? null
    : birthReadingSummary;
  const activeReadingLoading = Boolean(activeSuggestionId) && readingSummaryLoading;

  const summaryCount =
    (showScoreCard ? 1 : 0) +
    (showStarDetail ? 1 : 0) +
    (showRadarPanel ? 1 : 0) +
    summaryItems.length +
    (showReadingSummaryPanel && (activeReadingSummary || activeReadingLoading) ? 1 : 0);

  const hasSuggestionsMessage = messages.some((m) => m.type === 'suggestions');

  const chatDockScreen = resolveChatDockScreen({
    birthConfirmed,
    canShowSummary: birthConfirmed && Boolean(basePanel),
    profileCollectionComplete,
    hasSuggestionsMessage,
    canRestart: birthConfirmed,
    canRegenerate: profileCollectionComplete && suggestions.length > 0,
    hasAnalysisId: Boolean(analysisId),
    suggestionSelected: Boolean(activeSuggestionId),
  });

  const chatDockLayout = chatDockScreen
    ? buildChatDockLayout(chatDockScreen, {
        birthConfirmed,
        canShowSummary: birthConfirmed && Boolean(basePanel),
        profileCollectionComplete,
        hasSuggestionsMessage,
        canRestart: birthConfirmed,
        canRegenerate: profileCollectionComplete && suggestions.length > 0,
        hasAnalysisId: Boolean(analysisId),
        suggestionSelected: Boolean(activeSuggestionId),
      })
    : null;

  const summarySnapshot = [
    summaryCount,
    activeSuggestionId ?? '',
    basePanel?.score ?? '',
    activeSuggestion?.score ?? '',
    showRadarPanel ? 'r' : '',
  ].join(':');

  useEffect(() => {
    if (!birthConfirmed || !basePanel) return;
    const prev = lastSummarySnapshotRef.current;
    if (prev && prev !== summarySnapshot && !drawerOpen) {
      setSummaryBadge(true);
    }
    lastSummarySnapshotRef.current = summarySnapshot;
  }, [summarySnapshot, drawerOpen, birthConfirmed, basePanel]);

  const openSummaryPanel = () => {
    if (!drawerOpen) {
      capturePostHogEvent('summary_drawer_opened', {
        screen: chatDockScreen ?? 'chat_questionnaire',
        step: currentStepId,
      });
      setSummaryBadge(false);
    }
    setDrawerOpen(true);
  };

  const closeSummaryPanel = (method: SummaryPanelCloseMethod) => {
    const mapped =
      method === 'escape' ? 'x' : method;
    capturePostHogEvent('summary_drawer_closed', {
      screen: chatDockScreen ?? 'chat_questionnaire',
      method: mapped,
    });
    setDrawerOpen(false);
  };

  const handlePdfDownload = () => {
    if (!analysisId) return;
    window.location.href = `/api/generate-pdf?id=${encodeURIComponent(analysisId)}`;
  };

  const handleDockSecondary = (action: DockSecondaryActionId, position: number) => {
    capturePostHogEvent('dock_action_clicked', {
      screen: chatDockScreen ?? 'chat_questionnaire',
      action,
      position,
    });

    if (action === 'summary') {
      if (drawerOpen) {
        closeSummaryPanel('dock');
      } else {
        openSummaryPanel();
      }
      return;
    }
    if (action === 'restart') {
      handleRequestReset();
      return;
    }
    if (action === 'other_options') {
      void handleRegenerate();
    }
  };

  const handleDockPrimary = (action: DockPrimaryActionId) => {
    capturePostHogEvent('dock_primary_clicked', {
      screen: chatDockScreen ?? 'chat_suggestions',
      action,
      is_free: false,
    });
    if (action === 'generate_pdf') {
      handlePdfDownload();
    }
  };

  const sidebarSection = (
    <ChatSidebarSection
      birthPanel={basePanel}
      harmonizedPanel={activeSuggestion?.panel ?? null}
      showScoreCard={showScoreCard}
      showStarDetail={showStarDetail}
      starPanelData={starPanelData}
      isSuggestion={Boolean(activeSuggestionId)}
      onResetToBase={() => setActiveSuggestionId(null)}
      radarAxes={radarAxes}
      radarOverlayAxes={radarOverlayAxes}
      radarShowNumericLabels={Boolean(activeSuggestionId) && profileCollectionComplete}
      contextChips={contextChips}
      showRadar={showRadarPanel}
      summaryItems={summaryItems}
      showSummary={showSummaryPanel}
      readingSummary={activeReadingSummary}
      readingSummaryLoading={activeReadingLoading}
      showReadingSummary={showReadingSummaryPanel}
    />
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
      <ChatProgress
        currentStep={stepIndex}
        totalSteps={totalSteps}
        remaining={remaining}
        className="shrink-0 z-20 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        trailing={<ChatRestartButton onClick={handleRequestReset} />}
      />

      <div
        className={`flex-1 min-h-0 w-full max-w-[1680px] mx-auto px-2.5 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10 grid min-h-0 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-8 ${
          sidebarExpanded
            ? 'md:grid-cols-1'
            : [
                'md:grid-cols-[minmax(0,1fr)_minmax(200px,42%)]',
                'lg:grid-cols-[minmax(0,1fr)_minmax(260px,36%)]',
                'xl:grid-cols-[minmax(0,1fr)_minmax(300px,32%)]',
                '2xl:grid-cols-[minmax(0,1fr)_minmax(340px,30%)]',
              ].join(' ')
        }`}
      >
        <main
          className={`flex flex-col min-h-0 min-w-0 py-3 md:py-3 lg:py-4 ${
            sidebarExpanded ? 'hidden' : ''
          }`}
        >
          <div className="flex-1 min-h-0 chat-scroll-pane space-y-3 pb-4 pt-1 pl-0.5 max-md:pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return <UserBubble key={msg.id} content={msg.content} />;
              }

              const pending = isInteractionPending(msg, currentStepId, answers, birthConfirmed);

              if (msg.type === 'suggestions') {
                if (!profileCollectionComplete) return null;
                return (
                  <NmBubble key={msg.id} wide eyebrow="OPÇÕES HARMONIZADAS">
                    <SuggestionPicker
                      suggestions={suggestions}
                      selectedId={activeSuggestionId}
                      onSelect={handleSuggestionSelect}
                      onRegenerate={handleRegenerate}
                      isRegenerating={isRegenerating}
                      regenerateNotice={regenerateNotice}
                      analysisId={analysisId}
                      onGenerateAnalysis={handleFinalizeAnalysis}
                    />
                  </NmBubble>
                );
              }

              return (
                <NmBubble key={msg.id} wide={msg.wide} eyebrow={msg.eyebrow}>
                  <p className="text-chat-ink leading-relaxed">{msg.content}</p>

                  {pending && msg.type === 'guess' && (
                    <GuessButtons
                      onExact={handleGuessExact}
                      onPartial={() => handleGuessPartial(msg.id)}
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

                  {pending && msg.type === 'questionnaire' && msg.options && msg.stepId && (
                    <>
                      {msg.stepId === 'onde_assina' && (
                        <input
                          type="text"
                          maxLength={60}
                          value={nomeArtisticoDraft}
                          disabled={loading}
                          onChange={(e) => setNomeArtisticoDraft(e.target.value.slice(0, 60))}
                          placeholder="Nome artístico (opcional)"
                          className="mt-3 w-full rounded-2xl bg-[#1C1C1C] border border-[#D4AF37]/30 px-4 py-2.5 text-sm text-chat-ink focus:outline-none focus:border-[#D4AF37]/60"
                        />
                      )}
                      <ChatAdaptivePills
                        mode={
                          (JSON.parse(msg.hypotheticalText || '{}') as { mode?: 'single' | 'multi' })
                            .mode ?? 'single'
                        }
                        options={msg.options}
                        maxSelect={
                          (JSON.parse(msg.hypotheticalText || '{}') as { maxSelect?: number })
                            .maxSelect
                        }
                        minSelect={
                          (JSON.parse(msg.hypotheticalText || '{}') as { minSelect?: number }).minSelect ??
                          1
                        }
                        allowOther={
                          (JSON.parse(msg.hypotheticalText || '{}') as { allowOther?: boolean })
                            .allowOther
                        }
                        otherMaxLength={
                          (JSON.parse(msg.hypotheticalText || '{}') as { otherMaxLength?: number })
                            .otherMaxLength ?? 60
                        }
                        caption={
                          (JSON.parse(msg.hypotheticalText || '{}') as { caption?: string }).caption
                        }
                        disabled={loading}
                        onSubmitSingle={(id, label, other) =>
                          handleQuestionnaireSingle(msg.stepId!, id, label, other)
                        }
                        onSubmitMulti={(ordered, other) =>
                          handleQuestionnaireMulti(msg.stepId!, ordered, other)
                        }
                        onToggleTrack={(option, selected) =>
                          capturePostHogEvent('chat_option_toggled', {
                            step: msg.stepId,
                            option,
                            selected,
                          })
                        }
                        onLimitReached={() =>
                          capturePostHogEvent('chat_limit_reached', { step: msg.stepId })
                        }
                      />
                    </>
                  )}

                  {pending && msg.type === 'pills' && msg.options && msg.options.length > 0 && (
                    <ChatChoicePills
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
                    <ChatStepInteraction
                      showText
                      showPills={Boolean(msg.options?.length)}
                      options={msg.options}
                      onLiveScore={birthConfirmed ? handleLiveScore : undefined}
                      disabled={loading}
                      placeholder={
                        msg.stepId === 'onboarding_nome'
                          ? 'Ex.: Maria da Silva Souza'
                          : msg.stepId === 'sobrenomes'
                            ? 'Ex.: quero manter Malickovski e Correa...'
                            : 'Digite sua resposta...'
                      }
                      onSendText={(text) => {
                        if (msg.stepId === 'onboarding_nome') {
                          handleOnboardingNome(text);
                          return;
                        }
                        handleUserAnswer(text);
                      }}
                      onSelectPill={(opt) =>
                        msg.stepId === 'onboarding_gender'
                          ? handleOnboardingGender(opt.label, opt.id)
                          : handleUserAnswer(opt.label, opt.id)
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

        <aside
          className={`hidden md:flex flex-col min-h-0 min-w-0 py-2 md:py-3 lg:py-4 ${
            sidebarExpanded ? 'max-w-4xl mx-auto w-full' : 'md:max-w-[min(44vw,380px)] lg:max-w-none'
          }`}
        >
          <ChatSidebarPanelChrome
            expanded={sidebarExpanded}
            onToggleExpand={() => setSidebarExpanded((v) => !v)}
          >
            {sidebarSection}
          </ChatSidebarPanelChrome>
        </aside>
      </div>

      <MobileChatDock
        layout={chatDockLayout}
        summaryPanelOpen={drawerOpen}
        summaryBadge={summaryBadge}
        otherOptionsDisabled={isRegenerating}
        onBack={handleChatDockBack}
        onSecondary={handleDockSecondary}
        onPrimary={handleDockPrimary}
      />

      <SummaryDrawer
        isOpen={drawerOpen}
        onClose={closeSummaryPanel}
        birthPanel={basePanel}
        harmonizedPanel={activeSuggestion?.panel ?? null}
        showScoreCard={showScoreCard}
        showStarDetail={showStarDetail}
        starPanelData={starPanelData}
        isSuggestion={Boolean(activeSuggestionId)}
        onResetToBase={() => setActiveSuggestionId(null)}
        radarAxes={radarAxes}
        radarOverlayAxes={radarOverlayAxes}
        radarShowNumericLabels={Boolean(activeSuggestionId) && profileCollectionComplete}
        contextChips={contextChips}
        summaryItems={summaryItems}
        showRadar={showRadarPanel}
        showSummary={showSummaryPanel}
        readingSummary={activeReadingSummary}
        readingSummaryLoading={activeReadingLoading}
        showReadingSummary={showReadingSummaryPanel}
      />

      <Modal
        open={backToStartConfirmOpen}
        onClose={() => setBackToStartConfirmOpen(false)}
        title="Voltar ao início?"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            Você sairá desta conversa e voltará ao painel inicial. O progresso desta sessão permanece
            salvo até você recomeçar manualmente.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => setBackToStartConfirmOpen(false)}
            >
              Continuar aqui
            </Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleConfirmBackToStart}>
              Ir ao início
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reiniciar conversa?"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            Todo o progresso desta conversa será apagado. Você poderá começar de novo em seguida,
            mas as respostas e etapas já concluídas não serão recuperadas.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => setResetConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="danger" size="md" className="flex-1" onClick={handleConfirmReset}>
              Reiniciar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default NomeSocialChat;
