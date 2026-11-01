/**
 * InteractiveDecisionEngine — Motor de 3 Camadas para Jornada Contínua Mobile-First:
 * - Camada 1: Estado determinístico (notaHoje, potencial, destino, bloqueios, sobrenomes) em 0 ms.
 * - Camada 2: Julgamento JEV (`@typesafe-ai/sdk` -> OpenAI Structured Outputs -> Determinístico 0 ms).
 * - Camada 3: Tabela de decisão em código (SKILL.md TypeSafe AI) montando:
 *   - `palpiteTexto` ("Leitura inicial do seu momento")
 *   - `recomendacaoOpcoesTexto`
 *   - `perguntaSubfoco` (Pergunta Extra C dinâmica)
 *   - `diagramNodes` (4 nós de 4 a 6 palavras sem travessões)
 */

import {
  buildRecomendacaoEstiloTexto,
  buildVibrationalDiagramNodes,
  NOME_MAGNETICO_BRAND,
  SUBFOCO_QUESTIONS_BY_AREA,
} from './presets/nome-magnetico';
import { buildProfilePalpiteText } from './chat-profile-copy';
import type {
  AreaFocoNomeMagnetico,
  BrandPresetId,
  DiagramNodeSpec,
  EstiloAssinaturaPreferido,
  OndeAssinaCanal,
  SubfocoMomento,
  SubfocoQuestionSpec,
} from './primitives';
import {
  runJevDecision,
  type JevDecisionInputState,
  type JevDecisionResult,
} from './providers/jev-provider';

export interface InteractiveEngineOutput extends JevDecisionResult {
  brand: BrandPresetId;
  palpiteTexto: string;
  recomendacaoOpcoesTexto: string;
  perguntaSubfoco: SubfocoQuestionSpec;
  diagramNodes: DiagramNodeSpec[];
}

export class InteractiveDecisionEngine {
  private readonly brand: BrandPresetId;

  constructor(brand: BrandPresetId = NOME_MAGNETICO_BRAND) {
    this.brand = brand;
  }

  async evaluate(state: JevDecisionInputState): Promise<InteractiveEngineOutput> {
    const decision = await runJevDecision(state);
    const bloqueioPrincipal = state.bloqueios_triangulos[0] ?? null;

    const palpiteTexto = buildProfilePalpiteText({
      nomeCompleto: state.nome_completo,
      areaFoco: decision.areaFoco,
      subfocoMomento: decision.subfocoMomento,
      ondeAssina: state.onde_assina_chips ?? [],
      relatoUsuario: state.relato_consulente,
      alertaComplianceLegal: decision.alertaComplianceLegal,
    });

    const recomendacaoOpcoesTexto = buildRecomendacaoEstiloTexto(
      decision.estiloPresenca,
      decision.ondeAssina
    );

    const perguntaSubfoco = SUBFOCO_QUESTIONS_BY_AREA[decision.areaFoco];

    const diagramNodes = buildVibrationalDiagramNodes({
      destino: state.numero_destino,
      bloqueio: bloqueioPrincipal,
      notaHoje: state.nota_hoje,
      potencial: state.potencial,
      areaFoco: decision.areaFoco,
      estiloPresenca: decision.estiloPresenca,
      ondeAssina: decision.ondeAssina,
    });

    return {
      ...decision,
      brand: this.brand,
      palpiteTexto,
      recomendacaoOpcoesTexto,
      perguntaSubfoco,
      diagramNodes,
    };
  }
}

export type {
  AreaFocoNomeMagnetico,
  DiagramNodeSpec,
  EstiloAssinaturaPreferido,
  JevDecisionInputState,
  JevDecisionResult,
  OndeAssinaCanal,
  SubfocoMomento,
  SubfocoQuestionSpec,
};
