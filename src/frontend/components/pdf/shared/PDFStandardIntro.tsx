import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { Page } from '@react-pdf/renderer';
import { PDFPageHeader } from './PDFPageHeader';
import { PDFFooter } from './PDFFooter';
import type { ProductTheme, ProductType } from './PDFTheme';
import { TITLE_FONT } from './PDFFonts';

const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 65,
    paddingHorizontal: 45,
  },
  section: {
    marginBottom: 24,
  },
  hugeTitle: {
    fontSize: 18,
    fontFamily: TITLE_FONT,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  subHead: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    marginTop: 10,
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 14,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  }
});

interface IntroProps {
  theme: ProductTheme;
  productType: ProductType;
  entityName: string;
  isFreeAnalysis?: boolean;
}

export function PDFStandardIntro({ theme, productType, entityName, isFreeAnalysis = false }: IntroProps) {

  const isLightBackground = productType === 'nome_bebe';
  const textColor = isLightBackground ? '#5C2D1E' : '#e5e2e1';
  const boldColor = isLightBackground ? theme.primaryColor : '#ffffff';

  // Textos Históricos e Holísticos da Página 1
  const getHolisticText = () => {
    switch (productType) {
      case 'nome_empresa':
        return 'Grandes negócios não crescem apenas com gestão e planilhas financeiras. Eles também precisam de uma base invisível forte. A Numerologia Cabalística é uma sabedoria milenar que mostra como as letras formam um campo de energia (uma "vibração"). Cada nome atrai ou afasta clientes e oportunidades dependendo das letras que o formam. Quando escolhemos um nome empresarial com sabedoria geométrica, ele age como um ímã silencioso, ajudando a empresa a vender mais rápido e trazendo facilidades inesperadas, aliviando o cansaço dos fundadores.';
      case 'nome_bebe':
        return 'A escolha do nome de um bebê é o primeiro e mais importante presente que os pais oferecem para a criança. Baseado em tradições milenares, sabemos que o nome escolhido não é apenas um som bonito, mas uma verdadeira "roupa de energia" que vai vestir a criança por toda a vida. Um nome bem escolhido facilita muito os caminhos, atrai melhores amizades, ajuda na profissão futura e traz proteção. Ao conhecer as vibrações das letras, os pais entregam um escudo invisível e amoroso para proteger o filho durante toda a sua existência.';
      case 'nome_social':
      default:
        return 'O nome que você usa e assina todos os dias não é apenas uma forma de ser chamado; ele funciona como um ímã constante na sua vida material e afetiva. Se você sente que se esforça demais e as coisas parecem "travar" na hora de dar certo, a causa pode estar nas repetições das letras da sua assinatura principal. A Numerologia Cabalística carrega conhecimentos antigos para organizar suas letras da melhor forma possível, removendo essas pequenas falhas que não vemos e ajudando você a atrair bons relacionamentos, saúde e muita prosperidade.';
    }
  };

  const introTitleSubtitleP1 = {
    nome_empresa: 'O Segredo Oculto das Grandes Marcas',
    nome_bebe: 'O Poder Vibracional do Nascer',
    nome_social: 'O Despertar da Sua Frequência',
  }[productType];

  return (
    <>
      {/* ── PÁGINA 1: HOLÍSTICA / BENEFÍCIOS ────────────────────────────── */}
      <Page size="A4" style={[styles.page, { backgroundColor: theme.coverBgColor }]}>
        <PDFPageHeader subtitle={`${entityName} — ${introTitleSubtitleP1}`} />

        <View style={styles.section}>
          <Text style={[styles.hugeTitle, { color: theme.accentColor, marginBottom: 16 }]}>
            {isFreeAnalysis ? 'O Magnetismo da Sua Identidade' : 'A Força Invisível das Palavras'}
          </Text>

          {isFreeAnalysis ? (
            <>
              <Text style={[styles.subHead, { color: textColor }]}>O Princípio</Text>
              <Text style={[styles.bodyText, { color: textColor }]}>
                Tudo é energia e frequência. Cada letra do nome que você assina emite um som e um valor que atraem resultados específicos — em finanças, relacionamentos e saúde. Isso não é metáfora: é a geometria invisível que organiza o que você atrai antes mesmo de agir.
              </Text>

              <Text style={[styles.subHead, { color: textColor }]}>A Dor</Text>
              <Text style={[styles.bodyText, { color: textColor }]}>
                Se você se esforça muito, mas sente as coisas "travando" na hora de dar certo, a causa pode estar nas repetições de letras da sua assinatura. Sequências específicas criam bloqueios que operam 24 horas por dia — silenciosamente, independentemente do quanto você trabalha ou se dedica.
              </Text>

              <Text style={[styles.subHead, { color: textColor }]}>A Solução</Text>
              <Text style={[styles.bodyText, { color: textColor }]}>
                Este relatório revela as falhas invisíveis do seu nome e como organizar essas letras para atrair fluidez, relacionamentos e prosperidade. O diagnóstico é objetivo e matemático. O que você faz com ele depende de você.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.subHead, { color: textColor }]}>
                O que é a Numerologia Cabalística?
              </Text>
              <Text style={[styles.bodyText, { color: textColor }]}>
                Há milhares de anos, sabedorias da Cabala judaica e estudos do pensador grego Pitágoras descobriram que todo o universo funciona como uma grande música. Para eles, tudo é energia e a linguagem que escrevemos influencia o que colhemos do mundo. Cada letra que escrevemos tem um valor, um som e uma frequência energética.
                {'\n\n'}
                Isso quer dizer que nosso nome não foi criado por acaso: ele dita o nosso propósito, quais serão os nossos talentos e também pode esconder nossos maiores desafios nessa vida material.
              </Text>

              <Text style={[styles.subHead, { color: textColor }]}>
                {productType === 'nome_empresa' ? 'O Peso do Nome na Empresa' : productType === 'nome_bebe' ? 'O Cuidado Mais Protetor de Todos' : 'O Magnetismo da Sua Identidade'}
              </Text>
              <Text style={[styles.bodyText, { color: textColor }]}>
                {getHolisticText()}
              </Text>
            </>
          )}
        </View>

        <PDFFooter />
      </Page>

      {/* ── PÁGINA 2: O MÉTODO E O SCORE ────────────────────────────────── */}
      <Page size="A4" style={[styles.page, { backgroundColor: theme.coverBgColor }]}>
        <PDFPageHeader subtitle={`${entityName} — Como Ler a Análise`} />
        
        <View style={styles.section}>
          <Text style={[styles.hugeTitle, { color: theme.accentColor, marginBottom: 16 }]}>
            Instruções e Regras Ocultas
          </Text>
          
          <Text style={[styles.subHead, { color: textColor }]}>
            A Arquitetura da Análise
          </Text>
          {isFreeAnalysis ? (
            <View style={{ marginBottom: 14 }}>
              {[
                ['5 Números Principais', 'Os pilares da sua identidade vibracional: Expressão, Destino, Motivação, Missão e Impressão.'],
                ['4 Triângulos Numerológicos', 'O mapa completo — Vida, Pessoal, Social e Destino — cada um revelando uma dimensão diferente da sua jornada.'],
                ['Bloqueios Energéticos', 'Sequências repetidas nos triângulos que travam resultados (-15 pts cada no score).'],
                ['Débitos Kármicos', 'Padrões gravados na sua data de nascimento que exigem integração nesta vida (-12 pts cada).'],
                ['Lições Kármicas', 'Vibrações ausentes no nome — qualidades a desenvolver (-1 pt cada).'],
                ['Tendências Ocultas', 'Números que aparecem 4+ vezes — excessos que distorcem comportamentos (-2 pts cada).'],
              ].map(([title, desc], i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, color: boldColor, fontFamily: 'Helvetica-Bold', marginRight: 4 }}>•</Text>
                  <Text style={{ fontSize: 11, color: textColor, lineHeight: 1.5, flex: 1 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: boldColor }}>{title}:</Text>{' '}{desc}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.bodyText, { color: textColor }]}>
              As informações apresentadas a seguir não são adivinhações. Usamos cálculos lógicos e estritos. Primeiro, o nosso sistema cruza as letras e descobre os <Text style={[styles.bold, { color: boldColor }]}>5 Números Principais</Text> (Expressão, Destino, Motivação, Missão e Impressão), que são os pilares da sua análise. Depois, montamos <Text style={[styles.bold, { color: boldColor }]}>4 Triângulos Numerológicos</Text> — Vida, Pessoal, Social e Destino — que mostram o mapa completo de como as coisas funcionam em cada dimensão da sua vida.
              {'\n\n'}
              Também verificamos os <Text style={[styles.bold, { color: boldColor }]}>Bloqueios Energéticos</Text> (sequências repetidas que paralisam a vida), os <Text style={[styles.bold, { color: boldColor }]}>Débitos Kármicos</Text> (padrões fixos da data de nascimento), as <Text style={[styles.bold, { color: boldColor }]}>Lições Kármicas</Text> (vibrações ausentes que criam pontos cegos) e as <Text style={[styles.bold, { color: boldColor }]}>Tendências Ocultas</Text> (excessos que distorcem comportamentos). Por fim, avaliamos a <Text style={[styles.bold, { color: boldColor }]}>Compatibilidade Vibracional</Text> entre o Número de Expressão e o Número de Destino — que pode ser Harmônica/Favorável, Neutra ou Tensão Vibracional, usando a Tabela de Alquimia Operativa da Numerologia Cabalística.
            </Text>
          )}

          <Text style={[styles.subHead, { color: textColor }]}>
            Como Funciona o Cálculo do Score? (A Nota de 0 a 100)
          </Text>
          <Text style={[styles.bodyText, { color: textColor }]}>
            O score mede o nível de fluidez do nome em relação ao seu destino. Funciona como um equilíbrio: começamos com <Text style={[styles.bold, { color: boldColor }]}>100 pontos</Text> e vamos descontando conforme as resistências encontradas:
            {'\n'}
            • <Text style={[styles.bold, { color: boldColor }]}>Cada Bloqueio Energético</Text> (sequências que travam a vida): <Text style={[styles.bold, { color: theme.primaryColor }]}>-15 pontos</Text>
            {'\n'}
            • <Text style={[styles.bold, { color: boldColor }]}>Cada Débito Kármico</Text> (desafios e aprendizados de vidas passadas): <Text style={[styles.bold, { color: theme.primaryColor }]}>-12 pontos</Text>
            {'\n'}
            • <Text style={[styles.bold, { color: boldColor }]}>Cada Tendência Oculta</Text> (excesso de uma mesma vibração): <Text style={[styles.bold, { color: theme.primaryColor }]}>-2 pontos</Text>
            {'\n'}
            • <Text style={[styles.bold, { color: boldColor }]}>Cada Lição Kármica</Text> (qualidades ausentes a desenvolver): <Text style={[styles.bold, { color: theme.primaryColor }]}>-1 ponto</Text>
            {'\n\n'}
            O grande motivo de raramente atingirmos 100 pontos são os <Text style={[styles.bold, { color: boldColor }]}>Dados Imutáveis</Text> (sua data de nascimento). Ela jamais pode ser alterada e dita o Destino e os Débitos Kármicos, que são fixos. A análise visa encontrar um nome que contorne essas pendências com o menor atrito possível.
            {'\n\n'}
            Retire dos ombros a busca pelos 100 pontos. Um score <Text style={[styles.bold, { color: boldColor }]}>acima de 70</Text> já indica um nome Bom (sólido). Acima de <Text style={[styles.bold, { color: boldColor }]}>80 pontos</Text>, um "Nome de Ouro" (máximo alinhamento com mínima alteração). Acima de <Text style={[styles.bold, { color: boldColor }]}>90 pontos</Text>, um alinhamento excepcional e raro.
          </Text>

          <Text style={[styles.subHead, { color: textColor }]}>
            A Tabela de Harmonização Cabalística
          </Text>
          <Text style={[styles.bodyText, { color: textColor }]}>
            Para que sua vida flua, a sua <Text style={[styles.bold, { color: boldColor }]}>Expressão</Text> (como você age e se posiciona) e seu <Text style={[styles.bold, { color: boldColor }]}>Destino</Text> (seu caminho de vida) precisam caminhar juntos em perfeita harmonia. Medimos essa compatibilidade através da Tabela de Harmonização Cabalística:
            {'\n'}
            • <Text style={[styles.bold, { color: boldColor }]}>Harmônica / Favorável:</Text> Sinergia e alinhamento perfeito! As vibrações da Expressão (nome) e do Destino (nascimento) trabalham juntas, abrindo caminhos com menor esforço. Cada número de Destino possui parceiros específicos que trazem atração magnética, prosperidade e facilidade de realização.
            {'\n'}
            • <Text style={[styles.bold, { color: boldColor }]}>Neutra:</Text> Relação harmoniosa e sem conflito direto. Não há conflito ativo entre as forças da Expressão e do Destino. A vida flui de forma equilibrada, exigindo esforço consciente, mas sem bloqueios ou tensões vibracionais ativas de compatibilidade.
            {'\n'}
            • <Text style={[styles.bold, { color: boldColor }]}>Tensão Vibracional:</Text> Conflito de frequências (<Text style={[styles.bold, { color: theme.primaryColor }]}>-15 pontos</Text>). Ocorre quando a vibração ativa do nome (Expressão) entra em atrito direto com o caminho de nascimento (Destino). Funciona como um "freio de mão puxado": exige esforço gigantesco para obter resultados mínimos, gerando atrasos e estagnação. O Nome Social visa justamente eliminar essa tensão e restabelecer o fluxo natural.
          </Text>
        </View>

        <PDFFooter />
      </Page>
    </>
  );
}
