/**
 * NomeAtualPDF — documento PDF da análise Gratuita (Nome Atual).
 *
 * Estrutura de páginas:
 *   1. Capa
 *   2. Sumário
 *   3+. A Essência — O Nome de Nascimento Original
 *       - Banner do nome + O Som do Seu Nascimento
 *       - Destino card + 4 cards de números + Detalhamento dos 5 números
 *       - Arquétipo Vibracional do Nome de Nascimento
 *       - Triângulo da Vida (Nascimento) com Arcanos e Bloqueios
 *       - O Peso do Passado: Débitos, Lições e Tendências Ocultas
 *   N-2. O que este mapa mostrou
 *   N-1. Como Calculamos o Seu Score Cabalístico
 *   N. Potencial da Assinatura / CTA (Nome Social)
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { THEMES, PDF_TYPOGRAPHY } from './shared/PDFTheme';
import { PDFCover } from './shared/PDFCover';
import { PDFPageHeader } from './shared/PDFPageHeader';
import { PDFFooter } from './shared/PDFFooter';
import { DebitosBlock, LicoesBlock, TendenciasBlock } from './shared/PDFKarmicBlock';
import { PDFArquetipoDetailBlock } from './shared/PDFArquetipoDetailBlock';
import { PDFTriangleDetailsBlock } from './shared/PDFTriangleDetailsBlock';
import { LOGO_FONT, TITLE_FONT, BODY_FONT, BODY_FONT_BOLD, loadLogoSrc, formatDate } from './shared/PDFFonts';
import { normalizeBirthDateForNumerology } from './shared/pdfBirthDate';
import { PDFTableOfContents } from './shared/PDFTableOfContents';
import { buildGratuitoTocEntries } from './shared/pdfTocCatalog.ts';
import { PDFSectionAnchor } from './shared/PDFSectionAnchor';
import { PDFComoCalculamosScore } from './shared/PDFComoCalculamosScore';
import { formatAnalysisText } from '../../../utils/textFormatter';
import type { ProductPDFProps } from './shared/PDFTypes';
import { getArquetipo } from '../../../backend/numerology/archetypes';
import {
  avaliarNome,
  calcularScoreV1SemOcorrenciasExtras,
} from '../../../backend/numerology/score';
import { isScoreV3 } from '../../../backend/numerology/score-version';
import { avaliarCompatibilidade } from '../../../backend/numerology/harmonization';
import { calcularTodosTriangulos, detectarBloqueios } from '../../../backend/numerology/triangle';
import { calcularCincoNumeros } from '../../../backend/numerology/numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos, mapearFrequencias } from '../../../backend/numerology/karmic';
import {
  DESTINO_DESC,
  EXPRESSAO_DESC,
  MOTIVACAO_DESC,
  IMPRESSAO_DESC,
  MISSAO_DESC,
} from '../../../backend/numerology/interpretations';

import {
  getScoreV3Level,
  getScoreV3LevelBadgeClass,
  getScoreV3LevelDescription,
  formatScoreV3Points,
  SCORE_CONFIG_V3,
  isAnaliseV3,
  type NivelCodigo,
} from '../../../shared/score-v3';
import {
  calcularPotencialAssinaturaPdfGratuito,
  notaEstritamenteMaiorQueBase,
} from '../../../backend/numerology/products/nome-social-potencial-pdf';
import { buildPotencialCtaUrl } from './shared/pdfPotencialCtaUrl';
import { PDFPotencialMaximoCtaPage } from './shared/PDFPotencialMaximoCta';
import {
  PDFComoLerGratuito,
  PDFMapaMostrouGratuito,
  PDFParte1Gratuito,
  PDFResumoGratuito,
  type GratuitoLayoutProps,
} from './layout/NomeAtualLayoutPages';
import { LAYOUT_THEME_PADRAO } from './layout/pdfLayoutTheme';

/** Tema do layout base (DEV-322/DEV-332). No futuro vem da marca do profissional. */
const layoutTheme = LAYOUT_THEME_PADRAO;

// DEV-332: capa da mesma família dos PDFs pagos (fundo escuro e dourado).
const theme = {
  ...THEMES.nome_social,
  productLabel: 'Análise do nome de nascimento',
  coverSubtitle: 'Análise vibracional gratuita',
};

