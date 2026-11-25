/**
 * Seções modulares do novo PDF pago do Nome Social (DEV-327 / DEV-322).
 *
 * Implementa:
 *  - PDFResumoNomeSocial (resumo de 1 página após o Sumário)
 *  - PDFParte2OQueMuda (O veredito + Estrela/Teia + Antes e depois + Saiu/Entrou/Continua)
 *  - PDFParte3NomeNovo (só o que mudou + Arquétipo + Triângulo da Vida novo + Arcanos que mudaram)
 *  - PDFAnexoTrianguloDimensao (uma página por dimensão: Pessoal, Social e Destino lado a lado)
 *  - PDFAnexoCiclosDoNome (Ciclos do nome com os arcanos de trânsito, período aproximado)
 *
 * Tudo lê tokens de `pdfLayoutTheme.ts` e usa os blocos de `PDFLayoutBlocks.tsx`.
 */
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ContextualRadarAxis } from '../../../../shared/interactive-engine/motor-radar';
import { resolveRadarContext } from '../../../../shared/interactive-engine/radar-context';
import type { TipoCompatibilidade } from '../../../../backend/numerology/harmonization';
import type { TodosTriangulos, Bloqueio, Triangulo } from '../../../../backend/numerology/triangle';
import type { DebitoCarmicoInfo, LicaoCarmica, TendenciaOculta } from '../../../../backend/numerology/karmic';
import type { Arquetipo } from '../../../../backend/numerology/archetypes';
import { getArcano } from '../../../../backend/numerology/arcanos';
import {
  DESTINO_DESC,
  EXPRESSAO_DESC,
  MOTIVACAO_DESC,
  IMPRESSAO_DESC,
  MISSAO_DESC,
  NUMERO_NOMES,
  NUMERO_PALAVRAS_CHAVE,
} from '../../../../backend/numerology/interpretations';
import { PDFPageHeader } from '../shared/PDFPageHeader';
import { PDFFooter } from '../shared/PDFFooter';
import { PDFSectionAnchor } from '../shared/PDFSectionAnchor';
import { PDFDoubleStar, type DoubleStarNumbers } from '../shared/PDFDoubleStar';
import { PDFMapaVibracional } from '../shared/PDFMapaVibracional';
import { TrianguloPiramideInline } from '../shared/PDFMarkdownRenderer';
import {
  COR_FIXA,
  LAYOUT_THEME_PADRAO,
  faixaNotaPapel,
  rotuloCompatibilidade,
  type PdfLayoutTheme,
} from './pdfLayoutTheme';
import { Card, Chip, H1, H2, H3, H4, Nota, P, SeloParte } from './PDFLayoutBlocks';

export interface CincoNumerosSnapshot {
  destino: number | null;
  expressao: number | null;
  motivacao: number | null;
  impressao: number | null;
  missao: number | null;
}

export interface NomeSocialSharedLayoutProps {
  nomeNascimento: string;
  nomeParaExibir: string;
  isDifferentName: boolean;
  cincoNumNasc: CincoNumerosSnapshot;
  cincoNumSocial: CincoNumerosSnapshot;
  scoreNasc: number;
  scoreSocial: number;
  compatNasc: TipoCompatibilidade;
  compatSocial: TipoCompatibilidade;
  triangulosNasc: TodosTriangulos;
  triangulosSocial: TodosTriangulos;
  bloqueiosNasc: Bloqueio[];
  bloqueiosSocial: Bloqueio[];
  bloqueiosEliminados: Bloqueio[];
  bloqueiosRestantes: Bloqueio[];
  debitosNasc: DebitoCarmicoInfo[];
  debitosSocial: DebitoCarmicoInfo[];
  debitosAliviados: DebitoCarmicoInfo[];
  debitosFixos: DebitoCarmicoInfo[];
  licoesNasc: LicaoCarmica[];
  licoesSocial: LicaoCarmica[];
  licoesEliminadas: LicaoCarmica[];
  licoesNovas: LicaoCarmica[];
  tendenciasNasc: TendenciaOculta[];
  tendenciasSocial: TendenciaOculta[];
  tendenciasEliminadas: TendenciaOculta[];
  tendenciasNovas: TendenciaOculta[];
  arquetipoNasc: Arquetipo;
  arquetipoSocial: Arquetipo;
  arquetipoHarmonizadoNota: string;
  nascStarNumbers: DoubleStarNumbers;
  socialStarNumbers: DoubleStarNumbers;
  radarBirth: ContextualRadarAxis[];
  radarSelected: ContextualRadarAxis[];
  radarContext: ReturnType<typeof resolveRadarContext>;
  letrasNomeBatismo: string[];
  letrasNome: string[];
  theme?: PdfLayoutTheme;
}

const pageStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 68,
    paddingHorizontal: 46,
  },
});

function firstSentence(text?: string | null): string {
  if (!text) return '';
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.trim();
}

function formatArcanoShort(n: number | null | undefined): string {
  if (n == null) return '—';
  const arc = getArcano(n);
  return `${n} · ${arc.nome}`;
}

function compatRank(c: TipoCompatibilidade): number {
  return c === 'favoravel' ? 2 : c === 'neutro' ? 1 : 0;
}

type SignalKind = 'melhorou' | 'igual' | 'atencao';

interface ComparisonRow {
  item: string;
  antes: string;
  depois: string;
  antesColor?: string;
  depoisColor?: string;
  sinal: SignalKind;
  sentido: string;
}

