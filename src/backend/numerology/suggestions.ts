/**
 * Geração e scoring de variações do nome sem bloqueios.
 */

import { calcularTrianguloDaVida } from './triangle';
import { calcularExpressao, calcularMotivacao, calcularImpressao } from './numbers';
import { reduzirNumero } from './core';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from './karmic';
import { calcularScore, calcularScoreTeto } from './score'; // legado v1 — aposentar na F2+
import { avaliarCompatibilidade, obterAvisoCompatibilidade, pessoaTemMaster11ou22 } from './harmonization';

export interface VariacaoNome {
  nome: string;
  numerosExpressao: number;
  motivacao: number;
  impressao: number;
  temBloqueio: boolean;
  score: number;
  /** Score máximo atingível para esta pessoa (100 - débitos fixos × 12). */
  scoreTeto: number;
  justificativa: string;
  aviso?: string;
}

// Substituições de letras comuns para variações
const SUBSTITUICOES: Record<string, string[]> = {
  A: ['Á', 'Â', 'Ã'],
  E: ['É', 'Ê'],
  I: ['Í'],
  O: ['Ó', 'Ô', 'Õ'],
  U: ['Ú', 'Ü'],
  C: ['Ç'],
  Y: ['I', 'J'],
  K: ['C', 'Q'],
  W: ['V', 'U'],
  PH: ['F'],
  TH: ['T'],
  CH: ['X'],
};

// Sufixos comuns em nomes brasileiros baseados no gênero
const SUFIXOS_MASCULINOS = ['o', 'us', 'os'];
const SUFIXOS_FEMININOS = ['a', 'e', 'i', 'is', 'as', 'es'];

// Prefixos base
const PREFIXOS_MASCULINOS = ['João', 'José', 'Pedro', 'Luiz', 'Carlos'];
const PREFIXOS_FEMININOS = ['Ana', 'Maria', 'Laura', 'Clara', 'Rosa'];

/**
 * Gera variações de um nome completo.
 * Modifica o primeiro nome mantendo o(s) sobrenome(s).
 */
export interface OpcoesVariacoes {
  sobrenomeCasamento?: string;
}

