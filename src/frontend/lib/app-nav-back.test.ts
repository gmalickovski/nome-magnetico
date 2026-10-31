import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAppBackDestination,
  APP_CLIENT_HOME,
} from './app-nav-back.ts';

describe('app-nav-back', () => {
  it('fallback padrão é /app', () => {
    assert.equal(APP_CLIENT_HOME, '/app');
  });

  it('entrada direta cai no dashboard', () => {
    assert.equal(
      resolveAppBackDestination(['/app/analise/nome-social'], '/app/analise/nome-social'),
      'app_home'
    );
  });

  it('navegação interna usa history.back', () => {
    assert.equal(
      resolveAppBackDestination(
        ['/app', '/app/analise/nome-social'],
        '/app/analise/nome-social'
      ),
      'history_back'
    );
  });

  it('sincroniza path atual se ainda não estiver no stack', () => {
    assert.equal(
      resolveAppBackDestination(['/app'], '/app/analises'),
      'history_back'
    );
  });
});
