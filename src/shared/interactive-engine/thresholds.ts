/**
 * Limiares canônicos de probabilidade e confiança do Motor Interativo JEV (DEV-235).
 * Referência: Especificação oficial seção 5A / Studio MLK.
 */

/** Confiança mínima em choice para classificar texto livre em uma opção; abaixo disso dispara esclarecimento. */
export const CHOICE_MIN = 0.45;

/** Escala contínua 0..1 para score ao vivo enquanto digita (debounce 300ms) para ler problema e alimentar radar. */
export const SCORE_LIVE = 0.5;

/** Padrão TypeSafe AI Noul: >= 0.7 confirma (caso positivo / escopo_pronto). */
export const NOUL_YES = 0.7;

/** Padrão TypeSafe AI Noul: <= 0.3 indica nulo / sem foco / não observável. */
export const NOUL_NO = 0.3;

/** Confiança mínima da hipótese para exibir o balão de palpite no chat. */
export const GUESS_MIN = 0.42;

/** Confiança baixa (< 0.2) ou resposta "Não, é outra coisa": aciona o juiz de correção. */
export const JUDGE_MAX = 0.2;