export function gerarVariacoes(
  nomeCompleto: string,
  quantidade = 5,
  gender: string = 'Neutro',
  opcoes?: OpcoesVariacoes
): string[] {
  const partes = nomeCompleto.trim().split(/\s+/);
  const primeiroNome = partes[0]!;
  const sobrenomesArr = partes.slice(1);
  const sobrenomes = sobrenomesArr.join(' ');

  const variacoes = new Set<string>();

  // DEV-260: Novas técnicas do curso:
  // 1. Estrutural: Tirar sobrenome (se >= 2 sobrenomes)
  if (sobrenomesArr.length >= 2) {
    for (let i = 0; i < sobrenomesArr.length; i++) {
      const restantes = sobrenomesArr.filter((_, idx) => idx !== i);
      variacoes.add([primeiroNome, ...restantes].join(' '));
    }
    variacoes.add(`${primeiroNome} ${sobrenomesArr[sobrenomesArr.length - 1]}`);
  }

  // 2. Estrutural: Tirar primeiro nome (se >= 3 partes)
  if (partes.length >= 3) {
    variacoes.add(sobrenomes);
    const segundoNome = partes[1]!;
    const resto = partes.slice(2).join(' ');
    variacoes.add([segundoNome, resto].filter(Boolean).join(' '));
  }

  // 3. Estrutural: Abreviar com inicial (ex.: "M. Silva Santos" ou "Maria S. Santos")
  if (primeiroNome.length > 1 && sobrenomes) {
    const inicial = primeiroNome.charAt(0).toUpperCase() + '.';
    variacoes.add(`${inicial} ${sobrenomes}`);
  }
  if (sobrenomesArr.length >= 2) {
    const meioAbreviado = sobrenomesArr.map((s, idx) => {
      if (idx === 0) return s.charAt(0).toUpperCase() + '.';
      return s;
    }).join(' ');
    variacoes.add(`${primeiroNome} ${meioAbreviado}`);
  }

  // 4. Estrutural: Sobrenome de casamento quando informado
  if (opcoes?.sobrenomeCasamento && opcoes.sobrenomeCasamento.trim()) {
    const casam = opcoes.sobrenomeCasamento.trim();
    variacoes.add(`${nomeCompleto} ${casam}`);
    variacoes.add(`${primeiroNome} ${casam}`);
    if (sobrenomesArr.length >= 1) {
      variacoes.add(`${primeiroNome} ${sobrenomesArr[0]} ${casam}`);
    }
  }

  // 5. Adicionar/remover letra final
  if (primeiroNome.endsWith('a') || primeiroNome.endsWith('A')) {
    variacoes.add(`${primeiroNome.slice(0, -1)}e ${sobrenomes}`.trim());
    variacoes.add(`${primeiroNome.slice(0, -1)}i ${sobrenomes}`.trim());
    variacoes.add(`${primeiroNome}na ${sobrenomes}`.trim());
  }
  if (primeiroNome.endsWith('o') || primeiroNome.endsWith('O')) {
    variacoes.add(`${primeiroNome.slice(0, -1)}a ${sobrenomes}`.trim());
    variacoes.add(`${primeiroNome.slice(0, -1)}e ${sobrenomes}`.trim());
  }

  // 6. Adicionar prefixo baseado no gênero
  let prefixosAUsar: string[] = [];
  if (gender === 'Masculino') {
    prefixosAUsar = PREFIXOS_MASCULINOS;
  } else if (gender === 'Feminino') {
    prefixosAUsar = PREFIXOS_FEMININOS;
  } else {
    prefixosAUsar = [...PREFIXOS_MASCULINOS, ...PREFIXOS_FEMININOS];
  }

  for (const prefixo of prefixosAUsar.slice(0, 3)) {
    variacoes.add(`${prefixo} ${primeiroNome} ${sobrenomes}`.trim());
  }

  // 7. Diminutivos/hipocorísticos
  const nomeBase = primeiroNome.replace(/[aeiou]$/i, '');
  let sufixosAUsar: string[] = [];
  if (gender === 'Masculino') {
    sufixosAUsar = SUFIXOS_MASCULINOS;
  } else if (gender === 'Feminino') {
    sufixosAUsar = SUFIXOS_FEMININOS;
  } else {
    sufixosAUsar = [...SUFIXOS_MASCULINOS, ...SUFIXOS_FEMININOS];
  }

  for (const sufixo of sufixosAUsar.slice(0, 3)) {
    const novo = nomeBase + sufixo;
    if (novo.length >= 3 && novo !== primeiroNome.toLowerCase()) {
      const nomeCapitalizado = novo.charAt(0).toUpperCase() + novo.slice(1);
      variacoes.add(`${nomeCapitalizado} ${sobrenomes}`.trim());
    }
  }

  // 8. Substituições de letras (acentos por ÚLTIMO — nunca usar anel °)
  for (const [orig, subs] of Object.entries(SUBSTITUICOES)) {
    if (primeiroNome.toUpperCase().includes(orig)) {
      for (const sub of subs.slice(0, 2)) {
        const novo = primeiroNome.replace(new RegExp(orig, 'gi'), sub);
        if (novo !== primeiroNome) {
          variacoes.add(`${novo} ${sobrenomes}`.trim());
        }
      }
    }
  }

  // Filtrar o nome original, nomes com anel ° e limitar
  const resultado = Array.from(variacoes)
    .filter(v => {
      if (v.toLowerCase() === nomeCompleto.toLowerCase()) return false;
      if (v.normalize('NFD').includes('\u030A')) return false; // Sem anel °
      return true;
    })
    .slice(0, Math.max(quantidade * 4, 20));

  return resultado;
}

/**
 * Calcula o score de uma variação do nome.
 * Score 0-100 baseado em: sem bloqueios, boa expressão, harmonia numérica,
 * lições kármics, tendências ocultas e débitos kármicos.
 */
