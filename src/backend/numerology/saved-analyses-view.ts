import { resolveRadarContext as extractSocialContext } from '../../shared/interactive-engine/radar-context';
/**
 * Helper SSR que prepara a lista ordenada (mais recente primeiro) de análises
 * salvas para a tela /app/analises com cards estilo sugestão e dados completos
 * para o painel lateral unificado (`ChatSidebarSection`).
 */

import type { Analysis } from '../db/analyses';
import { avaliarNome } from './score';
import { getScoreVersion } from './score-version';
import { avaliarCompatibilidade } from './harmonization';
import { buildClientBirthNamePanel } from './birth-name-panel';
import { buildChatReadingSummary } from './chat-reading-summary';
import { analisarNomeSocial } from './products/nome-social';
import {
  computeContextualRadarAxes,
  getRadarAxisLabels,
  motorRadarToRecord,
} from '../../shared/interactive-engine/motor-radar';
import type { AreaFocoNomeMagnetico } from '../../shared/interactive-engine/copy';
import type { HarmonySuggestionCardData } from '../../frontend/components/landing/ProductResultFrame';
import type { RadarAxesData, ResultPanelData } from '../../frontend/components/app/chat/chat-types';
import type {
  SavedAnalysisCandidateRow,
  SavedAnalysisItem,
  SavedAnalysisPanelData,
} from '../../frontend/components/app/analises/types';

const PRODUCT_LABEL: Record<string, string> = {
  analise_gratuita: 'Nome Atual',
  nome_social: 'Nome Social',
  nome_bebe: 'Nome de Bebê',
  nome_empresa: 'Nome Empresarial',
};

function toScoreDate(value?: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  return value;
}

function mapCompat(raw?: string | null): HarmonySuggestionCardData['compatibilidade'] {
  const n = (raw ?? '').toLowerCase();
  if (n.includes('favor') || n.includes('total') || n.includes('complement')) return 'favoravel';
  if (n.includes('neutr') || n.includes('aceit')) return 'neutro';
  return 'desfavoravel';
}

function toRadarAxesData(record: Record<string, number> | null | undefined): RadarAxesData | null {
  if (!record) return null;
  return {
    expressao: Number(record.expressao ?? 0),
    motivacao: Number(record.motivacao ?? 0),
    destino: Number(record.destino ?? 0),
    harmonia_triangulo: Number(record.harmonia_triangulo ?? 0),
    sequencias: Number(record.sequencias ?? 0),
  };
}

function toResultPanel(
  panel: ReturnType<typeof buildClientBirthNamePanel>,
  overrideScore?: number | null,
  isHarmonized?: boolean,
): ResultPanelData {
  return {
    nome: panel.nome,
    arquetipo: panel.arquetipo,
    score: overrideScore != null ? overrideScore : panel.score,
    expressao: panel.expressao,
    destino: panel.destino,
    motivacao: panel.motivacao,
    missao: panel.missao,
    impressao: panel.impressao,
    potencial: panel.potencial,
    bloqueiosCount: panel.bloqueiosCount,
    bloqueios: panel.bloqueios,
    vidaBloqueiosCodigos: panel.vidaBloqueiosCodigos,
    trianguloVida: panel.trianguloVida,
    compatibilidade: panel.compatibilidade,
    isHarmonized,
  };
}

function resolveScoreForAnalysis(
  a: Analysis,
  nomeExibido: string,
  rankingSocial: any,
  freqData: any,
): number | null {
  if (a.status !== 'complete') return null;

  const isV3 = a.score_version === 'v3';
  const version = getScoreVersion();

  if (isV3 && a.score_v3 != null) {
    return a.score_v3;
  }
  if (version === 'v3' && a.score_v3 != null) {
    return a.score_v3;
  }
  if (version === 'v3' && a.nome_completo && a.data_nascimento) {
    const dataPt = toScoreDate(a.data_nascimento);
    if (dataPt) {
      const targetName =
        a.product_type === 'nome_social' &&
        (freqData?.selectedNomeSocial || rankingSocial?.melhorNome?.nomeCompleto)
          ? (freqData?.selectedNomeSocial ?? rankingSocial.melhorNome.nomeCompleto)
          : nomeExibido || a.nome_completo;
      return avaliarNome(targetName, dataPt).score_v3;
    }
  }
  return a.score ?? null;
}


