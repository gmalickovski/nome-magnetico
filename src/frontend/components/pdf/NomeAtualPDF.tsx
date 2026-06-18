/**
 * NomeAtualPDF — documento PDF da análise Gratuita (Nome Atual).
 *
 * Estrutura de páginas:
 *   1. Capa
 *   2+. A Essência — O Nome de Nascimento Original
 *       - Banner do nome + O Som do Seu Nascimento
 *       - Destino card + 4 cards de números + Detalhamento dos 5 números
 *       - Os 4 Triângulos completos (Vida, Pessoal, Social, Destino) com Arcanos e Bloqueios
 *       - O Peso do Passado: Débitos, Lições e Tendências Ocultas
 *   N-2. O Diagnóstico É Claro (fundo escuro)
 *   N-1. Ação Imediata: O Escudo Provisório (fundo escuro)
 *   N. CTA / Oferta para a Harmonização (Nome Social)
 */
import { Document, Page, View, Text, StyleSheet, Link } from '@react-pdf/renderer';
import { THEME_NOME_ATUAL } from './shared/PDFTheme';
import { PDFCover } from './shared/PDFCover';
import { PDFPageHeader } from './shared/PDFPageHeader';
import { PDFFooter } from './shared/PDFFooter';
import { TrianguloPiramideInline } from './shared/PDFMarkdownRenderer';
import { BloqueiosBlock, DebitosBlock, LicoesBlock, TendenciasBlock } from './shared/PDFKarmicBlock';
import { PDFArcanosBlock } from './shared/PDFArcanosBlock';
import { LOGO_FONT, TITLE_FONT, BODY_FONT, BODY_FONT_BOLD, loadLogoSrc, formatDate } from './shared/PDFFonts';
import { formatAnalysisText } from '../../../utils/textFormatter';
import type { ProductPDFProps } from './shared/PDFTypes';
import { getArcano } from '../../../backend/numerology/arcanos';
import { calcularScore } from '../../../backend/numerology/score';
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