function buildComparisonRows(props: NomeSocialSharedLayoutProps): ComparisonRow[] {
  const {
    scoreNasc,
    scoreSocial,
    bloqueiosNasc,
    bloqueiosSocial,
    compatNasc,
    compatSocial,
    cincoNumNasc,
    cincoNumSocial,
    triangulosNasc,
    triangulosSocial,
    tendenciasNasc,
    tendenciasSocial,
    debitosNasc,
    debitosSocial,
  } = props;

  const faixaNasc = faixaNotaPapel(scoreNasc);
  const faixaSocial = faixaNotaPapel(scoreSocial);

  const scoreSinal: SignalKind =
    scoreSocial > scoreNasc ? 'melhorou' : scoreSocial < scoreNasc ? 'atencao' : 'igual';
  const scoreSentido =
    scoreSocial > scoreNasc
      ? 'O nome novo combina melhor com a sua data de nascimento.'
      : scoreSocial < scoreNasc
        ? 'A nota caiu em relação ao nome de nascimento.'
        : 'Mesma pontuação geral em relação ao nascimento.';

  const bNasc = bloqueiosNasc.length;
  const bSocial = bloqueiosSocial.length;
  const bloqSinal: SignalKind = bSocial < bNasc ? 'melhorou' : bSocial > bNasc ? 'atencao' : 'igual';
  const bloqSentido =
    bSocial === 0 && bNasc > 0
      ? 'Nenhuma sequência repetida nos 4 triângulos.'
      : bSocial < bNasc
        ? `Reduziu de ${bNasc} para ${bSocial} ${pl(bSocial, 'sequência repetida', 'sequências repetidas')}.`
        : bSocial === 0
          ? 'Segue sem sequências repetidas nos 4 triângulos.'
          : `${bSocial} ${pl(bSocial, 'sequência repetida ainda ativa', 'sequências repetidas ainda ativas')}.`;

  const cRankNasc = compatRank(compatNasc);
  const cRankSocial = compatRank(compatSocial);
  const compatSinal: SignalKind =
    cRankSocial > cRankNasc ? 'melhorou' : cRankSocial < cRankNasc ? 'atencao' : 'igual';
  const compatSentido =
    compatSocial === 'favoravel'
      ? 'Expressão e Destino conversam em harmonia.'
      : compatSocial === 'neutro'
        ? 'Relação neutra entre Expressão e Destino.'
        : 'Expressão e Destino em Tensão Vibracional.';

  const expChanged = cincoNumNasc.expressao !== cincoNumSocial.expressao;
  const expSinal: SignalKind = expChanged
    ? cRankSocial >= cRankNasc
      ? 'melhorou'
      : 'atencao'
    : 'igual';
  const expKw = cincoNumSocial.expressao ? NUMERO_PALAVRAS_CHAVE[cincoNumSocial.expressao] : '';

  const motKw = cincoNumSocial.motivacao ? NUMERO_PALAVRAS_CHAVE[cincoNumSocial.motivacao] : '';
  const impKw = cincoNumSocial.impressao ? NUMERO_PALAVRAS_CHAVE[cincoNumSocial.impressao] : '';

  const arcNasc = triangulosNasc.vida?.arcanoRegente ?? null;
  const arcSocial = triangulosSocial.vida?.arcanoRegente ?? null;
  const arcChanged = arcNasc !== arcSocial;
  const arcSocialObj = arcSocial != null ? getArcano(arcSocial) : null;

  const tNasc = tendenciasNasc.length;
  const tSocial = tendenciasSocial.length;
  const tendSinal: SignalKind = tSocial < tNasc ? 'melhorou' : tSocial > tNasc ? 'atencao' : 'igual';
  const tendSentido =
    tSocial < tNasc
      ? `Reduziu de ${tNasc} para ${tSocial} ${pl(tSocial, 'excesso de repetição', 'excessos de repetição')}.`
      : tSocial > tNasc
        ? `Subiu para ${tSocial} ${pl(tSocial, 'tendência oculta', 'tendências ocultas')}.`
        : tSocial === 0
          ? 'Sem excessos numéricos no nome.'
          : `Mantém ${tSocial} ${pl(tSocial, 'tendência oculta', 'tendências ocultas')}.`;

  const dNasc = debitosNasc.length;
  const dSocial = debitosSocial.length;
  const debSinal: SignalKind = dSocial < dNasc ? 'melhorou' : dSocial > dNasc ? 'atencao' : 'igual';
  const debSentido =
    dSocial < dNasc
      ? `Aliviou de ${dNasc} para ${dSocial} ${pl(dSocial, 'débito kármico', 'débitos kármicos')}.`
      : dSocial > dNasc
        ? 'Surgiu um débito kármico novo para trabalhar com consciência.'
        : dSocial === 0
          ? 'Sem débitos kármicos ativos.'
          : `Mantém ${dSocial} ${pl(dSocial, 'débito kármico', 'débitos kármicos')}.`;

  return [
    {
      item: 'Nota do nome',
      antes: String(scoreNasc),
      depois: String(scoreSocial),
      antesColor: faixaNasc.texto,
      depoisColor: faixaSocial.texto,
      sinal: scoreSinal,
      sentido: scoreSentido,
    },
    {
      item: 'Bloqueios',
      antes: String(bNasc),
      depois: String(bSocial),
      sinal: bloqSinal,
      sentido: bloqSentido,
    },
    {
      item: 'Compatibilidade',
      antes: rotuloCompatibilidade(compatNasc),
      depois: rotuloCompatibilidade(compatSocial),
      sinal: compatSinal,
      sentido: compatSentido,
    },
    {
      item: 'Expressão',
      antes: String(cincoNumNasc.expressao ?? '—'),
      depois: String(cincoNumSocial.expressao ?? '—'),
      sinal: expSinal,
      sentido: expChanged
        ? `Nova forma de agir: ${expKw.toLowerCase()}.`
        : `Mantém o perfil ${expKw.toLowerCase()}.`,
    },
    {
      item: 'Motivação',
      antes: String(cincoNumNasc.motivacao ?? '—'),
      depois: String(cincoNumSocial.motivacao ?? '—'),
      sinal: 'igual',
      sentido: motKw ? `Impulso interno voltado a ${motKw.toLowerCase()}.` : 'Sem alteração relevante.',
    },
    {
      item: 'Impressão',
      antes: String(cincoNumNasc.impressao ?? '—'),
      depois: String(cincoNumSocial.impressao ?? '—'),
      sinal: 'igual',
      sentido: impKw ? `Primeira impressão ligada a ${impKw.toLowerCase()}.` : 'Sem alteração relevante.',
    },
    {
      item: 'Arcano regente',
      antes: arcNasc != null ? String(arcNasc) : '—',
      depois: arcSocial != null ? String(arcSocial) : '—',
      sinal: 'igual',
      sentido: arcSocialObj
        ? arcChanged
          ? `${arcSocialObj.nome} passa a reger o Triângulo da Vida.`
          : `${arcSocialObj.nome} segue como força central.`
        : 'Sem alteração.',
    },
    {
      item: 'Tendências ocultas',
      antes: String(tNasc),
      depois: String(tSocial),
      sinal: tendSinal,
      sentido: tendSentido,
    },
    {
      item: 'Débitos kármicos',
      antes: String(dNasc),
      depois: String(dSocial),
      sinal: debSinal,
      sentido: debSentido,
    },
  ];
}


/** Plural simples por quantidade (evita "(s)" no texto). */
function pl(n: number, um: string, varios: string): string {
  return n === 1 ? um : varios;
}

// ── 1. RESUMO DE 1 PÁGINA ────────────────────────────────────────────────────

