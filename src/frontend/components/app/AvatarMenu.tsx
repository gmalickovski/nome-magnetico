import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabaseBrowser } from '../../lib/supabase-browser';
import { SettingsModal, type ProfileForm } from './SettingsModal';

interface AvatarMenuProps {
  nome: string;
  isAdmin?: boolean;
}

const EMPTY_PROFILE: ProfileForm = {
  nome: '',
  email: '',
  phone: '',
  birth_name: '',
  birth_date: '',
  gender: '',
  email_verified_at: null,
};

export default function AvatarMenu({ nome, isAdmin }: AvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const displayName = profile.nome || nome || 'Usuario';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadUnreadNotifications() {
      try {
        const res = await fetch('/api/client-messages/unread-count', { credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json();
        setNotificationUnreadCount(Number(data.count ?? 0));
      } catch {
        setNotificationUnreadCount(0);
      }
    }

    void loadUnreadNotifications();
    window.addEventListener('focus', loadUnreadNotifications);
    return () => window.removeEventListener('focus', loadUnreadNotifications);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [settingsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedAvatar = menuRef.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);
      if (!clickedAvatar && !clickedPopover) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadProfile() {
    setError('');
    try {
      const [profileRes, authRes] = await Promise.all([
        fetch('/api/user/save-base-profile'),
        supabaseBrowser.auth.getUser(),
      ]);
      const data = await profileRes.json();
      if (!profileRes.ok) throw new Error(data.error ?? 'Erro ao carregar cadastro.');
      setProfile({ ...EMPTY_PROFILE, ...data.profile });
      setEmailConfirmed(Boolean(data.profile?.email_verified_at));
      if (authRes.error) {
        console.warn('[AvatarMenu] falha ao carregar status de e-mail:', authRes.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cadastro.');
    }
  }

  async function openSettings() {
    setIsOpen(false);
    setSettingsOpen(true);
    setMessage('');
    setError('');
    await loadProfile();
  }

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    document.cookie = 'nome-magnetico-auth-access-token=; path=/; max-age=0';
    document.cookie = 'nome-magnetico-auth-refresh-token=; path=/; max-age=0';
    window.location.href = '/auth/login';
  };

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/user/save-base-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: profile.nome, phone: profile.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar cadastro.');
      setMessage('Cadastro atualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cadastro.');
    } finally {
      setLoading(false);
    }
  }

  async function saveBirthData(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/user/save-base-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_name: profile.birth_name,
          birth_date: profile.birth_date,
          gender: profile.gender || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar dados de analise.');
      setMessage('Dados de analise atualizados.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados de analise.');
    } finally {
      setLoading(false);
    }
  }

  const clearNotificationBadge = React.useCallback(() => {
    setNotificationUnreadCount(0);
  }, []);

  function toggleMenu() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 240;
      const padding = 12;
      const left = Math.min(
        Math.max(padding, rect.right - width),
        window.innerWidth - width - padding
      );
      setMenuPosition({
        top: Math.min(rect.bottom + 10, window.innerHeight - 220),
        left,
      });
    }
    setIsOpen(true);
    if (!profile.email) {
      void loadProfile();
    }
  }

  const settingsModal = mounted && settingsOpen ? (
    <SettingsModal
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      profile={profile}
      setProfile={setProfile}
      emailConfirmed={emailConfirmed}
      message={message}
      error={error}
      setMessage={setMessage}
      setError={setError}
      loading={loading}
      setLoading={setLoading}
      saveAccount={saveAccount}
      saveBirthData={saveBirthData}
      isAdmin={isAdmin}
      notificationUnreadCount={notificationUnreadCount}
      onNotificationsSeen={clearNotificationBadge}
    />
  ) : null;

  const accountMenu = mounted && isOpen ? createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[100001] w-60 rounded-2xl border border-[#D4AF37]/20 bg-[#1a1a1a]/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
      style={{
        top: `${menuPosition?.top ?? 72}px`,
        left: `${menuPosition?.left ?? 16}px`,
      }}
    >
      <div className="p-2">
        <div className="mb-1 border-b border-[#D4AF37]/10 px-3 py-3">
          <p className="truncate text-sm text-gray-400">Ola, {displayName}</p>
          {profile.email && <p className="mt-1 truncate text-xs text-gray-600">{profile.email}</p>}
        </div>

        <button
          type="button"
          onClick={openSettings}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-300 transition hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
        >
          <svg className="h-4 w-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuracoes
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#111111] font-cinzel text-lg font-bold text-[#D4AF37] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] focus:outline-none"
        aria-label="Abrir menu da conta"
      >
        {notificationUnreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-[#111111]" />
        )}
        {initial}
      </button>
      {accountMenu}
      {settingsModal}
    </div>
  );
}
