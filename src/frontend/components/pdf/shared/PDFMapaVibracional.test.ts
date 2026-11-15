import { it } from 'node:test';
import assert from 'node:assert/strict';
import { Polygon, Rect } from '@react-pdf/renderer';
import { PDFDoubleStar } from './PDFDoubleStar';
import { PDFMapaVibracional } from './PDFMapaVibracional';
import { computeContextualRadarAxes } from '../../../../shared/interactive-engine/motor-radar';

function nodes(element: any): any[] {
  if (!element || typeof element !== 'object') return [];
  const children = element.props?.children;
  return [element, ...(Array.isArray(children) ? children.flat(Infinity) : [children]).flatMap(nodes)];
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