export function PDFResumoNomeSocial(props: NomeSocialSharedLayoutProps) {
  const {
    nomeNascimento,
    nomeParaExibir,
    cincoNumNasc,
    cincoNumSocial,
    scoreNasc,
    scoreSocial,
    compatNasc,
    compatSocial,
    bloqueiosNasc,
    bloqueiosSocial,
    theme = LAYOUT_THEME_PADRAO,
  } = props;

  const faixaNasc = faixaNotaPapel(scoreNasc);
  const faixaSocial = faixaNotaPapel(scoreSocial);
  const bloqueiosVidaNasc = bloqueiosNasc.filter((b) => b.triangulos.includes('vida')).length;
  const bloqueiosVidaSocial = bloqueiosSocial.filter((b) => b.triangulos.includes('vida')).length;

  const numRows: Array<{ nome: string; antes: number | null; depois: number | null; sentido: string }> = [
    {
      nome: 'Expressão',
      antes: cincoNumNasc.expressao,
      depois: cincoNumSocial.expressao,
      sentido: cincoNumSocial.expressao
        ? `${NUMERO_NOMES[cincoNumSocial.expressao] ?? ''} — como você se manifesta no mundo.`
        : '',
    },
    {
      nome: 'Motivação',
      antes: cincoNumNasc.motivacao,
      depois: cincoNumSocial.motivacao,
      sentido: cincoNumSocial.motivacao
        ? `${NUMERO_NOMES[cincoNumSocial.motivacao] ?? ''} — o que move suas escolhas por dentro.`
        : '',
    },
    {
      nome: 'Impressão',
      antes: cincoNumNasc.impressao,
      depois: cincoNumSocial.impressao,
      sentido: cincoNumSocial.impressao
        ? `${NUMERO_NOMES[cincoNumSocial.impressao] ?? ''} — como as pessoas tendem a perceber você.`
        : '',
    },
    {
      nome: 'Missão',
      antes: cincoNumNasc.missao,
      depois: cincoNumSocial.missao,
      sentido: cincoNumSocial.missao
        ? `${NUMERO_NOMES[cincoNumSocial.missao] ?? ''} — direção prática do primeiro nome.`
        : '',
    },
    {
      nome: 'Destino',
      antes: cincoNumNasc.destino,
      depois: cincoNumSocial.destino,
      sentido: 'Igual: vem da data de nascimento.',
    },
  ];

  const frase1 =
    bloqueiosVidaSocial === 0 && bloqueiosVidaNasc > 0
      ? `1. ${pl(bloqueiosVidaNasc, 'A sequência repetida', `As ${bloqueiosVidaNasc} sequências repetidas`)} do Triângulo da Vida não ${pl(bloqueiosVidaNasc, 'aparece', 'aparecem')} no nome novo.`
      : bloqueiosSocial.length < bloqueiosNasc.length
        ? `1. Os bloqueios nos 4 triângulos caem de ${bloqueiosNasc.length} para ${bloqueiosSocial.length}.`
        : bloqueiosSocial.length === 0
          ? '1. Os 4 triângulos seguem livres de sequências repetidas.'
          : `1. O nome mantém ${bloqueiosSocial.length} ${pl(bloqueiosSocial.length, 'sequência repetida', 'sequências repetidas')} nos 4 triângulos.`;

  const frase2 =
    cincoNumNasc.expressao !== cincoNumSocial.expressao
      ? `2. A Expressão passa de ${cincoNumNasc.expressao ?? '—'} para ${cincoNumSocial.expressao ?? '—'} em relação ao seu Destino ${cincoNumNasc.destino ?? '—'} (${rotuloCompatibilidade(compatSocial).toLowerCase()}).`
      : `2. A Expressão segue em ${cincoNumSocial.expressao ?? '—'} diante do seu Destino ${cincoNumNasc.destino ?? '—'} (${rotuloCompatibilidade(compatSocial).toLowerCase()}).`;

  const frase3 = '3. O Destino e os débitos da data de nascimento continuam os mesmos: o nome não muda a data.';

  return (
    <Page size="A4" style={[pageStyles.page, { backgroundColor: theme.paginaFundo, fontFamily: theme.fonteTexto, color: theme.tintaSuave }]}>
      <PDFSectionAnchor id="pdf-resumo" bookmark={{ title: 'Resumo em 1 página', fit: true }} />
      <PDFPageHeader subtitle={`${nomeParaExibir} — Resumo`} />

      <View style={{ marginBottom: 12 }}>
        <H3 theme={theme}>Seu relatório em 1 página</H3>
        <H1 theme={theme}>{nomeParaExibir}</H1>
        <P theme={theme} size={9.5}>
          O nome escolhido para assinar no dia a dia, comparado ao seu nome de nascimento, {nomeNascimento}.
        </P>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <Card theme={theme} style={{ flex: 1 }}>
          <Nota theme={theme}>NOTA DO NOME</Nota>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, marginBottom: 2 }}>
            <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 21, color: faixaNasc.texto }}>{scoreNasc}</Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 10, color: theme.apagado, marginHorizontal: 5 }}>para</Text>
            <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 21, color: faixaSocial.texto }}>{scoreSocial}</Text>
          </View>
          <Nota theme={theme}>{faixaNasc.rotulo} para {faixaSocial.rotulo}</Nota>
        </Card>

        <Card theme={theme} style={{ flex: 1 }}>
          <Nota theme={theme}>BLOQUEIOS</Nota>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, marginBottom: 2 }}>
            <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 21, color: bloqueiosNasc.length > 0 ? COR_FIXA.bloqueioTexto : theme.tinta }}>{bloqueiosNasc.length}</Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 10, color: theme.apagado, marginHorizontal: 5 }}>para</Text>
            <Text
              style={{
                fontFamily: theme.fonteTitulo,
                fontSize: 21,
                color: bloqueiosSocial.length > 0 ? COR_FIXA.bloqueioTexto : theme.tinta,
              }}
            >
              {bloqueiosSocial.length}
            </Text>
          </View>
          <Nota theme={theme}>nos 4 triângulos</Nota>
        </Card>

        <Card theme={theme} fundo={COR_FIXA.arcanoFundo} style={{ flex: 1 }}>
          <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.arcanoTexto, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            COMPATIBILIDADE
          </Text>
          <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 11, color: COR_FIXA.arcanoTexto, marginTop: 5, marginBottom: 3, lineHeight: 1.25 }}>
            {rotuloCompatibilidade(compatSocial)}
          </Text>
          <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.arcanoTexto }}>
            antes: {rotuloCompatibilidade(compatNasc)}
          </Text>
        </Card>
      </View>

      <View style={{ marginBottom: 12 }}>
        <H2 theme={theme}>Os 5 números, antes e depois</H2>
        <View style={{ gap: 5 }}>
          {numRows.map((n) => {
            const changed = n.antes !== n.depois;
            return (
              <Card key={n.nome} theme={theme} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 88 }}>
                    <H4 theme={theme}>{n.nome}</H4>
                  </View>
                  <Text style={{ width: 28, fontFamily: theme.fonteTitulo, fontSize: 15, color: theme.apagado, textAlign: 'center' }}>
                    {n.antes ?? '—'}
                  </Text>
                  <Text style={{ width: 24, fontFamily: theme.fonteTexto, fontSize: 8.5, color: theme.apagado, textAlign: 'center' }}>para</Text>
                  <Text style={{ width: 28, fontFamily: theme.fonteTitulo, fontSize: 15, color: changed ? theme.destaqueTexto : theme.tinta, textAlign: 'center' }}>
                    {n.depois ?? '—'}
                  </Text>
                  <Text style={{ flex: 1, fontFamily: theme.fonteTexto, fontSize: 8.5, color: theme.tintaSuave, marginLeft: 8, lineHeight: 1.4 }}>
                    {n.sentido}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        <H2 theme={theme}>O que isso quer dizer</H2>
        <View style={{ gap: 5 }}>
          <P theme={theme} size={9.5}>{frase1}</P>
          <P theme={theme} size={9.5}>{frase2}</P>
          <P theme={theme} size={9.5}>{frase3}</P>
        </View>
      </View>

      <Card theme={theme} alt style={{ marginTop: 'auto' }}>
        <H4 theme={theme}>Por onde seguir</H4>
        <P theme={theme} size={8.5}>
          A Parte 1 detalha o nome de nascimento. A Parte 2 mostra o que muda, item por item. A Parte 3 apresenta o seu nome novo, e o guia de uso fica na Parte 4.
        </P>
      </Card>

      <PDFFooter />
    </Page>
  );
}

