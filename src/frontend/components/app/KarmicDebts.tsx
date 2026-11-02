/**
 * KarmicDebts — exibe os débitos kármicos do nome.
 * Débitos = 13, 14, 16, 19.
 * Débitos "fixos" vêm do dia natalício e/ou Destino — não podem ser eliminados por mudança de nome.
 * Débitos "variáveis" vêm de Motivação e/ou Expressão — podem ser eliminados por variação do nome.
 */

interface DebitoCarmico {
  numero: number;
  titulo: string;
  descricao: string;
  fontes?: string[];
  /** true = vem APENAS do dia natalício e/ou Destino — imutável pelo nome */
  fixo?: boolean;
}

interface Props {
  debitos: DebitoCarmico[];
  nomeCompleto: string;
}

function DebitoCard({ debito }: { debito: DebitoCarmico }) {
  const isFixo = debito.fixo === true;

  const tituloCapitalizado = debito.titulo
    ? debito.titulo.charAt(0).toUpperCase() + debito.titulo.slice(1)
    : '';

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isFixo
        ? 'border-amber-500/40 bg-amber-500/5'
        : 'border-purple-500/30 bg-purple-500/10'
    }`}>
      <div className="w-full text-left p-4 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold font-mono shrink-0 border ${
          isFixo
            ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
            : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
        }`}>
          {debito.numero}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-gray-200 text-sm leading-snug">{tituloCapitalizado}</p>
            {isFixo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                🔒 Permanente
              </span>
            )}
          </div>
          {isFixo && (
            <p className="text-[11px] text-amber-400/70 leading-snug">
              Ligado ao dia natalício / Destino — não pode ser eliminado por mudança de nome
            </p>
          )}
        </div>
      </div>

      <div className={`px-4 pb-4 space-y-4 border-t bg-opacity-5 ${
        isFixo ? 'border-amber-500/10 bg-amber-500/5' : 'border-purple-500/10 bg-purple-500/5'
      }`}>
        <p className="nm-card-text pt-4 break-words">
          {debito.descricao}
        </p>
        {isFixo ? (
          <p className="text-xs text-amber-400/80 italic border-t border-amber-500/10 pt-3 text-left sm:text-justify [text-align-last:left]">
            Este débito está vinculado à data de nascimento e persiste independentemente do nome utilizado. Trabalhe-o com consciência e ação focada.
          </p>
        ) : (
          <p className="text-xs text-purple-400/80 italic border-t border-purple-500/10 pt-3 text-left sm:text-justify [text-align-last:left]">
            Este débito pode ser reduzido ou eliminado por uma variação do nome que ajuste os números de Motivação e/ou Expressão.
          </p>
        )}
      </div>
    </div>
  );
}

export default function KarmicDebts({ debitos, nomeCompleto }: Props) {
  const primeiroNome = nomeCompleto.split(' ')[0] ?? nomeCompleto;

  if (debitos.length === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-center gap-4">
        <div className="text-emerald-400 text-3xl">✓</div>
        <div>
          <p className="text-emerald-400 font-semibold">Nenhum débito kármico detectado</p>
          <p className="text-gray-400 text-sm mt-1">
            Seu nome não carrega pendências de encarnações passadas — uma vantagem significativa na sua jornada.
          </p>
        </div>
      </div>
    );
  }

  const fixos    = debitos.filter(d => d.fixo === true);
  const variaveis = debitos.filter(d => d.fixo !== true);

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4">
        <p className="nm-card-text">
          <strong className="text-[#c084fc]">{debitos.length} {debitos.length === 1 ? 'Débito Kármico' : 'Débitos Kármicos'}</strong> — o nome de {primeiroNome} aponta para tendências de encarnações passadas que precisam ser redimidas nesta vida.
          {fixos.length > 0 && (
            <> <span className="text-amber-300">{fixos.length} {fixos.length === 1 ? 'é permanente' : 'são permanentes'}</span> (ligado{fixos.length > 1 ? 's' : ''} à data de nascimento) e {variaveis.length > 0 ? 'não pode ser eliminado pelo nome.' : 'não podem ser eliminados pelo nome.'}</>
          )}
        </p>
      </div>

      {/* Débitos permanentes primeiro */}
      {fixos.length > 0 && (
        <div className="space-y-3">
          {fixos.length < debitos.length && (
            <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider px-1">
              Permanentes — não eliminados pelo nome
            </p>
          )}
          {fixos.map((d, i) => <DebitoCard key={`fixo-${i}`} debito={d} />)}
        </div>
      )}

      {/* Débitos variáveis */}
      {variaveis.length > 0 && (
        <div className="space-y-3">
          {fixos.length > 0 && variaveis.length > 0 && (
            <p className="text-xs font-semibold text-purple-400/80 uppercase tracking-wider px-1">
              Variáveis — podem ser reduzidos pelo nome
            </p>
          )}
          {variaveis.map((d, i) => <DebitoCard key={`var-${i}`} debito={d} />)}
        </div>
      )}
    </div>
  );
}
