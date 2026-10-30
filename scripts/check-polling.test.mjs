import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCode } from './check-polling.mjs';

test('check-polling: falha em reload dentro de setTimeout', () => {
  const snippet = `
    function loopReload() {
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  `;
  const violations = checkCode(snippet, 'test-reload-setTimeout.js');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].type, 'timer_with_reload');
});

test('check-polling: falha em reload dentro de setInterval', () => {
  const snippet = `
    setInterval(function() {
      location.reload();
    }, 3000);
  `;
  const violations = checkCode(snippet, 'test-reload-setInterval.js');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].type, 'timer_with_reload');
});

test('check-polling: falha em setInterval chamando fetch', () => {
  const snippet = `
    const timer = setInterval(async () => {
      const res = await fetch('/api/status?id=' + id);
      const data = await res.json();
    }, 2000);
  `;
  const violations = checkCode(snippet, 'test-interval-fetch.js');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].type, 'interval_with_api');
});

test('check-polling: falha em setInterval chamando supabase', () => {
  const snippet = `
    setInterval(async () => {
      const { data } = await supabase.from('analyses').select('status').eq('id', id);
    }, 4000);
  `;
  const violations = checkCode(snippet, 'test-interval-supabase.js');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].type, 'interval_with_api');
});

test('check-polling: passa com setTimeout + fetch e backoff (sem reload)', () => {
  const snippet = `
    async function checkStatus() {
      const res = await fetch('/api/analysis-status?id=' + id);
      if (!res.ok) {
        setTimeout(checkStatus, 10000);
      }
    }
  `;
  const violations = checkCode(snippet, 'test-backoff.js');
  assert.equal(violations.length, 0);
});

test('check-polling: passa com setInterval de contador de UI puro', () => {
  const snippet = `
    useEffect(() => {
      const id = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);
      return () => clearInterval(id);
    }, []);
  `;
  const violations = checkCode(snippet, 'test-ui-counter.js');
  assert.equal(violations.length, 0);
});

test('check-polling: passa quando há anotação // polling-ok: na linha ou no bloco', () => {
  const snippetWithReload = `
    setTimeout(function() {
      // polling-ok: caso excepcional documentado
      window.location.reload();
    }, 2000);
  `;
  assert.equal(checkCode(snippetWithReload).length, 0);

  const snippetWithFetch = `
    setInterval(async () => { // polling-ok: heartbeat controlado
      await fetch('/api/heartbeat');
    }, 60000);
  `;
  assert.equal(checkCode(snippetWithFetch).length, 0);

  const snippetWithSupabase = `
    setInterval(async () => {
      // polling-ok: sincronizacao legada com autorizacao
      await supabase.from('config').select('*');
    }, 30000);
  `;
  assert.equal(checkCode(snippetWithSupabase).length, 0);
});
