/**
 * Textos canônicos, tipos semânticos e utilitários de exibição (DEV-235 / Motor NM v3).
 *
 * Módulo seguro para execução tanto no backend quanto no frontend browser (React Islands),
 * sem importação de SDKs ou runtimes de IA (zero dependência de `@typesafe-ai/sdk`).
 *
 * Regras de conformidade (DEV-183 / DEV-235):
 * - Zero travessões (—, –), zero símbolo ×.
 * - Zero jargões ("score", "ranking", "N5", "Self-service", "Studio MLK").
 * - Zero menção a saúde, doenças, dores físicas, ansiedade, depressão, cura ou terapia.
 */

export type AreaFocoNomeMagnetico =
  | 'prosperidade_financeira'
  | 'carreira_negocios'
  | 'relacionamentos_harmonia'
  | 'autoestima_expressao';

export type OndeAssinaCanal =
  | 'identidade_registro'
  | 'presenca_digital'
  | 'rotina_trabalho'
  | 'marca_autoria';

export type EstiloAssinaturaPreferido =
  | 'sobrenome_forte'
  | 'ajuste_sutil'
  | 'curto_direto'
  | 'qualquer';

export type SubfocoMomento =
  | 'reter_ganhos'
  | 'aumentar_renda'
  | 'organizar_estabilidade'
  | 'fechar_contratos'
  | 'lideranca_promocao'
  | 'novo_ciclo_profissional'
  | 'harmonia_afetiva'
  | 'paz_familiar'
  | 'novas_conexoes'
  | 'voz_seguranca'
  | 'foco_execucao'
  | 'autoconfianca_identidade';

export type MotivoRefinamentoAssinatura =
  | 'forcar_sobrenome'
  | 'preferir_sem_acento'
  | 'preferir_curto'
  | 'preferir_nome_curto'
  | 'preferir_completo'
  | 'preferir_nome_completo'
  | 'testar_propria'
  | 'testar_variacao_propria';

export interface SubfocoOption {
  value: SubfocoMomento;
  label: string;
}

export interface SubfocoQuestionSpec {
  prompt: string;
  options: SubfocoOption[];
}

export interface DiagramNodeSpec {
  id: 'origem' | 'reflexo' | 'ajuste' | 'alvo';
  kind: 'origem' | 'reflexo' | 'ajuste' | 'alvo';
  eyebrow: string;
  label: string;
}

// ── Copy Oficial do Marketing (Seção 4 da DEV-235 · Zero Travessões) ──────────

