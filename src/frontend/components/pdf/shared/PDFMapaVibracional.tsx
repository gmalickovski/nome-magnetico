import { View, Text, Svg, Polygon, Line, Circle, Rect, StyleSheet } from '@react-pdf/renderer';
import type { ContextualRadarAxis, MotorRadarKey } from '../../../../shared/interactive-engine/motor-radar';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from './PDFFonts';
import { PDF_COLORS, PDF_TYPOGRAPHY } from './PDFTheme';
import { getScoreTierVisual } from '../../landing/score-tier-visual';
import { RADAR_SERIES_FILL_OPACITY } from '../../../../shared/interactive-engine/radar-visual';
import { ONDE_LABEL } from '../../../../shared/interactive-engine/chat-profile-copy';

const styles = StyleSheet.create({
  title: {
    ...PDF_TYPOGRAPHY.h2,
    fontFamily: TITLE_FONT,
    color: '#92640F',
    borderBottomColor: '#D4AF37',
  },
  subSectionTitle: {
    ...PDF_TYPOGRAPHY.h3,
    fontFamily: TITLE_FONT,
    color: '#92640F',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
  },
  text: {
    ...PDF_TYPOGRAPHY.paragraph,
    fontFamily: BODY_FONT,
  },
  cardText: {
    ...PDF_TYPOGRAPHY.cardText,
    fontFamily: BODY_FONT,
  },
  commentNote: {
    fontFamily: BODY_FONT,
    fontSize: 9,
    lineHeight: 1.55,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  commentBox: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 2,
    borderLeftColor: '#D1D5DB',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8 },
});

interface AxisEditorialMeta {
  subtitle: string;
  meaning: string;
}

const AXIS_META: Record<MotorRadarKey, AxisEditorialMeta> = {
  expressao: {
    subtitle: 'Afinidade com a Área Prioritária',
    meaning:
      'Mede a afinidade do seu número de Expressão com a área prioritária declarada (ou a harmonia geral com o Destino, quando não há foco específico). Sequências repetidas no Triângulo da Vida ligadas a esse tema atuam como resistências e reduzem este índice.',
  },
  motivacao: {
    subtitle: 'Ressonância Interior e Triângulo Pessoal',
    meaning:
      'Combina a ressonância interna entre a Motivação (vogais do nome, seu impulso mais profundo) e a Expressão com os reflexos do Triângulo Pessoal. Revela o quanto suas escolhas externas sustentam o que você realmente sente por dentro, como leitura simbólica de autoconhecimento.',
  },
  destino: {
    subtitle: 'Alinhamento com a Data Natalícia',
    meaning:
      'Relaciona a Expressão do nome ao seu número de Destino (imutável por nascer da data de nascimento), verificando se a combinação é Harmônica, Neutra ou de Tensão Vibracional, com reforço quando a Missão potencializa essa sintonia.',
  },
  harmonia_triangulo: {
    subtitle: 'Projeção Externa e Canais de Uso',
    meaning:
      'Cruza a força da Impressão (consoantes do nome, a primeira frequência captada pelo coletivo) nos canais em que você assina e se apresenta com a fluidez do Triângulo Social, sem constituir previsão de reconhecimento ou êxito.',
  },
  sequencias: {
    subtitle: 'Circulação Livre no Triângulo da Vida',
    meaning:
      'Indica o grau de livre circulação energética no Triângulo da Vida, o pilar que estrutura o score. Atinge 100% quando a assinatura é desenhada sem sequências repetidas negativas; cada bloqueio ativo nesse triângulo reduz o fluxo proporcionalmente.',
  },
};

function getDeltaTheme(delta: number): { color: string; bg: string } {
  if (delta > 0) return { color: '#047857', bg: '#F0FDF4' };
  if (delta < 0) return { color: '#B91C1C', bg: '#FEF2F2' };
  return { color: '#9A6B00', bg: '#FFFBF0' };
}

const point = (index: number, value: number) => {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
  return { x: 235 + 100 * value * Math.cos(angle), y: 123 + 100 * value * Math.sin(angle) };
};

const points = (values: number[]) =>
  values
    .map((v, i) => {
      const p = point(i, v);
      return `${p.x},${p.y}`;
    })
    .join(' ');

function formatUsageChannels(usos: string[]): string {
  if (!usos || usos.length === 0) return 'não informado';
  return usos.map((u) => ONDE_LABEL[u] ?? u).join(', ');
}

