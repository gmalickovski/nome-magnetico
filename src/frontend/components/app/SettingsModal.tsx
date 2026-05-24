import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DateInput } from '../ui/DateInput';
import { Select } from '../ui/Select';
import { supabaseBrowser } from '../../lib/supabase-browser';

export type ProfileForm = {
  nome: string;
  email: string;
  phone: string;
  birth_name: string;
  birth_date: string;
  gender: string;
  email_verified_at: string | null;
};

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  profile: ProfileForm;
  setProfile: React.Dispatch<React.SetStateAction<ProfileForm>>;
  emailConfirmed: boolean;
  message: string;
  error: string;
  setMessage: (msg: string) => void;
  setError: (err: string) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  saveAccount: (e: React.FormEvent) => Promise<void>;
  saveBirthData: (e: React.FormEvent) => Promise<void>;
  isAdmin?: boolean;
  notificationUnreadCount?: number;
  onNotificationsSeen?: () => void;
}

type TabType = 'perfil' | 'assinatura' | 'notificacoes' | 'analise' | 'seguranca' | 'privacidade';

type SubscriptionItem = {
  id: string;
  product_label: string;
  access_label: string;
  is_active: boolean;
  is_trial: boolean;
  ends_at: string;
  days_left: number;
};

type InternalMessage = {
  id: string;
  title: string;
  bodyMarkdown: string;
  createdAt: string;
  dismissedAt: string | null;
};

