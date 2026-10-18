import type { AnaliseNomeSocial, ResultadoNomeSocial } from '../../numerology/products/nome-social';
import type { Arquetipo } from '../../numerology/archetypes';

export interface SocialPromptParams {
  resultado: ResultadoNomeSocial;
  nomeNascimento: string;
  objetivoApresentacao?: string;
  vibracoesDesejadas?: string;
  contextoUso?: string;
  estiloPreferido?: string;
  genero?: string;
  assinaturaAtual?: string;
  ondeVaiUsar?: string[];
  aceitaEncurtarApelido?: boolean;
  arquetipo?: Arquetipo;
  arcanoAtual?: { numero: number | null, periodo: string, idadeInicio: number, idadeFim: number };
  comparacaoHarmonizacao?: {
    expressaoNasc: number; expressaoSocial: number;
    motivacaoNasc: number; motivacaoSocial: number;
    impressaoNasc: number; impressaoSocial: number;
    missaoNasc: number;    missaoSocial: number;
    bloqueiosAntes: number; bloqueiosDepois: number;
    bloqueiosEliminados: string[];
    licoesAntes: number; licoesDepois: number;
    licoesEliminadas: number[]; licoesNovas: number[];
    tendenciasAntes: number; tendenciasDepois: number;
    tendenciasNeutralizadas: number[]; tendenciasNovas: number[];
    debitosAntes: number; debitosDepois: number;
    debitosAliviados: number[]; debitosFixos: number[];
  };
}

export function buildSocialAnalysisPrompt(params: SocialPromptParams): string {
  const {
    resultado,
    nomeNascimento,
    objetivoApresentacao,
    vibracoesDesejadas,
    contextoUso,
    estiloPreferido,
    genero,
    assinaturaAtual,
    ondeVaiUsar,
    aceitaEncurtarApelido,
    arquetipo,
    arcanoAtual,
    comparacaoHarmonizacao: comp,
  } = params;

  const { dataNascimento, destino, nomesCandidatos, melhorNome, top3 } = resultado;

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
      const origemLabel = a.origemSugerida === 'ia' ? ' [Sugestão Numerológica]' : '';
      return `${rank} **${a.nomeCompleto}**${origemLabel} | Expressão: ${a.expressao} | Motivação: ${a.motivacao} | Missão: ${a.missao} | Impressão: ${a.impressao} | Compatibilidade: ${a.compatibilidade} | Score: ${a.score}/100
   ${bloqueioInfo} | ${debitoInfo}
   Lições kármicas: ${a.licoesCarmicas.length} | ${a.justificativa.slice(0, 2).join(' | ')}`;
    })
    .join('\n\n');

  const melhorTexto = melhorNome
    ? `**${melhorNome.nomeCompleto}** | Score: ${melhorNome.score}/100 | Expressão: ${melhorNome.expressao} | Motivação: ${melhorNome.motivacao} | Missão: ${melhorNome.missao} | Impressão: ${melhorNome.impressao} | Compatibilidade: ${melhorNome.compatibilidade}`
    : 'Nenhum candidato com score válido encontrado';

  const top3Texto = top3.length > 0
    ? top3.map((a, i) => `${i + 2}. **${a.nomeCompleto}** | Score: ${a.score}/100 | Expressão: ${a.expressao} | Compatibilidade: ${a.compatibilidade}`).join('\n')
    : 'Sem alternativas adicionais';

  return `## Contexto do Usuário

**Nome de Nascimento (âncora numerológica):** ${nomeNascimento}
**Data de Nascimento:** ${dataNascimento}
**Número de Destino (imutável):** ${destino}
${assinaturaAtual ? `**Assinatura Atual (linha de base informada):** ${assinaturaAtual}` : ''}
${genero ? `**Gênero:** ${genero}` : ''}
${objetivoApresentacao ? `**Intenção e contexto de apresentação:** ${objetivoApresentacao}` : ''}
${vibracoesDesejadas ? `**Vibrações/características que deseja atrair:** ${vibracoesDesejadas}` : ''}
${ondeVaiUsar && ondeVaiUsar.length > 0 ? `**Onde vai usar o novo nome:** ${ondeVaiUsar.join(', ')}` : contextoUso ? `**Contexto principal de uso do nome:** ${contextoUso}` : ''}
${aceitaEncurtarApelido !== undefined ? `**Aceita encurtar ou usar apelido:** ${aceitaEncurtarApelido ? 'Sim' : 'Não'}` : ''}
${estiloPreferido ? `**Estilo preferido:** ${estiloPreferido}` : ''}
${arcanoAtual?.numero ? `**Arcano de Trânsito Atual (Momento de Vida):** Arcano ${arcanoAtual.numero} (período de ${arcanoAtual.periodo})` : ''}

## Nome Mais Indicado Numericamente

${melhorTexto}

## Top 3 Alternativas

${top3Texto}

## Ranking Numerológico dos Candidatos

${candidatosTexto}

---

## Sua Tarefa

Você é um numerólogo cabalístico especializado em identidade vibracional e Nome Social. Com base nos dados acima, elabore um relatório completo, profundo e personalizado para esta pessoa. Este relatório vale R$150+ e cada seção deve conter revelações específicas e acionáveis que ela não encontrará em nenhum outro lugar.

Escreva pelo menos 2–3 parágrafos por seção principal. Evite generalidades — cada afirmação deve ser ancorada nos números concretos desta pessoa.

${arcanoAtual?.numero ? `DICA PARA A IA: Ao formular o texto, cruze o Arcano de Trânsito Atual com o Nome Social sugerido. Use o momento cronológico como argumento de urgência e ancoragem. Exemplo de abordagem: "Como você está sob a influência do Arcano ${arcanoAtual.numero} até o ano x, o uso da vibração de [Nome] trará a estrutura exata necessária para suportar e aproveitar essa fase..."` : ''}

${comp ? `## Dados Comparativos da Harmonização (use para as introduções)

