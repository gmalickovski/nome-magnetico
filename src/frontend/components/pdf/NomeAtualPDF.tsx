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

const theme = THEME_NOME_ATUAL;

const GOLD = theme.primaryColor;
const GRAY = '#4B5563';
const LIGHT_GRAY = '#E5E7EB';
const DARK = '#131313';

// ── Mapas de texto por número de Destino / Expressão ─────────────────────────

const DESTINO_TITULO: Record<number, string> = {
  1: 'Liderança e Autonomia',
  2: 'Parceria e Equilíbrio',
  3: 'Criatividade e Expressão',
  4: 'Estrutura e Estabilidade',
  5: 'Liberdade e Transformação',
  6: 'Harmonia e Cuidado',
  7: 'Sabedoria e Introspecção',
  8: 'Prosperidade e Poder',
  9: 'Compaixão e Conclusão',
  11: 'Intuição e Iluminação',
  22: 'Construção e Manifestação',
};

const DESTINO_DESC: Record<number, string> = {
  1: 'A trilha da liderança e do pioneirismo. Você nasceu para inaugurar caminhos, tomar iniciativas e afirmar a sua individualidade com autenticidade. O maior desafio deste Destino é equilibrar autonomia com receptividade — a força de um precisa da escuta do outro.',
  2: 'A trilha da cooperação e do equilíbrio. Você nasceu para unir, mediar e construir pontes entre pessoas e ideias. Sua maior força está nas parcerias — mas o desafio é manter a própria voz enquanto harmoniza os outros.',
  3: 'A trilha da criatividade e da comunicação. Você nasceu para expressar, inspirar e iluminar o mundo com ideias e palavras. Quando este Destino está bloqueado, a voz se cala exatamente quando mais importa ser ouvido.',
  4: 'A trilha da construção e da disciplina. Você nasceu para erguer estruturas duradouras — negócios, família, legado. O desafio é sustentar o esforço além do ponto em que os resultados ainda não apareceram.',
  5: 'A trilha da liberdade e da adaptação. Você nasceu para experimentar, transformar e trazer o novo ao mundo. O desafio é converter a inquietação natural em movimento com direção, não em caos.',
  6: 'A trilha da responsabilidade e da harmonia. Você nasceu para cuidar, equilibrar e servir — família, comunidade, relacionamentos. O desafio é aprender que servir os outros começa por não se abandonar.',
  7: 'A trilha do conhecimento e da espiritualidade. Você nasceu para aprofundar, analisar e revelar o que está oculto. O desafio é trazer a sabedoria interior para o mundo sem se perder no isolamento.',
  8: 'A trilha da prosperidade e da autoridade. Você nasceu para administrar, construir e manifestar abundância. O desafio é exercer o poder com ética — nem a fuga, nem o abuso, mas o uso consciente.',
  9: 'A trilha da compaixão e do serviço universal. Você nasceu para encerrar ciclos, ajudar e elevar a consciência coletiva. O desafio é soltar o apego ao passado e confiar que encerrar é a forma mais nobre de amor.',
  11: 'A trilha da intuição e da iluminação. Número mestre que carrega responsabilidade espiritual elevada — você nasceu para inspirar e trazer visões que transcendem o ordinário. O desafio é sustentar a sensibilidade sem se perder na ansiedade.',
  22: 'A trilha da construção e da manifestação em grande escala. Número mestre que unifica o sonho e a realidade — você nasceu para construir o que poucos ousam imaginar. O desafio é transformar a visão em ação concreta, passo a passo.',
};

const EXPRESSAO_TITULO: Record<number, string> = {
  1: 'Liderança Natural',
  2: 'Diplomacia e Parceria',
  3: 'Expressão e Criatividade',
  4: 'Organização e Método',
  5: 'Versatilidade e Comunicação',
  6: 'Cuidado e Responsabilidade',
  7: 'Análise e Profundidade',
  8: 'Execução e Resultados',
  9: 'Generosidade e Visão',
  11: 'Inspiração e Sensibilidade',
  22: 'Visão e Manifestação',
};