export function scoreVariacao(
  nomeSugerido: string,
  numeroExpressaoAlvo: number,
  numeroDestinoAlvo: number,
  dataNascimento: string = ''
): VariacaoNome {
  const triangulo = calcularTrianguloDaVida(nomeSugerido);
  const expressao = calcularExpressao(nomeSugerido);
  const motivacao = calcularMotivacao(nomeSugerido);
  const impressao = calcularImpressao(nomeSugerido);
  const temBloqueio = (triangulo.sequenciasNegativas ?? []).length > 0;

  const licoes = detectarLicoesCarmicas(nomeSugerido);
  const tendencias = detectarTendenciasOcultas(nomeSugerido);
  const debitos = dataNascimento
    ? calcularDebitosCarmicos(dataNascimento, numeroDestinoAlvo, motivacao, expressao)
    : [];
  const compatibilidade = avaliarCompatibilidade(expressao, numeroDestinoAlvo);

  const debitosFixosCount = debitos.filter(d => d.fixo).length;
  const score = calcularScore({
    bloqueios: (triangulo.sequenciasNegativas ?? []).length,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos.length,
    debitosCarmicoFixos: debitosFixosCount,
    compatibilidade,
  });
  const scoreTeto = calcularScoreTeto(debitosFixosCount);

  const justificativas: string[] = [];
  if (temBloqueio) {
    justificativas.push(`Contém ${(triangulo.sequenciasNegativas ?? []).length} bloqueio(s)`);
  } else {
    justificativas.push('Sem bloqueios energéticos');
  }
  if (licoes.length > 0) justificativas.push(`${licoes.length} lição(ões) kármica(s)`);
  if (tendencias.length > 0) justificativas.push(`${tendencias.length} tendência(s) oculta(s)`);
  if (debitos.length > 0) justificativas.push(`${debitos.length} débito(s) kármico(s)`);
  justificativas.push(`Compatibilidade: ${compatibilidade}`);

  const aviso = obterAvisoCompatibilidade(compatibilidade);
  if (aviso) {
    justificativas.push(aviso);
  }

  return {
    nome: nomeSugerido,
    numerosExpressao: expressao,
    motivacao,
    impressao,
    temBloqueio,
    score,
    scoreTeto,
    justificativa: justificativas.join(' | '),
    aviso,
  };
}

/**
 * Gera e rankeia variações sem bloqueios.
 *
 * @param minScore Score mínimo desejado para as sugestões (padrão: 0).
 *   Se não houver candidatos suficientes com score >= minScore, usa fallback
 *   para as melhores disponíveis sem bloqueio.
 */
export function gerarNomesMagneticos(
  nomeCompleto: string,
  numeroExpressao: number,
  numeroDestino: number,
  gender: string,
  dataNascimento: string = '',
  quantidade = 5,
  minScore = 0,
  opcoes?: OpcoesVariacoes
): VariacaoNome[] {
  // Pool ampliado para ter mais candidatos a filtrar
  const poolSize = Math.max(quantidade * 6, 25);
  const variacoes = gerarVariacoes(nomeCompleto, poolSize, gender, opcoes);
  const scoredAll = variacoes.map(v => scoreVariacao(v, numeroExpressao, numeroDestino, dataNascimento));

  // DEV-260: Só sugerir Expressão 11/22 para Destino 1–9 se 11 ou 22 já aparecer em outro número da pessoa
  const temMaster = pessoaTemMaster11ou22({
    destino: numeroDestino,
    motivacao: calcularMotivacao(nomeCompleto),
    dataNascimento,
  });

  const filtrados = scoredAll.filter(v => {
    if (numeroDestino >= 1 && numeroDestino <= 9 && (v.numerosExpressao === 11 || v.numerosExpressao === 22)) {
      return temMaster;
    }
    return true;
  });

  // Mínimo de opções solicitado: no mínimo 2
  const minOpcoes = Math.max(quantidade, 2);

  // Preferência 1: sem bloqueio + score >= minScore
  const primarios = filtrados
    .filter(v => !v.temBloqueio && v.score >= minScore)
    .sort((a, b) => b.score - a.score);

  if (primarios.length >= minOpcoes) {
    return primarios.slice(0, minOpcoes);
  }

  // Fallback 1: sem bloqueio + score >= 70
  const SCORE_EXCELENTE = 70;
  const excelentes = filtrados
    .filter(v => !v.temBloqueio && v.score >= SCORE_EXCELENTE)
    .sort((a, b) => b.score - a.score);

  if (excelentes.length >= minOpcoes) {
    return excelentes.slice(0, minOpcoes);
  }

  // Fallback 2: sem bloqueio (qualquer score)
  const semBloqueio = filtrados.filter(v => !v.temBloqueio).sort((a, b) => b.score - a.score);
  if (semBloqueio.length >= minOpcoes) {
    return semBloqueio.slice(0, minOpcoes);
  }

  // Se mesmo assim faltar para o mínimo de 2 opções, retorna os melhores disponíveis
  return filtrados.sort((a, b) => b.score - a.score).slice(0, minOpcoes);
}
