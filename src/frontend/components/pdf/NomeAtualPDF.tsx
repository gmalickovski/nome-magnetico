/**
 * NomeAtualPDF — documento PDF da análise Gratuita (Nome Atual).
 *
 * Estrutura de páginas:
 *   1. Capa
 *   2. Guia de Leitura (intro)
 *   3. Os Números — Destino (card central) + 4 números do nome lado a lado
 *   4. Os 4 Triângulos (explicação — se disponíveis)
 *   5. Karma, Lições e Tendências Ocultas
 *   6+. Análise IA completa (triângulos + diagnóstico)
 *   8. CTA / Oferta para a Harmonização (Nome Social)
 */
import { Document, Page, View, Text, StyleSheet, Link } from '@react-pdf/renderer';
import { THEME_NOME_ATUAL } from './shared/PDFTheme';
import { PDFCover } from './shared/PDFCover';
import { PDFPageHeader } from './shared/PDFPageHeader';
import { PDFFooter } from './shared/PDFFooter';
import { RenderMarkdownChunks, TrianguloPiramideInline } from './shared/PDFMarkdownRenderer';
import { BloqueiosBlock, DebitosBlock, LicoesBlock, TendenciasBlock } from './shared/PDFKarmicBlock';
import { LOGO_FONT, TITLE_FONT, BODY_FONT, BODY_FONT_BOLD, loadLogoSrc, formatDate } from './shared/PDFFonts';
import { formatAnalysisText } from '../../../utils/textFormatter';
import type { ProductPDFProps } from './shared/PDFTypes';
import { getArcano } from '../../../backend/numerology/arcanos';
import { calcularScore } from '../../../backend/numerology/score';
import { avaliarCompatibilidade } from '../../../backend/numerology/harmonization';
import {
  DESTINO_TITULO,
  DESTINO_DESC,
  EXPRESSAO_TITULO,
  EXPRESSAO_DESC,
  MOTIVACAO_DESC,
  IMPRESSAO_DESC,
  MISSAO_DESC,
  NUMERO_VIBRACAO,
} from '../../../backend/numerology/interpretations';

const theme = THEME_NOME_ATUAL;

const GOLD = theme.primaryColor;
const GRAY = '#4B5563';
const LIGHT_GRAY = '#E5E7EB';
const DARK = '#131313';

// ── Overlay de cadeado para triângulos bloqueados ─────────────────────────────