const GOLD = theme.primaryColor;
const GRAY = '#4B5563';
const LIGHT_GRAY = '#E5E7EB';
const DARK = '#131313';

const SUGESTOES_AMENIZAR: Record<string, string[]> = {
  '111': [
    'Inicie um pequeno projeto pessoal ou hábito hoje e comprometa-se a mantê-lo por 7 dias.',
    'Tome uma decisão importante que você vinha adiando por medo ou hesitação.',
    'Pratique se posicionar de forma firme e expressar sua opinião individual em conversas cotidianas.'
  ],
  '222': [
    'Defina e comunique um limite claro em uma relação pessoal ou profissional nas próximas 48 horas.',
    'Pratique dizer "não" a solicitações secundárias que drenam sua energia.',
    'Equilibre as trocas nas suas relações: certifique-se de que o que você entrega está proporcional ao que recebe.'
  ],
  '333': [
    'Escreva livremente seus pensamentos e sentimentos em um diário por 10 minutos antes de dormir.',
    'Exponha sua voz de forma autêntica: fale o que precisa sem esperar que os outros adivinhem.',
    'Engaje-se em uma atividade criativa (desenho, escrita, música) sem se preocupar com o julgamento alheio.'
  ],
  '444': [
    'Organize fisicamente sua mesa de trabalho ou guarda-roupa para reestruturar a energia ao seu redor.',
    'Crie e siga uma rotina ou cronograma diário simples e objetivo para as suas tarefas mais importantes.',
    'Faça um controle básico das suas finanças pessoais, registrando cada entrada e saída sem exceções.'
  ],
  '555': [
    'Mude intencionalmente um pequeno hábito da sua rotina diária (como o caminho que faz ou a ordem do seu café).',
    'Faça um descarte consciente de arquivos digitais ou objetos físicos acumulados.',
    'Pratique a flexibilidade: diante de um imprevisto, respire fundo e adapte-se ao novo cenário sem resistência.'
  ],
  '666': [
    'Reserve um momento diário de silêncio e cuidado voltado inteiramente para você (autonutrição).',
    'Delegue uma responsabilidade doméstica ou profissional que você costuma carregar sozinho.',
    'Evite absorver ou tentar resolver os problemas e conflitos emocionais que pertencem a outras pessoas.'
  ],
  '777': [
    'Reserve de 10 a 15 minutos diários para silenciar a mente, meditar ou praticar respiração consciente.',
    'Estude ou leia sobre um tema de filosofia, autoconhecimento ou sabedoria oculta.',
    'Fique longe de telas e redes sociais por pelo menos duas horas antes de dormir para acalmar os pensamentos.'
  ],
  '888': [
    'Faça um exercício de desapego material doando um item de valor que você já não utiliza.',
    'Organize suas contas e estabeleça uma meta profissional clara, focando na ética e no valor real do seu serviço.',
    'Pratique a gratidão ativa pelas suas conquistas materiais atuais para reequilibrar o fluxo da abundância.'
  ],
  '999': [
    'Desfaça-se de cartas, fotos ou objetos antigos que mantêm sua mente presa a situações do passado.',
    'Escreva uma carta de perdão (para alguém ou para si mesmo), coloque nela todas as mágoas e depois queime-a ou descarte-a, simbolizando o encerramento do ciclo.',
    'Conclua oficialmente um projeto, conversa ou compromisso pendente que já não faz sentido na sua vida atual.'
  ]
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: BODY_FONT,
    color: GRAY,
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
    ...PDF_TYPOGRAPHY.h2,
    fontFamily: TITLE_FONT,
    color: GOLD,
    borderBottomColor: GOLD,
  },
  subSectionTitle: {
    ...PDF_TYPOGRAPHY.h3,
    fontFamily: TITLE_FONT,
    color: GOLD,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
  },
  subHeading: {
    ...PDF_TYPOGRAPHY.h4,
    fontFamily: BODY_FONT_BOLD,
  },
  hugeTitle: {
    ...PDF_TYPOGRAPHY.h1,
    fontFamily: TITLE_FONT,
    color: GOLD,
    textAlign: 'center',
    marginBottom: 16,
  },
  bodyText: {
    ...PDF_TYPOGRAPHY.paragraph,
    fontFamily: BODY_FONT,
  },
  cardBodyText: {
    ...PDF_TYPOGRAPHY.cardText,
    fontFamily: BODY_FONT,
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

function scoreColor(score: number): string {
  if (score >= 90) return '#10B981'; // Excelente
  if (score >= 70) return '#84CC16'; // Bom
  if (score >= 40) return '#FACC15'; // Aceitável
  if (score >= 20) return '#F97316'; // Não recomendado
  return '#EF4444'; // Crítico
}

function normalizeScore(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function NomeAtualPDF({
  analysis,
  magneticNames: _magneticNames,
  userName: _userName,
  upgradeOfferLabel: _upgradeOfferLabel,
  potencialCtaQrDataUrl,
  pdfRender,
}: ProductPDFProps) {
  const logoSrc = loadLogoSrc();
  const freqData = analysis.frequencias_numeros as any;
  const nomeNascimento = freqData?.ranking?.nomeNascimento ?? analysis.nome_completo;
  const nomeParaExibir = nomeNascimento;
  const dataNascimento = formatDate(
    freqData?.ranking?.dataNascimento ?? analysis.data_nascimento
  );
  const dataGeracao = formatDate(analysis.completed_at ?? analysis.created_at);

  // ── Dados calculados em tempo real a partir do nome de nascimento ──────────
  const dataNascimentoRaw = normalizeBirthDateForNumerology(
    freqData?.ranking?.dataNascimento ?? analysis.data_nascimento ?? '',
  );
  const cincoNumNasc = calcularCincoNumeros(nomeNascimento, dataNascimentoRaw);
  const arquetipoNasc = getArquetipo(cincoNumNasc.expressao ?? 1);
  const triangulosNasc = calcularTodosTriangulos(nomeNascimento, dataNascimentoRaw);
  const bloqueios = detectarBloqueios(triangulosNasc);
  const tVida = triangulosNasc.vida;
  const licoes     = detectarLicoesCarmicas(nomeNascimento);
  const tendencias = detectarTendenciasOcultas(nomeNascimento);
  const debitos    = calcularDebitosCarmicos(
    dataNascimentoRaw,
    cincoNumNasc.destino,
    cincoNumNasc.motivacao,
    cincoNumNasc.expressao,
  );
  const frequencias = Object.fromEntries(
    Object.entries(mapearFrequencias(nomeNascimento))
  ) as Record<string, number>;

  const letrasNomeBatismo = nomeNascimento
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');

  const TRIANGLE_FULL_WIDTH = 430;
  const baseLen = tVida?.linhas[0]?.length ?? 1;
  const triCellSize = Math.min(18, Math.max(5, Math.floor(TRIANGLE_FULL_WIDTH / baseLen) - 1));

  // ── Score v3 (para a CTA final e comparativo) ────────────────────────────
  const storedV3 = normalizeScore((analysis as { score_v3?: number }).score_v3);
  const storedScore = normalizeScore(analysis.score);
  const birthForScore =
    typeof dataNascimentoRaw === 'string' && dataNascimentoRaw.length > 0
      ? dataNascimentoRaw
      : typeof analysis.data_nascimento === 'string'
        ? analysis.data_nascimento.includes('-')
          ? (() => {
              const p = analysis.data_nascimento.split('-');
              return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : analysis.data_nascimento;
            })()
          : analysis.data_nascimento
        : '';

  const isV3 = isAnaliseV3(analysis as any) || isScoreV3();

  const avaliacaoV3 =
    nomeNascimento && birthForScore && isV3
      ? avaliarNome(nomeNascimento, birthForScore, { calcularPotencial: true })
      : null;

  const rawScore = isV3
    ? (avaliacaoV3?.score_v3 ?? storedV3 ?? storedScore)
    : (storedScore ?? (nomeNascimento && birthForScore && cincoNumNasc.expressao != null && cincoNumNasc.destino != null
        ? calcularScoreV1SemOcorrenciasExtras({
            bloqueios,
            licoesCarmicas: licoes.length,
            tendenciasOcultas: tendencias.length,
            debitosCarmicos: debitos,
            compatibilidade: avaliarCompatibilidade(cincoNumNasc.expressao, cincoNumNasc.destino),
          })
        : null));

  const nivelV3: NivelCodigo | null = (avaliacaoV3?.nivel?.codigo as NivelCodigo | undefined) ?? (rawScore != null ? getScoreV3Level(rawScore) : null);
  const potencialV3 = avaliacaoV3?.potencial ?? null;
  const nivelPotencialV3: NivelCodigo | null = isV3 && potencialV3 != null ? getScoreV3Level(potencialV3) : null;
  const debitosFixos = avaliacaoV3?.marcaDaData && avaliacaoV3.marcaDaData.length > 0
    ? avaliacaoV3.marcaDaData
    : debitos.filter(d => d.fixo === true);
  const reflexosTriangulos = avaliacaoV3?.reflexos ?? [];

  type ScoreNivel = 'baixo' | 'aceitavel' | 'excelente' | null;
  const scoreNivel: ScoreNivel =
    rawScore == null ? null
      : (nivelV3 === 'N5' || nivelV3 === 'N4' || rawScore >= 70) ? 'excelente'
        : (nivelV3 === 'N3' || rawScore >= 40) ? 'aceitavel'
          : 'baixo';

  // ── Texto da IA (escudo provisório) ───────────────────────────────────────
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

  const potencialGravado = analysis as {
    potencial_assinatura_calculado?: boolean;
    potencial_assinatura_nota_base?: number;
    potencial_assinatura_max?: number | null;
  };

  const potencialAssinatura =
    potencialGravado.potencial_assinatura_calculado === true
      ? {
          calculado: true,
          notaBase: potencialGravado.potencial_assinatura_nota_base ?? rawScore ?? 0,
          potencialMax: potencialGravado.potencial_assinatura_max ?? null,
        }
      : nomeNascimento && birthForScore && isV3
        ? calcularPotencialAssinaturaPdfGratuito(nomeNascimento, birthForScore)
        : { calculado: false, notaBase: 0, potencialMax: null as number | null };

  const potencialCtaUrl = buildPotencialCtaUrl(nomeNascimento);
  const exibirBlocoPotencial = potencialAssinatura.calculado && potencialAssinatura.notaBase > 0;
  const variantePotencial =
    potencialAssinatura.potencialMax != null &&
    notaEstritamenteMaiorQueBase(potencialAssinatura.potencialMax, potencialAssinatura.notaBase)
      ? ('com_cta' as const)
      : ('sem_cta' as const);

  const tocEntries = buildGratuitoTocEntries({ hasPotencialCta: exibirBlocoPotencial });

  const gratuitoProps: GratuitoLayoutProps = {
    theme: layoutTheme,
    nomeNascimento,
    dataNascimento,
    numeros: cincoNumNasc,
    arquetipo: arquetipoNasc,
    tVida,
    bloqueios,
    debitos,
    licoes,
    tendencias,
    frequencias,
    letras: letrasNomeBatismo,
    triCellSize,
    nota: rawScore,
    potencialMax: potencialAssinatura.potencialMax,
    compatibilidade:
      cincoNumNasc.expressao != null && cincoNumNasc.destino != null
        ? avaliarCompatibilidade(cincoNumNasc.expressao, cincoNumNasc.destino)
        : null,
  };

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

      {!pdfRender?.omitTableOfContents && (
        <PDFTableOfContents
          layoutTheme={layoutTheme}
          entries={tocEntries}
          subtitle={`${nomeParaExibir} — Sumário`}
          pageNumbers={pdfRender?.tocPageNumbers}
        />
      )}

      <PDFResumoGratuito {...gratuitoProps} />
      <PDFComoLerGratuito theme={layoutTheme} nomeNascimento={nomeNascimento} />
      <PDFParte1Gratuito {...gratuitoProps} />
      <PDFMapaMostrouGratuito {...gratuitoProps} />

      {exibirBlocoPotencial ? (
        <PDFPotencialMaximoCtaPage
          notaBase={potencialAssinatura.notaBase}
          potencialMax={potencialAssinatura.potencialMax ?? potencialAssinatura.notaBase}
          variant={variantePotencial}
          ctaUrl={potencialCtaUrl}
          qrDataUrl={variantePotencial === 'com_cta' ? potencialCtaQrDataUrl : undefined}
        />
      ) : null}
    </Document>
  );
}