5 NÚMEROS FUNDAMENTAIS (Destino ${destino} é imutável):
- Expressão: ${comp.expressaoNasc} → ${comp.expressaoSocial}${comp.expressaoNasc !== comp.expressaoSocial ? ' (ALTERADO)' : ' (sem alteração)'}
- Motivação: ${comp.motivacaoNasc} → ${comp.motivacaoSocial}${comp.motivacaoNasc !== comp.motivacaoSocial ? ' (ALTERADO)' : ' (sem alteração)'}
- Impressão: ${comp.impressaoNasc} → ${comp.impressaoSocial}${comp.impressaoNasc !== comp.impressaoSocial ? ' (ALTERADO)' : ' (sem alteração)'}
- Missão: ${comp.missaoNasc} → ${comp.missaoSocial}${comp.missaoNasc !== comp.missaoSocial ? ' (ALTERADO)' : ' (sem alteração)'}

BLOQUEIOS: ${comp.bloqueiosAntes} → ${comp.bloqueiosDepois} (ideal = menos) | Eliminados: [${comp.bloqueiosEliminados.join(', ') || 'nenhum'}]
LIÇÕES KÁRMICAS: ${comp.licoesAntes} → ${comp.licoesDepois} (ideal = menos) | Superadas: [${comp.licoesEliminadas.join(', ') || 'nenhuma'}] | Novas: [${comp.licoesNovas.join(', ') || 'nenhuma'}]
TENDÊNCIAS OCULTAS: ${comp.tendenciasAntes} → ${comp.tendenciasDepois} (ideal = menos) | Neutralizadas: [${comp.tendenciasNeutralizadas.join(', ') || 'nenhuma'}] | Novas: [${comp.tendenciasNovas.join(', ') || 'nenhuma'}]
DÉBITOS KÁRMICOS: ${comp.debitosAntes} → ${comp.debitosDepois} (ideal = menos) | Aliviados: [${comp.debitosAliviados.join(', ') || 'nenhum'}] | Fixos (imutáveis): [${comp.debitosFixos.join(', ') || 'nenhum'}]

---

**TEXTO DE ABERTURA OBRIGATÓRIO — escreva EXATAMENTE ANTES das seções ##:**

Escreva 6 parágrafos curtos (2–3 frases cada, SEM formatação markdown — não use **negrito** nem outros marcadores) com os tags identificadores abaixo. Os tags são extraídos programaticamente — devem ser exatos, sem alteração.

[INTRO_NUMEROS]
Analise a transformação dos 5 números fundamentais. Cite quais mudaram (ou se nenhum mudou) e o impacto energético geral. Destino permanece imutável.
[/INTRO_NUMEROS]

[INTRO_BLOQUEIOS]
Analise os bloqueios energéticos: se diminuíram (melhora), aumentaram (alerta) ou se mantiveram iguais. Deixe claro que diminuir bloqueios é sempre mais favorável.
[/INTRO_BLOQUEIOS]

[INTRO_DEBITOS]
Analise os débitos kármicos: quais foram aliviados pela harmonização e quais permanecem fixos (originam-se na data de nascimento, imutáveis). Se não há débitos, escreva uma frase positiva sobre isso.
[/INTRO_DEBITOS]

