import { View, Text } from '@react-pdf/renderer';
import { SCORE_CONFIG_V3 } from '../../../../shared/score-v3';
import { BODY_FONT_BOLD } from './PDFFonts';

const GRAY = '#4B5563';
const DARK = '#131313';

/** Bloco «Como Calculamos» alinhado a SCORE_CONFIG_V3 e landing /como-funciona-o-score. */
export function PDFComoCalculamosScore({ isV3 }: { isV3: boolean }) {
  const cfg = SCORE_CONFIG_V3;

  return (
    <>
      <Text style={{ fontSize: 9.5, color: GRAY, lineHeight: 1.6, marginBottom: 12, textAlign: 'justify' }}>
        O Score do Nome Magnético é um modelo estritamente matemático e determinístico, fundamentado nos critérios
        objetivos da Numerologia Cabalística tradicional. A avaliação parte da pontuação máxima (100 pontos) e aplica
        regras claras e auditáveis:
      </Text>

      <View style={{ gap: 8, marginBottom: 14 }}>
        <View wrap={false} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 3 }}>
            1. Base de Cálculo e Piso
          </Text>
          <Text style={{ fontSize: 8.5, color: GRAY, lineHeight: 1.5 }}>
            Todo nome inicia em {cfg.base} pontos. Nenhum nome recebe nota menor que {cfg.piso} pontos (piso de
            dignidade vibracional).
          </Text>
        </View>

        <View wrap={false} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 3 }}>
            2. Sequências no Triângulo da Vida
          </Text>
          <Text style={{ fontSize: 8.5, color: GRAY, lineHeight: 1.5 }}>
            Sequências repetidas (111..999) no Triângulo da Vida subtraem {cfg.sequenciasVida.porCodigoDistinto} pontos
            por padrão distinto. Ocorrências adicionais do mesmo código em linhas extras: −
            {cfg.sequenciasVida.porLinhaExtraMesmoCodigo} pontos por linha extra (teto de −
            {cfg.sequenciasVida.maxExtraPorCodigo} extras por código). Teto da categoria: −
            {cfg.sequenciasVida.tetoCategoria} pontos. Os triângulos Pessoal, Social e Destino são leituras
            complementares e não descontam pontos.
          </Text>
        </View>

        <View wrap={false} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 3 }}>
            3. Harmonia Expressão × Destino
          </Text>
          <Text style={{ fontSize: 8.5, color: GRAY, lineHeight: 1.5 }}>
            Relação Favorável (0 pts), Neutro (−{cfg.compatibilidade.neutro} pts) ou Tensão Vibracional (−
            {cfg.compatibilidade.desfavoravel} pts).
          </Text>
        </View>

        <View wrap={false} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 3 }}>
            4. Débitos Kármicos do Nome e Marca da Data
          </Text>
          <Text style={{ fontSize: 8.5, color: GRAY, lineHeight: 1.5 }}>
            Débitos originados na Expressão ou Motivação descontam conforme o motor v3. Débitos originados no dia do
            nascimento ou no Destino pertencem à data natalícia e têm desconto zero na nota do nome.
          </Text>
        </View>

        {isV3 && (
          <>
            <View wrap={false} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 }}>
              <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 3 }}>
                5. Tendências Ocultas
              </Text>
              <Text style={{ fontSize: 8.5, color: GRAY, lineHeight: 1.5 }}>
                −{cfg.tendenciasOcultas.porItem} pontos por tendência (números com 4+ repetições), teto de −
                {cfg.tendenciasOcultas.tetoCategoria} pontos na categoria.
              </Text>
            </View>

            <View wrap={false} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 }}>
              <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 3 }}>
                6. Lições Kármicas
              </Text>
              <Text style={{ fontSize: 8.5, color: GRAY, lineHeight: 1.5 }}>
                −{cfg.licoesCarmicas.porItem} pontos por lição (vibrações ausentes no nome), teto de −
                {cfg.licoesCarmicas.tetoCategoria} pontos na categoria.
              </Text>
            </View>
          </>
        )}

        <View wrap={false} style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: DARK, marginBottom: 3 }}>
            {isV3 ? '7' : '5'}. Escala de 5 Níveis (N1 a N5)
          </Text>
          <Text style={{ fontSize: 8.5, color: GRAY, lineHeight: 1.5 }}>
            N5 (85–100 Harmonioso), N4 (70–84 Favorável), N3 (50–69 Equilíbrio Parcial), N2 (30–49 Pede Atenção) e N1
            (0–29 Em Tensão).
          </Text>
        </View>
      </View>

      <View wrap={false} style={{ borderRadius: 6, backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1, borderColor: '#D4AF37', padding: 8, marginBottom: 12 }}>
        <Text style={{ fontSize: 8, color: '#92640F', textAlign: 'center', fontFamily: BODY_FONT_BOLD }}>
          Consulte o detalhamento completo das fórmulas em: nomemagnetico.com.br/como-funciona-o-score
        </Text>
      </View>
    </>
  );
}
