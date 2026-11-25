import { useMemo, useState } from 'react';
import { calcularValor, extrairLetras, reduzirNumero } from '../../../backend/numerology/core';

/**
 * Exemplo interativo da página "Como calculamos a nota" (DEV-350).
 * Mostra, no navegador, cada letra virando número e a soma. Não grava nada, não usa IA e não envia
 * o texto digitado a lugar nenhum. Reaproveita a mesma tabela do motor (`calcularValor`).
 */
const MAX_CARACTERES = 40;

export function LetterNumberExample() {
  const [texto, setTexto] = useState('Maria');

  const { letras, soma, reduzido } = useMemo(() => {
    const lista = extrairLetras(texto.slice(0, MAX_CARACTERES))
      .map((l) => ({ letra: l, valor: calcularValor(l) }))
      .filter((x) => x.valor > 0);
    const total = lista.reduce((acc, x) => acc + x.valor, 0);
    return { letras: lista, soma: total, reduzido: total > 0 ? reduzirNumero(total, true) : 0 };
  }, [texto]);

  return (
    <div className="nm-floating-card p-5 sm:p-6 space-y-4">
      <div className="text-center">
        <h3 className="nm-h4 mb-1">Teste você mesmo</h3>
        <p className="nm-caption">Digite um nome e veja cada letra virar número. O texto fica só no seu navegador.</p>
      </div>

      <label className="block">
        <span className="sr-only">Nome para o exemplo</span>
        <input
          type="text"
          value={texto}
          maxLength={MAX_CARACTERES}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex.: Maria"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-full bg-black/30 px-5 py-3 text-center text-[#e5e2e1] placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-[#bea5ff]/40 transition-shadow duration-500"
        />
      </label>

      {letras.length > 0 ? (
        <>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Valor de cada letra">
            {letras.map((x, i) => (
              <li key={`${x.letra}-${i}`} className="rounded-xl bg-white/[0.04] px-3 py-2 text-center min-w-[2.5rem]">
                <span className="block text-sm font-semibold text-[#e5e2e1]">{x.letra.toUpperCase()}</span>
                <span className="block font-cinzel text-base font-bold text-[#f2ca50]">{x.valor}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-gray-300" aria-live="polite">
            Soma das letras: <strong className="text-white">{soma}</strong>
            {reduzido !== soma && (
              <>
                {' '}
                · reduzida a um dígito (mantendo 11 e 22): <strong className="text-[#f2ca50]">{reduzido}</strong>
              </>
            )}
          </p>
        </>
      ) : (
        <p className="text-center text-sm text-gray-500">Digite pelo menos uma letra.</p>
      )}

      <p className="nm-caption text-center">
        É só a soma das letras. O cálculo completo usa o nome inteiro e as regras de redução (como a regra do 2 e do 4), e a nota considera o Triângulo da Vida, a data e os demais critérios desta página.
      </p>
    </div>
  );
}
