import React, { useState, useEffect, useRef } from 'react';
import type {
  ChatMessage,
  ResultPanelData,
  RadarAxesData,
  ReadingSummaryItem,
  CandidateSuggestion,
  NextQuestionSpec,
  DecideLiveResponse,
} from './chat-types.js';
import { ChatHeader } from './ChatHeader.js';
import { ChatProgress } from './ChatProgress.js';
import { NmBubble } from './NmBubble.js';
import { UserBubble } from './UserBubble.js';
import { ChatInput } from './ChatInput.js';
import { PillGroup, type PillOption } from './PillGroup.js';
import { GuessButtons } from './GuessButtons.js';
import { BirthNameCard } from './BirthNameCard.js';
import { SummaryCard } from './SummaryCard.js';
import { ReadingRadar } from './ReadingRadar.js';
import { SummaryDrawer } from './SummaryDrawer.js';
import { ResultPanel } from './ResultPanel.js';
import { SuggestionPicker } from './SuggestionPicker.js';

export interface NomeSocialChatProps {
  birthName?: string;
  birthDate?: string;
  userId?: string;
}

const DEFAULT_AXES: RadarAxesData = {
  momento: 0.3,
  objetivo: 0.3,
  uso: 0.3,
  apego_sobrenome: 0.5,
  urgencia: 0.3,
};

const DEFAULT_PANEL: ResultPanelData = {
  nome: 'Aguardando confirmação',
  score: 48,
  expressao: 0,
  destino: 0,
  motivacao: 0,
  impressao: 0,
  potencial: 0,
  bloqueiosCount: 0,
  bloqueios: [],
  trianguloVida: { topo: 0, base: [] },
};

