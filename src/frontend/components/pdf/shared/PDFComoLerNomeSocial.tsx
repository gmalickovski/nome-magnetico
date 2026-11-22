/**
 * "Como ler este relatório" do PDF do Nome Social (DEV-322 / DEV-327).
 *
 * Uma página só: mapa das 4 partes, como ler os quadros e por onde começar.
 * Segue o tema `pdfLayoutTheme.ts` (fundo #FBF9F4, regra NO-LINE).
 * Copy: sem jargão de motor (v3, N5, pts), sem promessa de resultado.
 */
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFPageHeader } from './PDFPageHeader';
import { PDFFooter } from './PDFFooter';
import { PDFSectionAnchor } from './PDFSectionAnchor';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from './PDFFonts';
import type { ProductTheme } from './PDFTheme';
import { COR_FIXA, LAYOUT_THEME_PADRAO, type PdfLayoutTheme } from '../layout/pdfLayoutTheme';

const tDefault = LAYOUT_THEME_PADRAO;

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 68, paddingHorizontal: 48, backgroundColor: tDefault.paginaFundo },
  title: { fontSize: 20, fontFamily: TITLE_FONT, marginBottom: 4, letterSpacing: 0.6 },
  lead: { fontSize: 9.5, fontFamily: BODY_FONT, color: tDefault.tintaSuave, lineHeight: 1.5, marginBottom: 12 },
  h: { fontSize: 12, fontFamily: TITLE_FONT, color: tDefault.tinta, marginBottom: 6, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  gridCard: { width: '48.8%', backgroundColor: tDefault.cardFundo, borderRadius: 12, padding: 10 },
  eyebrow: { fontSize: 7.5, fontFamily: BODY_FONT_BOLD, color: '#6B5A2E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  quadroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: tDefault.cardFundoAlt, borderRadius: 12, padding: 10, marginBottom: 6 },
  cardTitle: { fontSize: 9.5, fontFamily: BODY_FONT_BOLD, color: tDefault.tinta, marginBottom: 2 },
  body: { fontSize: 8.5, fontFamily: BODY_FONT, color: tDefault.tintaSuave, lineHeight: 1.45 },
});

interface Props {
  theme: ProductTheme;
  entityName: string;
  layoutTheme?: PdfLayoutTheme;
}

const PARTES: Array<[string, string]> = [
  ['Parte 1 · Você hoje', 'O mapa completo do nome de nascimento: números, arquétipo, triângulo e pontos de atenção.'],
  ['Parte 2 · O que muda', 'O veredito, a estrela e o Mapa Vibracional comparativos, e o antes e depois item por item.'],
  ['Parte 3 · Seu nome novo', 'Só os números e arcanos que mudaram, o Triângulo da Vida do nome novo e o arquétipo.'],
  ['Parte 4 · Como usar', 'O guia de uso da assinatura, como chegamos às sugestões, a folha de treino e os anexos.'],
];

export function PDFComoLerNomeSocial({ entityName, layoutTheme = LAYOUT_THEME_PADRAO }: Props) {
  return (
    <Page size="A4" style={[styles.page, { backgroundColor: layoutTheme.paginaFundo }]}>
      <PDFSectionAnchor id="pdf-intro-leitura" bookmark={{ title: 'Como ler este relatório', fit: true }} />
      <PDFPageHeader subtitle={`${entityName} — Como ler`} />

      <Text style={[styles.title, { color: layoutTheme.destaqueTexto }]}>Como ler este relatório</Text>
      <Text style={styles.lead}>
        Ferramenta de autoconhecimento e de escolha. Organiza o cálculo do seu nome para você decidir, sem prometer resultados.
      </Text>

      <Text style={styles.h}>O mapa do documento</Text>
      <View style={styles.grid}>
        {PARTES.map(([titulo, desc]) => (
          <View key={titulo} style={[styles.gridCard, { backgroundColor: layoutTheme.cardFundo }]} wrap={false}>
            <Text style={styles.eyebrow}>{titulo}</Text>
            <Text style={styles.body}>{desc}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.h}>Como ler cada quadro</Text>
      <View style={[styles.quadroRow, { backgroundColor: layoutTheme.cardFundoAlt }]} wrap={false}>
        <Text style={{ fontFamily: TITLE_FONT, fontSize: 20, color: layoutTheme.destaqueTexto, minWidth: 42, textAlign: 'center' }}>6</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Número em destaque</Text>
          <Text style={styles.body}>O resultado do cálculo daquela leitura. O texto ao lado explica o que ele indica.</Text>
        </View>
      </View>

      <View style={[styles.quadroRow, { backgroundColor: layoutTheme.cardFundoAlt }]} wrap={false}>
        <View style={{ backgroundColor: '#D1FAE5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, minWidth: 42, alignItems: 'center' }}>
          <Text style={{ fontSize: 8.5, fontFamily: BODY_FONT_BOLD, color: '#047857' }}>91</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Cor da nota</Text>
          <Text style={styles.body}>Verde 85 a 100, verde-limão 70 a 84, amarelo 50 a 69, laranja 30 a 49, vermelho até 29. A estrela e a teia usam as mesmas cores.</Text>
        </View>
      </View>

      <View style={[styles.quadroRow, { backgroundColor: layoutTheme.cardFundoAlt }]} wrap={false}>
        <View style={{ backgroundColor: COR_FIXA.arcanoFundo, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 7.5, fontFamily: BODY_FONT_BOLD, color: COR_FIXA.arcanoTexto }}>Complementar</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Selo de compatibilidade</Text>
          <Text style={styles.body}>Compara a Expressão do nome com o Destino da data: Favorável, Vibração Neutra ou Tensão Vibracional.</Text>
        </View>
      </View>

      <View style={[styles.quadroRow, { backgroundColor: layoutTheme.cardFundoAlt }]} wrap={false}>
        <View style={{ backgroundColor: COR_FIXA.bloqueio, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, minWidth: 42, alignItems: 'center' }}>
          <Text style={{ fontSize: 8.5, fontFamily: BODY_FONT_BOLD, color: '#FFFFFF' }}>555</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Bloqueio</Text>
          <Text style={styles.body}>Três ou mais números iguais lado a lado em um triângulo. O relatório mostra onde aparece e se o nome novo ficou sem ela.</Text>
        </View>
      </View>

      <View style={{ backgroundColor: layoutTheme.cardFundo, borderRadius: 12, padding: 12, marginTop: 6 }} wrap={false}>
        <Text style={styles.cardTitle}>Por onde começar</Text>
        <Text style={styles.body}>
          Poucos minutos? Leia o resumo logo após a capa e a Parte 2. Já fez a análise gratuita? A Parte 1 você já conhece: vá direto para a Parte 2.
        </Text>
      </View>

      <PDFFooter />
    </Page>
  );
}
