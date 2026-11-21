/**
 * Ideias de nome artístico totalmente novo (DEV-321).
 *
 * A IA só sugere ideias. Quem decide é o motor (`products/nome-artistico`): cada ideia
 * passa pelo cálculo dos 4 triângulos, bloqueios e compatibilidade com o Destino.
 * Nada de numerologia no texto da IA, nada de nome de pessoa famosa e nada de dados pessoais.
 */

export const SYSTEM_ARTISTIC_NAMES = `Você cria nomes artísticos em português do Brasil para artistas brasileiros.
Responda somente com JSON válido, sem texto antes ou depois.
Regras:
- Nomes curtos e fáceis de falar, com 1 ou 2 palavras (no máximo 3).
- Nunca use nomes de artistas, personagens ou marcas conhecidos.
- Não use o nome de nascimento da pessoa nem partes dele.
- Sem números, emojis, símbolos ou palavrões.
- Respeite o tom pedido (feminino, masculino ou neutro), a área e a imagem desejada.`;

export interface ArtisticNamesPromptParams {
  areaArtistica: string;
  detalhes: string[];
  generoPersona: string | null;
  imagens: string[];
  partesNascimento: string[];
  quantidade: number;
}

export function buildArtisticNamesPrompt(p: ArtisticNamesPromptParams): string {
  const tom =
    p.generoPersona === 'feminino'
      ? 'feminino'
      : p.generoPersona === 'masculino'
        ? 'masculino'
        : 'neutro ou ambíguo';
  return `Crie ${p.quantidade} ideias de nome artístico.

Área: ${p.areaArtistica}
Estilo: ${p.detalhes.length > 0 ? p.detalhes.join(', ') : 'livre'}
Tom do nome: ${tom}
Imagem desejada: ${p.imagens.length > 0 ? p.imagens.join(', ') : 'livre'}
Palavras proibidas (nome de nascimento): ${p.partesNascimento.join(', ')}

Varie o formato: alguns de uma palavra, outros de duas.
Formato da resposta: {"nomes": ["Nome Um", "Nome Dois"]}`;
}