// ── 2. PARTE 2: O QUE MUDA PARA VOCÊ ─────────────────────────────────────────

export function PDFParte2OQueMuda(props: NomeSocialSharedLayoutProps) {
  const {
    nomeParaExibir,
    cincoNumNasc,
    scoreNasc,
    scoreSocial,
    debitosFixos,
    nascStarNumbers,
    socialStarNumbers,
    radarBirth,
    radarSelected,
    radarContext,
    bloqueiosEliminados,
    bloqueiosRestantes,
    licoesEliminadas,
    licoesNovas,
    licoesSocial,
    tendenciasEliminadas,
    tendenciasNovas,
    tendenciasSocial,
    debitosAliviados,
    debitosNasc,
    debitosSocial,
    theme = LAYOUT_THEME_PADRAO,
  } = props;

  const rows = buildComparisonRows(props);
  const improvedRows = rows.filter((r) => r.sinal === 'melhorou');
  const equalRows = rows.filter((r) => r.sinal === 'igual');
  const attentionRows = rows.filter((r) => r.sinal === 'atencao');

  const faixaNasc = faixaNotaPapel(scoreNasc);
  const faixaSocial = faixaNotaPapel(scoreSocial);

  const bloqNovos = props.bloqueiosSocial.filter(
    (bs) => !props.bloqueiosNasc.some((bn) => bn.codigo === bs.codigo),
  );
  const debitosNovos = debitosSocial.filter(
    (ds) => !debitosNasc.some((dn) => dn.numero === ds.numero),
  );

  const saiuItens: string[] = [
    ...(bloqueiosEliminados.length > 0
      ? [`Bloqueios removidos: ${bloqueiosEliminados.map((b) => b.codigo).join(', ')}.`]
      : []),
    ...(tendenciasEliminadas.length > 0
      ? [`Tendências ocultas removidas: ${tendenciasEliminadas.map((t) => t.numero).join(', ')}.`]
      : []),
    ...(licoesEliminadas.length > 0
      ? [`Lições kármicas preenchidas: ${licoesEliminadas.map((l) => l.numero).join(', ')}.`]
      : []),
    ...(debitosAliviados.length > 0
      ? [`Débitos aliviados: ${debitosAliviados.map((d) => d.numero).join(', ')}.`]
      : []),
  ];

  const entrouItens: string[] = [
    ...(bloqNovos.length > 0
      ? [`Bloqueios novos: ${bloqNovos.map((b) => b.codigo).join(', ')}.`]
      : []),
    ...(debitosNovos.length > 0
      ? [`Débito kármico novo: ${debitosNovos.map((d) => d.numero).join(', ')}.`]
      : []),
    ...(tendenciasNovas.length > 0
      ? [`Tendência oculta nova: ${tendenciasNovas.map((t) => t.numero).join(', ')}.`]
      : []),
    ...(licoesNovas.length > 0
      ? [`Lição kármica nova: ${licoesNovas.map((l) => l.numero).join(', ')}.`]
      : []),
  ];

  const continuaItens: string[] = [
    ...(debitosFixos.length > 0
      ? [`${pl(debitosFixos.length, 'Débito da data', 'Débitos da data')}: ${debitosFixos.map((d) => d.numero).join(', ')} (${pl(debitosFixos.length, 'imutável', 'imutáveis')}).`]
      : []),
    ...(licoesSocial.length > 0
      ? [`Lições que seguem: ${licoesSocial.map((l) => l.numero).join(', ')}.`]
      : []),
    ...(tendenciasSocial.length > 0
      ? [`Tendências que seguem: ${tendenciasSocial.map((t) => t.numero).join(', ')}.`]
      : []),
    ...(bloqueiosRestantes.length > 0
      ? [`Bloqueios ainda presentes: ${bloqueiosRestantes.map((b) => b.codigo).join(', ')}.`]
      : []),
  ];

  return (
    <>
      {/* Página A: O Veredito + Estrela Comparativa + Mapa Vibracional + O que o nome não muda */}
      <Page size="A4" style={[pageStyles.page, { backgroundColor: theme.paginaFundo, fontFamily: theme.fonteTexto, color: theme.tintaSuave }]}>
        <PDFSectionAnchor id="pdf-harmonizacao" bookmark={{ title: 'Parte 2 · O que muda para você', fit: true }} />
        <PDFPageHeader subtitle={`${nomeParaExibir} — Parte 2`} />

        <SeloParte theme={theme}>Parte 2 · O que muda para você</SeloParte>
        <View style={{ marginBottom: 10 }}>
          <H1 theme={theme}>O veredito</H1>
          <P theme={theme} size={9.5}>
            Em uma página: o que melhora, o que continua igual e o que pede atenção quando você passa a assinar {nomeParaExibir}.
          </P>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <Card theme={theme} fundo={COR_FIXA.melhorouFundo} style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.melhorouTexto, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 3 }}>
              Melhorou · {improvedRows.length}
            </Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: COR_FIXA.melhorouTexto, lineHeight: 1.4 }}>
              {improvedRows.length > 0
                ? improvedRows.map((r) => r.item).join(', ') + '.'
                : 'Nenhuma mudança para cima nos itens comparados.'}
            </Text>
          </Card>

          <Card theme={theme} fundo={COR_FIXA.igualFundo} style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.igualTexto, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 3 }}>
              Igual · {equalRows.length}
            </Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: COR_FIXA.igualTexto, lineHeight: 1.4 }}>
              {equalRows.length > 0
                ? equalRows.map((r) => r.item).join(', ') + '.'
                : 'Todos os itens tiveram alteração.'}
            </Text>
          </Card>

          <Card theme={theme} fundo={COR_FIXA.bloqueioFundo} style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.bloqueioTexto, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 3 }}>
              Pede atenção · {attentionRows.length}
            </Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: COR_FIXA.bloqueioTexto, lineHeight: 1.4 }}>
              {attentionRows.length > 0
                ? attentionRows.map((r) => r.item).join(', ') + '.'
                : 'Nenhum ponto novo de atenção identificado.'}
            </Text>
          </Card>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'stretch' }}>
          <Card theme={theme} style={{ flex: 1, alignItems: 'center' }}>
            <PDFSectionAnchor id="pdf-harmonizacao-estrela" bookmark={{ title: 'Estrela comparativa', fit: true }} />
            <View style={{ alignSelf: 'flex-start', marginBottom: 4 }}>
              <H3 theme={theme}>Estrela comparativa</H3>
            </View>
            <PDFDoubleStar
              nascimento={nascStarNumbers}
              harmonizado={socialStarNumbers}
              scoreNascimento={scoreNasc}
              scoreHarmonizado={scoreSocial}
              svgWidth={205}
              compact
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 6 }}>
              <Nota theme={theme}>Nascimento: {scoreNasc} ({faixaNasc.rotulo})</Nota>
              <Nota theme={theme}>Novo: {scoreSocial} ({faixaSocial.rotulo})</Nota>
            </View>
          </Card>

          <Card theme={theme} style={{ flex: 1, alignItems: 'center' }}>
            <PDFSectionAnchor id="pdf-harmonizacao-mapa" bookmark={{ title: 'Mapa Vibracional', fit: true }} />
            <View style={{ alignSelf: 'flex-start', marginBottom: 4 }}>
              <H3 theme={theme}>Mapa Vibracional</H3>
            </View>
            <PDFMapaVibracional
              birth={radarBirth}
              selected={radarSelected}
              birthScore={scoreNasc}
              selectedScore={scoreSocial}
              hasContext={radarContext.hasContext}
              areaFoco={radarContext.areaFoco}
              usos={radarContext.ondeAssinaRaw}
              compactWebOnly
            />
          </Card>
        </View>

        <Card theme={theme} alt style={{ marginTop: 'auto' }}>
          <H4 theme={theme}>O que o nome não muda</H4>
          <P theme={theme} size={8.5}>
            O Destino ({cincoNumNasc.destino ?? '—'})
            {debitosFixos.length > 0
              ? ` e ${pl(debitosFixos.length, 'o débito kármico', 'os débitos kármicos')} ${debitosFixos.map((d) => d.numero).join(', ')} vêm`
              : ' vem'}{' '}
            da data de nascimento. Eles seguem iguais com qualquer nome e representam aprendizados para a vida toda.
          </P>
        </Card>

        <PDFFooter />
      </Page>

      {/* Página B: Tabela Antes e Depois + Saiu, entrou e continua */}
      <Page size="A4" style={[pageStyles.page, { backgroundColor: theme.paginaFundo, fontFamily: theme.fonteTexto, color: theme.tintaSuave }]}>
        <PDFSectionAnchor id="pdf-harmonizacao-comparativa" bookmark={{ title: 'Antes e depois, item por item', fit: true }} />
        <PDFPageHeader subtitle={`${nomeParaExibir} — Parte 2`} />

        <View style={{ marginBottom: 10 }}>
          <H3 theme={theme}>O que muda para você</H3>
          <H2 theme={theme}>Antes e depois, item por item</H2>
          <P theme={theme} size={9}>
            Uma linha por item. A coluna da direita resume, em uma frase, o que a mudança representa no dia a dia.
          </P>
        </View>

        <PDFSectionAnchor id="pdf-harmonizacao-corpo" bookmark={{ title: 'Tabela comparativa', fit: true }} />
        <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 4, gap: 6 }}>
          <Text style={{ width: 92, fontSize: 7.5, fontFamily: theme.fonteTextoBold, color: theme.apagado, textTransform: 'uppercase', letterSpacing: 0.7 }}>Item</Text>
          <Text style={{ width: 58, fontSize: 7.5, fontFamily: theme.fonteTextoBold, color: theme.apagado, textTransform: 'uppercase', letterSpacing: 0.7 }}>Antes</Text>
          <Text style={{ width: 58, fontSize: 7.5, fontFamily: theme.fonteTextoBold, color: theme.apagado, textTransform: 'uppercase', letterSpacing: 0.7 }}>Depois</Text>
          <Text style={{ width: 72, fontSize: 7.5, fontFamily: theme.fonteTextoBold, color: theme.apagado, textTransform: 'uppercase', letterSpacing: 0.7 }}>Sinal</Text>
          <Text style={{ flex: 1, fontSize: 7.5, fontFamily: theme.fonteTextoBold, color: theme.apagado, textTransform: 'uppercase', letterSpacing: 0.7 }}>O que significa</Text>
        </View>

        <View style={{ gap: 4, marginBottom: 14 }}>
          {rows.map((r) => {
            const chipBg =
              r.sinal === 'melhorou'
                ? COR_FIXA.melhorouFundo
                : r.sinal === 'atencao'
                  ? COR_FIXA.bloqueioFundo
                  : COR_FIXA.igualFundo;
            const chipColor =
              r.sinal === 'melhorou'
                ? COR_FIXA.melhorouTexto
                : r.sinal === 'atencao'
                  ? COR_FIXA.bloqueioTexto
                  : COR_FIXA.igualTexto;
            const chipLabel =
              r.sinal === 'melhorou' ? 'Melhorou' : r.sinal === 'atencao' ? 'Pede atenção' : 'Igual';

            return (
              <Card key={r.item} theme={theme} style={{ paddingVertical: 7, paddingHorizontal: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ width: 92, fontFamily: theme.fonteTextoBold, fontSize: 8.5, color: theme.tinta }}>{r.item}</Text>
                  <Text style={{ width: 58, fontFamily: theme.fonteTexto, fontSize: 8.5, color: r.antesColor ?? theme.apagado }}>{r.antes}</Text>
                  <Text style={{ width: 58, fontFamily: theme.fonteTextoBold, fontSize: 8.5, color: r.depoisColor ?? theme.tinta }}>{r.depois}</Text>
                  <View style={{ width: 72 }}>
                    <Chip theme={theme} fundo={chipBg} cor={chipColor}>{chipLabel}</Chip>
                  </View>
                  <Text style={{ flex: 1, fontFamily: theme.fonteTexto, fontSize: 8, color: theme.tintaSuave, lineHeight: 1.35 }}>{r.sentido}</Text>
                </View>
              </Card>
            );
          })}
        </View>

        <H2 theme={theme}>Saiu, entrou e continua</H2>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <Card theme={theme} fundo={COR_FIXA.melhorouFundo} style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.melhorouTexto, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 4 }}>
              Saiu
            </Text>
            {saiuItens.length > 0 ? (
              saiuItens.map((s, idx) => (
                <Text key={idx} style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.melhorouTexto, lineHeight: 1.4, marginBottom: 2 }}>
                  {s}
                </Text>
              ))
            ) : (
              <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.melhorouTexto, lineHeight: 1.4 }}>
                Nenhuma remoção entre o nascimento e o nome novo.
              </Text>
            )}
          </Card>

          <Card theme={theme} fundo={COR_FIXA.bloqueioFundo} style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.bloqueioTexto, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 4 }}>
              Entrou
            </Text>
            {entrouItens.length > 0 ? (
              entrouItens.map((s, idx) => (
                <Text key={idx} style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.bloqueioTexto, lineHeight: 1.4, marginBottom: 2 }}>
                  {s}
                </Text>
              ))
            ) : (
              <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.bloqueioTexto, lineHeight: 1.4 }}>
                Nenhum ponto novo de atenção.
              </Text>
            )}
          </Card>

          <Card theme={theme} fundo={COR_FIXA.igualFundo} style={{ flex: 1 }}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.igualTexto, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 4 }}>
              Continua
            </Text>
            {continuaItens.length > 0 ? (
              continuaItens.map((s, idx) => (
                <Text key={idx} style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.igualTexto, lineHeight: 1.4, marginBottom: 2 }}>
                  {s}
                </Text>
              ))
            ) : (
              <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.igualTexto, lineHeight: 1.4 }}>
                Destino e base da data seguem iguais.
              </Text>
            )}
          </Card>
        </View>

        <Nota theme={theme}>
          O texto completo de cada item está na Parte 1, uma vez só. Aqui fica apenas o que mudou.
        </Nota>

        <PDFFooter />
      </Page>
    </>
  );
}

