import { it } from 'node:test';
import assert from 'node:assert/strict';
import { preparePdfDownload, waitForPdfPageVisible, markPendingPdf, clearPendingPdf, hasPendingPdf } from './pdf-download-lifecycle';

it('dispara um link conectado ao DOM e mantém o Blob para o link de recuperação até dispose', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
  const events: string[] = [];
  let connected = false;
  const anchor = { href: '', download: '', click() { assert.ok(connected); events.push('click'); }, remove() { connected = false; events.push('remove'); } };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => anchor, body: { appendChild() { connected = true; events.push('append'); } } } });
  URL.createObjectURL = () => 'blob:fixture';
  URL.revokeObjectURL = href => { assert.equal(href, 'blob:fixture'); events.push('revoke'); };
  try {
    const download = preparePdfDownload(new Blob(['%PDF-fixture']), 'fixture.pdf');
    download.start();
    assert.equal(anchor.href, download.href);
    assert.equal(anchor.download, 'fixture.pdf');
    assert.deepEqual(events, ['append', 'click', 'remove']);
    download.start();
    assert.equal(events.filter(e => e === 'click').length, 2);
    download.dispose(); download.dispose(); download.start();
    assert.equal(events.filter(e => e === 'revoke').length, 1);
    assert.equal(events.filter(e => e === 'click').length, 2);
  } finally {
    URL.createObjectURL = create; URL.revokeObjectURL = revoke;
    if (original) Object.defineProperty(globalThis, 'document', original); else Reflect.deleteProperty(globalThis, 'document');
  }
});

it('espera a volta da tela antes da entrega e cancela a espera ao desmontar', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const doc = new EventTarget() as EventTarget & { visibilityState: string };
  doc.visibilityState = 'hidden';
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc });
  try {
    let resolved = false;
    const waiting = waitForPdfPageVisible(new AbortController().signal).then(value => { resolved = true; return value; });
    await Promise.resolve(); assert.equal(resolved, false);
    doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(await waiting, true);
    doc.visibilityState = 'hidden';
    const controller = new AbortController();
    const cancelled = waitForPdfPageVisible(controller.signal);
    controller.abort(); assert.equal(await cancelled, false);
    doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(await waitForPdfPageVisible(controller.signal), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'document', original); else Reflect.deleteProperty(globalThis, 'document');
  }
});

it('recupera intenção por análise na mesma sessão e expira dados antigos sem guardar nomes', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) } });
  try {
    markPendingPdf('analysis-a');
    assert.equal(hasPendingPdf('analysis-a'), true);
    assert.equal(hasPendingPdf('analysis-b'), false);
    assert.ok([...values.values()].every(v => /^\d+$/.test(v)));
    values.set('nm:pending-pdf:analysis-old', String(Date.now() - 25 * 60 * 60_000));
    assert.equal(hasPendingPdf('analysis-old'), false);
    clearPendingPdf('analysis-a'); assert.equal(hasPendingPdf('analysis-a'), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original); else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
