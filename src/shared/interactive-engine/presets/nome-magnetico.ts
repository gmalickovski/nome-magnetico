/**
 * Preset oficial do Nome Magnético para o Motor Interativo JEV (@typesafe-ai/sdk).
 *
 * Regras de conformidade (DEV-183 / DEV-235):
 * - Zero travessões (—, –), zero símbolo ×.
 * - Zero jargões ("score", "ranking", "N5", "Self-service", "Studio MLK").
 * - Zero menção a saúde, doenças, dores físicas, ansiedade, depressão, cura ou terapia.
 * - Todas as perguntas JEV centralizadas e auditáveis neste módulo (padrão SKILL.md TypeSafe AI).
 */

import {
  box,
  choice,
  noul,
  score,
} from '../primitives';

export * from '../copy';

export const NOME_MAGNETICO_BRAND = 'nome-magnetico' as const;

/**
 * Perguntas atômicas System One (`@typesafe-ai/sdk`) para o Nome Magnético.
 * Segue as diretrizes do SKILL.md oficial (`jev-1.14.0`):
 * - Companion `noul` (`escopo_pronto`) com critérios concretos `true` e `false`.
 * - Chaves semânticas descritivas em `choice`.
 * - Rubrica de `score` (`clareza_relato`) descrita como situações observáveis independentes.
 */
export function buildNomeMagneticoJevQuestions() {
  return {
    escopo_pronto: noul(
      'O relato ou escolha do consulente já indica uma meta, dor ou foco de vida suficiente para personalizar a leitura?',
      {
        true: 'O consulente indicou uma meta financeira, profissional, afetiva ou de posicionamento pessoal ou selecionou um chip de área de foco.',
        false: 'O relato está em branco, contém apenas letras soltas ou ainda não expressa nenhuma intenção de momento.',
      }
    ),
    clareza_relato: score(
      'Qual é o nível de detalhamento do contexto informado pelo consulente?',
      [
        'O campo de relato está vazio ou possui apenas uma palavra isolada sem contexto.',
        'O consulente indicou a área geral da vida que deseja movimentar ou onde assina.',
        'O consulente descreveu seu momento atual com objetivo claro e contexto prático de uso da assinatura.',
      ] as const
    ),
    area_foco: choice('Qual é a área principal que o consulente deseja movimentar agora?', {
      prosperidade_financeira: 'Dinheiro, ganhos, estabilidade financeira, sair do aperto, fazer o dinheiro render',
      carreira_negocios: 'Trabalho, negócios, vendas, clientes, contratos, promoção, liderança',
      relacionamentos_harmonia: 'Relações afetivas, vida a dois, paz familiar, convivência e conexões',
      autoestima_expressao: 'Autoconfiança, clareza pessoal, comunicação, posicionamento e tirar ideias do papel',
    }),
    onde_assina: choice('Onde o consulente pretende usar a assinatura primeiro no dia a dia?', {
      identidade_registro: 'Documentos oficiais e Gov.br',
      presenca_digital: 'Instagram, LinkedIn, WhatsApp e redes sociais',
      rotina_trabalho: 'Contratos, propostas comerciais e e-mails de trabalho',
      marca_autoria: 'Projetos autorais, arte e criação',
    }),
    estilo_presenca: choice('Qual estilo de assinatura melhor combina com o contexto do consulente?', {
      sobrenome_forte: 'Nome e um sobrenome forte sem acento extra, ideal para trabalho e contratos',
      ajuste_sutil: 'Nome atual preservando sobrenomes com um acento discreto',
      curto_direto: 'Assinatura curta ou primeiro nome para redes e rotina digital',
    }),
    subfoco_momento: choice('Qual é o subfoco específico mais alinhado ao relato do consulente?', {
      reter_ganhos: 'Fazer o dinheiro sobrar no fim do mês',
      aumentar_renda: 'Aumentar a renda com novos ganhos',
      organizar_estabilidade: 'Sair do aperto e organizar pendências financeiras',
      fechar_contratos: 'Fechar mais clientes, vendas e contratos',
      lideranca_promocao: 'Crescer de cargo e ganhar reconhecimento profissional',
      novo_ciclo_profissional: 'Destravar um projeto ou transição de área',
      harmonia_afetiva: 'Mais leveza e diálogo na vida a dois',
      paz_familiar: 'Paz no ambiente familiar e em casa',
      novas_conexoes: 'Atrair conexões verdadeiras e recíprocas',
      voz_seguranca: 'Falar e se posicionar com segurança',
      foco_execucao: 'Tirar ideias do papel sem adiar',
      autoconfianca_identidade: 'Sentir orgulho da própria história',
    }),
    alerta_compliance_legal: noul(
      'O texto menciona doenças físicas, diagnósticos médicos, depressão, ansiedade clínica, dores no corpo ou pede cura médica/terapêutica?',
      {
        true: 'O texto cita doenças, sintomas físicos, depressão, ansiedade clínica, remédios ou solicita cura médica ou psicológica.',
        false: 'O texto trata apenas de objetivos profissionais, financeiros, relacionais, criativos ou de organização pessoal.',
      }
    ),
  };
}

/**
 * Perguntas System One com primitiva `box` (`model: 'jev-preview'`) + companion `noul`
 * para localizar o traçado de assinatura em uma folha de treino ou imagem enviada.
 */
export function buildSignatureBoxQuestions() {
  return {
    assinatura_visivel: noul(
      'Há uma assinatura manuscrita ou rubrica visível na imagem enviada?',
      {
        true: 'A imagem mostra claramente um traçado manuscrito de nome ou rubrica.',
        false: 'A imagem está em branco ou não contém nenhuma assinatura manuscrita.',
      }
    ),
    regiao_assinatura: box('A assinatura manuscrita principal traçada na imagem'),
  };
}
