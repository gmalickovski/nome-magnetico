import type { AnaliseNomeEmpresa, ResultadoNomeEmpresa } from '../../numerology/products/nome-empresa';
import type { Arquetipo } from '../../numerology/archetypes';

export interface CompanyPromptParams {
  resultado: ResultadoNomeEmpresa;
  ramoAtividade?: string;
  descricaoNegocio?: string;
  arquetipo?: Arquetipo;
}

export function buildCompanyAnalysisPrompt(params: CompanyPromptParams): string {
  const { resultado, ramoAtividade, descricaoNegocio, arquetipo } = params;
  const {
    nomeSocioPrincipal,
    dataNascimentoSocio,
    dataFundacao,
    destinoSocio,
    destinoEmpresa,
    nomesCandidatos,
    melhorNome,
    nomeSocio2,
    destinoSocio2,
  } = resultado;

  const primeirNomeSocio = nomeSocioPrincipal.split(' ')[0] ?? nomeSocioPrincipal;
  const temSocio2 = !!(nomeSocio2 && destinoSocio2 !== undefined);
  const temDebitos = (melhorNome?.debitosCarmicos?.length ?? 0) > 0;
  const temLicoes = (melhorNome?.licoesCarmicas?.length ?? 0) > 0;

  const candidatosTexto = nomesCandidatos
    .slice(0, 8)
    .map((a, i) => {
      const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const origem = a.origemSugerida === 'ia' ? ' ✨ Sugestão Numerológica' : '';
      const bloqueioInfo = a.temBloqueio
        ? `⚠ ${a.bloqueios.length} bloqueio(s): ${a.bloqueios.map(b => b.codigo).join(', ')}`
        : '✓ Sem bloqueios';
      const compatEmpresaInfo = a.compatibilidadeEmpresa
        ? ` | Compat. empresa: ${a.compatibilidadeEmpresa}`
        : '';
      const debitoInfo = a.debitosCarmicos.length === 0
        ? '✓ Sem Débitos Kármicos'
        : `⚠ Débitos Kármicos: ${a.debitosCarmicos.map(d => d.numero).join(', ')}`;
      const disp = (a as any).disponibilidade;
      const dispTexto = disp
        ? [
            disp.dominioCom === true ? '✓ .com livre' : disp.dominioCom === false ? '✗ .com ocupado' : '',
            disp.dominioBr === true ? '✓ .com.br livre' : disp.dominioBr === false ? '✗ .com.br ocupado' : '',
            disp.instagram === true ? '✓ @Instagram livre' : disp.instagram === false ? '✗ @Instagram ocupado' : '',
          ].filter(Boolean).join(' | ')
        : '';
      return `${rank} **${a.nomeEmpresa}**${origem} | Expressão: ${a.expressao} | Motivação: ${a.motivacao} | Missão: ${a.missao} | Impressão: ${a.impressao} | Compat. sócio: ${a.compatibilidadeSocio}${compatEmpresaInfo} | Score: ${a.score}/100
   ${bloqueioInfo} | ${debitoInfo}${dispTexto ? `\n   Digital: ${dispTexto}` : ''}
   ${a.justificativa.slice(0, 2).join(' | ')}`;
    })
    .join('\n\n');

  const melhorTexto = melhorNome
    ? `**${melhorNome.nomeEmpresa}** | Score: ${melhorNome.score}/100 | Expressão: ${melhorNome.expressao} | Motivação: ${melhorNome.motivacao} | Missão: ${melhorNome.missao} | Impressão: ${melhorNome.impressao} | Compat. sócio: ${melhorNome.compatibilidadeSocio}${melhorNome.compatibilidadeEmpresa ? ` | Compat. empresa: ${melhorNome.compatibilidadeEmpresa}` : ''}`
    : 'Nenhum candidato fornecido';

  const temDataFundacao = !!dataFundacao && destinoEmpresa !== null;

  return `## Contexto da Empresa

**Sócio principal:** ${nomeSocioPrincipal}
**Data de nascimento do sócio:** ${dataNascimentoSocio}
**Destino do Sócio:** ${destinoSocio}
${temSocio2 ? `**2º Sócio:** ${nomeSocio2}\n**Destino do 2º Sócio:** ${destinoSocio2}` : ''}
${dataFundacao ? `**Data de fundação prevista:** ${dataFundacao}` : ''}
${destinoEmpresa !== null ? `**Destino da Empresa (data de fundação):** ${destinoEmpresa}` : ''}
${ramoAtividade ? `**Ramo de atividade:** ${ramoAtividade}` : ''}
${descricaoNegocio ? `**Descrição do negócio:** ${descricaoNegocio}` : ''}

## Nome Mais Indicado Numericamente

${melhorTexto}

## Ranking Numerológico dos Candidatos

${candidatosTexto}

---

## Sua Tarefa

Você é um numerólogo cabalístico especializado em nomes empresariais, branding energético e identidade visual. Com base nos dados acima, elabore um relatório estratégico, profundo e acionável para o empreendedor. Este é um relatório premium (nunca cite preço ou valor no texto) e deve ser uma consultoria de alto valor — cada seção deve trazer revelações e orientações que um consultor de branding comum não poderia oferecer.

Escreva pelo menos 2–3 parágrafos por seção. Evite generalidades — cada insight deve estar ancorado nos números específicos deste negócio e deste empreendedor.

**Disponibilidade Digital:** Quando dois nomes tiverem scores numerológicos próximos (diferença ≤ 10 pontos), priorize o que tiver domínio .com e/ou .com.br livre. Mencione explicitamente no relatório quais nomes possuem domínio e perfil no Instagram disponíveis — isso é um diferencial estratégico concreto para o empreendedor agir imediatamente.

Siga EXATAMENTE esta estrutura:

---

## 🧲 1. O Magnetismo do Negócio

Escreva 3 parágrafos reveladores sobre a força magnética que este nome empresarial projeta:
- Como a **Expressão ${melhorNome?.expressao ?? '—'}** ressoa no mercado${ramoAtividade ? ` de ${ramoAtividade}` : ''} — que tipo de energia este número emite quando pronunciado e escrito, e como isso afeta a percepção inconsciente de clientes e parceiros
- Que tipo de cliente, oportunidade, parceria e mídia espontânea este nome naturalmente magnetiza — baseado na vibração do número de Expressão e Motivação
- O "campo energético" que este nome cria ao ser dito repetidamente — como a vibração sonora e escrita de **${melhorNome?.nomeEmpresa ?? 'o nome'}** funciona além do branding convencional, agindo no nível subconsciente do mercado

---

${arquetipo ? `## 🎭 1b. Arquétipo da Marca — A Personalidade Profunda do Negócio

A **Expressão ${melhorNome?.expressao ?? '—'}** do nome **${melhorNome?.nomeEmpresa ?? 'da empresa'}** revela o arquétipo do(a) **${arquetipo.nome}**.

Essência: *"${arquetipo.essencia}"*
Manifestações da marca: ${arquetipo.expressaoPositiva.join(' | ')}
Risco de sombra: ${arquetipo.expressaoSombra.join(' | ')}
Marcas de referência com esse arquétipo: ${arquetipo.marcasReferencia.join(', ')}
Posicionamento natural: ${arquetipo.posicionamento}

Escreva 4 parágrafos estratégicos que:
- Apresentem o(a) **${arquetipo.nome}** como a persona profunda da marca — a identidade que o mercado vai sentir antes de entender racionalmente
- Comparem com as marcas de referência (${arquetipo.marcasReferencia.join(', ')}) — o que essas marcas têm em comum e como **${melhorNome?.nomeEmpresa ?? 'esta empresa'}** pode se posicionar no mesmo território de forma autêntica
- Orientem sobre TOM DE VOZ: como a empresa deve se comunicar em anúncios, redes sociais, propostas e atendimento para ser autêntica ao arquétipo
- Apontem os RISCOS de desvio: o que acontece quando as decisões ou comunicações saem do arquétipo (a sombra — ${arquetipo.sombra}) e como corrigir o curso

---

` : ''}## 🔗 2. Sinergia Sócio-Empresa

Escreva 3-4 parágrafos analisando a relação poderosa entre o empreendedor e o nome escolhido:

### O Perfil Empreendedor de ${primeirNomeSocio}
O **Destino ${destinoSocio}** revela os pontos fortes naturais de ${primeirNomeSocio} nos negócios, as áreas onde ele/ela é naturalmente excepcional, e os pontos de atenção — onde tende a cometer erros sistemáticos sem perceber. Explique com profundidade como esse Destino molda o estilo de liderança, tomada de decisão e gestão de equipes.

${temSocio2 ? `### O Perfil do 2º Sócio e a Dinâmica Societária
O **Destino ${destinoSocio2}** do 2º sócio (${nomeSocio2}) traz uma vibração que ou amplifica ou tensiona a do sócio principal. Analise: eles são sócios naturalmente complementares ou precisarão trabalhar conscientemente as diferenças? Que decisões societárias a numerologia indica que podem gerar conflito e como preveni-los.` : ''}

${temDataFundacao ? `### A Harmonia Sócio-Empresa
Como o **Destino da Empresa (${destinoEmpresa})** dialoga com o Destino do sócio (${destinoSocio})${temSocio2 ? ` e do 2º sócio (${destinoSocio2})` : ''}? Essa é uma combinação de potencialização ou de tensão criativa? Explique as implicações práticas para o cotidiano da gestão, relacionamento entre sócios e cultura organizacional.` : ''}

### Por que **${melhorNome?.nomeEmpresa ?? 'o nome recomendado'}** é o Nome Ideal
Conecte de forma técnica e inspiradora: como a **Expressão ${melhorNome?.expressao ?? '—'}** do nome e o **Destino ${destinoSocio}** de ${primeirNomeSocio} criam sinergia ou tensão produtiva. Como a compatibilidade (${melhorNome?.compatibilidadeSocio ?? '—'}) se traduz em resultados concretos de mercado, facilidade de comunicação e reconhecimento de marca.

---

${(temDebitos || temLicoes) ? `## 🔮 2b. Karma Empresarial — Padrões que o Empreendedor Precisa Ver

Os padrões kármicos do fundador se instalam inevitavelmente na cultura e nos ciclos financeiros do negócio. Para ${primeirNomeSocio}, escreva 3 parágrafos sobre:

${temDebitos ? `**Débitos Kármicos (números ${melhorNome!.debitosCarmicos.map(d => d.numero).join(', ')}):**
- Como esses padrões tendem a se manifestar como ciclos repetitivos no negócio: inadimplência, conflitos societários, dificuldade de delegação, ciclos de expansão e retração
- O "antídoto empresarial": que práticas de gestão, mentorias ou mudanças de cultura podem neutralizar esses débitos no contexto do negócio
- Como o nome escolhido ativa, desafia ou neutraliza esses padrões kármicos do fundador` : ''}

${temLicoes ? `**Lições Kármicas (competências a desenvolver — números ${melhorNome!.licoesCarmicas.map(l => l.numero).join(', ')}):**
- Que habilidades de gestão, liderança ou visão estratégica esses números indicam como lacunas a desenvolver conscientemente
- Como o nome da empresa ativa essas qualidades ausentes — tornando o próprio negócio um veículo de desenvolvimento do empreendedor` : ''}

---

` : ''}## 💎 3. A Impressão da Marca no Mercado

Como o mercado percebe esta empresa antes mesmo de conhecer seus produtos. Escreva 3 parágrafos sobre:
- **Impressão ${melhorNome?.impressao ?? '—'}** (primeira palavra/consoantes do nome): que julgamento instantâneo este número projeta — confiável, inovadora, premium, acessível, técnica, calorosa? Seja específico sobre o que acontece no cérebro de um cliente ou parceiro nos primeiros 7 segundos de contato com este nome
- Que posicionamento de mercado este número naturalmente ocupa e por que tentar ir contra essa vibração gera ruído e alto custo de marketing
- Que valores a empresa precisa comunicar consistentemente para que a identidade percebida se alinhe com a vibração numérica — e o que acontece quando há dissonância

---

## 💰 4. Análise de Fluxo Financeiro

Foco nas tendências financeiras reveladas pelos números desta empresa. Escreva 3 parágrafos sobre:
${melhorNome?.expressao === 8 || melhorNome?.motivacao === 8
  ? `- **Atenção ao 8:** Este nome carrega intensa vibração do 8 — o número do poder e do dinheiro. Isso é sinal de potencial financeiro elevado, MAS o 8 não perdoa desvios de integridade. Explique o risco e o protocolo de governança que esse número exige`
  : `- Como a **Expressão ${melhorNome?.expressao ?? '—'}** influencia o fluxo e a relação emocional com o dinheiro dentro deste negócio`
}
- Padrões financeiros que este nome tende a atrair: fluxo constante vs. grandes ciclos, clientes que pagam bem vs. os que atrasam — e como a vibração molda isso
- Os riscos financeiros específicos que os números indicam, com protocolos preventivos concretos para cada um — não apenas como evitar, mas como construir processos que respeitem essa vibração

---

## ⚠️ 5. Mapeamento de Riscos Energéticos

${melhorNome && melhorNome.temBloqueio
  ? `Este nome apresenta bloqueios que merecem gestão consciente. Para cada bloqueio detectado, escreva 2 parágrafos:
- Como ele pode se manifestar no cotidiano do negócio (operacional, jurídico, relacional, financeiro) com exemplos concretos
- O "Antídoto Empresarial": 3 ações de gestão práticas que o empreendedor pode implementar nos próximos 60 dias para neutralizar o risco`
  : `O nome escolhido não apresenta bloqueios energéticos críticos. Escreva 2 parágrafos sobre o que isso significa para a resiliência e continuidade do negócio — que obstáculos comuns em outros nomes esta empresa naturalmente não enfrentará.`
}

Analise especificamente os bloqueios de maior risco empresarial quando presentes:
- **Bloqueio 444 (Estruturação):** Impacto em processos, contratos, burocracia e reconhecimento profissional
- **Bloqueio 777 (Espiritual):** Impacto em isolamento de mercado, dificuldade de comunicação e falta de praticidade
- **Bloqueio 999 (Compaixão):** Impacto em ciclos que não fecham, dificuldade de cobrança e encerramento de projetos

---

## 🎨 6. Identidade Visual Magnética

Com base na **Expressão ${melhorNome?.expressao ?? '—'}**, escreva 3 parágrafos de consultoria de branding premium:
- **Paleta de Cores Numerológica:** As 2–3 cores primárias que vibram com a **Expressão ${melhorNome?.expressao ?? '—'}**, o que cada cor projeta psicologicamente e como construir uma paleta harmônica — com referências de tons específicos (ex: azul-marinho, dourado fosco, verde-esmeralda)
- **Geometrias e Formas:** Que formas geométricas ressoam com a energia deste número (círculos = 2, 6; triângulos = 3, 9; hexágonos = 6, 8; etc.) e como aplicar isso no logotipo, ícones e linguagem visual
- **Tipografia e Elementos a Evitar:** Que estilo de fonte comunica autenticamente esta vibração — e o que visualmente cria dissonância com a energia numérica desta empresa

---

## 📅 7. Calendário de Ativação e Ciclos de Oportunidade

Com base no **Destino de ${primeirNomeSocio} (${destinoSocio})**${temDataFundacao ? ` e no Destino da empresa (${destinoEmpresa})` : ''}, escreva 3 parágrafos estratégicos:
- **Os Meses de Força:** Os 3–4 meses do ano com maior sinergia energética para lançamentos, negociações importantes e decisões estratégicas — com justificativa numerológica de cada um
- **Os Meses de Revisão:** Os meses em que o empreendedor deve evitar grandes movimentos externos e focar em consolidação interna, planejamento e operações
- **Data de Lançamento/Abertura:** Se ainda não definida, qual o número de dia mais harmonioso para a abertura formal — e o ritual de ativação simbólico para "ligar" a energia do nome no primeiro dia de operação

---

## 🎯 8. Estratégia e Direcionamento de Mercado

Com base na numerologia, qual posicionamento esta empresa deve adotar para maximizar seu campo magnético. Escreva 3-4 parágrafos estratégicos:
- O tipo de produto ou serviço que este nome atrai com mais facilidade e menor custo de aquisição — e por quê numerologicamente isso faz sentido
- O perfil ideal de cliente para esta empresa (pela vibração da alma, não apenas por demografia) e como comunicar para atrair exatamente esse perfil
- Os diferenciais competitivos que o número de **Expressão ${melhorNome?.expressao ?? '—'}** naturalmente projeta — o que torna esta empresa única pelo prisma vibracional
- Como escalar o negócio respeitando os ciclos de força e revisão — a diferença entre "forçar" e "fluir" no crescimento alinhado à vibração

---

## 🏁 9. Os Próximos 90 Dias — Plano de Ativação

Orientações práticas e acionáveis para ativar a energia deste nome. Escreva 3 parágrafos de consultoria direta:
- O que fazer ANTES do lançamento oficial para preparar o campo energético (prática simbólica de ativação, primeiras comunicações estratégicas, configuração visual mínima)
- Como comunicar o nome nos primeiros 30 dias — oralmente em reuniões, por escrito em propostas, nas redes sociais — para maximizar o impacto do lançamento da vibração
- Registro legal e proteção de marca no momento certo, e como a equipe deve ser treinada para apresentar e usar o nome com consistência e intenção

---

REGRAS ESTRITAS DE FORMATAÇÃO:
1. Use estruturação Markdown rigorosa com Hash Headers (##, ###).
2. NUNCA use títulos apenas com letras maiúsculas. SEMPRE use Hash Headers com emoticon.
3. **Negrito:** Utilize negrito (**) de forma natural e estratégica para destacar ideias principais, palavras-chave e pontos de atenção importantes no texto. Evite colocar trechos inteiros ou frases longas em negrito.
4. SEMPRE duplo espaçamento entre parágrafos — texto arejado e escaneável.
5. Parágrafos com no máximo 4 linhas.
6. Escreva com autoridade, clareza e entusiasmo empreendedor — este é um momento decisivo para o negócio.
7. Seja específico e acionável — evite conselhos genéricos que qualquer empresa poderia seguir.`;

}
