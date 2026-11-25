import React, { useEffect, useState } from 'react';
import { readLocalStorage } from '../../../utils/browser-storage';
import { PAID_ADS_PREFERENCE } from '../../../shared/paid-attribution';
import { saveCookiePreferences } from '../../lib/paid-attribution';
import { Button } from './Button';

const CONSENT_KEY = 'nm-cookie-consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    function open() {
      setAnalytics(readLocalStorage(CONSENT_KEY) === 'all');
      setAds(readLocalStorage(PAID_ADS_PREFERENCE) === 'granted');
      setVisible(true);
    }
    if (!readLocalStorage(CONSENT_KEY)) open();
    window.addEventListener('nm-open-cookie-settings', open);
    return () => window.removeEventListener('nm-open-cookie-settings', open);
  }, []);

  async function accept(allowAnalytics: boolean, allowAds: boolean) {
    setPending(true);
    setError(false);
    try {
      await saveCookiePreferences(allowAnalytics, allowAds);
      setVisible(false);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
      role="dialog"
      aria-label="Aviso de cookies"
    >
      <div
        className="max-w-4xl mx-auto rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{
          background: 'rgba(19, 19, 19, 0.96)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[#e5e2e1] text-sm leading-relaxed">
            Cookies essenciais mantêm o site funcionando. Você pode escolher se quer permitir analytics e medição de anúncios.{' '}
            <a href="/privacidade" className="text-[#D4AF37] hover:text-[#f2ca50] underline underline-offset-2 transition-colors">
              Política de Privacidade
            </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-[#e5e2e1] text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={analytics} disabled={pending} onChange={(event) => {
                setAnalytics(event.target.checked);
                if (!event.target.checked) setAds(false);
              }} />
              Analytics
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={ads} disabled={pending} onChange={(event) => {
                setAds(event.target.checked);
                if (event.target.checked) setAnalytics(true);
              }} />
              Medição de anúncios
            </label>
          </div>
          {error && <p className="mt-2 text-sm text-red-300" role="alert">Sua preferência ainda não foi salva. Tente novamente.</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => void accept(false, false)}
          >
            Apenas essenciais
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => void accept(analytics, ads)}
          >
            Salvar preferências
          </Button>
        </div>
      </div>
    </div>
  );
}
