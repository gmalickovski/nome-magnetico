import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emailCampaignName, withEmailUtm } from './utm';

describe('emailCampaignName', () => {
  it('prefixa nm sem underline', () => {
    assert.equal(emailCampaignName(12), 'nm12');
    assert.equal(emailCampaignName('12'), 'nm12');
    assert.equal(emailCampaignName('nm12'), 'nm12');
    assert.equal(emailCampaignName('nm_12'), 'nm12');
    assert.equal(emailCampaignName('NM_12'), 'nm12');
  });

  it('rejeita id vazio', () => {
    assert.throws(() => emailCampaignName(''), /campaignId vazio/);
    assert.throws(() => emailCampaignName('nm_'), /campaignId vazio/);
  });
});

describe('withEmailUtm', () => {
  it('preserva a query e adiciona os parâmetros Brevo', () => {
    const url = withEmailUtm(
      'https://nomemagnetico.com.br/auth/cadastro?produto=nome_social',
      12,
    );
    const parsed = new URL(url);
    assert.equal(parsed.origin + parsed.pathname, 'https://nomemagnetico.com.br/auth/cadastro');
    assert.equal(parsed.searchParams.get('produto'), 'nome_social');
    assert.equal(parsed.searchParams.get('utm_source'), 'brevo');
    assert.equal(parsed.searchParams.get('utm_medium'), 'email');
    assert.equal(parsed.searchParams.get('utm_campaign'), 'nm12');
  });

  it('mantém o hash e substitui UTM antigo', () => {
    const url = withEmailUtm(
      'https://nomemagnetico.com.br/app/resultado/abc?utm_source=outro#topo',
      'nm_12',
    );
    const parsed = new URL(url);
    assert.equal(parsed.hash, '#topo');
    assert.equal(parsed.searchParams.get('utm_source'), 'brevo');
    assert.equal(parsed.searchParams.get('utm_medium'), 'email');
    assert.equal(parsed.searchParams.get('utm_campaign'), 'nm12');
  });

  it('devolve a URL original quando ela é inválida', () => {
    assert.equal(withEmailUtm('nao-e-uma-url', 12), 'nao-e-uma-url');
  });
});
