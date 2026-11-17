import type { VariacaoNome } from '../../numerology/suggestions';
import type { CincoNumeros } from '../../numerology/numbers';

export interface SuggestionsPromptParams {
  nomeCompleto: string;
  cincoNumeros: CincoNumeros;
  variacoesCandidatas: VariacaoNome[];
  gender: string;
}

export function buildSuggestionsPrompt(params: SuggestionsPromptParams): string {
  const { nomeCompleto, cincoNumeros, variacoesCandidatas, gender } = params;

  const candidatasTexto = variacoesCandidatas
    .slice(0, 8)
    .map(
      v =>
        `- **${v.nome}** | Expressão: ${v.numerosExpressao} | Motivação: ${v.motivacao} | Impressão: ${v.impressao} | Score: ${v.score}/100 | ${v.justificativa}`
    )
    .join('\n');

  return `## Contexto

**Nome original:** ${nomeCompleto}
**Expressão original:** ${cincoNumeros.expressao}
**Destino:** ${cincoNumeros.destino}

## Candidatas a Nomes Magnéticos (sem bloqueios)

${candidatasTexto}

---

## Gênero / Sexo
**Gênero Identificado:** ${gender}
Adapte os pronomes e descrições dos nomes de acordo com o gênero acima. Certifique-se de que os textos de justificativa não troquem o sexo da pessoa.

---

## Sua tarefa

Das candidatas acima, selecione e apresente as **3 melhores variações de Nome Social** (somente nomes que estejam na lista acima, escritos exatamente como estão, com os mesmos acentos; nunca crie nomes novos) para ${nomeCompleto.split(' ')[0]}.

Para cada nome selecionado, forneça:

### Nome: [nome completo]
**Por que este nome é magnético:**
Explique em 2-3 frases por que esta variação remove os bloqueios e potencializa a energia desta pessoa.

**Harmonia numérica:**
Como os números deste nome se relacionam com o Destino (${cincoNumeros.destino}) e os demais números da pessoa.

**Como usar:**
Orientação prática — em quais contextos usar este nome para maximizar sua vibração (profissional, espiritual, social).

**Energia predominante:**
A qualidade energética principal que este nome projeta ao mundo.

Seja entusiasta e inspirador — estes são nomes que podem transformar a vida da pessoa!

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
1. NUNCA use títulos em letras MAIÚSCULAS. Use sempre Hash Headers (## ou ###).
2. Cada nome selecionado deve ter heading "### ✨ Nome: [nome completo]" (ou outro emoticon).
3. Use segunda pessoa: "você", "seu", "sua" — fale diretamente com a pessoa.
4. SEMPRE duplo espaçamento entre parágrafos.
5. Parágrafos com no máximo 4 linhas.
6. **Atenção ao Uso do Negrito:** Utilize negrito (**) de forma natural e estratégica para destacar ideias principais, palavras-chave e pontos de atenção importantes no texto. Evite colocar trechos inteiros ou frases longas em negrito.`;
}