function buildFallbackPanelFromColumns(
  a: Analysis,
  nomeExibido: string,
  score: number | null,
): ResultPanelData {
  const expressao = Number(a.numero_expressao ?? 0);
  const destino = Number(a.numero_destino ?? 0);
  const motivacao = Number(a.numero_motivacao ?? 0);
  const missao = Number(a.numero_missao ?? 0);
  const impressao = Number(a.numero_impressao ?? 0);
  const rawBloqueios = Array.isArray(a.bloqueios) ? a.bloqueios : [];
  const compat =
    expressao > 0 && destino > 0 ? avaliarCompatibilidade(expressao, destino) : 'aceitavel';

  return {
    nome: nomeExibido,
    score: score ?? 0,
    expressao,
    destino,
    motivacao,
    missao,
    impressao,
    potencial: a.potencial ?? score ?? 0,
    bloqueiosCount: rawBloqueios.length,
    bloqueios: rawBloqueios.map((b: any) => ({
      codigo: String(b?.codigo ?? ''),
      titulo: String(b?.titulo ?? `Sequência ${b?.codigo ?? ''}`),
      triangulos: Array.isArray(b?.triangulos) ? b.triangulos : undefined,
    })),
    vidaBloqueiosCodigos: rawBloqueios
      .filter((b: any) => Array.isArray(b?.triangulos) && b.triangulos.includes('vida'))
      .map((b: any) => String(b?.codigo ?? ''))
      .filter(Boolean),
    trianguloVida: {
      topo: Number((a.triangulo_vida as any)?.arcanoRegente ?? a.arcano_regente ?? 0),
      base: Array.isArray((a.triangulo_vida as any)?.linhas?.[0])
        ? ((a.triangulo_vida as any).linhas[0] as number[])
        : [],
    },
    compatibilidade: compat,
  };
}

function buildCandidatesList(ranking: any, isEmpresa: boolean): SavedAnalysisCandidateRow[] | undefined {
  const raw = Array.isArray(ranking?.nomesCandidatos) ? ranking.nomesCandidatos : [];
  if (raw.length === 0) return undefined;
  return raw.slice(0, 8).map((c: any) => ({
    nome: String(isEmpresa ? (c?.nomeEmpresa ?? c?.nomeCompleto ?? '') : (c?.nomeCompleto ?? c?.nomeEmpresa ?? '')),
    score: Number(c?.score ?? 0),
    compatibilidade: String(c?.compatibilidade ?? 'neutro'),
    expressao: Number(c?.expressao ?? 0),
    motivacao: Number(c?.motivacao ?? 0),
    impressao: Number(c?.impressao ?? 0),
    missao: Number(c?.missao ?? 0),
    bloqueios: Array.isArray(c?.bloqueios)
      ? c.bloqueios.length
      : Number(c?.bloqueios ?? 0),
  }));
}

/** DEV-317: tag do card. Nome de nascimento, sugestão do sistema ou nome testado pela pessoa. */
export function resolverOrigemNome(
  isFreeRow: boolean,
  productType: string,
  nomeExibido: string,
  birthName: string | null,
  rankingSocial: any,
): 'nascimento' | 'sistema' | 'teste' | undefined {
  if (isFreeRow) return 'nascimento';
  if (productType !== 'nome_social') return undefined;
  const chave = (t: string) => t.trim().toLowerCase();
  if (birthName && chave(birthName) === chave(nomeExibido)) return 'nascimento';
  const candidatos: any[] = Array.isArray(rankingSocial?.nomesCandidatos) ? rankingSocial.nomesCandidatos : [];
  const achado = candidatos.find((c) => typeof c?.nomeCompleto === 'string' && chave(c.nomeCompleto) === chave(nomeExibido));
  // Só o campo "Seu teste" grava origem 'manual'. Os nomes escolhidos entre as sugestões chegam ao
  // analyze como lista do usuário (origemSugerida 'usuario'), mas foram gerados pelo sistema.
  if (achado?.origem === 'manual') return 'teste';
  return 'sistema';
}