/** Descrição personalizada por valor de Expressão */
const EXPRESSAO_DESC: Record<number, string> = {
  1:  'Sua expressão natural é de liderança e iniciativa — você se destaca quando toma o comando e abre caminhos que outros ainda não ousaram trilhar.',
  2:  'Sua expressão natural é de empatia e diplomacia — você se destaca quando cria conexões e harmoniza conflitos com sensibilidade e escuta ativa.',
  3:  'Sua expressão natural é de criatividade e carisma — você se destaca quando usa palavras, arte ou comunicação para inspirar e iluminar quem está ao seu redor.',
  4:  'Sua expressão natural é de método e confiabilidade — você se destaca quando precisa construir, organizar e entregar resultados sólidos com precisão.',
  5:  'Sua expressão natural é de versatilidade e adaptação — você se destaca quando traz movimento, inovação e novas perspectivas a ambientes estagnados.',
  6:  'Sua expressão natural é de harmonia e cuidado — você se destaca quando nutre, equilibra e cria ambientes seguros onde as pessoas se sentem acolhidas.',
  7:  'Sua expressão natural é de análise e profundidade — você se destaca quando precisa ir além da superfície e revelar o que outros não conseguem enxergar.',
  8:  'Sua expressão natural é de autoridade e execução — você se destaca quando lidera com visão prática, gerando resultados concretos e de grande escala.',
  9:  'Sua expressão natural é de humanidade e visão ampla — você se destaca quando serve a causas maiores do que você, com compaixão e generosidade genuína.',
  11: 'Sua expressão natural é de intuição e presença transformadora — você se destaca quando usa sua sensibilidade elevada para inspirar e transformar os que estão ao seu redor.',
  22: 'Sua expressão natural é de visão prática em grande escala — você se destaca quando transforma grandes sonhos em estruturas concretas que beneficiam muitas pessoas.',
};

/** Descrição personalizada por valor de Motivação (vogais — o que te move por dentro) */
const MOTIVACAO_DESC: Record<number, string> = {
  1:  'O que te move por dentro é o impulso de ser o primeiro — autonomia, protagonismo e inaugurar algo único são o combustível da sua alma.',
  2:  'O que te move por dentro é a necessidade de conexão — parceria, harmonia e sentir que faz parte de algo maior são o combustível da sua alma.',
  3:  'O que te move por dentro é a expressão criativa — criar, comunicar e inspirar são necessidades vitais; quando bloqueadas, geram vazio e estagnação interior.',
  4:  'O que te move por dentro é a construção — você precisa sentir que está edificando algo concreto e duradouro; o caos e a superficialidade te esgotam.',
  5:  'O que te move por dentro é a liberdade — explorar, experimentar e nunca ficar preso são necessidades da sua alma; rotinas rígidas te tolhem por dentro.',
  6:  'O que te move por dentro é o cuidado — você precisa sentir que protege, nutre e cria harmonia; quando o ambiente está em desequilíbrio, você não consegue descansar.',
  7:  'O que te move por dentro é a busca pela verdade — compreender em profundidade e encontrar sentido nas coisas são necessidades vitais da sua alma.',
  8:  'O que te move por dentro é o poder de manifestar — você precisa sentir que está construindo, conquistando e expandindo; a estagnação é seu maior inimigo interior.',
  9:  'O que te move por dentro é o serviço — você sente profunda necessidade de contribuir para algo maior do que si mesmo; quando age apenas para si, sente vazio.',
  11: 'O que te move por dentro é a missão — você sente uma chamada interior para inspirar e transformar; quando não encontra propósito elevado, a ansiedade toma conta.',
  22: 'O que te move por dentro é a manifestação em escala — você precisa sentir que está construindo algo grandioso; pequenas realizações não satisfazem sua alma.',
};

