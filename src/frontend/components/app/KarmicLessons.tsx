/**
 * KarmicLessons — exibe as lições kármics do nome.
 * Lições = números de 1 a 9 ausentes no nome.
 */

interface LicaoCarmica {
  numero: number;
  titulo: string;
  descricao: string;
  comoTrabalhar: string;
}

interface Props {
  licoes: LicaoCarmica[];
  nomeCompleto: string;
  showSolution?: boolean;
}

const COR_LICAO = 'border-[#D4AF37]/30 bg-[#D4AF37]/10';

function LicaoCard({ licao, showSolution }: { licao: LicaoCarmica; showSolution: boolean }) {
  const cor = COR_LICAO;

  const tituloCapitalizado = licao.titulo ? licao.titulo.charAt(0).toUpperCase() + licao.titulo.slice(1) : '';

  return (
    <div className={`rounded-xl border overflow-hidden ${cor}`}>
      <div className="w-full text-left p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold font-mono shrink-0 border text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10`}>
          {licao.numero}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-200 text-sm leading-snug">{tituloCapitalizado}</p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4 border-t border-white/5">
        <p className="text-gray-300 text-sm leading-relaxed pt-4">{licao.descricao}</p>
        {showSolution && (
          <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Como Trabalhar</p>
            <p className="text-emerald-200 text-sm leading-relaxed">{licao.comoTrabalhar}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KarmicLessons({ licoes, nomeCompleto, showSolution = true }: Props) {
  const primeiroNome = nomeCompleto.split(' ')[0] ?? nomeCompleto;

  if (licoes.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center space-y-3">
        <div className="text-4xl">✨</div>
        <h3 className="text-lg font-semibold text-gold">Energia Completa</h3>
        <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto">
          {primeiroNome} não possui Lições Kármicas — todos os números de 1 a 9 estão presentes
          no nome. Isso indica uma energia numerológica completa e equilibrada nesta encarnação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4">
        <p className="text-sm text-gray-400 leading-relaxed">
          <strong className="text-[#D4AF37]">{licoes.length} {licoes.length === 1 ? 'Lição Kármica' : 'Lições Kármicas'}</strong> — números ausentes de 1 a 9 no nome de {primeiroNome}.
          Cada ausência indica uma qualidade a ser desenvolvida nesta encarnação.
        </p>
      </div>

      {licoes.map((l, i) => <LicaoCard key={i} licao={l} showSolution={showSolution} />)}

      {!showSolution && (
        <div className="mt-4 rounded-xl border border-[#bea5ff]/25 bg-[#bea5ff]/5 p-4">
          <p className="text-xs text-[#c084fc] uppercase tracking-wider font-semibold mb-2">Como a Harmonização Resolve as Lições Kármicas</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            O Nome Social Harmonizado pode introduzir as vibrações ausentes no seu campo energético. Quando o nome passa a conter esses números, a qualidade que estava em falta começa a ser cultivada naturalmente — sem depender exclusivamente de esforço consciente.
          </p>
        </div>
      )}
    </div>
  );
}
