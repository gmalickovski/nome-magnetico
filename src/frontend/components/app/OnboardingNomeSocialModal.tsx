import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { DateInput } from '../ui/DateInput';

interface Props {
  nomeSalvo?: string;
  dataSalva?: string;
}

export function OnboardingNomeSocialModal({ nomeSalvo, dataSalva }: Props) {
  const needsOnboarding = !nomeSalvo || !dataSalva;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<string>('');

  useEffect(() => {
    const handler = () => {
      // Previne reabrir o modal se a sessão atual avisou que já completamos
      if (sessionStorage.getItem('onboarding_completed') === 'true') {
        window.location.href = '/app/analise/nome-social';
        return;
      }
      setOpen(true);
    };
    document.addEventListener('openNomeSocialModal', handler);
    return () => document.removeEventListener('openNomeSocialModal', handler);
  }, []);

  const [nome, setNome] = useState(nomeSalvo || '');
  const [dataNascimento, setDataNascimento] = useState(dataSalva ? converterDataDBParaInput(dataSalva) : '');

  // Helpers
  function converterDataDBParaInput(dbDate: string) {
    if (!dbDate) return '';
    const partes = dbDate.split('-');
    if (partes.length !== 3) return dbDate;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // A máscara agora é delegada para o DateInput
  // O onChange envia diretamente a string formatada
  const handleSaveAndRedirect = async () => {
    setError(null);
    setLoading(true);

    if (nome.length < 2) {
      setError('Informe seu nome completo.');
      setLoading(false);
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) {
      setError('Data no formato DD/MM/AAAA.');
      setLoading(false);
      return;
    }

    if (!gender) {
      setError('Por favor, informe seu sexo / gênero.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/save-base-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth_name: nome, birth_date: dataNascimento, gender }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao salvar perfil');
      }

      // Marcar na sessão local para evitar repetição ao testar o botão voltar do navegador
      sessionStorage.setItem('onboarding_completed', 'true');
      
      // Destruir o modal via prop "open" enquanto recarrega a página
      setOpen(false);
      
      // Substituir histórico local e direcionar (Bypass Back button stack)
      window.location.replace('/app/analise/nome-social');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setLoading(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} title="Configuração Inicial">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Para testar e analisar o seu Nome Social precisamos das suas informações originais de nascença como ponto de partida. Guardaremos esses dados para seus próximos testes.
          </p>

          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-1">
              Nome de Registro <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: João Silva Souza"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-1">
              Data de Nascimento <span className="text-red-400">*</span>
            </label>
            <DateInput
              value={dataNascimento}
              onChangeValue={setDataNascimento}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-1">
              Sexo <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23D4AF37%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-no-repeat bg-[position:right_1rem_center]"
            >
              <option value="" disabled className="bg-neutral-900 border-none text-gray-500">Selecione...</option>
              <option value="Feminino" className="bg-neutral-900 border-none">Feminino</option>
              <option value="Masculino" className="bg-neutral-900 border-none">Masculino</option>
              <option value="Neutro" className="bg-neutral-900 border-none">Prefiro não informar / Outro</option>
            </select>
          </div>

          {error && (
            <div className="text-red-400 text-sm mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
              {error}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAndRedirect}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-yellow-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar e Iniciar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
