/**
 * PDFKarmicBlock — componentes de cards kármicos para injeção inline no PDF.
 *
 * Cada bloco é projetado para aparecer imediatamente após o heading correspondente
 * no texto da análise, co-localizando as informações gráficas com o texto explicativo.
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './PDFTheme';
import { obterInterpretacaoEspecifica } from '../../../../utils/blockageInterpretations';

const GOLD = PDF_COLORS.gold;
const GRAY = PDF_COLORS.gray;
const LIGHT_GRAY = PDF_COLORS.lightGray;

const styles = StyleSheet.create({
  sectionBlock: {
    marginTop: 6,
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  // Bloqueios
  bloqueioRow: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 11,
    marginBottom: 8,
    borderRadius: 6,
  },
  bloqueioTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#DC2626',
    marginBottom: 6,
  },
  bloqueioDesc: {
    fontSize: 10,
    color: GRAY,
    lineHeight: 1.4,
  },
  bloqueioSaude: {
    fontSize: 9,
    color: '#7f1d1d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  bloqueioTriangulos: {
    fontSize: 9,
    color: '#991b1b',
    marginTop: 4,
  },
  // Débitos
  debitoRow: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 11,
    marginBottom: 8,
    borderRadius: 6,
  },
  debitoRowVariable: {
    backgroundColor: '#F5F3FF',
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    padding: 11,
    marginBottom: 8,
    borderRadius: 6,
  },
  debitoTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#92400E',
    marginBottom: 6,
  },
  debitoTitleVariable: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#5B21B6',
    marginBottom: 6,
  },
  debitoDesc: {
    fontSize: 10,
    color: GRAY,
    lineHeight: 1.4,
  },
  debitoNoneBox: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    padding: 11,
    borderRadius: 6,
    marginBottom: 8,
  },
  debitoNoneText: {
    fontSize: 10,
    color: '#065F46',
  },
  // Lições
  licaoRow: {
    backgroundColor: 'rgba(56,189,248,0.06)',
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
    padding: 11,
    marginBottom: 8,
    borderRadius: 6,
  },
  licaoTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0369a1',
    marginBottom: 6,
  },
  licaoDesc: {
    fontSize: 10,
    color: GRAY,
    lineHeight: 1.4,
  },
  licaoNoneBox: {
    backgroundColor: 'rgba(56,189,248,0.06)',
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
    padding: 11,
    borderRadius: 6,
    marginBottom: 8,
  },
  licaoNoneText: {
    fontSize: 10,
    color: '#0369a1',
  },
  // Tendências
  tendenciaRow: {
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#a78bfa',
    padding: 11,
    marginBottom: 8,
    borderRadius: 6,
  },
  tendenciaTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#6d28d9',
    marginBottom: 6,
  },
  tendenciaDesc: {
    fontSize: 10,
    color: GRAY,
    lineHeight: 1.4,
  },
  tendenciaNoneBox: {
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#a78bfa',
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  tendenciaNoneText: {
    fontSize: 10,
    color: '#6d28d9',
  },
  // Frequency chart
  freqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  freqLabel: {
    fontSize: 8,
    color: '#4B5563',
    width: 14,
    textAlign: 'right',
    marginRight: 6,
  },
  freqBar: {
    flex: 1,
    height: 10,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 3,
  },
  freqFill: {
    height: 10,
    backgroundColor: '#a78bfa',
    borderRadius: 3,
  },
  freqCount: {
    fontSize: 8,
    color: '#4B5563',
    width: 18,
    textAlign: 'right',
    marginLeft: 6,
  },
  // Badge permanente
  badgePermanente: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 0.5,
    borderColor: '#F59E0B',
    marginLeft: 6,
  },
  badgePermanenteText: {
    fontSize: 7,
    color: '#D97706',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  // Custo da Inércia (free analysis)
  bloqueioAtivoBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(220,38,38,0.15)',
    borderWidth: 0.5,
    borderColor: '#EF4444',
    marginLeft: 8,
  },
  bloqueioAtivoBadgeText: {
    fontSize: 7,
    color: '#DC2626',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  custoInerciaBox: {
    backgroundColor: 'rgba(220,38,38,0.07)',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  custoInerciaTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#DC2626',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  custoInerciaText: {
    fontSize: 10,
    color: '#7F1D1D',
    lineHeight: 1.6,
  },
  licaoHarmonizacaoBox: {
    backgroundColor: 'rgba(212,175,55,0.07)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 6,
    padding: 12,
    marginTop: 10,
  },
  licaoHarmonizacaoTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#92640F',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  licaoHarmonizacaoText: {
    fontSize: 10,
    color: '#1A202C',
    lineHeight: 1.6,
  },
});

// ── Custo da Inércia por bloqueio ─────────────────────────────────────────────

const CUSTO_INERCIA_MAP: Record<string, string> = {
  '111': 'O bloqueio 111 atua gerando uma barreira invisível na sua capacidade de iniciativa. Ele cria hesitação onde deveria haver ação, fazendo com que excelentes oportunidades de liderança e recomeços sejam adiados. A energia de começo (1) entra em curto-circuito, dissipando-se em dúvidas antes do primeiro passo.',
  '222': 'O bloqueio 222 cria ruídos na esfera das associações e parcerias. Ele atua desestabilizando o equilíbrio entre o dar e o receber, fazendo com que colaborações naturais frequentemente encontrem atritos ou mal-entendidos. A diplomacia e a sintonia fina com o outro acabam exigindo muito mais esforço do que o normal.',
  '333': 'A dinâmica do 333 interfere diretamente na sua autoexpressão e visibilidade. Ele atua como um "filtro opaco", fazendo com que a sua verdadeira voz e criatividade não sejam compreendidas com clareza pelas pessoas ao redor, travando a fluidez da comunicação nos momentos mais importantes.',
  '444': 'O bloqueio 444 atua desestabilizando a solidez das suas bases. Ele fragmenta a energia de concretização, fazendo com que projetos exijam um esforço desproporcional para se manterem de pé. Ele impacta a estruturação da vida financeira e a materialização fluida do seu trabalho.',
  '555': 'A presença do 555 cria um estado de turbulência vibracional. Em vez da liberdade construtiva, ele atrai mudanças imprevistas e instabilidade frequente. A energia de adaptação fica sobrecarregada, dificultando o estabelecimento de rotinas saudáveis e a colheita tranquila dos seus esforços.',
  '666': 'O bloqueio 666 atua sobre o eixo das responsabilidades afetivas e familiares. Ele cria uma distorção onde você frequentemente se vê carregando fardos emocionais maiores do que o necessário. A harmonia nos relacionamentos íntimos passa a exigir um desgaste energético constante para ser mantida.',
  '777': 'A dinâmica do 777 cria uma névoa na sua intuição e conexão espiritual. Em vez da clareza profunda e compreensão de si, ele atua gerando dispersão mental, melancolia sem motivo aparente e uma busca incessante por respostas que parecem sempre escapar no último momento.',
  '888': 'O bloqueio 888 atua diretamente no seu canal de prosperidade e abundância. Ele cria uma resistência no fluxo de retorno material: o esforço empregado no trabalho não reflete proporcionalmente na colheita financeira, gerando ciclos exaustivos de altos e baixos.',
  '999': 'O bloqueio 999 atua travando os encerramentos naturais da vida. Ele dificulta o desapego, fazendo com que você permaneça muito tempo ligado a situações, pessoas ou padrões que já não servem mais. A energia de conclusão demora a acontecer, prolongando ciclos exaustivos.',
};

// ── Textos Expandidos (Apenas para Nome Social) ───────────────────────────────

const BLOQUEIOS_EXPANDIDOS: Record<string, string> = {
  '111': 'Limitação profunda da força de vontade, perda de coragem e inatividade crônica. A presença deste bloqueio gera uma forte tendência à dependência de terceiros e cria bloqueios sistêmicos ao tentar iniciar projetos, defender ideias próprias ou afirmar a sua individualidade autêntica. O grande antídoto kármico para transcender essa energia é desenvolver ativamente a coragem, fortalecer a autonomia pessoal e recuperar a confiança absoluta no próprio potencial de liderança inato.',
  '222': 'Timidez extrema, indecisão constante e uma perigosa tendência a ser subjugado e apagado pelos outros. Este bloqueio manifesta dificuldades severas em manter parcerias, sociedades e relacionamentos saudáveis, muitas vezes resultando em drástica perda de autoestima e anulação da própria vontade. O antídoto fundamental é cultivar a diplomacia, a paciência e estabelecer limites claros para manter o equilíbrio inegociável entre o que você oferece e o que você recebe.',
  '333': 'Dificuldade profunda no diálogo e barreiras persistentes ao tentar se comunicar com clareza. Este bloqueio gera a constante sensação de ser incompreendido e uma forte dificuldade em se impor e expressar seus sentimentos verdadeiros nas relações pessoais e profissionais. Para transcender esse obstáculo, o antídoto exige focar na expressão criativa, treinar a comunicação autêntica e transparente, e sustentar o otimismo mesmo diante das barreiras sociais.',
  '444': 'Bloqueio severo na realização profissional e financeira. Indica uma forte tendência a não receber o reconhecimento merecido pelo seu esforço, além de dificuldade crônica em manter estabilidade. Pode gerar excesso de rigidez, pessimismo ou, pelo contrário, extrema desorganização. O antídoto para destravar este fluxo exige o cultivo diário da disciplina, estabelecimento de métodos claros de ação, e uma resiliência inabalável para construir bases sólidas.',
  '555': 'Dificuldade crônica em aceitar e lidar com mudanças, acompanhada de instabilidade contínua. Este bloqueio provoca insatisfação constante, agitação interna e uma perigosa atração pela rebeldia ou vícios como válvula de escape. A liberdade pessoal frequentemente se torna uma fonte de caos em vez de paz. O antídoto principal é aprender a aceitar o fluxo natural da vida, desenvolver flexibilidade mental, adaptar-se sem resistência e usar a liberdade com profunda responsabilidade.',
  '666': 'Conflitos persistentes e instabilidade na vida familiar e afetiva. Este bloqueio gera decepções frequentes nos relacionamentos íntimos, ciúmes, possessividade e uma tendência ao isolamento emocional. Muitas vezes, você atrai parceiros incompatíveis ou se sente sobrecarregado por responsabilidades domésticas. O antídoto essencial é desenvolver o amor-próprio antes de buscar afeto externo, aprender a perdoar e cultivar a compreensão de que as relações devem ser fontes de equilíbrio, não de peso.',
  '777': 'Desconexão dolorosa do plano espiritual e do propósito maior de vida. Este bloqueio gera desânimo, melancolia, confusão mental frequente, medos infundados e uma sensação de vazio interno que o sucesso material não preenche. A energia fica dispersa e a mente nebulosa. O antídoto fundamental para esta vibração é a interiorização diária, o estudo profundo de temas existenciais, a meditação e o desenvolvimento ativo da sua intuição e sabedoria oculta.',
  '888': 'Bloqueio crítico no fluxo da abundância financeira e na relação com o mundo material. Manifesta-se através de perdas financeiras súbitas, dificuldades extremas em acumular ou reter riquezas, e um constante sentimento de estagnação na carreira. Pode indicar ambição desmedida ou total aversão ao poder. O antídoto central requer a harmonização da sua relação com o dinheiro, compreendendo-o como energia de troca justa, agindo com máxima ética, justiça e reequilibrando a balança entre a matéria e o espírito.',
  '999': 'Prolongamento exaustivo de ciclos que já deveriam ter se encerrado. Este bloqueio cria forte apego ao passado, ressentimentos duradouros e dificuldades crônicas em perdoar e soltar o que não serve mais. Pode gerar desilusões frequentes, perdas emocionais e uma sensação de sacrifício contínuo pelos outros. O antídoto kármico definitivo é o desenvolvimento da compaixão universal, a prática ativa do desapego, o perdão incondicional (a si mesmo e aos outros) e a aceitação pacífica das conclusões.'
};

// ── Descrições compactas (PDF gratuito — 1-2 frases por número) ──────────────

/** Débitos kármicos — versão curta para o dossiê gratuito */
const DEBITO_DESC_COMPACT: Record<number, string> = {
  13: 'O 13 indica padrões de preguiça ou fuga de responsabilidades em encarnações passadas. Resultados chegam — mas exigem esforço consistente e disciplina real, sem atalhos.',
  14: 'O 14 surge de excessos e impulsividade em vidas anteriores. Esta encarnação pede moderação e constância: construir algo duradouro sem se perder em extremos.',
  16: 'O 16 traz quedas bruscas quando o que foi construído sobre vaidade precisa desmoronar. O recomeço vem — mas exige humildade genuína como base de tudo.',
  19: 'O 19 surge do uso do poder sem considerar os outros. Nesta vida, liderança precisa ser exercida com generosidade — o isolamento é o retorno natural do egocentrismo.',
};