/** Séries calculadas no servidor, pelo mesmo motor e contexto usado no app. */
export function PDFMapaVibracional({
  birth,
  selected,
  birthScore,
  selectedScore,
  hasContext,
  areaFoco,
  usos,
  compactWebOnly = false,
}: {
  birth: ContextualRadarAxis[];
  selected: ContextualRadarAxis[];
  birthScore: number;
  selectedScore: number;
  hasContext: boolean;
  areaFoco?: string | null;
  usos: string[];
  compactWebOnly?: boolean;
}) {
  const birthVisual = getScoreTierVisual(birthScore);
  const selectedVisual = getScoreTierVisual(selectedScore);

  const webSvg = (
    <Svg
      viewBox="0 -4 470 263"
      width="100%"
      height={compactWebOnly ? 185 : 240}
      style={{ marginTop: compactWebOnly ? 2 : 6, marginBottom: 4 }}
    >
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <Polygon
          key={v}
          points={points(birth.map(() => v))}
          fill="none"
          stroke={compactWebOnly ? '#E2DCCD' : '#CBD5E1'}
          strokeWidth={0.7}
        />
      ))}
      {birth.map((_, i) => {
        const p = point(i, 1);
        return (
          <Line
            key={i}
            x1={235}
            y1={123}
            x2={p.x}
            y2={p.y}
            stroke={compactWebOnly ? '#E2DCCD' : '#CBD5E1'}
            strokeWidth={0.5}
          />
        );
      })}
      <Polygon
        points={points(birth.map((a) => a.value))}
        fill={birthVisual.stroke}
        fillOpacity={RADAR_SERIES_FILL_OPACITY}
        stroke={birthVisual.stroke}
        strokeOpacity={1}
        strokeWidth={1.2}
        strokeDasharray="1.5 3"
      />
      {birth.map((a, i) => {
        const p = point(i, a.value);
        return (
          <Rect
            key={a.key}
            x={p.x - 2.5}
            y={p.y - 2.5}
            width={5}
            height={5}
            fill={birthVisual.stroke}
            opacity={1}
          />
        );
      })}
      {/* A assinatura é pintada por último, inclusive sobre os marcadores de nascimento. */}
      <Polygon
        points={points(selected.map((a) => a.value))}
        fill={selectedVisual.stroke}
        fillOpacity={RADAR_SERIES_FILL_OPACITY}
        stroke={selectedVisual.stroke}
        strokeWidth={2.4}
      />
      {selected.map((a, i) => {
        const p = point(i, a.value);
        return (
          <Circle
            key={a.key}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={selectedVisual.stroke}
          />
        );
      })}
      {birth.map((a, i) => {
        const p = point(i, 1.22);
        return (
          <Text
            key={a.key}
            x={p.x}
            y={i === 0 ? 12 : p.y}
            style={{ fontFamily: BODY_FONT_BOLD, fontSize: 9.5 }}
            textAnchor={i === 0 ? 'middle' : i < 3 ? 'start' : 'end'}
            fill="#2A2620"
          >
            {a.label}
          </Text>
        );
      })}
    </Svg>
  );

  if (compactWebOnly) {
    return (
      <View wrap={false} style={{ alignItems: 'center' }}>
        {webSvg}
        <Text style={{ fontFamily: BODY_FONT, fontSize: 8.5, color: '#6E6658', textAlign: 'center', lineHeight: 1.4, marginTop: 2 }}>
          Quanto mais aberta a teia, mais equilibrado o nome nesses cinco aspectos. Não muda a nota.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Mapa Vibracional</Text>
      <Text style={styles.text}>
        Comparação entre Nome de Nascimento e Assinatura Selecionada sob o mesmo contexto. Os cinco índices vão de 0 a 100 e indicam o alinhamento contextual de cada dimensão, medindo variações em pontos de índice.
      </Text>
      {hasContext ? (
        <Text style={styles.text}>
          Área de foco: <Text style={{ fontFamily: BODY_FONT_BOLD }}>{areaFoco ? birth[0].label.replace('Foco: ', '') : 'não informada'}</Text>. Uso: {formatUsageChannels(usos)}.
        </Text>
      ) : (
        <Text style={[styles.commentNote, { marginBottom: 8 }]}>
          Calculado sem área de foco ou contexto de uso informados — leitura geral do motor, sem personalização.
        </Text>
      )}

      <View wrap={false}>
        {webSvg}

        <Text style={[styles.commentNote, { fontSize: 8.5, marginBottom: 2 }]}>
          Nascimento: linha pontilhada discreta e quadrados. Assinatura selecionada: linha contínua em destaque e círculos, sempre por cima.
        </Text>
        <Text style={[styles.commentNote, { fontSize: 8.5, marginBottom: 8 }]}>
          Cores por faixa de score: nascimento {birthScore}/100 ({birthVisual.label}); assinatura {selectedScore}/100 ({selectedVisual.label}).
        </Text>

        <View
          style={[
            styles.row,
            { backgroundColor: '#F3F4F6', fontFamily: BODY_FONT_BOLD, fontSize: 9.5, color: PDF_COLORS.text },
          ]}
        >
          <Text style={{ flex: 1 }}>Eixo</Text>
          <Text style={{ width: 72 }}>Nascimento</Text>
          <Text style={{ width: 72 }}>Assinatura</Text>
          <Text style={{ width: 65 }}>Diferença</Text>
        </View>
        {birth.map((a, i) => {
          const b = selected[i];
          const delta = b.valuePercent - a.valuePercent;
          const deltaTheme = getDeltaTheme(delta);
          return (
            <View
              key={a.key}
              style={[
                styles.row,
                { fontFamily: BODY_FONT, fontSize: 9.5, backgroundColor: i % 2 ? '#F9FAFB' : '#FFFFFF' },
              ]}
            >
              <Text style={{ flex: 1, fontFamily: BODY_FONT_BOLD, color: deltaTheme.color }}>{a.label}</Text>
              <Text style={{ width: 72, fontFamily: BODY_FONT_BOLD, color: '#9A6B00' }}>{a.valuePercent}</Text>
              <Text style={{ width: 72, color: deltaTheme.color, fontFamily: BODY_FONT_BOLD }}>{b.valuePercent}</Text>
              <Text style={{ width: 65, color: deltaTheme.color, fontFamily: BODY_FONT_BOLD }}>
                {delta > 0 ? '+' : ''}
                {delta} pontos
              </Text>
            </View>
          );
        })}
      </View>

      {/* Significado das 5 pontas — cards coloridos pela variação de pontuação */}
      <View style={{ marginTop: 16 }}>
        <View wrap={false} style={{ marginBottom: 10 }}>
          <Text style={styles.subSectionTitle}>O Significado das 5 Pontas do Mapa</Text>
          <Text style={[styles.text, { marginBottom: 0 }]}>
            Cada vértice do pentágono cruza os números cabalísticos do seu nome com o contexto escolhido, revelando onde a nova assinatura fortalece ou desbloqueia sua expressão prática.
          </Text>
        </View>

        {birth.map((a, i) => {
          const b = selected[i];
          const meta = AXIS_META[a.key] ?? AXIS_META.expressao;
          const delta = b.valuePercent - a.valuePercent;
          const deltaTheme = getDeltaTheme(delta);

          return (
            <View
              key={a.key}
              wrap={false}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 8,
                backgroundColor: deltaTheme.bg,
                borderRadius: 6,
                padding: 12,
              }}
            >
              <View style={{ width: 46, alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontFamily: TITLE_FONT, fontSize: 20, color: deltaTheme.color, lineHeight: 1 }}>
                  {b.valuePercent}
                </Text>
                <Text
                  style={{
                    fontSize: 8,
                    fontFamily: BODY_FONT_BOLD,
                    color: deltaTheme.color,
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  {delta > 0 ? `+${delta}` : delta} pontos
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...PDF_TYPOGRAPHY.h4,
                    fontFamily: BODY_FONT_BOLD,
                    color: deltaTheme.color,
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  }}
                >
                  {a.label} — {meta.subtitle}
                </Text>
                <Text style={styles.cardText}>{meta.meaning}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View wrap={false} style={styles.commentBox}>
        <Text style={styles.commentNote}>
          Observação metodológica: O Mapa não altera o score e os índices não representam probabilidade de sucesso. Pessoal e Social são leituras contextuais, sem desconto direto na nota global. A Estrela dos cinco números é uma leitura distinta; número numerológico maior não significa qualidade melhor.
        </Text>
      </View>
    </View>
  );
}