// ── 3. PARTE 3: SEU NOME NOVO (ENXUTO) ───────────────────────────────────────

export function PDFParte3NomeNovo(props: NomeSocialSharedLayoutProps) {
  const {
    nomeParaExibir,
    cincoNumNasc,
    cincoNumSocial,
    triangulosNasc,
    triangulosSocial,
    bloqueiosSocial,
    arquetipoNasc,
    arquetipoSocial,
    arquetipoHarmonizadoNota,
    letrasNome,
    theme = LAYOUT_THEME_PADRAO,
  } = props;

  const candidatosNumeros: Array<{
    nome: string;
    antes: number | null;
    depois: number | null;
    texto: string;
  }> = [
    {
      nome: 'Expressão',
      antes: cincoNumNasc.expressao,
      depois: cincoNumSocial.expressao,
      texto: cincoNumSocial.expressao ? firstSentence(EXPRESSAO_DESC[cincoNumSocial.expressao]) : '',
    },
    {
      nome: 'Motivação',
      antes: cincoNumNasc.motivacao,
      depois: cincoNumSocial.motivacao,
      texto: cincoNumSocial.motivacao ? firstSentence(MOTIVACAO_DESC[cincoNumSocial.motivacao]) : '',
    },
    {
      nome: 'Impressão',
      antes: cincoNumNasc.impressao,
      depois: cincoNumSocial.impressao,
      texto: cincoNumSocial.impressao ? firstSentence(IMPRESSAO_DESC[cincoNumSocial.impressao]) : '',
    },
    {
      nome: 'Missão',
      antes: cincoNumNasc.missao,
      depois: cincoNumSocial.missao,
      texto: cincoNumSocial.missao ? firstSentence(MISSAO_DESC[cincoNumSocial.missao]) : '',
    },
  ];

  const numerosMudaram = candidatosNumeros.filter((c) => c.antes !== c.depois);
  const numerosIguais = [
    ...candidatosNumeros.filter((c) => c.antes === c.depois).map((c) => `${c.nome} ${c.depois ?? '—'}`),
    `Destino ${cincoNumSocial.destino ?? '—'} (vem da data de nascimento)`,
  ];

  const triVidaLen = triangulosSocial.vida?.linhas[0]?.length ?? 1;
  const compactTriCell = Math.min(13, Math.max(4, Math.floor(240 / triVidaLen) - 1));
  const fullWidthTriCell = Math.min(18, Math.max(5, Math.floor(430 / triVidaLen) - 1));
  const useSideBySideTri = triVidaLen <= 24;

  const bloqueiosVidaSocial = bloqueiosSocial.filter((b) => b.triangulos.includes('vida'));

  const arcanosMudaram: Array<{ onde: string; antes: number | null; depois: number | null }> = [
    { onde: 'Triângulo da Vida · regente', antes: triangulosNasc.vida?.arcanoRegente ?? null, depois: triangulosSocial.vida?.arcanoRegente ?? null },
    { onde: 'Triângulo Pessoal · regente', antes: triangulosNasc.pessoal?.arcanoRegente ?? null, depois: triangulosSocial.pessoal?.arcanoRegente ?? null },
    { onde: 'Triângulo Social · regente', antes: triangulosNasc.social?.arcanoRegente ?? null, depois: triangulosSocial.social?.arcanoRegente ?? null },
    { onde: 'Triângulo do Destino · regente', antes: triangulosNasc.destino?.arcanoRegente ?? null, depois: triangulosSocial.destino?.arcanoRegente ?? null },
  ].filter((a) => a.antes !== a.depois);

  const arquetipoMudou = arquetipoSocial.numero !== arquetipoNasc.numero;

  return (
    <Page size="A4" style={[pageStyles.page, { backgroundColor: theme.paginaFundo, fontFamily: theme.fonteTexto, color: theme.tintaSuave }]}>
      <PDFSectionAnchor id="pdf-nome-harmonizado" bookmark={{ title: 'Parte 3 · Seu nome novo', fit: true }} />
      <PDFPageHeader subtitle={`${nomeParaExibir} — Parte 3`} />

      <SeloParte theme={theme}>Parte 3 · Seu nome novo</SeloParte>
      <View style={{ marginBottom: 10 }}>
        <H1 theme={theme}>{nomeParaExibir}</H1>
        <P theme={theme} size={9.5}>
          Aqui aparece só o que mudou. O que ficou igual ao nome de nascimento já está explicado na Parte 1.
        </P>
      </View>

      <View style={{ marginBottom: 10 }}>
        <H2 theme={theme}>Os números que mudaram</H2>
        {numerosMudaram.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
            {numerosMudaram.map((n) => (
              <Card key={n.nome} theme={theme} style={{ width: '48.8%', padding: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ alignItems: 'center', minWidth: 34 }}>
                    <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 22, color: theme.destaqueTexto, lineHeight: 1 }}>
                      {n.depois ?? '—'}
                    </Text>
                    <Text style={{ fontSize: 7.5, color: theme.apagado, marginTop: 3 }}>era {n.antes ?? '—'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <H3 theme={theme}>{n.nome}</H3>
                    <H4 theme={theme}>{n.depois ? (NUMERO_NOMES[n.depois] ?? '') : ''}</H4>
                    <Text style={{ fontSize: 8, color: theme.tintaSuave, lineHeight: 1.4 }}>{n.texto}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card theme={theme} alt style={{ marginBottom: 6 }}>
            <P theme={theme} size={8.5}>
              Todos os quatro números variáveis mantiveram o mesmo valor do nome de nascimento. A mudança acontece nos triângulos e no campo kármico.
            </P>
          </Card>
        )}
        <Nota theme={theme}>Sem mudança: {numerosIguais.join(' · ')}.</Nota>
      </View>

      <View style={{ marginBottom: 10 }}>
        <PDFSectionAnchor id="pdf-harmonizado-arquetipo" bookmark={{ title: 'Arquétipo do nome novo', fit: true }} />
        {arquetipoMudou ? (
          <Card theme={theme} fundo={COR_FIXA.arcanoFundo}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.arcanoTexto, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
              Arquétipo do nome novo · Expressão {cincoNumSocial.expressao ?? '—'}
            </Text>
            <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 14, color: '#2E1B6B', marginBottom: 3 }}>
              {arquetipoSocial.nome}
            </Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: '#2E1B6B', lineHeight: 1.45, marginBottom: 4 }}>
              {arquetipoHarmonizadoNota}
            </Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.arcanoTexto, lineHeight: 1.4 }}>
              Essência: “{arquetipoSocial.essencia}”
            </Text>
          </Card>
        ) : (
          <Card theme={theme} alt>
            <H4 theme={theme}>Arquétipo mantido: {arquetipoSocial.nome}</H4>
            <P theme={theme} size={8.5}>{arquetipoHarmonizadoNota}</P>
          </Card>
        )}
      </View>

      <View style={{ flexDirection: useSideBySideTri ? 'row' : 'column', gap: 10, alignItems: 'stretch' }}>
        <Card theme={theme} style={{ flex: useSideBySideTri ? 1.35 : undefined, alignItems: 'center' }}>
          <PDFSectionAnchor id="pdf-harmonizado-triangulo-vida" bookmark={{ title: 'Triângulo da Vida do nome novo', fit: true }} />
          <View style={{ alignSelf: 'flex-start', marginBottom: 4 }}>
            <H3 theme={theme}>Triângulo da Vida do nome novo</H3>
          </View>
          {triangulosSocial.vida && (
            <TrianguloPiramideInline
              data={triangulosSocial.vida}
              label=""
              cellSize={useSideBySideTri ? compactTriCell : fullWidthTriCell}
              letras={letrasNome}
            />
          )}
          <Text
            style={{
              fontFamily: theme.fonteTextoBold,
              fontSize: 8.5,
              color: bloqueiosVidaSocial.length > 0 ? COR_FIXA.bloqueioTexto : '#047857',
              marginTop: 4,
            }}
          >
            {bloqueiosVidaSocial.length > 0
              ? `Bloqueios: ${bloqueiosVidaSocial.map((b) => b.codigo).join(' · ')}`
              : 'Sem bloqueios no Triângulo da Vida'}
          </Text>
        </Card>

        <View style={{ flex: useSideBySideTri ? 1 : undefined, gap: 6 }}>
          <H3 theme={theme}>Arcanos que mudaram</H3>
          {arcanosMudaram.length > 0 ? (
            arcanosMudaram.map((a) => (
              <Card key={a.onde} theme={theme} fundo={COR_FIXA.arcanoFundo} style={{ padding: 9 }}>
                <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7, color: COR_FIXA.arcanoTexto, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
                  {a.onde}
                </Text>
                <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 10, color: '#2E1B6B', marginBottom: 1 }}>
                  {formatArcanoShort(a.depois)}
                </Text>
                <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8, color: COR_FIXA.arcanoTexto }}>
                  era {formatArcanoShort(a.antes)}
                </Text>
              </Card>
            ))
          ) : (
            <Card theme={theme} alt style={{ padding: 10 }}>
              <P theme={theme} size={8.5}>
                Os arcanos regentes dos 4 triângulos permanecem iguais aos do nome de nascimento.
              </P>
            </Card>
          )}
        </View>
      </View>

      <Nota theme={theme} >
        Lições, tendências e débitos que mudaram estão comparados na Parte 2.
      </Nota>

      <PDFFooter />
    </Page>
  );
}