export const NOME_MAGNETICO_COPY = {
  espelhoAoVivo: {
    eyebrow: 'SEU MAPA AO VIVO',
    titulo: 'A Marca da Sua Data e a Nota do Seu Nome',
    microcopyComBloqueios:
      'Identificamos as sequências que travam a nota do seu nome de registro. Veja abaixo o que vem da sua data de nascimento e o que a sua nova assinatura pode liberar.',
    microcopySemBloqueios:
      'O seu nome já tem uma base limpa no Triângulo da Vida. Agora vamos alinhar a sua assinatura com o seu momento atual.',
  },
  perguntaExtraA: {
    eyebrow: 'SUA ASSINATURA DO SEU JEITO',
    pergunta: 'Olhando para o seu nome completo, qual sobrenome você faz questão de manter na sua assinatura?',
    apoio:
      'Toque nos sobrenomes que você mais gosta de usar. Se houver alguma sequência repetida nos outros, nosso cálculo já testa a retirada deles primeiro.',
    chipSemRestricao: 'Pode testar todas as combinações',
    chipApenasPrimeiroNome: 'Prefiro assinar só meu primeiro nome',
  },
  perguntaExtraB: {
    pergunta: 'Como você prefere ser chamado e assinar no dia a dia?',
    opcoes: [
      {
        value: 'sobrenome_forte' as const,
        titulo: 'Nome e um sobrenome forte',
        legenda: 'Ideal para trabalho, contratos e documentos sem acento extra.',
      },
      {
        value: 'ajuste_sutil' as const,
        titulo: 'Meu nome atual com um acento discreto',
        legenda: 'Mantém os sobrenomes que você já usa e limpa a nota na assinatura.',
      },
      {
        value: 'curto_direto' as const,
        titulo: 'Assinatura curta ou primeiro nome',
        legenda: 'Fácil de lembrar nas redes sociais, projetos e rotina digital.',
      },
    ],
  },
  perguntaAreaFoco: {
    pergunta: 'Qual área da sua vida você mais quer movimentar agora com a sua nova assinatura?',
    placeholder:
      'Ex.: Quero fechar contratos melhores no meu trabalho, organizar minha vida financeira e transmitir mais segurança...',
    chips: [
      { value: 'prosperidade_financeira' as const, label: 'Fazer o dinheiro render mais' },
      { value: 'carreira_negocios' as const, label: 'Crescer no trabalho e nos negócios' },
      { value: 'relacionamentos_harmonia' as const, label: 'Viver relações mais leves' },
      { value: 'autoestima_expressao' as const, label: 'Ter mais clareza e confiança' },
    ],
  },
  perguntaOndeAssina: {
    pergunta: 'E onde você pretende usar essa assinatura primeiro no seu dia a dia?',
    chips: [
      { value: 'identidade_registro' as const, label: 'Documentos e Gov.br' },
      { value: 'presenca_digital' as const, label: 'Instagram, LinkedIn e WhatsApp' },
      { value: 'rotina_trabalho' as const, label: 'Contratos, propostas e e-mails' },
      { value: 'marca_autoria' as const, label: 'Projetos autorais e criação' },
    ],
  },
  leituraInicialCard: {
    eyebrow: 'Leitura inicial do seu momento',
    botaoPrimario: 'Fez todo sentido para mim',
    botaoSecundario: 'Quero acrescentar um detalhe',
  },
  ctaFormulario: 'Ver Minhas 3 Opções de Assinatura',
  vitrineSugestoes: {
    eyebrow: 'SUAS 3 OPÇÕES DE ASSINATURA',
    titulo: 'Escolha a Assinatura Que Mais Combina Com Você',
    subtituloTemplate:
      'Toque em cada opção abaixo para comparar a nota alcançada, a Expressão alinhada ao seu Destino {{destino}} e como ela apoia o seu momento atual.',
    selosMetodo: {
      sobrenomeSelecionado: 'OPÇÃO COM SOBRENOME SELECIONADO',
      acentoSutil: 'OPÇÃO COM ACENTO SUTIL',
      curtaDireta: 'OPÇÃO CURTA E DIRETA',
    },
    fraseConexaoPorArea: {
      prosperidade_financeira:
        'Limpa as sequências repetidas do Triângulo da Vida e favorece consistência material para o seu objetivo.',
      carreira_negocios:
        'Alinha sua Expressão {{expressao_sugestao}} ao Destino {{destino}} para dar força na sua rotina profissional.',
      relacionamentos_harmonia:
        'Suaviza os ruídos do nome de registro e apoia trocas mais leves na sua rotina.',
      autoestima_expressao:
        'Destrava uma presença firme e natural para você se posicionar todos os dias.',
    } satisfies Record<AreaFocoNomeMagnetico, string>,
    botaoEscolherPadrao: 'Escolher Esta Assinatura',
    botaoEscolherAtivo: 'Assinatura Escolhida Para o Meu Guia',
  },
  drawerRefinamento: {
    gatilho: 'Quero ver outras sugestões de assinatura',
    titulo: 'Quer testar outro estilo de assinatura?',
    subtitulo:
      'Se você quiser manter outro sobrenome ou testar uma variação específica, diga abaixo o que prefere. Suas opções atuais continuam salvas para comparação.',
    chips: {
      forcarSobrenomeTemplate: 'Manter o sobrenome {{sobrenome_preterido}}',
      preferirSemAcento: 'Ver opções sem acento adicional',
      preferirNomeCurto: 'Ver opções mais curtas',
      preferirNomeCompleto: 'Ver opções com meu nome mais completo',
      testarVariacaoPropria: 'Testar uma ideia minha de assinatura',
    },
    labelCampoProprio: 'Ou digite como você gostaria de assinar para vermos a nota na hora:',
    placeholderCampoProprio: 'Ex.: Quero manter Ferreira sem acento, ou testar só Ana Lima...',
    botaoGerarNovas: 'Gerar Novas Opções de Assinatura',
    feedbackPadrao:
      'Pronto! Calculamos novas opções respeitando a sua preferência e mantendo o Triângulo da Vida limpo.',
    feedbackSobrenomeComAcentoTemplate:
      'O sobrenome {{sobrenome_escolhido}} carrega uma sequência repetida nas próprias letras. Por isso, aplicamos um acento sutil para manter esse sobrenome na sua assinatura com nota {{nota_nova}}.',
  },
} as const;

