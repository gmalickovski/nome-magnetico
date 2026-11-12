import assert from 'node:assert/strict';
import { after, before, it } from 'node:test';

const prevAdaptive = process.env.NM_CHAT_ADAPTIVE_JEV;

before(() => {
  delete process.env.NM_CHAT_ADAPTIVE_JEV;
});

after(() => {
  if (prevAdaptive === undefined) delete process.env.NM_CHAT_ADAPTIVE_JEV;
  else process.env.NM_CHAT_ADAPTIVE_JEV = prevAdaptive;
});

it('POST adaptive-interview retorna 404 com flag desligada', async () => {
  const { POST } = await import('./adaptive-interview.ts');
  const res = await POST({
    request: new Request('http://local/api/adaptive-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'x'.repeat(10), nomeCompleto: 'A B', dataNascimento: '01/01/2000', answers: [] }),
    }),
  } as Parameters<typeof POST>[0]);
  assert.equal(res.status, 404);
});