export interface BuildSavedAnalysesOptions {
  /** Resolve a birth card linked from the dashboard using an owned source row. */
  preferredBirthSourceAnalysisId?: string | null;
  isAdmin: boolean;
  profileBirthName?: string | null;
  profileBirthDate?: string | null;
}

function buildSynthesizedBirthAnalysisItem(params: {
  birthName: string;
  birthDatePt: string | null;
  sourceItem: SavedAnalysisItem | null;
  options: BuildSavedAnalysesOptions;
}): SavedAnalysisItem {
  const { birthName, birthDatePt, sourceItem } = params;
  const cleanName = birthName.trim();
  const context = {
    areaFoco: null as AreaFocoNomeMagnetico | null,
    ondeAssinaRaw: [] as string[],
  };
  const radarLabels = getRadarAxisLabels(null);

  let birthPanel: ResultPanelData;
  let radarAxes: RadarAxesData | null = null;
  let readingSummary: SavedAnalysisPanelData['readingSummary'] = null;

  if (birthDatePt) {
    const rawBirth = buildClientBirthNamePanel(cleanName, birthDatePt);
    const v3Score = avaliarNome(cleanName, birthDatePt).score_v3;
    birthPanel = toResultPanel(rawBirth, v3Score, false);
    radarAxes = toRadarAxesData(
      motorRadarToRecord(computeContextualRadarAxes(cleanName, birthDatePt, context)),
    );
    readingSummary = buildChatReadingSummary(cleanName, birthDatePt);
  } else {
    birthPanel = {
      nome: cleanName,
      score: sourceItem?.panelData.birthPanel?.score ?? 0,
      expressao: sourceItem?.panelData.birthPanel?.expressao ?? 0,
      destino: sourceItem?.panelData.birthPanel?.destino ?? 0,
      motivacao: sourceItem?.panelData.birthPanel?.motivacao ?? 0,
      missao: sourceItem?.panelData.birthPanel?.missao ?? 0,
      impressao: sourceItem?.panelData.birthPanel?.impressao ?? 0,
      potencial: sourceItem?.panelData.birthPanel?.potencial ?? 0,
      bloqueiosCount: sourceItem?.panelData.birthPanel?.bloqueiosCount ?? 0,
      bloqueios: sourceItem?.panelData.birthPanel?.bloqueios ?? [],
      vidaBloqueiosCodigos: sourceItem?.panelData.birthPanel?.vidaBloqueiosCodigos ?? [],
      trianguloVida: sourceItem?.panelData.birthPanel?.trianguloVida ?? { topo: 0, base: [] },
      compatibilidade: sourceItem?.panelData.birthPanel?.compatibilidade ?? 'neutro',
      isHarmonized: false,
    };
  }

  const cardData: HarmonySuggestionCardData = {
    nome: cleanName,
    score: birthPanel.score,
    compatibilidade: mapCompat(birthPanel.compatibilidade),
    expressao: birthPanel.expressao,
    destino: birthPanel.destino,
    motivacao: birthPanel.motivacao,
    impressao: birthPanel.impressao,
    missao: birthPanel.missao,
    bloqueios: birthPanel.bloqueiosCount,
    vidaBloqueiosCodigos: birthPanel.vidaBloqueiosCodigos ?? [],
  };

  const createdAt = sourceItem?.createdAt ?? new Date().toISOString();
  const dateFormatted = sourceItem
    ? sourceItem.dateFormatted
    : birthDatePt ?? new Date(createdAt).toLocaleDateString('pt-BR');

  return {
    id: sourceItem ? `${sourceItem.id}__birth` : 'birth-name-analysis',
    pdfAnalysisId: sourceItem?.id ?? null,
    isSynthetic: true,
    productType: 'analise_gratuita',
    productName: 'Nome de Nascimento',
    status: 'complete',
    createdAt,
    dateFormatted,
    nomeExibido: cleanName,
    birthName: cleanName,
    birthDateFormatted: birthDatePt,
    score: birthPanel.score,
    isV3: true,
    isFree: true,
    isFavorite: false,
    canFavorite: false,
    canDelete: false,
    isAnalystGenerated: false,
    origemNome: 'nascimento',
    recalculatedFromVersion: null,
    parentAnalysisId: null,
    errorMessage: null,
    cardData,
    panelData: {
      birthPanel,
      harmonizedPanel: null,
      showScoreCard: true,
      showStarDetail: true,
      starPanelData: birthPanel,
      isSuggestion: false,
      radarAxes,
      radarOverlayAxes: null,
      radarLabels,
      radarShowNumericLabels: false,
      contextChips: [],
      showRadar: Boolean(radarAxes),
      readingSummary,
      showReadingSummary: Boolean(readingSummary),
      chosenScore: birthPanel.score,
      baseScore: birthPanel.score,
    },
  };
}

