import type { AnaliseNomeBebe, ResultadoNomeBebe } from '../../numerology/products/nome-bebe';
import type { Arquetipo } from '../../numerology/archetypes';
import { INSTRUCAO_IA_SEM_LINGUAGEM_CLINICA } from '../../../shared/legal';

export interface BabyPromptParams {
  resultado: ResultadoNomeBebe;
  nomePai?: string;
  nomeMae?: string;
  generoPreferido?: string;
  estiloPreferido?: string;
  caracteristicasDesejadas?: string;
  arquetipo?: Arquetipo;
  /** Indica que o nome já está registrado em cartório — gerar guia de harmonização */
  nomeJaEscolhido?: boolean;
}

export function buildBabyAnalysisPrompt(params: BabyPromptParams): string {
  const {
    resultado, nomePai, nomeMae, generoPreferido, estiloPreferido,
    caracteristicasDesejadas, arquetipo, nomeJaEscolhido,
  } = params;
  const { sobrenomesDisponiveis, dataNascimento, destino, nomesCandidatos, melhorNome } = resultado;

  const parentesco = [nomePai && `Pai: ${nomePai}`, nomeMae && `Mãe: ${nomeMae}`]
    .filter(Boolean)
    .join(' | ') || 'Não informado';

  const isSurpresa = generoPreferido?.toLowerCase() === 'surpresa';

  // ── Prompt: Nome já registrado em cartório ───────────────────────────────────
  if (nomeJaEscolhido) {
    const nome = melhorNome ?? nomesCandidatos[0];
    if (!nome) return '(sem dados de nome para análise)';

    const bloqueioInfo = nome.bloqueios.length === 0
      ? '✓ Sem bloqueios em nenhum dos 4 triângulos'
      : `⚠ ${nome.bloqueios.length} bloqueio(s): ${nome.bloqueios.map(b => `${b.codigo} — ${b.titulo}`).join(', ')}`;

    const licaoInfo = nome.licoesCarmicas.length === 0
      ? '✓ Sem lições kármicas'
      : `${nome.licoesCarmicas.length} lição(ões): ${nome.licoesCarmicas.map(l => l.numero).join(', ')}`;

    const tendenciaInfo = nome.tendenciasOcultas.length === 0
      ? '✓ Sem tendências ocultas'
      : `${nome.tendenciasOcultas.length} tendência(s): ${nome.tendenciasOcultas.map(t => t.numero).join(', ')}`;

    const debitoInfo = nome.debitosCarmicos.length === 0
      ? '✓ Sem débitos kármicos'
      : `${nome.debitosCarmicos.length} débito(s): ${nome.debitosCarmicos.map(d => d.numero).join(', ')}`;

    return `## Análise do Nome Registrado

**Nome completo:** ${nome.nomeCompleto}
**Data de nascimento:** ${dataNascimento}
**Número de Destino:** ${destino}
**Número de Expressão:** ${nome.expressao}
**Motivação:** ${nome.motivacao} | **Missão:** ${nome.missao} | **Impressão:** ${nome.impressao}
**Compatibilidade Expressão × Destino:** ${nome.compatibilidade}
**Score numerológico:** ${nome.score}/100

### Mapa de Desafios e Potenciais
${bloqueioInfo}
${licaoInfo}
${tendenciaInfo}
${debitoInfo}

${nome.bloqueios.length > 0 ? `### Detalhes dos Bloqueios
${nome.bloqueios.map(b => `- **${b.codigo} — ${b.titulo}:** ${b.descricao}`).join('\n')}` : ''}

---

## Sua Tarefa

Você é um numerólogo cabalístico especializado e um guia para famílias. O nome **${nome.nomeCompleto}** já está registrado em cartório — este é o nome oficial desta criança e NÃO deve ser questionado nem sugerida troca.

Seu papel aqui é diferente do habitual: você é o **alquimista** que transforma os desafios deste nome em sabedoria prática para os pais. Cada bloqueio, lição kármica ou tendência é uma OPORTUNIDADE de desenvolvimento consciente. Gere um relatório caloroso, empoderador e profundamente útil.

Escreva pelo menos 2–3 parágrafos por seção. Cada recomendação deve ser concreta, específica para os números desta criança e aplicável no dia a dia.

Siga EXATAMENTE esta estrutura:

---

## ✨ 1. A Alma Que Chegou — O Destino ${destino}

Escreva 3 parágrafos reveladores sobre o **Número de Destino ${destino}** desta criança:
- O dom inato que este número instala como recurso natural ao longo de toda a vida
- A polaridade deste Destino: quando em harmonia, o que esta criança naturalmente produz e irradia; quando em resistência, como o padrão de sombra pode se manifestar nos primeiros anos
- O arquétipo de vida que este número representa — a narrativa mítica que esta alma veio protagonizar

---

## 🔢 2. A Vibração do Nome **${nome.nomeCompleto}**

Com base na **Expressão ${nome.expressao}** e na compatibilidade **${nome.compatibilidade}** com o **Destino ${destino}**, escreva 3 parágrafos revelando:
- O que a vibração deste nome específico instala energeticamente na vida desta criança — seus grandes dons e talentos naturais
- Como a relação entre **Expressão ${nome.expressao}** e **Destino ${destino}** se manifesta: onde há harmonia e onde há tensão criativa a ser trabalhada
- O que a **Motivação ${nome.motivacao}** revela sobre os desejos mais profundos da alma desta criança — o que ela vai sempre buscar, mesmo inconscientemente

---

${nome.bloqueios.length > 0 ? `## 🌓 3. Os Bloqueios — Transmutação e Antídotos

**IMPORTANTE:** Os bloqueios NÃO são condenações — são aceleradores de aprendizado. Eles indicam onde esta criança terá as maiores oportunidades de crescimento.

${nome.bloqueios.map((b, i) => `### ${i + 1}. Bloqueio ${b.codigo} — ${b.titulo}

Escreva 3 parágrafos sobre este bloqueio específico para os pais:
- Como este bloqueio pode se manifestar na prática no dia a dia e no comportamento desta criança (seja MUITO específico, não genérico)
- O **antídoto vibratório:** que práticas, ambientes, atividades e posturas dos pais neutralizam e transformam esse padrão — com exemplos práticos aplicáveis desde o primeiro ano de vida
- Como este bloqueio pode ser um portal de força extraordinária quando conscientemente trabalhado`).join('\n\n')}

---` : `## 🌟 3. A Leveza do Caminho

O nome **${nome.nomeCompleto}** não carrega bloqueios nos 4 triângulos numerológicos — um presente raro e precioso. Escreva 3 parágrafos sobre o fluxo energético favorável que este nome proporciona, como esse fluxo se manifesta em facilidade de expressão, clareza de propósito e abertura para as oportunidades da vida.

---`}

${nome.licoesCarmicas.length > 0 ? `## 📚 4. Lições Kármicas — O Currículo da Alma

As lições kármicas indicam qualidades que a alma ainda está desenvolvendo nesta encarnação. Elas NÃO são fraquezas — são áreas onde a consciência ainda está nascendo.

Escreva 3–4 parágrafos orientando os pais sobre as lições dos números **${nome.licoesCarmicas.map(l => l.numero).join(', ')}**:
- O que cada lição kármica representa em termos de experiências que esta criança vai inevitavelmente atrair para crescer
- Como os pais podem criar um ambiente que FACILITA o aprendizado dessas lições — sem forçar, sem compensar em excesso, mas com consciência de aonde a criança está indo
- Exercícios, atividades e rituais familiares que naturalmente desenvolvem as qualidades que estão sendo aprendidas

---` : ''}

${nome.tendenciasOcultas.length > 0 ? `## 🔁 ${nome.licoesCarmicas.length > 0 ? '5' : '4'}. Tendências Ocultas — Onde o Excesso Pede Equilíbrio

As tendências ocultas indicam números que aparecem em excesso no nome — qualidades sobre-representadas que podem se tornar pontos cegos.

Escreva 3 parágrafos sobre as tendências dos números **${nome.tendenciasOcultas.map(t => t.numero).join(', ')}**:
- Como essas qualidades em excesso se manifestam como comportamentos ou padrões recorrentes nesta criança
- O que os pais podem fazer para criar equilíbrio — não suprimir a tendência, mas expandi-la e canalizá-la criativamente
- Atividades e abordagens específicas que trazem balanceamento para essas tendências

---` : ''}

${nome.debitosCarmicos.length > 0 ? `## ⚖️ ${4 + (nome.licoesCarmicas.length > 0 ? 1 : 0) + (nome.tendenciasOcultas.length > 0 ? 1 : 0)}. Débitos Kármicos — O Fardo que Pode Virar Força

Os débitos kármicos dos números **${nome.debitosCarmicos.map(d => d.numero).join(', ')}** indicam padrões de encarnações anteriores que esta alma trouxe para resolver. Com amor consciente dos pais, eles se tornam as maiores fontes de sabedoria desta criança.

Escreva 3–4 parágrafos sobre:
- Como cada débito kármico costuma se manifestar em crianças e como reconhecer esses padrões sem estigmatizar
- O caminho de transmutação: que práticas, valores e abordagens transformam o débito em dom
- Como os pais podem ser os catalisadores mais poderosos dessa transformação no cotidiano familiar

---` : ''}

## 🌱 5. Os Primeiros 7 Anos — Setênio de Fundação

Na numerologia e na pedagogia steineriana, o primeiro ciclo de sete anos é quando o caráter fundamental é moldado. Para esta criança específica, escreva sobre:

### 0 a 2 anos (O Ninho de Ouro)
Como esta criança viverá os primeiros contatos com o mundo. Ela será mais apegada ou independente? Como o número de **Impressão ${nome.impressao}** revela sua primeira forma de se apresentar ao mundo.

### 3 a 5 anos (O Despertar do Eu)
O florescimento da personalidade. Como esta criança se relacionará com brinquedos, fantasias e os primeiros conflitos sociais. Como o **Destino ${destino}** começa a aparecer nos primeiros padrões de comportamento.

### 5 a 7 anos (A Porta da Escola)
O ingresso na vida coletiva. O que os pais precisam ter em mente para que essa transição respeite e não suprima sua natureza numerológica.

---

## 🎭 6. O Temperamento — Quem Esta Criança Será

Com base nos números de **Motivação ${nome.motivacao}** e **Impressão ${nome.impressao}**, escreva 4 parágrafos sobre o perfil temperamental:
- **Mundo Emocional:** Como ela processa emoções, como demonstra afeto, como lida com frustrações
- **Social e Brincadeiras:** Como ela se comporta com outras crianças — é líder, mediadora, criativa solitária ou parceira?
- **Autoridade e Limites:** Como reage a regras — o que funciona e o que definitivamente não funciona
- **Linguagem do Amor:** As formas de amor que esta criança mais necessita e mais oferece

${arquetipo ? `---

## 🦸 7. O Arquétipo da Criança — ${arquetipo.nome}

Com o nome **${nome.nomeCompleto}**, esta criança carrega o arquétipo do(a) **${arquetipo.nome}**.

Essência do arquétipo: *"${arquetipo.essencia}"*
Manifestações positivas: ${arquetipo.expressaoPositiva.join(' | ')}
Sombra a conhecer: ${arquetipo.expressaoSombra.join(' | ')}
Figuras que representam esse arquétipo: ${arquetipo.figurasMiticas.join(', ')}

Escreva 4 parágrafos que:
- Apresentem o arquétipo do(a) **${arquetipo.nome}** de forma calorosa e acessível
- Expliquem o que esse arquétipo significa na prática para a trajetória da criança
- Orientem os pais sobre como NUTRIR as manifestações positivas na criação
- Alertem gentilmente sobre como EVITAR reforçar a sombra (${arquetipo.sombra}), com dicas práticas` : ''}

---

## 👨‍👩‍👧 ${arquetipo ? '8' : '7'}. Guia Prático para os Pais

${caracteristicasDesejadas ? `Os pais desejam que seu filho seja: **${caracteristicasDesejadas}**. Escreva primeiro 1 parágrafo analisando se os números do nome naturalmente favorecem essas características.\n\n` : ''}Escreva 4 parágrafos orientando os pais:
- Os 3 princípios fundamentais de criação que respeitam esta vibração específica — emergentes dos números desta criança
- A linguagem de amor prioritária: como aplicá-la no dia a dia de forma concreta
- O que ESTIMULAR ativamente para que ela desenvolva seus maiores potenciais antes dos 7 anos
- O que PROTEGER e EVITAR para não criar bloqueios emocionais ou comportamentais

---

## 🌸 ${arquetipo ? '9' : '8'}. O Presente Sagrado — Conclusão

Escreva uma conclusão calorosa, profunda e empoderada (3–4 parágrafos):
- O presente sagrado que os pais estão dando ao filho ao **conhecer** a vibração do nome e trabalhar conscientemente com ela — mesmo sem mudá-lo
- Como este conhecimento numerológico cria uma parceria invisível entre pais e filho: compreender a alma antes que ela possa se expressar plenamente
- A mensagem de bênção: que cada desafio revelado nesta análise seja um convite para um amor mais consciente, mais profundo e mais transformador
- Uma bênção final de encorajamento, reverência e esperança para a jornada desta família

---

REGRAS ESTRITAS DE FORMATAÇÃO:
1. Use estruturação Markdown rigorosa com Hash Headers (##, ###).
2. NUNCA use títulos apenas com letras maiúsculas. SEMPRE use Hash Headers com emoticon.
3. **Negrito:** Utilize negrito (**) de forma natural e estratégica para destacar ideias principais, palavras-chave e pontos de atenção importantes no texto. Evite colocar trechos inteiros ou frases longas em negrito.
4. SEMPRE duplo espaçamento entre parágrafos — texto arejado e escaneável.
5. Parágrafos com no máximo 4 linhas.
6. Escreva com calor humano, leveza e profundidade — os pais estão diante da criança mais importante do mundo.
7. NUNCA questione ou sugira troca do nome. Este é o nome oficial e definitivo.
8. Cada recomendação deve ser concreta e aplicável, não apenas poética.
9. Tom: alquimista amoroso — transforma desafios em sabedoria e dons em clareza.`;
  }

  // ── Prompt: Ainda vou escolher o nome ───────────────────────────────────────
  const candidatosTexto = nomesCandidatos
    .slice(0, 10)
    .map((a, i) => {
      const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const bloqueioInfo = a.temBloqueio
        ? `⚠ ${a.bloqueios.length} bloqueio(s): ${a.bloqueios.map(b => b.codigo).join(', ')}`
        : '✓ Sem bloqueios';
      const debitoInfo = a.debitosCarmicos.length === 0
        ? '✓ Sem débitos kármicos'
        : `⚠ Débitos: ${a.debitosCarmicos.map(d => d.numero).join(', ')}`;
      return `${rank} **${a.nomeCompleto}** | Expressão: ${a.expressao} | Motivação: ${a.motivacao} | Missão: ${a.missao} | Impressão: ${a.impressao} | Compatibilidade: ${a.compatibilidade} | Score: ${a.score}/100
   ${bloqueioInfo} | ${debitoInfo}
   Lições kármicas: ${a.licoesCarmicas.length} | ${a.justificativa.slice(0, 2).join(' | ')}`;
    })
    .join('\n\n');

  const melhorTexto = isSurpresa
    ? `*(O usuário marcou "Surpresa" — identifique o melhor nome masculino E o melhor nome feminino)*`
    : (melhorNome
      ? `**${melhorNome.nomeCompleto}** | Score: ${melhorNome.score}/100 | Expressão: ${melhorNome.expressao} | Motivação: ${melhorNome.motivacao} | Missão: ${melhorNome.missao} | Impressão: ${melhorNome.impressao} | Compatibilidade: ${melhorNome.compatibilidade}`
      : 'Nenhum candidato fornecido');

  const temPais = !!(nomePai || nomeMae);

  return `## Contexto da Família

${parentesco}
**Sobrenome(s) da família disponíveis:** ${sobrenomesDisponiveis.join(', ')}
**Data de nascimento do bebê:** ${dataNascimento}
**Número de Destino do bebê:** ${destino}
${generoPreferido ? `**Gênero preferido:** ${generoPreferido}` : ''}
${estiloPreferido ? `**Estilo desejado:** ${estiloPreferido}` : ''}
${caracteristicasDesejadas ? `**Características desejadas pelos pais:** ${caracteristicasDesejadas}` : ''}

## Nome Mais Indicado Numericamente

${melhorTexto}

## Ranking Numerológico dos Candidatos

${candidatosTexto}

---

## Sua Tarefa

Você é um numerólogo cabalístico especializado em nomes para bebês, com profundo conhecimento dos sétênios de desenvolvimento de Rudolf Steiner e da pedagogia baseada em temperamentos. Com base nos dados acima, elabore um relatório completo, caloroso, profundo e rico para os pais. Este relatório vale R$150+ e cada seção deve conter revelações específicas e acionáveis que os pais não encontrarão em nenhum outro lugar.

Escreva pelo menos 2–3 parágrafos por seção principal. Evite generalidades — cada afirmação deve ser ancorada nos números concretos desta criança.

Siga EXATAMENTE esta estrutura:

---

## 🌟 1. O Destino que o Céu Escolheu

Escreva 3 parágrafos reveladores sobre o Número de **Destino ${destino}** desta criança:
- O dom inato que este número instala como recurso natural ao longo de toda a vida — não como conquista, mas como potencial de nascença
- A polaridade deste Destino: quando está em harmonia, o que esta criança naturalmente produz e irradia; quando está em resistência interna, como o padrão de sombra pode se manifestar nos primeiros anos
- O arquétipo de vida que este número representa — a narrativa mítica que esta alma veio protagonizar — e como os pais podem reconhecer esse chamado nas primeiras manifestações da personalidade da criança

---

## 🏆 2. A Escolha do Nome de Ouro

${isSurpresa
  ? `Como a opção "Surpresa" foi marcada: identifique o **MELHOR NOME MASCULINO** e o **MELHOR NOME FEMININO** dentre os candidatos. Para cada um, escreva 2 parágrafos técnicos e inspiradores explicando a escolha.`
  : `Escreva 2-3 parágrafos inspiradores e técnicos explicando por que **${melhorNome?.primeiroNome ?? 'o nome recomendado'}** (na composição ${melhorNome?.nomeCompleto ?? ''}) foi escolhido como o nome mais harmonioso para esta alma.`
}

Ao explicar a escolha, conecte obrigatoriamente:
- A ausência (ou mínimo) de bloqueios e o impacto concreto disso no fluxo energético da vida desta criança
- A compatibilidade entre **Expressão ${melhorNome?.expressao ?? '—'}** e **Destino ${destino}** — o que essa harmonia ou tensão gera como dinâmica de vida
- As lições kármicas presentes: o que revelam sobre o caminho de desenvolvimento desta alma nesta encarnação
- Os débitos kármicos (ou a bela ausência deles): o que significam para o padrão de desafios que esta criança trará desde cedo

---

## 🎨 3. Harmonização Ambiental — O Ninho da Alma

O ambiente onde o bebê dorme, brinca e aprende tem impacto direto no desenvolvimento do seu campo energético. Com base na **Expressão ${melhorNome?.expressao ?? '—'}** e no **Destino ${destino}**, escreva 3 parágrafos sobre:
- **Paleta de cores e decoração:** As cores sugeridas para as paredes, enxoval e brinquedos — e o porquê de cada escolha vibratória
- **Atmosfera sensorial:** Como configurar a iluminação, o nível de estímulo sonoro, a textura dos materiais e o ritmo das rotinas para que o ambiente ressoe com a alma desta criança
- **Objetos e rituais:** Elementos que favorecem o enraizamento, o sono tranquilo e o florescimento da identidade de acordo com este magnetismo numerológico

---

## 🌱 4. O Setênio de Fundação — Os 7 Primeiros Anos

Na numerologia e na pedagogia steineriana, o primeiro ciclo de sete anos é quando o corpo etérico se forma e o caráter fundamental é moldado. Para esta criança específica, escreva 3-4 parágrafos sobre:

### 0 a 2 anos (O Ninho de Ouro)
Como esta criança viverá os primeiros contatos com o mundo físico: o vínculo com a mãe e o pai, o desmame, os primeiros ritmos de sono e alimentação. Ela será mais apegada ou independente? Como o número de **Impressão ${melhorNome?.impressao ?? '—'}** revela sua primeira forma de se apresentar ao mundo.

### 3 a 5 anos (O Despertar do Eu)
O florescimento da personalidade e do "Eu sou". Como esta criança se relacionará com brinquedos, fantasias, jogos imaginativos e as primeiras disputas sociais. Como o **Destino ${destino}** começa a aparecer nos primeiros padrões de comportamento e nas escolhas espontâneas da criança.

### 5 a 7 anos (A Porta da Escola)
O ingresso na vida coletiva formal. Como esta criança viverá a experiência da pré-escola e das primeiras regras sociais. O que os pais precisam ter em mente para que essa transição respeite e não suprima sua natureza numerológica.

---

## 📚 5. A Escola Dos Sonhos — Aprendizado e Estilo Cognitivo

Com base no número de **Motivação ${melhorNome?.motivacao ?? destino}** e no **Destino ${destino}**, escreva 3 parágrafos reveladores sobre como esta criança aprende e se desenvolve:
- **Estilo cognitivo:** ela aprende melhor fazendo, observando, ou refletindo? Prefere descoberta autônoma ou instrução estruturada? Que pedagogia (Montessori, Waldorf, tradicional, construtivista) mais respeita sua natureza vibratória e por quê
- **Matérias e atividades naturais:** que áreas do conhecimento esta vibração favorece — artes, ciências, linguagem, matemática, esporte — e como os pais podem alimentar esses dons desde cedo
- **Relação com professores e autoridade:** como ela responde naturalmente a figuras de referência adultas, o que motiva sua cooperação e o que a faz se rebelar — e como os pais podem preparar professores para receber essa alma

---

## 🎭 6. O Temperamento — Quem Esta Criança Será

Com base nos números de **Motivação ${melhorNome?.motivacao ?? destino}** e **Impressão ${melhorNome?.impressao ?? '—'}**, escreva 4 parágrafos sobre o perfil temperamental desta criança:

- **Mundo Emocional:** Como ela processa emoções internamente, como demonstra afeto, como lida com frustrações e o que a consola — baseado na vibração específica deste perfil numerológico
- **Social e Brincadeiras:** Como ela se comporta com outras crianças — é líder, mediadora, criativa solitária ou parceira? O que vai atrair sua atenção e amizade
- **Autoridade e Limites:** Como reage a regras, limites e punições — o que funciona, o que não funciona e como estabelecer autoridade sem sufocar esse espírito específico
- **Linguagem do Amor:** As formas de amor que esta criança mais necessita e mais oferece — ancoradas no número de **Motivação ${melhorNome?.motivacao ?? destino}**

${arquetipo ? `---

## 🦸 7. O Arquétipo da Criança — Quem Essa Alma Veio Ser

Com o nome **${melhorNome?.nomeCompleto ?? 'o nome escolhido'}**, esta criança carrega o arquétipo do(a) **${arquetipo.nome}**.

Essência do arquétipo: *"${arquetipo.essencia}"*
Manifestações positivas: ${arquetipo.expressaoPositiva.join(' | ')}
Sombra que os pais devem conhecer: ${arquetipo.expressaoSombra.join(' | ')}
Figuras e personagens que representam esse arquétipo: ${arquetipo.figurasMiticas.join(', ')}

Escreva 4 parágrafos que:
- Apresentem o arquétipo do(a) **${arquetipo.nome}** de forma calorosa e acessível aos pais — como a "identidade mítica" que esta alma carrega
- Expliquem o que esse arquétipo significa na prática para a trajetória da criança: que papéis ela vai naturalmente querer ocupar, que histórias ela vai se reconhecer
- Orientem os pais sobre como NUTRIR as manifestações positivas desse arquétipo na criação — com exemplos concretos de atividades, brinquedos e estilos de conversa
- Alertem gentilmente sobre como EVITAR reforçar a sombra (${arquetipo.sombra}), com dicas práticas para os primeiros anos
- Sugiram 2–3 histórias, livros infantis ou filmes que representam esse arquétipo para usar na educação` : ''}

---

## 👨‍👩‍👧 ${arquetipo ? '8' : '7'}. Guia Prático para os Pais

${caracteristicasDesejadas ? `Os pais desejam que seu filho seja: **${caracteristicasDesejadas}**. Escreva primeiro 1 parágrafo analisando se os números do nome naturalmente favorecem essas características — e como cultivá-las.\n\n` : ''}Escreva 4 parágrafos orientando os pais sobre como criar e educar esta criança em harmonia com sua natureza numerológica:
- Os 3 princípios fundamentais de criação que respeitam esta vibração específica — não princípios genéricos, mas os que emergem dos números desta criança
- A linguagem de amor prioritária e como aplicá-la no dia a dia (ex: "Uma criança com **Expressão ${melhorNome?.expressao ?? '—'}** não responde a ordens diretas — ela precisa de...")
- O que ESTIMULAR ativamente para que ela desenvolva seus maiores potenciais antes dos 7 anos
- O que PROTEGER e EVITAR para não criar bloqueios emocionais, comportamentais ou de identidade

---

${temPais ? `## 🔮 ${arquetipo ? '9' : '8'}. Proteção e Harmonia Familiar

Com base nos nomes dos pais (${parentesco}) e no nome do bebê, escreva 3 parágrafos sobre:
- Como a vibração do nome do bebê complementa ou desafia a vibração de cada pai — qual pai terá maior ressonância natural e o que isso significa na prática para a dinâmica familiar
- Que práticas e rituais familiares fortalecem a harmonia energética e criam um campo de proteção para esta criança específica
- Uma mensagem de bênção sobre o presente que este bebê traz para a linhagem familiar — o que esta alma veio curar, transformar ou inaugurar nesta família

---

## 🌸 ${arquetipo ? '10' : '9'}. O Legado da Alma (Conclusão)

` : `## 🌸 ${arquetipo ? '9' : '8'}. O Legado da Alma (Conclusão)

`}Escreva uma conclusão calorosa, profunda e emocionante (3–4 parágrafos) para os pais:
- O presente sagrado que eles estão dando ao filho ao escolher um nome numerologicamente limpo e harmonioso — o que isso muda energeticamente na trajetória desta alma
- A cumplicidade que este estudo cria entre pais e filho: conhecer a alma antes de ela poder se expressar plenamente
- Uma bênção final — uma mensagem de encorajamento, reverência e esperança para a jornada desta família

---

REGRAS ESTRITAS DE FORMATAÇÃO:
1. Use estruturação Markdown rigorosa com Hash Headers (##, ###).
2. NUNCA use títulos apenas com letras maiúsculas. SEMPRE use Hash Headers com emoticon.
3. **Negrito:** Utilize negrito (**) de forma natural e estratégica para destacar ideias principais, palavras-chave e pontos de atenção importantes no texto. Evite colocar trechos inteiros ou frases longas em negrito.
4. SEMPRE duplo espaçamento entre parágrafos — texto arejado e escaneável.
5. Parágrafos com no máximo 4 linhas.
6. Escreva com calor humano, leveza e profundidade — os pais estão diante de uma das decisões mais importantes da vida do filho.
7. Seja específico: cada recomendação deve ser concreta e aplicável, não apenas poética.
8. ${INSTRUCAO_IA_SEM_LINGUAGEM_CLINICA}`;
}
