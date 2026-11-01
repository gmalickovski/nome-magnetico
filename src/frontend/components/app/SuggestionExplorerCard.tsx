import { useMemo, useState } from 'react';
import CompatibilityBadge from './CompatibilityBadge';
import {
  NOME_MAGNETICO_COPY,
  type AreaFocoNomeMagnetico,
  type EstiloAssinaturaPreferido,
  type MotivoRefinamentoAssinatura,
} from '../../../shared/interactive-engine/copy';

export interface SuggestionCandidateItem {
  nomeCompleto: string;
  expressao: number;
  motivacao?: number;
  missao?: number;
  impressao?: number;
  destino?: number;
  temBloqueio?: boolean;
  bloqueios?: Array<{ codigo: string; titulo?: string }>;
  compatibilidade?: 'favoravel' | 'neutro' | 'desfavoravel';
  score: number;
  etapa?: 1 | 2 | 3;
  etapaGeracao?: 1 | 2 | 3;
  temAcentoAdicionado?: boolean;
  quantidadeSobrenomes?: number;
  explicacao?: string;
}

interface Props {
  analysisId: string;
  nomeNascimento: string;
  destino: number;
  notaHoje?: number | null;
  melhorNomeInicial: SuggestionCandidateItem | null;
  top3Inicial?: SuggestionCandidateItem[];
  nossasSugestoesIniciais?: SuggestionCandidateItem[];
  sugestoesUsuarioIniciais?: SuggestionCandidateItem[];
  parametrosUsuario?: {
    sobrenomesObrigatorios?: string[];
    sobrenomesExcluidos?: string[];
    estiloPreferido?: EstiloAssinaturaPreferido;
    areaFoco?: AreaFocoNomeMagnetico | string | null;
    subfocoMomento?: string | null;
  };
}

const PARTICULAS = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);

function extrairSobrenomesFront(nomeCompleto: string): string[] {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return [];
  const out: string[] = [];
  for (let i = 1; i < partes.length; i++) {
    const token = partes[i]!;
    const norm = token.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!norm || PARTICULAS.has(norm)) continue;
    const cap = token.charAt(0).toUpperCase() + token.slice(1);
    if (!out.some(r => r.toLowerCase() === cap.toLowerCase())) {
      out.push(cap);
    }
  }
  return out;
}

