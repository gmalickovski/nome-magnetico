/**
 * AIConfigEditor — island React para editar provedor e modelos de IA por tarefa.
 * Recebe configurações atuais como props e persiste via POST /api/admin/ai-config.
 */

import { useState } from 'react';

type AIProvider = 'groq' | 'openai' | 'claude';
type AITask = 'analysis' | 'suggestions' | 'guide';

interface ConfigRow {
  task: string;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

interface Props {
  currentConfigs: ConfigRow[];
}

interface ModelOption {
  id: string;
  label: string;
  tag: string;
  recommended?: boolean;
}

const PROVIDER_MODELS: Record<AIProvider, ModelOption[]> = {
  groq: [
    { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', tag: '⭐ Recomendado', recommended: true },
    { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', tag: 'Mais rápido' },
    { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B', tag: 'Alternativa' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o', tag: '⭐ Recomendado', recommended: true },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', tag: 'Econômico' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', tag: 'Análises complexas' },
  ],
  claude: [
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', tag: '⭐ Recomendado', recommended: true },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', tag: 'Rápido/econômico' },
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', tag: 'Máxima capacidade' },
  ],
};

const TASKS: Array<{ id: AITask; label: string; description: string }> = [
  { id: 'analysis', label: 'Análise Numerológica', description: 'Análise completa dos triângulos e bloqueios' },
  { id: 'suggestions', label: 'Sugestões de Nome', description: 'Geração de nomes magnéticos alternativos' },
  { id: 'guide', label: 'Guia de Implementação', description: 'Orientações para adoção do novo nome' },
];

const PROVIDER_STYLES: Record<AIProvider, { bg: string; border: string; text: string; activeBg: string }> = {
  groq: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    activeBg: 'bg-orange-500/20 border-orange-500/50',
  },
  openai: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    activeBg: 'bg-blue-500/20 border-blue-500/50',
  },
  claude: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    activeBg: 'bg-purple-500/20 border-purple-500/50',
  },
};

const PROVIDER_LABELS: Record<AIProvider, string> = {
  groq: 'Groq (Llama)',
  openai: 'OpenAI (GPT)',
  claude: 'Claude (Anthropic)',
};

function getDefaultModel(provider: AIProvider): string {
  return PROVIDER_MODELS[provider].find(m => m.recommended)?.id ?? PROVIDER_MODELS[provider][0].id;
}

function detectCurrentProvider(configs: ConfigRow[]): AIProvider {
  const firstConfig = configs[0];
  if (!firstConfig) return 'groq';
  const p = firstConfig.provider as AIProvider;
  return ['groq', 'openai', 'claude'].includes(p) ? p : 'groq';
}

function buildTaskModels(configs: ConfigRow[], provider: AIProvider): Record<AITask, string> {
  const defaultModel = getDefaultModel(provider);
  const result: Record<AITask, string> = {
    analysis: defaultModel,
    suggestions: defaultModel,
    guide: defaultModel,
  };
  for (const cfg of configs) {
    const task = cfg.task as AITask;
    if (task in result && cfg.provider === provider) {
      const models = PROVIDER_MODELS[provider];
      const modelExists = models.some(m => m.id === cfg.model);
      result[task] = modelExists ? cfg.model : defaultModel;
    }
  }
  return result;
}

export default function AIConfigEditor({ currentConfigs }: Props) {
  const initialProvider = detectCurrentProvider(currentConfigs);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(initialProvider);
  const [taskModels, setTaskModels] = useState<Record<AITask, string>>(
    buildTaskModels(currentConfigs, initialProvider)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function handleProviderChange(provider: AIProvider) {
    setSelectedProvider(provider);
    const defaultModel = getDefaultModel(provider);
    setTaskModels({ analysis: defaultModel, suggestions: defaultModel, guide: defaultModel });
    setSaved(false);
    setError('');
  }

  function handleModelChange(task: AITask, model: string) {
    setTaskModels(prev => ({ ...prev, [task]: model }));
    setSaved(false);
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');

    const configs = TASKS.map(t => ({
      task: t.id,
      provider: selectedProvider,
      model: taskModels[t.id],
    }));

    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? 'Erro ao salvar');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  }

  const styles = PROVIDER_STYLES[selectedProvider];
  const models = PROVIDER_MODELS[selectedProvider];

  return (
    <div className="space-y-6">
      {/* Seletor de provedor */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Provedor de IA</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map(provider => {
            const s = PROVIDER_STYLES[provider];
            const isActive = selectedProvider === provider;
            return (
              <button
                key={provider}
                onClick={() => handleProviderChange(provider)}
                className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                  isActive
                    ? `${s.activeBg} ${s.text} scale-[1.02] shadow-lg`
                    : `${s.bg} ${s.border} text-gray-400 hover:${s.text}`
                }`}
              >
                <div className={`text-sm font-medium ${isActive ? s.text : 'text-gray-300'}`}>
                  {PROVIDER_LABELS[provider]}
                </div>
                {isActive && (
                  <div className={`text-xs mt-1 ${s.text} opacity-80`}>Ativo</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards por tarefa */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Modelo por Tarefa</h3>
        <div className="space-y-3">
          {TASKS.map(task => (
            <div
              key={task.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-200">{task.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{task.description}</div>
              </div>
              <div className="w-full sm:w-auto flex-shrink-0">
                <select
                  value={taskModels[task.id]}
                  onChange={e => handleModelChange(task.id, e.target.value)}
                  className={`w-full sm:w-auto appearance-none bg-[#1a1a1a] border rounded-lg pl-3 pr-10 py-2.5 sm:py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 transition-colors ${styles.border} focus:ring-[#D4AF37]/50`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em',
                  }}
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label} — {m.tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão salvar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            saved
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/30 hover:scale-[1.02]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Salvando...
            </span>
          ) : saved ? (
            'Salvo ✓'
          ) : (
            'Salvar Configuração'
          )}
        </button>

        {error && (
          <span className="text-sm text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}
