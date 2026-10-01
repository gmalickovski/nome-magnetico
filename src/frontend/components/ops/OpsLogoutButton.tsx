import { supabaseBrowser } from '../../lib/supabase-browser';
import { clearAuthCookies } from '../../lib/auth-cookies';

export function OpsLogoutButton({ className = '' }: { className?: string }) {
  async function logout() {
    try {
      await supabaseBrowser.auth.signOut();
    } catch {
      /* o cookie local ainda precisa sair */
    }
    clearAuthCookies();
    window.location.href = '/login';
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={`rounded-full px-4 py-2 text-sm text-[#e5e2e1] transition-colors duration-700 hover:bg-white/5 hover:text-[#f2ca50] ${className}`}
    >
      Sair
    </button>
  );
}