export function SettingsModal({
  open,
  onClose,
  profile,
  setProfile,
  emailConfirmed,
  message,
  error,
  setMessage,
  setError,
  loading,
  setLoading,
  saveAccount,
  saveBirthData,
  isAdmin,
  notificationUnreadCount = 0,
  onNotificationsSeen,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notificacoes');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  // Confirmação de deleção
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  useEffect(() => {
    if (open) setActiveTab('notificacoes');
  }, [open]);

  useEffect(() => {
    if (!open || activeTab !== 'assinatura') return;
    setSubscriptionLoading(true);
    fetch('/api/user/subscriptions')
      .then(res => res.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => setError('Erro ao carregar seus acessos.'))
      .finally(() => setSubscriptionLoading(false));
  }, [open, activeTab, setError]);

  useEffect(() => {
    if (!open || activeTab !== 'notificacoes') return;
    setNotificationLoading(true);
    fetch('/api/client-messages/history?markSeen=1')
      .then(res => res.json())
      .then(data => {
        setInternalMessages(data.messages ?? []);
        onNotificationsSeen?.();
      })
      .catch(() => setError('Erro ao carregar notificacoes.'))
      .finally(() => setNotificationLoading(false));
  }, [open, activeTab, setError, onNotificationsSeen]);

  async function resendConfirmation() {
    setEmailSendStatus('sending');
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect: '/app' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao reenviar confirmacao.');
      setEmailSendStatus('sent');
      setMessage('E-mail de confirmacao enviado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar confirmacao.');
      setEmailSendStatus('idle');
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      if (!emailConfirmed) {
        throw new Error('Confirme seu e-mail antes de alterar a senha.');
      }
      if (password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
      if (password !== passwordConfirm) throw new Error('As senhas nao coincidem.');

      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password });
      if (updateError) throw updateError;

      setPassword('');
      setPasswordConfirm('');
      setMessage('Senha atualizada com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportData() {
    try {
      window.location.href = '/api/user/export-data';
    } catch (err) {
      setError('Falha ao exportar dados.');
    }
  }

  async function handleDeleteAccount() {
    if (deleteText !== 'EXCLUIR') {
      setError('Por favor, digite EXCLUIR em maiúsculo para confirmar.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir conta.');
      
      // Se deu certo, desloga e redireciona
      await supabaseBrowser.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro crítico ao excluir conta.');
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  if (!open) return null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'notificacoes',
      label: 'Notificacoes',
      icon: (
        <span className="relative">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0" />
          </svg>
          {notificationUnreadCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#111]" />}
        </span>
      )
    },
    {
      id: 'perfil',
      label: 'Meu Perfil',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'analise',
      label: 'Dados de Análise',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'seguranca',
      label: 'Segurança',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      id: 'assinatura',
      label: 'Assinatura',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14h6m-7 4h8M7 4h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 012-2z" />
        </svg>
      )
    },
    {
      id: 'privacidade',
      label: 'Privacidade e Dados',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm">
      {/* Container principal (full no mobile, max-w no desktop) */}
      <div className="flex flex-col md:flex-row w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-4xl bg-[#151515] sm:rounded-2xl sm:border sm:border-[#D4AF37]/20 shadow-2xl shadow-black/80 overflow-hidden">
        
        {/* Header Mobile - Visível apenas em telas menores */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-white/5 bg-[#111]">
          <h2 className="font-cinzel text-lg font-bold text-[#e5e2e1]">Configurações</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar / Top Nav Mobile */}
        <div className="flex-shrink-0 md:w-64 bg-[#111] md:border-r border-white/5 flex flex-col">
          {/* Título Desktop */}
          <div className="hidden md:flex items-center justify-between p-6 pb-2">
            <div>
              <p className="font-inter text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Conta</p>
              <h2 className="mt-1 font-cinzel text-xl font-bold text-[#e5e2e1]">Configurações</h2>
            </div>
          </div>

          {/* Abas */}
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-4 gap-1 md:gap-2 border-b md:border-b-0 border-white/5 custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMessage(''); setError(''); }}
                className={`flex flex-shrink-0 items-center gap-3 px-4 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37]' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar relative bg-[#151515]">
          {/* Botão fechar desktop */}
          <button
            onClick={onClose}
            className="hidden md:block absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/5 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Mensagens de Erro/Sucesso globais */}
          {(message || error) && (
            <div className={`mb-6 rounded-xl p-4 text-sm ring-1 ${error ? 'bg-red-500/10 text-red-300 ring-red-500/25' : 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25'}`}>
              {error || message}
            </div>
          )}

          {/* ABA: PERFIL */}
          {activeTab === 'perfil' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-lg">
              <h3 className="mb-6 font-cinzel text-2xl font-bold text-[#D4AF37]">Meu Perfil</h3>
              <form onSubmit={saveAccount} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Nome</label>
                  <input
                    value={profile.nome}
                    onChange={e => setProfile(prev => ({ ...prev, nome: e.target.value }))}
                    className="input-dark w-full"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Telefone</label>
                  <input
                    value={profile.phone}
                    onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-dark w-full"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-500">E-mail</label>
                  <input value={profile.email} className="input-dark w-full opacity-60" disabled />
                  <p className="mt-1 text-xs text-gray-500">O e-mail não pode ser alterado no momento.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-60">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>
          )}

          {/* ABA: ANÁLISE */}
          {activeTab === 'assinatura' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
              <h3 className="mb-2 font-cinzel text-2xl font-bold text-[#D4AF37]">Assinatura e Acessos</h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">Veja quais produtos estao ativos, quando vencem e quanto tempo ainda resta.</p>
              {subscriptionLoading ? (
                <p className="text-sm text-gray-400">Carregando acessos...</p>
              ) : subscriptions.length === 0 ? (
                <div className="rounded-2xl bg-white/5 p-5 text-sm text-gray-400 ring-1 ring-white/10">Nenhum produto ativo ou historico de acesso encontrado.</div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map(item => (
                    <div key={item.id} className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-cinzel text-lg font-bold text-[#e5e2e1]">{item.product_label}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{item.access_label}</p>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${item.is_active ? 'bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/25' : 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20'}`}>
                          {item.is_active ? `${item.days_left} dia${item.days_left === 1 ? '' : 's'} restantes` : 'Expirado'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-400">Vencimento: {new Date(item.ends_at).toLocaleDateString('pt-BR')}</p>
                      {!emailConfirmed && (
                        <button
                          type="button"
                          onClick={resendConfirmation}
                          disabled={emailSendStatus === 'sending'}
                          className="mt-4 inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#131313] transition hover:bg-[#f2ca50] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {emailSendStatus === 'sending' ? 'Enviando...' : emailSendStatus === 'sent' ? 'E-mail enviado' : 'Verificar e-mail'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
              <h3 className="mb-2 font-cinzel text-2xl font-bold text-[#D4AF37]">Notificacoes Internas</h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">Comunicados importantes enviados pelo Nome Magnetico ficam salvos aqui.</p>
              {notificationLoading ? (
                <p className="text-sm text-gray-400">Carregando notificacoes...</p>
              ) : internalMessages.length === 0 ? (
                <div className="rounded-2xl bg-white/5 p-5 text-sm text-gray-400 ring-1 ring-white/10">Nenhuma notificacao interna por enquanto.</div>
              ) : (
                <div className="space-y-3">
                  {internalMessages.map(item => (
                    <article key={item.id} className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <h4 className="font-cinzel text-lg font-bold text-[#e5e2e1]">{item.title}</h4>
                        <span className="text-xs text-gray-600">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-400">{item.bodyMarkdown.replace(/[#*_`>-]/g, '').trim()}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analise' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-lg">
              <h3 className="mb-2 font-cinzel text-2xl font-bold text-[#D4AF37]">Dados de Análise</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Estes dados são usados como padrão ao gerar novas análises de numerologia.
              </p>
              <form onSubmit={saveBirthData} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Nome completo de nascimento</label>
                  <input
                    value={profile.birth_name}
                    onChange={e => setProfile(prev => ({ ...prev, birth_name: e.target.value }))}
                    className="input-dark w-full"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Data de nascimento</label>
                  <DateInput
                    value={profile.birth_date}
                    onChangeValue={value => setProfile(prev => ({ ...prev, birth_date: value }))}
                    className="input-dark w-full"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Gênero</label>
                  <Select
                    value={profile.gender}
                    onChange={value => setProfile(prev => ({ ...prev, gender: value }))}
                    options={[
                      { value: '', label: 'Não informar' },
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Feminino', label: 'Feminino' },
                      { value: 'Neutro', label: 'Neutro' },
                    ]}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-60">
                  {loading ? 'Salvando...' : 'Salvar Dados de Análise'}
                </button>
              </form>
            </div>
          )}

          {/* ABA: SEGURANÇA */}
          {activeTab === 'seguranca' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-lg">
              <h3 className="mb-6 font-cinzel text-2xl font-bold text-[#D4AF37]">Segurança</h3>
              <form onSubmit={savePassword} className="space-y-5">
                {!emailConfirmed && (
                  <div className="rounded-xl bg-[#D4AF37]/10 p-4 text-sm leading-relaxed text-[#D4AF37] ring-1 ring-[#D4AF37]/25">
                    Confirme seu e-mail (clicando no link enviado no cadastro) para liberar a alteração de senha.
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Nova senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-dark w-full"
                    placeholder="Mínimo de 8 caracteres"
                    autoComplete="new-password"
                    disabled={!emailConfirmed}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    className="input-dark w-full"
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    disabled={!emailConfirmed}
                  />
                </div>
                <button type="submit" disabled={loading || !emailConfirmed} className="w-full mt-2 rounded-full border border-[#D4AF37]/50 px-5 py-3 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/10 disabled:opacity-60">
                  {loading ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </form>
            </div>
          )}

          {/* ABA: PRIVACIDADE (LGPD) */}
          {activeTab === 'privacidade' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-xl">
              <h3 className="mb-2 font-cinzel text-2xl font-bold text-[#D4AF37]">Privacidade e Dados</h3>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                Nós levamos a sua privacidade a sério. Abaixo você tem controle total sobre as informações que armazenamos, conforme a Lei Geral de Proteção de Dados (LGPD).
              </p>

              {/* Seção de Exportação */}
              <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37] shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-200 mb-1">Exportar meus dados</h4>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                      Faça o download de uma cópia (formato JSON) de todos os seus dados pessoais, análises geradas e histórico.
                    </p>
                    <button 
                      onClick={handleExportData}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-[#2a2a2a] hover:bg-[#333] text-gray-200 transition-colors border border-white/10"
                    >
                      Baixar Arquivo JSON
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção de Deleção (Danger Zone) */}
              <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-400 shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-red-400 mb-1">Excluir Conta Permanentemente</h4>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                      Ao excluir sua conta, todas as suas análises, dados de pagamento e informações pessoais serão apagados definitivamente dos nossos servidores. <strong>Esta ação é irreversível.</strong>
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20"
                      >
                        Excluir Minha Conta
                      </button>
                    ) : (
                      <div className="mt-4 p-4 rounded-xl bg-[#111] border border-red-500/30">
                        <p className="text-sm text-gray-300 mb-3">
                          Para confirmar, digite a palavra <strong>EXCLUIR</strong> abaixo:
                        </p>
                        <input
                          type="text"
                          value={deleteText}
                          onChange={e => setDeleteText(e.target.value)}
                          placeholder="EXCLUIR"
                          className="w-full bg-[#1a1a1a] border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm focus:outline-none focus:border-red-500/60 mb-3"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={handleDeleteAccount}
                            disabled={deleteText !== 'EXCLUIR' || loading}
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
                          >
                            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
                          </button>
                          <button 
                            onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); setError(''); }}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2a2a2a] hover:bg-[#333] text-gray-300 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
