interface Props {
  productName: string;
  analysisPath?: string;
  compact?: boolean;
}

export function ProductActiveNotice({
  productName,
  analysisPath = '/app/analise/nome-social',
  compact = false,
}: Props) {
  if (compact) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] border border-[#D4AF37]/30 p-6 text-center">
        <p className="text-gray-300 mb-2">
          Você já possui o produto <strong className="text-[#D4AF37]">{productName}</strong> ativo.
        </p>
        <a
          href={analysisPath}
          className="inline-block w-full bg-[#D4AF37] text-black font-bold py-3 rounded-xl hover:bg-yellow-300 transition-all"
        >
          Ir para minha análise
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-2xl p-8 text-center shadow-2xl">
        <h2 className="font-cinzel text-2xl font-bold text-white mb-3">Produto Ativo</h2>
        <p className="text-gray-300 mb-2">
          Você já possui o produto <strong className="text-[#D4AF37]">{productName}</strong> ativo em sua
          conta.
        </p>
        <p className="text-gray-400 text-sm mb-8">Continue sua harmonização de assinatura no app.</p>
        <a
          href={analysisPath}
          className="block w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl hover:bg-yellow-300 transition-all duration-300"
        >
          Ir para minha análise
        </a>
      </div>
    </div>
  );
}