[INTRO_LICOES]
Analise as lições kármicas: se foram superadas (números antes ausentes agora presentes no nome), mantidas ou se novas surgiram. Deixe claro que reduzir lições é sempre favorável.
[/INTRO_LICOES]

[INTRO_TENDENCIAS]
Analise as tendências ocultas (excessos vibracionais): se foram neutralizadas, mantidas ou se novas surgiram. Deixe claro que reduzir excessos é sempre favorável.
[/INTRO_TENDENCIAS]

[INTRO_ARCANOS]
Analise os Arcanos dos 4 triângulos: quais Arcanos Regentes e de Trânsito foram alterados pela harmonização e o que essa mudança representa em termos de força universal que governa cada dimensão da vida.
[/INTRO_ARCANOS]

---
` : ''}
Siga EXATAMENTE esta estrutura:

---

## ✨ 1. O Destino como Âncora — Quem Você É por Natureza

Escreva 3 parágrafos reveladores sobre o Número de **Destino ${destino}** desta pessoa:
- O dom inato que este número instala como recurso natural ao longo de toda a vida — não como conquista, mas como potencial de nascença
- A polaridade deste Destino: quando está em harmonia, o que esta pessoa naturalmente produz e irradia; quando está em resistência interna, como o padrão de sombra pode se manifestar
- Por que qualquer nome social que esta pessoa adote precisa honrar e amplificar este Destino como fundação vibracional — e o que acontece energeticamente quando o nome vai contra ele

---

## 🏆 2. O Nome de Ouro — Por Que Este Nome Encaixa na Sua Vibração

Escreva 2-3 parágrafos técnicos e inspiradores explicando por que **${melhorNome?.nomeCompleto ?? 'o nome recomendado'}** foi selecionado como o mais compatível:
- A harmonia entre **Expressão ${melhorNome?.expressao ?? '—'}** e **Destino ${destino}** — o que essa relação de compatibilidade produz concretamente na vida desta pessoa
- A ausência ou mínimo de bloqueios e o impacto real disso no fluxo de energia da identidade pública
- Como este nome entrega as vibrações e características desejadas${objetivoApresentacao ? ` (especificamente: "${objetivoApresentacao}")` : ''} — conectando os números ao objetivo declarado

---

## 🌟 3. As 3 Alternativas de Alta Vibração

${top3.length > 0
  ? `Para cada uma das 3 alternativas (${top3.map(a => a.nomeCompleto).join(', ')}), escreva 1 parágrafo explicando:
- O que torna este nome uma opção poderosa e diferenciada
- Em qual contexto específico ele brilha mais (profissional vs espiritual vs criativo vs presença digital)
- A diferença energética sutil em relação ao Nome de Ouro — não uma fraqueza, mas uma nuance vibratória diferente`
  : `Nenhuma alternativa foi gerada para esta análise. Escreva 1 parágrafo explicando por que o Nome de Ouro é a escolha definitiva e como ele supera qualquer variação.`}

---

## 🔮 4. Perfil Energético do Nome Escolhido

Escreva 3-4 parágrafos sobre a identidade vibracional que **${melhorNome?.nomeCompleto ?? 'o nome recomendado'}** projeta:
${arquetipo ? `- O arquétipo do(a) **${arquetipo.nome}** que este nome ativa — *"${arquetipo.essencia}"* — e como essa energia se manifesta na presença pública desta pessoa` : '- O arquétipo que este nome ativa e como essa energia se manifesta na presença pública desta pessoa'}
- Como o mundo percebe, sente e responde a este nome — a primeira impressão que ele cria antes mesmo de a pessoa falar
- Que tipo de oportunidades, pessoas, convites e situações este nome naturalmente atrai para a vida
- A diferença concreta entre a frequência do nome de nascimento e a frequência que este nome social instala

${arquetipo ? `### Sobre o Arquétipo do(a) ${arquetipo.nome}
Manifestações positivas: ${arquetipo.expressaoPositiva.join(' | ')}
Sombra a equilibrar: ${arquetipo.expressaoSombra.join(' | ')}
Figuras que representam este arquétipo: ${arquetipo.figurasMiticas.join(', ')}