function PadlockOverlay() {
  // SVG causava crash (resolveAspectRatio falha em absolute-positioned containers)
  // Padlock reconstruído 100% com Views — sem SVG.
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ backgroundColor: '#4C1D95', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', borderWidth: 1.5, borderColor: '#7C3AED' }}>
        {/* Arco do cadeado (shackle) */}
        <View style={{ width: 20, height: 13, borderLeftWidth: 3, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#22D3EE', borderTopLeftRadius: 10, borderTopRightRadius: 10, marginBottom: -1 }} />
        {/* Corpo do cadeado */}
        <View style={{ width: 30, height: 20, backgroundColor: '#22D3EE', borderRadius: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          {/* Buraco da fechadura */}
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4C1D95', marginBottom: -3 }} />
          <View style={{ width: 3, height: 5, backgroundColor: '#4C1D95', borderRadius: 1 }} />
        </View>
        <Text style={{ color: '#FFFFFF', fontFamily: TITLE_FONT, fontSize: 11, letterSpacing: 1.5 }}>BLOQUEADO</Text>
        <Text style={{ color: '#C4B5FD', fontSize: 6.5, marginTop: 3, textAlign: 'center' }}>Disponivel no Nome Social</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
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

function normalizeScore(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function compatColor(c: string): string {
  return c === 'total' ? '#059669' : c === 'complementar' ? '#7c3aed' : c === 'aceitavel' ? '#D97706' : '#DC2626';
}

function compatLabel(c: string): string {
  return c === 'total' ? 'Total' : c === 'complementar' ? 'Complementar' : c === 'aceitavel' ? 'Aceitável' : 'Incompatível';
}

export function NomeAtualPDF({ analysis, magneticNames, userName }: ProductPDFProps) {
  const logoSrc = loadLogoSrc();
  const freqData = analysis.frequencias_numeros as any;
  // Para o novo fluxo, exibir o nome social escolhido (não o nome de nascimento)
  const nomeParaExibir = freqData?.ranking?.melhorNome?.nomeCompleto ?? analysis.nome_completo;
  const nomeNascimento = analysis.nome_completo;
  const primeiroNome = nomeNascimento.split(' ')[0] || nomeNascimento;
  const dataNascimento = formatDate(
    freqData?.ranking?.dataNascimento ?? analysis.data_nascimento
  );
  const dataGeracao = formatDate(analysis.completed_at ?? analysis.created_at);

  const letrasNome = nomeParaExibir
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');

  const melhorNome = freqData?.ranking?.melhorNome;
  const nomesCandidatos: any[] = freqData?.ranking?.nomesCandidatos ?? [];

  const nums = [
    { label: 'Expressão', sublabel: 'O Dom', value: analysis.numero_expressao, icon: '✦' },
    { label: 'Destino', sublabel: 'A Estrada (imutável)', value: analysis.numero_destino, icon: '◈' },
    { label: 'Motivação', sublabel: 'A Alma', value: analysis.numero_motivacao, icon: '♡' },
    { label: 'Impressão', sublabel: 'As Consoantes', value: analysis.numero_impressao, icon: '◎' },
    { label: 'Missão', sublabel: 'A Vocação', value: analysis.numero_missao, icon: '◇' },
  ];

  const bloqueios = Array.isArray(analysis.bloqueios) ? analysis.bloqueios : [];
  const debitos = Array.isArray(analysis.debitos_carmicos) ? analysis.debitos_carmicos : [];
  const licoes = Array.isArray(analysis.licoes_carmicas) ? analysis.licoes_carmicas : [];
  const tendencias = Array.isArray(analysis.tendencias_ocultas) ? analysis.tendencias_ocultas : [];

  const storedScore = normalizeScore(analysis.score);
  const fallbackScore =
    storedScore == null && analysis.numero_expressao != null && analysis.numero_destino != null
      ? calcularScore({
          bloqueios: bloqueios.length,
          ocorrenciasExtras: Math.max(
            0,
            bloqueios.reduce((sum, bloqueio: any) => sum + (Number(bloqueio?.totalOcorrencias) || 1), 0) - bloqueios.length
          ),
          licoesCarmicas: licoes.length,
          tendenciasOcultas: tendencias.length,
          debitosCarmicos: debitos.length,
          debitosCarmicoFixos: debitos.filter((debito: any) => debito?.fixo === true).length,
          compatibilidade: avaliarCompatibilidade(analysis.numero_expressao, analysis.numero_destino),
        })
      : null;
  const rawScore = storedScore ?? fallbackScore;
  type ScoreNivel = 'baixo' | 'aceitavel' | 'excelente' | null;
  const scoreNivel: ScoreNivel =
    rawScore == null ? null
      : rawScore >= 80 ? 'excelente'
        : rawScore >= 50 ? 'aceitavel'
          : 'baixo';
  const frequencias: Record<string, number> | null =
    freqData?.frequencias ?? (freqData && !freqData?.ranking ? freqData : null);

  const tVida = analysis.triangulo_vida ?? null;
  const tPessoal = analysis.triangulo_pessoal ?? null;
  const tSocial = analysis.triangulo_social ?? null;
  const tDestino = analysis.triangulo_destino ?? null;

  const TRIANGLE_FULL_WIDTH = 430;
  const baseLen = Math.max(
    tVida?.linhas[0]?.length ?? 1,
    tPessoal?.linhas[0]?.length ?? 1,
    tSocial?.linhas[0]?.length ?? 1,
    tDestino?.linhas[0]?.length ?? 1,
  );
  const triCellSize = Math.min(18, Math.max(5, Math.floor(TRIANGLE_FULL_WIDTH / baseLen) - 1));
  let analiseFormatado = analysis.analise_texto
    ? formatAnalysisText(analysis.analise_texto)
    : null;
  
  let escudoTexto: string | null = null;
  
  if (analiseFormatado) {
    analiseFormatado = analiseFormatado.replace(/^#{1,2}\s+[^\n]*\n+/, '');
    analiseFormatado = analiseFormatado.replace(/#{1,6}\s+[^\n]*Manual de Assinatura[^\n]*\n[\s\S]*?(?=#{1,6}\s|\s*$)/i, '');
    
    // Extrai o Escudo Magnético (se a IA gerou) e remove do texto principal para não duplicar
    const escudoRegex = /#{1,3}\s*(?:🛡️\s*)?Escudo Magnético[\s\S]*?(?=\n#{1,3}\s|$)/i;
    const matchEscudo = analiseFormatado.match(escudoRegex);
    if (matchEscudo) {
      escudoTexto = matchEscudo[0].replace(/#{1,3}\s*(?:🛡️\s*)?Escudo Magnético(?: de 72 Horas)?/i, '').trim();
      analiseFormatado = analiseFormatado.replace(escudoRegex, '');
    }
  }
  const conclusaoTexto = analiseFormatado ? extractConclusao(analiseFormatado) : null;

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

      {/* ── PÁGINA 2: A SUA ESSÊNCIA ─────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PDFPageHeader subtitle={`${nomeNascimento} — A Essência dos Seus Números`} />

        {/* Título */}
        <View style={{ marginTop: 16, marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, color: '#0F766E', textAlign: 'center', letterSpacing: 0.5 }}>
            A Sua Essência
          </Text>
        </View>

        {/* Card Destino centralizado */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={{ borderWidth: 2, borderColor: '#7C3AED', borderRadius: 12, padding: 18, backgroundColor: '#F5F3FF', alignItems: 'center', width: 230 }}>
            <Text style={{ fontSize: 8, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: BODY_FONT_BOLD, marginBottom: 10 }}>
              Número de Destino  ·  Imutável
            </Text>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 52, color: '#5b21b6', lineHeight: 1, marginBottom: 8 }}>
              {analysis.numero_destino ?? '?'}
            </Text>
            {analysis.numero_destino != null && NUMERO_VIBRACAO[analysis.numero_destino] && (
              <Text style={{ fontSize: 11, fontFamily: BODY_FONT_BOLD, color: '#5b21b6', marginBottom: 8, textAlign: 'center' }}>
                {NUMERO_VIBRACAO[analysis.numero_destino]}
              </Text>
            )}
            <Text style={{ fontSize: 8, color: '#7C3AED', textAlign: 'center' }}>
              Permanece após a harmonização de assinatura
            </Text>
          </View>
        </View>

        {/* O Que Não Pode Ser Mudado */}
        <View style={{ backgroundColor: '#F5F3FF', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#5b21b6', marginBottom: 6 }}>
            O Que Não Pode Ser Mudado — e o Que Pode
          </Text>
          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.65 }}>
            O Destino é o único número fora do alcance da harmonização. Calculado a partir da data de nascimento, representa a trilha original — o fio condutor que atravessa todas as fases da vida, independente da assinatura usada.
          </Text>
        </View>

        {/* 4 cards lado a lado */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {nums.filter(n => n.label !== 'Destino').map((num, i) => {
            const palettes = [
              { color: '#9A6B00', border: '#C89000', bg: '#FFFBF0' },
              { color: '#6d28d9', border: '#7C3AED', bg: '#F5F3FF' },
              { color: '#0369a1', border: '#0284C7', bg: '#F0F9FF' },
              { color: '#15803d', border: '#16A34A', bg: '#F0FDF4' },
            ];
            const p = palettes[i % palettes.length];
            const vibracao = num.value != null ? (NUMERO_VIBRACAO[num.value] ?? null) : null;
            return (
              <View key={i} style={{ flex: 1, borderWidth: 1.5, borderColor: p.border, borderRadius: 8, padding: 10, alignItems: 'center', backgroundColor: p.bg }}>
                <Text style={{ fontSize: 7, fontFamily: BODY_FONT_BOLD, color: p.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{num.label}</Text>
                <Text style={{ fontFamily: TITLE_FONT, fontSize: 28, color: p.color, lineHeight: 1 }}>{num.value ?? '?'}</Text>
                <Text style={{ fontSize: 7, color: p.color, textAlign: 'center', marginTop: 4 }}>{num.sublabel}</Text>
                {vibracao && (
                  <Text style={{ fontSize: 7, color: p.color, textAlign: 'center', marginTop: 2, fontFamily: BODY_FONT_BOLD }}>{vibracao}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Os Números do Nome — O Veículo */}
        <View style={{ borderRadius: 8, backgroundColor: 'rgba(212,175,55,0.06)', padding: 14 }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#8A5C00', marginBottom: 6 }}>Os Números do Nome — O Veículo</Text>
          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.65 }}>
            Expressão, Motivação, Impressão e Missão emergem das letras do nome de batismo. Diferente do Destino, esses números respondem ao arranjo da assinatura — e podem ser reorganizados.
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* ── PÁGINA 3: OS SEUS NÚMEROS ────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PDFPageHeader subtitle={`${nomeNascimento} — Os Seus Números`} />

        {/* Título da seção */}
        <View style={{ marginTop: 16, marginBottom: 6 }}>
          <Text style={[styles.sectionTitle, { color: '#0F766E', borderBottomColor: '#0F766E', fontSize: 14 }]}>
            Os Seus Números
          </Text>
        </View>

        <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.65, marginBottom: 14 }}>
          Cada número é uma camada da frequência que a assinatura emite 24h por dia. Alguns são imutáveis; outros respondem ao arranjo das letras e podem ser ajustados.
        </Text>

        {/* Destino — purple */}
        <View wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, backgroundColor: '#F5F3FF', borderRadius: 6, padding: 12 }}>
          <View style={{ width: 36, alignItems: 'center', marginRight: 12 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, color: '#5b21b6', lineHeight: 1 }}>{analysis.numero_destino ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#5b21b6', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>Destino — A Estrada da Alma</Text>
            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6 }}>
              {analysis.numero_destino != null && DESTINO_DESC[analysis.numero_destino]
                ? DESTINO_DESC[analysis.numero_destino]
                : 'Número imutável calculado da data de nascimento — o fio condutor que atravessa todas as fases da vida.'}
            </Text>
          </View>
        </View>

        {/* Expressão — gold */}
        <View wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, backgroundColor: '#FFFBF0', borderRadius: 6, padding: 12 }}>
          <View style={{ width: 36, alignItems: 'center', marginRight: 12 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, color: '#9A6B00', lineHeight: 1 }}>{analysis.numero_expressao ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#9A6B00', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>Expressão — O Dom Natural</Text>
            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6 }}>
              {analysis.numero_expressao != null && EXPRESSAO_DESC[analysis.numero_expressao]
                ? EXPRESSAO_DESC[analysis.numero_expressao]
                : 'Soma vibratória das letras do nome — revela o dom nato e como você se manifesta naturalmente.'}
            </Text>
          </View>
        </View>

        {/* Motivação — purple */}
        <View wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, backgroundColor: '#F5F3FF', borderRadius: 6, padding: 12 }}>
          <View style={{ width: 36, alignItems: 'center', marginRight: 12 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, color: '#6d28d9', lineHeight: 1 }}>{analysis.numero_motivacao ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#6d28d9', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>Motivação — A Alma do Nome</Text>
            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6 }}>
              {analysis.numero_motivacao != null && MOTIVACAO_DESC[analysis.numero_motivacao]
                ? MOTIVACAO_DESC[analysis.numero_motivacao]
                : 'As vogais revelam o motor profundo por trás das escolhas — não o que você faz, mas o que verdadeiramente te move.'}
            </Text>
          </View>
        </View>

        {/* Impressão — sky blue */}
        <View wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, backgroundColor: '#F0F9FF', borderRadius: 6, padding: 12 }}>
          <View style={{ width: 36, alignItems: 'center', marginRight: 12 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, color: '#0369a1', lineHeight: 1 }}>{analysis.numero_impressao ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#0369a1', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>Impressão — A Máscara Social</Text>
            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6 }}>
              {analysis.numero_impressao != null && IMPRESSAO_DESC[analysis.numero_impressao]
                ? IMPRESSAO_DESC[analysis.numero_impressao]
                : 'As consoantes formam a estrutura que o mundo percebe primeiro — molda reputações e primeiras impressões.'}
            </Text>
          </View>
        </View>

        {/* Missão — green */}
        <View wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FDF4', borderRadius: 6, padding: 12 }}>
          <View style={{ width: 36, alignItems: 'center', marginRight: 12 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, color: '#15803d', lineHeight: 1 }}>{analysis.numero_missao ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#15803d', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>Missão — A Vocação de Vida</Text>
            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6 }}>
              {analysis.numero_missao != null && MISSAO_DESC[analysis.numero_missao]
                ? MISSAO_DESC[analysis.numero_missao]
                : 'Calculada pelo primeiro nome — aponta o campo onde seus dons encontram maior ressonância com o mundo.'}
            </Text>
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* ── BLOCO: O TRIÂNGULO DA VIDA ─────────────────────────────────────────── */}
      {tVida && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — O Triângulo da Vida`} />

          <View style={{ marginTop: 20, marginBottom: 14 }}>
            <Text style={styles.hugeTitle}>A Estrutura Fundamental do Nome</Text>
          </View>

          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6, marginBottom: 10 }}>
            O nome é analisado sob quatro perspectivas distintas. A mais essencial delas é o Triângulo da Vida, calculado a partir do valor puro de cada letra.
          </Text>

          {/* O Que São os Arcanos */}
          <View wrap={false} style={{ borderRadius: 8, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#7C3AED', padding: 10, marginBottom: 8 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, color: '#7C3AED', marginBottom: 4 }}>O Que São os Arcanos</Text>
            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.55 }}>
              Em cada pirâmide, o número no vértice superior é o Arcano Regente — a força dominante que governa aquela dimensão. É a identificação matemática do padrão que já opera por trás dos eventos, independente da sua vontade.
            </Text>
          </View>

          {/* O Que São os Bloqueios */}
          <View wrap={false} style={{ borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', padding: 10, marginBottom: 8 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, color: '#DC2626', marginBottom: 4 }}>O Que São os Bloqueios Energéticos</Text>
            <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.55 }}>
              Quando o mesmo número aparece três ou mais vezes consecutivas, forma-se um Bloqueio — a frequência do nome emite o mesmo padrão em loop. Opera independente de esforço ou força de vontade. Células vermelhas na pirâmide indicam onde o bloqueio está ativo.
            </Text>
          </View>

          {/* ─── TRIÂNGULO DA VIDA ───────────────────────────────────────────── */}
          {tVida && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#C89000', borderBottomColor: '#C89000', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo da Vida
              </Text>
              <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6, marginBottom: 10 }}>
                A estrutura mais fundamental — calculada do valor puro de cada letra. Governa saúde, vitalidade e prosperidade material. Bloqueios aqui criam ciclos crônicos de desgaste físico e instabilidade financeira.
              </Text>
              <TrianguloPiramideInline data={tVida} label="TRIÂNGULO DA VIDA" cellSize={triCellSize} letras={letrasNome} />
              {/* Arcano Regente do Triângulo da Vida — versão simplificada (dossiê gratuito) */}
              {tVida.arcanoRegente != null && (() => {
                const arc = getArcano(tVida.arcanoRegente!);
                return (
                  <View wrap={false} style={{ marginTop: 14 }}>
                    <Text style={{ fontSize: 11, fontFamily: TITLE_FONT, color: '#C89000', borderBottomWidth: 1, borderBottomColor: '#C89000', paddingBottom: 4, marginBottom: 10, letterSpacing: 0.5 }}>
                      {'Arcano Regente da Vida — ' + String(arc?.numero ?? '') + ': ' + (arc?.nome ?? '')}
                    </Text>
                    <View wrap={false} style={{ borderWidth: 1, borderColor: '#7C3AED', borderRadius: 6, padding: 12, backgroundColor: '#F5F3FF' }}>
                      <Text style={{ fontFamily: TITLE_FONT, fontSize: 11, color: '#5b21b6', textAlign: 'center', marginBottom: 10 }}>
                        {arc?.palavraChave ?? ''}
                      </Text>
                      <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: '#7C3AED', letterSpacing: 0.8, marginBottom: 4 }}>
                        VIBRAÇÃO DOMINANTE
                      </Text>
                      <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                        {arc?.descricao ?? ''}
                      </Text>
                      <Text style={{ fontSize: 8, fontFamily: BODY_FONT_BOLD, color: '#7C3AED', letterSpacing: 0.8, marginBottom: 4 }}>
                        DESAFIO A INTEGRAR
                      </Text>
                      <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.65, fontFamily: 'Helvetica-Oblique' }}>
                        {arc?.desafio ?? ''}
                      </Text>
                    </View>
                  </View>
                );
              })()}
              {/* Bloqueios do Triângulo da Vida — exibidos completos na prévia */}
              {(() => {
                const vidaBloqueios = bloqueios.filter((b: any) => b.triangulos?.includes('vida'));
                return (
                  <View style={{ marginTop: 12 }}>
                    {vidaBloqueios.length > 0 && (
                      <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                        {vidaBloqueios.length} Bloqueio{vidaBloqueios.length > 1 ? 's' : ''} Detectado{vidaBloqueios.length > 1 ? 's' : ''} no Triângulo da Vida
                      </Text>
                    )}
                    <BloqueiosBlock bloqueios={vidaBloqueios} hideTriangulos={true} showAntidoto={false} />
                  </View>
                );
              })()}
            </View>
          )}

          <PDFFooter />
        </Page>
      )}

      {/* ── PÁGINA: O MAPA COMPLETO OCULTO ───────────────────────────────── */}
      {(tPessoal || tSocial || tDestino) && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — O Mapa Completo`} />

          <View style={{ marginTop: 20, marginBottom: 14 }}>
            <Text style={styles.hugeTitle}>O Mapa Completo Oculto</Text>
          </View>

          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7, marginBottom: 24, textAlign: 'justify' }}>
            Além do Triângulo da Vida, o seu nome possui mais três dimensões estruturais que governam áreas cruciais da sua jornada. Quando bloqueadas, essas dimensões criam ciclos repetitivos de resistência que não respondem à força de vontade ou mudança de comportamento.
          </Text>

          {/* Box Pessoal */}
          <View wrap={false} style={{ backgroundColor: '#F5F3FF', borderRadius: 10, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.2)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ width: 4, height: 16, backgroundColor: '#7C3AED', borderRadius: 2 }} />
              <Text style={{ fontFamily: TITLE_FONT, fontSize: 14, color: '#5B21B6' }}>O Triângulo Pessoal</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#4C1D95', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Relacionamentos Afetivos e Reações Internas</Text>
            <Text style={{ fontSize: 10, color: '#4B5563', lineHeight: 1.6 }}>
              Acessa os padrões que operam na vida íntima e nos relacionamentos afetivos. Bloqueios nesta dimensão criam desgaste emocional crônico, dificuldades de conexão verdadeira e padrões de autossabotagem quando você está mais vulnerável.
            </Text>
            <Text style={{ fontSize: 8, color: '#7C3AED', marginTop: 10, fontStyle: 'italic' }}>* Diagnóstico completo dos bloqueios pessoais disponível na Harmonização.</Text>
          </View>

          {/* Box Social */}
          <View wrap={false} style={{ backgroundColor: '#F0FDF4', borderRadius: 10, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(5, 150, 105, 0.2)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ width: 4, height: 16, backgroundColor: '#059669', borderRadius: 2 }} />
              <Text style={{ fontFamily: TITLE_FONT, fontSize: 14, color: '#065F46' }}>O Triângulo Social</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#064E3B', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Carreira, Magnetismo e Oportunidades</Text>
            <Text style={{ fontSize: 10, color: '#4B5563', lineHeight: 1.6 }}>
              Mapeia a percepção externa e o magnetismo do nome. Bloqueios nesta dimensão fazem com que o mundo não enxergue seu verdadeiro valor, fechando portas profissionais e criando estagnação na carreira mesmo com muito esforço.
            </Text>
            <Text style={{ fontSize: 8, color: '#059669', marginTop: 10, fontStyle: 'italic' }}>* Diagnóstico completo dos bloqueios sociais disponível na Harmonização.</Text>
          </View>

          {/* Box Destino */}
          <View wrap={false} style={{ backgroundColor: '#FFFBEB', borderRadius: 10, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.2)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ width: 4, height: 16, backgroundColor: '#D97706', borderRadius: 2 }} />
              <Text style={{ fontFamily: TITLE_FONT, fontSize: 14, color: '#92400E' }}>O Triângulo do Destino</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#78350F', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Legado Construído e Resultados Concretos</Text>
            <Text style={{ fontSize: 10, color: '#4B5563', lineHeight: 1.6 }}>
              A dimensão mais reveladora. Combina a essência do nome com o seu dia e mês de nascimento para projetar os resultados materiais e o legado final. Bloqueios aqui dissipam sua energia, impedindo que você consolide suas maiores conquistas.
            </Text>
            <Text style={{ fontSize: 8, color: '#D97706', marginTop: 10, fontStyle: 'italic' }}>* Diagnóstico completo dos bloqueios de destino disponível na Harmonização.</Text>
          </View>

          <PDFFooter />
        </Page>
      )}

      {/* ── PÁGINA 4/5: KARMA E TENDÊNCIAS ─────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — O Peso do Passado`} />

        <View style={{ marginTop: 20, marginBottom: 8 }}>
          <Text style={styles.hugeTitle}>Karma, Lições e Tendências Ocultas</Text>
        </View>

        <View style={{ ...styles.section, marginTop: 12 }}>
          <Text style={[styles.sectionTitle, { color: '#D97706', borderBottomColor: '#D97706', fontSize: 13 }]}>
            Débitos Kármicos
          </Text>
          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6, marginBottom: 8 }}>
            Padrões de encarnações anteriores ainda ativos no nome — manifestam-se como ciclos repetitivos de perda, esforço redobrado sem resultado ou bloqueios onde você mais quer prosperar.
          </Text>
          <DebitosBlock debitos={debitos} showSolution={false} compact={true} />
        </View>

        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#0369a1', borderBottomColor: '#0369a1', fontSize: 13 }]}>
            Lições Kármicas
          </Text>
          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6, marginBottom: 8 }}>
            Números ausentes no nome — qualidades que precisam ser construídas do zero nesta vida. Criam pontos cegos crônicos em áreas onde o esforço parece desproporcional ao resultado.
          </Text>
          <LicoesBlock licoes={licoes} showSolution={false} compact={true} />
        </View>

        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#6d28d9', borderBottomColor: '#6d28d9', fontSize: 13 }]}>
            Tendências Ocultas
          </Text>
          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.6, marginBottom: 8 }}>
            Quando um número aparece 4 ou mais vezes no nome, domina o comportamento automaticamente. O que seria talento torna-se compulsão — sabotando exatamente onde você mais quer prosperar.
          </Text>
          <TendenciasBlock tendencias={tendencias} frequencias={frequencias} showSolution={false} />
        </View>

        <PDFFooter />
      </Page>

      {/* ── DIAGNÓSTICO DO NOME removido do relatório gratuito ──────────── */}

      {/* ── PÁGINA: DIAGNÓSTICO É CLARO (FUNDO ESCURO) ──────────────────── */}
      <Page size="A4" style={styles.darkPage}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — O Diagnóstico`} />

        {/* Título dourado */}
        <View style={{ marginTop: 28, marginBottom: 24 }}>
          <Text style={[styles.hugeTitle, { fontSize: 22 }]}>O Diagnóstico É Claro</Text>
        </View>

        {/* Bullets */}
        <View style={[styles.section, { gap: 14 }]}>

          {/* Bloqueios */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ color: '#EF4444', fontFamily: BODY_FONT_BOLD, fontSize: 13, lineHeight: 1.4, marginTop: 1 }}>—</Text>
            <Text style={{ flex: 1, fontSize: 10, color: '#e5e2e1', lineHeight: 1.6 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD }}>{bloqueios.length} bloqueio{bloqueios.length !== 1 ? 's' : ''} {bloqueios.length !== 1 ? 'energéticos' : 'energético'}</Text>
              {' '}detectado{bloqueios.length !== 1 ? 's' : ''} no Triângulo da Vida — loops vibracionais ativos 24h/dia, independente de esforço ou força de vontade.
            </Text>
          </View>

          {/* Débitos */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ color: '#EF4444', fontFamily: BODY_FONT_BOLD, fontSize: 13, lineHeight: 1.4, marginTop: 1 }}>—</Text>
            <Text style={{ flex: 1, fontSize: 10, color: '#e5e2e1', lineHeight: 1.6 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD }}>{debitos.length} débito{debitos.length !== 1 ? 's' : ''} kármico{debitos.length !== 1 ? 's' : ''}</Text>
              {' '}ativo{debitos.length !== 1 ? 's' : ''} — padrões de encarnações passadas que criam ciclos de resistência em áreas específicas da vida.
            </Text>
          </View>

          {/* Lições */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ color: '#EF4444', fontFamily: BODY_FONT_BOLD, fontSize: 13, lineHeight: 1.4, marginTop: 1 }}>—</Text>
            <Text style={{ flex: 1, fontSize: 10, color: '#e5e2e1', lineHeight: 1.6 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD }}>{licoes.length} lição{licoes.length !== 1 ? 'ões' : ''} kármica{licoes.length !== 1 ? 's' : ''}</Text>
              {' '}identificada{licoes.length !== 1 ? 's' : ''} — vibrações ausentes no nome que criam pontos cegos e lacunas de talento.
            </Text>
          </View>

          {/* Tendências */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ color: '#EF4444', fontFamily: BODY_FONT_BOLD, fontSize: 13, lineHeight: 1.4, marginTop: 1 }}>—</Text>
            <Text style={{ flex: 1, fontSize: 10, color: '#e5e2e1', lineHeight: 1.6 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD }}>{tendencias.length} tendência{tendencias.length !== 1 ? 's' : ''} oculta{tendencias.length !== 1 ? 's' : ''}</Text>
              {' '}— frequências em excesso que operam como compulsão automática, sabotando exatamente onde você mais quer prosperar.
            </Text>
          </View>

        </View>

        {/* Card cinza escuro de conclusão */}
        <View style={{
          marginTop: 28,
          marginHorizontal: 24,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}>
          <Text style={{ fontSize: 10, color: '#C9C5C0', lineHeight: 1.7, textAlign: 'center' }}>
            Nenhum desses padrões responde a esforço ou mudança de comportamento — a origem está na frequência que a assinatura emite. A harmonização reorganiza as letras do nome para eliminar os bloqueios, minimizar os débitos variáveis e introduzir as vibrações ausentes. O resultado é uma assinatura que trabalha a favor do Destino, não contra.
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* ── PÁGINA: A PEQUENA VITÓRIA (BRIDGE PAGE) ────────────────────── */}
      <Page size="A4" style={styles.darkPage}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — O Primeiro Passo`} />

        <View style={{ marginTop: 28, marginBottom: 18 }}>
          <Text style={[styles.hugeTitle, { fontSize: 22, color: GOLD }]}>Ação Imediata: O Escudo Provisório</Text>
        </View>

        <Text style={{ fontSize: 10, color: '#e5e2e1', lineHeight: 1.7, marginBottom: 20, textAlign: 'justify' }}>
          Antes de mergulhar na Harmonização completa do seu nome, existe um passo imediato que você pode tomar hoje. Ao aplicar as orientações para amenizar o bloqueio primário da sua assinatura atual, você ergue um "Escudo Provisório" que ajuda a estancar a perda de energia vital.
        </Text>

        {bloqueios.length > 0 ? (
          <View style={{ backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 10, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 13, color: '#f2ca50', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>O Que Fazer Agora?</Text>
            <Text style={{ fontSize: 10, color: '#e5e2e1', lineHeight: 1.6, marginBottom: 12 }}>
              Sua primeira ação prática deve ser neutralizar a repetição primária do {bloqueios[0].titulo}.
            </Text>
            {(escudoTexto || bloqueios[0].descricao.includes('O antídoto é')) && (
              <View style={{ backgroundColor: 'rgba(242, 202, 80, 0.1)', padding: 12, borderRadius: 6, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#f2ca50' }}>
                <Text style={{ fontSize: 10, color: '#f2ca50', fontFamily: BODY_FONT_BOLD, marginBottom: 4 }}>Ação Recomendada (Próximas 72h):</Text>
                <Text style={{ fontSize: 10, color: '#e5e2e1', lineHeight: 1.5 }}>
                  {escudoTexto 
                    ? escudoTexto 
                    : `O antídoto imediato para começar a destravar essa energia é ${bloqueios[0].descricao.split('O antídoto é')[1]?.trim().toLowerCase() || 'focar em neutralizar essa sequência na sua assinatura diária.'}`
                  }
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 9, color: '#C9C5C0', fontStyle: 'italic', lineHeight: 1.5 }}>
              Nota: Este é apenas um curativo vibracional provisório para contenção de danos. A única forma de eliminar este bloqueio de forma definitiva é através da Harmonização de Assinatura, que construirá um escudo protetor permanente no seu destino.
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 10, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 13, color: '#f2ca50', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>O Que Fazer Agora?</Text>
            <Text style={{ fontSize: 10, color: '#e5e2e1', lineHeight: 1.6, marginBottom: 12 }}>
              Sua primeira ação prática deve ser alinhar sua assinatura para evitar futuras resistências vibracionais. Este pequeno ajuste já é capaz de otimizar a sua energia nas próximas 72 horas.
            </Text>
            <Text style={{ fontSize: 9, color: '#C9C5C0', fontStyle: 'italic', lineHeight: 1.5 }}>
              Nota: Este é apenas um passo preventivo. Para o alinhamento completo do seu propósito, a análise profunda de todos os triângulos é indispensável.
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 10, color: '#C9C5C0', lineHeight: 1.7, textAlign: 'center', marginTop: 'auto', marginBottom: 20 }}>
          Descubra na próxima página como iniciar a sua Harmonização Completa e transformar definitivamente a vibração que rege os seus resultados.
        </Text>

        <PDFFooter />
      </Page>

      {/* A seção de Variações Numerológicas foi removida do PDF (só aparece no HTML) */}

      {/* ── PÁGINA FINAL: CTA — DIAGNÓSTICO DEFINITIVO (FUNDO ESCURO) ──────── */}
      <Page size="A4" style={styles.darkPage}>

        {/* Título */}
        <View style={{ marginTop: 18, marginBottom: 16 }}>
          <Text style={[styles.hugeTitle, { color: bloqueios.length > 0 ? '#EF4444' : scoreNivel === 'aceitavel' ? '#F59E0B' : GOLD, fontSize: 17 }]}>
            O Diagnóstico É Definitivo — A Assinatura Continua Emitindo
          </Text>
        </View>

        {/* Comparação lado a lado */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }} wrap={false}>
          {/* Coluna Atual */}
          <View style={{ flex: 1, backgroundColor: 'rgba(220,38,38,0.12)', borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 8, color: '#EF4444', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, textAlign: 'center' }}>
              Assinatura Atual
            </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 26, color: rawScore != null ? scoreColor(rawScore) : '#EF4444', textAlign: 'center', marginBottom: 8, lineHeight: 1 }}>
              {rawScore != null ? `${rawScore}` : '--'}/100
            </Text>
            {bloqueios.length > 0 && (
              <Text style={{ fontSize: 8, color: '#FCA5A5', marginBottom: 2 }}>
                - {bloqueios.length} bloqueio{bloqueios.length > 1 ? 's' : ''} ativo{bloqueios.length > 1 ? 's' : ''} na assinatura
              </Text>
            )}
            <Text style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 2 }}>- Frequência de resistência 24h/dia</Text>
            <Text style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 2 }}>- Campo vibracional parcialmente travado</Text>
            <Text style={{ fontSize: 8, color: '#9CA3AF' }}>- Esforço desproporcional ao resultado</Text>
          </View>
          {/* Seta */}
          <View style={{ justifyContent: 'center', alignItems: 'center', width: 24 }}>
            <Text style={{ fontSize: 14, color: GOLD, fontFamily: 'Helvetica-Bold' }}>{'>>'}</Text>
          </View>
          {/* Coluna Harmonizado */}
          <View style={{ flex: 1, backgroundColor: 'rgba(5,150,105,0.12)', borderWidth: 1.5, borderColor: '#10B981', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 8, color: '#10B981', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, textAlign: 'center' }}>
              Assinatura Harmonizada
            </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 26, color: '#10B981', textAlign: 'center', marginBottom: 8, lineHeight: 1 }}>
              80-96/100
            </Text>
            <Text style={{ fontSize: 8, color: '#6EE7B7', marginBottom: 2 }}>+ Zero bloqueios em todos os triângulos</Text>
            <Text style={{ fontSize: 8, color: '#6EE7B7', marginBottom: 2 }}>+ Frequência magnética constante</Text>
            <Text style={{ fontSize: 8, color: '#6EE7B7', marginBottom: 2 }}>+ Expressão alinhada ao Destino</Text>
            <Text style={{ fontSize: 8, color: '#6EE7B7' }}>+ Campo vibracional recalibrado</Text>
          </View>
        </View>

        {/* O Que Você Recebe */}
        <View style={{ backgroundColor: 'rgba(212,175,55,0.06)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 8, padding: 12, marginBottom: 14 }} wrap={false}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, color: GOLD, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            O Que Você Recebe na Harmonização de Assinatura
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <View>
                <Text style={{ fontSize: 8, color: GOLD, fontFamily: BODY_FONT_BOLD, marginBottom: 2 }}>{'> Análise completa dos 4 triângulos'}</Text>
                <Text style={{ fontSize: 7, color: '#9CA3AF' }}>Triângulos Pessoal, Social e do Destino desbloqueados</Text>
              </View>
              <View>
                <Text style={{ fontSize: 8, color: GOLD, fontFamily: BODY_FONT_BOLD, marginBottom: 2 }}>{'> Variações de assinatura sem bloqueios'}</Text>
                <Text style={{ fontSize: 7, color: '#9CA3AF' }}>Score acima de 70 garantido</Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <View>
                <Text style={{ fontSize: 8, color: GOLD, fontFamily: BODY_FONT_BOLD, marginBottom: 2 }}>{'> Todos os arcanos revelados'}</Text>
                <Text style={{ fontSize: 7, color: '#9CA3AF' }}>Vibração dominante e desafio de cada dimensão</Text>
              </View>
              <View>
                <Text style={{ fontSize: 8, color: GOLD, fontFamily: BODY_FONT_BOLD, marginBottom: 2 }}>{'> Guia de implementação'}</Text>
                <Text style={{ fontSize: 7, color: '#9CA3AF' }}>Como aplicar a nova assinatura imediatamente</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Depoimentos */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }} wrap={false}>
          {[
            { texto: '"Os bloqueios que o relatório mostrou explicavam ciclos de 10 anos. Harmonizei e o padrão mudou."', autor: 'Ricardo T. — empresário, MG' },
            { texto: '"Em 3 meses vieram 2 contratos que eu nem buscava. Assinar diferente foi o divisor de águas."', autor: 'Fernanda M. — consultora, SP' },
            { texto: '"Parecia pequena coisa — mudar uma letra na assinatura. Não era."', autor: 'Ana Paula C. — terapeuta, RJ' },
          ].map((dep, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 8 }}>
              <Text style={{ fontSize: 7, color: '#D1D5DB', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 5 }}>{dep.texto}</Text>
              <Text style={{ fontSize: 7, color: '#6B7280' }}>{dep.autor}</Text>
            </View>
          ))}
        </View>

        {/* Âncora de preço */}
        <Text style={{ fontSize: 9, color: '#92640F', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6, marginBottom: 12 }}>
          {bloqueios.length > 0
            ? `Quanto custa mais um ano com ${bloqueios.length} bloqueio${bloqueios.length > 1 ? 's' : ''} na sua assinatura repelindo resultados?`
            : 'Quanto custa mais um ano com uma frequência que pode ser muito mais poderosa?'}{'\n'}
          Harmonização de Assinatura por R$ 98 — a assinatura muda. A frequência muda. Os resultados mudam.
        </Text>

        {/* CTA Button */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Link src="https://nomemagnetico.com.br/nome-social" style={{ textDecoration: 'none', marginBottom: 8 }}>
            <View style={{ backgroundColor: '#10B981', paddingVertical: 18, paddingHorizontal: 44, borderRadius: 32 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 15, textAlign: 'center' }}>
                Harmonizar Minha Assinatura Agora
              </Text>
            </View>
          </Link>
          <Text style={{ fontSize: 9, color: GOLD, marginBottom: 2 }}>nomemagnetico.com.br/nome-social</Text>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>Acesso imediato após confirmação</Text>
            <Text style={{ fontSize: 8, color: '#9CA3AF' }}>|</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>R$ 98</Text>
          </View>
        </View>

        {/* Selos de segurança */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 4 }}>
          <Text style={{ fontSize: 7, color: '#4B5563' }}>Pagamento seguro</Text>
          <Text style={{ fontSize: 7, color: '#4B5563', fontFamily: BODY_FONT_BOLD }}>Stripe</Text>
          <Text style={{ fontSize: 7, color: '#4B5563' }}>Google Pay</Text>
          <Text style={{ fontSize: 7, color: '#4B5563' }}>Apple Pay</Text>
        </View>
        <Text style={{ fontSize: 6, color: '#374151', textAlign: 'center' }}>
          Processado via Stripe — criptografia SSL de 256 bits. Acesso imediato após confirmação.
        </Text>

        <PDFFooter />
      </Page>
    </Document>
  );
}
