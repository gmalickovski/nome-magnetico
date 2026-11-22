/**
 * "Como ler este relatório" do PDF do Nome Social (DEV-322, entrega A).
 *
 * Uma página só: mapa do documento, como ler os quadros e por onde começar.
 * Substitui o `PDFStandardIntro` (2 páginas) apenas no Nome Social pago; os outros
 * produtos continuam com o componente antigo.
 *
 * Copy: sem jargão de motor (v3, N5, pts), sem promessa de resultado.
 */
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFPageHeader } from './PDFPageHeader';
import { PDFFooter } from './PDFFooter';
import { PDFSectionAnchor } from './PDFSectionAnchor';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from './PDFFonts';
import type { ProductTheme } from './PDFTheme';

const INK = '#334155';
const INK_STRONG = '#1E293B';
const SOFT = '#F8FAFC';
const LINE = '#E2E8F0';

const styles = StyleSheet.create({
  page: { paddingTop: 45, paddingBottom: 65, paddingHorizontal: 45, backgroundColor: '#FFFFFF' },
  title: { fontSize: 18, fontFamily: TITLE_FONT, textAlign: 'center', marginBottom: 6, letterSpacing: 0.5 },
  lead: { fontSize: 10, fontFamily: BODY_FONT, color: INK, lineHeight: 1.55, textAlign: 'center', marginBottom: 14 },
  h: { fontSize: 11, fontFamily: BODY_FONT_BOLD, color: INK_STRONG, marginBottom: 6, marginTop: 10 },
  card: { backgroundColor: SOFT, borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 9, marginBottom: 6 },
  cardTitle: { fontSize: 9.5, fontFamily: BODY_FONT_BOLD, color: INK_STRONG, marginBottom: 2 },
  body: { fontSize: 9, fontFamily: BODY_FONT, color: INK, lineHeight: 1.5 },
});

interface Props {
  theme: ProductTheme;
  entityName: string;
}

const PARTES: Array<[string, string]> = [
  ['Parte 1 · Você hoje', 'Os números do seu nome de nascimento, os triângulos, o arquétipo e o que o mapa mostra de pontos de atenção.'],
  ['Parte 2 · Seu nome novo', 'O nome escolhido lado a lado com o de nascimento, o que mudou e a leitura dos números do nome novo.'],
  ['Parte 3 · Como usar', 'O guia de uso da assinatura, a folha de treino e os anexos de consulta.'],
];

const QUADROS: Array<[string, string]> = [
  ['Número em destaque', 'É o resultado do cálculo daquela leitura (por exemplo, a Expressão). O texto ao lado explica o que ele indica.'],
  ['Selo de compatibilidade', 'Compara a Expressão do nome com o Destino da data de nascimento: Ressonância Total, Vibração Complementar, Vibração Neutra ou Tensão Vibracional.'],
  ['Bloqueio', 'Sequência de três ou mais números iguais em um triângulo. O relatório mostra onde aparece e se o nome novo ficou sem ela.'],
  ['Nota de 0 a 100', 'Resume o quanto o nome combina com a sua data de nascimento. Serve para comparar opções; não é uma previsão.'],
];

export function PDFComoLerNomeSocial({ theme, entityName }: Props) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFSectionAnchor id="pdf-intro-leitura" bookmark={{ title: 'Como ler este relatório', fit: true }} />
      <PDFPageHeader subtitle={`${entityName} — Como ler este relatório`} />

      <Text style={[styles.title, { color: theme.accentColor }]}>Como ler este relatório</Text>
      <Text style={styles.lead}>
        Este documento parte do cálculo do seu nome pela Numerologia Cabalística. É uma ferramenta de autoconhecimento e de
        escolha: ele organiza informações para você decidir, sem prometer resultados.
      </Text>

      <Text style={styles.h}>O mapa do documento</Text>
      {PARTES.map(([t, d]) => (
        <View key={t} style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>{t}</Text>
          <Text style={styles.body}>{d}</Text>
        </View>
      ))}

      <Text style={styles.h}>Como ler cada quadro</Text>
      {QUADROS.map(([t, d]) => (
        <View key={t} style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>{t}</Text>
          <Text style={styles.body}>{d}</Text>
        </View>
      ))}

      <Text style={styles.h}>Por onde começar</Text>
      <Text style={styles.body}>
        Se você tem poucos minutos, leia o resumo logo após a capa e, na Parte 2, a comparação entre o nome de nascimento e o nome
        novo. Depois vá ao guia de uso da assinatura. O sumário no início indica a página de cada seção, e os anexos servem para
        consulta quando quiser se aprofundar.
      </Text>

      <PDFFooter />
    </Page>
  );
}