Escreva 2 parágrafos adicionais sobre como este arquétipo se expressa especificamente no contexto da identidade pública desta pessoa — incluindo como nutrir as manifestações positivas e como evitar que a sombra tome conta da persona social.` : ''}

---

## 🎯 5. Alinhamento com Seu Propósito

${objetivoApresentacao || vibracoesDesejadas
  ? `Com base no objetivo declarado — "${objetivoApresentacao ?? ''}"${vibracoesDesejadas ? ` e nas vibrações desejadas "${vibracoesDesejadas}"` : ''} — escreva 3 parágrafos:`
  : `Escreva 3 parágrafos sobre como este nome se alinha com o propósito de vida desta pessoa:`}
- Numericamente, em que medida **${melhorNome?.nomeCompleto ?? 'este nome'}** entrega as vibrações desejadas — o que Expressão + Motivação revelam sobre como este nome manifesta o objetivo
- O que pode ser potencializado conscientemente (e o que este nome não "faz" sozinho — o que ainda depende da ação humana)
- Como as lições kármicas presentes neste nome revelam o trabalho espiritual que esta escolha traz consigo — não como obstáculo, mas como oportunidade de crescimento

---

## ⚡ 6. Poder de Manifestação

Escreva 3 parágrafos sobre o potencial de manifestação deste nome:
- O que muda na frequência de atração quando o nome é adotado conscientemente — que padrões de relacionamento, oportunidade e percepção pública tendem a se reorganizar
- O período de integração vibracional (os primeiros 90 dias) — o que observar como sinais de que o nome está funcionando, e como atravessar a resistência inicial da identidade
- A diferença entre usar o nome ocasionalmente e incorporá-lo plenamente — o que a consistência do uso faz à frequência energética ao longo do tempo

---

## 🌍 7. Percepção Social e Posicionamento

${contextoUso
  ? `Com foco no contexto de **${contextoUso}** informado pelo usuário, escreva 2 parágrafos:`
  : `Escreva 2 parágrafos sobre:`}
- Como este nome ressoa especificamente neste contexto — que autoridade, confiança ou magnetismo ele instala nessa esfera específica da vida
- O que o **Número de Impressão ${melhorNome?.impressao ?? '—'}** (consoantes) diz sobre a primeira percepção que as pessoas formam — a "embalagem" da identidade que este nome projeta antes mesmo do conteúdo

---

## ✍️ 8. Guia de Implementação

Orientações práticas para adotar o nome com intenção:

**Protocolo de ativação:** Como começar a usar o nome — em que contextos primeiro, como apresentar a mudança para pessoas próximas, e o ritual de intenção para ativar a vibração conscientemente.

**Assinatura numerológica:** A forma de escrever o nome que maximiza sua vibração — letras abertas ou fechadas, inclinação, traços que devem ser suaves (sem cortes ou bloqueios visuais na assinatura).

**Contextos prioritários:** Onde usar primeiro para criar momentum vibracional mais rapidamente — redes sociais, e-mail profissional, apresentações formais ou cartão de visitas.

**Tempo de integração:** O que observar como sinais de alinhamento nos primeiros 30, 60 e 90 dias — e como manter a consistência quando a identidade antiga tenta retornar.

---

## 🌸 9. Conclusão — O Nome como Instrumento de Identidade

Escreva uma conclusão profunda e emocionante (3–4 parágrafos):
- O significado sagrado de escolher conscientemente como se apresentar ao mundo — e por que isso é um ato de poder pessoal, não apenas uma questão estética
- A síntese entre **Destino ${destino}** (quem esta pessoa É por natureza) e **${melhorNome?.nomeCompleto ?? 'o nome escolhido'}** (como ela ESCOLHE aparecer) — e a beleza desta harmonia específica
- Uma mensagem de encorajamento sobre este novo capítulo de manifestação consciente da identidade — que este nome não apenas apresenta quem esta pessoa é, mas convida o mundo a encontrá-la

---

REGRAS ESTRITAS DE FORMATAÇÃO:
1. Use estruturação Markdown rigorosa com Hash Headers (##, ###).
2. NUNCA use títulos apenas com letras maiúsculas. SEMPRE use Hash Headers com emoticon.
3. **Negrito:** Utilize negrito (**) de forma natural e estratégica para destacar ideias principais, palavras-chave e pontos de atenção importantes no texto. Evite colocar trechos inteiros ou frases longas em negrito.
4. SEMPRE duplo espaçamento entre parágrafos — texto arejado e escaneável.
5. Parágrafos com no máximo 4 linhas.
6. Escreva com profundidade, precisão e calor humano — esta pessoa está diante de uma das escolhas mais importantes da sua identidade pública.
7. Seja específico: cada recomendação deve ser concreta e aplicável, não apenas poética.
8. NUNCA crie botões, links, CTAs ou HTML para baixar PDF dentro do texto. O botão de download é controlado pela interface.
9. Sempre escreva termos numerológicos em Title Case e, quando natural, em negrito: **Débitos Kármicos**, **Lições Kármicas**, **Tendências Ocultas**, **Expressão Numerológica**, **Expressão**, **Impressão**, **Arcanos Regentes**, **Arcanos de Trânsito**, **Triângulos Cabalísticos**.`;
}