// ── 4. ANEXOS: TRIÂNGULOS POR DIMENSÃO LADO A LADO ───────────────────────────

interface AnexoDimensaoProps {
  dimensao: 'pessoal' | 'social' | 'destino';
  ordem: 1 | 2 | 3;
  nomeNascimento: string;
  nomeParaExibir: string;
  triNasc: Triangulo;
  triSocial: Triangulo;
  letrasNasc: string[];
  letrasSocial: string[];
  theme?: PdfLayoutTheme;
}

const DIMENSAO_META: Record<'pessoal' | 'social' | 'destino', { titulo: string; descricao: string }> = {
  pessoal: {
    titulo: 'Triângulo Pessoal',
    descricao: 'Vida íntima e reações internas. Cada letra recebe o dia do nascimento reduzido. À esquerda o nome de nascimento, à direita o nome novo.',
  },
  social: {
    titulo: 'Triângulo Social',
    descricao: 'Influências externas e percepção pública. Cada letra recebe o mês do nascimento reduzido. À esquerda o nome de nascimento, à direita o nome novo.',
  },
  destino: {
    titulo: 'Triângulo do Destino',
    descricao: 'Resultados e realização de longo prazo. Cada letra recebe a soma reduzida do dia e do mês de nascimento. À esquerda o nome de nascimento, à direita o nome novo.',
  },
};