/** Lições kármicas — versão curta para o dossiê gratuito */
const LICAO_DESC_COMPACT: Record<number, string> = {
  1: 'A ausência do 1 cria dificuldade em tomar iniciativa e afirmar a própria vontade. Protagonismo, autonomia e coragem para começar precisam ser cultivados ativamente.',
  2: 'A ausência do 2 dificulta a cooperação e o equilíbrio nos relacionamentos. Aprender a receber, ceder e construir parcerias genuínas é o desenvolvimento central desta vida.',
  3: 'A ausência do 3 trava a expressão criativa e a comunicação. Colocar em palavras o que sente e ser ouvido com clareza exige esforço consciente e prática contínua.',
  4: 'A ausência do 4 gera instabilidade nas bases — disciplina, organização e constância precisam ser construídas com determinação, não esperadas como dons naturais.',
  5: 'A ausência do 5 cria resistência às mudanças. Aprender a soltar o controle e navegar o novo sem rigidez é o grande desenvolvimento desta encarnação.',
  6: 'A ausência do 6 dificulta o equilíbrio entre dar e receber. Responsabilidades afetivas e harmonia nas relações são área de tensão que exige prática deliberada.',
  7: 'A ausência do 7 cria dificuldade de introspecção e análise profunda. A tendência é agir sem reflexão suficiente — buscar o conhecimento interior é a lição central.',
  8: 'A ausência do 8 indica dificuldade com gestão de recursos e poder. Sabotar conquistas financeiras ou evitar o sucesso são padrões que precisam ser reconhecidos e revertidos.',
};

