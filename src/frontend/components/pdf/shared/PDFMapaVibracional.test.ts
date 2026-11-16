import { it } from 'node:test';
import assert from 'node:assert/strict';
import { Polygon, Rect, Svg, Text } from '@react-pdf/renderer';
import { PDFDoubleStar } from './PDFDoubleStar';
import { PDFMapaVibracional } from './PDFMapaVibracional';
import { BODY_FONT_BOLD } from './PDFFonts';
import { computeContextualRadarAxes } from '../../../../shared/interactive-engine/motor-radar';

function nodes(element: any): any[] {
  if (!element || typeof element !== 'object') return [];
  const children = element.props?.children;
  return [element, ...(Array.isArray(children) ? children.flat(Infinity) : [children]).flatMap(nodes)];
}

function collectStrings(element: any): string[] {
  if (typeof element === 'string' || typeof element === 'number') return [String(element)];
  if (!element || typeof element !== 'object') return [];
  const children = element.props?.children;
  return (Array.isArray(children) ? children.flat(Infinity) : [children]).flatMap(collectStrings);
}

it('Mapa usa o RGB integral da estrela em todas as faixas, inclusive quando o manual tem nota menor', () => {
  const axes = computeContextualRadarAxes('Ana Maria Vale', '07/03/1992', null);
  const numbers = { destino: 4, expressao: 8, motivacao: 6, missao: 3, impressao: 2 };
  for (const [birthScore, selectedScore] of [[15, 95], [35, 75], [55, 85], [73, 94], [94, 42]]) {
    const star = nodes(PDFDoubleStar({ nascimento: numbers, harmonizado: numbers, scoreNascimento: birthScore, scoreHarmonizado: selectedScore })).filter(n => n.type === Polygon);
    const map = nodes(PDFMapaVibracional({ birth: axes, selected: axes, birthScore, selectedScore, hasContext: false, usos: [] }));
    const series = map.filter(n => n.type === Polygon && n.props.fill !== 'none');
    assert.equal(series[0].props.stroke, star[1].props.stroke);
    assert.equal(series[0].props.strokeOpacity, 1, 'sem alfa clareando o RGB do nascimento');
    assert.equal(series[1].props.stroke, star[0].props.stroke);
    assert.equal(series[0].props.fillOpacity, 0.04);
    assert.equal(series[1].props.fillOpacity, 0.04);
    assert.ok(map.indexOf(series[1]) > map.findLastIndex(n => n.type === Rect), 'assinatura por cima de toda a série de nascimento');
  }
});

it('Mapa renderiza pontas da teia em negrito, cards de significado e nota metodológica em itálico', () => {
  const axes = computeContextualRadarAxes('Ana Maria Vale', '07/03/1992', {
    areaFoco: 'carreira_negocios',
    ondeAssinaRaw: ['identidade_registro', 'presenca_digital'],
  });
  const map = nodes(
    PDFMapaVibracional({
      birth: axes,
      selected: axes,
      birthScore: 64,
      selectedScore: 93,
      hasContext: true,
      areaFoco: 'carreira_negocios',
      usos: ['identidade_registro', 'presenca_digital'],
    }),
  );

  const svgNode = map.find(n => n.type === Svg);
  assert.ok(svgNode);
  const svgTexts = nodes(svgNode).filter(n => n.type === Text);
  assert.equal(svgTexts.length, 5);
  for (const t of svgTexts) {
    assert.equal(t.props?.style?.fontFamily, BODY_FONT_BOLD);
  }

  const selected = axes.map((a, idx) =>
    idx === 0
      ? { ...a, valuePercent: a.valuePercent + 10 }
      : idx === 1
        ? { ...a, valuePercent: Math.max(0, a.valuePercent - 8) }
        : a,
  );
  const variedEl = PDFMapaVibracional({
    birth: axes,
    selected,
    birthScore: 64,
    selectedScore: 93,
    hasContext: true,
    areaFoco: 'carreira_negocios',
    usos: ['identidade_registro', 'presenca_digital'],
  });
  const variedNodes = nodes(variedEl);
  const allText = collectStrings(variedEl).join(' ');
  assert.match(allText, /O Significado das 5 Pontas do Mapa/);
  assert.match(allText, /documentos e registros oficiais/);
  assert.doesNotMatch(allText, /identidade_registro/);
  assert.doesNotMatch(allText, /Leitura no Seu Mapa/);

  const greenCard = variedNodes.find(n => n.props?.style?.backgroundColor === '#F0FDF4');
  const redCard = variedNodes.find(n => n.props?.style?.backgroundColor === '#FEF2F2');
  const goldCard = variedNodes.find(n => n.props?.style?.backgroundColor === '#FFFBF0');
  assert.ok(greenCard, 'melhoria usa card verde');
  assert.ok(redCard, 'queda usa card vermelho');
  assert.ok(goldCard, 'estabilidade usa card dourado');

  const birthCell = variedNodes.find(
    n => n.type === Text && n.props?.style?.width === 72 && n.props?.style?.color === '#9A6B00',
  );
  assert.ok(birthCell, 'coluna Nascimento da tabela usa dourado padrão');

  const hasItalicStyle = (s: any): boolean =>
    Array.isArray(s) ? s.some(hasItalicStyle) : s?.fontStyle === 'italic';

  const italicTexts = map.filter(
    n => n.type === Text && hasItalicStyle(n.props?.style),
  );
  assert.ok(italicTexts.length >= 3);
});
