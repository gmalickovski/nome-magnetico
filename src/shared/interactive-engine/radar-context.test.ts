import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRadarContext, readContextualRadarSnapshot, CONTEXTUAL_RADAR_VERSION } from './radar-context';
import { computeContextualRadarAxes } from './motor-radar';

it('DEV-299 chat e persistência resolvem o mesmo contexto e cinco índices', () => {
  const chat = resolveRadarContext({ areaFoco: 'carreira_negocios', ondeAssina: ['contratos', 'redes sociais'] });
  const saved = resolveRadarContext({ ranking: { areaFoco: 'carreira_negocios' }, ondeVaiUsar: ['contratos', 'redes sociais'] });
  assert.deepEqual(chat, saved);
  const axes = computeContextualRadarAxes('Ana Maria Vale', '07/03/1992', chat);
  assert.deepEqual(axes, computeContextualRadarAxes('Ana Maria Vale', '07/03/1992', saved));
  assert.equal(axes.length, 5);
  assert.ok(axes.every(a => a.valuePercent >= 0 && a.valuePercent <= 100));
});
it('DEV-299 legado sem contexto é geral e nunca alega personalização', () => {
  assert.equal(resolveRadarContext(null).hasContext, false);
  assert.equal(resolveRadarContext({ areaFoco: 'desconhecido' }).areaFoco, null);
  assert.deepEqual(computeContextualRadarAxes('Ana Vale', '07/03/1992', resolveRadarContext({})), computeContextualRadarAxes('Ana Vale', '07/03/1992', null));
});

it('DEV-299 reutiliza snapshot só para os mesmos nomes e versão, rejeitando valores inválidos', () => {
  const birth = computeContextualRadarAxes('Ana Vale', '07/03/1992', null);
  const selected = computeContextualRadarAxes('Aná Vale', '07/03/1992', null);
  const data = { radarVersion: CONTEXTUAL_RADAR_VERSION, radarSnapshot: { birthName: 'Ana Vale', selectedName: 'Aná Vale', context: { areaFoco: null, ondeAssinaRaw: [] }, birth, selected } };
  assert.deepEqual(readContextualRadarSnapshot(data, 'Ana Vale', 'Aná Vale'), { birth, selected });
  assert.equal(readContextualRadarSnapshot(data, 'Ana Vale', 'Outro Nome'), null);
  assert.equal(readContextualRadarSnapshot({ ...data, areaFoco: 'carreira_negocios' }, 'Ana Vale', 'Aná Vale'), null);
  assert.equal(readContextualRadarSnapshot({ ...data, radarVersion: 'futura' }, 'Ana Vale', 'Aná Vale'), null);
  const corrupted = { ...data, radarSnapshot: { ...data.radarSnapshot, birth: birth.map(a => ({ ...a, valuePercent: NaN })) } };
  assert.equal(readContextualRadarSnapshot(corrupted, 'Ana Vale', 'Aná Vale'), null);
});
