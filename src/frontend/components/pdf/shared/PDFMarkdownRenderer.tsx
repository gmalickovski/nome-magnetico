/**
 * PDFMarkdownRenderer — converte texto Markdown em componentes @react-pdf/renderer.
 *
 * Injeção automática de elementos gráficos após headings correspondentes:
 *  - Triângulos numerológicos → sob headings "Triângulo da Vida / Pessoal / Social / Destino"
 *  - Bloqueios energéticos    → sob headings que mencionem "Bloqueio" / "Raio-X"
 *  - Débitos + Lições         → sob headings que mencionem "Karma" / "Peso do Passado" / "Lição"
 *  - Tendências Ocultas       → sob headings que mencionem "Tendência" / "Oculta"
 */
import { View, Text, StyleSheet, Svg, Path, Text as SvgText } from '@react-pdf/renderer';
import {
  BloqueiosBlock,
  DebitosBlock,
  LicoesBlock,
  TendenciasBlock,
  type BloqueioData,
  type DebitoData,
  type LicaoData,
  type TendenciaData,
} from './PDFKarmicBlock';
import { TITLE_FONT } from './PDFFonts';

// ── Helpers de texto ──────────────────────────────────────────────────────────

/** Remove emojis Unicode — @react-pdf não suporta a maioria */
export function stripEmoji(str: string): string {
  return str
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu,
      ''
    )
    .replace(/\s{2,}/g, ' ');
}

export function stripEmojiTrim(str: string): string {
  return stripEmoji(str).trim();
}

/** Renderiza um trecho de texto com suporte a **bold** */
export function renderMarkdownPiece(
  text: string,
  baseStyle: any,
  boldStyle: any
): React.ReactNode[] {
  const rawParts = text.split(/\*\*([^*]+)\*\*/g);

  // Mover espaços nas fronteiras para dentro do elemento bold (fix de react-pdf)
  const parts = [...rawParts];
  for (let i = 1; i < parts.length; i += 2) {
    if (i - 1 >= 0 && parts[i - 1].endsWith(' ')) {
      parts[i] = ' ' + parts[i];
      parts[i - 1] = parts[i - 1].slice(0, -1);
    }
    if (i + 1 < parts.length && parts[i + 1].startsWith(' ')) {
      parts[i] = parts[i] + ' ';
      parts[i + 1] = parts[i + 1].slice(1);
    }
  }

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <Text key={i} style={{ ...baseStyle, ...boldStyle }}>
          {stripEmoji(part)}
        </Text>
      );
    }
    return <Text key={i} style={baseStyle}>{stripEmoji(part)}</Text>;
  });
}

export function capitalizeTitle(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ── Detecção de seções para injeção inline ────────────────────────────────────

type TriangleKey = 'vida' | 'pessoal' | 'social' | 'destino';
type KarmicKey = 'bloqueios' | 'karma' | 'tendencias';

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '');
}

function detectTriangleKey(content: string): TriangleKey | null {
  const norm = normalizeStr(content);
  if (!norm.includes('triangulo')) return null;
  if (norm.includes('vida')) return 'vida';
  if (norm.includes('pessoal')) return 'pessoal';
  if (norm.includes('social')) return 'social';
  if (norm.includes('destino')) return 'destino';
  return null;
}

function detectKarmicKey(content: string): KarmicKey | null {
  const norm = normalizeStr(content);
  if (
    norm.includes('bloqueio') ||
    norm.includes('raio x') ||
    norm.includes('raio-x') ||
    norm.includes('sequencia negativa')
  )
    return 'bloqueios';
  if (
    norm.includes('karma') ||
    norm.includes('licao') ||
    norm.includes('peso do passado') ||
    norm.includes('debito') ||
    norm.includes('passado')
  )
    return 'karma';
  if (norm.includes('tendencia') || norm.includes('oculta') || norm.includes('frequencia'))
    return 'tendencias';
  return null;
}

// ── Componente: Pirâmide de triângulo inline ──────────────────────────────────

export interface TrianguloData {
  tipo: string;
  linhas: number[][];
  arcanoRegente: number | null;
  sequenciasNegativas: string[];
}

function buildBloqueioPositions(linhas: number[][]): Set<string> {
  const set = new Set<string>();
  for (let li = 0; li < linhas.length; li++) {
    const row = linhas[li];
    let i = 0;
    while (i < row.length) {
      let j = i + 1;
      while (j < row.length && row[j] === row[i]) j++;
      if (j - i >= 3) {
        for (let k = i; k < j; k++) set.add(`${li}:${k}`);
      }
      i = j;
    }
  }
  return set;
}