const theme = THEME_NOME_ATUAL;

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
    color: DARK,
  },
  // Seção A Essência — fundo branco, cabeçalho rosado
  pageEssencia: {
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

export function NomeAtualPDF({ analysis, magneticNames: _magneticNames, userName: _userName }: ProductPDFProps) {
  const logoSrc = loadLogoSrc();
  const freqData = analysis.frequencias_numeros as any;
  const nomeParaExibir = analysis.nome_completo;
  const nomeNascimento = analysis.nome_completo;
  const dataNascimento = formatDate(
    freqData?.ranking?.dataNascimento ?? analysis.data_nascimento
  );
  const dataGeracao = formatDate(analysis.completed_at ?? analysis.created_at);

  // ── Dados calculados em tempo real a partir do nome de nascimento ──────────
  const dataNascimentoRaw = freqData?.ranking?.dataNascimento ?? analysis.data_nascimento ?? '';
  const cincoNumNasc = calcularCincoNumeros(nomeNascimento, dataNascimentoRaw);
  const triangulosNasc = calcularTodosTriangulos(nomeNascimento, dataNascimentoRaw);
  const bloqueios = detectarBloqueios(triangulosNasc);
  const tVida    = triangulosNasc.vida;
  const tPessoal = triangulosNasc.pessoal;
  const tSocial  = triangulosNasc.social;
  const tDestino = triangulosNasc.destino;
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
  const baseLen = Math.max(
    tVida?.linhas[0]?.length ?? 1,
    tPessoal?.linhas[0]?.length ?? 1,
    tSocial?.linhas[0]?.length ?? 1,
    tDestino?.linhas[0]?.length ?? 1,
  );
  const triCellSize = Math.min(18, Math.max(5, Math.floor(TRIANGLE_FULL_WIDTH / baseLen) - 1));

  // ── Score (para a CTA final) ──────────────────────────────────────────────
  const storedScore = normalizeScore(analysis.score);
  const fallbackScore =
    storedScore == null && cincoNumNasc.expressao != null && cincoNumNasc.destino != null
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
          compatibilidade: avaliarCompatibilidade(cincoNumNasc.expressao, cincoNumNasc.destino),
        })
      : null;
  const rawScore = storedScore ?? fallbackScore;
  type ScoreNivel = 'baixo' | 'aceitavel' | 'excelente' | null;
  const scoreNivel: ScoreNivel =
    rawScore == null ? null
      : rawScore >= 80 ? 'excelente'
        : rawScore >= 50 ? 'aceitavel'
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

      {/* ═══════════════════════════════════════════════════════════════════════
       *  SEÇÃO: A ESSÊNCIA — O Nome de Nascimento Original
       *  (Bloco completo — idêntico à seção "A Essência" do NomeSocialPDF)
       * ═══════════════════════════════════════════════════════════════════════ */}
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

        {/* "O Som do Seu Nascimento" */}
        <View style={{ marginTop: 20, marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>
            O Som do Seu Nascimento
          </Text>
          <Text style={styles.bodyText}>
            "Este é o código vibracional que o universo registrou no instante do seu primeiro fôlego. Seu nome de nascimento não é um erro; ele é a sua Semente de Essência. Nele, estão gravadas as memórias da sua árvore genealógica, os talentos brutos que você veio lapidar e a missão que sua alma aceitou cumprir. Ele é a sua base inabalável, a nota fundamental da melodia da sua vida que nunca deixará de soar."
          </Text>
        </View>

        {/* O Papel da Frequência Original */}
        <View style={{ backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 8, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, color: '#8A661C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            O Papel da Frequência Original
          </Text>
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.7 }}>
            O nome de nascimento é o motor interno da sua jornada — ele emana qualidades permanentes, inscritas antes mesmo de qualquer escolha consciente. Esses talentos brutos são genuínos e poderosos, mas por serem energia pura e não lapidada, podem atrair interferências que se manifestam como bloqueios: padrões em loop que drenam o que você planta antes de colher. É exatamente para organizar essa frequência que a Harmonização de Assinatura existe — não para apagar quem você é, mas para que a sua essência originária possa fluir sem obstáculos.
          </Text>
        </View>

        {/* ── O Destino: A Estrada Imutável ── */}
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
              Calculado a partir da data de nascimento, o Destino representa a trilha que sua alma escolheu antes de receber um nome. Não pode ser alterado por nenhuma prática ou mudança de nome — está gravado no tecido do tempo. A Harmonização de Assinatura não altera o Destino; ela organiza o campo vibracional para que a jornada rumo a ele aconteça com menos resistência e mais fluidez.
            </Text>
          </View>
        </View>

        {/* ── Os 4 números do nome de nascimento ── */}
        <View wrap={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
            <Text style={{ fontSize: 9, color: '#8A661C', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 10 }}>
              Os Números do Nome
            </Text>
            <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
          </View>
          <Text style={{ fontSize: 9, color: GRAY, lineHeight: 1.55, marginBottom: 12 }}>
            Derivados das letras do nome de nascimento, estes quatro números revelam as qualidades inatas, os dons, a percepção externa e a vocação que estão codificados na semente original. Diferente do Destino, eles respondem à vibração das letras — e podem ser reorganizados pela Harmonização de Assinatura.
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

        {/* ── Detalhamento dos 5 Números do Nome ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 12 }} wrap={false}>
          <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
          <Text style={{ fontSize: 8, color: '#8A661C', fontFamily: BODY_FONT_BOLD, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 10 }}>
            Detalhamento dos 5 Números do Nome
          </Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: GOLD, opacity: 0.4 }} />
        </View>

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
      {(tVida || tPessoal || tSocial || tDestino) && (
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
          {tVida && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#C89000', borderBottomColor: '#C89000', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo da Vida (Nascimento)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#C89000' }}>[Saúde, Vitalidade e Prosperidade Material]</Text> — Este triângulo representa a fundação física e energética mais profunda da sua existência terrena. Calculado a partir do valor puro de cada letra do seu nome de nascimento, sem qualquer interferência externa, ele revela o fluxo contínuo da sua força vital primordial. Governa a saúde do seu corpo físico, sua imunidade energética e sua relação essencial com a abundância material e financeira. É o solo de onde brotam a sua resiliência e a sua capacidade de se sustentar com firmeza na matéria.
              </Text>
              <TrianguloPiramideInline data={tVida} label="TRIÂNGULO DA VIDA" cellSize={triCellSize} letras={letrasNomeBatismo} />
              {tVida.arcanoRegente != null && (() => {
                const arc = getArcano(tVida.arcanoRegente!);
                const arcAtual = tVida.arcanoAtual?.numero ? getArcano(tVida.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock
                    title="Arcanos do Triângulo da Vida"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={tVida.arcanosDePassagem}
                    arcanoAtual={tVida.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueios.filter((b: any) => b.triangulos?.includes('vida')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo da Vida
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueios.filter((b: any) => b.triangulos?.includes('vida'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="vida" />
                  <Text style={{ fontSize: 8, color: '#7C3AED', marginTop: 8, fontStyle: 'italic' }}>
                    * A Harmonização de Assinatura reorganiza essas sequências, eliminando os padrões de resistência neste triângulo.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO PESSOAL ─── */}
          {tPessoal && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#7C3AED', borderBottomColor: '#7C3AED', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo Pessoal (Nascimento)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#7C3AED' }}>[Mundo Íntimo, Emoções e Relacionamentos Próximos]</Text> — Esta dimensão penetra no santuário mais reservado da sua alma, ativada e moldada pelo dia exato do seu nascimento. Ela governa a sua inteligência emocional, a forma como você processa sentimentos íntimos em segredo, sua tolerância a pressões internas e a dinâmica com os seus entes mais próximos. Quando existem bloqueios nesta pirâmide de origem, a vida afetiva tende a repetir ciclos e roteiros repetitivos de frustração ou incompreensão, atuando como espelhos de conflitos internos ainda não resolvidos.
              </Text>
              <TrianguloPiramideInline data={tPessoal} label="TRIÂNGULO PESSOAL" cellSize={triCellSize} letras={letrasNomeBatismo} />
              {tPessoal.arcanoRegente != null && (() => {
                const arc = getArcano(tPessoal.arcanoRegente!);
                const arcAtual = tPessoal.arcanoAtual?.numero ? getArcano(tPessoal.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock
                    title="Arcanos do Triângulo Pessoal"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={tPessoal.arcanosDePassagem}
                    arcanoAtual={tPessoal.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueios.filter((b: any) => b.triangulos?.includes('pessoal')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo Pessoal
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueios.filter((b: any) => b.triangulos?.includes('pessoal'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="pessoal" />
                  <Text style={{ fontSize: 8, color: '#7C3AED', marginTop: 8, fontStyle: 'italic' }}>
                    * A Harmonização de Assinatura reorganiza essas sequências, eliminando os padrões de resistência neste triângulo.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO SOCIAL ─── */}
          {tSocial && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#059669', borderBottomColor: '#059669', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo Social (Nascimento)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#059669' }}>[Carreira, Visibilidade Pública e Magnetismo Social]</Text> — Esta pirâmide irradia a sua assinatura vibracional para o mundo externo, moldada pela influência do mês do seu nascimento. Ela governa a forma como a sociedade te percebe, o carisma que você emana em ambientes públicos e as oportunidades profissionais que você atrai ou repele. É a frequência que determina a sua reputação, a sua capacidade de vendas, parcerias profissionais e o reconhecimento do seu talento pelo coletivo. Bloqueios aqui geram invisibilidade, sabotagem profissional ou dificuldades de comunicação com o público.
              </Text>
              <TrianguloPiramideInline data={tSocial} label="TRIÂNGULO SOCIAL" cellSize={triCellSize} letras={letrasNomeBatismo} />
              {tSocial.arcanoRegente != null && (() => {
                const arc = getArcano(tSocial.arcanoRegente!);
                const arcAtual = tSocial.arcanoAtual?.numero ? getArcano(tSocial.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock
                    title="Arcanos do Triângulo Social"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={tSocial.arcanosDePassagem}
                    arcanoAtual={tSocial.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueios.filter((b: any) => b.triangulos?.includes('social')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo Social
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueios.filter((b: any) => b.triangulos?.includes('social'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="social" />
                  <Text style={{ fontSize: 8, color: '#7C3AED', marginTop: 8, fontStyle: 'italic' }}>
                    * A Harmonização de Assinatura reorganiza essas sequências, eliminando os padrões de resistência neste triângulo.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ─── TRIÂNGULO DO DESTINO ─── */}
          {tDestino && (
            <View>
              <Text style={[styles.sectionTitle, { color: '#D97706', borderBottomColor: '#D97706', fontSize: 13, marginBottom: 8, marginTop: 24 }]}>
                O Triângulo do Destino (Nascimento)
              </Text>
              <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 10 }}>
                <Text style={{ fontFamily: BODY_FONT_BOLD, color: '#D97706' }}>[Propósito, Realização Concreta e Legado Eterno]</Text> — A pirâmide mais reveladora e soberana de toda a sua jornada terrestre. Ela entrelaça de forma divina a totalidade do seu nome com as coordenadas do seu nascimento (dia + mês reduzidos). Este triângulo governa a colheita prática da sua jornada: a materialização física dos seus esforços, a execução do seu propósito de alma e o legado indelével que você construirá no tempo. Quando há bloqueios nesta área, você pode sentir que despende uma quantidade colossal de energia no trabalho sem nunca alcançar os frutos correspondentes na realidade material.
              </Text>
              <TrianguloPiramideInline data={tDestino} label="TRIÂNGULO DO DESTINO" cellSize={triCellSize} letras={letrasNomeBatismo} />
              {tDestino.arcanoRegente != null && (() => {
                const arc = getArcano(tDestino.arcanoRegente!);
                const arcAtual = tDestino.arcanoAtual?.numero ? getArcano(tDestino.arcanoAtual.numero) : null;
                return (
                  <PDFArcanosBlock
                    title="Arcanos do Triângulo do Destino"
                    titleColor="#7C3AED"
                    arcanoRegente={arc}
                    arcanosDePassagem={tDestino.arcanosDePassagem}
                    arcanoAtual={tDestino.arcanoAtual}
                    arcanoAtualDescricao={arcAtual ? arcAtual.descricao : undefined}
                  />
                );
              })()}
              {bloqueios.filter((b: any) => b.triangulos?.includes('destino')).length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: '#DC2626', borderBottomColor: '#DC2626', fontSize: 11, marginBottom: 8 }]}>
                    Bloqueios do Triângulo do Destino
                  </Text>
                  <BloqueiosBlock bloqueios={bloqueios.filter((b: any) => b.triangulos?.includes('destino'))} hideSaude={true} hideTriangulos={true} isNomeSocial={true} triangulo="destino" />
                  <Text style={{ fontSize: 8, color: '#7C3AED', marginTop: 8, fontStyle: 'italic' }}>
                    * A Harmonização de Assinatura reorganiza essas sequências, eliminando os padrões de resistência neste triângulo.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── SEÇÃO A ESSÊNCIA: O PESO DO PASSADO ───────────────────── */}
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
          <DebitosBlock debitos={debitos} />
        </View>

        {/* Lições Kármicas */}
        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#0369a1', borderBottomColor: '#0369a1', fontSize: 13 }]}>
            Lições Kármicas
          </Text>
          <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
            As Lições Kármicas são os "quartos vazios" da arquitetura energética: determinam exatamente quais virtudes estão ausentes no momento da encarnação. São traços não desenvolvidos em vidas anteriores — o Destino orquestrará desafios propositais para forçar o desenvolvimento dessas ferramentas ocultas.
          </Text>
          <LicoesBlock licoes={licoes} />
        </View>

        {/* Tendências Ocultas */}
        <View style={{ ...styles.section, marginTop: 0 }}>
          <Text style={[styles.sectionTitle, { color: '#6d28d9', borderBottomColor: '#6d28d9', fontSize: 13 }]}>
            Tendências Ocultas
          </Text>
          <Text style={{ ...styles.bodyText, marginBottom: 8 }}>
            As Tendências Ocultas emergem quando um número aparece quatro ou mais vezes no nome — um talento amplificado ao ponto de se tornar compulsão. O excesso incontrolado converte a habilidade primária em desequilíbrio, sabotando resultados a longo prazo. O mapeamento preciso dessas forças é o primeiro passo para direcioná-las conscientemente.
          </Text>
          <TendenciasBlock tendencias={tendencias} frequencias={frequencias} />
        </View>

        {/* Gancho sutil pós-karma */}
        <View wrap={false} style={{ backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: 8, padding: 14, marginTop: 4, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}>
          <Text style={{ fontSize: 9, color: '#8A661C', lineHeight: 1.65, textAlign: 'center', fontStyle: 'italic' }}>
            Débitos variáveis, lições kármicas e tendências ocultas podem ser amenizados ou eliminados quando a frequência vibracional do nome é reorganizada pela Harmonização de Assinatura — sem alterar quem você é, apenas como a energia do nome se expressa no mundo.
          </Text>
        </View>
      </View>

        <PDFFooter bgColor="#FEF2F2" />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
       *  PÁGINAS FINAIS — mantidas do PDF gratuito original
       * ═══════════════════════════════════════════════════════════════════════ */}

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
              {' '}detectado{bloqueios.length !== 1 ? 's' : ''} nos 4 triângulos do nome de nascimento — loops vibracionais ativos 24h/dia, independente de esforço ou força de vontade.
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
            {(escudoTexto || SUGESTOES_AMENIZAR[bloqueios[0].codigo]) && (
              <View style={{ backgroundColor: 'rgba(242, 202, 80, 0.1)', padding: 12, borderRadius: 6, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#f2ca50' }}>
                <Text style={{ fontSize: 10, color: '#f2ca50', fontFamily: BODY_FONT_BOLD, marginBottom: 6 }}>Ação Recomendada (Próximas 72h):</Text>
                <Text style={{ fontSize: 10, color: '#e5e2e1', lineHeight: 1.5, marginBottom: escudoTexto ? 0 : 6 }}>
                  {escudoTexto
                    ? escudoTexto
                    : `Para neutralizar provisoriamente essa vibração e restabelecer o equilíbrio do seu campo, você pode adotar atitudes práticas imediatas. Escolha pelo menos uma das ações abaixo para aplicar nos próximos dias:`
                  }
                </Text>
                {!escudoTexto && (SUGESTOES_AMENIZAR[bloqueios[0].codigo] || []).map((sugestao, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, paddingLeft: 4 }}>
                    <Text style={{ color: '#f2ca50', fontSize: 9, marginRight: 6, marginTop: 1 }}>✦</Text>
                    <Text style={{ fontSize: 9.5, color: '#e5e2e1', lineHeight: 1.45, flex: 1 }}>{sugestao}</Text>
                  </View>
                ))}
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
                <Text style={{ fontSize: 8, color: GOLD, fontFamily: BODY_FONT_BOLD, marginBottom: 2 }}>{'> Comparativo completo dos 4 triângulos'}</Text>
                <Text style={{ fontSize: 7, color: '#9CA3AF' }}>Nascimento vs. Harmonizado lado a lado</Text>
              </View>
              <View>
                <Text style={{ fontSize: 8, color: GOLD, fontFamily: BODY_FONT_BOLD, marginBottom: 2 }}>{'> Variações de assinatura sem bloqueios'}</Text>
                <Text style={{ fontSize: 7, color: '#9CA3AF' }}>Score acima de 70 garantido</Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <View>
                <Text style={{ fontSize: 8, color: GOLD, fontFamily: BODY_FONT_BOLD, marginBottom: 2 }}>{'> Todos os arcanos reorganizados'}</Text>
                <Text style={{ fontSize: 7, color: '#9CA3AF' }}>Novas forças governando cada dimensão</Text>
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