export function buildSavedAnalysesItems(
  analyses: Analysis[],
  options: BuildSavedAnalysesOptions,
): SavedAnalysisItem[] {
  const visibleAnalyses = analyses
    .filter((a) => {
      const isFreeRow = a.product_type === 'analise_gratuita' || a.is_free;
      if (isFreeRow) return a.status === 'complete';
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const items: SavedAnalysisItem[] = visibleAnalyses.map((a) => {
    const productType = a.product_type ?? 'nome_social';
    const isFreeRow = productType === 'analise_gratuita' || Boolean(a.is_free);
    const freqData = (a as any).frequencias_numeros as any;
    const rankingBebe = freqData?.ranking ?? null;
    const rankingEmpresa = productType === 'nome_empresa' ? freqData : null;
    const rankingSocial = productType === 'nome_social' ? freqData?.ranking : null;

    const nomeExibido = isFreeRow
      ? a.nome_completo
      : productType === 'nome_social' &&
          (freqData?.selectedNomeSocial || rankingSocial?.melhorNome?.nomeCompleto)
        ? String(freqData?.selectedNomeSocial ?? rankingSocial.melhorNome.nomeCompleto)
        : productType === 'nome_bebe' && rankingBebe?.melhorNome?.nomeCompleto
          ? String(rankingBebe.melhorNome.nomeCompleto)
          : productType === 'nome_empresa' && rankingEmpresa?.melhorNome?.nomeEmpresa
            ? String(rankingEmpresa.melhorNome.nomeEmpresa)
            : a.nome_completo;

    const isV3 = a.score_version === 'v3';
    const score = resolveScoreForAnalysis(a, nomeExibido, rankingSocial, freqData);

    const birthName =
      productType === 'nome_social'
        ? ((rankingSocial?.nomeNascimento as string | undefined)?.trim() || a.nome_completo?.trim() || null)
        : productType === 'nome_empresa'
          ? ((rankingEmpresa?.nomeSocioPrincipal as string | undefined)?.trim() || null)
          : null;

    const dataNascimentoRaw =
      productType === 'nome_social'
        ? ((rankingSocial?.dataNascimento as string | undefined) ?? a.data_nascimento ?? null)
        : productType === 'nome_bebe'
          ? ((rankingBebe?.dataNascimento as string | undefined) ?? a.data_nascimento ?? null)
          : ((rankingEmpresa?.dataFundacao as string | undefined) ??
            (rankingEmpresa?.dataNascimentoSocio as string | undefined) ??
            a.data_nascimento ??
            null);

    const dataPt = toScoreDate(dataNascimentoRaw);

    const isFavorite =
      a.status === 'complete' &&
      a.product_type !== 'analise_gratuita' &&
      !a.is_free &&
      Boolean(freqData?.is_favorite);

    const emptyPanelData: SavedAnalysisPanelData = {
      birthPanel: null,
      harmonizedPanel: null,
      showScoreCard: false,
      showStarDetail: false,
      starPanelData: null,
      isSuggestion: false,
      radarAxes: null,
      radarOverlayAxes: null,
      radarLabels: undefined,
      radarShowNumericLabels: false,
      contextChips: [],
      showRadar: false,
      readingSummary: null,
      showReadingSummary: false,
      chosenScore: score,
      baseScore: null,
    };

    let cardData: HarmonySuggestionCardData | null = null;
    let panelData: SavedAnalysisPanelData = emptyPanelData;

    if (a.status === 'complete') {
      try {
        if (productType === 'nome_social' || productType === 'analise_gratuita') {
          const { areaFoco, ondeAssinaRaw, contextChips } = extractSocialContext(freqData, rankingSocial);
          const radarContext = { areaFoco, ondeAssinaRaw };
          const radarLabels = getRadarAxisLabels(areaFoco);
          const birthTarget = birthName || nomeExibido;
          const showDual =
            productType === 'nome_social' &&
            Boolean(birthTarget) &&
            Boolean(nomeExibido) &&
            birthTarget.trim().toLowerCase() !== nomeExibido.trim().toLowerCase();

          let birthPanel: ResultPanelData | null = null;
          let harmonizedPanel: ResultPanelData | null = null;
          let radarAxes: RadarAxesData | null = null;
          let radarOverlayAxes: RadarAxesData | null = null;
          let readingSummary: SavedAnalysisPanelData['readingSummary'] = null;

          if (dataPt && birthTarget) {
            const rawBirth = buildClientBirthNamePanel(birthTarget, dataPt);
            const birthScore = isV3
              ? rawBirth.score
              : analisarNomeSocial(birthTarget, dataPt).score;
            birthPanel = toResultPanel(rawBirth, showDual ? birthScore : (score ?? birthScore), false);
            radarAxes = toRadarAxesData(
              motorRadarToRecord(computeContextualRadarAxes(birthTarget, dataPt, radarContext)),
            );

            if (showDual && nomeExibido) {
              const rawHarm = buildClientBirthNamePanel(nomeExibido, dataPt);
              harmonizedPanel = toResultPanel(rawHarm, score ?? rawHarm.score, true);
              radarOverlayAxes = toRadarAxesData(
                motorRadarToRecord(computeContextualRadarAxes(nomeExibido, dataPt, radarContext)),
              );
            }

            const readingTarget = showDual ? nomeExibido : birthTarget;
            readingSummary = buildChatReadingSummary(readingTarget, dataPt);
          } else {
            birthPanel = buildFallbackPanelFromColumns(a, nomeExibido, score);
          }

          const starPanelData = harmonizedPanel ?? birthPanel;
          if (starPanelData) {
            cardData = {
              nome: nomeExibido,
              score: score ?? starPanelData.score,
              compatibilidade: mapCompat(starPanelData.compatibilidade),
              expressao: starPanelData.expressao,
              destino: starPanelData.destino,
              motivacao: starPanelData.motivacao,
              impressao: starPanelData.impressao,
              missao: starPanelData.missao,
              bloqueios: starPanelData.bloqueiosCount,
              vidaBloqueiosCodigos: starPanelData.vidaBloqueiosCodigos ?? [],
            };
          }

          panelData = {
            birthPanel,
            harmonizedPanel,
            showScoreCard: Boolean(birthPanel),
            showStarDetail: Boolean(starPanelData),
            starPanelData,
            isSuggestion: Boolean(harmonizedPanel),
            radarAxes,
            radarOverlayAxes,
            radarLabels,
            radarShowNumericLabels: Boolean(harmonizedPanel),
            contextChips,
            showRadar: Boolean(radarAxes),
            readingSummary,
            showReadingSummary: Boolean(readingSummary),
            chosenScore: score ?? starPanelData?.score ?? null,
            baseScore: birthPanel?.score ?? null,
          };
        } else {
          // nome_bebe or nome_empresa
          const ranking = productType === 'nome_bebe' ? rankingBebe : rankingEmpresa;
          const melhor = ranking?.melhorNome;
          const radarLabels = getRadarAxisLabels(null);

          let birthPanel: ResultPanelData | null = null;
          let radarAxes: RadarAxesData | null = null;
          let readingSummary: SavedAnalysisPanelData['readingSummary'] = null;

          if (dataPt && nomeExibido) {
            const rawPanel = buildClientBirthNamePanel(nomeExibido, dataPt);
            birthPanel = toResultPanel(rawPanel, score ?? melhor?.score ?? rawPanel.score, false);
            if (productType === 'nome_empresa' && rankingEmpresa?.destinoSocio != null) {
              birthPanel.destino = Number(rankingEmpresa.destinoSocio);
            } else if (productType === 'nome_bebe' && rankingBebe?.destino != null) {
              birthPanel.destino = Number(rankingBebe.destino);
            }
            radarAxes = toRadarAxesData(
              motorRadarToRecord(
                computeContextualRadarAxes(nomeExibido, dataPt, {
                  areaFoco: null,
                  ondeAssinaRaw: [],
                }),
              ),
            );
            readingSummary = buildChatReadingSummary(nomeExibido, dataPt);
          } else {
            birthPanel = buildFallbackPanelFromColumns(a, nomeExibido, score);
          }

          if (melhor) {
            const destinoNum =
              productType === 'nome_bebe'
                ? Number(rankingBebe?.destino ?? a.numero_destino ?? birthPanel.destino)
                : Number(rankingEmpresa?.destinoSocio ?? a.numero_destino ?? birthPanel.destino);
            const bloqueiosNum = Array.isArray(melhor.bloqueios)
              ? melhor.bloqueios.length
              : Number(melhor.bloqueios ?? birthPanel.bloqueiosCount ?? 0);

            cardData = {
              nome: nomeExibido,
              score: Number(score ?? melhor.score ?? birthPanel.score),
              compatibilidade: mapCompat(melhor.compatibilidade ?? birthPanel.compatibilidade),
              expressao: Number(melhor.expressao ?? birthPanel.expressao),
              destino: destinoNum,
              motivacao: Number(melhor.motivacao ?? birthPanel.motivacao),
              impressao: Number(melhor.impressao ?? birthPanel.impressao),
              missao: Number(melhor.missao ?? birthPanel.missao),
              bloqueios: bloqueiosNum,
              vidaBloqueiosCodigos: birthPanel.vidaBloqueiosCodigos ?? [],
            };
          } else {
            cardData = {
              nome: nomeExibido,
              score: score ?? birthPanel.score,
              compatibilidade: mapCompat(birthPanel.compatibilidade),
              expressao: birthPanel.expressao,
              destino: birthPanel.destino,
              motivacao: birthPanel.motivacao,
              impressao: birthPanel.impressao,
              missao: birthPanel.missao,
              bloqueios: birthPanel.bloqueiosCount,
              vidaBloqueiosCodigos: birthPanel.vidaBloqueiosCodigos ?? [],
            };
          }

          panelData = {
            birthPanel,
            harmonizedPanel: null,
            showScoreCard: Boolean(birthPanel),
            showStarDetail: Boolean(birthPanel),
            starPanelData: birthPanel,
            isSuggestion: false,
            radarAxes,
            radarOverlayAxes: null,
            radarLabels,
            radarShowNumericLabels: false,
            contextChips: [],
            showRadar: Boolean(radarAxes),
            readingSummary,
            showReadingSummary: Boolean(readingSummary),
            chosenScore: cardData.score,
            baseScore: cardData.score,
            candidateSummary: buildCandidatesList(ranking, productType === 'nome_empresa'),
          };
        }
      } catch (err) {
        console.warn('[saved-analyses-view] Erro ao montar snapshot para análise:', a.id, err);
        const fallback = buildFallbackPanelFromColumns(a, nomeExibido, score);
        cardData = {
          nome: nomeExibido,
          score: score ?? fallback.score,
          compatibilidade: mapCompat(fallback.compatibilidade),
          expressao: fallback.expressao,
          destino: fallback.destino,
          motivacao: fallback.motivacao,
          impressao: fallback.impressao,
          missao: fallback.missao,
          bloqueios: fallback.bloqueiosCount,
          vidaBloqueiosCodigos: fallback.vidaBloqueiosCodigos ?? [],
        };
        panelData = {
          ...emptyPanelData,
          birthPanel: fallback,
          starPanelData: fallback,
          showScoreCard: true,
          showStarDetail: true,
          chosenScore: cardData.score,
          baseScore: cardData.score,
        };
      }
    }

    return {
      id: a.id,
      pdfAnalysisId: a.id,
      isSynthetic: false,
      productType,
      productName: PRODUCT_LABEL[productType] ?? 'Análise',
      status: a.status,
      createdAt: a.created_at,
      dateFormatted: new Date(a.created_at).toLocaleDateString('pt-BR'),
      nomeExibido,
      birthName,
      birthDateFormatted: dataPt,
      score,
      isV3,
      isFree: Boolean(a.is_free),
      isFavorite,
      canFavorite:
        a.status === 'complete' && productType !== 'analise_gratuita' && !a.is_free,
      canDelete: !a.is_free || options.isAdmin,
      isAnalystGenerated: Boolean(a.is_analyst_generated),
      origemNome: resolverOrigemNome(isFreeRow, productType, nomeExibido, birthName, rankingSocial),
      recalculatedFromVersion: a.recalculated_from_version ?? null,
      parentAnalysisId: a.parent_analysis_id ?? null,
      errorMessage: a.error_message ?? null,
      cardData,
      panelData,
    };
  });

  // Garante que a análise do nome de nascimento (não harmonizado) apareça por padrão em Minhas Análises
  const hasCompletedFreeBirthRow = items.some(
    (item) => (item.isFree || item.productType === 'analise_gratuita') && item.status === 'complete',
  );

  if (!hasCompletedFreeBirthRow) {
    const sourceSocial =
      items.find(item => item.id === options.preferredBirthSourceAnalysisId && item.productType === 'nome_social' && item.status === 'complete' && Boolean(item.birthName?.trim())) ??
      items.find(
        (item) =>
          item.productType === 'nome_social' &&
          item.status === 'complete' &&
          Boolean(item.birthName?.trim()),
      ) ?? null;

    const candidateBirthName =
      sourceSocial?.birthName?.trim() || options.profileBirthName?.trim() || null;
    const candidateBirthDatePt =
      sourceSocial?.birthDateFormatted ?? toScoreDate(options.profileBirthDate) ?? null;

    if (candidateBirthName) {
      const normalizedTarget = candidateBirthName.toLowerCase();
      const alreadyShownAsBirthAnalysis = items.some(
        (item) =>
          item.status === 'complete' &&
          !item.panelData.harmonizedPanel &&
          item.nomeExibido.trim().toLowerCase() === normalizedTarget,
      );

      if (!alreadyShownAsBirthAnalysis) {
        items.push(
          buildSynthesizedBirthAnalysisItem({
            birthName: candidateBirthName,
            birthDatePt: candidateBirthDatePt,
            sourceItem: sourceSocial,
            options,
          }),
        );
      }
    }
  }

  return items;
}