const triStyles = StyleSheet.create({
  card: {
    marginTop: 6,
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    backgroundColor: '#FAFAFA',
    alignItems: 'stretch',
  },
  cardLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#D4AF37',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cellBase: {
    borderWidth: 0.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNormal: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  cellBloqueio: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  cellRegent: {
    backgroundColor: '#3B0764',
    borderColor: '#6D28D9',
  },
  arcano: {
    fontSize: 7,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  bloqueioAlert: {
    fontSize: 7,
    color: '#DC2626',
    marginTop: 3,
    textAlign: 'center',
  },
});

function buildRoundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return (
    `M${x + rr},${y}` +
    `H${x + w - rr}` +
    `Q${x + w},${y} ${x + w},${y + rr}` +
    `V${y + h - rr}` +
    `Q${x + w},${y + h} ${x + w - rr},${y + h}` +
    `H${x + rr}` +
    `Q${x},${y + h} ${x},${y + h - rr}` +
    `V${y + rr}` +
    `Q${x},${y} ${x + rr},${y}Z`
  );
}

export function TrianguloPiramideInline({
  data,
  label,
  cellSize,
  letras,
  bloqueios,
  triKey,
  hideValues = false,
}: {
  data: TrianguloData;
  label: string;
  cellSize: number;
  letras?: string[];
  bloqueios?: BloqueioData[];
  triKey?: string;
  /** Quando true: renderiza a grade estrutural com células vazias (sem números, sem marcações
   *  de bloqueio). Usado nos triângulos bloqueados do PDF gratuito. */
  hideValues?: boolean;
}) {
  // Com hideValues, nenhuma célula é colorida como bloqueio ou arcano regente
  const bloqueioPositions = hideValues ? new Set<string>() : buildBloqueioPositions(data.linhas);
  const cellFontSize = Math.max(4, Math.floor(cellSize * 0.65));
  const letterFontSize = Math.max(5, Math.floor(cellSize * 0.7));
  const hasLetters = Boolean(letras && data.linhas[0] && letras.length === data.linhas[0].length);
  const hStep = cellSize + 1;
  const vStep = cellSize + 3;
  const headerOffset = hasLetters ? letterFontSize + 5 : 0;
  const totalHeight = headerOffset + data.linhas.length * vStep;
  const canRenderSvg = data.linhas.length > 0 && totalHeight + 60 <= 620;

  if (canRenderSvg) {
    const cols = data.linhas[0].length;
    const svgWidth = Math.max(cellSize, cols * hStep);
    const svgHeight = Math.max(cellSize, totalHeight);
    let normalPath = '';
    let bloqueioPath = '';
    let regentPath = '';
    const textEls: React.ReactNode[] = [];

    if (hasLetters && letras) {
      const letterFill = hideValues ? '#9CA3AF' : '#4B5563';
      const letterY = letterFontSize + 1;
      for (let ni = 0; ni < letras.length; ni++) {
        const cx = 0.5 + ni * hStep + cellSize / 2;
        textEls.push(
          <SvgText
            key={`l-${ni}`}
            x={cx}
            y={letterY}
            textAnchor="middle"
            fill={letterFill}
            style={{ fontSize: letterFontSize, fontFamily: 'Helvetica-Bold' }}
          >
            {letras[ni]}
          </SvgText>
        );
      }
    }

    for (let li = 0; li < data.linhas.length; li++) {
      const linha = data.linhas[li];
      const rowOffset = (li * hStep) / 2;
      const y = headerOffset + li * vStep;
      const isFirstRow = li === 0;
      const isRegent = !hideValues && li === data.linhas.length - 1;

      for (let ni = 0; ni < linha.length; ni++) {
        const x = 0.5 + rowOffset + ni * hStep;
        const isBloqueio = !hideValues && bloqueioPositions.has(`${li}:${ni}`);
        const rectPath = buildRoundedRectPath(x, y, cellSize, cellSize, 3);
        if (isBloqueio) {
          bloqueioPath += rectPath;
        } else if (isRegent) {
          regentPath += rectPath;
        } else {
          normalPath += rectPath;
        }

        if (!hideValues) {
          let textColor = isBloqueio ? '#FFFFFF' : '#1F2937';
          if (isFirstRow && !isBloqueio) textColor = '#D4AF37';
          if (isRegent && !isBloqueio) textColor = '#EDE9FE';
          textEls.push(
            <SvgText
              key={`c-${li}-${ni}`}
              x={x + cellSize / 2}
              y={y + cellSize / 2 + cellFontSize * 0.35}
              textAnchor="middle"
              fill={textColor}
              style={{ fontSize: cellFontSize, fontFamily: 'Helvetica-Bold' }}
            >
              {String(linha[ni])}
            </SvgText>
          );
        }
      }
    }

    return (
      <View wrap={false} style={triStyles.card}>
        <Text style={triStyles.cardLabel}>{label}</Text>
        <Svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ alignSelf: 'center' }}
        >
          {normalPath ? (
            <Path d={normalPath} fill="#F3F4F6" stroke="#D1D5DB" strokeWidth={0.5} />
          ) : null}
          {bloqueioPath ? (
            <Path d={bloqueioPath} fill="#DC2626" stroke="#B91C1C" strokeWidth={0.5} />
          ) : null}
          {regentPath ? (
            <Path d={regentPath} fill="#3B0764" stroke="#6D28D9" strokeWidth={0.5} />
          ) : null}
          {textEls}
        </Svg>

        {!hideValues && bloqueios && triKey && (() => {
          const filtrados = bloqueios.filter(b => b.triangulos?.includes(triKey));
          return filtrados.length > 0 ? (
            <BloqueiosBlock bloqueios={filtrados} />
          ) : null;
        })()}
      </View>
    );
  }

  return (
    <View wrap={data.linhas.length * (cellSize + 1) + 60 > 620} style={triStyles.card}>
      <Text style={triStyles.cardLabel}>{label}</Text>

      {letras && letras.length === data.linhas[0].length ? (
        <View wrap={false} style={triStyles.row}>
          {letras.map((char, ni) => (
            <View
              key={`letra-${ni}`}
              style={{
                width: cellSize,
                margin: 0.5,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 2,
              }}
            >
              <Text
                style={{
                  fontSize: letterFontSize,
                  fontFamily: 'Helvetica-Bold',
                  color: hideValues ? '#9CA3AF' : '#4B5563',
                }}
              >
                {char}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.linhas.map((linha, li) => (
        <View key={li} wrap={false} style={triStyles.row}>
          {linha.map((num, ni) => {
            const isBloqueio = !hideValues && bloqueioPositions.has(`${li}:${ni}`);
            const isFirstRow = li === 0;
            const isRegent = !hideValues && li === data.linhas.length - 1;

            const cellStyle = isBloqueio
              ? triStyles.cellBloqueio
              : isRegent
              ? triStyles.cellRegent
              : triStyles.cellNormal;
            let textColor = isBloqueio ? '#FFFFFF' : '#1F2937';
            if (isFirstRow && !isBloqueio) textColor = '#D4AF37';
            if (isRegent && !isBloqueio) textColor = '#EDE9FE';

            return (
              <View
                key={ni}
                style={[
                  triStyles.cellBase,
                  { width: cellSize, height: cellSize, margin: 0.5 },
                  cellStyle,
                ]}
              >
                {/* hideValues: célula vazia — sem número, sem cor de bloqueio */}
                {!hideValues && (
                  <Text
                    style={{
                      fontSize: cellFontSize,
                      fontFamily: 'Helvetica-Bold',
                      color: textColor,
                    }}
                  >
                    {num}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}

      {!hideValues && bloqueios && triKey && (() => {
        const filtrados = bloqueios.filter(b => b.triangulos?.includes(triKey));
        return filtrados.length > 0 ? (
          <BloqueiosBlock bloqueios={filtrados} />
        ) : null;
      })()}
    </View>
  );
}

// ── Tipos para o renderer ─────────────────────────────────────────────────────

export interface TriangleMap {
  vida?: TrianguloData | null;
  pessoal?: TrianguloData | null;
  social?: TrianguloData | null;
  destino?: TrianguloData | null;
}

const TRIANGLE_LABELS: Record<TriangleKey, string> = {
  vida: 'Triangulo da Vida',
  pessoal: 'Triangulo Pessoal',
  social: 'Triangulo Social',
  destino: 'Triangulo do Destino',
};

// ── Rastro de injeção (para não injetar o mesmo bloco duas vezes) ─────────────
// Quando uma seção kármica é detectada, registra para não duplicar.
type InjectionState = {
  bloqueiosInjetados: boolean;
  karmaInjetado: boolean;
  tendenciasInjetadas: boolean;
};

// ── Componente principal ──────────────────────────────────────────────────────

interface RenderMarkdownChunksProps {
  text: string;
  styles: any;
  GOLD: string;
  triangleMap?: TriangleMap;
  triCellSize?: number;
  letrasNome?: string[];
  // Dados para injeção inline de blocos kármicos
  bloqueios?: BloqueioData[];
  debitos?: DebitoData[];
  licoes?: LicaoData[];
  tendencias?: TendenciaData[];
  frequencias?: Record<string, number> | null;
  // Controle de páginas
  pageBreaks?: string[];
  injections?: Record<string, React.ReactNode>;
}

export function RenderMarkdownChunks({
  text,
  styles,
  GOLD,
  triangleMap,
  triCellSize,
  letrasNome,
  bloqueios,
  debitos,
  licoes,
  tendencias,
  frequencias,
  pageBreaks,
  injections,
}: RenderMarkdownChunksProps) {
  if (!text) return null;

  const cellSize = triCellSize ?? 14;
  const result: React.ReactNode[] = [];

  // Estado de injeção: cada tipo de bloco é injetado apenas 1 vez
  const injectionState: InjectionState = {
    bloqueiosInjetados: false,
    karmaInjetado: false,
    tendenciasInjetadas: false,
  };

  // FORÇA BRUTA INTERNA: Assegura que toda e qualquer linha com ### tenha linhas em branco antes e depois.
  // Isso resolve definitivamente arquivos que vêm colados por falha do LLM e bypassaram o textFormatter.
  let textParsed = text.replace(/(^|\n)[ \t]*(#{1,6}\s+[^\n]+)/g, '$1\n\n$2\n\n');
  textParsed = textParsed.replace(/\n{3,}/g, '\n\n');

  const blocks = textParsed.split(/\n\s*\n/);

  blocks.forEach((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    // ── Headings ──────────────────────────────────────────────────────────────
    const matchHeader = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (matchHeader) {
      const level = matchHeader[1].length;
      const content = stripEmojiTrim(matchHeader[2]).replace(/\*\*/g, '');
      
      const isTrianguloTitle = detectTriangleKey(content) !== null;

      const isAntidotoTitle = level === 3 && normalizeStr(content).startsWith('bloqueio');

      if (isAntidotoTitle) {
        let antidotoText = '';
        const nextBlock = blocks[idx + 1];
        if (nextBlock) {
          const trimmedNext = nextBlock.trim();
          if (!trimmedNext.match(/^(#{1,6})\s+/)) {
            antidotoText = stripEmojiTrim(trimmedNext);
            // Marcar para pular a próxima iteração
            (blocks as string[])[idx + 1] = '';
          }
        }

        const renderBoldText = (rawStr: string, clr: string) => {
          let str = rawStr.replace(/^[-*•]\s*/, '');
          str = str.replace(/\*\*(.*?)\*\*/g, (_, p1) => `<bold>${p1}</bold>`);
          const parts = str.split(/(<bold>.*?<\/bold>)/g);
          return parts.map((pt, i) => {
            if (pt.startsWith('<bold>')) {
              return <Text key={i} style={{ fontFamily: 'Helvetica-Bold', color: clr }}>{pt.replace(/<\/?bold>/g, '')}</Text>;
            }
            return <Text key={i} style={{ fontFamily: 'Helvetica', color: clr }}>{pt}</Text>;
          });
        };

        const shouldBreak = pageBreaks?.some(b => normalizeStr(content).includes(normalizeStr(b)));

        result.push(
          <View key={`antidoto-${idx}`} wrap={false} break={shouldBreak} style={{ backgroundColor: '#292524', padding: 14, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ea580c', marginBottom: 16, marginTop: 4 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#fed7aa', marginBottom: 8 }}>
              {content}
            </Text>
            {antidotoText ? (
              <Text style={{ fontSize: 10.5, lineHeight: 1.6 }}>
                {renderBoldText(antidotoText, '#e7e5e4')}
              </Text>
            ) : null}
          </View>
        );
        return;
      }

      let fontSize = level === 1 ? 20 : level === 2 ? 15 : level === 3 ? 12 : 10;
      let fontColor = level >= 3 ? (level === 4 ? '#F59E0B' : '#6d28d9') : GOLD;
      let fontFam = 'Helvetica-Bold';
      let textTransform: any = 'none';
      let letterSpacing = level <= 2 ? 0.4 : 0;
      let borderBottomWidth = 0;
      let borderBottomColor = 'transparent';
      let paddingBottom = 0;
      let textAlign: any = 'left';

      if (level === 2) {
        fontSize = 13;
        fontFam = TITLE_FONT;
        fontColor = GOLD; // usa a cor primária do produto passada via prop
        textTransform = 'uppercase';
        letterSpacing = 0.5;
        borderBottomWidth = 1;
        borderBottomColor = GOLD;
        paddingBottom = 4;
      }

      const marginTop = level === 1 ? 14 : level === 2 ? 10 : level === 3 ? 8 : 4;
      const marginBottom = level === 1 ? 8 : level === 2 ? 6 : level === 3 ? 4 : 2;

      const shouldBreak = pageBreaks?.some(b => normalizeStr(content).includes(normalizeStr(b)));
      const injectionKey = injections ? Object.keys(injections).find(k => normalizeStr(content).includes(normalizeStr(k))) : undefined;

      result.push(
        <View key={idx} break={shouldBreak}>
          <Text
            style={{
              fontSize,
              fontFamily: fontFam,
              color: fontColor,
              marginTop: result.length === 0 && !injectionKey && !shouldBreak ? 0 : marginTop,
              marginBottom,
              letterSpacing,
              textTransform,
              borderBottomWidth,
              borderBottomColor,
              paddingBottom,
              textAlign,
            }}
          >
            {content}
          </Text>
          {injectionKey && injections ? injections[injectionKey] : null}
        </View>
      );

      // ── Injeção: Triângulos ───────────────────────────────────────────────
      if (triangleMap && level >= 2) {
        const triKey = detectTriangleKey(content);
        if (triKey) {
          const tData = triangleMap[triKey];
          if (tData) {
            result.push(
              <TrianguloPiramideInline
                key={`pyramid-${triKey}-${idx}`}
                data={tData}
                label={TRIANGLE_LABELS[triKey]}
                cellSize={cellSize}
                letras={letrasNome}
                bloqueios={bloqueios}
                triKey={triKey}
              />
            );
          }
        }
      }

      // ── Injeção: Bloqueios ───────────────────────────────────────────────
      if (bloqueios && !injectionState.bloqueiosInjetados && level >= 2) {
        const kKey = detectKarmicKey(content);
        if (kKey === 'bloqueios') {
          injectionState.bloqueiosInjetados = true;
          result.push(
            <BloqueiosBlock key={`bloqueios-${idx}`} bloqueios={bloqueios} />
          );
        }
      }

      // ── Injeção: Débitos + Lições ─────────────────────────────────────────
      if (!injectionState.karmaInjetado && level >= 2) {
        const kKey = detectKarmicKey(content);
        if (kKey === 'karma') {
          injectionState.karmaInjetado = true;
          if (debitos && debitos.length >= 0) {
            result.push(<DebitosBlock key={`debitos-${idx}`} debitos={debitos} />);
          }
          if (licoes && licoes.length >= 0) {
            result.push(<LicoesBlock key={`licoes-${idx}`} licoes={licoes} />);
          }
        }
      }

      // ── Injeção: Tendências ───────────────────────────────────────────────
      if (tendencias && !injectionState.tendenciasInjetadas && level >= 2) {
        const kKey = detectKarmicKey(content);
        if (kKey === 'tendencias') {
          injectionState.tendenciasInjetadas = true;
          result.push(
            <TendenciasBlock
              key={`tendencias-${idx}`}
              tendencias={tendencias}
              frequencias={frequencias}
            />
          );
        }
      }

      return;
    }

    // ── Listas ─────────────────────────────────────────────────────────────────
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems = trimmed.split('\n').filter(l => l.trim());
      result.push(
        <View key={idx} style={{ marginTop: 4, marginBottom: 6, paddingLeft: 12 }}>
          {listItems.map((item, i) => {
            const liText = item.replace(/^[-*•]\s+/, '');
            return (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ ...styles.bodyText, marginRight: 6, lineHeight: 1.4 }}>•</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...styles.bodyText, lineHeight: 1.4 }}>
                    {renderMarkdownPiece(liText, styles.bodyText, {
                      fontFamily: 'Helvetica-Bold',
                    })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      );
      return;
    }

    // ── Parágrafo normal ───────────────────────────────────────────────────────
    result.push(
      <Text
        key={idx}
        style={{ ...styles.bodyText, lineHeight: 1.5, textAlign: 'justify', marginBottom: 6 }}
      >
        {renderMarkdownPiece(trimmed, styles.bodyText, { fontFamily: 'Helvetica-Bold' })}
      </Text>
    );
  });

  return <View style={{ gap: 0 }}>{result}</View>;
}
