import type { CincoNumeros } from '../../numerology/numbers';
import type { Bloqueio, TodosTriangulos } from '../../numerology/triangle';
import type { LicaoCarmica, TendenciaOculta, DebitoCarmicoInfo } from '../../numerology/karmic';
import type { Arquetipo } from '../../numerology/archetypes';

export interface AnalysisPromptParams {
  nomeCompleto: string;
  dataNascimento: string;
  cincoNumeros: CincoNumeros;
  arcanoRegente: number | null;
  todosTriangulos: TodosTriangulos;
  bloqueios: Bloqueio[];
  licoesCarmicas: LicaoCarmica[];
  tendenciasOcultas: TendenciaOculta[];
  debitosCarmicos: DebitoCarmicoInfo[];
  gender: string;
  arquetipo?: Arquetipo;
  isCurrentNameAnalysis?: boolean;
  isFreeAnalysis?: boolean;
}

export function buildAnalysisPrompt(params: AnalysisPromptParams): string {
  const {
    nomeCompleto,
    dataNascimento,
    cincoNumeros,
    arcanoRegente,
    todosTriangulos,
    bloqueios,
    licoesCarmicas,
    tendenciasOcultas,
    debitosCarmicos,
    gender,
    arquetipo,
    isCurrentNameAnalysis,
    isFreeAnalysis,
  } = params;

  const primeiroNome = nomeCompleto.split(' ')[0] ?? nomeCompleto;

  // Bloqueios com instrução de antídoto
  const bloqueiosTexto =
    bloqueios.length > 0
      ? bloqueios
          .map(b => {
            const detTriangulos = b.repeticoesPortriangulo
              ? Object.entries(b.repeticoesPortriangulo)
                  .map(([t, c]) => (c > 1 ? `${t}(${c}×)` : t))
                  .join(', ')
              : b.triangulos.join(', ');
            const ocorrStr = (b.totalOcorrencias ?? 1) > 1
              ? ` — ${b.totalOcorrencias} ocorrências totais`
              : '';
            let descLimpa = b.descricao;
            if (descLimpa.includes('O antídoto é')) {
              descLimpa = descLimpa.split('O antídoto é')[0].trim();
            }
            return (
              `- **${b.titulo}** (${b.codigo})${ocorrStr} — aparece em: ${detTriangulos}\n` +
              `  ${descLimpa}\n` +
              `  *Aspecto saúde:* ${b.aspectoSaude}`
            );
          })
          .join('\n')
      : 'Nenhum bloqueio detectado em nenhum dos 4 triângulos.';

  // Lições kármicas
  const licoesTexto =
    licoesCarmicas.length > 0
      ? licoesCarmicas
          .map(l => isFreeAnalysis
            ? `- **${l.titulo}** — ${l.descricao}`
            : `- **${l.titulo}** — ${l.descricao}\n  *Como trabalhar:* ${l.comoTrabalhar}`)
          .join('\n')
      : 'Nenhuma lição kármica — todos os números de 1 a 8 estão presentes no nome.';

  // Tendências ocultas
  const tendenciasTexto =
    tendenciasOcultas.length > 0
      ? tendenciasOcultas
          .map(t => isFreeAnalysis
            ? `- **${t.titulo}** (aparece ${t.frequencia}× no nome)\n  ${t.descricao}`
            : `- **${t.titulo}** (aparece ${t.frequencia}× no nome)\n  ${t.descricao}\n  *Como equilibrar:* ${t.comoEquilibrar}`)
          .join('\n')
      : 'Nenhuma tendência oculta detectada.';

  // Débitos kármicos
  const debitosTexto =
    debitosCarmicos.length > 0
      ? debitosCarmicos
          .map(d => `- **${d.titulo}** (${d.numero})\n  ${d.descricao}`)
          .join('\n')
      : 'Nenhum débito kármico detectado — excelente.';

  // Arcanos regentes por triângulo
  const arcanosTriangulos = [
    `Triângulo da Vida: **${todosTriangulos.vida.arcanoRegente ?? '—'}**`,
    `Triângulo Pessoal: **${todosTriangulos.pessoal.arcanoRegente ?? '—'}**`,
    `Triângulo Social: **${todosTriangulos.social.arcanoRegente ?? '—'}**`,
    `Triângulo do Destino: **${todosTriangulos.destino.arcanoRegente ?? '—'}**`,
  ].join(' | ');

  return `## Dados para Análise

**Nome completo:** ${nomeCompleto}
**Data de nascimento:** ${dataNascimento}
**Gênero:** ${gender}

## Os 5 Números Cabalísticos

| Número | Valor |
|--------|-------|
| Expressão (todas as letras) | ${cincoNumeros.expressao} |
| Destino (data de nascimento) | ${cincoNumeros.destino} |
| Motivação/Alma (vogais) | ${cincoNumeros.motivacao} |
| Impressão (consoantes) | ${cincoNumeros.impressao} |
| Missão (Destino + Expressão) | ${cincoNumeros.missao} |
| Arcano Regente (Triângulo da Vida) | ${arcanoRegente ?? '—'} |
${todosTriangulos.vida.arcanoAtual?.numero ? `| Arcano de Trânsito Atual | ${todosTriangulos.vida.arcanoAtual.numero} (período de ${todosTriangulos.vida.arcanoAtual.periodo}) |` : ''}

## Arcanos Regentes dos 4 Triângulos

${arcanosTriangulos}

## Bloqueios Energéticos (sequências negativas nos 4 triângulos)

${bloqueiosTexto}

## Lições Kármicas (números ausentes de 1 a 8)

${licoesTexto}

## Tendências Ocultas (números com frequência ≥ 4)

${tendenciasTexto}

## Débitos Kármicos

${debitosTexto}

---

## Sua Tarefa

Elabore um relatório numerológico cabalístico completo e profundamente personalizado para **${primeiroNome}**.
O sistema indicou que a pessoa se identifica com o gênero: **${gender}**. Adapte pronomes, adjetivos e tom para refletir esse gênero ao longo de todo o texto.

${isFreeAnalysis
  ? `MODO DIAGNÓSTICO: Máximo 2 parágrafos curtos por seção (≤120 palavras cada). Estilo: médico diagnosticador, não terapeuta. NÃO descreva virtudes de forma isolada — sempre conecte a qualidade ao conflito com outro número que a sabota ou ao problema que ela não resolve sozinha. O objetivo é o usuário reconhecer um problema urgente, não sentir-se bem consigo mesmo.`
  : `Escreva cada seção com pelo menos 3 parágrafos densos e específicos. Evite generalidades — cada afirmação deve estar ancorada nos números concretos desta pessoa. Este relatório vale R$150+ e deve justificar esse valor com revelações que a pessoa nunca ouviu sobre si mesma.`}

Siga EXATAMENTE esta estrutura de seções, nesta ordem:

---

## ✨ 1. Perfil Energético — Quem Você É em Essência

${isFreeAnalysis ? `Frame obrigatório: Destino ${cincoNumeros.destino} = A Estrada (imutável — calculado da data de nascimento, não muda com o nome). Expressão ${cincoNumeros.expressao} e Motivação ${cincoNumeros.motivacao} = O Veículo (como ${primeiroNome} caminha hoje — moldado pelo nome atual, pode ser harmonizado). Use essa distinção como espinha dorsal da seção.` : ''}

Escreva uma visão panorâmica e reveladora da energia do nome completo de ${primeiroNome}. Conecte **Expressão ${cincoNumeros.expressao}**, **Destino ${cincoNumeros.destino}** e **Motivação ${cincoNumeros.motivacao}** em uma narrativa coesa de identidade:
- O que a combinação única desses três números revela sobre a trajetória desta alma
- Como esses números criam uma tensão criativa ou harmonia natural entre o que ${primeiroNome} é, o que deseja e para onde vai
- Qual o "tema central" desta encarnação — a grande lição-dom que este conjunto numerológico carrega
- Como esse perfil se manifesta em escolhas de carreira, relacionamentos e modo de estar no mundo

---

## 🔢 2. Os 5 Números — ${isFreeAnalysis ? 'A Vibração do Nome Atual' : 'Anatomia do Nome'}

${isFreeAnalysis
  ? `Identifique o principal CONFLITO entre dois dos números de ${primeiroNome}. Escolha o par mais dissonante entre os 5 números (Expressão ${cincoNumeros.expressao}, Destino ${cincoNumeros.destino}, Motivação ${cincoNumeros.motivacao}, Impressão ${cincoNumeros.impressao}, Missão ${cincoNumeros.missao}). Mencione que o Destino (${cincoNumeros.destino}) vem da data de nascimento — é o contexto imutável, a Estrada. O conflito é entre esse Destino e como o nome atual expressa esse potencial. Escreva 1 parágrafo cirúrgico (máx 120 palavras) explicando a guerra interna que essa dissonância cria — em quais situações concretas ela sabota os resultados, drena energia ou faz ${primeiroNome} se sentir dividido(a) sem entender por quê.`
  : `Para cada um dos 5 números, escreva uma análise aprofundada e específica para ${primeiroNome}. Exigimos no mínimo 3 parágrafos densos (5 a 6 linhas cada) por número:

### 2.1 Expressão ${cincoNumeros.expressao} — O Dom que Veio Manifestar
Talentos naturais, forma de agir e comunicar, o que este número revela sobre como ${primeiroNome} cria impacto no mundo. Explore tanto a polaridade positiva (o dom em pleno florescimento) quanto o padrão de sombra (como esse dom pode virar excesso ou se bloquear). Como este número se manifesta especificamente na carreira e criatividade. Detalhe como a pessoa resolve problemas complexos usando essa Expressão.

### 2.2 Destino ${cincoNumeros.destino} — O Chamado da Alma
O que este número representa como missão de vida. Quais desafios e conquistas este caminho naturalmente oferece. Explique como o Destino funciona como uma "bússola interna" — as situações de vida que esta pessoa inevitavelmente atrairá para crescer. Recheie com exemplos de como esse Destino se ativa em crises e grandes decisões vitais.

### 2.3 Motivação ${cincoNumeros.motivacao} — O Desejo Mais Profundo
O que move ${primeiroNome} por dentro — o desejo da alma que nem sempre é consciente. Como essa motivação secreta influencia escolhas de parceiros, projetos e estilo de vida. Detalhe o que acontece quando esse desejo é reprimido ou silenciado vs quando é honrado plenamente na prática diária.

### 2.4 Impressão ${cincoNumeros.impressao} — Como o Mundo Lhe Vê
Como ${primeiroNome} é percebido pelas outras pessoas antes mesmo de abrir a boca. A "máscara social" que este número cria — sua utilidade como escudo e seus limites para intimidade. Descreva a diferença entre quem ${primeiroNome} é por dentro (Motivação) e como aparece por fora (Impressão), detalhando a quebra de expectativa.

### 2.5 Missão ${cincoNumeros.missao} — A Síntese da Jornada
O que a soma de Destino + Expressão revela como vocação máxima. Este número representa o campo onde ${primeiroNome} deixará seu legado definitivo. Aprofunde em como se manifesta a vida quando esta pessoa está ativamente vivendo sua missão plena contraposta aos dias em que está desviada dela.`
}

---

## 🔺 3. Os 4 Triângulos — Geometria da Alma

Após o título da seção, prossiga diretamente com a análise individual de cada triângulo. ${isFreeAnalysis ? `Para cada um dos 4 triângulos, escreva 2 parágrafos diagnósticos (máx 120 palavras cada). Foque em REVELAR o que o Arcano Regente de cada triângulo indica e quais padrões ele cria na vida de ${primeiroNome} — SEM soluções ou antídotos, apenas o diagnóstico. Não mencione harmonização ou mudança de nome nesta seção.` : `Escreva um parágrafo introdutório de 2 frases sobre os 4 triângulos como estrutura geral, depois para cada triângulo escreva 2 parágrafos reveladores:`}

### Triângulo da Vida (Arcano **${todosTriangulos.vida.arcanoRegente ?? '—'}**)
A vibração base que permeia toda a trajetória de vida. Padrões que se repetem em diferentes fases e contextos. O que o Arcano **${todosTriangulos.vida.arcanoRegente ?? '—'}** revela como tema central dominante desta encarnação.

${isFreeAnalysis
  ? `### Triângulo Pessoal (Arcano **${todosTriangulos.pessoal.arcanoRegente ?? '—'}**)
Como ${primeiroNome} processa as experiências por dentro — as reações internas, os mecanismos de defesa e os padrões afetivos que raramente são visíveis. O que o Arcano **${todosTriangulos.pessoal.arcanoRegente ?? '—'}** revela sobre os ciclos emocionais e a vida íntima desta pessoa.

### Triângulo Social (Arcano **${todosTriangulos.social.arcanoRegente ?? '—'}**)
Como o mundo externo percebe e responde a ${primeiroNome}. Que tipo de relações, oportunidades e obstáculos este triângulo atrai. O que o Arcano **${todosTriangulos.social.arcanoRegente ?? '—'}** diz sobre o magnetismo e o papel social que esta pessoa projeta.

### Triângulo do Destino (Arcano **${todosTriangulos.destino.arcanoRegente ?? '—'}**)
Os resultados que ${primeiroNome} tende a colher — o que a energia deste triângulo produz como frutos ao longo da vida. O Arcano **${todosTriangulos.destino.arcanoRegente ?? '—'}** como revelador dos padrões de missão e dos ciclos de amadurecimento.`
  : `### Triângulo Pessoal (Arcano **${todosTriangulos.pessoal.arcanoRegente ?? '—'}**)
Como ${primeiroNome} se sente por dentro — o mundo emocional, as reações íntimas, o que nunca mostra. Como o Arcano **${todosTriangulos.pessoal.arcanoRegente ?? '—'}** molda a vida afetiva, o autocuidado e a relação com a vulnerabilidade.

### Triângulo Social (Arcano **${todosTriangulos.social.arcanoRegente ?? '—'}**)
Como o mundo percebe e responde a ${primeiroNome}. Que tipo de relações, oportunidades e desafios este triângulo atrai. O que o Arcano **${todosTriangulos.social.arcanoRegente ?? '—'}** diz sobre o papel social que esta pessoa tende a ocupar.

### Triângulo do Destino (Arcano **${todosTriangulos.destino.arcanoRegente ?? '—'}**)
Os resultados que ${primeiroNome} tende a colher — o que a energia deste triângulo produz como frutos ao longo da vida. O Arcano **${todosTriangulos.destino.arcanoRegente ?? '—'}** como revelador da missão e dos ciclos de amadurecimento.`
}

${bloqueios.length > 0
  ? isFreeAnalysis
    ? `**Para cada bloqueio detectado, escreva uma análise aprofundada de 2-3 parágrafos:**
- O impacto específico e concreto deste bloqueio na vida de ${primeiroNome} (em que situações ele aparece, como sabota)
- Em quais áreas da vida (carreira, saúde, relacionamentos, finanças) ele se manifesta com mais força
- O aspecto de saúde associado: a tensão emocional-somática que este padrão pode gerar no corpo (com sensibilidade)

#### ⚠ Custo da Inércia para cada bloqueio:
Para CADA bloqueio, escreva um subitem "**Custo da Inércia:**" descrevendo como esse bloqueio específico continua limitando ${primeiroNome} enquanto o nome não for harmonizado — o que está sendo impactado em termos de resultados financeiros, relacionamentos, saúde ou realização pessoal. Seja concreto e específico, sem dar ações práticas. Termine com: "Esta frequência continua sendo emitida pelo nome 24 horas por dia — apenas a harmonização vibracional do Nome Social pode neutralizá-la."`
    : `**Para cada bloqueio detectado, escreva uma análise aprofundada e explicativa de 2-3 parágrafos:**
- Um texto altamente explicativo e detalhado para que qualquer usuário possa compreender facilmente em quais partes/áreas de sua vida (como carreira, finanças, relacionamentos e realização pessoal) aquele bloqueio interfere no seu dia a dia e como limita seus resultados.
- Adicione, obrigatoriamente, um parágrafo integrado logo abaixo criando uma relação totalmente personalizada do bloqueio com o triângulo específico no qual o bloqueio foi detectado (seja no Triângulo da Vida, Pessoal, Social ou do Destino) — descrevendo como a energia desse setor específico direciona e amplifica as dificuldades daquele bloqueio na vida do usuário.
- O aspecto de saúde associado: a somatização e a tensão emocional-somática que este padrão pode gerar no corpo (com sensibilidade).

**ATENÇÃO CRÍTICA:** Não mencione, não sugira e não inclua QUALQUER referência a "antídoto", ações práticas paliativas ou soluções temporárias para os bloqueios nesta seção, uma vez que este relatório já visa à Harmonização definitiva do Nome Social, sendo esta a única solução real e permanente.`
  : `**Celebre a ausência de bloqueios:** Escreva 2 parágrafos sobre o que significa ter os 4 triângulos limpos. Que tipo de fluidez, resiliência e facilidade isso cria na vida de ${primeiroNome}.`
}

${isFreeAnalysis && bloqueios.length > 0 ? `
---

## 🛡️ Escudo Provisório de 72 Horas

Baseado no bloqueio primário detectado (**${bloqueios[0].titulo}**), escreva um "Escudo Provisório" como se fosse um conselho prático e direto para o usuário (máximo 2 parágrafos).
Significado numerológico deste bloqueio: "${bloqueios[0].descricao}".
Seja específico e detalhado! Baseando-se no significado acima, cite as áreas práticas da vida que estão sendo impactadas.
Em seguida, dê o Antídoto: ações específicas de contenção de danos para as próximas 72 horas baseadas neste bloqueio.
O objetivo é fornecer uma verdadeira orientação terapêutica paliativa de alto valor, baseada na numerologia cabalística, explicando por que essa atitude segura a "perda de energia" temporariamente. Lembre-o de que a solução definitiva exige a Harmonização do Nome.` : ''}
---

## ⚖️ 4. O Peso do Passado — Karma, Lições e Tendências

${debitosCarmicos.length > 0
  ? isFreeAnalysis
    ? `${primeiroNome} carrega ${debitosCarmicos.length} débito(s) kármico(s) especificados nos dados (veja no painel acima). Para CADA débito, escreva uma análise extensa (mínimo de 3 parágrafos densos com 5 a 6 linhas cada):
- Parágrafo 1: O contexto espiritual-histórico deste débito (qual padrão comportamental ou erro de encarnações passadas ele representa).
- Parágrafo 2: Como ele se manifesta especificamente na vida atual (dinâmicas tóxicas em relacionamentos, autossabotagem na carreira, finanças ou saúde) — seja concreto e detalhado sobre as consequências que ${primeiroNome} continua enfrentando.
- Parágrafo 3: O custo de não agir — o que essa energia continua atraindo enquanto o padrão não for trabalhado. Para débitos variáveis (que vêm da Motivação ou Expressão), mencione que a harmonização do Nome Social pode reduzir ou eliminar esse peso. Para débitos fixos (ligados à data de nascimento), aprofunde o convite à consciência e ao trabalho espiritual.`
    : `${primeiroNome} carrega ${debitosCarmicos.length} débito(s) kármico(s) especificados nos dados (veja no painel acima). Para CADA débito, escreva uma análise extensa (mínimo de 3 parágrafos densos com 5 a 6 linhas cada):
- Parágrafo 1: O contexto espiritual-histórico deste débito (qual padrão comportamental ou erro de encarnações passadas ele representa).
- Parágrafo 2: Como ele se manifesta especificamente na vida atual (dinâmicas tóxicas em relacionamentos, autossabotagem na carreira, finanças ou saúde).
- Parágrafo 3: A "lei de compensação" que o universo exige para quitar este débito e 3 ações práticas transformadoras que podem ser iniciadas hoje.`
  : `Ausência de débitos: ${primeiroNome} não possui débitos kármicos. Escreva no mínimo 2 parágrafos longos celebrando essa raridade, o que ela revela sobre a maturidade desta alma e como aproveitar essa "folha em branco" kármica.`
}

${licoesCarmicas.length > 0
  ? isFreeAnalysis
    ? `${primeiroNome} traz ${licoesCarmicas.length} lição(ões) kármica(s) (números essenciais ausentes). Para CADA lição ausente, escreva com muita profundidade (mínimo de 3 parágrafos densos com 5 a 6 linhas cada):
- Parágrafo 1: O "talento cego" por trás dessa lição — o que significa a falta dessa vibração e como a pessoa compensa essa ausência instintivamente.
- Parágrafo 2: Como essa ausência cria dificuldades crônicas no dia a dia (timidez exagerada, sobrecarga, dificuldade de cobrar, ciclos que se repetem) — seja específico e detalhado.
- Parágrafo 3: A verdade sobre essa ausência — ela está codificada no nome atual. O Nome Social Harmonizado pode introduzir essa vibração faltante no campo energético de ${primeiroNome}, reequilibrando o que o nome de nascimento deixou descoberto. Sem a harmonização, esse padrão continuará se repetindo independentemente do esforço consciente.`
    : `${primeiroNome} traz ${licoesCarmicas.length} lição(ões) kármica(s) (números essenciais ausentes). Para CADA lição ausente, escreva com muita profundidade (mínimo de 3 parágrafos densos com 5 a 6 linhas cada):
- Parágrafo 1: O "talento cego" por trás dessa lição — o que significa a falta dessa vibração e como a pessoa compensa essa ausência instintivamente.
- Parágrafo 2: Como isso cria dor ou dificuldade crônica no dia a dia (timidez exagerada, sobrecarga, dificuldade de cobrar, etc.).
- Parágrafo 3: O "caminho de integração": 3 hábitos específicos para equilibrar esta ausência.`
  : `Ausência de lições kármicas — todos os números básicos estão presentes. Escreva no mínimo 2 parágrafos longos explorando as vantagens gigantescas de ter uma base psicológica e energética completamente preenchida e resiliente.`
}

${tendenciasOcultas.length > 0
  ? isFreeAnalysis
    ? `Tendências ocultas presentes (números em excesso). Para CADA tendência, explique (mínimo de 3 parágrafos longos com 5 a 6 linhas cada):
- Parágrafo 1: O "superpoder excessivo": como o acúmulo dessa vibração gera um talento fantástico que frequentemente engole as outras qualidades da pessoa.
- Parágrafo 2: A fronteira do exagero: em que situações esse superpoder vira teimosia, exaustão ou obsessão, e como essa frequência em excesso cria ciclos repetitivos que se retroalimentam.
- Parágrafo 3: A armadilha da inércia — esse desequilíbrio está inscrito na estrutura do nome atual. Esforço consciente pode amenizar os efeitos, mas não muda a frequência emitida. Apenas a redistribuição vibracional promovida pelo Nome Social Harmonizado pode reequilibrar essa tendência na raiz.`
    : `Tendências ocultas presentes (números em excesso). Para CADA tendência, explique (mínimo de 3 parágrafos longos com 5 a 6 linhas cada):
- Parágrafo 1: O "superpoder excessivo": como o acúmulo dessa vibração gera um talento fantástico que frequentemente engole as outras qualidades da pessoa.
- Parágrafo 2: A fronteira do exagero: em que situações esse superpoder vira teimosia, exaustão ou obsessão, e repetição de ciclos.
- Parágrafo 3: A "arte do equilíbrio": como domar esse instinto brilhante para que atue a favor de ${primeiroNome} e não contra.`
  : ''
}

---

## 🌙 5. O Arcano Regente — O Mestre Deste Ciclo

O **Arcano ${arcanoRegente ?? '—'}** governa o triângulo central de ${primeiroNome}. OBRIGATÓRIO desenvolver no mínimo de 3 a 4 parágrafos robustos (pelo menos 5 a 6 linhas cada):
- Parágrafo 1: O esqueleto mitológico e o peso arquetípico deste arcano específico na vida de ${primeiroNome}. O arquétipo profundo que ele representa e sua lição universal.
- Parágrafo 2: A luz e sombra imediata: quais portas esse mestre abre misteriosamente e quais armadilhas mentais ele constantemente testa nas fases da vida.
- Parágrafo 3: O apelo magnético do arcano para o momento atual: como essa influência atrai pessoas e cenários compatíveis com essa frequência AGORA.
- Parágrafo 4: A estratégia de maestria: qual comportamento exato o universo recompensa sob a égide desse arcano regente (o convite concreto do que desenvolver ou liberar).
${todosTriangulos.vida.arcanoAtual?.numero ? `- Parágrafo 5 (O Trânsito Atual): O **Arcano de Trânsito Atual** para a idade da pessoa é o **Arcano ${todosTriangulos.vida.arcanoAtual.numero}**. Cruze esse momento de vida (que dura até o ano de encerramento do ciclo) com o regente principal, oferecendo um insight preditivo de curto prazo.` : ''}

---

${(!isFreeAnalysis && arquetipo) ? `## 🎭 6. O Arquétipo — A Identidade Mítica

O número de **Expressão ${cincoNumeros.expressao}** revela que ${primeiroNome} carrega o arquétipo do(a) **${arquetipo.nome}**.

Essência: *"${arquetipo.essencia}"*
Manifestações positivas: ${arquetipo.expressaoPositiva.join(' | ')}
Sombra a integrar: ${arquetipo.expressaoSombra.join(' | ')}
Figuras míticas de referência: ${arquetipo.figurasMiticas.join(', ')}

ATENÇÃO OBRIGATÓRIA: Descreva este arquétipo com no mínimo 4 parágrafos profundos, filosóficos e ancorados no cotidiano, com 5 a 6 linhas cada parágrafo:
- Parágrafo 1: Apresente o arquétipo do(a) **${arquetipo.nome}** como o "avatar principal" que ${primeiroNome} usa para navegar na terra. O que isso significa na visão macro da vida?
- Parágrafo 2: Como a essência profunda deste arquétipo interage organicamente com os bloqueios, dívidas e padrões numéricos apontados ao longo deste relatório.
- Parágrafo 3: A disfunção do arquétipo (sua sombra): como o(a) ${arquetipo.nome} perde poder e sabota a própria grandeza (usar as manifestações sombrias apontadas acima).
- Parágrafo 4: O resgate do poder: o que ${primeiroNome} precisa fazer na vida prática, na profissão e no amor para viver a oitava superior e mais vitoriosa deste arquétipo mítico.

---

` : ''}## 🔮 ${isFreeAnalysis ? '6' : (arquetipo ? '7' : '6')}. O Nome como Ferramenta de Poder Energético

${isFreeAnalysis
  ? `O nome de ${primeiroNome} não é apenas uma identidade social — é um campo de frequência ativo que opera 24 horas por dia, 7 dias por semana. Escreva 3 parágrafos sobre:
- Como a vibração atual do nome de nascimento organiza padrões específicos de atração (e repulsão) de forma contínua, mesmo quando ${primeiroNome} está dormindo, silencioso ou sozinho
- Por que mudanças de comportamento, afirmações positivas e trabalho pessoal não conseguem neutralizar uma frequência que está sendo emitida pelo nome a cada momento — o campo vibracional do nome opera num nível mais profundo que a consciência
- Analogia do hardware e software: o nascimento define o hardware (Destino ${cincoNumeros.destino}) — isso não muda. O nome é o sistema operacional (SO): é possível fazer um upgrade do SO sem trocar o hardware. A harmonização não corrige quem ${primeiroNome} é — ela atualiza como ${primeiroNome} opera e se expressa no mundo, instalando as frequências que o Destino precisa para funcionar em máximo potencial. Não é uma correção do nome de nascimento: é um upgrade vibracional.`
  : isCurrentNameAnalysis
  ? `A vibração que o seu nome de batismo produz não é apenas simbólica — ela organiza padrões concretos de atração e resposta do ambiente. Escreva 3 parágrafos sobre:
- O que essa vibração-base cria naturalmente quando ${primeiroNome} passa a usá-la com intenção consciente
- Quais padrões de relacionamento, oportunidade ou autossabotagem tendem a ressoar com essa frequência de nascença
- Como assumir plenamente o próprio nome atual pode transmutar as dificuldades reveladas e iniciar um novo ciclo de magnetismo pessoal`
  : `A mudança vibracional que o nome magnetizado produz não é apenas simbólica — ela reorganiza padrões concretos de atração e resposta do ambiente. Escreva 3 parágrafos sobre:
- O que muda na vibração-base quando ${primeiroNome} começa a usar o novo nome conscientemente
- Quais padrões de relacionamento, oportunidade ou autossabotagem tendem a se reorganizar com a mudança de frequência
- O período de adaptação vibracional: como funcionam os primeiros 90 dias de uso consciente do nome magnetizado, e o que observar como sinal de integração`
}

${!isFreeAnalysis ? `---

## ✍️ ${arquetipo ? '8' : '7'}. Manual de Assinatura Fluída

Com base nos números de ${primeiroNome}, escreva orientações práticas de grafoscopia para a assinatura de seu nome:

- **Inclinação:** A inclinação ideal da escrita e o que ela projeta energeticamente para este perfil
- **Traços e Letras:** Quais letras devem ser escritas de forma aberta/fluida — e especificamente quais traços devem ser evitados (traços que cruzam, cortam ou fecham o movimento)
- **Ritmo e Pressão:** Como a pressão da caneta e o ritmo da escrita influenciam a vibração — leve vs marcado para este número
- **Iniciais e Maiúsculas:** Como trabalhar as letras iniciais para maximizar a projeção energética deste perfil
${isCurrentNameAnalysis ? '- **Prática Diária:** Como escrever o próprio nome pode se tornar um ritual de presença e ancoramento' : '- **Prática Recomendada:** Um protocolo de ativação — quantas vezes por dia, em quais contextos, e como criar o hábito de usar o nome'}

` : ''}---

## 🌟 ${isFreeAnalysis ? '7' : (arquetipo ? '9' : '8')}. Síntese e Mensagem Final

${isFreeAnalysis
  ? `Escreva uma síntese final no estilo de laudo médico — 2 parágrafos curtos (máx 120 palavras cada):
- Parágrafo 1: Comece com "O diagnóstico confirma [N] padrões ativos no nome de ${primeiroNome}:" e liste concretamente os bloqueios, débitos e lições detectados. Afirme que esses padrões operam 24 horas por dia, independente de esforço, terapia ou força de vontade.
- Parágrafo 2: Afirme que a única variável não tratada é a origem — o nome. Comportamento e intenção não alteram o campo vibracional emitido pelo nome a cada momento. Encerre com uma única pergunta retórica direta: quanto custa mais um ano com essa frequência operando em silêncio? NÃO mencione "vida equilibrada", "harmoniosa" ou "plena". NÃO ofereça conforto. O diagnóstico está feito — aponte a harmonização como a única solução objetiva.`
  : `Escreva uma conclusão profunda e poderosa (4 parágrafos) que:
- Conecte todos os elementos — números, bloqueios, karma, arcano e arquétipo — em uma narrativa de propósito único para ${primeiroNome}
- Fale em segunda pessoa direta: "você", "sua jornada", "sua missão"
- Nomeie o presente que este trabalho numerológico representa e o que se abre com a nova vibração
- Encerre com uma mensagem transformadora, esperançosa e de alta frequência sobre o que está por vir`
}

---

REGRAS ESTRITAS DE FORMATAÇÃO:
1. Use estruturação Markdown rigorosa com Hash Headers (##, ###, ####).
2. NUNCA use títulos apenas com letras maiúsculas. SEMPRE use Hash Headers com emoticon.
3. **Negrito:** Utilize negrito (**) de forma natural e estratégica para destacar ideias principais, palavras-chave e pontos de atenção importantes no texto. Evite colocar trechos inteiros ou frases longas em negrito.
4. SEMPRE duplo espaçamento entre parágrafos — texto arejado e escaneável.
5. Parágrafos com no máximo 4 linhas.
6. Escreva em segunda pessoa de forma natural e direta.
7. ${primeiroNome} pode aparecer no máximo 1 vez por seção ##.
8. Escreva com profundidade real, especificidade e poder transformador — cada parágrafo deve revelar algo que esta pessoa nunca viu assim sobre si mesma.`;
}
