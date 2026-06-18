/**
 * NomeEmpresaPDF — documento PDF da análise de Nome Empresarial.
 *
 * Paleta: Azul corporativo (#4A7FC1) + Gold accent (capa com hexágonos).
 * Número destaque: Expressão (magnetismo do negócio).
 *
 * Estrutura de páginas:
 *   1. Capa (navy + azul + gold — hexágonos geométricos)
 *   2. Sinergia Sócio-Empresa + Melhor Nome + 5 Números (Expressão destacada)
 *   3. Estudo completo dos candidatos
 *   4. Os 4 Triângulos numerológicos
 *   5. Karma Empresarial (débitos + lições) — se houver
 *   6+. Análise IA completa
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { THEMES } from './shared/PDFTheme';
import { PDFCover } from './shared/PDFCover';
import { PDFStandardIntro } from './shared/PDFStandardIntro';
import { PDFPageHeader } from './shared/PDFPageHeader';
import { PDFFooter } from './shared/PDFFooter';
import { PDFNumbersCorporate } from './shared/PDFNumbersCorporate';
import { RenderMarkdownChunks, TrianguloPiramideInline } from './shared/PDFMarkdownRenderer';
import { DebitosBlock, LicoesBlock, TendenciasBlock } from './shared/PDFKarmicBlock';
import { LOGO_FONT, TITLE_FONT, loadLogoSrc, formatDate } from './shared/PDFFonts';
import { formatAnalysisText } from '../../../utils/textFormatter';
import { ARCANOS } from '../../../backend/numerology/arcanos';
import type { ProductPDFProps } from './shared/PDFTypes';

const theme = THEMES.nome_empresa;

const PRIMARY = theme.primaryColor;   // azul
const ACCENT = theme.accentColor;     // gold
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
  hugeTitle: {
    fontSize: 18,
    fontFamily: TITLE_FONT,
    color: theme.coverBgColor,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY,
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
  conclusaoCard: {
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F0F6FF',
    marginTop: 8,
  },
  // Sinergia cards
  sinergiaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sinergiaCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  sinergiaLabel: {
    fontSize: 9,
    color: GRAY,
    marginBottom: 6,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sinergiaNumber: {
    fontSize: 34,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  sinergiaMeta: {
    fontSize: 8,
    color: GRAY,
    textAlign: 'center',
  },
  // Melhor nome
  melhorNomeBox: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginTop: 4,
    backgroundColor: '#F0F6FF',
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
  scoreBar: { height: 8, backgroundColor: LIGHT_GRAY, borderRadius: 4, marginBottom: 14 },
  scoreBarFill: { height: 8, borderRadius: 4 },
  compatBox: { marginTop: 6, borderRadius: 6, padding: 8 },
  compatText: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  bloqueioStatus: { fontSize: 8, marginTop: 8, textAlign: 'center' },
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

function scoreColor(score: number): string {
  if (score >= 90) return '#10B981'; // Excelente
  if (score >= 70) return '#84CC16'; // Bom
  if (score >= 40) return '#FACC15'; // Aceitável
  if (score >= 20) return '#F97316'; // Não recomendado
  return '#EF4444'; // Crítico
}

function compatColor(c: string): string {
  return c === 'total' ? '#059669' : c === 'complementar' ? '#7c3aed' : c === 'aceitavel' ? '#D97706' : '#DC2626';
}

function compatLabel(c: string): string {
  return c === 'total' ? 'Harmonia Total' : c === 'complementar' ? 'Complementar' : c === 'aceitavel' ? 'Aceitável' : 'Incompatível';
}

function extractConclusao(text: string): string | null {
  const match = text.match(/##[^\n]*(?:6\.|conclus|proxim|encerr)/i);
  if (!match || match.index === undefined) return null;
  return text.slice(match.index).trim();
}

export function NomeEmpresaPDF({ analysis, magneticNames }: ProductPDFProps) {
  const logoSrc = loadLogoSrc();
  const freqData = analysis.frequencias_numeros as any;
  const melhorNome = freqData?.melhorNome;
  const nomeParaExibir = melhorNome?.nomeEmpresa ?? analysis.nome_completo;
  const dataGeracao = formatDate(analysis.completed_at ?? analysis.created_at);
  const dataNascimentoSocio = formatDate(analysis.data_nascimento);

  const letrasNome = nomeParaExibir
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');

  // 5 números da empresa — do melhor nome + destino do sócio
  const nums = [
    { label: 'Expressão', sublabel: 'O Magnetismo', value: melhorNome?.expressao ?? analysis.numero_expressao, icon: '✦' },
    { label: 'Destino', sublabel: 'O Chamado', value: freqData?.destinoSocio ?? analysis.numero_destino, icon: '◈' },
    { label: 'Motivação', sublabel: 'A Essência', value: melhorNome?.motivacao ?? analysis.numero_motivacao, icon: '♡' },
    { label: 'Missão', sublabel: 'O Propósito', value: melhorNome?.missao ?? analysis.numero_missao, icon: '◎' },
    { label: 'Impressão', sublabel: 'A Marca', value: melhorNome?.impressao ?? analysis.numero_impressao, icon: '◉' },
  ];

  const debitos = Array.isArray(analysis.debitos_carmicos) ? analysis.debitos_carmicos : [];
  const licoes = Array.isArray(analysis.licoes_carmicas) ? analysis.licoes_carmicas : [];
  const tendencias = Array.isArray(analysis.tendencias_ocultas) ? analysis.tendencias_ocultas : [];
  const frequencias: Record<string, number> | null =
    (freqData?.frequencias ?? null);

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

  const nomesCandidatos: any[] = freqData?.nomesCandidatos ?? [];
  const hasKarma =
    (freqData?.melhorNome?.debitosCarmicos?.length > 0) ||
    (freqData?.melhorNome?.licoesCarmicas?.length > 0) ||
    debitos.length > 0 ||
    licoes.length > 0 ||
    tendencias.length > 0;

  return (
    <Document title={`Nome Magnetico — ${nomeParaExibir}`} author="Nome Magnetico">

      {/* ── PÁGINA 1: CAPA ────────────────────────────────────────────────── */}
      <PDFCover
        theme={theme}
        nomeParaExibir={nomeParaExibir}
        dataNascimento={dataNascimentoSocio}
        dataGeracao={dataGeracao}
        logoSrc={logoSrc}
        logoFont={LOGO_FONT}
        titleFont={TITLE_FONT}
      />

      {/* ── PÁGINA INTRODUTÓRIA: GUIA DE LEITURA ────────────────────────── */}
      <PDFStandardIntro theme={theme} productType="nome_empresa" entityName={analysis.nome_completo} />

      {/* ── PÁGINA 2: SINERGIA + MELHOR NOME + 5 NÚMEROS ─────────────────── */}
      <Page size="A4" style={styles.page}>
        <PDFPageHeader subtitle={`${analysis.nome_completo} — Análise de Nome Empresarial`} />

        <Text style={styles.hugeTitle}>A Alquimia do Negócio</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O Nome como Ativo Estratégico</Text>
          <Text style={styles.bodyText}>
            No mundo dos negócios, um nome é muito mais do que uma marca: é um organismo vibratório que dita o ritmo do crescimento, a facilidade de vendas e a resiliência da operação. Desde as grandes corporações até os novos empreendimentos, a frequência sonora e numérica de uma marca atua como um campo de atração para clientes, parceiros e talentos. A Numerologia Cabalística Aplicada ao Business revela se o nome escolhido está "trabalhando" a favor do lucro ou se carrega bloqueios que geram estagnação. Este relatório é o seu mapa tático para alinhar a alma do negócio com o destino de sucesso dos sócios, criando uma marca magnética que não apenas ocupa espaço no mercado, mas domina a sua categoria.
          </Text>
        </View>

        {/* Sinergia Sócio-Empresa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sinergia Sócio-Empresa</Text>
          <Text style={{ ...styles.bodyText, marginBottom: 16 }}>
            Uma empresa nasce da intenção de seus fundadores. O sucesso sustentável ocorre quando o Destino da Empresa está em harmonia com o Destino dos Sócios. Quando essas frequências divergem, o empreendedor sente que "carrega o piano nas costas". Quando convergem, o negócio ganha tração natural.
          </Text>
          <View style={styles.sinergiaRow}>
            <View style={[styles.sinergiaCard, { borderColor: PRIMARY }]}>
              <Text style={styles.sinergiaLabel}>DESTINO DO SÓCIO PRINCIPAL</Text>
              <Text style={[styles.sinergiaNumber, { color: PRIMARY }]}>
                {freqData?.destinoSocio ?? analysis.numero_destino ?? '?'}
              </Text>
              <Text style={styles.sinergiaMeta}>
                {freqData?.nomeSocioPrincipal ?? analysis.nome_completo}
              </Text>
            </View>
            {freqData?.nomeSocio2 && freqData?.destinoSocio2 != null && (
              <View style={[styles.sinergiaCard, { borderColor: '#a78bfa' }]}>
                <Text style={styles.sinergiaLabel}>DESTINO DO 2º SÓCIO</Text>
                <Text style={[styles.sinergiaNumber, { color: '#7c3aed' }]}>{freqData.destinoSocio2}</Text>
                <Text style={styles.sinergiaMeta}>{freqData.nomeSocio2}</Text>
              </View>
            )}
            {freqData?.destinoEmpresa != null && (
              <View style={[styles.sinergiaCard, { borderColor: ACCENT }]}>
                <Text style={styles.sinergiaLabel}>DESTINO DA EMPRESA</Text>
                <Text style={[styles.sinergiaNumber, { color: ACCENT }]}>{freqData.destinoEmpresa}</Text>
                <Text style={styles.sinergiaMeta}>Fundação</Text>
              </View>
            )}
          </View>
        </View>

        {/* Estrela dos 5 números (engenharia da escala) */}
        <View style={styles.section} minPresenceAhead={300} wrap={false}>
          <Text style={styles.sectionTitle}>A Engenharia da Escala</Text>
          <Text style={{ ...styles.bodyText, marginBottom: 16 }}>
            Para que uma empresa escale, ela precisa de engrenagens perfeitamente ajustadas. Na metodologia Nome Magnético, traduzimos os 5 números fundamentais em Eixos de Tração. Cada número atua como um motor: um atrai o cliente, outro sustenta a cultura, e um terceiro define o valor no mercado. Quando alinhados, o crescimento deixa de ser esforço e se torna consequência matemática da frequência.
          </Text>
          
          <PDFNumbersCorporate nums={{
            expressao: melhorNome?.expressao ?? analysis.numero_expressao,
            destino: freqData?.destinoSocio ?? analysis.numero_destino,
            motivacao: melhorNome?.motivacao ?? analysis.numero_motivacao,
            missao: melhorNome?.missao ?? analysis.numero_missao,
            impressao: melhorNome?.impressao ?? analysis.numero_impressao
          }} />
        </View>

        {/* Melhor nome */}
        {melhorNome && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nome Mais Indicado</Text>
            <Text style={{ ...styles.bodyText, marginBottom: 14 }}>
              O nome em destaque obteve o maior Score Numerológico geral, combinando uma vibração isenta de bloqueios limitantes com a melhor sinergia direcional entre a energia do empreendedor e o chamado corporativo. Esta é a assinatura comercial estrategicamente recomendada para estruturar vendas, atrair boas parcerias e posicionar a marca com autoridade.
            </Text>
            <View style={[styles.melhorNomeBox, { borderColor: PRIMARY }]} wrap={false}>
              <Text style={styles.melhorNomeTitle}>{melhorNome.nomeEmpresa}</Text>

              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Score Numerológico</Text>
                <Text style={[styles.scoreValue, { color: scoreColor(melhorNome.score) }]}>
                  {melhorNome.score}/100
                </Text>
              </View>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, {
                  width: `${Math.min(100, melhorNome.score)}%`,
                  backgroundColor: scoreColor(melhorNome.score),
                }]} />
              </View>

              <View style={[styles.compatBox, {
                backgroundColor: melhorNome.compatibilidadeSocio === 'total' ? '#ECFDF5' : '#F0F6FF',
              }]}>
                <Text style={[styles.compatText, { color: compatColor(melhorNome.compatibilidadeSocio) }]}>
                  Compatibilidade com Sócio: {compatLabel(melhorNome.compatibilidadeSocio)}
                </Text>
              </View>

              {melhorNome.compatibilidadeEmpresa != null && (
                <View style={[styles.compatBox, {
                  backgroundColor: melhorNome.compatibilidadeEmpresa === 'total' ? '#ECFDF5' : '#F0F6FF',
                }]}>
                  <Text style={[styles.compatText, { color: compatColor(melhorNome.compatibilidadeEmpresa) }]}>
                    Compatibilidade com Empresa: {compatLabel(melhorNome.compatibilidadeEmpresa)}
                  </Text>
                </View>
              )}

              <Text style={[styles.bloqueioStatus, { color: melhorNome.temBloqueio ? '#DC2626' : '#059669' }]}>
                {melhorNome.temBloqueio
                  ? `${melhorNome.bloqueios?.length ?? 1} bloqueio(s) detectado(s)`
                  : 'Sem bloqueios energéticos'}
              </Text>
            </View>
          </View>
        )}

        <PDFFooter />
      </Page>

      {/* ── PÁGINA 3: ESTUDO DOS CANDIDATOS ──────────────────────────────── */}
      {nomesCandidatos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${analysis.nome_completo} — Estudo dos Nomes Candidatos`} />
          <Text style={styles.hugeTitle}>O Ranking de Ouro</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>O Ranking da Escolha de Ouro</Text>
            <Text style={{ ...styles.bodyText, marginBottom: 12, lineHeight: 1.5 }}>
              Analisamos cada variação de nome enviada para filtrar aquela que possui a menor carga de bloqueios e a maior ressonância com o mercado. O nome marcado como RECOMENDADO é aquele que matematicamente oferece a menor resistência ao crescimento e a maior facilidade de fluxo financeiro.
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
                      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: isTop ? DARK : '#374151' }}>{c.nomeEmpresa}</Text>
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
                    <Text style={{ fontSize: 9, color: compatColor(c.compatibilidadeSocio) }}>
                      Sócio: {compatLabel(c.compatibilidadeSocio)}
                    </Text>
                    {c.compatibilidadeEmpresa != null && (
                      <Text style={{ fontSize: 9, color: compatColor(c.compatibilidadeEmpresa) }}>
                        Empresa: {compatLabel(c.compatibilidadeEmpresa)}
                      </Text>
                    )}
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

      {/* ── PÁGINA 4: OS 4 TRIÂNGULOS ─────────────────────────────────────── */}
      {hasTriangulos && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — Os 4 Triângulos Numerológicos`} />

          <Text style={styles.hugeTitle}>Geometria do Crescimento</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>A Geometria Sagrada no Business</Text>
            <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
              Os Quatro Triângulos Numerológicos formam a anatomia vibratória e a estrutura arquitetônica do nome da sua empresa. Na Numerologia Cabalística, o nome da marca funciona como um campo de atração contínuo: cada vez que é pronunciado, escrito ou veiculado, ele irradia uma frequência de posicionamento. Para compreender a real profundidade e as nuances dessa frequência no mercado, dividimos o estudo do nome corporativo em quatro "Pirâmides de Fluxo", onde cada camada mapeia um aspecto diferente do seu negócio.
            </Text>
            <Text style={{ ...styles.bodyText, marginBottom: 16 }}>
              A leitura desses triângulos funciona de forma sequencial e estratégica. Eles desdobram as influências desde a fundação financeira e vital da empresa, passando pelo seu universo de cultura interna, pela forma como o mercado externo a posicionará, até culminar no propósito corporativo maior que ela inevitavelmente alcançará. A seguir, detalharemos cada uma dessas quatro engrenagens essenciais.
            </Text>

            {([
              {
                data: tVida,
                key: 'Triângulo da Vida',
                desc: 'O Triângulo da Vida revela a vibração primária que o nome empresarial projeta ao mundo. Ele dita a primeira impressão que clientes, parceiros e o mercado formam sobre a marca no momento do contato — é a energia de fachada que abre ou fecha portas antes mesmo de qualquer apresentação. Bloqueios aqui agem como ruídos visuais que repelem oportunidades e comprometem a credibilidade orgânica do negócio.',
              },
              {
                data: tPessoal,
                key: 'Triângulo Pessoal',
                desc: 'O Triângulo Pessoal mapeia a dimensão íntima do negócio: a cultura interna, os valores não declarados e a forma como os sócios, colaboradores e o time fundador vivenciam a empresa no dia a dia. Ele revela se o ambiente interno tem coesão vibracional para sustentar crescimento a longo prazo ou se carrega tensões que fragmentam a equipe. Harmonia neste triângulo é o alicerce invisível da consistência operacional.',
              },
              {
                data: tSocial,
                key: 'Triângulo Social',
                desc: 'O Triângulo Social governa o posicionamento de mercado e o magnetismo relacional do nome. Ele determina como clientes, concorrentes, fornecedores e a mídia percebem e descrevem espontaneamente esta marca — sem que a empresa precise explicar. Um triângulo social limpo gera autoridade percebida, facilita parcerias estratégicas e reduz o esforço necessário para conquistar confiança no mercado.',
              },
              {
                data: tDestino,
                key: 'Triângulo do Destino',
                desc: 'O Triângulo do Destino aponta para o propósito máximo e o legado que este nome empresarial foi criado para construir. Ele traça a trajetória de longo prazo do negócio, revelando em quais ciclos a empresa encontrará seus maiores alavancamentos e onde as forças do mercado conspirarão naturalmente a seu favor. É a bússola numerológica que confirma — ou questiona — se o nome está alinhado com a missão maior dos seus fundadores.',
              },
            ] as const).filter(t => t.data != null).map(({ data, key, desc }) => {
              return (
                <View key={key} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#a78bfa', marginBottom: 6 }}>{key}</Text>
                  <Text style={{ fontSize: 10, color: GRAY, marginBottom: 8, lineHeight: 1.6 }}>{desc}</Text>
                  <TrianguloPiramideInline data={data!} label={key} cellSize={triCellSize} letras={letrasNome} />
                </View>
              );
            })}
          </View>

          <PDFFooter />
        </Page>
      )}



      {/* ── PÁGINA 5: KARMA EMPRESARIAL ───────────────────────────────────── */}
      {hasKarma && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${analysis.nome_completo} — O Peso do Passado`} />

          <View>
            <Text style={styles.hugeTitle}>O Peso do Passado (Karma e Tendências)</Text>

            {(freqData?.melhorNome?.debitosCarmicos?.length > 0 || debitos.length > 0) && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#D97706', borderBottomColor: '#D97706' }]}>
                  Débitos Kármicos
                </Text>
                <Text style={{ ...styles.bodyText, marginBottom: 6 }}>
                  Os Débitos Kármicos de uma empresa espelham os padrões não resolvidos do empreendedor fundador. Na numerologia cabalística, nenhum empreendimento nasce sem herdar parte da bagagem vibracional de quem o criou. Esses padrões — que podem se manifestar como ciclos repetitivos de inadimplência, conflitos societários, dificuldades de expansão ou rotatividade de talentos — só se dissolvem quando reconhecidos e trabalhados com ação consciente. Identificá-los aqui é o primeiro passo para transformar a empresa num veículo de cura e prosperidade genuína.
                </Text>
                <DebitosBlock debitos={freqData?.melhorNome?.debitosCarmicos ?? debitos} />
              </View>
            )}

            {(freqData?.melhorNome?.licoesCarmicas?.length > 0 || licoes.length > 0) && (
              <View style={{ ...styles.section, marginTop: 0 }}>
                <Text style={[styles.sectionTitle, { color: '#7c3aed', borderBottomColor: '#7c3aed' }]}>
                  Lições Kármicas — Competências a Desenvolver
                </Text>
                <Text style={{ ...styles.bodyText, marginBottom: 6 }}>
                  As Lições Kármicas apontam para as frequências numéricas ausentes na composição do nome escolhido. No contexto empresarial, elas revelam exatamente quais competências estratégicas, perfis de liderança ou áreas de gestão a empresa precisará desenvolver conscientemente para superar seus pontos de vulnerabilidade. São os "quartos vazios" do edifício corporativo — não para paralisar, mas para que o empreendedor saiba onde investir em mentorias, parceiros e capacitação com urgência calculada.
                </Text>
                <LicoesBlock licoes={freqData?.melhorNome?.licoesCarmicas ?? licoes} />
              </View>
            )}

            {/* Tendências Ocultas — sempre renderiza (mostra gráfico + estado vazio se não houver tendências) */}
            <View style={{ ...styles.section, marginTop: 0 }}>
              <Text style={[styles.sectionTitle, { color: '#6d28d9', borderBottomColor: '#6d28d9' }]}>
                Tendências Ocultas — Forças em Excesso
              </Text>
              <Text style={{ ...styles.bodyText, marginBottom: 6 }}>
                As Tendências Ocultas revelam as forças numéricas que se repetem em grande intensidade nas letras do nome empresarial. No negócio, essas forças amplificadas constroem vantagens competitivas extraordinárias — mas quando não gerenciadas, podem se tornar pontos cegos que distorcem decisões, criam dependência excessiva de uma única estratégia ou afastam parceiros pela intensidade da vibração dominante. Conhecê-las permite ao empreendedor canalizar esse excesso de forma estratégica e sustentável.
              </Text>
              <TendenciasBlock tendencias={tendencias} frequencias={frequencias} />
            </View>
          </View>

          <PDFFooter />
        </Page>
      )}

      {/* ── PÁGINA(S) 6+: ANÁLISE IA COMPLETA ───────────────────────────── */}
      {analiseCorpo && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — Análise da Empresa`} />
          <View style={styles.section}>
            <Text style={styles.hugeTitle}>O Diagnóstico da Marca</Text>
            <RenderMarkdownChunks
              text={analiseCorpo}
              styles={styles}
              GOLD={PRIMARY}
              triangleMap={triangleMap}
              triCellSize={triCellSize}
              letrasNome={letrasNome}
            />
          </View>
          <PDFFooter />
        </Page>
      )}

      {/* ── CONCLUSÃO ─────────────────────────────────────────────────────── */}
      {conclusaoTexto && conclusaoTexto.length > 100 && (
        <Page size="A4" style={styles.page}>
          <PDFPageHeader subtitle={`${nomeParaExibir} — Direcionamento Estratégico`} />
          <View style={styles.conclusaoCard}>
            <RenderMarkdownChunks text={conclusaoTexto} styles={styles} GOLD={PRIMARY} />
          </View>
          <PDFFooter />
        </Page>
      )}
    </Document>
  );
}
