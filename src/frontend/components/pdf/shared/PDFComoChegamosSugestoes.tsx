/**
 * Quadro curto "Como chegamos às sugestões" do PDF do Nome Social (DEV-322, entrega A).
 *
 * Substitui `PDFComoCalculamosScore` no Nome Social pago: sem tabela de pontos, sem escala
 * N1–N5, sem nome de versão do motor. O detalhe fica na página pública.
 */
import { View, Text } from '@react-pdf/renderer';
import { BODY_FONT, BODY_FONT_BOLD } from './PDFFonts';

const GRAY = '#4B5563';
const DARK = '#131313';

const PASSOS: Array<[string, string]> = [
  ['1. Calculamos o seu nome de nascimento', 'Cinco números, quatro triângulos, lições, tendências e débitos kármicos, sempre a partir das letras e da data de nascimento.'],
  ['2. Procuramos bloqueios', 'Sequências repetidas nos quatro triângulos. Toda sugestão deste relatório vem sem bloqueio.'],
  ['3. Comparamos Expressão e Destino', 'O nome precisa conversar bem com a data de nascimento. Opções em Tensão Vibracional não são sugeridas.'],
  ['4. Damos uma nota de 0 a 100', 'A nota resume os pontos acima e serve para ordenar as opções. Quanto mais perto de 100, melhor a combinação com a sua data.'],
  ['5. Respeitamos o seu contexto', 'As respostas do chat (como você assina, onde usa o nome e o que quer manter) orientam quais variações aparecem primeiro.'],
];

export function PDFComoChegamosSugestoes() {
  return (
    <>
      <Text style={{ fontSize: 9.5, fontFamily: BODY_FONT, color: GRAY, lineHeight: 1.6, marginBottom: 12, textAlign: 'justify' }}>
        O cálculo é matemático e sempre o mesmo para a mesma entrada: nada aqui é sorteado. Estes são os passos que levaram às
        opções do seu relatório.
      </Text>

      <View style={{ gap: 8, marginBottom: 14 }}>
        {PASSOS.map(([t, d]) => (
          <View
            key={t}
            wrap={false}
            style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 }}
          >
            <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 3 }}>{t}</Text>
            <Text style={{ fontSize: 8.5, fontFamily: BODY_FONT, color: GRAY, lineHeight: 1.5 }}>{d}</Text>
          </View>
        ))}
      </View>

      <View
        wrap={false}
        style={{ borderRadius: 6, backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1, borderColor: '#D4AF37', padding: 8, marginBottom: 12 }}
      >
        <Text style={{ fontSize: 8, color: '#92640F', textAlign: 'center', fontFamily: BODY_FONT_BOLD }}>
          Quer ver a explicação completa? Acesse nomemagnetico.com.br/como-funciona-o-score
        </Text>
      </View>
    </>
  );
}