/** Descrição personalizada por valor de Impressão (consoantes — como o mundo te percebe) */
const IMPRESSAO_DESC: Record<number, string> = {
  1:  'A impressão que você passa ao mundo é de determinação e força — as pessoas te percebem como alguém que sabe o que quer e age com convicção antes mesmo de falar.',
  2:  'A impressão que você passa ao mundo é de sensibilidade e gentileza — as pessoas te percebem como alguém próximo, empático e de fácil aproximação.',
  3:  'A impressão que você passa ao mundo é de entusiasmo e criatividade — as pessoas te percebem como alguém leve, comunicativo e que ilumina o ambiente ao entrar.',
  4:  'A impressão que você passa ao mundo é de solidez e confiabilidade — as pessoas te percebem como alguém responsável, organizado e em quem se pode contar.',
  5:  'A impressão que você passa ao mundo é de energia e dinamismo — as pessoas te percebem como alguém inquieto, versátil e sempre em movimento.',
  6:  'A impressão que você passa ao mundo é de harmonia e responsabilidade — as pessoas te percebem como alguém equilibrado, atencioso e naturalmente cuidadoso.',
  7:  'A impressão que você passa ao mundo é de profundidade e reserva — as pessoas te percebem como alguém sério, analítico e que fala com substância quando escolhe falar.',
  8:  'A impressão que você passa ao mundo é de autoridade e segurança — as pessoas te percebem como alguém capaz, decidido e com presença que inspira respeito.',
  9:  'A impressão que você passa ao mundo é de generosidade e humanidade — as pessoas te percebem como alguém aberto, acolhedor e com visão além do próprio interesse.',
  11: 'A impressão que você passa ao mundo é de sensibilidade elevada e presença única — as pessoas te percebem como alguém diferente, intuitivo e com algo raro difícil de definir.',
  22: 'A impressão que você passa ao mundo é de grandiosidade e visão — as pessoas te percebem como alguém com capacidade de realizar coisas que a maioria apenas sonha.',
};

/** Descrição personalizada por valor de Missão (primeiro nome — campo de maior ressonância) */
const MISSAO_DESC: Record<number, string> = {
  1:  'Seu primeiro nome direciona seus dons para o pioneirismo — você encontra maior ressonância quando está inaugurando caminhos e sendo o responsável por dar início ao novo.',
  2:  'Seu primeiro nome direciona seus dons para a mediação — você encontra maior ressonância em contextos que exigem equilíbrio, parceria e construção de pontes entre pessoas.',
  3:  'Seu primeiro nome direciona seus dons para a expressão — você encontra maior ressonância quando pode criar, comunicar e inspirar com liberdade e criatividade.',
  4:  'Seu primeiro nome direciona seus dons para a estrutura — você encontra maior ressonância quando constrói, organiza e sustenta com método o que outros começaram.',
  5:  'Seu primeiro nome direciona seus dons para a transformação — você encontra maior ressonância quando pode romper padrões, inovar e trazer movimento ao que está estagnado.',
  6:  'Seu primeiro nome direciona seus dons para o cuidado — você encontra maior ressonância em contextos que envolvem nutrir, equilibrar e criar ambientes seguros.',
  7:  'Seu primeiro nome direciona seus dons para o conhecimento — você encontra maior ressonância quando pode aprofundar, investigar e revelar o que está oculto.',
  8:  'Seu primeiro nome direciona seus dons para a prosperidade — você encontra maior ressonância quando lidera, administra e manifesta resultados concretos em escala.',
  9:  'Seu primeiro nome direciona seus dons para o serviço — você encontra maior ressonância quando contribui para causas maiores e ajuda a encerrar ciclos com compaixão.',
  11: 'Seu primeiro nome direciona seus dons para a inspiração — você encontra maior ressonância quando atua como canal de transformação e consciência elevada.',
  22: 'Seu primeiro nome direciona seus dons para a manifestação em grande escala — você encontra maior ressonância quando constrói estruturas que transformam realidades coletivas.',
};

/** Vibração de cada número — usado em todos os cards de número */
const NUMERO_VIBRACAO: Record<number, string> = {
  1: 'Iniciativa e Autonomia',
  2: 'Sensibilidade e Mediação',
  3: 'Criatividade e Comunicação',
  4: 'Método e Construção',
  5: 'Versatilidade e Movimento',
  6: 'Harmonia e Cuidado',
  7: 'Análise e Profundidade',
  8: 'Poder e Abundância',
  9: 'Compaixão e Humanidade',
  11: 'Intuição e Inspiração',
  22: 'Visão e Manifestação',
};

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
                Harmonizar Minha Assinatura Agora →
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
