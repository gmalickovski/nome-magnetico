/**
 * NomeSocialPDF — documento PDF da análise paga de Nome Social (DEV-327 / DEV-322).
 *
 * Ordem:
 *   1. Capa
 *   2. Sumário
 *   3. Resumo de 1 página (PDFResumoNomeSocial)
 *   4. Como ler este relatório (PDFComoLerNomeSocial)
 *   5. Opções avaliadas (quando há candidatos do chat)
 *   6. Parte 1 · Você hoje (Essência atual)
 *   7. Parte 2 · O que muda para você (PDFParte2OQueMuda)
 *   8. Parte 3 · Seu nome novo (PDFParte3NomeNovo + Conclusão opcional)
 *   9. Parte 4 · Como usar (Guia + Como chegamos às sugestões + Folha de treino)
 *  10. Anexos (Pessoal, Social, Destino lado a lado + Ciclos do nome + Consulta rápida dos arcanos)
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { THEMES } from './shared/PDFTheme';
import { computeContextualRadarAxes } from '../../../shared/interactive-engine/motor-radar';
import { resolveRadarContext, readContextualRadarSnapshot } from '../../../shared/interactive-engine/radar-context';
import { PDFCover } from './shared/PDFCover';
import { PDFComoLerNomeSocial } from './shared/PDFComoLerNomeSocial';
import { PDFPageHeader } from './shared/PDFPageHeader';
import { PDFFooter } from './shared/PDFFooter';
import { RenderMarkdownChunks } from './shared/PDFMarkdownRenderer';
import { ArquetipoLayout, DebitosLayout, LicoesLayout, TendenciasLayout } from './layout/KarmaLayoutBlocks';
import { PDFTriangleDetailsBlock } from './shared/PDFTriangleDetailsBlock';
import { type DoubleStarNumbers } from './shared/PDFDoubleStar';
import { LOGO_FONT, TITLE_FONT, BODY_FONT, BODY_FONT_BOLD, loadLogoSrc, formatDate } from './shared/PDFFonts';
import { normalizeBirthDateForNumerology } from './shared/pdfBirthDate';
import { PDFTableOfContents } from './shared/PDFTableOfContents';
import { buildPaidTocEntries } from './shared/pdfTocCatalog.ts';
import { PDFSectionAnchor } from './shared/PDFSectionAnchor';
import { PDFComoChegamosSugestoes } from './shared/PDFComoChegamosSugestoes';
import { analisarNomeSocial } from '../../../backend/numerology/products/nome-social';
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
} from '../../../backend/numerology/interpretations';
import { isScoreV3 } from '../../../backend/numerology/score-version';
import { avaliarNome, calcularScoreV1SemOcorrenciasExtras } from '../../../backend/numerology/score';
import { avaliarCompatibilidade } from '../../../backend/numerology/harmonization';
import { isAnaliseV3 } from '../../../shared/score-v3';
import {
  COR_FIXA,
  LAYOUT_THEME_PADRAO,
  faixaNotaPapel,
  rotuloCompatibilidade,
} from './layout/pdfLayoutTheme';
import { Card, Chip, H1, H2, H3, H4, Nota, P, SeloParte } from './layout/PDFLayoutBlocks';
import {
  PDFAnexoCiclosDoNome,
  PDFAnexoTrianguloDimensao,
  PDFParte2OQueMuda,
  PDFParte3NomeNovo,
  PDFResumoNomeSocial,
} from './layout/NomeSocialLayoutSections';

const theme = THEMES.nome_social;
const layoutTheme = LAYOUT_THEME_PADRAO;

const styles = StyleSheet.create({
  page: {
    backgroundColor: layoutTheme.paginaFundo,
    paddingTop: 48,
    paddingBottom: 68,
    paddingHorizontal: 46,
    fontFamily: BODY_FONT,
    color: layoutTheme.tintaSuave,
  },
  assinaturaPage: {
    backgroundColor: layoutTheme.paginaFundo,
    paddingTop: 48,
    paddingBottom: 68,
    paddingHorizontal: 46,
    fontFamily: BODY_FONT,
    color: layoutTheme.tintaSuave,
  },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontFamily: TITLE_FONT,
    fontSize: 13,
    color: layoutTheme.tinta,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subSectionTitle: {
    fontFamily: BODY_FONT_BOLD,
    fontSize: 9,
    color: layoutTheme.destaqueTexto,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  subHeading: {
    fontFamily: BODY_FONT_BOLD,
    fontSize: 10,
    color: layoutTheme.tinta,
    marginBottom: 4,
  },
  hugeTitle: {
    fontFamily: TITLE_FONT,
    fontSize: 20,
    color: layoutTheme.destaqueTexto,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  bodyText: {
    fontFamily: BODY_FONT,
    fontSize: 9.5,
    color: layoutTheme.tintaSuave,
    lineHeight: 1.55,
    marginBottom: 6,
  },
  cardBodyText: {
    fontFamily: BODY_FONT,
    fontSize: 9,
    color: layoutTheme.tintaSuave,
    lineHeight: 1.5,
  },
  assinaturaLinha: {
    height: 0.8,
    backgroundColor: '#E2DCCD',
    marginBottom: 26,
  },
});

/** Extrai estritamente o bloco de Conclusão Final do texto */
function extractConclusao(text: string): string | null {
  const match = text.match(/##[^\n]*(?:\d+\.\s*conclus|\d+\.\s*o nome como|conclus[aã]o)/i);
  if (!match || match.index === undefined) return null;
  return text.slice(match.index).trim();
}

function extractSelectedSocialName(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(/^#\s*Relatorio do Nome Social:\s*(.+)$/im);
  return match?.[1]?.trim() || null;
}

export function NomeSocialPDF({ analysis, pdfRender }: ProductPDFProps) {
  const logoSrc = loadLogoSrc();
  const freqData = analysis.frequencias_numeros as any;
  const selectedNomeSocial =
    freqData?.selectedNomeSocial ??
    extractSelectedSocialName(analysis.analise_texto);
  const nomeParaExibir = selectedNomeSocial ?? freqData?.ranking?.melhorNome?.nomeCompleto ?? analysis.nome_completo;
  const nomeNascimento = freqData?.ranking?.nomeNascimento ?? analysis.nome_completo;
  const dataNascimento = formatDate(
    freqData?.ranking?.dataNascimento ?? analysis.data_nascimento,
  );
  const dataGeracao = formatDate(analysis.completed_at ?? analysis.created_at);

  const letrasNome = nomeParaExibir
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');

  const letrasNomeBatismo = nomeNascimento
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');

  const rankingSomenteChat = freqData?.rankingSomenteChat === true;
  const nomesCandidatosRaw: any[] = freqData?.ranking?.nomesCandidatos ?? [];
  const melhorNomeMotor: string | undefined = rankingSomenteChat
    ? undefined
    : (freqData?.ranking?.melhorNome?.nomeCompleto ?? undefined);

  const dataNascimentoRaw = normalizeBirthDateForNumerology(
    freqData?.ranking?.dataNascimento ?? analysis.data_nascimento ?? '',
  );

  const isV3 = isAnaliseV3(analysis as any) || isScoreV3();

  const nomesCandidatos = nomesCandidatosRaw.map((c) => {
    const base = analisarNomeSocial(
      String(c.nomeCompleto ?? ''),
      dataNascimentoRaw,
      c.origemSugerida === 'ia' ? 'ia' : 'usuario',
    );
    const candidateScore = isV3 ? avaliarNome(String(c.nomeCompleto ?? base.nomeCompleto), dataNascimentoRaw).score_v3 : base.score;
    return {
      ...base,
      score: candidateScore,
      nomeCompleto: String(c.nomeCompleto ?? base.nomeCompleto),
      origemSugerida: c.origemSugerida ?? base.origemSugerida,
      origem: c.origem,
    };
  });

  const cincoNumNasc = calcularCincoNumeros(nomeNascimento, dataNascimentoRaw);
  const triangulosNasc = calcularTodosTriangulos(nomeNascimento, dataNascimentoRaw);
  const bloqueiosNasc = detectarBloqueios(triangulosNasc);
  const tVidaNasc = triangulosNasc.vida;
  const tPessoalNasc = triangulosNasc.pessoal;
  const tSocialNasc = triangulosNasc.social;
  const tDestinoNasc = triangulosNasc.destino;

  const licoesNasc = detectarLicoesCarmicas(nomeNascimento);
  const tendenciasNasc = detectarTendenciasOcultas(nomeNascimento);
  const debitosNasc = calcularDebitosCarmicos(
    dataNascimentoRaw,
    cincoNumNasc.destino,
    cincoNumNasc.motivacao,
    cincoNumNasc.expressao,
  );
  const frequenciasNasc = Object.fromEntries(
    Object.entries(mapearFrequencias(nomeNascimento)),
  ) as Record<string, number>;

  const nascBaseLen = Math.max(
    tVidaNasc?.linhas[0]?.length ?? 1,
    tPessoalNasc?.linhas[0]?.length ?? 1,
    tSocialNasc?.linhas[0]?.length ?? 1,
    tDestinoNasc?.linhas[0]?.length ?? 1,
  );
  const triCellSizeNasc = Math.min(18, Math.max(5, Math.floor(430 / nascBaseLen) - 1));

  const compatNasc = avaliarCompatibilidade(cincoNumNasc.expressao ?? 1, cincoNumNasc.destino ?? 1);
  const scoreNasc = isV3
    ? avaliarNome(nomeNascimento, dataNascimentoRaw).score_v3
    : calcularScoreV1SemOcorrenciasExtras({
        bloqueios: bloqueiosNasc,
        licoesCarmicas: licoesNasc.length,
        tendenciasOcultas: tendenciasNasc.length,
        debitosCarmicos: debitosNasc,
        compatibilidade: compatNasc,
      });

  const cincoNumSocial = nomeParaExibir !== nomeNascimento
    ? calcularCincoNumeros(nomeParaExibir, dataNascimentoRaw)
    : cincoNumNasc;

  const nascStarNumbers: DoubleStarNumbers = {
    destino: cincoNumNasc.destino ?? null,
    expressao: cincoNumNasc.expressao ?? null,
    motivacao: cincoNumNasc.motivacao ?? null,
    missao: cincoNumNasc.missao ?? null,
    impressao: cincoNumNasc.impressao ?? null,
  };

  const socialStarNumbers: DoubleStarNumbers = {
    destino: cincoNumNasc.destino ?? null,
    expressao: cincoNumSocial.expressao ?? null,
    motivacao: cincoNumSocial.motivacao ?? null,
    missao: cincoNumSocial.missao ?? null,
    impressao: cincoNumSocial.impressao ?? null,
  };

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

  const compatSocial = avaliarCompatibilidade(cincoNumSocial.expressao ?? 1, cincoNumSocial.destino ?? 1);
  const scoreSocial = isV3
    ? avaliarNome(nomeParaExibir, dataNascimentoRaw).score_v3
    : (isDifferentName
        ? calcularScoreV1SemOcorrenciasExtras({
            bloqueios: bloqueiosSocial,
            licoesCarmicas: licoesSocial.length,
            tendenciasOcultas: tendenciasSocial.length,
            debitosCarmicos: debitosSocial,
            compatibilidade: compatSocial,
          })
        : scoreNasc);

  const licoesEliminadas = licoesNasc.filter((l) => !licoesSocial.some((ls) => ls.numero === l.numero));
  const licoesNovas = licoesSocial.filter((l) => !licoesNasc.some((ln) => ln.numero === l.numero));
  const tendenciasEliminadas = tendenciasNasc.filter((t) => !tendenciasSocial.some((ts) => ts.numero === t.numero));
  const tendenciasNovas = tendenciasSocial.filter((t) => !tendenciasNasc.some((tn) => tn.numero === t.numero));
  const debitosAliviados = debitosNasc.filter((d) => !d.fixo && !debitosSocial.some((ds) => ds.numero === d.numero));
  const debitosFixos = debitosNasc.filter((d) => d.fixo);

  const bloqueiosEliminados = bloqueiosNasc.filter((b) => !bloqueiosSocial.some((bs) => bs.codigo === b.codigo));
  const bloqueiosRestantes = bloqueiosSocial;

  const analiseFormatado = analysis.analise_texto
    ? formatAnalysisText(analysis.analise_texto)
    : null;
  const conclusaoTexto = analiseFormatado ? extractConclusao(analiseFormatado) : null;
  const hasConclusao = Boolean(conclusaoTexto && conclusaoTexto.length > 50);

  const arquetipoNasc = getArquetipo(cincoNumNasc.expressao ?? 1);
  const arquetipoSocial = getArquetipo(cincoNumSocial.expressao ?? 1);
  const arquetipoHarmonizadoNota =
    arquetipoSocial.numero === arquetipoNasc.numero
      ? `O arquétipo permanece o mesmo do nome de nascimento (${arquetipoSocial.nome}). A mudança organiza o Triângulo da Vida mantendo essa mesma força narrativa.`
      : `Na transição para o Nome Social, sua Expressão evoluiu de ${arquetipoNasc.nome} (Nascimento · Expressão ${cincoNumNasc.expressao}) para ${arquetipoSocial.nome} (Expressão ${cincoNumSocial.expressao}).`;

  const allArcanoNums = new Set<number>();
  const addArcanoNum = (n: number | null | undefined) => {
    if (n == null || n <= 0) return;
    allArcanoNums.add(n);
  };
  [tVidaNasc, tPessoalNasc, tSocialNasc, tDestinoNasc].forEach((t) => {
    if (!t) return;
    addArcanoNum(t.arcanoRegente);
    t.arcanosDePassagem?.forEach(addArcanoNum);
    addArcanoNum(t.arcanoAtual?.numero);
  });
  if (isDifferentName) {
    [triangulosSocial.vida, triangulosSocial.pessoal, triangulosSocial.social, triangulosSocial.destino].forEach((t) => {
      if (!t) return;
      addArcanoNum(t.arcanoRegente);
      t.arcanosDePassagem?.forEach(addArcanoNum);
      addArcanoNum(t.arcanoAtual?.numero);
    });
  }
  const sortedArcanos = Array.from(allArcanoNums).sort((a, b) => a - b);

  const radarContext = resolveRadarContext(freqData);
  const radarSnapshot = readContextualRadarSnapshot(freqData, nomeNascimento, nomeParaExibir);
  const radarBirth = radarSnapshot?.birth ?? computeContextualRadarAxes(nomeNascimento, dataNascimentoRaw, radarContext);
  const radarSelected = radarSnapshot?.selected ?? computeContextualRadarAxes(nomeParaExibir, dataNascimentoRaw, radarContext);
  const paidToc = buildPaidTocEntries(nomesCandidatos.length > 0, { hasConclusion: hasConclusao });

  const sharedLayoutProps = {
    nomeNascimento,
    nomeParaExibir,
    isDifferentName,
    cincoNumNasc,
    cincoNumSocial,
    scoreNasc,
    scoreSocial,
    compatNasc,
    compatSocial,
    triangulosNasc,
    triangulosSocial,
    bloqueiosNasc,
    bloqueiosSocial,
    bloqueiosEliminados,
    bloqueiosRestantes,
    debitosNasc,
    debitosSocial,
    debitosAliviados,
    debitosFixos,
    licoesNasc,
    licoesSocial,
    licoesEliminadas,
    licoesNovas,
    tendenciasNasc,
    tendenciasSocial,
    tendenciasEliminadas,
    tendenciasNovas,
    arquetipoNasc,
    arquetipoSocial,
    arquetipoHarmonizadoNota,
    nascStarNumbers,
    socialStarNumbers,
    radarBirth,
    radarSelected,
    radarContext,
    letrasNomeBatismo,
    letrasNome,
    theme: layoutTheme,
  };

  return (
    <Document title={`Nome Magnetico — ${nomeParaExibir}`} author="Nome Magnetico">
      {/* 1. CAPA */}
      <PDFCover
        theme={theme}
        nomeParaExibir={nomeParaExibir}
        dataNascimento={dataNascimento}
        dataGeracao={dataGeracao}
        logoSrc={logoSrc}
        logoFont={LOGO_FONT}
        titleFont={TITLE_FONT}
      />

      {/* 2. SUMÁRIO */}
      {!pdfRender?.omitTableOfContents && (
        <PDFTableOfContents
          layoutTheme={layoutTheme}
          entries={paidToc}
          subtitle={`${nomeParaExibir} — Sumário`}
          pageNumbers={pdfRender?.tocPageNumbers}
        />
      )}

      {/* 3. RESUMO DE 1 PÁGINA */}
      <PDFResumoNomeSocial {...sharedLayoutProps} />

      {/* 4. COMO LER */}
      <PDFComoLerNomeSocial theme={theme} entityName={nomeParaExibir} layoutTheme={layoutTheme} />

      {/* 5. OPÇÕES AVALIADAS */}
      {nomesCandidatos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PDFSectionAnchor id="pdf-ranking" bookmark={{ title: 'Opções avaliadas', fit: true }} />
          <PDFPageHeader subtitle={`${nomeParaExibir} — Opções avaliadas`} />

          <View style={styles.section}>
            <H1 theme={layoutTheme}>Opções avaliadas</H1>
            <P theme={layoutTheme} size={9.5}>
              {rankingSomenteChat
                ? 'Sugestões que você viu neste chat, na mesma ordem. A assinatura em análise neste relatório é a que você selecionou.'
                : 'Nomes calculados para comparação. A assinatura em análise neste relatório é a que você selecionou; outras opções aparecem como referência.'}
            </P>

            <View style={{ gap: 7, marginTop: 6 }}>
              {(rankingSomenteChat ? nomesCandidatos : nomesCandidatos.slice(0, 10)).map((c: any, i: number) => {
                const faixa = faixaNotaPapel(c.score);
                const isAssinaturaSelecionada =
                  c.nomeCompleto.trim().toLowerCase() === nomeParaExibir.trim().toLowerCase();
                const isRecomendadoMotor =
                  Boolean(melhorNomeMotor) &&
                  c.nomeCompleto.trim().toLowerCase() === melhorNomeMotor!.trim().toLowerCase() &&
                  !isAssinaturaSelecionada &&
                  c.score >= 85 &&
                  !c.temBloqueio &&
                  (c as { semSequenciaVida?: boolean }).semSequenciaVida !== false;
                const isIA = c.origemSugerida === 'ia';

                return (
                  <Card key={i} theme={layoutTheme} alt={isAssinaturaSelecionada} style={{ padding: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                        <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 11, color: layoutTheme.tinta }}>{c.nomeCompleto}</Text>
                        {c.origem === 'manual' && (
                          <Chip theme={layoutTheme} fundo={COR_FIXA.arcanoFundo} cor={COR_FIXA.arcanoTexto}>Informado por você</Chip>
                        )}
                        {isAssinaturaSelecionada && (
                          <Chip theme={layoutTheme} fundo={COR_FIXA.melhorouFundo} cor={COR_FIXA.melhorouTexto}>Selecionada</Chip>
                        )}
                        {isRecomendadoMotor && (
                          <Chip theme={layoutTheme} fundo={COR_FIXA.igualFundo} cor={COR_FIXA.igualTexto}>Destaque</Chip>
                        )}
                        {isIA && !isAssinaturaSelecionada && (
                          <Chip theme={layoutTheme} fundo={COR_FIXA.arcanoFundo} cor={COR_FIXA.arcanoTexto}>Sugestão</Chip>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Chip theme={layoutTheme} fundo={faixa.fundo} cor={faixa.texto}>{faixa.rotulo}</Chip>
                        <Text style={{ fontSize: 10.5, fontFamily: BODY_FONT_BOLD, color: faixa.texto }}>{c.score}/100</Text>
                      </View>
                    </View>

                    <View style={{ height: 3.5, backgroundColor: layoutTheme.cardFundoAlt, borderRadius: 2, marginBottom: 5 }}>
                      <View style={{ height: 3.5, borderRadius: 2, width: `${Math.min(100, c.score)}%`, backgroundColor: faixa.traco }} />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                      {c.expressao != null && (
                        <Nota theme={layoutTheme}>Expressão: {c.expressao}</Nota>
                      )}
                      {c.motivacao != null && (
                        <Nota theme={layoutTheme}>Motivação: {c.motivacao}</Nota>
                      )}
                      {c.impressao != null && (
                        <Nota theme={layoutTheme}>Impressão: {c.impressao}</Nota>
                      )}
                      {c.compatibilidade && (
                        <Nota theme={layoutTheme}>Compatibilidade: {rotuloCompatibilidade(c.compatibilidade)}</Nota>
                      )}
                      <Text style={{ fontSize: 8, color: c.temBloqueio ? COR_FIXA.bloqueioTexto : layoutTheme.apagado }}>
                        {c.temBloqueio
                          ? `${c.bloqueios?.length ?? 1} ${(c.bloqueios?.length ?? 1) === 1 ? 'sequência repetida' : 'sequências repetidas'} nos triângulos`
                          : 'Sem bloqueio no Triângulo da Vida'}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>

          <PDFFooter />
        </Page>
      )}

      {/* 6. PARTE 1 · VOCÊ HOJE (A ESSÊNCIA) */}
      <Page size="A4" style={styles.page}>
        <PDFSectionAnchor id="pdf-essencia" bookmark={{ title: 'Parte 1 · Você hoje', fit: true }} />
        <PDFPageHeader subtitle={`${nomeNascimento} — Parte 1 · Você hoje`} />

        <SeloParte theme={layoutTheme}>Parte 1 · Você hoje</SeloParte>
        <View style={{ marginBottom: 12 }}>
          <H1 theme={layoutTheme}>{nomeNascimento}</H1>
          <Nota theme={layoutTheme}>Nome de nascimento · {dataNascimento}</Nota>
        </View>

        <Card theme={layoutTheme} alt style={{ marginBottom: 12 }}>
          <H3 theme={layoutTheme}>O Papel da Frequência Original</H3>
          <P theme={layoutTheme} size={9.5}>
            Seu nome de nascimento registra os talentos brutos, os números originais e os padrões que servem de ponto de partida. O Nome Social não apaga quem você é: ele organiza essa frequência para reduzir bloqueios no dia a dia.
          </P>
        </Card>

        <View wrap={false} style={{ marginBottom: 12 }}>
          <PDFSectionAnchor id="pdf-essencia-destino" bookmark={{ title: 'Destino', fit: true }} />
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
            <Card theme={layoutTheme} fundo={COR_FIXA.arcanoFundo} style={{ width: 150, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 7.5, fontFamily: BODY_FONT_BOLD, color: COR_FIXA.arcanoTexto, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Número de Destino
              </Text>
              <Text style={{ fontFamily: TITLE_FONT, fontSize: 38, color: '#2E1B6B', lineHeight: 1 }}>
                {cincoNumNasc.destino ?? '—'}
              </Text>
              <Text style={{ fontSize: 8, color: COR_FIXA.arcanoTexto, marginTop: 4 }}>A Estrada Imutável</Text>
            </Card>
            <Card theme={layoutTheme} style={{ flex: 1 }}>
              <H4 theme={layoutTheme}>O Que Não Pode Ser Mudado</H4>
              <P theme={layoutTheme} size={9}>
                Calculado a partir da data de nascimento, o Destino é fixo e acompanha qualquer nome. O Nome Social não altera o Destino; ele organiza a Expressão e os triângulos para que o caminho aconteça com menos resistência.
              </P>
            </Card>
          </View>
        </View>

        <View wrap={false} style={{ marginBottom: 12 }}>
          <PDFSectionAnchor id="pdf-essencia-expressao" bookmark={{ title: 'Os Números do Nome', fit: true }} />
          <H2 theme={layoutTheme}>Os Números do Nome</H2>
          <P theme={layoutTheme} size={9}>
            Derivados das letras do nome de nascimento, estes quatro números revelam dons, motivação interna, primeira impressão e vocação.
          </P>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            {[
              { label: 'Expressão', anchor: 'pdf-essencia-expressao', sublabel: 'O Dom Natural', value: cincoNumNasc.expressao, fundo: COR_FIXA.melhorouFundo, cor: COR_FIXA.melhorouTexto },
              { label: 'Motivação', anchor: 'pdf-essencia-motivacao', sublabel: 'A Alma', value: cincoNumNasc.motivacao, fundo: layoutTheme.cardFundo, cor: layoutTheme.tinta },
              { label: 'Impressão', anchor: 'pdf-essencia-impressao', sublabel: 'A Máscara', value: cincoNumNasc.impressao, fundo: layoutTheme.cardFundo, cor: layoutTheme.tinta },
              { label: 'Missão', anchor: 'pdf-essencia-missao', sublabel: 'A Vocação', value: cincoNumNasc.missao, fundo: COR_FIXA.arcanoFundo, cor: COR_FIXA.arcanoTexto },
            ].map((n, i) => (
              <Card key={n.label} theme={layoutTheme} fundo={n.fundo} style={{ flex: 1, alignItems: 'center', padding: 10 }}>
                {i > 0 ? <PDFSectionAnchor id={n.anchor} bookmark={{ title: n.label, fit: true }} /> : null}
                <Text style={{ fontSize: 7.5, fontFamily: BODY_FONT_BOLD, color: n.cor, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{n.label}</Text>
                <Text style={{ fontFamily: TITLE_FONT, fontSize: 24, color: n.cor, lineHeight: 1 }}>{n.value ?? '?'}</Text>
                <Text style={{ fontSize: 7.5, color: n.cor, textAlign: 'center', marginTop: 4 }}>{n.sublabel}</Text>
              </Card>
            ))}
          </View>
        </View>

        <H2 theme={layoutTheme}>Detalhamento dos 5 Números</H2>
        <View style={{ gap: 6 }}>
          {[
            { num: cincoNumNasc.destino, label: 'Destino — A Estrada da Alma', richDesc: cincoNumNasc.destino ? DESTINO_DESC[cincoNumNasc.destino] : '', fundo: COR_FIXA.arcanoFundo, cor: COR_FIXA.arcanoTexto },
            { num: cincoNumNasc.expressao, label: 'Expressão — O Dom Natural', richDesc: cincoNumNasc.expressao ? EXPRESSAO_DESC[cincoNumNasc.expressao] : '', fundo: COR_FIXA.melhorouFundo, cor: COR_FIXA.melhorouTexto },
            { num: cincoNumNasc.motivacao, label: 'Motivação — A Alma do Nome', richDesc: cincoNumNasc.motivacao ? MOTIVACAO_DESC[cincoNumNasc.motivacao] : '', fundo: layoutTheme.cardFundo, cor: layoutTheme.tinta },
            { num: cincoNumNasc.impressao, label: 'Impressão — A Máscara Social', richDesc: cincoNumNasc.impressao ? IMPRESSAO_DESC[cincoNumNasc.impressao] : '', fundo: layoutTheme.cardFundo, cor: layoutTheme.tinta },
            { num: cincoNumNasc.missao, label: 'Missão — A Vocação de Vida', richDesc: cincoNumNasc.missao ? MISSAO_DESC[cincoNumNasc.missao] : '', fundo: layoutTheme.cardFundoAlt, cor: layoutTheme.destaqueTexto },
          ].map((item, i) => (
            <Card key={i} theme={layoutTheme} fundo={item.fundo} style={{ padding: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text style={{ width: 28, textAlign: 'center', fontFamily: TITLE_FONT, fontSize: 20, color: item.cor, lineHeight: 1 }}>
                  {item.num ?? '?'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: item.cor, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 8.5, color: layoutTheme.tintaSuave, lineHeight: 1.45 }}>
                    {item.richDesc}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <ArquetipoLayout
          theme={layoutTheme}
          arquetipo={arquetipoNasc}
          expressao={cincoNumNasc.expressao ?? 1}
          anchorId="pdf-essencia-arquetipo"
          bookmarkTitle="Arquétipo Vibracional (Nascimento)"
          titulo="O arquétipo do seu nome de nascimento"
        />

        {tVidaNasc && (
          <View break>
            <PDFSectionAnchor id="pdf-essencia-triangulo-vida" bookmark={{ title: 'Triângulo da Vida', fit: true }} />
            <H2 theme={layoutTheme}>O Triângulo da Vida (Nascimento)</H2>
            <P theme={layoutTheme} size={9}>
              Calculado a partir do valor puro de cada letra do nome de nascimento, concentra as sequências repetidas que pesam na nota. Os triângulos Pessoal, Social e do Destino ficam nos Anexos, e os ciclos de trânsito ficam em Ciclos do nome.
            </P>
            <PDFTriangleDetailsBlock
              compact
              layoutTheme={layoutTheme}
              data={tVidaNasc}
              triangulo="vida"
              pyramidLabel="TRIÂNGULO DA VIDA"
              cellSize={triCellSizeNasc}
              letras={letrasNomeBatismo}
              bloqueiosTitle="Bloqueios do Triângulo da Vida"
              arcanosTitle="Arcano Regente do Triângulo da Vida"
              allBloqueios={bloqueiosNasc}
            />
          </View>
        )}

        <View style={{ marginTop: 14 }}>
          <PDFSectionAnchor id="pdf-essencia-karma" bookmark={{ title: 'O Peso do Passado', fit: true }} />
          <H2 theme={layoutTheme}>O Peso do Passado: Débitos e Tendências</H2>
          <P theme={layoutTheme} size={9}>
            Além dos bloqueios nos triângulos, o nome de nascimento mostra os Débitos Kármicos, as Lições Kármicas (números ausentes de 1 a 8) e as Tendências Ocultas (repetições em excesso).
          </P>

          <View style={styles.section}>
            <PDFSectionAnchor id="pdf-essencia-debitos" bookmark={{ title: 'Débitos kármicos', fit: true }} />
            <View minPresenceAhead={110}><H3 theme={layoutTheme}>Débitos Kármicos</H3></View>
            <DebitosLayout theme={layoutTheme} debitos={debitosNasc} />
          </View>

          <View style={styles.section}>
            <PDFSectionAnchor id="pdf-essencia-licoes" bookmark={{ title: 'Lições kármicas', fit: true }} />
            <View minPresenceAhead={110}><H3 theme={layoutTheme}>Lições Kármicas</H3></View>
            <LicoesLayout theme={layoutTheme} licoes={licoesNasc} />
          </View>

          <View style={styles.section}>
            <PDFSectionAnchor id="pdf-essencia-tendencias" bookmark={{ title: 'Tendências ocultas', fit: true }} />
            <View minPresenceAhead={110}><H3 theme={layoutTheme}>Tendências Ocultas</H3></View>
            <TendenciasLayout theme={layoutTheme} tendencias={tendenciasNasc} frequencias={frequenciasNasc} />
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* 7. PARTE 2 · O QUE MUDA PARA VOCÊ (2 PÁGINAS) */}
      <PDFParte2OQueMuda {...sharedLayoutProps} />

      {/* 8. PARTE 3 · SEU NOME NOVO (ENXUTO) + CONCLUSÃO OPCIONAL */}
      <PDFParte3NomeNovo {...sharedLayoutProps} />

      {hasConclusao && conclusaoTexto && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — Conclusão`} />
          <PDFSectionAnchor id="pdf-conclusao" bookmark={{ title: 'Conclusão', fit: true }} />

          <SeloParte theme={layoutTheme}>Conclusão</SeloParte>
          <H1 theme={layoutTheme}>O Encerramento do Seu Mapa</H1>

          <View style={styles.section}>
            <RenderMarkdownChunks text={conclusaoTexto} styles={styles} GOLD={layoutTheme.destaqueTexto} />
          </View>

          <PDFFooter />
        </Page>
      )}

      {/* 9. PARTE 4 · COMO USAR */}
      <Page size="A4" style={styles.page}>
        <PDFSectionAnchor id="pdf-guia" bookmark={{ title: 'Parte 4 · Como usar', fit: true }} />
        <PDFPageHeader subtitle={`${nomeParaExibir} — Parte 4 · Como usar`} />

        <SeloParte theme={layoutTheme}>Parte 4 · Como usar</SeloParte>
        <View style={{ marginBottom: 10 }}>
          <H1 theme={layoutTheme}>Guia de uso da assinatura</H1>
          <P theme={layoutTheme} size={9.5}>
            Sem cronograma fixo. Use o nome novo onde fizer sentido para você e observe como se sente.
          </P>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <Card theme={layoutTheme} style={{ flex: 1 }}>
            <H3 theme={layoutTheme}>Onde usar</H3>
            <P theme={layoutTheme} size={8.5}>Redes sociais, e-mail, apresentações e cartões de visita.</P>
          </Card>
          <Card theme={layoutTheme} style={{ flex: 1 }}>
            <H3 theme={layoutTheme}>A assinatura</H3>
            <P theme={layoutTheme} size={8.5}>Traço legível, levemente ascendente, sem riscos cortando as letras.</P>
          </Card>
          <Card theme={layoutTheme} style={{ flex: 1 }}>
            <H3 theme={layoutTheme}>Documentos</H3>
            <P theme={layoutTheme} size={8.5}>Contratos e documentos oficiais seguem o nome civil.</P>
          </Card>
        </View>

        <Card theme={layoutTheme} alt style={{ marginBottom: 12 }}>
          <H4 theme={layoutTheme}>Sugestão (opcional) — primeiros 30 dias</H4>
          <P theme={layoutTheme} size={8.5}>
            Experimente a assinatura aos poucos, no seu ritmo, sem repetição obrigatória. Em órgãos e cartórios, confirme sempre as exigências locais antes de alterar a firma registrada.
          </P>
        </Card>

        <PDFSectionAnchor id="pdf-score" bookmark={{ title: 'Como chegamos às sugestões', fit: true }} />
        <H2 theme={layoutTheme}>Como chegamos às sugestões</H2>
        <PDFComoChegamosSugestoes layoutTheme={layoutTheme} />

        <PDFFooter />
      </Page>

      <Page size="A4" style={styles.assinaturaPage}>
        <PDFSectionAnchor id="pdf-treino" bookmark={{ title: 'Folha de treino de assinatura', fit: true }} />
        <PDFPageHeader subtitle={`${nomeParaExibir} — Folha de treino`} />

        <SeloParte theme={layoutTheme}>Parte 4 · Prática de escrita</SeloParte>
        <H1 theme={layoutTheme}>Folha de treino de assinatura</H1>
        <P theme={layoutTheme} size={9}>
          Use este espaço para praticar a escrita escolhida com movimentos confortáveis, legíveis e sem traços cortantes.
        </P>

        <Card theme={layoutTheme} style={{ marginTop: 8, padding: 18 }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 20, color: layoutTheme.destaqueTexto, textAlign: 'center', marginBottom: 18, letterSpacing: 1 }}>
            {nomeParaExibir}
          </Text>
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={i} style={styles.assinaturaLinha} />
          ))}
        </Card>

        <PDFFooter />
      </Page>

      {/* 10. ANEXOS */}
      {tPessoalNasc && triangulosSocial.pessoal && (
        <PDFAnexoTrianguloDimensao
          dimensao="pessoal"
          ordem={1}
          nomeNascimento={nomeNascimento}
          nomeParaExibir={nomeParaExibir}
          triNasc={tPessoalNasc}
          triSocial={triangulosSocial.pessoal}
          letrasNasc={letrasNomeBatismo}
          letrasSocial={letrasNome}
          theme={layoutTheme}
        />
      )}

      {tSocialNasc && triangulosSocial.social && (
        <PDFAnexoTrianguloDimensao
          dimensao="social"
          ordem={2}
          nomeNascimento={nomeNascimento}
          nomeParaExibir={nomeParaExibir}
          triNasc={tSocialNasc}
          triSocial={triangulosSocial.social}
          letrasNasc={letrasNomeBatismo}
          letrasSocial={letrasNome}
          theme={layoutTheme}
        />
      )}

      {tDestinoNasc && triangulosSocial.destino && (
        <PDFAnexoTrianguloDimensao
          dimensao="destino"
          ordem={3}
          nomeNascimento={nomeNascimento}
          nomeParaExibir={nomeParaExibir}
          triNasc={tDestinoNasc}
          triSocial={triangulosSocial.destino}
          letrasNasc={letrasNomeBatismo}
          letrasSocial={letrasNome}
          theme={layoutTheme}
        />
      )}

      <PDFAnexoCiclosDoNome
        nomeNascimento={nomeNascimento}
        nomeParaExibir={nomeParaExibir}
        isDifferentName={isDifferentName}
        triVidaNasc={tVidaNasc}
        triVidaSocial={triangulosSocial.vida}
        theme={layoutTheme}
      />

      <Page size="A4" style={styles.page}>
        <PDFSectionAnchor id="pdf-arcanos" bookmark={{ title: 'Os Arcanos da Sua Análise', fit: true }} />
        <PDFPageHeader subtitle={`${nomeParaExibir} — Consulta rápida dos arcanos`} />

        <H3 theme={layoutTheme}>Anexos · Consulta rápida</H3>
        <H2 theme={layoutTheme}>Os Arcanos da Sua Análise</H2>
        <P theme={layoutTheme} size={9}>
          Estes são os arcanos que aparecem nos seus triângulos, de ambos os nomes. A descrição completa de cada um fica no glossário online, em nomemagnetico.com.br/glossario.
        </P>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {sortedArcanos.map((n) => {
            const arc = getArcano(n);
            return (
              <View key={n} wrap={false} style={{ width: '50%', paddingRight: 10, marginBottom: 7 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 9, color: COR_FIXA.arcanoTexto }}>
                  Arcano {n} · {arc.nome}
                </Text>
                <Text style={{ fontSize: 8.5, color: layoutTheme.tintaSuave, lineHeight: 1.4 }}>{arc.palavraChave}</Text>
              </View>
            );
          })}
        </View>

        <PDFFooter />
      </Page>
    </Document>
  );
}
