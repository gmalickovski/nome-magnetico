/**
 * HiddenTendencies — exibe as tendências ocultas do nome.
 * Tendência oculta = número que aparece ≥4 vezes no nome.
 */

interface TendenciaOculta {
  numero: number;
  frequencia: number;
  titulo: string;
  descricao: string;
  comoEquilibrar: string;
}

interface FrequenciasNumeros {
  [numero: number]: number;
}

interface Props {
  tendencias: TendenciaOculta[];
  frequencias: FrequenciasNumeros;
  nomeCompleto: string;
  showSolution?: boolean;
}

function FrequencyBar({ numero, frequencia, max }: { numero: number; frequencia: number; max: number }) {
  const pct = max > 0 ? Math.round((frequencia / max) * 100) : 0;
  const isTendencia = frequencia >= 4;

  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-center font-mono font-bold text-sm text-gold">{numero}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isTendencia ? 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#bea5ff]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`w-5 text-right text-sm font-mono ${
          isTendencia ? 'text-[#ef4444] font-bold' : 'text-[#bea5ff]'
        }`}
      >
        {frequencia}
      </span>
      {isTendencia && <span className="text-xs text-[#ef4444]">⚠</span>}
    </div>
  );
}

function TendenciaCard({ tendencia, showSolution }: { tendencia: TendenciaOculta; showSolution: boolean }) {
  const tituloCapitalizado = tendencia.titulo ? tendencia.titulo.charAt(0).toUpperCase() + tendencia.titulo.slice(1) : '';

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 overflow-hidden">
      <div className="w-full text-left p-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold font-mono shrink-0 bg-blue-500/20 border border-blue-500/30 text-blue-300">
          {tendencia.numero}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-200 text-sm leading-snug">{tituloCapitalizado}</p>
          <p className="text-xs text-blue-400 mt-0.5">aparece {tendencia.frequencia}× no nome</p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4 border-t border-blue-500/10">
        <p className="text-gray-300 text-sm leading-relaxed pt-4">{tendencia.descricao}</p>
        {showSolution && (
          <div className="rounded-lg p-3 bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-2">Como Equilibrar</p>
            <p className="text-blue-200 text-sm leading-relaxed">{tendencia.comoEquilibrar}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HiddenTendencies({ tendencias, frequencias, nomeCompleto, showSolution = true }: Props) {
  const primeiroNome = nomeCompleto.split(' ')[0] ?? nomeCompleto;
  const numeros = [1, 2, 3, 4, 5, 6, 7, 8];
  const maxFreq = Math.max(...numeros.map(n => frequencias[n] ?? 0), 1);

  return (
    <div className="space-y-6">
      {/* Mapa de frequências */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Frequência dos Números no Nome
        </h3>
        <div className="space-y-2.5">
          {numeros.map(n => (
            <FrequencyBar
              key={n}
              numero={n}
              frequencia={frequencias[n] ?? 0}
              max={maxFreq}
            />
          ))}
        </div>
        {tendencias.length > 0 && (
          <p className="text-xs text-[#ef4444] mt-3 flex items-center gap-1">
            <span>⚠</span> Números em vermelho apareceram 4 ou mais vezes = tendência oculta
          </p>
        )}
      </div>

      {/* Tendências */}
      {tendencias.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            ✓
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300 mb-1">Campo Vibracional Equilibrado</p>
            <p className="text-sm text-emerald-200/70 leading-relaxed">
              {primeiroNome} não possui tendências ocultas — nenhum número se repete excessivamente no nome. As frequências estão bem distribuídas, sem padrões de excesso que criem ciclos compulsivos.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-gray-400 leading-relaxed">
              <strong className="text-blue-300">{tendencias.length} tendência(s) oculta(s)</strong> — números
              que aparecem 4 ou mais vezes indicam um excesso daquela qualidade. Quando bem canalizada,
              pode ser um superpoder. Quando não, torna-se um padrão limitante.
            </p>
          </div>
          {tendencias.map((t, i) => <TendenciaCard key={i} tendencia={t} showSolution={showSolution} />)}

          {!showSolution && (
            <div className="mt-4 rounded-xl border border-[#bea5ff]/25 bg-[#bea5ff]/5 p-4">
              <p className="text-xs text-[#c084fc] uppercase tracking-wider font-semibold mb-2">Como a Harmonização Reequilibra as Tendências</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                A redistribuição vibracional do Nome Social ajusta a proporção dos números em excesso na raiz do campo energético. O que hoje cria ciclos repetitivos encontra contrapeso natural no novo campo vibracional — algo que esforço consciente sozinho não consegue alcançar.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
