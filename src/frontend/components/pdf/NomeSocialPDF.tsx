/**
 * NomeSocialPDF — documento PDF da análise de Nome Social.
 *
 * Estrutura de páginas:
 *   1. Capa (gold/purple — estrela de 5 pontas)
 *   2. A Estrela de 5 Pontas: Expressão em destaque + 4 números + Bloqueios
 *   3. Karma: Débitos + Lições + Tendências Ocultas
 *   4+. Análise IA completa (triângulos + blocos kármicos injetados inline)
 *   N-1. Variações de nome magnético
 *   N. Folha de treino de assinatura
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { THEMES } from './shared/PDFTheme';
import { PDFCover } from './shared/PDFCover';
import { PDFStandardIntro } from './shared/PDFStandardIntro';
import { PDFPageHeader } from './shared/PDFPageHeader';
import { PDFFooter } from './shared/PDFFooter';
import { RenderMarkdownChunks, TrianguloPiramideInline } from './shared/PDFMarkdownRenderer';
import { BloqueiosBlock, DebitosBlock, LicoesBlock, TendenciasBlock } from './shared/PDFKarmicBlock';
import { PDFArcanosBlock } from './shared/PDFArcanosBlock';
import { PDFDoubleStar, type DoubleStarNumbers } from './shared/PDFDoubleStar';
import { LOGO_FONT, TITLE_FONT, BODY_FONT, BODY_FONT_BOLD, loadLogoSrc, formatDate } from './shared/PDFFonts';
import { formatAnalysisText } from '../../../utils/textFormatter';
import type { ProductPDFProps } from './shared/PDFTypes';
import { getArcano } from '../../../backend/numerology/arcanos';
import { getArquetipo } from '../../../backend/numerology/archetypes';
import { calcularTodosTriangulos, detectarBloqueios } from '../../../backend/numerology/triangle';
import { calcularCincoNumeros } from '../../../backend/numerology/numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos, mapearFrequencias } from '../../../backend/numerology/karmic';
import {
  DESTINO_DESC,
  EXPRESSAO_DESC,
  MOTIVACAO_DESC,
  IMPRESSAO_DESC,
  MISSAO_DESC,
  NUMERO_NOMES,
  NUMERO_PALAVRAS_CHAVE,
} from '../../../backend/numerology/interpretations';


const theme = THEMES.nome_social;

const GOLD = theme.primaryColor;
const GRAY = '#4B5563';
const LIGHT_GRAY = '#E5E7EB';
const DARK = '#131313';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: BODY_FONT,
    color: DARK,
  },
  // Seção A Essência — fundo revertido para branco, cor do cabeçalho customizada
  pageEssencia: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: BODY_FONT,
    color: DARK,
  },
  // Seção Harmonização / Comparativos — fundo revertido para branco
  pageHarmonizacao: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: BODY_FONT,
    color: DARK,
  },
  // Seção Nome Harmonizado escolhido — fundo revertido para branco
  pageHarmonizado: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: BODY_FONT,
    color: DARK,
  },
  darkPage: {
    backgroundColor: DARK,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: BODY_FONT,
    color: '#e5e2e1',
  },
  assinaturaPage: {
    backgroundColor: '#FFFFFF',
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 48,
    fontFamily: BODY_FONT,
    color: DARK,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: TITLE_FONT,
    color: GOLD,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 4,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  hugeTitle: {
    fontSize: 18,
    fontFamily: TITLE_FONT,
    color: GOLD,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  fixedText: {
    fontSize: 10,
    fontFamily: BODY_FONT,
    color: GRAY,
    lineHeight: 1.6,
    marginBottom: 16,
    marginTop: 6,
    padding: 0,
    backgroundColor: 'transparent',
    textAlign: 'justify',
  },
  bodyText: {
    fontSize: 10,
    color: DARK,
    lineHeight: 1.75,
    marginBottom: 8,
  },
  conclusaoCard: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFDF0',
    marginTop: 8,
  },
  // Variações de nome magnético
  variationCard: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    borderRadius: 6,
  },
  variationCardTop: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 6,
  },
  variationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  variationName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  variationScore: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  variationBar: {
    height: 4,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 2,
    marginBottom: 6,
  },
  variationBarFill: {
    height: 4,
    borderRadius: 2,
  },
  variationMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 3,
  },
  variationMetaText: {
    fontSize: 8,
    color: GRAY,
  },
  variationJustificativa: {
    fontSize: 8,
    color: GRAY,
    lineHeight: 1.4,
    marginTop: 3,
  },
  // Assinatura
  assinaturaTitle: {
    fontSize: 18,
    fontFamily: TITLE_FONT,
    color: GOLD,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  assinaturaNome: {
    fontSize: 22,
    fontFamily: TITLE_FONT,
    color: DARK,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  assinaturaInstrucoesBox: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 6,
    padding: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    marginBottom: 20,
  },
  assinaturaInstrucoesTitle: {
    fontSize: 9,
    fontFamily: BODY_FONT_BOLD,
    color: GOLD,
    marginBottom: 6,
  },
  assinaturaInstrucaoItem: {
    fontSize: 8,
    fontFamily: BODY_FONT,
    color: GRAY,
    lineHeight: 1.6,
    marginBottom: 3,
  },
  assinaturaLinha: {
    height: 0.5,
    backgroundColor: '#C5C5C5',
    marginBottom: 32,
  },
});

/** Extrai estritamente o bloco de Conclusão Final do texto */
function extractConclusao(text: string): string | null {
  const match = text.match(/##[^\n]*(?:\d+\.\s*conclus|\d+\.\s*o nome como|conclus[aã]o)/i);
  if (!match || match.index === undefined) return null;
  return text.slice(match.index).trim();
}

function scoreColor(score: number): string {
  return score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626';
}

function compatColor(c: string): string {
  return c === 'favoravel' ? '#059669' : c === 'neutro' ? '#D97706' : '#DC2626';
}

function compatLabel(c: string): string {
  return c === 'favoravel' ? 'Harmônica / Favorável' : c === 'neutro' ? 'Neutra' : 'Tensão Vibracional';
}

function extractSelectedSocialName(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(/^#\s*Relatorio do Nome Social:\s*(.+)$/im);
  return match?.[1]?.trim() || null;
}

export function NomeSocialPDF({ analysis, magneticNames, userName }: ProductPDFProps) {
  const logoSrc = loadLogoSrc();
  const freqData = analysis.frequencias_numeros as any;
  const selectedNomeSocial =
    freqData?.selectedNomeSocial ??
    extractSelectedSocialName(analysis.analise_texto);
  // Para o novo fluxo, exibir o nome social escolhido (não o nome de nascimento)
  const nomeParaExibir = selectedNomeSocial ?? freqData?.ranking?.melhorNome?.nomeCompleto ?? analysis.nome_completo;
  const nomeNascimento = freqData?.ranking?.nomeNascimento ?? analysis.nome_completo;
  const dataNascimento = formatDate(
    freqData?.ranking?.dataNascimento ?? analysis.data_nascimento
  );
  const dataGeracao = formatDate(analysis.completed_at ?? analysis.created_at);

  const letrasNome = nomeParaExibir
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');

  // Letras do nome de nascimento (para as pirâmides da seção A ESSÊNCIA)
  const letrasNomeBatismo = nomeNascimento
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');

  const nomesCandidatos: any[] = freqData?.ranking?.nomesCandidatos ?? [];

  // ── Dados do NOME DE NASCIMENTO (para a seção "A ESSÊNCIA") ──────────────────────
  const dataNascimentoRaw = freqData?.ranking?.dataNascimento ?? analysis.data_nascimento ?? '';
  const cincoNumNasc = calcularCincoNumeros(nomeNascimento, dataNascimentoRaw);
  const triangulosNasc = calcularTodosTriangulos(nomeNascimento, dataNascimentoRaw);
  const bloqueiosNasc = detectarBloqueios(triangulosNasc);
  const tVidaNasc    = triangulosNasc.vida;
  const tPessoalNasc = triangulosNasc.pessoal;
  const tSocialNasc  = triangulosNasc.social;
  const tDestinoNasc = triangulosNasc.destino;
  // Calcula em tempo real a partir do nome de nascimento (não lê do banco para garantir precisão)
  const licoesNasc     = detectarLicoesCarmicas(nomeNascimento);
  const tendenciasNasc = detectarTendenciasOcultas(nomeNascimento);
  const debitosNasc    = calcularDebitosCarmicos(
    dataNascimentoRaw,
    cincoNumNasc.destino,
    cincoNumNasc.motivacao,
    cincoNumNasc.expressao,
  );
  const frequenciasNasc = Object.fromEntries(
    Object.entries(mapearFrequencias(nomeNascimento))
  ) as Record<string, number>;

  const nascBaseLen = Math.max(
    tVidaNasc?.linhas[0]?.length ?? 1,
    tPessoalNasc?.linhas[0]?.length ?? 1,
    tSocialNasc?.linhas[0]?.length ?? 1,
    tDestinoNasc?.linhas[0]?.length ?? 1,
  );
  const triCellSizeNasc = Math.min(18, Math.max(5, Math.floor(430 / nascBaseLen) - 1));
  // ───────────────────────────────────────────────────────────────────────────

  // ── Números do NOME SOCIAL HARMONIZADO (para o pentagrama comparativo) ──────
  const cincoNumSocial = nomeParaExibir !== nomeNascimento
    ? calcularCincoNumeros(nomeParaExibir, dataNascimentoRaw)
    : cincoNumNasc;
  
  const nascStarNumbers: DoubleStarNumbers = {
    destino:   cincoNumNasc.destino   ?? null,
    expressao: cincoNumNasc.expressao ?? null,
    motivacao: cincoNumNasc.motivacao ?? null,
    missao:    cincoNumNasc.missao    ?? null,
    impressao: cincoNumNasc.impressao ?? null,
  };

  const socialStarNumbers: DoubleStarNumbers = {
    destino:   cincoNumNasc.destino      ?? null, // Destino nunca muda
    expressao: cincoNumSocial.expressao  ?? null,
    motivacao: cincoNumSocial.motivacao  ?? null,
    missao:    cincoNumSocial.missao     ?? null,
    impressao: cincoNumSocial.impressao  ?? null,
  };
  // ────────────────────────────────────────────────────────────────────────────
  // ── Dados comparativos do NOME HARMONIZADO ────────────────────────────────
  const isDifferentName = nomeParaExibir !== nomeNascimento;

  const triangulosSocial = isDifferentName
    ? calcularTodosTriangulos(nomeParaExibir, dataNascimentoRaw)
    : triangulosNasc;
  const bloqueiosSocial = isDifferentName
    ? detectarBloqueios(triangulosSocial)
    : bloqueiosNasc;
  const licoesSocial = isDifferentName
    ? detectarLicoesCarmicas(nomeParaExibir)
    : licoesNasc;
  const tendenciasSocial = isDifferentName
    ? detectarTendenciasOcultas(nomeParaExibir)
    : tendenciasNasc;
  const debitosSocial = isDifferentName
    ? calcularDebitosCarmicos(
        dataNascimentoRaw,
        cincoNumSocial.destino,
        cincoNumSocial.motivacao,
        cincoNumSocial.expressao,
      )
    : debitosNasc;

  // ── Dados do NOME SOCIAL HARMONIZADO para o bloco verde ─────────────────
  const harmBaseLen = Math.max(
    triangulosSocial.vida?.linhas[0]?.length ?? 1,
    triangulosSocial.pessoal?.linhas[0]?.length ?? 1,
    triangulosSocial.social?.linhas[0]?.length ?? 1,
    triangulosSocial.destino?.linhas[0]?.length ?? 1,
  );
  const triCellSizeHarm = Math.min(18, Math.max(5, Math.floor(430 / harmBaseLen) - 1));
  const frequenciasHarm = Object.fromEntries(
    Object.entries(mapearFrequencias(nomeParaExibir))
  ) as Record<string, number>;
  // ────────────────────────────────────────────────────────────────────────

  // Lições eliminadas: estavam em nascimento mas não estão no harmonizado
  const licoesEliminadas = licoesNasc.filter(l =>
    !licoesSocial.some(ls => ls.numero === l.numero)
  );
  // Lições novas: surgem no harmonizado mas não existiam no nascimento
  const licoesNovas = licoesSocial.filter(l =>
    !licoesNasc.some(ln => ln.numero === l.numero)
  );
  // Tendências eliminadas
  const tendenciasEliminadas = tendenciasNasc.filter(t =>
    !tendenciasSocial.some(ts => ts.numero === t.numero)
  );
  // Tendências novas: surgem no harmonizado mas não existiam no nascimento
  const tendenciasNovas = tendenciasSocial.filter(t =>
    !tendenciasNasc.some(tn => tn.numero === t.numero)
  );
  // Débitos que podem ser aliviados (os que têm fixo=false no nascimento e não aparecem no harmonizado)
  const debitosAliviados = debitosNasc.filter(d =>
    !d.fixo && !debitosSocial.some(ds => ds.numero === d.numero)
  );
  const debitosFixos = debitosNasc.filter(d => d.fixo);

  // Bloqueios eliminados entre nascimento e harmonizado
  const bloqueiosEliminados = bloqueiosNasc.filter(b =>
    !bloqueiosSocial.some(bs => bs.codigo === b.codigo)
  );
  const bloqueiosRestantes = bloqueiosSocial;

  const extractIntro = (tag: string): string | null => {
    if (!analysis.analise_texto || !isDifferentName) return null;
    const m = analysis.analise_texto.match(
      new RegExp(`\\[INTRO_${tag}\\]([\\s\\S]*?)\\[/INTRO_${tag}\\]`)
    );
    if (!m?.[1]) return null;
    return m[1].trim().replace(/\*\*([^*\n]+)\*\*/g, '$1').replace(/\n+/g, ' ');
  };

  // Data-driven intro strings — computed from comparison data, used as fallback when AI tags absent
  const numerosIntro = (() => {
    if (!isDifferentName) return null;
    const changed = [
      cincoNumNasc.expressao !== cincoNumSocial.expressao ? `Expressão (${cincoNumNasc.expressao} para ${cincoNumSocial.expressao})` : null,
      cincoNumNasc.motivacao !== cincoNumSocial.motivacao ? `Motivação (${cincoNumNasc.motivacao} para ${cincoNumSocial.motivacao})` : null,
      cincoNumNasc.impressao !== cincoNumSocial.impressao ? `Impressão (${cincoNumNasc.impressao} para ${cincoNumSocial.impressao})` : null,
      cincoNumNasc.missao    !== cincoNumSocial.missao    ? `Missão (${cincoNumNasc.missao} para ${cincoNumSocial.missao})` : null,
    ].filter(Boolean) as string[];
    if (changed.length === 0) return `A harmonização preserva todos os quatro números variáveis: Expressão (${cincoNumSocial.expressao}), Motivação (${cincoNumSocial.motivacao}), Impressão (${cincoNumSocial.impressao}) e Missão (${cincoNumSocial.missao}) permanecem idênticos ao nome de nascimento. O Destino (${cincoNumNasc.destino}), imutável por vir da data de nascimento, também se mantém. A reorganização vibracional se concentra nos padrões kármicos e arcanos.`;
    return `A harmonização reconfigurou ${changed.length === 1 ? 'um' : changed.length} dos quatro números variáveis: ${changed.join(', ')}. O Destino (${cincoNumNasc.destino}), imutável por vir da data de nascimento, permanece como âncora vibracional em ambos os campos.`;
  })();

  const bloqueiosIntro = (() => {
    if (!isDifferentName) return null;
    const antes = bloqueiosNasc.length;
    const depois = bloqueiosRestantes.length;
    const eliminados = bloqueiosEliminados.length;
    if (antes === 0) return `O campo de nascimento já se apresentava livre de bloqueios energéticos — uma configuração incomum e favorável. A harmonização preserva essa condição.`;
    if (eliminados > 0 && depois === 0) return `A harmonização eliminou todos os ${eliminados} bloqueio${eliminados > 1 ? 's' : ''} presentes no campo de nascimento. O nome harmonizado opera sem nenhum padrão de resistência ativa — uma transformação completa do campo vibracional.`;
    if (eliminados > 0) return `A harmonização eliminou ${eliminados} de ${antes} bloqueio${antes > 1 ? 's' : ''}, reduzindo para ${depois} o total de padrões ativos. Cada bloqueio removido representa um ciclo de resistência que deixa de operar sobre a sua frequência.`;
    if (depois > antes) return `A reorganização das letras introduziu ${depois - antes} novo${depois - antes > 1 ? 's' : ''} bloqueio${depois - antes > 1 ? 's' : ''}, elevando de ${antes} para ${depois}. Isso indica tensão vibracional no nome escolhido — considere revisitar as variações disponíveis.`;
    return `Os ${antes} bloqueio${antes > 1 ? 's' : ''} identificados no campo de nascimento se mantêm no nome harmonizado. A reorganização atual não alterou as sequências responsáveis por esses padrões — os demais ganhos kármicos permanecem válidos.`;
  })();

  const debitosIntro = (() => {
    if (!isDifferentName) return null;
    const antes = debitosNasc.length;
    const depois = debitosSocial.length;
    const aliviados = debitosAliviados.length;
    const fixos = debitosFixos.length;
    if (antes === 0) return `Nenhum débito kármico foi identificado no campo de nascimento — uma condição de leveza vibracional que a harmonização preserva integralmente.`;
    if (aliviados > 0 && depois === fixos) return `A harmonização aliviou ${aliviados} débito${aliviados > 1 ? 's' : ''} kármico${aliviados > 1 ? 's' : ''} de origem no nome. Permanecem apenas os ${fixos} débito${fixos > 1 ? 's' : ''} fixo${fixos > 1 ? 's' : ''} — imutáveis por virem da data de nascimento — que nenhuma harmonização pode alterar.`;
    if (aliviados > 0) return `A harmonização aliviou ${aliviados} de ${antes} débito${antes > 1 ? 's' : ''} kármico${antes > 1 ? 's' : ''}. ${fixos > 0 ? `Os ${fixos} débito${fixos > 1 ? 's' : ''} de origem na data de nascimento são imutáveis e continuam como campo de aprendizado desta encarnação.` : 'Os demais permanecem ativos e demandam trabalho consciente.'}`;
    return `Os ${antes} débito${antes > 1 ? 's' : ''} kármico${antes > 1 ? 's' : ''} do campo de nascimento se mantêm no nome harmonizado. ${fixos > 0 ? `${fixos} deles têm origem na data de nascimento — imutáveis — e os demais permanecem pelo padrão atual do nome.` : 'São campos de aprendizado desta encarnação, independentemente do nome.'}`;
  })();

  const licoesIntro = (() => {
    if (!isDifferentName) return null;
    const antes = licoesNasc.length;
    const depois = licoesSocial.length;
    const eliminadas = licoesEliminadas.length;
    const novas = licoesNovas.length;
    if (antes === 0 && depois === 0) return `O nome de nascimento já contemplava todos os números de 1 a 8 — nenhuma lição kármica pendente. A harmonização preserva essa integralidade vibracional.`;
    if (eliminadas > 0 && depois === 0) return `A harmonização superou todas as ${eliminadas} lição${eliminadas > 1 ? 'ões' : ''} kármica${eliminadas > 1 ? 's' : ''} pendentes. O nome harmonizado contempla todos os números essenciais — um campo de completude energética.`;
    if (eliminadas > 0 && novas === 0) return `A harmonização superou ${eliminadas} lição${eliminadas > 1 ? 'ões' : ''} kármica${eliminadas > 1 ? 's' : ''}, reduzindo de ${antes} para ${depois}. Cada lição superada representa uma qualidade que passa a fluir naturalmente pelo novo campo vibracional.`;
    if (eliminadas > 0 && novas > 0) return `A harmonização superou ${eliminadas} lição${eliminadas > 1 ? 'ões' : ''} e introduziu ${novas} nova${novas > 1 ? 's' : ''} — saldo ${antes >= depois ? 'favorável' : 'desfavorável'} de ${Math.abs(antes - depois)} lição${Math.abs(antes - depois) !== 1 ? 'ões' : ''}. As novas lições representam qualidades que agora demandam atenção consciente.`;
    if (novas > 0) return `A harmonização introduziu ${novas} nova${novas > 1 ? 's' : ''} lição${novas > 1 ? 'ões' : ''} sem eliminar as existentes, elevando de ${antes} para ${depois}. Avalie se os demais ganhos vibracionais justificam este acréscimo.`;
    return `As ${antes} lição${antes > 1 ? 'ões' : ''} kármica${antes > 1 ? 's' : ''} do campo de nascimento se mantêm no nome harmonizado — os números ausentes permanecem os mesmos. São qualidades a desenvolver ao longo desta encarnação.`;
  })();

  const tendenciasIntro = (() => {
    if (!isDifferentName) return null;
    const antes = tendenciasNasc.length;
    const depois = tendenciasSocial.length;
    const neutralizadas = tendenciasEliminadas.length;
    const novas = tendenciasNovas.length;
    if (antes === 0 && depois === 0) return `Nenhum excesso vibracional foi identificado no campo de nascimento — as frequências numéricas estão bem distribuídas. A harmonização preserva esse equilíbrio.`;
    if (neutralizadas > 0 && depois === 0) return `A harmonização neutralizou todos os ${neutralizadas} excesso${neutralizadas > 1 ? 's' : ''} vibracional${neutralizadas > 1 ? 'is' : ''} presentes. O nome harmonizado distribui as frequências de forma equilibrada, eliminando os padrões compulsivos.`;
    if (neutralizadas > 0 && novas === 0) return `A harmonização neutralizou ${neutralizadas} de ${antes} excesso${antes > 1 ? 's' : ''} vibracional${antes > 1 ? 'is' : ''}, reduzindo para ${depois}. Cada tendência neutralizada representa um padrão compulsivo que perde força no novo campo.`;
    if (neutralizadas > 0 && novas > 0) return `A harmonização neutralizou ${neutralizadas} excesso${neutralizadas > 1 ? 's' : ''} e introduziu ${novas} novo${novas > 1 ? 's' : ''} — saldo ${antes >= depois ? 'favorável' : 'desfavorável'} de ${Math.abs(antes - depois)} excesso${Math.abs(antes - depois) !== 1 ? 's' : ''}. Os novos excessos indicam números que passaram a se repetir no novo campo.`;
    if (novas > 0) return `A harmonização não neutralizou excessos existentes e introduziu ${novas} novo${novas > 1 ? 's' : ''}, elevando de ${antes} para ${depois}. Isso indica que o nome escolhido amplificou certas frequências — avalie se os demais benefícios compensam.`;
    return `Os ${antes} excesso${antes > 1 ? 's' : ''} vibracional${antes > 1 ? 'is' : ''} do campo de nascimento se mantêm no nome harmonizado. A redistribuição das letras não alterou as frequências dominantes — esses padrões permanecem como campo de atenção consciente.`;
  })();

  const arcanosIntro = (() => {
    if (!isDifferentName) return null;
    const pairs = [
      { label: 'Triângulo da Vida',    nasc: tVidaNasc?.arcanoRegente,    harm: triangulosSocial.vida?.arcanoRegente },
      { label: 'Triângulo Pessoal',    nasc: tPessoalNasc?.arcanoRegente, harm: triangulosSocial.pessoal?.arcanoRegente },
      { label: 'Triângulo Social',     nasc: tSocialNasc?.arcanoRegente,  harm: triangulosSocial.social?.arcanoRegente },
      { label: 'Triângulo do Destino', nasc: tDestinoNasc?.arcanoRegente, harm: triangulosSocial.destino?.arcanoRegente },
    ];
    const changed = pairs.filter(p => p.nasc != null && p.harm != null && p.nasc !== p.harm);
    if (changed.length === 0) return `Os Arcanos Regentes de todos os quatro triângulos se mantêm inalterados — as forças universais que governam cada dimensão do seu campo continuam as mesmas do nome de nascimento.`;
    if (changed.length === 4) return `A harmonização reorganizou os Arcanos Regentes em todos os quatro triângulos — uma transformação profunda das forças arquetípicas que governam Vida, Pessoal, Social e Destino. Cada dimensão do seu campo opera agora sob uma nova frequência.`;
    return `A harmonização alterou o Arcano Regente de ${changed.length} dos quatro triângulos: ${changed.map(p => p.label).join(', ')}. As forças universais que governam essas dimensões foram reorganizadas, abrindo novos padrões de expressão e aprendizado.`;
  })();
  // ────────────────────────────────────────────────────────────────────────────

  const analiseFormatado = analysis.analise_texto
    ? formatAnalysisText(analysis.analise_texto)
    : null;
  const conclusaoTexto = analiseFormatado ? extractConclusao(analiseFormatado) : null;

  // Arquétipo do nome social (baseado no número de Expressão harmonizado)
  const arquetipoSocial = getArquetipo(cincoNumSocial.expressao ?? 1);

  // Dicionário de arcanos unificado — números RAW sem redução, deduplicados e ordenados
  const allArcanoNums = new Set<number>();
  const addArcanoNum = (n: number | null | undefined) => {
    if (n == null || n <= 0) return;
    allArcanoNums.add(n);
  };
  [tVidaNasc, tPessoalNasc, tSocialNasc, tDestinoNasc].forEach(t => {
    if (!t) return;
    addArcanoNum(t.arcanoRegente);
    t.arcanosDePassagem?.forEach(addArcanoNum);
    addArcanoNum(t.arcanoAtual?.numero);
  });
  if (isDifferentName) {
    [triangulosSocial.vida, triangulosSocial.pessoal, triangulosSocial.social, triangulosSocial.destino].forEach(t => {
      if (!t) return;
      addArcanoNum(t.arcanoRegente);
      t.arcanosDePassagem?.forEach(addArcanoNum);
      addArcanoNum(t.arcanoAtual?.numero);
    });
  }
  const sortedArcanos = Array.from(allArcanoNums).sort((a, b) => a - b);

  return (
    <Document title={`Nome Magnetico — ${nomeParaExibir}`} author="Nome Magnetico">

      {/* ── PÁGINA 1: CAPA ────────────────────────────────────────────────── */}
      <PDFCover
        theme={theme}
        nomeParaExibir={nomeParaExibir}
        dataNascimento={dataNascimento}
        dataGeracao={dataGeracao}
        logoSrc={logoSrc}
        logoFont={LOGO_FONT}
        titleFont={TITLE_FONT}
      />

      {/* ── PÁGINA INTRODUTÓRIA: GUIA DE LEITURA ────────────────────────── */}
      <PDFStandardIntro theme={theme} productType="nome_social" entityName={nomeParaExibir} />

      {/* ── PÁGINA: RANKING DOS CANDIDATOS (novo fluxo) ─────────────────────── */}
      {nomesCandidatos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — Ranking dos Candidatos`} />

          <View style={styles.section}>
            <Text style={styles.hugeTitle}>Ranking Numerológico dos Candidatos</Text>
            <Text style={{ ...styles.bodyText, marginBottom: 12 }}>
              Abaixo está a classificação vibratória de todos os nomes avaliados, ordenados do maior para o menor potencial de fluidez. A pontuação reflete a harmonia entre as frequências do nome social candidato e o seu Destino imutável. O nome no topo é a recomendação de ouro — o que entrega maior compatibilidade, clareza de fluxo e ausência de bloqueios.
            </Text>

            {nomesCandidatos.slice(0, 10).map((c: any, i: number) => {
              const sc = scoreColor(c.score);
              const isTop = i === 0;
              const isIA = c.origemSugerida === 'ia';
              return (
                <View key={i} style={isTop ? {
                  marginBottom: 8, padding: 10, backgroundColor: '#FFFDF0',
                  borderWidth: 1.5, borderColor: GOLD, borderRadius: 6,
                } : {
                  marginBottom: 8, padding: 10, backgroundColor: '#F9FAFB',
                  borderWidth: 1, borderColor: LIGHT_GRAY, borderRadius: 6,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {isTop && <Text style={{ fontSize: 8, color: GOLD, fontFamily: 'Helvetica-Bold' }}>★ RECOMENDADO{'  '}</Text>}
                      {isIA && !isTop && <Text style={{ fontSize: 7, color: '#7c3aed', fontFamily: 'Helvetica-Bold' }}>(*) SUGESTÃO{'  '}</Text>}
                      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: isTop ? DARK : '#374151' }}>{c.nomeCompleto}</Text>
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: sc }}>{c.score}/100</Text>
                  </View>

                  <View style={{ height: 4, backgroundColor: LIGHT_GRAY, borderRadius: 2, marginBottom: 6 }}>
                    <View style={{ height: 4, borderRadius: 2, width: `${Math.min(100, c.score)}%`, backgroundColor: sc }} />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 14, marginBottom: 5, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 9, color: GRAY }}>Expressão: <Text style={{ fontFamily: 'Helvetica-Bold', color: GOLD }}>{c.expressao}</Text></Text>
                    <Text style={{ fontSize: 9, color: GRAY }}>Motivação: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{c.motivacao}</Text></Text>
                    <Text style={{ fontSize: 9, color: GRAY }}>Impressão: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{c.impressao ?? '?'}</Text></Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Text style={{ fontSize: 9, color: compatColor(c.compatibilidade) }}>
                      Compatibilidade c/ Destino: {compatLabel(c.compatibilidade)}
                    </Text>
                    <Text style={{ fontSize: 9, color: c.temBloqueio ? '#DC2626' : '#059669' }}>
                      {c.temBloqueio ? `${c.bloqueios?.length ?? 1} bloqueio(s)` : 'Sem bloqueios'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <PDFFooter />
        </Page>
      )}

      {/* ── SEÇÃO: A ESSÊNCIA — O Nome de Nascimento Original ─────────────── */}
      <Page size="A4" style={styles.pageEssencia}>
        <PDFPageHeader subtitle={`${nomeNascimento} — A Essência Original`} bgColor="#FEF2F2" />

        {/* Badge de seção */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#991B1B', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#991B1B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              A ESSÊNCIA
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#991B1B', opacity: 0.3 }} />
        </View>

        {/* 1.1 — Banner do nome de nascimento */}
        <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#991B1B', borderRadius: 10, padding: 24, marginBottom: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: '#991B1B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, opacity: 0.8 }}>
            Seu Nome de Nascimento
          </Text>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 28, color: '#991B1B', textAlign: 'center', letterSpacing: 2, marginBottom: 8 }}>
            {nomeNascimento}
          </Text>
          <View style={{ height: 0.5, width: 100, backgroundColor: '#991B1B', opacity: 0.5, marginBottom: 8 }} />
          <Text style={{ fontSize: 9, color: '#991B1B', opacity: 0.7, textAlign: 'center', letterSpacing: 0.5 }}>
            {dataNascimento}
          </Text>
        </View>

        {/* "O Som do Seu Nascimento" — sem bloco, somente título + texto */}
        <View style={{ marginTop: 20, marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>
            O Som do Seu Nascimento
          </Text>
          <Text style={styles.bodyText}>
            "Este é o código vibracional que o universo registrou no instante do seu primeiro fôlego. Seu nome de nascimento não é um erro; ele é a sua Semente de Essência. Nele, estão gravadas as memórias da sua árvore genealógica, os talentos brutos que você veio lapidar e a missão que sua alma aceitou cumprir. Ele é a sua base inabalável, a nota fundamental da melodia da sua vida que nunca deixará de soar."
          </Text>
        </View>

        {/* 1.2 O Papel da Frequência Original */}
        <View style={{ backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 8, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, color: '#8A661C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            O Papel da Frequência Original
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7 }}>
            O nome de nascimento é o motor interno da sua jornada — ele emana qualidades permanentes, inscritas antes mesmo de qualquer escolha consciente. Esses talentos brutos são genuínos e poderosos, mas por serem energia pura e não lapidada, podem atrair interferências que se manifestam como bloqueios: padrões em loop que drenam o que você planta antes de colher. É exatamente para organizar essa frequência que o Nome Social existe — não para apagar quem você é, mas para que a sua essência originária possa fluir sem obstáculos.
          </Text>
        </View>
        <View wrap={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
            <View style={{ flex: 1, height: 0.5, backgroundColor: '#6d28d9', opacity: 0.3 }} />
            <Text style={{ fontSize: 9, color: '#6d28d9', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 10 }}>
              O Destino: A Estrada Imutável
            </Text>
            <View style={{ flex: 1, height: 0.5, backgroundColor: '#6d28d9', opacity: 0.3 }} />
          </View>

          {/* Card grande de Destino centralizado */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ borderWidth: 2, borderColor: '#6d28d9', borderRadius: 12, padding: 20, backgroundColor: '#F5F3FF', alignItems: 'center', width: 180 }}>
              <Text style={{ fontSize: 9, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Número de Destino</Text>
              <Text style={{ fontFamily: TITLE_FONT, fontSize: 52, color: '#5b21b6', lineHeight: 1 }}>{cincoNumNasc.destino}</Text>
              <Text style={{ fontSize: 9, color: '#7c3aed', marginTop: 6 }}>A Estrada da Sua Alma</Text>
            </View>
          </View>

          <View style={{ borderRadius: 8, backgroundColor: '#F5F3FF', padding: 12, marginBottom: 16 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#5b21b6', marginBottom: 6 }}>O Que Não Pode Ser Mudado</Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>
              Calculado a partir da data de nascimento, o Destino representa a trilha que sua alma escolheu antes de receber um nome. Não pode ser alterado por nenhuma prática ou mudança de nome — está gravado no tecido do tempo. O Nome Social não altera o Destino; ele organiza o campo vibracional para que a jornada rumo a ele aconteça com menos resistência e mais fluidez.
            </Text>
          </View>
        </View>

        <View wrap={false}>
          {/* Os 4 números do nome de nascimento — cards menores lado a lado */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
            <Text style={{ fontSize: 9, color: '#8A661C', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 10 }}>
              Os Números do Nome
            </Text>
            <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
          </View>
          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.55, marginBottom: 12 }}>
            Derivados das letras do nome de nascimento, estes quatro números revelam as qualidades inatas, os dons, a percepção externa e a vocação que estão codificados na semente original. Diferente do Destino, eles respondem à vibração das letras — e podem ser reorganizados pelo Nome Social.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Expressão', sublabel: 'O Dom Natural', value: cincoNumNasc.expressao, color: '#9A6B00', border: '#C89000', bg: '#FFFBF0' },
              { label: 'Motivação', sublabel: 'A Alma', value: cincoNumNasc.motivacao, color: '#0369a1', border: '#0284C7', bg: '#F0F9FF' },
              { label: 'Impressão', sublabel: 'A Máscara', value: cincoNumNasc.impressao, color: '#15803d', border: '#16A34A', bg: '#F0FDF4' },
              { label: 'Missão', sublabel: 'A Vocação', value: cincoNumNasc.missao, color: '#7C3AED', border: '#7C3AED', bg: '#F5F3FF' },
            ].map((n, i) => (
              <View key={i} style={{ flex: 1, borderWidth: 1.5, borderColor: n.border, borderRadius: 8, padding: 10, alignItems: 'center', backgroundColor: n.bg }}>
                <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: n.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{n.label}</Text>
                <Text style={{ fontFamily: TITLE_FONT, fontSize: 28, color: n.color, lineHeight: 1 }}>{n.value ?? '?'}</Text>
                <Text style={{ fontSize: 7, color: n.color, textAlign: 'center', marginTop: 4 }}>{n.sublabel}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 12 }} wrap={false}>
          <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
          <Text style={{ fontSize: 8, color: '#8A661C', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 10 }}>
            Detalhamento dos 5 Números do Nome
          </Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
        </View>

        {/* Explicações individuais de cada número */}
        <View style={{ gap: 6 }}>
          {[
            { num: cincoNumNasc.destino, label: 'Destino — A Estrada da Alma', desc: 'Calculado a partir da data de nascimento, representa a trilha que sua alma escolheu antes de receber um nome. É imutável e serve como a grande âncora da sua vida.', richDesc: cincoNumNasc.destino ? DESTINO_DESC[cincoNumNasc.destino] : '', color: '#5b21b6', bg: '#F5F3FF' },
            { num: cincoNumNasc.expressao, label: 'Expressão — O Dom Natural', desc: 'Resultante de todas as letras do nome de batismo, revela o potencial nato — o que você veio equipado para fazer bem, naturalmente. Os talentos que surgem sem esforço e a qualidade que as pessoas percebem em você antes mesmo de falar.', richDesc: cincoNumNasc.expressao ? EXPRESSAO_DESC[cincoNumNasc.expressao] : '', color: '#9A6B00', bg: '#FFFBF0' },
            { num: cincoNumNasc.motivacao, label: 'Motivação — A Alma do Nome', desc: 'Calculada pelas vogais, revela o motor mais profundo por trás das escolhas — não o que você faz, mas o que te move para fazer. Quando o nome cria conflito com a Motivação, há a sensação crônica de viver para fora.', richDesc: cincoNumNasc.motivacao ? MOTIVACAO_DESC[cincoNumNasc.motivacao] : '', color: '#0369a1', bg: '#F0F9FF' },
            { num: cincoNumNasc.impressao, label: 'Impressão — A Máscara Social', desc: 'As consoantes formam o esqueleto visível do nome — a frequência que os outros captam antes de te conhecerem. Molda reputações e primeiras impressões. Um número desfavorável pode criar resistência onde deveria haver abertura.', richDesc: cincoNumNasc.impressao ? IMPRESSAO_DESC[cincoNumNasc.impressao] : '', color: '#15803d', bg: '#F0FDF4' },
            { num: cincoNumNasc.missao, label: 'Missão — A Vocação de Vida', desc: 'Calculada pelo primeiro nome, aponta o campo onde seus dons encontram maior ressonância com o mundo. Quando alinhada com Expressão e Destino, gera propósito inevitável. Quando bloqueada, gera dispersão.', richDesc: cincoNumNasc.missao ? MISSAO_DESC[cincoNumNasc.missao] : '', color: '#7C3AED', bg: '#F5F3FF' },
          ].map((item, i) => (
            <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, backgroundColor: item.bg, borderRadius: 6, padding: 12 }}>
              <View style={{ width: 36, alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontFamily: TITLE_FONT, fontSize: 24, color: item.color, lineHeight: 1 }}>{item.num ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: item.color, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>{item.label}</Text>
                <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6 }}>{item.desc}</Text>
                {item.richDesc ? (
                  <View style={{ marginTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: item.color, marginBottom: 3 }}>
                      O Significado do seu Número {item.num}:
                    </Text>
                    <Text style={{ fontSize: 10, color: '#374151', lineHeight: 1.6, textAlign: 'justify' }}>
                      {item.richDesc}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

      {/* ── SEÇÃO A ESSÊNCIA: OS 4 TRIÂNGULOS DO NOME DE NASCIMENTO ──────── */}
      {(tVidaNasc || tPessoalNasc || tSocialNasc || tDestinoNasc) && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 18 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#991B1B', opacity: 0.3 }} />
            <View style={{ backgroundColor: '#991B1B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
              <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                A ESSÊNCIA
              </Text>
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: '#991B1B', opacity: 0.3 }} />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.hugeTitle}>Os 4 Triângulos: O Fluxo de Nascimento</Text>
          </View>

          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 14 }}>
            Calculados a partir do nome de nascimento, estes quatro triângulos revelam a geometria sagrada da sua frequência original. As células em vermelho apontam bloqueios de energia — padrões repetitivos que mostram onde o seu fluxo natural encontrou nós ao longo da jornada. Mapear esses pontos não é um veredito, mas o primeiro passo de autoconhecimento para dissolvê-los e recuperar a fluidez.
          </Text>

          {/* Arcanos info box */}
          <View wrap={false} style={{ borderRadius: 8, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#7C3AED', padding: 12, marginBottom: 10 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#7C3AED', marginBottom: 6 }}>O Que São os Arcanos</Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 6 }}>
              A Numerologia Cabalística é a ciência que decodifica as vibrações ocultas por trás do seu nome. Para revelar as forças que regem o seu destino, ela utiliza os <Text style={{ fontFamily: BODY_FONT_BOLD }}>Arcanos</Text> — arquétipos profundos de energia. Embora a estrutura principal da vida seja governada por 22 Arcanos Maiores (as forças primordiais), a sua jornada diária desdobra-se em ciclos menores e mais sutis, expandindo essa roda para até 99 vibrações numerológicas para mapear o dia a dia. Dentro de cada triângulo, você encontrará três tipos de Arcanos atuando em conjunto:
            </Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 4 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>1. Arcano Regente:</Text> É a grande força dominante. Sempre um dos 22 Arcanos Maiores, ele é o "sol" que ilumina e governa aquela dimensão da sua vida desde o nascimento. É a fundação do seu cenário.
            </Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 4 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>2. Sequência de Passagem:</Text> É a sua linha do tempo. Representa os capítulos cronológicos da sua estrada. Utilizando as vibrações menores (até 99), ela revela por onde a sua energia vai caminhar, ciclo após ciclo.
            </Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>3. Arcano de Trânsito:</Text> É o seu "aqui e agora". É o capítulo específico e a vibração exata de provação, renovação ou colheita que você está atravessando neste exato momento.
            </Text>
          </View>

          {/* Bloqueios info box */}
          <View wrap={false} style={{ borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', padding: 12, marginBottom: 8 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#DC2626', marginBottom: 6 }}>O Que São os Bloqueios Energéticos</Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>
              Na numerologia cabalística, quando um mesmo número aparece três ou mais vezes consecutivas na pirâmide, ele cria uma densidade vibracional que chamamos de Bloqueio. Não é um castigo, mas uma interrupção temporária no fluxo da energia vital. Identificar essas áreas (nas marcações em vermelho abaixo) permite que você traga consciência para as esferas da vida que exigem maior cuidado e alinhamento.
            </Text>
          </View>

          {/* ─── TRIÂNGULO DA VIDA ─── */}
          {tVidaNasc && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#C89000', borderBottomColor: '#C89000', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo da Vida (Nascimento)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#C89000' }}>[Saúde, Vitalidade e Prosperidade Material]</Text> — Este triângulo representa a fundação física e energética mais profunda da sua existência terrena. Calculado a partir do valor puro de cada letra do seu nome de nascimento, sem qualquer interferência externa, ele revela o fluxo contínuo da sua força vital primordial. Governa a saúde do seu corpo físico, sua imunidade energética e sua relação essencial com a abundância material e financeira. É o solo de onde brotam a sua resiliência e a sua capacidade de se sustentar com firmeza na matéria.
              </Text>
              <TrianguloPiramideInline data={tVidaNasc} label="TRIÂNGULO DA VIDA" cellSize={triCellSizeNasc} letras={letrasNomeBatismo} />
              {tVidaNasc.arcanoRegente != null && (() => {
                const arc = getArcano(tVidaNasc.arcanoRegente!);
                const arcAtual = tVidaNasc.arcanoAtual?.numero ? getArcano(tVidaNasc.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock 
                    title="Arcanos do Triângulo da Vida"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={tVidaNasc.arcanosDePassagem}
                    arcanoAtual={tVidaNasc.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueiosNasc.filter((b: any) => b.triangulos?.includes('vida')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo da Vida
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueiosNasc.filter((b: any) => b.triangulos?.includes('vida'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="vida" />
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO PESSOAL ─── */}
          {tPessoalNasc && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#7C3AED', borderBottomColor: '#7C3AED', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo Pessoal (Nascimento)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>[Mundo Íntimo, Emoções e Relacionamentos Próximos]</Text> — Esta dimensão penetra no santuário mais reservado da sua alma, ativada e moldada pelo dia exato do seu nascimento. Ela governa a sua inteligência emocional, a forma como você processa sentimentos íntimos em segredo, sua tolerância a pressões internas e a dinâmica com os seus entes mais próximos. Quando existem bloqueios nesta pirâmide de origem, a vida afetiva tende a repetir ciclos e roteiros repetitivos de frustração ou incompreensão, atuando como espelhos de conflitos internos ainda não resolvidos.
              </Text>
              <TrianguloPiramideInline data={tPessoalNasc} label="TRIÂNGULO PESSOAL" cellSize={triCellSizeNasc} letras={letrasNomeBatismo} />
              {tPessoalNasc.arcanoRegente != null && (() => {
                const arc = getArcano(tPessoalNasc.arcanoRegente!);
                const arcAtual = tPessoalNasc.arcanoAtual?.numero ? getArcano(tPessoalNasc.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock 
                    title="Arcanos do Triângulo Pessoal"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={tPessoalNasc.arcanosDePassagem}
                    arcanoAtual={tPessoalNasc.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueiosNasc.filter((b: any) => b.triangulos?.includes('pessoal')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo Pessoal
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueiosNasc.filter((b: any) => b.triangulos?.includes('pessoal'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="pessoal" />
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO SOCIAL ─── */}
          {tSocialNasc && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#059669', borderBottomColor: '#059669', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo Social (Nascimento)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#059669' }}>[Carreira, Visibilidade Pública e Magnetismo Social]</Text> — Esta pirâmide irradia a sua assinatura vibracional para o world externo, moldada pela influência do mês do seu nascimento. Ela governa a forma como a sociedade te percebe, o carisma que você emana em ambientes públicos e as oportunidades profissionais que você atrai ou repele. É a frequência que determina a sua reputação, a sua capacidade de vendas, parcerias profissionais e o reconhecimento do seu talento pelo coletivo. Bloqueios aqui geram invisibilidade, sabotagem profissional ou dificuldades de comunicação com o público.
              </Text>
              <TrianguloPiramideInline data={tSocialNasc} label="TRIÂNGULO SOCIAL" cellSize={triCellSizeNasc} letras={letrasNomeBatismo} />
              {tSocialNasc.arcanoRegente != null && (() => {
                const arc = getArcano(tSocialNasc.arcanoRegente!);
                const arcAtual = tSocialNasc.arcanoAtual?.numero ? getArcano(tSocialNasc.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock 
                    title="Arcanos do Triângulo Social"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={tSocialNasc.arcanosDePassagem}
                    arcanoAtual={tSocialNasc.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueiosNasc.filter((b: any) => b.triangulos?.includes('social')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo Social
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueiosNasc.filter((b: any) => b.triangulos?.includes('social'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="social" />
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO DO DESTINO ─── */}
          {tDestinoNasc && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#D97706', borderBottomColor: '#D97706', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo do Destino (Nascimento)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#D97706' }}>[Propósito, Realização Concreta e Legado Eterno]</Text> — A pirâmide mais reveladora e soberana de toda a sua jornada terrestre. Ela entrelaça de forma divina a totalidade do seu nome com as coordenadas do seu nascimento (dia + mês reduzidos). Este triângulo governa a colheita prática da sua jornada: a materialização física dos seus esforços, a execução do seu propósito de alma e o legado indelével que você construirá no tempo. Quando há bloqueios nesta área, você pode sentir que despende uma quantidade colossal de energia no trabalho sem nunca alcançar os frutos correspondentes na realidade material.
              </Text>
              <TrianguloPiramideInline data={tDestinoNasc} label="TRIÂNGULO DO DESTINO" cellSize={triCellSizeNasc} letras={letrasNomeBatismo} />
              {tDestinoNasc.arcanoRegente != null && (() => {
                const arc = getArcano(tDestinoNasc.arcanoRegente!);
                const arcAtual = tDestinoNasc.arcanoAtual?.numero ? getArcano(tDestinoNasc.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock 
                    title="Arcanos do Triângulo do Destino"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={tDestinoNasc.arcanosDePassagem}
                    arcanoAtual={tDestinoNasc.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueiosNasc.filter((b: any) => b.triangulos?.includes('destino')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo do Destino
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueiosNasc.filter((b: any) => b.triangulos?.includes('destino'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="destino" />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── SEÇÃO A ESSÊNCIA: 1.3.3 O PESO DO PASSADO ───────────────────── */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#991B1B', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#991B1B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              A ESSÊNCIA
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#991B1B', opacity: 0.3 }} />
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.hugeTitle}>O Peso do Passado: Débitos e Tendências</Text>
        </View>

        <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 16 }}>
          Além dos bloqueios detectados nos triângulos, o nome de nascimento carrega padrões kármicos mais profundos: os Débitos (contas de encarnações passadas ainda ativas), as Lições (vibrações ausentes que precisam ser desenvolvidas) e as Tendências Ocultas (excessos que criam ciclos de sabotagem).
        </Text>

        {/* Débitos Kármicos */}
        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#D97706', borderBottomColor: '#D97706', fontSize: 13 }]}>
            Débitos Kármicos
          </Text>
          <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
            Os Débitos Kármicos emergem como ecos de vidas anteriores — áreas onde o livre-arbítrio foi utilizado em desequilíbrio. Não são punições, mas leis de compensação que exigem reintegração. Os mesmos cenários de traição, perda ou esforço redobrado tendem a se repetir até que a lição seja integrada conscientemente.
          </Text>
          <DebitosBlock debitos={debitosNasc} />
        </View>

        {/* Lições Kármicas */}
        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#0369a1', borderBottomColor: '#0369a1', fontSize: 13 }]}>
            Lições Kármicas
          </Text>
          <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
            As Lições Kármicas são os "quartos vazios" da arquitetura energética: determinam exatamente quais virtudes estão ausentes no momento da encarnação. São traços não desenvolvidos em vidas anteriores — o Destino orquestrará desafios propositais para forçar o desenvolvimento dessas ferramentas ocultas.
          </Text>
          <LicoesBlock licoes={licoesNasc} />
        </View>

        {/* Tendências Ocultas */}
        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#6d28d9', borderBottomColor: '#6d28d9', fontSize: 13 }]}>
            Tendências Ocultas
          </Text>
          <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
            As Tendências Ocultas emergem quando um número aparece quatro ou mais vezes no nome — um talento amplificado ao ponto de se tornar compulsão. O excesso incontrolado converte a habilidade primária em desequilíbrio, sabotando resultados a longo prazo. O mapeamento preciso dessas forças é o primeiro passo para direcioná-las conscientemente.
          </Text>
          <TendenciasBlock tendencias={tendenciasNasc} frequencias={frequenciasNasc} />
        </View>
      </View>

        <PDFFooter bgColor="#FEF2F2" />
      </Page>

      {/* ── BLOCO: A ENGENHARIA DA HARMONIZAÇÃO ────────────────────────────── */}
      <Page size="A4" style={styles.pageHarmonizacao}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — A Engenharia da Harmonização`} bgColor="#FEFCE8" />

        {/* Badge de seção */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#8A661C', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#8A661C', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              HARMONIZAÇÃO
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#8A661C', opacity: 0.3 }} />
        </View>

        {/* Título Principal */}
        <View style={{ marginBottom: 8 }}>
          <Text style={[styles.hugeTitle, { color: '#C89000' }]}>A Engenharia da Harmonização</Text>
        </View>

        {/* Estrela Dupla — comparativo visual */}
        <PDFDoubleStar
          nascimento={nascStarNumbers}
          harmonizado={socialStarNumbers}
        />

        {/* ── 2.1. O Escudo Magnético ────────────────────────────────────── */}
        <View style={{ marginTop: 16, marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: '#8A661C', borderBottomColor: '#8A661C', fontSize: 12, borderBottomWidth: 0.5, paddingBottom: 3, marginBottom: 8 }]}>
            O Escudo Magnético
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 8 }}>
            O nome de nascimento é o campo vibracional que você recebeu ao chegar nesta encarnação — sua semente de origem. Ele carrega padrões genuínos de força, mas também pode conter sequências de energia que criam resistência e ciclos difíceis de romper. Não é um defeito: é simplesmente o ponto de partida ainda sem o refinamento que apenas a intenção consciente pode trazer.
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7 }}>
            A Harmonização cria uma segunda camada — um escudo vibracional que se sobrepõe ao campo original sem apagá-lo. Quando você adota o Nome Social Harmonizado na assinatura, nas redes sociais e nas apresentações do dia a dia, você não substitui quem você é: você eleva a frequência que emana do seu nome. A estrela interna (nascimento) permanece, envolvida e protegida pela estrela dourada externa (harmonização). Os bloqueios são neutralizados; as qualidades positivas, amplificadas.
          </Text>
        </View>

        {/* ── A Transformação ─── */}
        <View style={{ ...styles.section, marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: '#8A661C', borderBottomColor: '#C89000' }]}>
            A Transformação
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 8 }}>
            A intensidade da transformação é diretamente proporcional ao uso. Quanto mais frequente e consistente for a adoção do novo nome, mais profunda será a reconfiguração do campo magnético pessoal. A frequência vibracional do seu nome age 24 horas por dia — e cada uso consciente reforça a nova âncora energética, semana após semana, mês após mês.
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 8 }}>
            No comparativo vibracional da estrela acima, a estrela vermelha representa os números calculados pelo nome de nascimento — incluindo os padrões de bloqueio que operam nesse campo. A estrela dourada representa os números do Nome Social Harmonizado escolhido. Onde os valores divergem, há uma mudança real de frequência: é nessa divergência que a transformação acontece. O <Text style={{ fontFamily: BODY_FONT_BOLD }}>Destino</Text> — único número que vem da data de nascimento e jamais muda — permanece igual em ambas as estrelas, ancorando a identidade mais profunda enquanto o restante se reorganiza.
          </Text>
        </View>

        {/* ── A Leitura Comparativa ─── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 14 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#8A661C', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#8A661C', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              HARMONIZAÇÃO
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#8A661C', opacity: 0.3 }} />
        </View>
        <View style={{ marginBottom: 10 }}>
          <Text style={[styles.hugeTitle, { color: '#C89000' }]}>A Leitura Comparativa</Text>
        </View>
        {/* Para 1: apresenta a seção comparativa */}
        <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 8 }}>
          A seguir está o mapa detalhado de cada dimensão vibracional — o que era, o que se torna e o que permanece. Os cinco números (<Text style={{ fontFamily: BODY_FONT_BOLD }}>Expressão</Text>, <Text style={{ fontFamily: BODY_FONT_BOLD }}>Destino</Text>, <Text style={{ fontFamily: BODY_FONT_BOLD }}>Motivação</Text>, <Text style={{ fontFamily: BODY_FONT_BOLD }}>Impressão</Text> e <Text style={{ fontFamily: BODY_FONT_BOLD }}>Missão</Text>), além das <Text style={{ fontFamily: BODY_FONT_BOLD }}>Lições Kármicas</Text>, <Text style={{ fontFamily: BODY_FONT_BOLD }}>Tendências Ocultas</Text> e <Text style={{ fontFamily: BODY_FONT_BOLD }}>Débitos Kármicos</Text>, são analisados em dois campos: o do nome de nascimento e o do nome harmonizado escolhido.
        </Text>
        {/* Para 2: síntese dos 5 números — AI quando disponível, data-driven como fallback */}
        {isDifferentName && (
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 14 }}>
            {extractIntro('NUMEROS') ?? numerosIntro}
          </Text>
        )}

        {/* ─── CARD: Os 5 Números Fundamentais ─────────────────────────────── */}
        <View style={{ marginHorizontal: 0, marginBottom: 16 }}>
          {/* Card header */}
          <View style={{ backgroundColor: '#8A661C', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 6 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#FFFDF0', textTransform: 'uppercase', letterSpacing: 1 }}>
              Os 5 Números Fundamentais
            </Text>
          </View>
          {/* Number rows */}
          {[
            { label: 'Destino', sub: 'Data de Nascimento', nasc: cincoNumNasc.destino, harm: cincoNumNasc.destino, fixo: true },
            { label: 'Expressão', sub: 'Todas as letras do nome', nasc: cincoNumNasc.expressao, harm: cincoNumSocial.expressao, fixo: false },
            { label: 'Motivação', sub: 'Vogais — o desejo da alma', nasc: cincoNumNasc.motivacao, harm: cincoNumSocial.motivacao, fixo: false },
            { label: 'Impressão', sub: 'Consoantes — como o mundo vê', nasc: cincoNumNasc.impressao, harm: cincoNumSocial.impressao, fixo: false },
            { label: 'Missão', sub: 'Primeiro nome — persona pública', nasc: cincoNumNasc.missao, harm: cincoNumSocial.missao, fixo: false },
          ].map((r, i) => {
            const changed = !r.fixo && r.nasc !== r.harm;
            return (
              <View key={i} wrap={false} style={{ backgroundColor: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF', paddingVertical: 10, paddingHorizontal: 14 }}>
                {/* Label row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: DARK }}>{r.label}</Text>
                    <Text style={{ fontSize: 8, color: GRAY, marginTop: 1 }}>{r.sub}</Text>
                  </View>
                  {r.fixo ? (
                    <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <Text style={{ fontSize: 8, color: '#6B7280', fontFamily: BODY_FONT_BOLD }}>IMUTÁVEL — vem da data de nascimento</Text>
                    </View>
                  ) : changed ? (
                    <View style={{ backgroundColor: 'rgba(5,150,105,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <Text style={{ fontSize: 8, color: '#059669', fontFamily: BODY_FONT_BOLD }}>VIBRAÇÃO ALTERADA</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <Text style={{ fontSize: 8, color: GRAY }}>SEM ALTERAÇÃO</Text>
                    </View>
                  )}
                </View>
                {/* Before / After */}
                {r.fixo ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(107,114,128,0.08)', borderRadius: 6, padding: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 22, fontFamily: BODY_FONT_BOLD, color: '#6B7280' }}>{r.nasc ?? '—'}</Text>
                      {r.nasc != null && <Text style={{ fontSize: 8, color: '#6B7280', fontFamily: BODY_FONT_BOLD, textAlign: 'center', marginTop: 3 }}>{NUMERO_NOMES[r.nasc]}</Text>}
                      {r.nasc != null && <Text style={{ fontSize: 7, color: GRAY, textAlign: 'center', marginTop: 1 }}>{NUMERO_PALAVRAS_CHAVE[r.nasc]}</Text>}
                      <Text style={{ fontSize: 7, color: '#6B7280', fontStyle: 'italic', marginTop: 4 }}>Permanece em ambos os campos</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                    {/* Nascimento */}
                    <View style={{ flex: 1, backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 6, padding: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 8, color: '#DC2626', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nascimento</Text>
                      <Text style={{ fontSize: 26, fontFamily: BODY_FONT_BOLD, color: '#DC2626' }}>{r.nasc ?? '—'}</Text>
                      {r.nasc != null && <Text style={{ fontSize: 8, color: '#DC2626', fontFamily: BODY_FONT_BOLD, textAlign: 'center', marginTop: 3 }}>{NUMERO_NOMES[r.nasc]}</Text>}
                      {r.nasc != null && <Text style={{ fontSize: 7, color: GRAY, textAlign: 'center', marginTop: 1 }}>{NUMERO_PALAVRAS_CHAVE[r.nasc]}</Text>}
                    </View>
                    {/* Seta */}
                    <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}>
                      <Text style={{ fontSize: 16, color: changed ? '#8A661C' : GRAY }}>{changed ? '»' : '='}</Text>
                    </View>
                    {/* Harmonizado */}
                    <View style={{ flex: 1, backgroundColor: changed ? 'rgba(138,102,28,0.08)' : 'rgba(0,0,0,0.04)', borderRadius: 6, padding: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 8, color: '#8A661C', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harmonizado</Text>
                      <Text style={{ fontSize: 26, fontFamily: BODY_FONT_BOLD, color: '#8A661C' }}>{r.harm ?? '—'}</Text>
                      {r.harm != null && <Text style={{ fontSize: 8, color: '#8A661C', fontFamily: BODY_FONT_BOLD, textAlign: 'center', marginTop: 3 }}>{NUMERO_NOMES[r.harm]}</Text>}
                      {r.harm != null && <Text style={{ fontSize: 7, color: GRAY, textAlign: 'center', marginTop: 1 }}>{NUMERO_PALAVRAS_CHAVE[r.harm]}</Text>}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ─── CARD: OS 4 TRIÂNGULOS (Bloqueios + Arcanos comparativo) ──────── */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ backgroundColor: bloqueiosEliminados.length > 0 ? '#059669' : '#6B7280', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 6 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 }}>
              Os 4 Triângulos
            </Text>
          </View>
          <View style={{ backgroundColor: '#FAFAFA', paddingVertical: 12, paddingHorizontal: 14 }}>

            {/* ── Sub-bloco A: Bloqueios ── */}
            <View wrap={false}>
              <Text style={{ fontSize: 11, fontFamily: TITLE_FONT, color: '#059669', borderBottomWidth: 1, borderBottomColor: '#059669', paddingBottom: 4, marginBottom: 10, letterSpacing: 0.5 }}>
                Bloqueios
              </Text>
              {(extractIntro('BLOQUEIOS') ?? bloqueiosIntro)
                ? <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 10 }}>{extractIntro('BLOQUEIOS') ?? bloqueiosIntro}</Text>
                : <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 10 }}>
                    Os Bloqueios são sequências numéricas repetidas nos quatro triângulos kármicos que criam padrões de resistência energética. A Harmonização atua diretamente sobre esses padrões — quando as letras do nome mudam, a <Text style={{ fontFamily: BODY_FONT_BOLD }}>Expressão</Text> e as dimensões derivadas se reorganizam, podendo eliminar os Bloqueios ativos.
                  </Text>
              }
            </View>

            {/* Score visual */}
            {(() => {
              const bGood = bloqueiosRestantes.length < bloqueiosNasc.length;
              const bBad  = bloqueiosRestantes.length > bloqueiosNasc.length;
              const bSign = bGood ? '>' : bBad ? '<' : '=';
              return (
                <View wrap={false} style={{ flexDirection: 'row', alignItems: 'stretch', marginBottom: 12 }}>
                  <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(220,38,38,0.07)', borderRadius: 8, paddingVertical: 10 }}>
                    <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nascimento</Text>
                    <Text style={{ fontSize: 28, fontFamily: BODY_FONT_BOLD, color: '#DC2626' }}>{bloqueiosNasc.length}</Text>
                    <Text style={{ fontSize: 8, color: '#DC2626', marginTop: 2 }}>bloqueios presentes</Text>
                  </View>
                  <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 }}>
                    <Text style={{ fontSize: 18, color: bGood ? '#8A661C' : bBad ? '#DC2626' : GRAY }}>{bSign}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', backgroundColor: bGood ? 'rgba(5,150,105,0.08)' : bBad ? 'rgba(220,38,38,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 8, paddingVertical: 10 }}>
                    <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: bGood ? '#059669' : bBad ? '#DC2626' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harmonizado</Text>
                    <Text style={{ fontSize: 28, fontFamily: BODY_FONT_BOLD, color: bGood ? '#059669' : bBad ? '#DC2626' : '#6B7280' }}>{bloqueiosRestantes.length}</Text>
                    <Text style={{ fontSize: 8, color: bGood ? '#059669' : bBad ? '#DC2626' : GRAY, marginTop: 2 }}>bloqueios presentes</Text>
                  </View>
                </View>
              );
            })()}

            {/* Cards bloqueios eliminados */}
            {bloqueiosEliminados.length > 0 && bloqueiosEliminados.map((b, i) => (
              <View key={i} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: '#059669', backgroundColor: '#F0FDF4', borderRadius: 6, padding: 10, marginBottom: 6 }}>
                <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: '#059669', marginBottom: 4 }}>✓ Eliminado: {b.titulo ?? `Bloqueio ${b.codigo}`}</Text>
                {b.descricao && <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>{b.descricao}</Text>}
              </View>
            ))}

            {/* Cards bloqueios restantes */}
            {bloqueiosRestantes.length > 0 && bloqueiosRestantes.map((b, i) => (
              <View key={i} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: '#DC2626', backgroundColor: '#FEF2F2', borderRadius: 6, padding: 10, marginBottom: 6 }}>
                <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 4 }}>! Permanece: {b.titulo ?? `Bloqueio ${b.codigo}`}</Text>
                {b.descricao && <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>{b.descricao}</Text>}
              </View>
            ))}

            {bloqueiosNasc.length === 0 && (
              <Text style={{ fontSize: 10, color: '#059669', fontFamily: BODY_FONT_BOLD }}>✓ Nenhum bloqueio detectado no campo de nascimento.</Text>
            )}

            {/* ── Separador ── */}
            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 14 }} />

            {/* ── Sub-bloco B: Arcanos dos Triângulos ── */}
            <View wrap={false}>
              <Text style={{ fontSize: 11, fontFamily: TITLE_FONT, color: '#7C3AED', borderBottomWidth: 1, borderBottomColor: '#7C3AED', paddingBottom: 4, marginBottom: 10, letterSpacing: 0.5 }}>
                Arcanos dos Triângulos
              </Text>
              {(extractIntro('ARCANOS') ?? arcanosIntro)
                ? <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 12 }}>{extractIntro('ARCANOS') ?? arcanosIntro}</Text>
                : <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 12 }}>
                    Os Arcanos são as forças universais que emergem do vértice de cada triângulo. A Harmonização pode alterar o <Text style={{ fontFamily: BODY_FONT_BOLD }}>Arcano Regente</Text> e o <Text style={{ fontFamily: BODY_FONT_BOLD }}>Arcano de Trânsito</Text> quando as letras do nome mudam — reorganizando qual força governa cada dimensão da sua vida.
                  </Text>
              }
            </View>

            {([
              { label: 'Triângulo da Vida',    nasc: tVidaNasc,    harm: triangulosSocial.vida,    color: '#C89000' },
              { label: 'Triângulo Pessoal',    nasc: tPessoalNasc, harm: triangulosSocial.pessoal,  color: '#7C3AED' },
              { label: 'Triângulo Social',     nasc: tSocialNasc,  harm: triangulosSocial.social,   color: '#059669' },
              { label: 'Triângulo do Destino', nasc: tDestinoNasc, harm: triangulosSocial.destino,  color: '#D97706' },
            ] as const).map((tri, idx) => {
              const arcRegenteNasc  = tri.nasc?.arcanoRegente != null ? getArcano(tri.nasc.arcanoRegente!) : null;
              const arcRegenteHarm  = tri.harm?.arcanoRegente != null ? getArcano(tri.harm.arcanoRegente!) : null;
              const regenteChanged  = tri.nasc?.arcanoRegente !== tri.harm?.arcanoRegente;

              const arcAtualNasc    = tri.nasc?.arcanoAtual?.numero ? getArcano(tri.nasc.arcanoAtual.numero) : null;
              const arcAtualHarm    = tri.harm?.arcanoAtual?.numero ? getArcano(tri.harm.arcanoAtual.numero) : null;
              const transitChanged  = tri.nasc?.arcanoAtual?.numero !== tri.harm?.arcanoAtual?.numero;
              const hasTransit      = arcAtualNasc != null || arcAtualHarm != null;

              return (
                <View key={idx} wrap={false}>
                  {/* Badge do triângulo */}
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <View style={{ backgroundColor: tri.color, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{tri.label}</Text>
                    </View>
                  </View>

                  {/* Arcano Regente: nascimento → harmonizado */}
                  {(arcRegenteNasc || arcRegenteHarm) && (
                    <View style={{ marginBottom: 10 }}>
                      {/* Rótulo da linha + badge de status */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ flex: 1, fontSize: 9, fontFamily: BODY_FONT_BOLD, color: GRAY }}>Arcano Regente</Text>
                        <View style={{ backgroundColor: regenteChanged ? 'rgba(5,150,105,0.12)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: regenteChanged ? '#059669' : GRAY }}>
                            {regenteChanged ? 'ALTERADO' : 'SEM ALTERAÇÃO'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                        {/* Nascimento: vermelho se mudou, cinza se igual */}
                        <View style={{ flex: 1, backgroundColor: regenteChanged ? 'rgba(220,38,38,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 6, padding: 10, alignItems: 'center' }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: regenteChanged ? '#DC2626' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nascimento</Text>
                          <Text style={{ fontSize: 20, fontFamily: BODY_FONT_BOLD, color: regenteChanged ? '#DC2626' : '#6B7280' }}>{arcRegenteNasc?.numero ?? '—'}</Text>
                          {arcRegenteNasc && <Text style={{ fontSize: 8, color: regenteChanged ? '#DC2626' : GRAY, textAlign: 'center', marginTop: 3 }}>{arcRegenteNasc.nome}</Text>}
                          {arcRegenteNasc && <Text style={{ fontSize: 7, color: GRAY, textAlign: 'center', marginTop: 1 }}>{arcRegenteNasc.palavraChave}</Text>}
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}>
                          <Text style={{ fontSize: 16, color: regenteChanged ? '#8A661C' : GRAY }}>{regenteChanged ? '»' : '='}</Text>
                        </View>
                        {/* Harmonizado: verde se melhorou, cinza se igual */}
                        <View style={{ flex: 1, backgroundColor: regenteChanged ? 'rgba(5,150,105,0.08)' : 'rgba(0,0,0,0.04)', borderRadius: 6, padding: 10, alignItems: 'center' }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: regenteChanged ? '#059669' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harmonizado</Text>
                          <Text style={{ fontSize: 20, fontFamily: BODY_FONT_BOLD, color: regenteChanged ? '#059669' : '#6B7280' }}>{arcRegenteHarm?.numero ?? '—'}</Text>
                          {arcRegenteHarm && <Text style={{ fontSize: 8, color: regenteChanged ? '#059669' : GRAY, textAlign: 'center', marginTop: 3 }}>{arcRegenteHarm.nome}</Text>}
                          {arcRegenteHarm && <Text style={{ fontSize: 7, color: GRAY, textAlign: 'center', marginTop: 1 }}>{arcRegenteHarm.palavraChave}</Text>}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Arcano de Trânsito: nascimento → harmonizado */}
                  {hasTransit && (
                    <View style={{ marginBottom: 6 }}>
                      {/* Rótulo da linha + badge de status */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ flex: 1, fontSize: 9, fontFamily: BODY_FONT_BOLD, color: GRAY }}>Arcano de Trânsito</Text>
                        <View style={{ backgroundColor: transitChanged ? 'rgba(5,150,105,0.12)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: transitChanged ? '#059669' : GRAY }}>
                            {transitChanged ? 'ALTERADO' : 'SEM ALTERAÇÃO'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                        {/* Nascimento: vermelho se mudou, cinza se igual */}
                        <View style={{ flex: 1, backgroundColor: transitChanged ? 'rgba(220,38,38,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 6, padding: 10, alignItems: 'center' }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: transitChanged ? '#DC2626' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nascimento</Text>
                          <Text style={{ fontSize: 20, fontFamily: BODY_FONT_BOLD, color: transitChanged ? '#DC2626' : '#6B7280' }}>{arcAtualNasc?.numero ?? tri.nasc?.arcanoAtual?.numero ?? '—'}</Text>
                          {arcAtualNasc && <Text style={{ fontSize: 8, color: transitChanged ? '#DC2626' : GRAY, textAlign: 'center', marginTop: 3 }}>{arcAtualNasc.nome}</Text>}
                          {arcAtualNasc && <Text style={{ fontSize: 7, color: GRAY, textAlign: 'center', marginTop: 1 }}>{arcAtualNasc.palavraChave}</Text>}
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}>
                          <Text style={{ fontSize: 16, color: transitChanged ? '#8A661C' : GRAY }}>{transitChanged ? '»' : '='}</Text>
                        </View>
                        {/* Harmonizado: verde se mudou, cinza se igual */}
                        <View style={{ flex: 1, backgroundColor: transitChanged ? 'rgba(5,150,105,0.08)' : 'rgba(0,0,0,0.04)', borderRadius: 6, padding: 10, alignItems: 'center' }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: transitChanged ? '#059669' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harmonizado</Text>
                          <Text style={{ fontSize: 20, fontFamily: BODY_FONT_BOLD, color: transitChanged ? '#059669' : '#6B7280' }}>{arcAtualHarm?.numero ?? tri.harm?.arcanoAtual?.numero ?? '—'}</Text>
                          {arcAtualHarm && <Text style={{ fontSize: 8, color: transitChanged ? '#059669' : GRAY, textAlign: 'center', marginTop: 3 }}>{arcAtualHarm.nome}</Text>}
                          {arcAtualHarm && <Text style={{ fontSize: 7, color: GRAY, textAlign: 'center', marginTop: 1 }}>{arcAtualHarm.palavraChave}</Text>}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Separador entre triângulos (exceto último) */}
                  {idx < 3 && <View style={{ height: 0.5, backgroundColor: '#E5E7EB', marginVertical: 8 }} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── CARD: Débitos · Lições · Tendências ─────────────────────────── */}
        {(() => {
          const hasAnyImprovement = licoesEliminadas.length > 0 || tendenciasEliminadas.length > 0 || debitosAliviados.length > 0;

          // Diff helpers
          const licoesRestantes  = licoesSocial.filter(l => licoesNasc.some(ln => ln.numero === l.numero));
          const tendenciasRestantes = tendenciasSocial.filter(t => tendenciasNasc.some(tn => tn.numero === t.numero));
          const tendenciasNovas  = tendenciasSocial.filter(t => !tendenciasNasc.some(tn => tn.numero === t.numero));
          const debitosMantidos = debitosSocial.filter(ds => debitosNasc.some(dn => dn.numero === ds.numero));
          const debitosNovos = debitosSocial.filter(ds => !debitosNasc.some(dn => dn.numero === ds.numero));

          // Sign helpers (math comparison: nasc [sign] harm)
          const cSign = (n: number, h: number) => h < n ? '>' : h > n ? '<' : '=';
          const cGood = (n: number, h: number) => h < n;
          const cBad  = (n: number, h: number) => h > n;

          return (
            <View style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: hasAnyImprovement ? '#059669' : '#6B7280', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 6 }}>
                <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Débitos Kármicos · Lições Kármicas · Tendências Ocultas
                </Text>
              </View>
              <View style={{ backgroundColor: '#FAFAFA', paddingVertical: 12, paddingHorizontal: 14 }}>

                {/* ── Sub-bloco A: Débitos Kármicos ── */}
                {debitosNasc.length > 0 && (() => {
                  const dGood = cGood(debitosNasc.length, debitosSocial.length);
                  const dBad  = cBad(debitosNasc.length, debitosSocial.length);
                  const dSign = dGood ? '»' : dBad ? '«' : '=';
                  return (
                    <>
                      <View wrap={false}>
                        <Text style={{ fontSize: 11, fontFamily: TITLE_FONT, color: '#1E3A5F', borderBottomWidth: 1, borderBottomColor: '#1E3A5F', paddingBottom: 4, marginBottom: 10, letterSpacing: 0.5 }}>
                          Débitos Kármicos
                        </Text>
                        {(extractIntro('DEBITOS') ?? debitosIntro)
                          ? <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 10 }}>{extractIntro('DEBITOS') ?? debitosIntro}</Text>
                          : <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 10 }}>
                              Os <Text style={{ fontFamily: BODY_FONT_BOLD }}>Débitos Kármicos</Text> são padrões de encarnações passadas que se manifestam como desafios específicos nesta vida. Podem ter origem na data de nascimento — portanto <Text style={{ fontFamily: BODY_FONT_BOLD }}>Imutáveis</Text> — ou nos números do nome (<Text style={{ fontFamily: BODY_FONT_BOLD }}>Motivação</Text> e <Text style={{ fontFamily: BODY_FONT_BOLD }}>Expressão</Text>), que são variáveis. Neste último caso, a Harmonização pode aliviar o débito ao reorganizar as frequências do nome.
                            </Text>
                        }
                      </View>
                      <View wrap={false} style={{ flexDirection: 'row', alignItems: 'stretch', marginBottom: 12 }}>
                        <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 8, paddingVertical: 10 }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nascimento</Text>
                          <Text style={{ fontSize: 28, fontFamily: BODY_FONT_BOLD, color: '#DC2626' }}>{debitosNasc.length}</Text>
                          <Text style={{ fontSize: 8, color: '#DC2626', marginTop: 2, fontFamily: BODY_FONT_BOLD }}>Débitos Kármicos Ativos</Text>
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 }}>
                          <Text style={{ fontSize: 16, color: dGood ? '#8A661C' : dBad ? '#DC2626' : GRAY }}>{dSign}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center', backgroundColor: dGood ? 'rgba(5,150,105,0.08)' : dBad ? 'rgba(220,38,38,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 8, paddingVertical: 10 }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: dGood ? '#059669' : dBad ? '#DC2626' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harmonizado</Text>
                          <Text style={{ fontSize: 28, fontFamily: BODY_FONT_BOLD, color: dGood ? '#059669' : dBad ? '#DC2626' : '#6B7280' }}>{debitosSocial.length}</Text>
                          <Text style={{ fontSize: 8, color: dGood ? '#059669' : dBad ? '#DC2626' : GRAY, marginTop: 2, fontFamily: BODY_FONT_BOLD }}>Débitos Kármicos Ativos</Text>
                        </View>
                      </View>
                      
                      {/* 1.1 Débitos Eliminados/Aliviados (Verde) */}
                      {debitosAliviados.map((d, i) => (
                        <View key={`deb-el-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: '#059669', backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginBottom: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ flex: 1, fontSize: 10, fontFamily: BODY_FONT_BOLD, color: '#059669', marginRight: 8 }}>
                              ✓ Eliminado: {d.titulo}
                            </Text>
                            <View style={{ backgroundColor: 'rgba(5,150,105,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: '#059669' }}>
                                ALIVIADO PELA HARMONIZAÇÃO
                              </Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 10, color: DARK, lineHeight: 1.5 }}>{d.descricao}</Text>
                        </View>
                      ))}

                      {/* 1.2 Débitos Mantidos (Cinza ou Dourado se Imutável) */}
                      {debitosMantidos.map((d, i) => {
                        const isImutavel = d.fixo === true;
                        const borderLeftColor = isImutavel ? '#D4AF37' : '#9CA3AF';
                        const backgroundColor = isImutavel ? '#FFFDF0' : '#F3F4F6';
                        const textColor = isImutavel ? '#8A661C' : '#6B7280';
                        const badgeBgColor = isImutavel ? 'rgba(212, 175, 55, 0.15)' : '#E5E7EB';

                        return (
                          <View key={`deb-mt-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor, backgroundColor, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ flex: 1, fontSize: 10, fontFamily: BODY_FONT_BOLD, color: textColor, marginRight: 8 }}>
                                {isImutavel ? '• Imutável: ' : '• Mantido: '}{d.titulo}
                              </Text>
                              <View style={{ backgroundColor: badgeBgColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                                <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: textColor }}>
                                  {isImutavel ? 'IMUTÁVEL' : 'PERMANECE ATIVO'}
                                </Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 10, color: DARK, lineHeight: 1.5 }}>{d.descricao}</Text>
                            {isImutavel && (
                              <Text style={{ fontSize: 8, color: '#8A661C', marginTop: 4, fontStyle: 'italic' }}>
                                Origem: {d.fontes.includes('dia_natalicio') ? 'Dia de Nascimento' : ''}{d.fontes.includes('destino') ? ' · Número de Destino' : ''}. Não pode ser alterado pelo nome.
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      {/* 1.3 Débitos Novos/Acrescentados (Vermelho) */}
                      {debitosNovos.map((d, i) => (
                        <View key={`deb-nv-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: '#DC2626', backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ flex: 1, fontSize: 10, fontFamily: BODY_FONT_BOLD, color: '#DC2626', marginRight: 8 }}>
                              + Novo Débito Kármico: {d.titulo}
                            </Text>
                            <View style={{ backgroundColor: 'rgba(220,38,38,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                              <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: '#DC2626' }}>
                                ACRESCENTADO PELA HARMONIZAÇÃO
                              </Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 10, color: DARK, lineHeight: 1.5 }}>{d.descricao}</Text>
                        </View>
                      ))}
                    </>
                  );
                })()}

                {/* Separador */}
                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 14 }} />

                {/* ── Sub-bloco B: Lições Kármicas ── */}
                {(() => {
                  const lGood = cGood(licoesNasc.length, licoesSocial.length);
                  const lBad  = cBad(licoesNasc.length, licoesSocial.length);
                  const lSign = lGood ? '»' : lBad ? '«' : '=';
                  return (
                    <>
                      <View wrap={false}>
                        <Text style={{ fontSize: 11, fontFamily: TITLE_FONT, color: '#4B3F72', borderBottomWidth: 1, borderBottomColor: '#4B3F72', paddingBottom: 4, marginBottom: 10, letterSpacing: 0.5 }}>
                          Lições Kármicas
                        </Text>
                        {(extractIntro('LICOES') ?? licoesIntro)
                          ? <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 10 }}>{extractIntro('LICOES') ?? licoesIntro}</Text>
                          : <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 10 }}>
                              As <Text style={{ fontFamily: BODY_FONT_BOLD }}>Lições Kármicas</Text> são os números de 1 a 8 ausentes no nome — qualidades que a alma ainda não integrou nesta encarnação. Quando a Harmonização introduz novas letras, alguns desses números passam a estar presentes, superando a lição correspondente.
                            </Text>
                        }
                      </View>
                      <View wrap={false} style={{ flexDirection: 'row', alignItems: 'stretch', marginBottom: 12 }}>
                        <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 8, paddingVertical: 10 }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nascimento</Text>
                          <Text style={{ fontSize: 28, fontFamily: BODY_FONT_BOLD, color: '#DC2626' }}>{licoesNasc.length}</Text>
                          <Text style={{ fontSize: 8, color: '#DC2626', marginTop: 2, fontFamily: BODY_FONT_BOLD }}>Lições Kármicas Ativas</Text>
                          {licoesNasc.length > 0 && (
                            <Text style={{ fontSize: 7, color: GRAY, marginTop: 3, textAlign: 'center' }}>
                              {licoesNasc.map(l => `Lição ${l.numero}`).join(' · ')}
                            </Text>
                          )}
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 }}>
                          <Text style={{ fontSize: 16, color: lGood ? '#8A661C' : lBad ? '#DC2626' : GRAY }}>{lSign}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center', backgroundColor: lGood ? 'rgba(5,150,105,0.08)' : lBad ? 'rgba(220,38,38,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 8, paddingVertical: 10 }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: lGood ? '#059669' : lBad ? '#DC2626' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harmonizado</Text>
                          <Text style={{ fontSize: 28, fontFamily: BODY_FONT_BOLD, color: lGood ? '#059669' : lBad ? '#DC2626' : '#6B7280' }}>{licoesSocial.length}</Text>
                          <Text style={{ fontSize: 8, color: lGood ? '#059669' : lBad ? '#DC2626' : GRAY, marginTop: 2, fontFamily: BODY_FONT_BOLD }}>Lições Kármicas Ativas</Text>
                          {licoesSocial.length > 0 && (
                            <Text style={{ fontSize: 7, color: GRAY, marginTop: 3, textAlign: 'center' }}>
                              {licoesSocial.map(l => `Lição ${l.numero}`).join(' · ')}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      {/* 2.1 Lições Eliminadas/Superadas (Verde) */}
                      {licoesEliminadas.map((l, i) => (
                        <View key={`lic-el-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: '#059669', backgroundColor: '#F0FDF4', borderRadius: 6, padding: 10, marginBottom: 6 }}>
                          <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: '#059669', marginBottom: 3 }}>✓ Superada: Lição Kármica {l.numero} — {l.titulo.replace(/Lição Kármica \d+ — /, '')}</Text>
                          {l.descricao && <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>{l.descricao}</Text>}
                        </View>
                      ))}

                      {/* 2.2 Lições Mantidas (Cinza ou Dourado se Imutável) */}
                      {licoesRestantes.map((l, i) => {
                        const isImutavel = (l as any).fixo === true;
                        const borderLeftColor = isImutavel ? '#D4AF37' : '#6B7280';
                        const backgroundColor = isImutavel ? '#FFFDF0' : '#F3F4F6';
                        const textColor = isImutavel ? '#8A661C' : '#6B7280';
                        const badgeBgColor = isImutavel ? 'rgba(212, 175, 55, 0.15)' : '#E5E7EB';

                        return (
                          <View key={`lic-rm-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor, backgroundColor, borderRadius: 6, padding: 10, marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ flex: 1, fontSize: 10, fontFamily: BODY_FONT_BOLD, color: textColor }}>
                                {isImutavel ? '• Imutável: ' : '• Mantida: '}Lição Kármica {l.numero} — {l.titulo.replace(/Lição Kármica \d+ — /, '')}
                              </Text>
                              <View style={{ backgroundColor: badgeBgColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                                <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: textColor }}>
                                  {isImutavel ? 'IMUTÁVEL' : 'PERMANECE ATIVA'}
                                </Text>
                              </View>
                            </View>
                            {l.descricao && <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 5 }}>{l.descricao}</Text>}
                            {l.comoTrabalhar && (
                              <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.5 }}>
                                <Text style={{ fontFamily: BODY_FONT_BOLD, color: textColor }}>Como trabalhar: </Text>{l.comoTrabalhar}
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      {/* 2.3 Lições Novas/Acrescentadas (Vermelho) */}
                      {licoesNovas.map((l, i) => (
                        <View key={`lic-nv-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: '#DC2626', backgroundColor: '#FEF2F2', borderRadius: 6, padding: 10, marginBottom: 6 }}>
                          <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: '#DC2626', marginBottom: 3 }}>+ Nova Lição Kármica: Lição Kármica {l.numero} — {l.titulo.replace(/Lição Kármica \d+ — /, '')}</Text>
                          {l.descricao && <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 5 }}>{l.descricao}</Text>}
                          {l.comoTrabalhar && (
                            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.5 }}>
                              <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#DC2626' }}>Como trabalhar: </Text>{l.comoTrabalhar}
                            </Text>
                          )}
                        </View>
                      ))}
                    </>
                  );
                })()}

                {/* Separador */}
                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 14 }} />

                {/* ── Sub-bloco C: Tendências Ocultas ── */}
                {(() => {
                  const tGood = cGood(tendenciasNasc.length, tendenciasSocial.length);
                  const tBad  = cBad(tendenciasNasc.length, tendenciasSocial.length);
                  const tSign = tGood ? '»' : tBad ? '«' : '=';
                  return (
                    <>
                      <View wrap={false}>
                        <Text style={{ fontSize: 11, fontFamily: TITLE_FONT, color: '#7C3D0E', borderBottomWidth: 1, borderBottomColor: '#7C3D0E', paddingBottom: 4, marginBottom: 10, letterSpacing: 0.5 }}>
                          Tendências Ocultas
                        </Text>
                        {(extractIntro('TENDENCIAS') ?? tendenciasIntro)
                          ? <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 10 }}>{extractIntro('TENDENCIAS') ?? tendenciasIntro}</Text>
                          : <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 10 }}>
                              As <Text style={{ fontFamily: BODY_FONT_BOLD }}>Tendências Ocultas</Text> surgem quando um número aparece 4 ou mais vezes no nome, criando um excesso daquela vibração. A Harmonização pode neutralizar esses excessos — ao alterar as letras, redistribui as frequências, eliminando padrões de comportamento compulsivo.
                            </Text>
                        }
                      </View>
                      <View wrap={false} style={{ flexDirection: 'row', alignItems: 'stretch', marginBottom: 12 }}>
                        <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 8, paddingVertical: 10 }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nascimento</Text>
                          <Text style={{ fontSize: 28, fontFamily: BODY_FONT_BOLD, color: '#DC2626' }}>{tendenciasNasc.length}</Text>
                          <Text style={{ fontSize: 8, color: '#DC2626', marginTop: 2, fontFamily: BODY_FONT_BOLD }}>Tendências Ocultas Ativas</Text>
                          {tendenciasNasc.length > 0 && (
                            <Text style={{ fontSize: 7, color: GRAY, marginTop: 3, textAlign: 'center' }}>
                              {tendenciasNasc.map(t => `Nº${t.numero} (×${t.frequencia})`).join(' · ')}
                            </Text>
                          )}
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 }}>
                          <Text style={{ fontSize: 16, color: tGood ? '#8A661C' : tBad ? '#DC2626' : GRAY }}>{tSign}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center', backgroundColor: tGood ? 'rgba(5,150,105,0.08)' : tBad ? 'rgba(220,38,38,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 8, paddingVertical: 10 }}>
                          <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: tGood ? '#059669' : tBad ? '#DC2626' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harmonizado</Text>
                          <Text style={{ fontSize: 28, fontFamily: BODY_FONT_BOLD, color: tGood ? '#059669' : tBad ? '#DC2626' : '#6B7280' }}>{tendenciasSocial.length}</Text>
                          <Text style={{ fontSize: 8, color: tGood ? '#059669' : tBad ? '#DC2626' : GRAY, marginTop: 2, fontFamily: BODY_FONT_BOLD }}>Tendências Ocultas Ativas</Text>
                          {tendenciasSocial.length > 0 && (
                            <Text style={{ fontSize: 7, color: GRAY, marginTop: 3, textAlign: 'center' }}>
                              {tendenciasSocial.map(t => `Nº${t.numero} (×${t.frequencia})`).join(' · ')}
                            </Text>
                          )}
                        </View>
                      </View>
                      {tendenciasNasc.length === 0 && (
                        <Text style={{ fontSize: 9, color: '#059669', marginBottom: 4 }}>✓ Nenhum excesso vibracional no nome de nascimento.</Text>
                      )}
                      
                      {/* 3.1 Tendências Eliminadas/Neutralizadas (Verde) */}
                      {tendenciasEliminadas.map((t, i) => (
                        <View key={`tend-el-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: '#059669', backgroundColor: '#F0FDF4', borderRadius: 6, padding: 10, marginBottom: 6 }}>
                          <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: '#059669', marginBottom: 3 }}>✓ Neutralizada: Tendência Oculta {t.numero} — {t.titulo.replace(/Tendência Oculta \d+ — /, '')}</Text>
                          {t.descricao && <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>{t.descricao}</Text>}
                        </View>
                      ))}

                      {/* 3.2 Tendências Mantidas (Cinza ou Dourado se Imutável) */}
                      {tendenciasRestantes.map((t, i) => {
                        const isImutavel = (t as any).fixo === true;
                        const borderLeftColor = isImutavel ? '#D4AF37' : '#6B7280';
                        const backgroundColor = isImutavel ? '#FFFDF0' : '#F3F4F6';
                        const textColor = isImutavel ? '#8A661C' : '#6B7280';
                        const badgeBgColor = isImutavel ? 'rgba(212, 175, 55, 0.15)' : '#E5E7EB';

                        return (
                          <View key={`tend-rm-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor, backgroundColor, borderRadius: 6, padding: 10, marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ flex: 1, fontSize: 10, fontFamily: BODY_FONT_BOLD, color: textColor }}>
                                {isImutavel ? '• Imutável: ' : '• Mantida: '}Tendência Oculta {t.numero} — {t.titulo.replace(/Tendência Oculta \d+ — /, '')}
                              </Text>
                              <View style={{ backgroundColor: badgeBgColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                                <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: textColor }}>
                                  {isImutavel ? 'IMUTÁVEL' : 'PERMANECE ATIVA'}
                                </Text>
                              </View>
                            </View>
                            {t.descricao && <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 5 }}>{t.descricao}</Text>}
                            {t.comoEquilibrar && (
                              <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.5 }}>
                                <Text style={{ fontFamily: BODY_FONT_BOLD, color: textColor }}>Como equilibrar: </Text>{t.comoEquilibrar}
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      {/* 3.3 Tendências Novas/Acrescentadas (Vermelho) */}
                      {tendenciasNovas.map((t, i) => (
                        <View key={`tend-nv-${i}`} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: '#DC2626', backgroundColor: '#FEF2F2', borderRadius: 6, padding: 10, marginBottom: 6 }}>
                          <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: '#DC2626', marginBottom: 3 }}>+ Nova Tendência: Tendência Oculta {t.numero} — {t.titulo.replace(/Tendência Oculta \d+ — /, '')}</Text>
                          {t.descricao && <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 5 }}>{t.descricao}</Text>}
                          {t.comoEquilibrar && (
                            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.5 }}>
                              <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#DC2626' }}>Como equilibrar: </Text>{t.comoEquilibrar}
                            </Text>
                          )}
                        </View>
                      ))}
                    </>
                  );
                })()}

              </View>
            </View>
          );
        })()}

        <PDFFooter bgColor="#FEFCE8" />
      </Page>

      {/* ── SEÇÃO: O NOME SOCIAL — O Nome Harmonizado Escolhido ─────────── */}
      <Page size="A4" style={styles.pageHarmonizado}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — O Nome Social`} bgColor="#F0FDF4" />

        {/* Badge de seção */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#166534', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#166534', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              O NOME SOCIAL
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#166534', opacity: 0.3 }} />
        </View>

        {/* Banner do nome harmonizado */}
        <View style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#166534', borderRadius: 10, padding: 24, marginBottom: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: '#166534', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, opacity: 0.8 }}>
            Seu Nome Social Harmonizado
          </Text>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 28, color: '#166534', textAlign: 'center', letterSpacing: 2, marginBottom: 8 }}>
            {nomeParaExibir}
          </Text>
          <View style={{ height: 0.5, width: 100, backgroundColor: '#166534', opacity: 0.5, marginBottom: 8 }} />
          <Text style={{ fontSize: 9, color: '#166534', opacity: 0.7, textAlign: 'center', letterSpacing: 0.5 }}>
            {dataNascimento}
          </Text>
        </View>

        {/* "A Ressonância do Nome Harmonizado" */}
        <View style={{ marginTop: 20, marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>
            A Ressonância do Nome Harmonizado
          </Text>
          <Text style={styles.bodyText}>
            "Este é o código vibracional que você escolheu conscientemente. Seu nome social não substitui a semente do nome de nascimento; ele é o seu Escudo Magnético. Nele, estão reorganizadas as frequências que permitem que seus talentos fluam sem as resistências do campo original. Ele é a sua chave de acesso — a nota que você escolheu afinar para que a melodia da sua vida ressoe com mais clareza e propósito."
          </Text>
        </View>

        {/* O Poder da Nova Frequência */}
        <View style={{ backgroundColor: 'rgba(22,101,52,0.05)', borderRadius: 8, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(22,101,52,0.2)' }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, color: '#14532d', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            O Poder da Nova Frequência
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7 }}>
            O nome social harmonizado é a camada de refinamento sobre o campo original — ele emana qualidades reorganizadas, escolhidas com precisão vibracional. Quando usado consistentemente na assinatura, nas redes sociais e nas apresentações do dia a dia, ele reconfigura o campo magnético pessoal: dissolve as sequências de resistência dos triângulos e amplifica as qualidades genuínas que estavam sendo bloqueadas pelo padrão anterior.
          </Text>
        </View>
        <View wrap={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
            <View style={{ flex: 1, height: 0.5, backgroundColor: '#6d28d9', opacity: 0.3 }} />
            <Text style={{ fontSize: 9, color: '#6d28d9', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 10 }}>
              O Destino: A Estrada Imutável
            </Text>
            <View style={{ flex: 1, height: 0.5, backgroundColor: '#6d28d9', opacity: 0.3 }} />
          </View>

          {/* Card grande de Destino centralizado */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ borderWidth: 2, borderColor: '#6d28d9', borderRadius: 12, padding: 20, backgroundColor: '#F5F3FF', alignItems: 'center', width: 180 }}>
              <Text style={{ fontSize: 9, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Número de Destino</Text>
              <Text style={{ fontFamily: TITLE_FONT, fontSize: 52, color: '#5b21b6', lineHeight: 1 }}>{cincoNumSocial.destino}</Text>
              <Text style={{ fontSize: 9, color: '#7c3aed', marginTop: 6 }}>A Estrada da Sua Alma</Text>
            </View>
          </View>

          <View style={{ borderRadius: 8, backgroundColor: '#F5F3FF', padding: 12, marginBottom: 16 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#5b21b6', marginBottom: 6 }}>O Que Não Pode Ser Mudado</Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>
              Calculado a partir da data de nascimento, o Destino representa a trilha que sua alma escolheu antes de receber um nome. Não pode ser alterado por nenhuma prática ou mudança de nome — está gravado no tecido do tempo. O Nome Social não altera o Destino; ele organiza o campo vibracional para que a jornada rumo a ele aconteça com menos resistência e mais fluidez.
            </Text>
          </View>
        </View>

        <View wrap={false}>
          {/* Os 4 números do nome harmonizado */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
            <Text style={{ fontSize: 9, color: '#8A661C', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 10 }}>
              Os Números do Nome Harmonizado
            </Text>
            <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
          </View>
          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.55, marginBottom: 12 }}>
            Derivados das letras do nome harmonizado, estes quatro números revelam como as qualidades, dons, percepção externa e vocação se reorganizam no novo campo vibracional. São os mesmos eixos de análise do nome de nascimento — agora recalibrados pela nova frequência.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Expressão', sublabel: 'O Dom Natural', value: cincoNumSocial.expressao, color: '#9A6B00', border: '#C89000', bg: '#FFFBF0' },
              { label: 'Motivação', sublabel: 'A Alma', value: cincoNumSocial.motivacao, color: '#0369a1', border: '#0284C7', bg: '#F0F9FF' },
              { label: 'Impressão', sublabel: 'A Máscara', value: cincoNumSocial.impressao, color: '#15803d', border: '#16A34A', bg: '#F0FDF4' },
              { label: 'Missão', sublabel: 'A Vocação', value: cincoNumSocial.missao, color: '#7C3AED', border: '#7C3AED', bg: '#F5F3FF' },
            ].map((n, i) => (
              <View key={i} style={{ flex: 1, borderWidth: 1.5, borderColor: n.border, borderRadius: 8, padding: 10, alignItems: 'center', backgroundColor: n.bg }}>
                <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: n.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{n.label}</Text>
                <Text style={{ fontFamily: TITLE_FONT, fontSize: 28, color: n.color, lineHeight: 1 }}>{n.value ?? '?'}</Text>
                <Text style={{ fontSize: 7, color: n.color, textAlign: 'center', marginTop: 4 }}>{n.sublabel}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 12 }} wrap={false}>
          <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
          <Text style={{ fontSize: 8, color: '#8A661C', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 10 }}>
            Detalhamento dos 5 Números Harmonizados
          </Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
        </View>

        {/* Explicações individuais de cada número */}
        <View style={{ gap: 6 }}>
          {[
            { num: cincoNumSocial.destino, label: 'Destino — A Estrada da Alma (Imutável)', desc: 'Sua âncora de destino calculada a partir da data de nascimento. O nome harmonizado reorganiza as letras para que a jornada rumo a esta estrada aconteça com menos resistência e mais fluidez.', richDesc: cincoNumSocial.destino ? DESTINO_DESC[cincoNumSocial.destino] : '', color: '#5b21b6', bg: '#F5F3FF' },
            { num: cincoNumSocial.expressao, label: 'Expressão — O Dom Natural', desc: 'Resultante de todas as letras do nome harmonizado, revela o potencial reorganizado — o que você agora projeta naturalmente para o mundo. Os talentos que surgem sem esforço e a qualidade que as pessoas percebem em você neste novo campo vibracional.', richDesc: cincoNumSocial.expressao ? EXPRESSAO_DESC[cincoNumSocial.expressao] : '', color: '#9A6B00', bg: '#FFFBF0' },
            { num: cincoNumSocial.motivacao, label: 'Motivação — A Alma do Nome', desc: 'Calculada pelas vogais do nome harmonizado, revela o motor mais profundo por trás das escolhas — não o que você faz, mas o que te move para fazer. Quando o nome harmonizado alinha esse motor, há a sensação de viver de dentro para fora.', richDesc: cincoNumSocial.motivacao ? MOTIVACAO_DESC[cincoNumSocial.motivacao] : '', color: '#0369a1', bg: '#F0F9FF' },
            { num: cincoNumSocial.impressao, label: 'Impressão — A Máscara Social', desc: 'As consoantes do nome harmonizado formam o esqueleto visível — a frequência que os outros captam antes de te conhecerem. O novo padrão molda reputações e primeiras impressões de forma mais alinhada com a sua essência real.', richDesc: cincoNumSocial.impressao ? IMPRESSAO_DESC[cincoNumSocial.impressao] : '', color: '#15803d', bg: '#F0FDF4' },
            { num: cincoNumSocial.missao, label: 'Missão — A Vocação de Vida', desc: 'Calculada pelo primeiro nome harmonizado, aponta o campo onde seus dons encontram maior ressonância com o mundo. Quando alinhada com Expressão e Destino, gera propósito inevitável — e o nome harmonizado busca exatamente esse alinhamento.', richDesc: cincoNumSocial.missao ? MISSAO_DESC[cincoNumSocial.missao] : '', color: '#7C3AED', bg: '#F5F3FF' },
          ].map((item, i) => (
            <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, backgroundColor: item.bg, borderRadius: 6, padding: 12 }}>
              <View style={{ width: 36, alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontFamily: TITLE_FONT, fontSize: 24, color: item.color, lineHeight: 1 }}>{item.num ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: item.color, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>{item.label}</Text>
                <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6 }}>{item.desc}</Text>
                {item.richDesc ? (
                  <View style={{ marginTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: BODY_FONT_BOLD, color: item.color, marginBottom: 3 }}>
                      O Significado do seu Número {item.num}:
                    </Text>
                    <Text style={{ fontSize: 10, color: '#374151', lineHeight: 1.6, textAlign: 'justify' }}>
                      {item.richDesc}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

      {/* ── SEÇÃO O NOME SOCIAL: OS 4 TRIÂNGULOS DO NOME HARMONIZADO ──────── */}
      {(triangulosSocial.vida || triangulosSocial.pessoal || triangulosSocial.social || triangulosSocial.destino) && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 18 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#166534', opacity: 0.3 }} />
            <View style={{ backgroundColor: '#166534', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
              <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                O NOME SOCIAL
              </Text>
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: '#166534', opacity: 0.3 }} />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.hugeTitle}>Os 4 Triângulos: O Novo Fluxo</Text>
          </View>

          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 14 }}>
            Calculados a partir do nome harmonizado escolhido, estes quatro triângulos revelam a nova geometria vibracional do seu campo. As células em vermelho indicam bloqueios ainda presentes — padrões que o novo nome não conseguiu dissolver completamente. Onde antes havia resistência e agora não há células vermelhas, a harmonização foi efetiva naquela dimensão.
          </Text>

          {/* Arcanos info box */}
          <View wrap={false} style={{ borderRadius: 8, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#7C3AED', padding: 12, marginBottom: 10 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#7C3AED', marginBottom: 6 }}>O Que São os Arcanos</Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 6 }}>
              A Numerologia Cabalística é a ciência que decodifica as vibrações ocultas por trás do seu nome. Para revelar as forças que regem o seu destino, ela utiliza os <Text style={{ fontFamily: BODY_FONT_BOLD }}>Arcanos</Text> — arquétipos profundos de energia. Embora a estrutura principal da vida seja governada por 22 Arcanos Maiores (as forças primordiais), a sua jornada diária desdobra-se em ciclos menores e mais sutis, expandindo essa roda para até 99 vibrações numerológicas para mapear o dia a dia. Dentro de cada triângulo, você encontrará três tipos de Arcanos atuando em conjunto:
            </Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 4 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>1. Arcano Regente:</Text> É a grande força dominante. Sempre um dos 22 Arcanos Maiores, ele é o "sol" que ilumina e governa aquela dimensão da sua vida desde o nascimento. É a fundação do seu cenário.
            </Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 4 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>2. Sequência de Passagem:</Text> É a sua linha do tempo. Representa os capítulos cronológicos da sua estrada. Utilizando as vibrações menores (até 99), ela revela por onde a sua energia vai caminhar, ciclo após ciclo.
            </Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>3. Arcano de Trânsito:</Text> É o seu "aqui e agora". É o capítulo específico e a vibração exata de provação, renovação ou colheita que você está atravessando neste exato momento.
            </Text>
          </View>

          {/* Bloqueios info box */}
          <View wrap={false} style={{ borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', padding: 12, marginBottom: 8 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#DC2626', marginBottom: 6 }}>O Que São os Bloqueios Energéticos</Text>
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>
              Na numerologia cabalística, quando um mesmo número aparece três ou mais vezes consecutivas na pirâmide, ele cria uma densidade vibracional que chamamos de Bloqueio. Não é um castigo, mas uma interrupção temporária no fluxo da energia vital. Identificar essas áreas (nas marcações em vermelho abaixo) permite que você traga consciência para as esferas da vida que exigem maior cuidado e alinhamento.
            </Text>
          </View>

          {/* ─── TRIÂNGULO DA VIDA ─── */}
          {triangulosSocial.vida && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#C89000', borderBottomColor: '#C89000', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo da Vida (Harmonizado)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#C89000' }}>[Saúde, Vitalidade e Prosperidade Material]</Text> — A fundação física e energética mais profunda do seu ser, agora recalculada e harmonizada pelo seu novo nome. Esta nova configuração atua como um escudo que protege a sua saúde física e redireciona os seus canais de atração financeira. Ao sintonizar as frequências do seu corpo físico com uma vibração livre de resistências, o Triângulo da Vida Harmonizado abre espaço para que a vitalidade e a prosperidade fluam de forma leve e natural. Compare esta pirâmide com a de nascimento para contemplar a dissolução dos antigos bloqueios.
              </Text>
              <TrianguloPiramideInline data={triangulosSocial.vida} label="TRIÂNGULO DA VIDA" cellSize={triCellSizeHarm} letras={letrasNome} />
              {triangulosSocial.vida.arcanoRegente != null && (() => {
                const arc = getArcano(triangulosSocial.vida.arcanoRegente!);
                const arcAtual = triangulosSocial.vida.arcanoAtual?.numero ? getArcano(triangulosSocial.vida.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock
                    title="Arcanos do Triângulo da Vida"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={triangulosSocial.vida.arcanosDePassagem}
                    arcanoAtual={triangulosSocial.vida.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueiosSocial.filter((b: any) => b.triangulos?.includes('vida')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo da Vida
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueiosSocial.filter((b: any) => b.triangulos?.includes('vida'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="vida" />
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO PESSOAL ─── */}
          {triangulosSocial.pessoal && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#7C3AED', borderBottomColor: '#7C3AED', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo Pessoal (Harmonizado)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>[Mundo Íntimo, Emoções e Relacionamentos Próximos]</Text> — A dimensão secreta da sua vida afetiva e do seu autoconhecimento, agora recalibrada por um novo campo de frequências. Ao harmonizar este triângulo, você reorganiza a sua ressonância íntima, permitindo que você reaja a pressões com maior centralidade e cure padrões repetitivos de autossabotagem em seus relacionamentos. O Triângulo Pessoal Harmonizado purifica os canais da afetividade, promovendo conexões verdadeiras e uma convivência de respeito, amor e harmonia autêntica.
              </Text>
              <TrianguloPiramideInline data={triangulosSocial.pessoal} label="TRIÂNGULO PESSOAL" cellSize={triCellSizeHarm} letras={letrasNome} />
              {triangulosSocial.pessoal.arcanoRegente != null && (() => {
                const arc = getArcano(triangulosSocial.pessoal.arcanoRegente!);
                const arcAtual = triangulosSocial.pessoal.arcanoAtual?.numero ? getArcano(triangulosSocial.pessoal.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock
                    title="Arcanos do Triângulo Pessoal"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={triangulosSocial.pessoal.arcanosDePassagem}
                    arcanoAtual={triangulosSocial.pessoal.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueiosSocial.filter((b: any) => b.triangulos?.includes('pessoal')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo Pessoal
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueiosSocial.filter((b: any) => b.triangulos?.includes('pessoal'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="pessoal" />
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO SOCIAL ─── */}
          {triangulosSocial.social && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#059669', borderBottomColor: '#059669', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo Social (Harmonizado)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                Modificado pelo número do mês de nascimento, revela como o mundo externo responde ao nome harmonizado — o novo magnetismo que ele gera e as oportunidades que passa a atrair. Governa a visibilidade pública e o reconhecimento profissional no novo campo vibracional.
              </Text>
              <TrianguloPiramideInline data={triangulosSocial.social} label="TRIÂNGULO SOCIAL" cellSize={triCellSizeHarm} letras={letrasNome} />
              {triangulosSocial.social.arcanoRegente != null && (() => {
                const arc = getArcano(triangulosSocial.social.arcanoRegente!);
                const arcAtual = triangulosSocial.social.arcanoAtual?.numero ? getArcano(triangulosSocial.social.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock
                    title="Arcanos do Triângulo Social"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={triangulosSocial.social.arcanosDePassagem}
                    arcanoAtual={triangulosSocial.social.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueiosSocial.filter((b: any) => b.triangulos?.includes('social')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo Social
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueiosSocial.filter((b: any) => b.triangulos?.includes('social'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="social" />
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO DO DESTINO ─── */}
          {triangulosSocial.destino && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#D97706', borderBottomColor: '#D97706', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo do Destino (Harmonizado)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#D97706' }}>[Propósito, Realização Concreta e Legado Eterno]</Text> — O ápice das suas realizações e a consagração do seu legado de alma, agora impulsionados pela frequência límpida do seu nome harmonizado. Ao realinhar as correntes de energia do Destino, esta pirâmide atua como um acelerador de colheitas, convertendo o seu trabalho e dedicação em resultados duradouros e abundância tangível. O Triângulo do Destino Harmonizado garante que a sua caminhada material caminhe lado a lado com o seu propósito divino superior, assegurando que o seu esforço se traduza em prosperidade sólida e duradoura.
              </Text>
              <TrianguloPiramideInline data={triangulosSocial.destino} label="TRIÂNGULO DO DESTINO" cellSize={triCellSizeHarm} letras={letrasNome} />
              {triangulosSocial.destino.arcanoRegente != null && (() => {
                const arc = getArcano(triangulosSocial.destino.arcanoRegente!);
                const arcAtual = triangulosSocial.destino.arcanoAtual?.numero ? getArcano(triangulosSocial.destino.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock
                    title="Arcanos do Triângulo do Destino"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={triangulosSocial.destino.arcanosDePassagem}
                    arcanoAtual={triangulosSocial.destino.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueiosSocial.filter((b: any) => b.triangulos?.includes('destino')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo do Destino
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueiosSocial.filter((b: any) => b.triangulos?.includes('destino'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="destino" />
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── SEÇÃO O NOME SOCIAL: O CAMPO KÃRMICO ─────────────────────────── */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#166534', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#166534', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              O NOME SOCIAL
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#166534', opacity: 0.3 }} />
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.hugeTitle}>O Campo Kármico: Débitos e Tendências</Text>
        </View>

        <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 16 }}>
          Além dos bloqueios detectados nos triângulos, o nome harmonizado carrega seu próprio mapa kármico: os Débitos (contas ainda ativas), as Lições (vibrações ainda ausentes) e as Tendências Ocultas (excessos presentes no novo campo). Compare com o campo de nascimento para avaliar os ganhos e os novos pontos de atenção.
        </Text>

        {/* Débitos Kármicos */}
        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#D97706', borderBottomColor: '#D97706', fontSize: 13 }]}>
            Débitos Kármicos
          </Text>
          <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
            Os Débitos Kármicos emergem como ecos de vidas anteriores — áreas onde o livre-arbítrio foi utilizado em desequilíbrio. Não são punições, mas leis de compensação que exigem reintegração. Os débitos de origem no nome podem ser aliviados pela harmonização; os débitos fixos (oriundos da data de nascimento) permanecem independentemente do nome adotado.
          </Text>
          <DebitosBlock debitos={debitosSocial} />
        </View>

        {/* Lições Kármicas */}
        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#0369a1', borderBottomColor: '#0369a1', fontSize: 13 }]}>
            Lições Kármicas
          </Text>
          <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
            As Lições Kármicas são os "quartos vazios" da arquitetura energética: determinam exatamente quais virtudes estão ausentes no nome harmonizado. Quando uma lição persiste, ela permanece como convite ao desenvolvimento; quando é superada, a qualidade passa a fluir naturalmente pelo novo campo vibracional.
          </Text>
          <LicoesBlock licoes={licoesSocial} />
        </View>

        {/* Tendências Ocultas */}
        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#6d28d9', borderBottomColor: '#6d28d9', fontSize: 13 }]}>
            Tendências Ocultas
          </Text>
          <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
            As Tendências Ocultas emergem quando um número aparece quatro ou mais vezes no nome harmonizado — um talento amplificado ao ponto de se tornar compulsão. O mapeamento preciso dessas forças no novo campo permite que você as direcione conscientemente, evitando que a reorganização vibracional troque um excesso por outro.
          </Text>
          <TendenciasBlock tendencias={tendenciasSocial} frequencias={frequenciasHarm} />
        </View>
      </View>

        <PDFFooter bgColor="#F0FDF4" />
      </Page>

      {/* ── BLOCO 5: CONCLUSÃO ──────────────────────────────────────────────── */}
      {conclusaoTexto && conclusaoTexto.length > 50 && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — Conclusão`} />

          {/* Chip Conclusão */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 18 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#4338CA', opacity: 0.3 }} />
            <View style={{ backgroundColor: '#4338CA', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
              <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Conclusão
              </Text>
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: '#4338CA', opacity: 0.3 }} />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.hugeTitle}>O Encerramento do Seu Mapa</Text>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: GOLD, textAlign: 'center', letterSpacing: 1, marginBottom: 8 }}>
              A Síntese do Seu Campo Vibracional
            </Text>
            <View style={{ height: 1, backgroundColor: '#4338CA', opacity: 0.12, marginHorizontal: 40 }} />
          </View>

          <View style={styles.section}>
            <RenderMarkdownChunks text={conclusaoTexto} styles={styles} GOLD={GOLD} />
          </View>

          <PDFFooter />
        </Page>
      )}

      {/* ── BLOCO 6: ANEXOS ─────────────────────────────────────────────────── */}

      {/* ── ARCANOS: DICIONÁRIO UNIFICADO ────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — Anexos`} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 14 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#1E293B', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Anexos
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#1E293B', opacity: 0.3 }} />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={styles.hugeTitle}>Os Arcanos da Sua Análise</Text>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, color: GOLD, textAlign: 'center', letterSpacing: 1, marginBottom: 4 }}>
            Glossário Vibracional — Todos os Arcanos Presentes no Seu Mapa
          </Text>
        </View>

        <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 16 }}>
          Os arcanos abaixo são todos os que aparecem nos seus triângulos numerológicos — regentes, de passagem e de trânsito — de ambos os nomes. Cada arcano é uma força arquetípica universal que governa uma dimensão específica da sua jornada.
        </Text>

        {sortedArcanos.map((n) => {
          const arc = getArcano(n);
          return (
            <View key={n} style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>
                  Arcano {n} — {arc.nome} — {arc.palavraChave} —{' '}
                </Text>
                {arc.descricao}
              </Text>
              {arc.desafio ? (
                <Text style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.6, fontStyle: 'italic', marginTop: 3 }}>
                  Desafio: {arc.desafio}
                </Text>
              ) : null}
            </View>
          );
        })}

        <PDFFooter />
      </Page>

      {/* ── ANEXO II: ARQUÉTIPO VIBRACIONAL ─────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — Anexos`} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 14 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#1E293B', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Anexos
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#1E293B', opacity: 0.3 }} />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={styles.hugeTitle}>Arquétipo Vibracional</Text>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, color: GOLD, textAlign: 'center', letterSpacing: 1, marginBottom: 4 }}>
            A Força Narrativa do Seu Nome Social
          </Text>
        </View>

        {/* Banner do Arquétipo */}
        <View wrap={false} style={{ backgroundColor: '#4C1D95', borderRadius: 10, padding: 20, marginBottom: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: '#DDD6FE', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
            Expressão {cincoNumSocial.expressao} — Arquétipo do Nome Social
          </Text>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 26, color: '#FFFFFF', textAlign: 'center', letterSpacing: 1.5, marginBottom: 4 }}>
            {arquetipoSocial.nome}
          </Text>
          <Text style={{ fontSize: 10, color: '#C4B5FD', textAlign: 'center' }}>
            Sombra: {arquetipoSocial.sombra}
          </Text>
        </View>

        {/* Essência */}
        <View wrap={false} style={{ backgroundColor: 'rgba(212,175,55,0.07)', borderWidth: 1, borderColor: GOLD, borderRadius: 8, padding: 14, marginBottom: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: '#8A661C', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
            Essência
          </Text>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 13, color: GOLD, textAlign: 'center', letterSpacing: 0.5 }}>
            "{arquetipoSocial.essencia}"
          </Text>
        </View>

        {/* Intro */}
        <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
          Na Numerologia Cabalística, o número de Expressão do nome revela não apenas qualidades — mas um padrão arquetípico profundo, uma força narrativa que organiza como você age, lidera e se relaciona com o mundo. O arquétipo não é uma limitação: é a estrutura de potencial máximo disponível para quem carrega esse campo vibracional.
        </Text>

        {/* Descrição */}
        <Text style={{ fontSize: 10, color: DARK, lineHeight: 1.7, marginBottom: 14 }}>
          {arquetipoSocial.descricao}
        </Text>

        {/* Expressão positiva vs Sombra */}
        <View wrap={false} style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#166534', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#166534', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Expressão Positiva
            </Text>
            {arquetipoSocial.expressaoPositiva.map((item, i) => (
              <Text key={i} style={{ fontSize: 10, color: GRAY, lineHeight: 1.6, marginBottom: 4 }}>
                ✓ {item}
              </Text>
            ))}
          </View>
          <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#DC2626', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#DC2626', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Expressão Sombra
            </Text>
            {arquetipoSocial.expressaoSombra.map((item, i) => (
              <Text key={i} style={{ fontSize: 10, color: GRAY, lineHeight: 1.6, marginBottom: 4 }}>
                ! {item}
              </Text>
            ))}
          </View>
        </View>

        {/* Figuras míticas */}
        <View wrap={false} style={{ borderRadius: 7, backgroundColor: '#F5F3FF', padding: 12 }}>
          <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#7C3AED', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Figuras que Carregam Este Arquétipo
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6 }}>
            {arquetipoSocial.figurasMiticas.join('  ·  ')}
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* ── ANEXO III: GUIA DE ATIVAÇÃO — 30 DIAS ──────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — Anexos`} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 14 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#1E293B', opacity: 0.3 }} />
          <View style={{ backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginHorizontal: 10 }}>
            <Text style={{ fontSize: 8, color: '#FFFDF0', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Anexos
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: '#1E293B', opacity: 0.3 }} />
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.hugeTitle}>Guia de Ativação</Text>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: GOLD, textAlign: 'center', letterSpacing: 1, marginBottom: 8 }}>
            Os Primeiros 30 Dias: Do Plantio à Colheita Vibracional
          </Text>
        </View>

        <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 12 }}>
          O Nome Social não exige mudança legal ou documental — ele é a identidade vibracional que você escolhe projetar ao mundo. A ativação começa no instante em que você passa a usá-lo com consciência e consistência. Quanto mais contextos do seu cotidiano ele habitar, mais rápida será a reorganização do seu campo magnético.
        </Text>

        {/* Semana 1 */}
        <View style={{ marginBottom: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, color: GOLD, borderBottomColor: GOLD }]}>
            Semana 1 (Dias 1–7) — Plantio
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6, marginBottom: 3 }}>
            <Text style={{ fontFamily: BODY_FONT_BOLD, color: DARK }}>Dia 1:</Text> Escreva seu nome à mão 21 vezes seguidas com intenção clara — essa é a âncora inicial da reprogramação vibracional.
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6 }}>
            <Text style={{ fontFamily: BODY_FONT_BOLD, color: DARK }}>Dias 2–7:</Text> Atualize seus perfis digitais principais (Instagram, LinkedIn, WhatsApp). Peça às pessoas próximas que passem a te chamar pelo novo nome — a forma como os outros nos chamam reforça (ou enfraquece) a identidade vibracional.
          </Text>
        </View>

        {/* Semana 2 */}
        <View style={{ marginBottom: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, color: '#0369a1', borderBottomColor: '#0369a1' }]}>
            Semana 2 (Dias 8–14) — Expansão Digital
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['E-mail profissional', 'Assine todos os e-mails com o novo nome.'],
              ['Redes sociais', 'YouTube, TikTok, X — perfil e @handle.'],
              ['Cartão de visitas', 'O próximo lote já com o nome harmonizado.'],
              ['Apresentações', '"Me chamo [Nome Social]" — reuniões e calls.'],
              ['Site / portfólio', 'Domínio ou seção com o nome magnético.'],
              ['Assinatura digital', 'E-mails, contratos informais e postagens.'],
            ].map(([titulo, desc], i) => (
              <View key={i} style={{ width: '47%', backgroundColor: '#F0F9FF', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#BAE6FD' }}>
                <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#0369a1', marginBottom: 3 }}>• {titulo}</Text>
                <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.55 }}>{desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Semanas 3-4 */}
        <View style={{ marginBottom: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, color: '#166534', borderBottomColor: '#166534' }]}>
            Semanas 3–4 (Dias 15–30) — Consolidação
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6, marginBottom: 3 }}>
            <Text style={{ fontFamily: BODY_FONT_BOLD, color: DARK }}>Documentos legais:</Text> O Nome Social <Text style={{ fontFamily: BODY_FONT_BOLD }}>não substitui</Text> CPF, RG ou passaporte — esses permanecem com o nome de nascimento. Em apresentações pessoais, marketing, redes sociais e contratos informais, o Nome Social é soberano. A retificação em cartório é juridicamente possível, mas opcional — a ativação vibracional começa no uso cotidiano consciente.
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6 }}>
            Ao final de 30 dias de uso consistente, observe: novas oportunidades, mudanças na forma como as pessoas te percebem e uma crescente naturalidade com o novo campo são sinais de que a reorganização vibracional está em curso.
          </Text>
        </View>

        {/* Box 90 dias */}
        <View wrap={false} style={{ backgroundColor: 'rgba(212, 175, 55, 0.04)', borderWidth: 1, borderColor: GOLD, borderRadius: 7, padding: 12 }}>
          <Text style={{ fontSize: 10, fontFamily: TITLE_FONT, color: GOLD, marginBottom: 6 }}>
            Do 30º ao 90º Dia — A Colheita Vibracional
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 4 }}>
            <Text style={{ fontFamily: BODY_FONT_BOLD, color: DARK }}>30–60 dias:</Text> É comum sentir estranheza ao ser chamado pelo novo nome — esse é o sinal de que a reprogramação está ativa. O campo antigo ainda opera em paralelo enquanto o novo padrão se consolida. Anote em um diário as mudanças que observa.
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65 }}>
            <Text style={{ fontFamily: BODY_FONT_BOLD, color: DARK }}>60–90 dias:</Text> O campo vibracional do Nome Social começa a se estabilizar como frequência dominante. Novas conexões, convites e reconhecimentos que surgem neste período são reflexos diretos da nova frequência que você está emitindo.
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* ── FOLHA DE TREINO DE ASSINATURA (mantida igual) ───────────────────── */}
      <Page size="A4" style={styles.assinaturaPage}>
        <Text style={styles.assinaturaTitle}>Folha de Treino de Assinatura</Text>

        <View style={styles.assinaturaInstrucoesBox}>
          <Text style={styles.assinaturaInstrucoesTitle}>
            Como criar uma assinatura de alto poder energético
          </Text>
          <Text style={styles.assinaturaInstrucaoItem}>
            • Nunca cruze traços por cima das letras — linhas cortantes bloqueiam o fluxo energético da assinatura.
          </Text>
          <Text style={styles.assinaturaInstrucaoItem}>
            • Inclinação levemente ascendente (da esquerda para a direita) transmite ambição e crescimento positivo.
          </Text>
          <Text style={styles.assinaturaInstrucaoItem}>
            • Evite traçados que descem abruptamente ao final — simbolizam queda ou fechamento de ciclos de forma negativa.
          </Text>
          <Text style={styles.assinaturaInstrucaoItem}>
            • A assinatura deve ser legível o suficiente para reconhecer as letras principais do seu nome magnético.
          </Text>
          <Text style={styles.assinaturaInstrucaoItem}>
            • Termine com um traçado que fecha o nome sem corte — pode ser uma curva suave ascendente ou um ponto de energia.
          </Text>
          <Text style={styles.assinaturaInstrucaoItem}>
            • Pratique até que o movimento se torne fluido e natural — a assinatura deve expressar confiança e leveza.
          </Text>
        </View>

        <Text style={styles.assinaturaNome}>{nomeParaExibir}</Text>

        {Array.from({ length: 16 }).map((_, i) => (
          <View key={i} style={styles.assinaturaLinha} />
        ))}

        <PDFFooter />
      </Page>
    </Document>
  );
}