export const SUBFOCO_QUESTIONS_BY_AREA: Record<AreaFocoNomeMagnetico, SubfocoQuestionSpec> = {
  prosperidade_financeira: {
    prompt: 'Dentro da sua vida financeira, qual é a sua prioridade número um agora?',
    options: [
      { value: 'reter_ganhos', label: 'Fazer o dinheiro sobrar no fim do mês' },
      { value: 'aumentar_renda', label: 'Aumentar minha renda com novos ganhos' },
      { value: 'organizar_estabilidade', label: 'Sair do aperto e organizar pendências' },
    ],
  },
  carreira_negocios: {
    prompt: 'No seu trabalho ou negócio, qual passo você quer dar primeiro?',
    options: [
      { value: 'fechar_contratos', label: 'Fechar mais clientes, vendas e contratos' },
      { value: 'lideranca_promocao', label: 'Crescer de cargo e ganhar reconhecimento' },
      { value: 'novo_ciclo_profissional', label: 'Destravar um projeto ou transição de área' },
    ],
  },
  relacionamentos_harmonia: {
    prompt: 'Nas suas relações, o que você mais quer fortalecer neste momento?',
    options: [
      { value: 'harmonia_afetiva', label: 'Mais leveza e diálogo na vida a dois' },
      { value: 'paz_familiar', label: 'Paz no ambiente familiar e em casa' },
      { value: 'novas_conexoes', label: 'Atrair conexões verdadeiras e recíprocas' },
    ],
  },
  autoestima_expressao: {
    prompt: 'Como você quer se sentir ao assinar e apresentar o seu nome?',
    options: [
      { value: 'voz_seguranca', label: 'Falar e me posicionar com segurança' },
      { value: 'foco_execucao', label: 'Tirar minhas ideias do papel sem adiar' },
      { value: 'autoconfianca_identidade', label: 'Sentir orgulho da minha própria história' },
    ],
  },
};

export interface ReadingTemplateParams {
  nome: string;
  areaFoco: AreaFocoNomeMagnetico;
  destino: number;
  notaHoje: number;
  alertaComplianceLegal?: boolean;
}

function primeiroNome(nome: string): string {
  const t = nome.trim().split(/\s+/).filter(Boolean);
  return t[0] ?? nome.trim();
}

/**
 * Leitura do momento (pré escolha de sugestão): só {{nome}}, {{destino}}, {{nota_hoje}}.
 */
export function buildInitialMomentReadingText(params: ReadingTemplateParams): string {
  const { areaFoco, destino, notaHoje, alertaComplianceLegal } = params;
  const nome = primeiroNome(params.nome);

  if (alertaComplianceLegal) {
    return `${nome}, o seu nome hoje tem nota ${notaHoje} e o seu Destino é ${destino}. A numerologia ajuda a organizar clareza na rotina, sem substituir cuidados de saúde. Escolha a sugestão que mais combina com você e eu mostro o que ela muda.`;
  }

  switch (areaFoco) {
    case 'prosperidade_financeira':
      return `${nome}, o seu nome hoje tem nota ${notaHoje} e o seu Destino é ${destino}. Quando a assinatura conversa melhor com esse Destino, muita gente sente mais clareza para lidar com dinheiro e escolhas. Escolha a sugestão que mais combina com você e eu mostro o que ela muda.`;
    case 'carreira_negocios':
      return `${nome}, o seu nome hoje tem nota ${notaHoje} e o seu Destino é ${destino}. Na carreira, a forma como você assina é a primeira impressão que fica. Escolha a sugestão que você usaria no trabalho e eu mostro o que ela muda.`;
    case 'relacionamentos_harmonia':
      return `${nome}, o seu nome hoje tem nota ${notaHoje} e o seu Destino é ${destino}. Um nome mais alinhado ao seu Destino traz uma energia de equilíbrio para a forma como você se apresenta. Escolha a sugestão que mais soa como você e eu mostro o que ela muda.`;
    case 'autoestima_expressao':
      return `${nome}, o seu nome hoje tem nota ${notaHoje} e o seu Destino é ${destino}. A sua assinatura é o jeito como você se mostra ao mundo, e ela pode refletir melhor quem você é. Escolha a sugestão que você teria orgulho de assinar e eu mostro o que ela muda.`;
  }
}

