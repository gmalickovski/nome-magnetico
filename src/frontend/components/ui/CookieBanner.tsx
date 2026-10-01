import React, { useEffect, useState } from 'react';
import { Button } from './Button';

const CONSENT_KEY = 'nm-cookie-consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) setVisible(true);
  }, []);

  function accept(type: 'all' | 'essential') {
    localStorage.setItem(CONSENT_KEY, type);
    setVisible(false);

    if (type === 'all') {
      window.dispatchEvent(new Event('consentGranted'));
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
            Usamos cookies essenciais para o funcionamento do site e cookies de analytics (Google Analytics e PostHog) para entender tráfego, funil e campanhas. Os scripts só rodam com sua permissão.{' '}
            <a href="/privacidade" className="text-[#D4AF37] hover:text-[#f2ca50] underline underline-offset-2 transition-colors">
              Política de Privacidade
            </a>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => accept('essential')}
          >
            Apenas essenciais
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => accept('all')}
          >
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
