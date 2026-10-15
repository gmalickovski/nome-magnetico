import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EMAIL_LINK_CHECKER_ERROR, isLocalDevEvent } from './filters';
import { sentryInitOptions } from './options';
import { scrubSentryEvent } from './scrub';

const init = () =>
  sentryInitOptions({
    dsn: 'https://public@o0.ingest.sentry.io/0',
    environment: 'production',
  });

describe('isLocalDevEvent', () => {
  it('descarta hostname local do browser', () => {
    for (const hostname of ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0', 'LOCALHOST']) {
      assert.equal(isLocalDevEvent({}, hostname), true, hostname);
    }
  });

  it('descarta request.url com host local, inclusive porta e IPv6', () => {
    const urls = [
      'http://localhost:4321/api/create-checkout',
      'http://127.0.0.1/api/stripe-webhook',
      'http://[::1]:4321/app/resultado/1',
      'http://0.0.0.0:4321/',
    ];
    for (const url of urls) {
      assert.equal(isLocalDevEvent({ request: { url } }), true, url);
    }
  });

  it('mantém evento de produção e host parecido com localhost', () => {
    assert.equal(
      isLocalDevEvent({ request: { url: 'https://www.nomemagnetico.com.br/api/health' } }, 'www.nomemagnetico.com.br'),
      false,
    );
    assert.equal(isLocalDevEvent({ request: { url: 'https://notlocalhost.com/api' } }), false);
    assert.equal(isLocalDevEvent({}), false);
  });

  it('descarta se o browser é local mesmo com url de produção', () => {
    assert.equal(
      isLocalDevEvent(
        { request: { url: 'https://www.nomemagnetico.com.br/app' } },
        '127.0.0.1',
      ),
      true,
    );
  });
});

describe('ignoreErrors', () => {
  it('ignora o robô de verificação de link de e-mail', () => {
    const patterns = init().ignoreErrors ?? [];
    assert.ok(patterns.includes(EMAIL_LINK_CHECKER_ERROR));
    assert.match('Object Not Found Matching Id: 2, MethodName: update, ParamCount: 4', EMAIL_LINK_CHECKER_ERROR);
    assert.equal(EMAIL_LINK_CHECKER_ERROR.test('Erro ao criar sessão de pagamento'), false);
  });
});

describe('scrubSentryEvent', () => {
  it('preserva extras de fluxo e filtra chave com stripe no nome', () => {
    const event = scrubSentryEvent({
      extra: {
        tipo_evento: 'checkout.session.completed',
        status_http: 500,
        codigo_erro: 'card_declined',
        stripe_event: 'checkout.session.completed',
      },
    } as never);

    assert.equal(event.extra?.tipo_evento, 'checkout.session.completed');
    assert.equal(event.extra?.status_http, 500);
    assert.equal(event.extra?.codigo_erro, 'card_declined');
    assert.equal(event.extra?.stripe_event, '[Filtered]');
  });
});

describe('beforeSend', () => {
  it('devolve null no host local antes de seguir com o evento', () => {
    const send = init().beforeSend;
    assert.ok(send);
    const dropped = send({ request: { url: 'http://localhost:4321/api/health' } } as never, {} as never);
    assert.equal(dropped, null);

    const kept = send(
      { message: 'falha de teste', request: { url: 'https://www.nomemagnetico.com.br/api/health' } } as never,
      {} as never,
    );
    assert.ok(kept);
    assert.equal(kept && 'message' in kept ? kept.message : undefined, 'falha de teste');
  });
});