function temAcentoNovo(candidato: string, original: string): boolean {
  const origCount = (original.match(/[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/g) || []).length;
  const candCount = (candidato.match(/[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/g) || []).length;
  return candCount > origCount;
}

function getSeloMetodo(c: SuggestionCandidateItem, nomeNascimento: string): string {
  const acentoAdicionado =
    typeof c.temAcentoAdicionado === 'boolean'
      ? c.temAcentoAdicionado
      : temAcentoNovo(c.nomeCompleto, nomeNascimento);
  const palavras = c.nomeCompleto.trim().split(/\s+/).filter(Boolean);
  const qtdSobrenomes =
    typeof c.quantidadeSobrenomes === 'number'
      ? c.quantidadeSobrenomes
      : Math.max(0, palavras.length - 1);
  const etapa = c.etapaGeracao ?? c.etapa ?? 1;

  if (qtdSobrenomes === 0 || etapa === 3) {
    return NOME_MAGNETICO_COPY.vitrineSugestoes.selosMetodo.curtaDireta;
  }
  if (acentoAdicionado) {
    return NOME_MAGNETICO_COPY.vitrineSugestoes.selosMetodo.acentoSutil;
  }
  return NOME_MAGNETICO_COPY.vitrineSugestoes.selosMetodo.sobrenomeSelecionado;
}

export default function SuggestionExplorerCard({
  analysisId,
  nomeNascimento,
  destino,
  melhorNomeInicial,
  top3Inicial = [],
  nossasSugestoesIniciais = [],
  sugestoesUsuarioIniciais = [],
  parametrosUsuario = {},
}: Props) {
  const opcoesIniciais = useMemo(() => {
    const lista: SuggestionCandidateItem[] = [];
    const vistos = new Set<string>();
    const fontes = [
      ...(melhorNomeInicial ? [melhorNomeInicial] : []),
      ...top3Inicial,
      ...nossasSugestoesIniciais,
      ...sugestoesUsuarioIniciais,
    ];
    for (const item of fontes) {
      if (!item?.nomeCompleto) continue;
      const chave = item.nomeCompleto.trim().toLowerCase();
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      lista.push(item);
      if (lista.length >= 3) break;
    }
    return lista;
  }, [melhorNomeInicial, top3Inicial, nossasSugestoesIniciais, sugestoesUsuarioIniciais]);

  const [opcoesAtuais, setOpcoesAtuais] = useState<SuggestionCandidateItem[]>(opcoesIniciais);
  const [assinaturaEscolhida, setAssinaturaEscolhida] = useState<string>(
    melhorNomeInicial?.nomeCompleto ?? opcoesIniciais[0]?.nomeCompleto ?? ''
  );
  const [nomesJaVistos, setNomesJaVistos] = useState<string[]>(
    opcoesIniciais.map(o => o.nomeCompleto)
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [motivoSelecionado, setMotivoSelecionado] = useState<MotivoRefinamentoAssinatura | undefined>(
    undefined
  );
  const [sobrenomeForcado, setSobrenomeForcado] = useState<string | undefined>(undefined);
  const [variacaoPropria, setVariacaoPropria] = useState('');
  const [avaliacaoPropria, setAvaliacaoPropria] = useState<SuggestionCandidateItem | null>(null);
  const [feedbackMensagem, setFeedbackMensagem] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectingName, setSelectingName] = useState<string | null>(null);

  const areaFocoAtiva: AreaFocoNomeMagnetico =
    parametrosUsuario.areaFoco === 'prosperidade_financeira' ||
    parametrosUsuario.areaFoco === 'carreira_negocios' ||
    parametrosUsuario.areaFoco === 'relacionamentos_harmonia' ||
    parametrosUsuario.areaFoco === 'autoestima_expressao'
      ? parametrosUsuario.areaFoco
      : 'carreira_negocios';

  const sobrenomesNascimento = useMemo(
    () => extrairSobrenomesFront(nomeNascimento),
    [nomeNascimento]
  );

  const sobrenomePreterido = useMemo(() => {
    if (sobrenomesNascimento.length === 0) return null;
    const principalNorm = assinaturaEscolhida
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const ausente = sobrenomesNascimento.find(
      s =>
        !principalNorm.includes(
          s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        )
    );
    return ausente ?? sobrenomesNascimento[0] ?? null;
  }, [sobrenomesNascimento, assinaturaEscolhida]);

  function getFraseConexao(expressaoSugestao: number): string {
    const template = NOME_MAGNETICO_COPY.vitrineSugestoes.fraseConexaoPorArea[areaFocoAtiva];
    return template
      .replace('{{expressao_sugestao}}', String(expressaoSugestao))
      .replace('{{destino}}', String(destino));
  }

  async function handleEscolherPrincipal(candidato: SuggestionCandidateItem) {
    if (candidato.nomeCompleto === assinaturaEscolhida) return;
    setSelectingName(candidato.nomeCompleto);
    setFeedbackMensagem('');

    try {
      const res = await fetch('/api/regenerate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          selecionarComoPrincipal: candidato.nomeCompleto,
        }),
      });
      const data = await res.json();
      if (res.ok && data.melhorNome) {
        setAssinaturaEscolhida(data.melhorNome.nomeCompleto);
        setFeedbackMensagem(
          `Assinatura ${data.melhorNome.nomeCompleto} definida como principal no seu guia.`
        );
      } else {
        setAssinaturaEscolhida(candidato.nomeCompleto);
      }
    } catch {
      setAssinaturaEscolhida(candidato.nomeCompleto);
    } finally {
      setSelectingName(null);
    }
  }

  async function handleGerarNovasOpcoes(motivoOverride?: MotivoRefinamentoAssinatura, sobOverride?: string) {
    const motivo = motivoOverride ?? motivoSelecionado;
    const sobAlvo = sobOverride ?? sobrenomeForcado;
    setLoading(true);
    setFeedbackMensagem('');

    try {
      const sobrenomesObrigatorios =
        motivo === 'forcar_sobrenome' && sobAlvo
          ? [sobAlvo]
          : parametrosUsuario.sobrenomesObrigatorios ?? [];

      const estiloPreferido: EstiloAssinaturaPreferido =
        motivo === 'preferir_sem_acento'
          ? 'sobrenome_forte'
          : motivo === 'preferir_nome_curto'
            ? 'curto_direto'
            : motivo === 'preferir_nome_completo'
              ? 'ajuste_sutil'
              : parametrosUsuario.estiloPreferido ?? 'qualquer';

      const res = await fetch('/api/regenerate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          nomesExcluidos: nomesJaVistos,
          sobrenomesObrigatorios,
          sobrenomesExcluidos:
            motivo === 'forcar_sobrenome' ? [] : parametrosUsuario.sobrenomesExcluidos ?? [],
          estiloPreferido,
          motivoRefinamento: motivo,
          variacaoPropria: variacaoPropria.trim() ? variacaoPropria.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Não foi possível gerar novas opções agora.');
      }

      const novasOpcoes: SuggestionCandidateItem[] = [];
      const vistosSet = new Set<string>();
      const candidatosRetornados: SuggestionCandidateItem[] = [
        ...(data.melhorNome ? [data.melhorNome] : []),
        ...(Array.isArray(data.top3) ? data.top3 : []),
        ...(Array.isArray(data.nossasSugestoes) ? data.nossasSugestoes : []),
      ];

      for (const item of candidatosRetornados) {
        if (!item?.nomeCompleto) continue;
        const k = item.nomeCompleto.trim().toLowerCase();
        if (vistosSet.has(k)) continue;
        vistosSet.add(k);
        novasOpcoes.push(item);
        if (novasOpcoes.length >= 3) break;
      }

      if (novasOpcoes.length > 0) {
        setOpcoesAtuais(novasOpcoes);
        setAssinaturaEscolhida(novasOpcoes[0]!.nomeCompleto);
        setNomesJaVistos(prev => {
          const unicos = new Set([...prev, ...novasOpcoes.map(o => o.nomeCompleto)]);
          return Array.from(unicos);
        });
      }

      if (data.avaliacaoVariacaoPropria) {
        setAvaliacaoPropria(data.avaliacaoVariacaoPropria);
      }

      setFeedbackMensagem(
        data.feedbackMensagem || NOME_MAGNETICO_COPY.drawerRefinamento.feedbackPadrao
      );
    } catch (err) {
      setFeedbackMensagem(
        err instanceof Error ? err.message : 'Tente novamente em alguns instantes.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (opcoesAtuais.length === 0) return null;

  const subtituloSecao = NOME_MAGNETICO_COPY.vitrineSugestoes.subtituloTemplate.replace(
    '{{destino}}',
    String(destino)
  );

  return (
    <section className="mb-10 pt-2">
      {/* Cabeçalho da Vitrine */}
      <div className="mb-5 px-1 space-y-2">
        <p className="nm-eyebrow">{NOME_MAGNETICO_COPY.vitrineSugestoes.eyebrow}</p>
        <h2 className="nm-h2">{NOME_MAGNETICO_COPY.vitrineSugestoes.titulo}</h2>
        <p className="nm-body max-w-3xl">{subtituloSecao}</p>
      </div>

      {/* Grid das 3 Opções de Assinatura */}
      <div className="grid gap-4 lg:grid-cols-3">
        {opcoesAtuais.map(opcao => {
          const isSelecionada =
            opcao.nomeCompleto.trim().toLowerCase() ===
            assinaturaEscolhida.trim().toLowerCase();
          const isSelecting = selectingName === opcao.nomeCompleto;
          const selo = getSeloMetodo(opcao, nomeNascimento);

          return (
            <div
              key={opcao.nomeCompleto}
              className={`rounded-2xl bg-white/[0.04] p-4 sm:p-5 border flex flex-col justify-between gap-4 transition-all duration-300 ${
                isSelecionada
                  ? 'border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.22)] bg-white/[0.07]'
                  : 'border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/[0.06]'
              }`}
            >
              <div className="space-y-3">
                {/* Selo de método */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    {selo}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2.5 py-0.5 text-xs font-medium text-[#22D3EE]">
                    Destino {destino}
                  </span>
                </div>

                {/* Nome da Assinatura */}
                <div className="font-cinzel text-xl sm:text-2xl font-bold text-white break-words">
                  {opcao.nomeCompleto}
                </div>

                {/* Score e Badge de Compatibilidade estilo clássico */}
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] uppercase font-bold text-gray-400">Nota</span>
                    <span className="font-cinzel text-xl font-bold text-[#D4AF37]">{opcao.score}</span>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                  <CompatibilityBadge compatibilidade={opcao.compatibilidade ?? 'favoravel'} size="sm" showTooltip={true} />
                </div>

                {/* Grid das 5 dimensões cabalísticas */}
                <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-xs text-gray-400">
                  <span>Expr: <span className="text-gray-200 font-medium">{opcao.expressao}</span></span>
                  <span>Dest: <span className="text-[#D4AF37] font-semibold">{opcao.destino ?? destino}</span></span>
                  {opcao.motivacao ? <span>Mot: <span className="text-gray-200 font-medium">{opcao.motivacao}</span></span> : null}
                  {opcao.impressao ? <span>Imp: <span className="text-gray-200 font-medium">{opcao.impressao}</span></span> : null}
                  {opcao.missao ? <span>Mis: <span className="text-gray-200 font-medium">{opcao.missao}</span></span> : null}
                </div>

                {/* Status de Bloqueios */}
                {opcao.temBloqueio ? (
                  <span className="text-xs font-medium text-red-400">⚠ Bloqueio detectado</span>
                ) : (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <span>✓</span> Sem bloqueios
                  </span>
                )}

                {/* Frase de conexão com o momento */}
                <p className="text-xs leading-relaxed text-gray-300">
                  {getFraseConexao(opcao.expressao)}
                </p>

                {opcao.explicacao && (
                  <p className="text-xs text-gray-400">{opcao.explicacao}</p>
                )}
              </div>

              {/* Botão Principal de Seleção */}
              <button
                type="button"
                disabled={isSelecting}
                onClick={() => handleEscolherPrincipal(opcao)}
                className={`min-h-[44px] w-full rounded-full px-4 py-2.5 text-sm font-bold transition-all ${
                  isSelecionada
                    ? 'bg-[#D4AF37] text-black shadow-[0_0_16px_rgba(212,175,55,0.28)]'
                    : 'bg-white/[0.06] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/15'
                }`}
              >
                {isSelecting
                  ? 'Atualizando assinatura principal...'
                  : isSelecionada
                    ? NOME_MAGNETICO_COPY.vitrineSugestoes.botaoEscolherAtivo
                    : NOME_MAGNETICO_COPY.vitrineSugestoes.botaoEscolherPadrao}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feedback de troca ou regeneração */}
      {feedbackMensagem && (
        <div className="mt-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-4 py-3 text-sm text-[#E5E2E1]">
          {feedbackMensagem}
        </div>
      )}

      {/* Avaliação instantânea de variação digitada pelo usuário */}
      {avaliacaoPropria && (
        <div className="mt-4 glass-dark rounded-2xl p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="nm-eyebrow">SUA IDEIA AVALIADA NA HORA</span>
            <span className="text-xs font-bold text-[#D4AF37]">
              Nota {avaliacaoPropria.score} de 100 · Expressão {avaliacaoPropria.expressao}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-cinzel text-lg font-bold text-[#E5E2E1]">
                {avaliacaoPropria.nomeCompleto}
              </p>
              <p className="nm-caption">
                {avaliacaoPropria.temBloqueio
                  ? 'Esta variação ainda possui sequência repetida ativa nos triângulos.'
                  : 'Triângulo da Vida limpo e sem sequências repetidas.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleEscolherPrincipal(avaliacaoPropria)}
              className="min-h-[44px] shrink-0 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] px-4 py-2 text-xs font-bold text-[#E5E2E1] hover:bg-[#D4AF37]/25"
            >
              {NOME_MAGNETICO_COPY.vitrineSugestoes.botaoEscolherPadrao}
            </button>
          </div>
        </div>
      )}

      {/* Drawer "Quero ver outras sugestões de assinatura" */}
      <div className="mt-5">
        <button
          type="button"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(prev => !prev)}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/15 px-5 py-2.5 text-sm font-semibold text-[#E5E2E1] transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
        >
          <span>{NOME_MAGNETICO_COPY.drawerRefinamento.gatilho}</span>
          <span className="text-xs text-[#D4AF37]">{drawerOpen ? '▲' : '▼'}</span>
        </button>

        {drawerOpen && (
          <div className="mt-4 glass-dark rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="space-y-1.5">
              <h4 className="nm-h4">{NOME_MAGNETICO_COPY.drawerRefinamento.titulo}</h4>
              <p className="nm-body">{NOME_MAGNETICO_COPY.drawerRefinamento.subtitulo}</p>
            </div>

            {/* Chips Rápidos de Refinamento (1 toque) */}
            <div className="flex flex-wrap gap-2.5">
              {sobrenomePreterido && (
                <button
                  type="button"
                  onClick={() => {
                    setMotivoSelecionado('forcar_sobrenome');
                    setSobrenomeForcado(sobrenomePreterido);
                    void handleGerarNovasOpcoes('forcar_sobrenome', sobrenomePreterido);
                  }}
                  className={
                    motivoSelecionado === 'forcar_sobrenome'
                      ? 'min-h-[44px] px-3.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] text-[#E5E2E1] text-sm font-semibold shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                      : 'min-h-[44px] px-3.5 rounded-full bg-white/[0.04] border border-white/15 text-[#E5E2E1] text-sm font-medium hover:bg-white/[0.08]'
                  }
                >
                  {NOME_MAGNETICO_COPY.drawerRefinamento.chips.forcarSobrenomeTemplate.replace(
                    '{{sobrenome_preterido}}',
                    sobrenomePreterido
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMotivoSelecionado('preferir_sem_acento');
                  void handleGerarNovasOpcoes('preferir_sem_acento');
                }}
                className={
                  motivoSelecionado === 'preferir_sem_acento'
                    ? 'min-h-[44px] px-3.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] text-[#E5E2E1] text-sm font-semibold shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                    : 'min-h-[44px] px-3.5 rounded-full bg-white/[0.04] border border-white/15 text-[#E5E2E1] text-sm font-medium hover:bg-white/[0.08]'
                }
              >
                {NOME_MAGNETICO_COPY.drawerRefinamento.chips.preferirSemAcento}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMotivoSelecionado('preferir_nome_curto');
                  void handleGerarNovasOpcoes('preferir_nome_curto');
                }}
                className={
                  motivoSelecionado === 'preferir_nome_curto'
                    ? 'min-h-[44px] px-3.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] text-[#E5E2E1] text-sm font-semibold shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                    : 'min-h-[44px] px-3.5 rounded-full bg-white/[0.04] border border-white/15 text-[#E5E2E1] text-sm font-medium hover:bg-white/[0.08]'
                }
              >
                {NOME_MAGNETICO_COPY.drawerRefinamento.chips.preferirNomeCurto}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMotivoSelecionado('preferir_nome_completo');
                  void handleGerarNovasOpcoes('preferir_nome_completo');
                }}
                className={
                  motivoSelecionado === 'preferir_nome_completo'
                    ? 'min-h-[44px] px-3.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] text-[#E5E2E1] text-sm font-semibold shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                    : 'min-h-[44px] px-3.5 rounded-full bg-white/[0.04] border border-white/15 text-[#E5E2E1] text-sm font-medium hover:bg-white/[0.08]'
                }
              >
                {NOME_MAGNETICO_COPY.drawerRefinamento.chips.preferirNomeCompleto}
              </button>

              <button
                type="button"
                onClick={() => setMotivoSelecionado('testar_variacao_propria')}
                className={
                  motivoSelecionado === 'testar_variacao_propria'
                    ? 'min-h-[44px] px-3.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] text-[#E5E2E1] text-sm font-semibold shadow-[0_0_12px_rgba(212,175,55,0.18)]'
                    : 'min-h-[44px] px-3.5 rounded-full bg-white/[0.04] border border-white/15 text-[#E5E2E1] text-sm font-medium hover:bg-white/[0.08]'
                }
              >
                {NOME_MAGNETICO_COPY.drawerRefinamento.chips.testarVariacaoPropria}
              </button>
            </div>

            {/* Campo Curto Opcional */}
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-[#E5E2E1]">
                {NOME_MAGNETICO_COPY.drawerRefinamento.labelCampoProprio}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={variacaoPropria}
                  onChange={e => setVariacaoPropria(e.target.value)}
                  placeholder={NOME_MAGNETICO_COPY.drawerRefinamento.placeholderCampoProprio}
                  maxLength={150}
                  className="input-dark flex-1"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleGerarNovasOpcoes()}
                  className="min-h-[44px] shrink-0 rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-black transition hover:bg-[#f2ca50] disabled:opacity-60"
                >
                  {loading
                    ? 'Calculando novas opções...'
                    : NOME_MAGNETICO_COPY.drawerRefinamento.botaoGerarNovas}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