/** Após o usuário escolher uma sugestão harmonizada. */
export function buildPostSuggestionChoiceText(params: {
  assinaturaEscolhida: string;
  notaHoje: number;
  notaEscolhida: number;
}): string {
  const { assinaturaEscolhida, notaHoje, notaEscolhida } = params;
  return `Com ${assinaturaEscolhida}, a nota vai de ${notaHoje} para ${notaEscolhida}. Veja abaixo o que muda na sua Expressão.`;
}

export function buildRecomendacaoEstiloTexto(
  estiloPresenca: Exclude<EstiloAssinaturaPreferido, 'qualquer'>,
  ondeAssina: OndeAssinaCanal
): string {
  const canalLabel: Record<OndeAssinaCanal, string> = {
    identidade_registro: 'documentos e registros oficiais',
    presenca_digital: 'redes sociais e presença digital',
    rotina_trabalho: 'contratos, propostas e rotina profissional',
    marca_autoria: 'projetos autorais e marca pessoal',
  };

  if (estiloPresenca === 'sobrenome_forte') {
    return `Priorizamos opções com seu primeiro nome e um sobrenome forte sem acento extra para ${canalLabel[ondeAssina]}.`;
  }
  if (estiloPresenca === 'ajuste_sutil') {
    return `Priorizamos opções que mantêm os sobrenomes que você já usa com um acento discreto para ${canalLabel[ondeAssina]}.`;
  }
  return `Priorizamos opções de assinatura curta e direta para facilitar sua presença em ${canalLabel[ondeAssina]}.`;
}

export interface BuildDiagramNodesParams {
  destino: number;
  bloqueio?: string | null;
  notaHoje: number;
  potencial: number;
  areaFoco: AreaFocoNomeMagnetico;
  estiloPresenca: Exclude<EstiloAssinaturaPreferido, 'qualquer'>;
  ondeAssina: OndeAssinaCanal;
}

/**
 * Monta os 4 nós do `VibrationalAlignmentDiagram` (4 a 6 palavras por `label`, zero travessões).
 */
export function buildVibrationalDiagramNodes(params: BuildDiagramNodesParams): DiagramNodeSpec[] {
  const { destino, bloqueio, notaHoje, potencial, areaFoco, estiloPresenca, ondeAssina } = params;

  const origemLabel =
    bloqueio && /^\d+$/.test(bloqueio.trim())
      ? `Sequência ${bloqueio.trim()} no Triângulo da Vida`
      : bloqueio
        ? 'Sequências repetidas travando a nota'
        : `Letras atuais desalinhadas com Destino ${destino}`;

  const reflexoMap: Record<AreaFocoNomeMagnetico, string> = {
    prosperidade_financeira: 'Muito esforço para pouco ganho retido',
    carreira_negocios: 'Projetos travam perto da conclusão',
    relacionamentos_harmonia: 'Ruídos constantes nas conversas importantes',
    autoestima_expressao: 'Dúvida na hora de se posicionar',
  };

  const ajusteLabel =
    estiloPresenca === 'sobrenome_forte'
      ? 'Assinatura limpa sem mudar documentos'
      : estiloPresenca === 'ajuste_sutil' || estiloPresenca === 'curto_direto'
        ? 'Acento sutil ou nome encurtado'
        : `Harmonia entre Expressão e Destino ${destino}`;

  void potencial;
  void notaHoje;
  const alvoLabel =
    ondeAssina === 'rotina_trabalho' || ondeAssina === 'identidade_registro'
      ? 'Mais força em contratos e trabalho'
      : 'Presença magnética nas redes e rotina';

  return [
    {
      id: 'origem',
      kind: 'origem',
      eyebrow: 'ORIGEM NO REGISTRO',
      label: origemLabel,
    },
    {
      id: 'reflexo',
      kind: 'reflexo',
      eyebrow: 'REFLEXO NO MOMENTO',
      label: reflexoMap[areaFoco],
    },
    {
      id: 'ajuste',
      kind: 'ajuste',
      eyebrow: 'AJUSTE DE ASSINATURA',
      label: ajusteLabel,
    },
    {
      id: 'alvo',
      kind: 'alvo',
      eyebrow: 'POTENCIAL LIBERADO',
      label: alvoLabel,
    },
  ];
}

export function extrairSobrenomes(nomeCompleto: string): string[] {
  const tokens = nomeCompleto
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length <= 1) return [];
  const preposicoes = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  return tokens.slice(1).filter(t => !preposicoes.has(t.toLowerCase()));
}
