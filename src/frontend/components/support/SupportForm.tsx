import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { ToastContainer, useToast } from '../ui/Toast';

const SUBJECT_OPTIONS = [
  'Bug',
  'Sugestão',
  'Primeiros Passos',
  'Assinatura e Planos',
  'Conta e Segurança',
  'Privacidade e Exclusão de Conta',
  'Solução de Problemas',
];

export function SupportForm() {
  const [form, setForm] = useState({ assunto: '', mensagem: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const isValid = form.assunto.trim() !== '' && form.mensagem.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assunto: form.assunto.trim(),
          mensagem: form.mensagem.trim(),
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error ?? 'Erro ao enviar mensagem. Tente novamente.', 'error');
      }
    } catch {
      addToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-white/5 border border-emerald-500/30 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="font-cinzel text-xl font-bold text-white mb-2">Mensagem enviada!</h3>
        <p className="text-gray-400 text-sm">
          Nossa equipe responderá em breve. Acompanhe pelo seu chamado e pelo seu e-mail.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setForm({ assunto: '', mensagem: '' });
          }}
          className="mt-6 text-sm text-[#D4AF37] hover:underline"
        >
          Enviar Nova Mensagem
        </button>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl p-6 md:p-8 space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">📋</div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-white">Enviar Mensagem</h3>
            <p className="text-gray-500 text-sm">Resposta em até 24h</p>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-yellow-400 mb-2">
            Assunto <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <select
              title="Selecione um assunto"
              value={form.assunto}
              onChange={e => setForm(prev => ({ ...prev, assunto: e.target.value }))}
              className={`w-full appearance-none bg-[#1a1a1a] border rounded-xl pl-4 pr-10 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                !form.assunto ? 'border-gray-700' : 'border-[#D4AF37]/50'
              } focus:ring-[#D4AF37]/50`}
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1em',
              }}
            >
              <option value="" disabled>Selecione uma opção</option>
              {SUBJECT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-yellow-400 mb-2">
            Mensagem <span className="text-red-400 ml-1">*</span>
          </label>
          <textarea
            value={form.mensagem}
            onChange={e => setForm(prev => ({ ...prev, mensagem: e.target.value }))}
            placeholder="Descreva seu problema com detalhes..."
            rows={5}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-3 text-white resize-none
              focus:outline-none focus:ring-2 focus:border-transparent focus:ring-[#D4AF37]/50
              transition duration-300 placeholder-gray-500 hover:border-gray-600"
          />
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={!isValid || loading}
          className={`w-full py-3 ${!isValid ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        >
          {loading ? 'Enviando...' : 'Enviar Mensagem'}
        </Button>
      </form>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
