import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser';

type State = 'loading' | 'success' | 'error' | 'no-token';
type BrowserSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
} | null | undefined;

export function EmailConfirmation() {
  const [state, setState] = useState<State>('loading');
  const [countdown, setCountdown] = useState(3);
  const [nextUrl, setNextUrl] = useState('/app');

  useEffect(() => {
    let cancelled = false;

    function syncSessionCookies(session: BrowserSession) {
      if (!session?.access_token || !session?.refresh_token) return;
      const accessMaxAge = session.expires_in ?? 3600;
      document.cookie = `nome-magnetico-auth-access-token=${session.access_token}; path=/; max-age=${accessMaxAge}; SameSite=Lax`;
      document.cookie = `nome-magnetico-auth-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }

    async function getActiveAccessToken(session?: BrowserSession) {
      if (session?.access_token) return session.access_token;
      const { data } = await supabaseBrowser.auth.getSession();
      syncSessionCookies(data.session);
      return data.session?.access_token;
    }

    async function markVerified(accessToken?: string) {
      if (!accessToken) {
        throw new Error('Sessão de confirmação não encontrada.');
      }

      const res = await fetch('/api/auth/mark-email-verified', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Não foi possível gravar a confirmação.');
      }
    }

    async function confirmEmail() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      const code = params.get('code');
      const produto = params.get('produto');
      const redirect = params.get('redirect');

      const isRecovery = type === 'recovery';
      if (!isRecovery) {
        const loginParams = new URLSearchParams();
        loginParams.set('msg', 'email-confirmado');
        if (produto) loginParams.set('produto', produto);
        if (redirect) loginParams.set('redirect', redirect);
        setNextUrl(`/auth/login?${loginParams.toString()}`);
      } else {
        setNextUrl(redirect || (produto ? `/comprar?produto=${produto}` : '/app'));
      }

      try {
        if (tokenHash) {
          const otpType = type === 'magiclink' || type === 'email' || type === 'signup' ? type : 'magiclink';
          let verifyRes = await supabaseBrowser.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as any,
          });

          // Se falhar e o tipo tentado foi magiclink, tenta signup como fallback
          if (verifyRes.error && otpType === 'magiclink') {
            console.log('[EmailConfirmation] Falha com magiclink, tentando signup como fallback...', verifyRes.error.message);
            verifyRes = await supabaseBrowser.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'signup',
            });
          }
          // Se falhar e o tipo tentado foi signup, tenta magiclink como fallback
          else if (verifyRes.error && otpType === 'signup') {
            console.log('[EmailConfirmation] Falha com signup, tentando magiclink como fallback...', verifyRes.error.message);
            verifyRes = await supabaseBrowser.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'magiclink',
            });
          }

          if (verifyRes.error) throw verifyRes.error;

          syncSessionCookies(verifyRes.data.session);
          await markVerified(await getActiveAccessToken(verifyRes.data.session));

          if (!isRecovery) {
            await supabaseBrowser.auth.signOut();
            document.cookie = 'nome-magnetico-auth-access-token=; path=/; max-age=0; SameSite=Lax';
            document.cookie = 'nome-magnetico-auth-refresh-token=; path=/; max-age=0; SameSite=Lax';
          }

          if (!cancelled) setState('success');
          return;
        }

        if (code) {
          const { data, error } = await supabaseBrowser.auth.exchangeCodeForSession(code);
          if (error) throw error;
          syncSessionCookies(data.session);
          await markVerified(await getActiveAccessToken(data.session));

          if (!isRecovery) {
            await supabaseBrowser.auth.signOut();
            document.cookie = 'nome-magnetico-auth-access-token=; path=/; max-age=0; SameSite=Lax';
            document.cookie = 'nome-magnetico-auth-refresh-token=; path=/; max-age=0; SameSite=Lax';
          }

          if (!cancelled) setState('success');
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { data, error } = await supabaseBrowser.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          syncSessionCookies(data.session);
          await markVerified(await getActiveAccessToken(data.session));
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

          if (!isRecovery) {
            await supabaseBrowser.auth.signOut();
            document.cookie = 'nome-magnetico-auth-access-token=; path=/; max-age=0; SameSite=Lax';
            document.cookie = 'nome-magnetico-auth-refresh-token=; path=/; max-age=0; SameSite=Lax';
          }

          if (!cancelled) setState('success');
          return;
        }

        const { data } = await supabaseBrowser.auth.getSession();
        if (data.session?.access_token) {
          syncSessionCookies(data.session);
          await markVerified(data.session.access_token);
          if (!cancelled) setState('success');
          return;
        }

        if (!cancelled) setState('no-token');
      } catch (error) {
        console.error('[EmailConfirmation]', error instanceof Error ? error.message : error);
        if (!cancelled) setState('error');
      }
    }

    confirmEmail();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state !== 'success') return;
    if (countdown <= 0) {
      window.location.href = nextUrl;
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown, nextUrl]);

  if (state === 'loading') {
    return (
      <div className="text-center">
        <div className="mb-6 text-5xl">...</div>
        <h1 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-3">
          Confirmando...
        </h1>
        <p className="text-gray-400">Verificando seu e-mail, aguarde um momento.</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="text-center">
        <div className="mb-6 text-5xl">OK</div>
        <h1 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-3">
          E-mail verificado!
        </h1>
        <p className="text-gray-300 mb-2">
          Seu e-mail foi confirmado com sucesso. Seus documentos e relatórios estão protegidos.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Redirecionando para o painel em{' '}
          <span className="text-[#D4AF37] font-semibold">{countdown}s</span>...
        </p>
        <a
          href={nextUrl}
          className="inline-block bg-[#D4AF37] text-[#111111] font-bold text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-opacity duration-300 tracking-wide"
        >
          IR PARA O PAINEL
        </a>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="text-center">
        <div className="mb-6 text-5xl">!</div>
        <h1 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-3">
          Link inválido
        </h1>
        <p className="text-gray-400 mb-2">
          Este link de confirmação expirou ou já foi utilizado.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Volte ao painel e solicite um novo link pelo banner de verificação.
        </p>
        <a
          href="/app"
          className="inline-block border border-[#D4AF37] text-[#D4AF37] font-bold text-sm px-8 py-3 rounded-xl hover:bg-[#D4AF37] hover:text-[#111111] transition-all duration-300 tracking-wide"
        >
          VOLTAR AO PAINEL
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-6 text-5xl">@</div>
      <h1 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-3">
        Verifique seu e-mail
      </h1>
      <p className="text-gray-300 mb-2">
        Abra o e-mail de verificação enviado pelo Nome Magnético.
      </p>
      <p className="text-gray-400 text-sm mb-8">
        Clique no botão dentro do e-mail para confirmar sua conta. Verifique também a pasta de spam.
      </p>
      <a
        href="/app"
        className="text-[#D4AF37] hover:underline text-sm"
      >
        Voltar ao painel
      </a>
    </div>
  );
}