// ── Interfaces de dados ───────────────────────────────────────────────────────

export interface BloqueioData {
  codigo: string;
  titulo: string;
  descricao: string;
  aspectoSaude?: string;
  triangulos?: string[];
  repeticoesPortriangulo?: Partial<Record<string, number>>;
  totalOcorrencias?: number;
}

export interface DebitoData {
  numero: number;
  titulo: string;
  descricao: string;
  fixo?: boolean;
}

export interface LicaoData {
  numero: number;
  titulo: string;
  descricao: string;
}

export interface TendenciaData {
  numero: number;
  titulo: string;
  descricao: string;
  frequencia: number;
}

// ── Componentes de bloco ──────────────────────────────────────────────────────

/** Cards de Bloqueios Energéticos */
export function BloqueiosBlock({
  bloqueios,
  showAntidoto = true,
  hideSaude = false,
  hideTriangulos = false,
  isNomeSocial = false,
  triangulo,
}: {
  bloqueios: BloqueioData[];
  showAntidoto?: boolean;
  hideSaude?: boolean;
  hideTriangulos?: boolean;
  isNomeSocial?: boolean;
  triangulo?: 'vida' | 'pessoal' | 'social' | 'destino';
}) {
  if (bloqueios.length === 0) {
    return (
      <View style={styles.debitoNoneBox}>
        <Text style={styles.debitoNoneText}>
          Nenhum bloqueio energético detectado neste nome — vibração limpa em todos os triângulos.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.sectionBlock}>
      {bloqueios.map((b, i) => {
        const displayTitle = isNomeSocial ? b.titulo.replace(new RegExp(`\\s*\\(${b.codigo}\\)\\s*`), '') : b.titulo;
        
        // Sempre usamos a descrição base que tem o texto exato do PDF.
        const displayDesc = b.descricao;
        
        return (
        <View key={i} style={[styles.bloqueioRow, ...(i === bloqueios.length - 1 ? [{ marginBottom: 0 }] : [])]} wrap={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={[styles.bloqueioTitle, { marginBottom: 0 }, ...(isNomeSocial ? [{ fontSize: 11 }] : [])]}>{b.codigo} — {displayTitle}</Text>
            {(b.totalOcorrencias ?? 1) > 1 && (
              <View style={[styles.bloqueioAtivoBadge, { marginLeft: 6 }]}>
                <Text style={styles.bloqueioAtivoBadgeText}>{b.totalOcorrencias}×</Text>
              </View>
            )}
            {!showAntidoto && (
              <View style={styles.bloqueioAtivoBadge}>
                <Text style={styles.bloqueioAtivoBadgeText}>ATIVO 24H</Text>
              </View>
            )}
          </View>
          <Text style={[styles.bloqueioDesc, ...(isNomeSocial ? [{ fontSize: 10 }] : [])]}>{displayDesc}</Text>

          {(!hideSaude && b.aspectoSaude) ? (
            <Text style={[styles.bloqueioSaude, ...(isNomeSocial ? [{ fontSize: 9 }] : [])]}>Aspecto de saúde: {b.aspectoSaude}</Text>
          ) : null}
          {(!hideTriangulos && b.triangulos && b.triangulos.length > 0) ? (
            <Text style={[styles.bloqueioTriangulos, ...(isNomeSocial ? [{ fontSize: 9 }] : [])]}>
              Ativo nos triângulos: {b.triangulos.map((t: string) => {
                const count = b.repeticoesPortriangulo?.[t] ?? 1;
                const label = t.charAt(0).toUpperCase() + t.slice(1);
                return count > 1 ? `${label} (${count}×)` : label;
              }).join(' · ')}
            </Text>
          ) : null}
          {!showAntidoto && (
            <View style={styles.custoInerciaBox}>
              <Text style={styles.custoInerciaTitle}>Dinâmica do Bloqueio (Como Atua)</Text>
              <Text style={styles.custoInerciaText}>
                {CUSTO_INERCIA_MAP[b.codigo] ?? 'Esta frequência atua de forma contínua no seu campo vibracional diário. Embora os efeitos possam ser aliviados com ações práticas, a sua resolução definitiva requer o alinhamento completo da assinatura.'}
              </Text>
            </View>
          )}
        </View>
        );
      })}
    </View>
  );
}

/** Cards de Débitos Kármicos */
export function DebitosBlock({ debitos, showSolution = true, compact = false }: { debitos: DebitoData[]; showSolution?: boolean; compact?: boolean }) {
  if (debitos.length === 0) {
    return (
      <View style={styles.debitoNoneBox}>
        <Text style={styles.debitoNoneText}>
          Nenhum débito kármico detectado — alma sem pendências de encarnações passadas.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.sectionBlock}>
      {debitos.map((d, i) => {
        const isFixed = d.fixo === true;
        const displayDesc = compact
          ? (DEBITO_DESC_COMPACT[d.numero] ?? d.descricao)
          : d.descricao;
        return (
          <View key={i} style={isFixed ? styles.debitoRow : styles.debitoRowVariable} wrap={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <Text style={isFixed ? styles.debitoTitle : styles.debitoTitleVariable}>
                {d.titulo}
              </Text>
              {isFixed ? (
                <View style={styles.badgePermanente}>
                  <Text style={styles.badgePermanenteText}>PERMANENTE</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.debitoDesc}>{displayDesc}</Text>
            {isFixed ? (
              <Text style={{ fontSize: 7, color: '#92400E', marginTop: 3, fontStyle: 'italic' }}>
                Ligado ao dia natalício / Destino — não pode ser eliminado por mudança de nome.
              </Text>
            ) : null}
          </View>
        );
      })}
      {!showSolution && (
        <View style={styles.licaoHarmonizacaoBox} wrap={false}>
          <Text style={styles.licaoHarmonizacaoTitle}>Como a Harmonização Atua nos Débitos Kármicos</Text>
          <Text style={styles.licaoHarmonizacaoText}>
            Débitos variáveis — originados nos números de Motivação ou Expressão — podem ser reduzidos ou eliminados por uma variação do nome que reajuste essas frequências. O processo de harmonização calcula combinações que minimizam esses padrões no campo vibracional.
          </Text>
        </View>
      )}
    </View>
  );
}

/** Cards de Lições Kármicas */
export function LicoesBlock({ licoes, showSolution = true, compact = false }: { licoes: LicaoData[]; showSolution?: boolean; compact?: boolean }) {
  if (licoes.length === 0) {
    return (
      <View style={styles.licaoNoneBox}>
        <Text style={styles.licaoNoneText}>
          Nenhuma lição kármica pendente — todos os números estão presentes neste nome.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.sectionBlock}>
      {licoes.map((l, i) => {
        const displayDesc = compact
          ? (LICAO_DESC_COMPACT[l.numero] ?? l.descricao)
          : l.descricao;
        return (
        <View key={i} style={styles.licaoRow} wrap={false}>
          <Text style={styles.licaoTitle}>{l.titulo}</Text>
          <Text style={styles.licaoDesc}>{displayDesc}</Text>
        </View>
        );
      })}
      {!showSolution && (
        <View style={styles.licaoHarmonizacaoBox} wrap={false}>
          <Text style={styles.licaoHarmonizacaoTitle}>Como a Harmonização Resolve as Lições Kármicas</Text>
          <Text style={styles.licaoHarmonizacaoText}>
            O Nome Social Harmonizado pode introduzir as vibrações ausentes no seu campo energético. Quando o nome passa a conter esses números, a qualidade em falta começa a ser cultivada naturalmente — sem depender exclusivamente de esforço consciente.
          </Text>
        </View>
      )}
    </View>
  );
}

/** Gráfico de frequência de números */
function FrequencyBar({ frequencias }: { frequencias: Record<string, number> }) {
  const entries = Object.entries(frequencias)
    .map(([k, v]) => ({ num: Number(k), count: v }))
    .filter(e => e.num >= 1 && e.num <= 8)
    .sort((a, b) => a.num - b.num);
  if (entries.length === 0) return null;
  const max = Math.max(...entries.map(e => e.count), 1);
  return (
    <View style={{ marginBottom: 20 }} wrap={false}>
      <Text style={[styles.sectionLabel, { color: '#6d28d9', fontSize: 11, marginBottom: 4, textTransform: 'none' }]}>
        Mapeamento de Repetição Energética
      </Text>
      <Text style={{ fontSize: 10, color: GRAY, marginBottom: 12, lineHeight: 1.4 }}>
        Este gráfico tangibiliza o ímpeto magnético presente em seu nome. As barras mais densas indicam talentos que você vivencia em extremo excesso, apontando com exatidão onde o seu potencial transborda para a desordem.
      </Text>
      {entries.map(({ num, count }) => {
        const pct = (count / max) * 100;
        const isTendencia = count >= 4;
        const barColor = isTendencia ? '#EF4444' : '#bea5ff';
        return (
          <View key={num} style={styles.freqRow}>
            <Text style={styles.freqLabel}>{num}</Text>
            <View style={styles.freqBar}>
              <View style={[styles.freqFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text
              style={[
                styles.freqCount,
                isTendencia ? { color: '#EF4444', fontFamily: 'Helvetica-Bold' } : { color: '#bea5ff' },
              ]}
            >
              {count}x
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Cards de Tendências Ocultas + gráfico de frequências */
export function TendenciasBlock({
  tendencias,
  frequencias,
  showSolution = true,
}: {
  tendencias: TendenciaData[];
  frequencias?: Record<string, number> | null;
  showSolution?: boolean;
}) {
  return (
    <View style={styles.sectionBlock}>
      {frequencias && Object.keys(frequencias).length > 0 ? (
        <FrequencyBar frequencias={frequencias} />
      ) : null}
      {tendencias.length === 0 ? (
        <View style={styles.tendenciaNoneBox}>
          <Text style={styles.tendenciaNoneText}>
            Nenhuma tendência oculta detectada — nenhum número se repete excessivamente.
          </Text>
        </View>
      ) : (
        <>
          {tendencias.map((t, i) => (
            <View key={i} style={styles.tendenciaRow} wrap={false}>
              <Text style={styles.tendenciaTitle}>
                {t.titulo} — {t.frequencia}x no nome
              </Text>
              <Text style={styles.tendenciaDesc}>{t.descricao}</Text>
            </View>
          ))}
          {!showSolution && (
            <View style={styles.licaoHarmonizacaoBox} wrap={false}>
              <Text style={styles.licaoHarmonizacaoTitle}>Como a Harmonização Reequilibra as Tendências</Text>
              <Text style={styles.licaoHarmonizacaoText}>
                A redistribuição vibracional do Nome Social ajusta a proporção dos números em excesso na raiz do campo energético. O que hoje cria ciclos repetitivos encontra contrapeso natural no novo campo vibracional — algo que esforço consciente sozinho não consegue alcançar.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
