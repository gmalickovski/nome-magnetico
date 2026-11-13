import React, { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase-browser.js';
import { resetAnalytics } from '../../lib/analytics.js';

export function AppSidebarLogout() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      resetAnalytics();
      await supabaseBrowser.auth.signOut();
    } catch {
      /* prossegue limpando cookies locais */
    }
    document.cookie = 'nome-magnetico-auth-access-token=; path=/; max-age=0';
    document.cookie = 'nome-magnetico-auth-refresh-token=; path=/; max-age=0';
    window.location.href = '/auth/login';
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-gray-500 transition-all hover:bg-red-500/10 hover:text-red-400 focus:outline-none disabled:opacity-50 cursor-pointer"
      aria-label="Sair da conta"
      title="Sair"
    >
      <svg
        className="h-5 w-5 flex-shrink-0 text-current"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        {loading ? 'Saindo...' : 'Sair'}
      </span>
    </button>
  );
}

export default AppSidebarLogout;
