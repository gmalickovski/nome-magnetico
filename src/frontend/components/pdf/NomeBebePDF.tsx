/**
 * NomeBebePDF — documento PDF da análise de Nome para Bebê.
 *
 * Paleta: Rose-gold + Cream (capa com lua crescente + círculos suaves).
 * Número destaque: Destino (calculado da data de nascimento, imutável).
 *
 * Estrutura de páginas:
 *   1. Capa (rose-gold — lua crescente)
 *   2. Destino do Bebê em DESTAQUE + Melhor Nome + 5 Números (Destino destacado)
 *   3. Ranking comparativo dos candidatos
 *   4. Os 4 Triângulos numerológicos com textos contextuais
 *   5. Karma do bebê (débitos + lições + tendências) — se houver
 *   6+. Análise IA completa (triângulos + blocos kármicos injetados inline)
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { THEMES } from './shared/PDFTheme';
import { PDFCover } from './shared/PDFCover';
import { PDFStandardIntro } from './shared/PDFStandardIntro';
import { PDFPageHeader } from './shared/PDFPageHeader';
import { PDFFooter } from './shared/PDFFooter';
import { PDFNumbersGrid } from './shared/PDFNumbersGrid';
import { PDFNumbersBabyBlocks } from './shared/PDFNumbersBabyBlocks';
import { RenderMarkdownChunks, TrianguloPiramideInline } from './shared/PDFMarkdownRenderer';
import { DebitosBlock, LicoesBlock, TendenciasBlock } from './shared/PDFKarmicBlock';
import { LOGO_FONT, TITLE_FONT, loadLogoSrc, formatDate } from './shared/PDFFonts';
import { formatAnalysisText } from '../../../utils/textFormatter';
import { ARCANOS } from '../../../backend/numerology/arcanos';
import { ArquetipoCardPDF } from './shared/PDFArquetipoCard';
import { getArquetipo } from '../../../backend/numerology/archetypes';
import type { ProductPDFProps } from './shared/PDFTypes';

const theme = THEMES.nome_bebe;

const PRIMARY = theme.primaryColor;   // rose-gold
const GOLD = '#D4AF37';
const GRAY = '#4B5563';
const LIGHT_GRAY = '#E5E7EB';
const DARK = '#1a1a1a';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    color: DARK,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: TITLE_FONT,
    color: '#8A661C',
    borderBottomWidth: 1,
    borderBottomColor: '#8A661C',
    paddingBottom: 4,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 10,
    color: DARK,
    lineHeight: 1.75,
    marginBottom: 8,
  },
  hugeTitle: {
    fontSize: 18,
    fontFamily: TITLE_FONT,
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  conclusaoCard: {
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFF8F5',
    marginTop: 8,
  },
  // Destino do bebê — card grande centralizado
  destinoCard: {
    alignItems: 'center',
    marginBottom: 8,
  },
  destinoBox: {
    width: '55%',
    borderWidth: 2,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    marginTop: 8,
  },
  destinoLabel: {
    fontSize: 10,
    color: GRAY,
    marginBottom: 8,
    letterSpacing: 1,
  },
  destinoNumber: {
    fontSize: 56,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  destinoMeta: {
    fontSize: 9,
    color: GRAY,
  },
  // Melhor nome highlight
  melhorNomeBox: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFF8F5',
    marginTop: 4,
  },
  melhorNomeTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 14,
    color: DARK,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreLabel: { fontSize: 9, color: GRAY },
  scoreValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  scoreBar: { height: 8, backgroundColor: LIGHT_GRAY, borderRadius: 4 },
  scoreBarFill: { height: 8, borderRadius: 4 },
  compatBox: {
    marginTop: 12,
    borderRadius: 6,
    padding: 8,
  },
  compatText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  bloqueioStatus: {
    fontSize: 8,
    marginTop: 8,
    textAlign: 'center',
  },
  // Estudo candidatos
  candidatoCard: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    borderRadius: 6,
  },
  candidatoCardTop: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#F0F6FF',
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 6,
  },
  candidatoBar: { height: 4, backgroundColor: LIGHT_GRAY, borderRadius: 2, marginBottom: 6 },
  candidatoBarFill: { height: 4, borderRadius: 2 },
  candidatoMeta: { flexDirection: 'row', gap: 14, marginBottom: 5, flexWrap: 'wrap' },
  candidatoMetaText: { fontSize: 9, color: GRAY },
  candidatoCompat: { flexDirection: 'row', gap: 14 },
});

function compatColor(c: string): string {
  return c === 'total' ? '#059669' : c === 'complementar' ? '#7c3aed' : c === 'aceitavel' ? '#D97706' : '#DC2626';
}

function compatLabel(c: string): string {
  return c === 'total' ? 'Total' : c === 'complementar' ? 'Complementar' : c === 'aceitavel' ? 'Aceitável' : 'Incompatível';
}

function scoreColor(score: number): string {
  if (score >= 90) return '#10B981'; // Excelente
  if (score >= 70) return '#84CC16'; // Bom
  if (score >= 40) return '#FACC15'; // Aceitável
  if (score >= 20) return '#F97316'; // Não recomendado
  return '#EF4444'; // Crítico
}

function extractConclusao(text: string): string | null {
  const match = text.match(/##[^\n]*(?:7\.|legado|conclus|bencao|bênção|do céu)/i);
  if (!match || match.index === undefined) return null;
  return text.slice(match.index).trim();
}

export function NomeBebePDF({ analysis, magneticNames }: ProductPDFProps) {
  const logoSrc = loadLogoSrc();
  const freqData = analysis.frequencias_numeros as any;
  const nomeParaExibir = freqData?.ranking?.melhorNome?.nomeCompleto ?? analysis.nome_completo;
  const dataNascimento = formatDate(
    freqData?.ranking?.dataNascimento ?? analysis.data_nascimento
  );
  const dataGeracao = formatDate(analysis.completed_at ?? analysis.created_at);

  const letrasNome = nomeParaExibir
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');

  // 5 números — para bebê usa números do melhor candidato
  const melhorNome = freqData?.ranking?.melhorNome;
  const destinoBebe = freqData?.ranking?.destino ?? analysis.numero_destino;

  const nums = [
    { label: 'Destino', sublabel: 'O Chamado do Céu', value: destinoBebe, icon: '◈' },
    { label: 'Expressão', sublabel: 'O Dom', value: melhorNome?.expressao ?? analysis.numero_expressao, icon: '✦' },
    { label: 'Motivação', sublabel: 'A Alma', value: melhorNome?.motivacao ?? analysis.numero_motivacao, icon: '♡' },
    { label: 'Impressão', sublabel: 'As Consoantes', value: melhorNome?.impressao ?? analysis.numero_impressao, icon: '◎' },
    { label: 'Missão', sublabel: 'A Vocação', value: melhorNome?.missao ?? analysis.numero_missao, icon: '◇' },
  ];

  const debitos = Array.isArray(analysis.debitos_carmicos) ? analysis.debitos_carmicos : [];
  const licoes = Array.isArray(analysis.licoes_carmicas) ? analysis.licoes_carmicas : [];
  const tendencias = Array.isArray(analysis.tendencias_ocultas) ? analysis.tendencias_ocultas : [];
  const frequencias: Record<string, number> | null =
    freqData?.frequencias ?? null;

  const tVida = analysis.triangulo_vida ?? null;
  const tPessoal = analysis.triangulo_pessoal ?? null;
  const tSocial = analysis.triangulo_social ?? null;
  const tDestino = analysis.triangulo_destino ?? null;
  const hasTriangulos = !!(tVida || tPessoal || tSocial || tDestino);

  const TRIANGLE_FULL_WIDTH = 430;
  const baseLen = Math.max(
    tVida?.linhas[0]?.length ?? 1,
    tPessoal?.linhas[0]?.length ?? 1,
    tSocial?.linhas[0]?.length ?? 1,
    tDestino?.linhas[0]?.length ?? 1,
  );
  const triCellSize = Math.min(18, Math.max(5, Math.floor(TRIANGLE_FULL_WIDTH / baseLen) - 1));
  const triangleMap = hasTriangulos
    ? { vida: tVida, pessoal: tPessoal, social: tSocial, destino: tDestino }
    : undefined;

  const analiseFormatado = analysis.analise_texto
    ? formatAnalysisText(analysis.analise_texto)
    : null;
  const conclusaoTexto = analiseFormatado ? extractConclusao(analiseFormatado) : null;
  const analiseCorpo = analiseFormatado && conclusaoTexto
    ? analiseFormatado.slice(0, analiseFormatado.indexOf(conclusaoTexto)).trim()
    : analiseFormatado;

  const nomesCandidatos: any[] = freqData?.ranking?.nomesCandidatos ?? [];

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
      <PDFStandardIntro theme={theme} productType="nome_bebe" entityName={nomeParaExibir} />

        {/* ── PÁGINA 3: DESTINO DESTAQUE + 5 NÚMEROS ─────────── */}
      <Page size="A4" style={styles.page}>
        <PDFPageHeader subtitle={`${nomeParaExibir} — O Portal do Nascimento`} />

        {/* Título Principal da Página H1 */}
        <Text style={styles.hugeTitle}>Essência da Criança</Text>

        {/* Os 5 números — Destino destacado (H2) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A Matriz Vibratória</Text>
          <View style={{ marginBottom: 16 }}>
            <PDFNumbersBabyBlocks 
              nums={{
                destino: destinoBebe,
                expressao: melhorNome?.expressao ?? analysis.numero_expressao,
                motivacao: melhorNome?.motivacao ?? analysis.numero_motivacao,
                impressao: melhorNome?.impressao ?? analysis.numero_impressao,
                missao: melhorNome?.missao ?? analysis.numero_missao
              }} 
            />
          </View>
          <Text style={styles.bodyText}>
            A psique de todo ser humano é moldada e regida por 5 frequências centrais, formando o que a Cabala chama de Matriz Vibratória. Destes cinco números, o Destino — extraído exclusivamente da data exata de nascimento — é considerado a força motriz suprema; ele é o chamado de alma imutável com o qual o seu bebê foi enviado à Terra. Já os outros quatro números (Expressão, Motivação, Impressão e Missão), herdados através do registro do Nome, atuarão como as ferramentas, a armadura e os talentos internos concedidos a ele para conseguir caminhar, brilhar e realizar este grande propósito de forma plena e feliz.
          </Text>
        </View>

        {melhorNome?.expressao && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>O Arquétipo da Alma</Text>
            <Text style={{ ...styles.bodyText, marginBottom: 16 }}>
              A união harmônica das letras escolhidas dita o campo magnético de Expressão deste nome infantil. A vibração de um nome não é um som vazio, ela o conecta a uma força arquetípica: a identidade mítica primordial descrita e estudada pelas mais profundas correntes da psicologia analítica (Carl Jung) que a sua criança sentirá necessidade instintiva de desempenhar no grande teatro da vida. Entender este arquétipo entrega nas mãos dos pais uma bússola inestimável de clareza a respeito da personalidade instintiva, do estilo afetivo e da principal inclinação artística do seu bebê.
            </Text>
            <ArquetipoCardPDF arquetipo={getArquetipo(melhorNome.expressao)} />
          </View>
        )}

        {/* Melhor nome destaque */}
        {melhorNome && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Nome Mais Indicado Numericamente</Text>
            <Text style={{ ...styles.bodyText, marginBottom: 16 }}>
              A escolha do nome de um filho vai infinitamente além da estética e das tendências sonoras. Para descobrir a versão ideal entre os candidatos que você nos confiou, o sistema analisou minuciosamente e calculou um "Score Numerológico" para cada variação. Nós cruzamos a vibração das letras sugeridas diretamente com o Destino inato da sua criança (sua data de nascimento). O nome que apresentamos no pódio abaixo destacou-se por entregar a melhor compatibilidade harmônica com o Destino e, acima de tudo, por formar um escudo vibracional equilibrado e completamente livre de bloqueios numéricos.
            </Text>
            <View style={[styles.melhorNomeBox, { borderColor: PRIMARY }]}>
              <Text style={styles.melhorNomeTitle}>{melhorNome.nomeCompleto}</Text>

              <View style={{ marginBottom: 14 }}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Score Numerológico</Text>
                  <Text style={[styles.scoreValue, { color: scoreColor(melhorNome.score) }]}>
                    {melhorNome.score}/100
                  </Text>
                </View>
                <View style={styles.scoreBar}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      {
                        width: `${melhorNome.score}%`,
                        backgroundColor: scoreColor(melhorNome.score),
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={[styles.compatBox, {
                backgroundColor: melhorNome.compatibilidade === 'total' ? '#ECFDF5' : '#FFFDF0',
              }]}>
                <Text style={[styles.compatText, {
                  color: melhorNome.compatibilidade === 'total' ? '#059669' : '#D97706',
                }]}>
                  Compatibilidade Expressão × Destino:{' '}
                  {melhorNome.compatibilidade === 'total' ? 'Harmonia Total'
                    : melhorNome.compatibilidade === 'complementar' ? 'Harmonia Complementar'
                    : melhorNome.compatibilidade === 'aceitavel' ? 'Aceitável'
                    : 'Incompatível'}
                </Text>
              </View>

              <Text style={[styles.bloqueioStatus, {
                color: melhorNome.temBloqueio ? '#DC2626' : '#059669',
              }]}>
                {melhorNome.temBloqueio
                  ? `${melhorNome.bloqueios?.length ?? 1} bloqueio(s) detectado(s)`
                  : 'Sem bloqueios energéticos'}
              </Text>
            </View>
          </View>
        )}

        <PDFFooter />
      </Page>

      {/* ── PÁGINA 3: RANKING DOS CANDIDATOS ─────────────────────────────── */}
      {nomesCandidatos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — Ranking dos Candidatos`} />

          <View style={styles.section}>
            <Text style={styles.hugeTitle}>Ranking Numerológico dos Candidatos</Text>
            <Text style={{ ...styles.bodyText, marginBottom: 12 }}>
              Abaixo encontra-se a classificação vibratória dos nomes avaliados, ordenados do maior para o menor potencial de fluidez. A pontuação reflete a harmonia entre as frequências do nome e o plano original do Destino do seu bebê. O nome no topo é a recomendação de ouro para garantir um portal energético limpo e auspicioso, livre de bloqueios constritores.
            </Text>

            {nomesCandidatos.slice(0, 10).map((c: any, i: number) => {
              const sc = scoreColor(c.score);
              const isTop = i === 0;
              const isIA = c.origemSugerida === 'ia';
              return (
                <View key={i} style={isTop ? styles.candidatoCardTop : styles.candidatoCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {isTop && <Text style={{ fontSize: 8, color: PRIMARY, fontFamily: 'Helvetica-Bold' }}>★ RECOMENDADO{'  '}</Text>}
                      {isIA && !isTop && <Text style={{ fontSize: 7, color: '#7c3aed', fontFamily: 'Helvetica-Bold' }}>(*) SUGESTÃO{'  '}</Text>}
                      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: isTop ? DARK : '#374151' }}>{c.nomeCompleto}</Text>
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: sc }}>{c.score}/100</Text>
                  </View>

                  <View style={styles.candidatoBar}>
                    <View style={[styles.candidatoBarFill, { width: `${Math.min(100, c.score)}%`, backgroundColor: sc }]} />
                  </View>

                  <View style={styles.candidatoMeta}>
                    <Text style={styles.candidatoMetaText}>Expressão: <Text style={{ fontFamily: 'Helvetica-Bold', color: PRIMARY }}>{c.expressao}</Text></Text>
                    <Text style={styles.candidatoMetaText}>Motivação: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{c.motivacao}</Text></Text>
                    <Text style={styles.candidatoMetaText}>Missão: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{c.missao}</Text></Text>
                    <Text style={styles.candidatoMetaText}>Impressão: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{c.impressao ?? '?'}</Text></Text>
                  </View>

                  <View style={styles.candidatoCompat}>
                    <Text style={{ fontSize: 9, color: compatColor(c.compatibilidade) }}>
                      Destino da Criança: {compatLabel(c.compatibilidade)}
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

      {/* ── PÁGINA 4+: FLUXO CONTÍNUO DE ANÁLISE ────────────────────────────── */}
      {((debitos.length > 0 || licoes.length > 0 || tendencias.length > 0) || hasTriangulos || analiseCorpo) && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — Análise Numerológica`} />

          {(debitos.length > 0 || licoes.length > 0 || tendencias.length > 0) && (
            <View minPresenceAhead={350}>
              <Text style={styles.hugeTitle}>O Peso do Passado (Karma e Tendências)</Text>
              
              {debitos.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: '#D97706', borderBottomColor: '#D97706' }]}>
                    Débitos Kármicos
                  </Text>
                  <Text style={{ ...styles.bodyText, marginBottom: 6 }}>
                    Na ótica reencarnacionista da Cabala, um Bebê não é uma "página em branco", mas um espírito sábio e antigo assumindo um novo corpo para evoluir. Os Débitos Kármicos revelam excessos cometidos em aprendizados passados e mostram aos pais exatamente onde precisarão agir com mais doçura, limite e direcionamento, evitando que a criança repita os mesmos padrões de autossabotagem no futuro.
                  </Text>
                  <DebitosBlock debitos={debitos} />
                </View>
              )}

              {licoes.length > 0 && (
                <View style={{ ...styles.section, marginTop: 0 }}>
                  <Text style={[styles.sectionTitle, { color: '#0369a1', borderBottomColor: '#0369a1' }]}>
                    Lições Kármicas
                  </Text>
                  <Text style={{ ...styles.bodyText, marginBottom: 6 }}>
                    As Lições Kármicas são identificadas pelas frequências numéricas "ausentes" no nome escolhido. Elas indicam certas virtudes ou campos de domínio que a criança deverá desenvolver organicamente ao longo da vida. Conhecê-las agora é providencial: pois permite que vocês estimulem essas exatas habilidades através do esporte, da arte e da educação desde a mais tenra idade.
                  </Text>
                  <LicoesBlock licoes={licoes} />
                </View>
              )}

              {tendencias.length > 0 && (
                <View style={{ ...styles.section, marginTop: 0 }}>
                  <Text style={[styles.sectionTitle, { color: '#6d28d9', borderBottomColor: '#6d28d9' }]}>
                    Tendências Ocultas
                  </Text>
                  <Text style={{ ...styles.bodyText, marginBottom: 6 }}>
                    As Tendências Ocultas são frequências massivamente repetidas nas letras do nome, agindo como um imenso rio de energia herdada. Elas representam talentos instintivos formidáveis que a criança possui — mas que, se não dosados, podem resultar em exageros comportamentais. Cabe a vocês canalizar essa força vulcânica para caminhos criativos e seguros.
                  </Text>
                  <TendenciasBlock tendencias={tendencias} frequencias={frequencias} />
                </View>
              )}
            </View>
          )}
          {hasTriangulos && (
            <View style={!(debitos.length > 0 || licoes.length > 0 || tendencias.length > 0) ? styles.section : { ...styles.section, marginTop: 12 }} minPresenceAhead={350}>
              <Text style={styles.hugeTitle}>A Geometria da Alma (Os 4 Triângulos)</Text>
              <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
                Os Quatro Triângulos Numerológicos formam a anatomia vibratória e a estrutura geométrica do nome. Na Numerologia Cabalística, o nome funciona como um campo de força contínuo: cada vez que é pronunciado ou escrito, ele irradia uma frequência específica. Para compreender a real profundidade e as nuances dessa frequência, dividimos o estudo do nome em quatro "Pirâmides de Fluxo", onde cada camada mapeia um aspecto diferente da jornada da sua criança.
              </Text>
              <Text style={{ ...styles.bodyText, marginBottom: 16 }}>
                A leitura desses triângulos funciona de forma orgânica e reveladora. Eles desdobram as influências desde a fundação física e vital, passando pelo universo íntimo e emocional, pela forma como o mundo externo perceberá a criança, até culminar no propósito maior que o destino inevitavelmente atrairá. A seguir, detalharemos cada uma dessas quatro dimensões essenciais.
              </Text>

              {([
                { data: tVida, key: 'Triângulo da Vida', desc: 'O Triângulo da Vida representa a fundação energética e física do seu bebê. Ele revela a vibração primária que protegerá a saúde da criança e definirá a forma como ela se expressará e brilhará no mundo. Esta pirâmide dita a resistência vital e os aspectos mais visíveis da sua personalidade durante toda a jornada, operando como a grande âncora de segurança que sustentará os seus primeiros passos na matéria.' },
                { data: tPessoal, key: 'Triângulo Pessoal', desc: 'O Triângulo Pessoal explora o universo íntimo e silencioso da criança. Ele desvenda como o seu bebê irá processar internamente o medo, a alegria, as frustrações e o apego. Conhecer este aspecto trará empatia para acolher as reações emocionais mais profundas do seu filho, auxiliando-o a construir autoconfiança e a navegar com segurança pelo turbilhão fluído da sensibilidade humana.' },
                { data: tSocial, key: 'Triângulo Social', desc: 'O Triângulo Social mapeia as conexões externas e o magnetismo interativo inerente ao nome. Ele dita a forma exata como os amiguinhos, os professores e a sociedade irão enxergar e receber a criança. Esta arquitetura vibracional determina a facilidade do bebê para transitar em grupo, semear interações frutíferas e exercer o seu pertencimento de maneira naturalmente carismática.' },
                { data: tDestino, key: 'Triângulo do Destino', desc: 'A pirâmide áurea do Triângulo do Destino aponta para o propósito maior e a vocação a longo prazo desta nova vida. Ela corrobora a sua missão irrevogável na ausência de bloqueios em seu topo. As frequências reveladas aqui agirão como uma bússola imantada e serena, arquitetando sincronicidades para que a criança vença obstáculos e honre com graciosidade a sabedoria do seu legado e as vitórias do seu futuro.' },
              ] as const).filter(t => t.data != null).map(({ data, key, desc }, idx) => {
                const arcanoNum = data!.arcanoRegente;
                const arcanoInfo = arcanoNum != null ? (ARCANOS as any)[arcanoNum] ?? null : null;
                return (
                  <View key={key} style={{ marginTop: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#a855f7', marginBottom: 4 }}>{key}</Text>
                    <Text style={{ ...styles.bodyText, marginBottom: 8 }}>{desc}</Text>
                    <View>
                      <TrianguloPiramideInline data={data!} label={key} cellSize={triCellSize} letras={letrasNome} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {analiseCorpo && (
            <View style={{ ...styles.section, marginTop: 12 }} minPresenceAhead={350}>
              <Text style={styles.hugeTitle}>Sua Análise Complementar</Text>
              <RenderMarkdownChunks
                text={analiseCorpo}
                styles={styles}
                GOLD={PRIMARY}
                triangleMap={triangleMap}
                triCellSize={triCellSize}
                letrasNome={letrasNome}
              />
            </View>
          )}

          <PDFFooter />
        </Page>
      )}

      {/* ── CONCLUSÃO ─────────────────────────────────────────────────────── */}
      {conclusaoTexto && conclusaoTexto.length > 100 && (
        <Page size="A4" style={{ ...styles.page, backgroundColor: theme.coverBgColor }}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — O Legado`} />
          <View style={styles.section}>
            <Text style={styles.hugeTitle}>A Bênção</Text>
          </View>
          <RenderMarkdownChunks text={conclusaoTexto} styles={styles} GOLD={PRIMARY} />
          <PDFFooter />
        </Page>
      )}
    </Document>
  );
}