export function NomeSocialChat({
  birthName: initialBirthName = '',
  birthDate: initialBirthDate = '',
  userId = '',
}: NomeSocialChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [confirmedName, setConfirmedName] = useState(initialBirthName);
  const [confirmedDate, setConfirmedDate] = useState(initialBirthDate);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [stepIndex, setStepIndex] = useState(0);
  const [currentStepId, setCurrentStepId] = useState('nome_data');
  const [remaining, setRemaining] = useState(7);
  const totalSteps = 8;

  const [radarAxes, setRadarAxes] = useState<RadarAxesData>(DEFAULT_AXES);
  const [summaryItems, setSummaryItems] = useState<ReadingSummaryItem[]>([]);
  const [basePanel, setBasePanel] = useState<ResultPanelData>(DEFAULT_PANEL);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CandidateSuggestion[]>([]);
  const [analysisId, setAnalysisId] = useState<string | undefined>(undefined);

  const [activePillOptions, setActivePillOptions] = useState<PillOption[]>([]);
  const [activeGuess, setActiveGuess] = useState<string | null>(null);
  const [inputPlaceholder, setInputPlaceholder] = useState('Digite sua resposta...');
  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final da lista de mensagens
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activePillOptions, activeGuess]);

  // Mensagem inicial de acolhimento e confirmação dos dados de certidão
  useEffect(() => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        type: 'text',
        eyebrow: 'BEM-VINDO AO NOME MAGNÉTICO',
        content:
          'Olá. Vamos construir juntos uma assinatura equilibrada e sem bloqueios, feita sob medida para os seus objetivos.',
      },
      {
        id: 'msg-birth-card',
        sender: 'assistant',
        type: 'birth_card',
        wide: true,
        content: '',
      },
    ]);
  }, []);

  // Confirmação do nome e data de nascimento
  const handleConfirmBirthData = async (data: { nome: string; dataNascimento: string }) => {
    setConfirmedName(data.nome);
    setConfirmedDate(data.dataNascimento);

    // Adiciona balão do usuário confirmando
    const userMsg: ChatMessage = {
      id: `user-birth-${Date.now()}`,
      sender: 'user',
      type: 'text',
      content: `${data.nome} · ${data.dataNascimento}`,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/decide-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthName: data.nome,
          birthDate: data.dataNascimento,
          currentStep: 'nome_data',
          answers: {},
          userId,
        }),
      });

      if (!res.ok) throw new Error('Falha ao processar resposta inicial');
      const responseData: DecideLiveResponse = await res.json();

      applyDecisionResponse(responseData, 'nome_data');
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

  // Aplica o retorno de /api/decide-live no estado
  const applyDecisionResponse = (data: DecideLiveResponse, previousStepId: string) => {
    if (data.radarAxes) setRadarAxes(data.radarAxes);
    if (data.summary) setSummaryItems(data.summary);
    if (data.panel) setBasePanel(data.panel);
    if (data.remaining !== undefined) setRemaining(data.remaining);
    if (data.analysisId) setAnalysisId(data.analysisId);

    if (data.previewTop3 && data.previewTop3.length > 0) {
      setSuggestions(data.previewTop3);
    }

    setCurrentStepId(data.next_step);
    setStepIndex((prev) => prev + 1);

    const newMsgs: ChatMessage[] = [];

    // Se houve leitura ou hipótese retornada pelo motor
    if (data.reading) {
      newMsgs.push({
        id: `reading-${Date.now()}`,
        sender: 'assistant',
        type: 'text',
        eyebrow: 'LEITURA DO MOMENTO',
        content: data.reading,
      });
    }

    // Pergunta ou conclusão subsequente
    if (data.next_question) {
      const q = data.next_question;
      newMsgs.push({
        id: `q-${Date.now()}`,
        sender: 'assistant',
        type: q.tipo === 'palpite' ? 'guess' : 'text',
        eyebrow: q.eyebrow,
        content: q.prompt,
        hypotheticalText: q.palpiteTexto,
      });

      if (q.options && q.options.length > 0) {
        setActivePillOptions(q.options);
      } else {
        setActivePillOptions([]);
      }

      if (q.tipo === 'palpite') {
        setActiveGuess(q.palpiteTexto || q.prompt);
      } else {
        setActiveGuess(null);
      }
    } else {
      setActivePillOptions([]);
      setActiveGuess(null);
    }

    // Se atingiu o passo final com sugestões
    if (data.next_step === 'conclusao' || (data.previewTop3 && data.previewTop3.length > 0)) {
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

  // Envio de resposta pelo usuário (texto digitado ou clique em pill)
  const handleUserAnswer = async (text: string, optionId?: string) => {
    if (!text.trim() || loading) return;

    // Reseta pills e palpite ativos da rodada anterior
    setActivePillOptions([]);
    setActiveGuess(null);
    setInputPlaceholder('Digite sua resposta...');

    // Grava resposta no histórico do chat
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
    setLoading(true);

    try {
      const res = await fetch('/api/decide-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthName: confirmedName,
          birthDate: confirmedDate,
          currentStep: currentStepId,
          userInput: text,
          answers: updatedAnswers,
          userId,
        }),
      });

      if (!res.ok) throw new Error('Erro ao processar etapa');
      const responseData: DecideLiveResponse = await res.json();

      applyDecisionResponse(responseData, currentStepId);
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

  // Ações dos botões de palpite
  const handleGuessExact = () => {
    handleUserAnswer('Na mosca');
  };

  const handleGuessPartial = () => {
    handleUserAnswer('Em parte');
  };

  const handleGuessOther = () => {
    setActiveGuess(null);
    setInputPlaceholder('Então, o que é? Conta com as suas palavras...');
  };

  // Debounce de live-score enquanto digita
  const handleLiveScore = async (text: string) => {
    if (!text || text.length < 3) return;
    try {
      const res = await fetch('/api/score-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthName: confirmedName,
          birthDate: confirmedDate,
          currentStep: currentStepId,
          userInput: text,
          answers,
        }),
      });
      if (res.ok) {
        const live = await res.json();
        if (live.radarAxes) setRadarAxes(live.radarAxes);
        if (live.summaryPreview) setSummaryItems(live.summaryPreview);
      }
    } catch {
      // Endpoint silencioso, falhas de digitação não interrompem a experiência
    }
  };

  // Regenerar sugestões com outros filtros
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

  // Painel ativo: exibe o candidato selecionado ou a base do nome de nascimento
  const activeSuggestion = suggestions.find((s) => s.id === activeSuggestionId);
  const displayedPanelData = activeSuggestion ? activeSuggestion.panel : basePanel;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Header com orbe mística e botão de resumo no mobile */}
      <ChatHeader
        summaryCount={summaryItems.length}
        onOpenSummary={() => setDrawerOpen(true)}
      />

      {/* Barra de progresso contínua */}
      <ChatProgress
        currentStep={stepIndex}
        totalSteps={totalSteps}
        remaining={remaining}
      />

      {/* Grid Principal: Chat à esquerda e Painel Sticky à direita no Desktop */}
      <div className="w-full max-w-5xl mx-auto px-4 py-6 flex-1 lg:grid lg:grid-cols-[minmax(0,640px)_320px] lg:gap-8 items-start">
        {/* Coluna Principal: Fluxo Conversacional */}
        <main className="flex flex-col w-full min-h-[500px] justify-between">
          <div className="flex-1 space-y-3 pb-24">
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <UserBubble
                    key={msg.id}
                    content={msg.content}
                    onEdit={() => {
                      // Permite reeditar digitando novamente
                      setInputPlaceholder(`Corrigindo: "${msg.content}"`);
                    }}
                  />
                );
              }

              // Mensagens do Assistente
              if (msg.type === 'birth_card') {
                return (
                  <NmBubble key={msg.id} wide eyebrow="CERTIDÃO DE NASCIMENTO">
                    <BirthNameCard
                      initialName={confirmedName}
                      initialDate={confirmedDate}
                      onConfirm={handleConfirmBirthData}
                      disabled={loading}
                    />
                  </NmBubble>
                );
              }

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
                <NmBubble
                  key={msg.id}
                  wide={msg.wide}
                  eyebrow={msg.eyebrow}
                >
                  <p className="text-chat-ink leading-relaxed">{msg.content}</p>

                  {/* Botões do palpite renderizados dentro do balão quando for um palpite */}
                  {msg.type === 'guess' && activeGuess && (
                    <GuessButtons
                      onExact={handleGuessExact}
                      onPartial={handleGuessPartial}
                      onOther={handleGuessOther}
                      disabled={loading}
                    />
                  )}
                </NmBubble>
              );
            })}

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

          {/* Área de Entrada Fixa/Sticky Inferior com Pills ABAIXO da caixa */}
          <div className="sticky bottom-4 z-10 w-full pt-2">
            <div className="rounded-2xl bg-dark-deeper/90 backdrop-blur-md p-2 border border-white/5 shadow-2xl">
              <ChatInput
                onSend={(text) => handleUserAnswer(text)}
                onLiveScore={handleLiveScore}
                placeholder={inputPlaceholder}
                disabled={loading || stepIndex === 0}
              />

              {/* Tags em formato de pílulas posicionadas ABAIXO da caixa de texto */}
              {activePillOptions.length > 0 && (
                <PillGroup
                  options={activePillOptions}
                  onSelect={(opt) => handleUserAnswer(opt.label, opt.id)}
                  disabled={loading}
                />
              )}
            </div>
          </div>
        </main>

        {/* Coluna Lateral no Desktop (>= lg) */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-6">
          <ResultPanel
            data={displayedPanelData}
            isSuggestion={Boolean(activeSuggestionId)}
            onResetToBase={() => setActiveSuggestionId(null)}
          />

          <div className="rounded-2xl border border-white/10 bg-chat-bubble/70 p-3 flex flex-col items-center">
            <span className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-chat-muted mb-1 self-start">
              Radar das Dimensões
            </span>
            <ReadingRadar axes={radarAxes} />
          </div>

          <SummaryCard items={summaryItems} />
        </aside>
      </div>

      {/* Drawer móvel da direita (< lg) */}
      <SummaryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        panelData={displayedPanelData}
        isSuggestion={Boolean(activeSuggestionId)}
        onResetToBase={() => setActiveSuggestionId(null)}
        radarAxes={radarAxes}
        summaryItems={summaryItems}
      />
    </div>
  );
}

export default NomeSocialChat;
