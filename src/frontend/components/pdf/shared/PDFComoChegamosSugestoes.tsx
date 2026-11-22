/**
 * Quadro curto "Como chegamos às sugestões" do PDF do Nome Social (DEV-322, entrega A).
 *
 * Substitui `PDFComoCalculamosScore` no Nome Social pago: sem tabela de pontos, sem escala
 * N1–N5, sem nome de versão do motor. O detalhe fica na página pública.
 */
import { View, Text } from '@react-pdf/renderer';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from './PDFFonts';
import { LAYOUT_THEME_PADRAO, type PdfLayoutTheme } from '../layout/pdfLayoutTheme';

const PASSOS: Array<[string, string, string]> = [
  ['1', 'Calculamos o seu nome de nascimento', 'Cinco números, quatro triângulos, lições, tendências e débitos kármicos, sempre a partir das letras e da data de nascimento.'],
  ['2', 'Procuramos bloqueios', 'Sequências repetidas nos quatro triângulos. Toda sugestão deste relatório vem sem bloqueio.'],
  ['3', 'Comparamos Expressão e Destino', 'O nome precisa conversar bem com a data de nascimento. Opções em Tensão Vibracional não são sugeridas.'],
  ['4', 'Damos uma nota de 0 a 100', 'A nota resume os pontos acima e serve para ordenar as opções. Quanto mais perto de 100, melhor a combinação com a sua data.'],
  ['5', 'Respeitamos o seu contexto', 'As respostas do chat (como você assina, onde usa o nome e o que quer manter) orientam quais variações aparecem primeiro.'],
];

export function PDFComoChegamosSugestoes({ layoutTheme = LAYOUT_THEME_PADRAO }: { layoutTheme?: PdfLayoutTheme }) {
  return (
    <>
      <Text style={{ fontSize: 9.5, fontFamily: BODY_FONT, color: layoutTheme.tintaSuave, lineHeight: 1.55, marginBottom: 10 }}>
        O cálculo é matemático e sempre o mesmo para a mesma entrada: nada aqui é sorteado. Estes são os passos que levaram às
        opções do seu relatório.
      </Text>

      <View style={{ gap: 6, marginBottom: 10 }}>
        {PASSOS.map(([n, t, d]) => (
          <View
            key={t}
            wrap={false}
            style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: layoutTheme.cardFundoAlt, borderRadius: 10, padding: 9 }}
          >
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 13, color: layoutTheme.destaqueTexto, minWidth: 14 }}>{n}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: layoutTheme.tinta, marginBottom: 2 }}>{t}</Text>
              <Text style={{ fontSize: 8.5, fontFamily: BODY_FONT, color: layoutTheme.tintaSuave, lineHeight: 1.45 }}>{d}</Text>
            </View>
          </View>
        ))}
      </View>

      <View
        wrap={false}
        style={{ borderRadius: 10, backgroundColor: layoutTheme.cardFundo, padding: 8, marginBottom: 8 }}
      >
        <Text style={{ fontSize: 8, color: layoutTheme.destaqueTexto, textAlign: 'center', fontFamily: BODY_FONT_BOLD }}>
          Quer ver a explicação completa? Acesse nomemagnetico.com.br/como-funciona-o-score
        </Text>
      </View>
    </>
  );
}
