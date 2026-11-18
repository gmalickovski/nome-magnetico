import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OPS_DOCK_PRIMARY_HREFS,
  OPS_NAV,
  isOpsMoreActive,
  isOpsNavActive,
  splitOpsNav,
} from './nav';

test('Dashboard só fica ativo na raiz', () => {
  assert.equal(isOpsNavActive('/', '/'), true);
  assert.equal(isOpsNavActive('/users', '/'), false);
});

test('rota e subrotas ativam o item (ficha de usuário)', () => {
  assert.equal(isOpsNavActive('/users', '/users'), true);
  assert.equal(isOpsNavActive('/users/0b5d1c1e-0000-4000-8000-000000000000', '/users'), true);
  assert.equal(isOpsNavActive('/usersx', '/users'), false);
});

test('a dock tem as 5 rotas principais e "Mais" guarda o resto, sem repetir', () => {
  const { primary, more } = splitOpsNav();
  assert.deepEqual(
    primary.map((i) => i.href),
    [...OPS_DOCK_PRIMARY_HREFS],
  );
  assert.equal(primary.length + more.length, OPS_NAV.length);
  assert.equal(more.some((i) => primary.some((p) => p.href === i.href)), false);
});

test('"Mais" ativa só para rotas fora da dock', () => {
  assert.equal(isOpsMoreActive('/faq'), true);
  assert.equal(isOpsMoreActive('/settings'), true);
  assert.equal(isOpsMoreActive('/glossario'), false);
  assert.equal(isOpsMoreActive('/'), false);
});