export function PDFAnexoTrianguloDimensao({
  dimensao,
  ordem,
  nomeNascimento,
  nomeParaExibir,
  triNasc,
  triSocial,
  letrasNasc,
  letrasSocial,
  theme = LAYOUT_THEME_PADRAO,
}: AnexoDimensaoProps) {
  const meta = DIMENSAO_META[dimensao];
  const nascLen = triNasc.linhas[0]?.length ?? 1;
  const harmLen = triSocial.linhas[0]?.length ?? 1;
  const halfCellNasc = Math.min(11, Math.max(4, Math.floor(195 / nascLen) - 1));
  const halfCellHarm = Math.min(11, Math.max(4, Math.floor(195 / harmLen) - 1));

  const lados: Array<{
    titulo: string;
    nome: string;
    data: Triangulo;
    letras: string[];
    cellSize: number;
  }> = [
    { titulo: 'Nascimento', nome: nomeNascimento, data: triNasc, letras: letrasNasc, cellSize: halfCellNasc },
    { titulo: 'Nome novo', nome: nomeParaExibir, data: triSocial, letras: letrasSocial, cellSize: halfCellHarm },
  ];

  return (
    <Page size="A4" style={[pageStyles.page, { backgroundColor: theme.paginaFundo, fontFamily: theme.fonteTexto, color: theme.tintaSuave }]}>
      {ordem === 1 && <PDFSectionAnchor id="pdf-anexos" bookmark={{ title: 'Anexos', fit: true }} />}
      {ordem === 1 && <PDFSectionAnchor id="pdf-anexos-triangulos" bookmark={{ title: 'Triângulos complementares', fit: true }} />}
      <PDFSectionAnchor id={`pdf-essencia-triangulo-${dimensao}`} bookmark={{ title: `${meta.titulo} (Nascimento)`, fit: true }} />
      <PDFSectionAnchor id={`pdf-harmonizado-triangulo-${dimensao}`} bookmark={{ title: `${meta.titulo} (Nome novo)`, fit: true }} />

      <PDFPageHeader subtitle={`${nomeParaExibir} — Anexos`} />

      <SeloParte theme={theme}>Anexos · Leitura complementar</SeloParte>
      <View style={{ marginBottom: 10 }}>
        <H3 theme={theme}>{ordem} de 3 · uma página por dimensão</H3>
        <H2 theme={theme}>{meta.titulo}</H2>
        <P theme={theme} size={9}>{meta.descricao}</P>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'stretch' }}>
        {lados.map((lado) => (
          <Card key={lado.titulo} theme={theme} style={{ flex: 1, padding: 10, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', width: '100%', marginBottom: 6 }}>
              <H4 theme={theme}>{lado.titulo}</H4>
              <Nota theme={theme}>{lado.nome}</Nota>
            </View>

            <TrianguloPiramideInline
              data={lado.data}
              label=""
              cellSize={lado.cellSize}
              letras={lado.letras}
            />

            <View style={{ width: '100%', marginTop: 6, gap: 6 }}>
              <Text
                style={{
                  fontFamily: theme.fonteTextoBold,
                  fontSize: 8.5,
                  color: lado.data.sequenciasNegativas.length > 0 ? COR_FIXA.bloqueioTexto : '#047857',
                }}
              >
                {lado.data.sequenciasNegativas.length > 0
                  ? `Bloqueios: ${lado.data.sequenciasNegativas.join(' · ')}`
                  : 'Sem bloqueios'}
              </Text>

              <View style={{ backgroundColor: COR_FIXA.arcanoFundo, borderRadius: 10, padding: 8 }}>
                <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7, color: COR_FIXA.arcanoTexto, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Arcano regente
                </Text>
                <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 9.5, color: '#2E1B6B', marginTop: 2 }}>
                  {formatArcanoShort(lado.data.arcanoRegente)}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <Card theme={theme} alt style={{ marginTop: 'auto' }}>
        <H4 theme={theme}>{ordem < 3 ? 'Nas próximas páginas' : 'Leitura complementar'}</H4>
        <P theme={theme} size={8.5}>
          {ordem === 1
            ? 'Na sequência: Triângulo Social (letra + mês) e Triângulo do Destino (letra + dia e mês), no mesmo formato. Os arcanos de trânsito ficam na página Ciclos do nome.'
            : ordem === 2
              ? 'Na próxima página: Triângulo do Destino (letra + dia e mês), e em seguida Ciclos do nome com os arcanos de trânsito.'
              : 'Os triângulos Pessoal, Social e do Destino são leituras complementares e não alteram a nota do nome.'}
        </P>
      </Card>

      <PDFFooter />
    </Page>
  );
}

// ── 5. ANEXOS: CICLOS DO NOME (ARCANOS DE TRÂNSITO) ──────────────────────────

function CicloCard({
  titulo,
  nome,
  triangulo,
  theme,
}: {
  titulo: string;
  nome: string;
  triangulo: Triangulo;
  theme: PdfLayoutTheme;
}) {
  const pares = triangulo.arcanosDePassagem ?? [];
  if (pares.length === 0) return null;

  const dur = 90 / pares.length;
  const durStr = dur.toFixed(1).replace('.', ',');
  const atualIdx = triangulo.arcanoAtual?.indice ?? 0;
  const arcanoAtualNum = pares[atualIdx] ?? triangulo.arcanoAtual?.numero ?? pares[0];
  const arcObj = arcanoAtualNum != null ? getArcano(arcanoAtualNum) : null;
  const inicio = triangulo.arcanoAtual?.idadeInicio ?? Math.round(atualIdx * dur);
  const fim = triangulo.arcanoAtual?.idadeFim ?? Math.round((atualIdx + 1) * dur);

  return (
    <Card theme={theme} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <H4 theme={theme}>{titulo} · {nome}</H4>
        <Nota theme={theme}>cerca de {durStr} anos por fase</Nota>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        {pares.map((arc, idx) => {
          const isCurrent = idx === atualIdx;
          const faixaIdades = `${Math.round(idx * dur)}–${Math.round((idx + 1) * dur)}`;
          return (
            <View
              key={`${idx}-${arc}`}
              style={{
                width: 44,
                backgroundColor: isCurrent ? COR_FIXA.arcano : theme.cardFundoAlt,
                borderRadius: 8,
                paddingVertical: 4,
                paddingHorizontal: 3,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 10.5, color: isCurrent ? '#FFFFFF' : COR_FIXA.arcanoTexto }}>
                {arc}
              </Text>
              <Text style={{ fontFamily: theme.fonteTexto, fontSize: 7, color: isCurrent ? COR_FIXA.arcanoFundo : theme.apagado }}>
                {faixaIdades}
              </Text>
              {isCurrent && (
                <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 6.5, color: '#FFFFFF', letterSpacing: 0.5, marginTop: 1 }}>
                  AGORA
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {arcObj && (
        <View style={{ backgroundColor: COR_FIXA.arcanoFundo, borderRadius: 10, padding: 8 }}>
          <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7, color: COR_FIXA.arcanoTexto, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Fase de agora (período aproximado)
          </Text>
          <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: '#2E1B6B', marginTop: 2 }}>
            Arcano {arcanoAtualNum} · {arcObj.nome} ({arcObj.palavraChave}) · de {inicio} a {fim} anos, aproximadamente
          </Text>
        </View>
      )}
    </Card>
  );
}

export function PDFAnexoCiclosDoNome({
  nomeNascimento,
  nomeParaExibir,
  isDifferentName,
  triVidaNasc,
  triVidaSocial,
  theme = LAYOUT_THEME_PADRAO,
}: {
  nomeNascimento: string;
  nomeParaExibir: string;
  isDifferentName: boolean;
  triVidaNasc?: Triangulo;
  triVidaSocial?: Triangulo;
  theme?: PdfLayoutTheme;
}) {
  return (
    <Page size="A4" style={[pageStyles.page, { backgroundColor: theme.paginaFundo, fontFamily: theme.fonteTexto, color: theme.tintaSuave }]}>
      <PDFSectionAnchor id="pdf-anexos-ciclos" bookmark={{ title: 'Ciclos do nome', fit: true }} />
      <PDFPageHeader subtitle={`${nomeParaExibir} — Ciclos do nome`} />

      <View style={{ marginBottom: 10 }}>
        <H3 theme={theme}>Anexos · Leitura complementar</H3>
        <H2 theme={theme}>Ciclos do nome: arcanos de trânsito</H2>
        <P theme={theme} size={9}>
          Cada par de letras vizinhas do nome forma um arcano de trânsito. Eles se sucedem ao longo da vida como fases. A duração de cada fase depende do tamanho do nome e é aproximada: considere margem de um a dois anos.
        </P>
      </View>

      {triVidaNasc && <CicloCard titulo="Nascimento" nome={nomeNascimento} triangulo={triVidaNasc} theme={theme} />}
      {isDifferentName && triVidaSocial && <CicloCard titulo="Nome novo" nome={nomeParaExibir} triangulo={triVidaSocial} theme={theme} />}

      <Card theme={theme} alt style={{ marginTop: 'auto' }}>
        <H4 theme={theme}>Por que isto fica nos anexos</H4>
        <P theme={theme} size={8.5}>
          É uma leitura de momento: muda com o tempo e com o tamanho do nome, e as datas são aproximadas. Não entra na nota nem na escolha do nome.
        </P>
      </Card>

      <PDFFooter />
    </Page>
  );
}
