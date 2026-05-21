import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface RefundableSubscription {
  id: string;
  product_type: string;
  starts_at: string;
  amount_paid: number | null;
}

interface Props {
  subscriptions: RefundableSubscription[];
}

const PRODUCT_LABELS: Record<string, string> = {
  nome_social: 'Nome Social',
  nome_bebe: 'Nome de Bebê',
  nome_empresa: 'Nome Empresarial',
};

function daysRemaining(startsAt: string): number {
  const deadline = new Date(startsAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)));
}

function formatCurrency(cents: number | null): string {
  if (!cents) return '';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function RefundRequestForm({ subscriptions }: Props) {
  const [selected, setSelected] = useState<string>(subscriptions[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white/3 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">⏰</div>
        <h2 className="font-cinzel text-xl font-bold text-white mb-3">Janela de Reembolso Encerrada</h2>
        <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
          O prazo de 7 dias para solicitação de reembolso já passou para todos os seus produtos.
          Se acredita que houve um erro, entre em contato com nosso suporte.
        </p>
        <a
          href="/app/suporte"
          className="inline-block mt-6 text-[#D4AF37] hover:text-[#f2ca50] text-sm transition-colors"
        >
          Abrir chamado de suporte
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white/3 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="font-cinzel text-xl font-bold text-white mb-3">Reembolso Solicitado</h2>
        <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
          Seu reembolso foi processado. O valor será estornado em até 10 dias úteis,
          podendo levar até 2 faturas para aparecer no cartão de crédito.
          Você receberá uma confirmação por e-mail.
        </p>
        <a
          href="/comprar"
          className="inline-block mt-6 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Voltar para produtos
        </a>
      </div>
    );
  }

  const selectedSub = subscriptions.find(s => s.id === selected);
  const days = selectedSub ? daysRemaining(selectedSub.starts_at) : 0;

  async function submitRefund() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/request-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: selected, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro inesperado. Tente novamente.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Seleção do produto */}
      {subscriptions.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
            Selecione o produto
          </label>
          <div className="space-y-2">
            {subscriptions.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelected(sub.id)}
                className={`w-full text-left rounded-xl p-4 transition-all duration-200 ${
                  selected === sub.id
                    ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40'
                    : 'bg-white/3 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {PRODUCT_LABELS[sub.product_type] ?? sub.product_type}
                  </span>
                  <div className="flex items-center gap-3">
                    {sub.amount_paid && (
                      <span className="text-[#D4AF37] text-sm font-medium">
                        {formatCurrency(sub.amount_paid)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {daysRemaining(sub.starts_at)}d restantes
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {subscriptions.length === 1 && selectedSub && (
        <div className="bg-white/3 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">
              {PRODUCT_LABELS[selectedSub.product_type] ?? selectedSub.product_type}
            </p>
            {selectedSub.amount_paid && (
              <p className="text-[#D4AF37] text-sm mt-0.5">{formatCurrency(selectedSub.amount_paid)}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 bg-[#D4AF37]/10 px-3 py-1 rounded-full">
            {days} dia{days !== 1 ? 's' : ''} restante{days !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Motivo (opcional) */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
          Motivo (opcional)
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Nos ajude a melhorar contando o que não atendeu suas expectativas..."
          className="w-full bg-[#0d0d0d] text-[#e5e2e1] rounded-xl px-4 py-3 text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-[#bea5ff]/50 transition-all"
        />
        <p className="text-xs text-gray-600 mt-1 text-right">{reason.length}/500</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
      )}

      <Button
        variant="danger"
        size="lg"
        className="w-full"
        onClick={() => setConfirmOpen(true)}
        disabled={!selected}
      >
        Solicitar reembolso
      </Button>

      <p className="text-xs text-gray-600 text-center">
        Ao confirmar, seu acesso será revogado imediatamente e o estorno iniciado no Stripe.
      </p>

      {/* Modal de confirmação */}
      <Modal
        open={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        title="Confirmar reembolso"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            Você está prestes a solicitar o reembolso de{' '}
            <span className="text-white font-medium">
              {PRODUCT_LABELS[selectedSub?.product_type ?? ''] ?? ''}
            </span>
            {selectedSub?.amount_paid ? ` (${formatCurrency(selectedSub.amount_paid)})` : ''}.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Seu acesso será revogado imediatamente. O estorno aparece em até 10 dias úteis no seu cartão.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              onClick={submitRefund}
              loading={loading}
            >
              Confirmar reembolso
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
