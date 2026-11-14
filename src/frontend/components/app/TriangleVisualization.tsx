/**
 * TriangleVisualization — exibe os 4 triângulos numerológicos com abas.
 * SVG gerado seguindo a lógica de formula.js: letras no topo, números centrados
 * por linha, bloqueios destacados com fundo colorido e texto em negrito.
 */

import { useState } from 'react';
import { obterInterpretacaoEspecifica } from '../../../utils/blockageInterpretations';

interface Bloqueio {
  codigo: string;
  titulo: string;
  descricao: string;
  triangulos: string[];
  repeticoesPortriangulo?: Partial<Record<string, number>>;
  totalOcorrencias?: number;
}

interface ArcanoAtualInfo {
  numero: number | null;
  periodo: string;
  idadeInicio: number;
  idadeFim: number;
  indice?: number;
}

interface TrianguloData {
  tipo: string;
  linhas: number[][];
  arcanoRegente: number | null;
  arcanosDoMinantes: number[];
  sequenciasNegativas: string[];
  arcanosDePassagem?: number[];
  arcanoAtual?: ArcanoAtualInfo | null;
}

interface ArcanoInfo {
  numero: number;
  nome: string;
  palavraChave: string;
  descricao: string;
  desafio: string;
}

interface Props {
  vida: TrianguloData;
  pessoal: TrianguloData;
  social: TrianguloData;
  destino: TrianguloData;
  bloqueios: Bloqueio[];
  nome: string;
  productType?: 'nome_social' | 'nome_bebe' | 'nome_empresa';
  isFreeAnalysis?: boolean;
  arcanos?: Record<number, ArcanoInfo>;
  descricaoDetalhada?: Record<string, string>;
  /** DEV-265: exibe só o Triângulo da Vida (resumo web). Os 4 triângulos seguem no PDF. */
  onlyVida?: boolean;
}

const LEGENDA_VIDA = [
  { label: 'Valores das letras', stroke: '#D4AF37', bg: 'rgba(212,175,55,0.25)' },
  { label: 'Reduções intermediárias', stroke: '#9CA3AF', bg: 'rgba(156,163,175,0.2)' },
  { label: 'Arcano Regente', stroke: '#bea5ff', bg: 'rgba(190,165,255,0.25)' },
  { label: 'Bloqueio energético', stroke: '#ef4444', bg: 'rgba(239,68,68,0.25)' },
] as const;

const TIPO_LABEL: Record<string, { label: string; descricao: string; emoji: string }> = {
  vida:    { label: 'Triângulo da Vida',    descricao: 'Aspectos gerais da vida e padrões de existência',   emoji: '🔺' },
  pessoal: { label: 'Triângulo Pessoal',    descricao: 'Vida íntima, reações internas e sentimentos',        emoji: '💛' },
  social:  { label: 'Triângulo Social',     descricao: 'Influências externas e como o mundo te percebe',     emoji: '🌐' },
  destino: { label: 'Triângulo do Destino', descricao: 'Resultados esperados, missão e previsões de vida',   emoji: '⭐' },
};

const TIPO_LABEL_EMPRESA: Record<string, string> = {
  vida:    'Vibração base do nome — energia central que o negócio projeta ao mercado e como é percebido naturalmente por clientes e parceiros.',
  pessoal: 'Cultura interna — os valores, a dinâmica da equipe e a forma como os sócios vivenciam a empresa por dentro.',
  social:  'Posicionamento de mercado — como clientes, concorrentes e o mercado percebem e se relacionam com esta empresa.',
  destino: 'Missão e legado — o propósito de longo prazo do negócio e o impacto que este nome carrega para o futuro.',
};

function getDescricao(tipo: string, productType?: string): string {
  if (productType === 'nome_empresa') return TIPO_LABEL_EMPRESA[tipo] ?? TIPO_LABEL[tipo]!.descricao;
  return TIPO_LABEL[tipo]!.descricao;
}

const ARCANO_RESUMO: Record<number, { vibracao: string; desafio: string }> = {
  1:  { vibracao: 'Arquétipo do criador consciente: transforma intenção em resultado com magnetismo e liderança. Favorece autonomia, protagonismo e abertura de novos ciclos.', desafio: 'Evitar arrogância e impulsividade — confundir força de vontade com rigidez bloqueia o campo que está pronto para abrir.' },
  2:  { vibracao: 'Guardiã dos mistérios interiores: opera no silêncio, na intuição profunda e na sabedoria subconsciente. Favorece reflexão, estudo e percepção do que os outros não enxergam.', desafio: 'Evitar passividade e segredos prejudiciais — a percepção acumulada perde sentido quando não é compartilhada.' },
  3:  { vibracao: 'Governa criatividade, fertilidade e abundância — o que for plantado com cuidado tende a florescer. Favorece expressão genuína, projetos criativos e relacionamentos nutritivos.', desafio: 'Evitar dispersão de energia criativa e apego excessivo ao conforto — o ciclo completo inclui os momentos difíceis.' },
  4:  { vibracao: 'Vibração da ordem, disciplina e autoridade fundamentada em mérito. Não produz resultados rápidos, mas cria bases que sustentam décadas.', desafio: 'Evitar rigidez e apego ao controle — a estabilidade construída pode se tornar uma prisão quando a flexibilidade é descartada.' },
  5:  { vibracao: 'Ponte entre o material e o espiritual: governa ensinamento, propósito e transmissão de sabedoria. Favorece estudos aprofundados e o papel de mentor ou referência.', desafio: 'Evitar dogmatismo e dependência de aprovação — quando a sabedoria se fecha em si mesma, deixa de ser sabedoria.' },
  6:  { vibracao: 'Governa as grandes escolhas e parcerias que definem trajetórias. Favorece relacionamentos significativos quando razão e emoção estão integradas.', desafio: 'Evitar indecisão e dependência afetiva — a incapacidade de honrar as próprias escolhas é o principal obstáculo desta vibração.' },
  7:  { vibracao: 'Vitória conquistada pelo domínio das forças internas e direcionamento claro da vontade. Favorece superação de obstáculos e foco sob pressão.', desafio: 'Evitar arrogância pós-vitória e dispersão — sem direção clara, a mesma força que produz vitória pode produzir caos.' },
  8:  { vibracao: 'Lei de causa e efeito: integridade e responsabilidade determinam os resultados com precisão. O campo aqui é altamente sensível à honestidade — não há atalhos, mas também não há injustiças duradouras.', desafio: 'Evitar julgamentos severos e inflexibilidade — a régua que mede os outros com mais rigor do que a si mesma desequilibra o campo.' },
  9:  { vibracao: 'Sabedoria que vem da experiência vivida, da introspecção e da integração de ciclos encerrados. Favorece retiro, síntese do percorrido e preparação para um novo capítulo.', desafio: 'Evitar isolamento excessivo e arrogância espiritual — a sabedoria guardada apenas para si perde o sentido.' },
  10: { vibracao: 'Governa os grandes ciclos de virada que redesenham o terreno da vida independentemente da vontade. Favorece adaptação estratégica — quem compreende os ciclos navega com elegância.', desafio: 'Evitar passividade diante das mudanças — a consciência de quem está na roda determina se o movimento é evolução ou repetição.' },
  11: { vibracao: 'Poder que nasce do domínio amoroso dos próprios impulsos, não da dominação. Favorece autodomínio e influência pelo exemplo — Número Mestre que amplifica tanto talentos quanto desafios.', desafio: 'Evitar uso opressivo da força e negação da vulnerabilidade — negar a fragilidade produz rigidez, que quebra onde a flexibilidade resistiria.' },
  12: { vibracao: 'Poder da pausa voluntária: suspensão necessária onde o melhor movimento é nenhum movimento. O que parece estagnação frequentemente é gestação de algo novo sob a superfície.', desafio: 'Evitar vitimismo e resistência às pausas necessárias — forçar o movimento quando o campo pede pausa apenas desgasta e atrasa.' },
  13: { vibracao: 'Transformação radical e irreversível — não fim, mas encerramento de ciclos que libera energia criativa extraordinária. O que precisa se encerrar aqui abre espaço genuinamente novo.', desafio: 'Evitar apego ao passado e resistência ao inevitável — o apego ao que já encerrou adia o florescimento do que está nascendo.' },
  14: { vibracao: 'Alquimia interior: combinação paciente de opostos para criar equilíbrio. Favorece processos de cura e ajuste fino — pequenas correções consistentes produzem transformações profundas.', desafio: 'Evitar extremos e impaciência — tentar acelerar o processo alquímico geralmente desfaz o que estava sendo construído.' },
  15: { vibracao: 'Forças inconscientes que, reconhecidas e integradas, se convertem em potência genuína. Favorece liberação de dependências e transformação do que foi suprimido em força consciente.', desafio: 'Evitar escravidão a padrões não examinados — o que não é visto governa; o reconhecimento dissolve o que a negação amplifica.' },
  16: { vibracao: 'Ruptura súbita de estruturas falsas que revela verdades encobertadas. O que desmorona aqui libera espaço para reconstrução com muito mais integridade.', desafio: 'Evitar reconstruir os mesmos padrões após a queda — usar os mesmos tijolos falsos em outro lugar desperdiça o que a ruptura ensinou.' },
  17: { vibracao: 'Renovação, esperança fundamentada e generosidade sem cálculo após a tempestade. Favorece expressão autêntica e o potencial de ser referência de clareza para o entorno.', desafio: 'Evitar idealismo ingênuo — a esperança sem ação é fantasia; a Estrela pede que a fé se converta em movimento concreto.' },
  18: { vibracao: 'Governa o inconsciente, os pressentimentos e a percepção além do racional. Favorece criatividade emergente do subconsciente — o desafio é distinguir intuição genuína de projeção.', desafio: 'Evitar ilusões e confusão entre intuição e medo — o autoengano é o principal inimigo; o antídoto é a disposição radical de ver o que é real.' },
  19: { vibracao: 'Clareza, vitalidade e potencial de reconhecimento genuíno — uma das energias mais favoráveis do campo. Favorece realização, expansão pública e alegria de viver.', desafio: 'Evitar arrogância e dependência de reconhecimento externo — o Sol que não enxerga sombra está cego para metade da realidade.' },
  20: { vibracao: 'Despertar para um chamado maior e revisão honesta da própria trajetória. Favorece novos começos e a disposição de responder ao que a vida está pedindo com coragem.', desafio: 'Evitar autojulgamento severo e resistência ao recomeço — o peso do próprio passado não perdoado bloqueia a convocação para o futuro.' },
  21: { vibracao: 'Conclusão bem-sucedida de um ciclo e integração completa — uma das energias mais favoráveis do campo. Favorece reconhecimento de longo prazo e a sensação de estar no lugar certo.', desafio: 'Evitar estagnação após a conquista — a integração completa é o ponto de partida de uma jornada mais elevada, não o ponto final.' },
  22: { vibracao: 'Potencial puro: o ponto zero onde tudo é possível e nada está determinado ainda. Número Mestre 22, favorece saltos de fé e novos começos — pede presença e direcionamento consciente.', desafio: 'Evitar falta de direção e desconsideração das consequências — potencial infinito sem intenção se dispersa em infinitas direções e chega a lugar nenhum.' },
};

const ARCANO_NOMES: Record<number, string> = {
  1: 'O Mago',
  2: 'A Papisa',
  3: 'A Imperatriz',
  4: 'O Imperador',
  5: 'O Papa',
  6: 'Os Enamorados',
  7: 'O Carro',
  8: 'A Justiça',
  9: 'O Eremita',
  10: 'A Roda da Fortuna',
  11: 'A Força',
  12: 'O Enforcado',
  13: 'A Morte',
  14: 'A Temperança',
  15: 'O Diabo',
  16: 'A Torre',
  17: 'A Estrela',
  18: 'A Lua',
  19: 'O Sol',
  20: 'O Julgamento',
  21: 'O Mundo',
  22: 'O Louco',
};

function reduceToArcano(n: number): number {
  if (!n || n <= 0) return 22;
  let v = n;
  while (v > 22) v = String(v).split('').reduce((a, d) => a + parseInt(d), 0);
  return v || 22;
}

function getArcanoTransitoResumo(
  numero: number,
  arcanos?: Record<number, ArcanoInfo>
): string {
  if (numero <= 22 && ARCANO_RESUMO[numero]?.vibracao) {
    return ARCANO_RESUMO[numero]!.vibracao;
  }
  const desc = arcanos?.[numero]?.descricao;
  if (desc) return desc;
  const base = reduceToArcano(numero);
  return (
    ARCANO_RESUMO[base]?.vibracao ??
    'O Arcano de Trânsito revela a energia predominante neste ciclo cronológico atual.'
  );
}

const BLOQUEIO_SEQUENCIAS = ['111','222','333','444','555','666','777','888','999'];

/**
 * Constrói um Set de posições "linha,coluna" que pertencem a alguma sequência negativa.
 * Segue a lógica de formula.js: verifica cada tripla consecutiva em cada linha.
 */
function buildBloqueioPositions(linhas: number[][]): Set<string> {
  const positions = new Set<string>();
  for (let r = 0; r < linhas.length; r++) {
    const linha = linhas[r]!;
    for (let i = 0; i <= linha.length - 3; i++) {
      const tripla = `${linha[i]}${linha[i + 1]}${linha[i + 2]}`;
      if (BLOQUEIO_SEQUENCIAS.includes(tripla)) {
        // Destacar apenas as 3 primeiras células do bloqueio (ex.: "3333" → só 3 células)
        for (let k = i; k < i + 3; k++) positions.add(`${r},${k}`);
        // Avançar além dos dígitos extras sem marcá-los
        const digit = String(linha[i]);
        let skip = i + 3;
        while (skip < linha.length && String(linha[skip]) === digit) skip++;
        i = skip - 1;
      }
    }
  }
  return positions;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG do triângulo (lógica portada de formula.js)
// ─────────────────────────────────────────────────────────────────────────────
function TrianguloSVG({ triangulo, nome }: { triangulo: TrianguloData; nome: string }) {
  const { linhas } = triangulo;
  const nomeSemEspacos = nome.replace(/\s+/g, '').toUpperCase();
  const letras = nomeSemEspacos.split('');
  const N = linhas[0]?.length ?? 1;

  const ELEM = 50;         // px entre elementos (igual ao formula.js)
  const textWidth = (N - 1) * ELEM;
  const largura = textWidth + 120; // 60px padding on each side
  const altura = 80 + linhas.length * 30;
  const viewBox = `0 0 ${largura} ${altura}`;
  
  const midX = largura / 2;

  const bloqueioPos = buildBloqueioPositions(linhas);

  // Centro horizontal da primeira linha
  const xBase = midX - textWidth / 2;

  return (
    <div className="overflow-x-auto py-2 flex justify-center w-full touch-scroll-container">
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', maxWidth: `${largura}px`, minWidth: `${Math.min(largura, 280)}px` }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* ── Linha das letras ── */}
        {letras.map((letra, idx) => (
          <text
            key={`letter-${idx}`}
            x={xBase + idx * ELEM}
            y={28}
            fontSize="15"
            fontWeight="700"
            textAnchor="middle"
            fill="#D4AF37"
            fontFamily="Cinzel, Georgia, 'Times New Roman', serif"
          >
            {letra}
          </text>
        ))}

        {/* ── Linhas numéricas ── */}
        {linhas.map((linha, r) => {
          const yNum = 55 + r * 30;
          const xRowStart = midX - ((linha.length - 1) * ELEM) / 2;
          const isLastRow = r === linhas.length - 1;

          return linha.map((num, c) => {
            const x = xRowStart + c * ELEM;
            const key = `${r},${c}`;
            const isBloq = bloqueioPos.has(key);

            // Cores por camada
            const fill = isBloq
              ? '#FF6B6B'
              : isLastRow
                ? '#c084fc'
                : r === 0
                  ? '#fbbf24'   // amber-400 (base: valores das letras)
                  : '#9ca3af';  // gray-400 (camadas intermediárias)

            return (
              <g key={key}>
                {isBloq && (
                  <rect
                    x={x - 13}
                    y={yNum - 14}
                    width="26"
                    height="20"
                    rx="4"
                    fill="rgba(239,68,68,0.20)"
                    stroke="rgba(239,68,68,0.55)"
                    strokeWidth="1"
                  />
                )}
                {isLastRow && !isBloq && (
                  <circle
                    cx={x}
                    cy={yNum - 5}
                    r="13"
                    fill="rgba(192,132,252,0.15)"
                    stroke="rgba(192,132,252,0.40)"
                    strokeWidth="1"
                  />
                )}
                <text
                  x={x}
                  y={yNum}
                  fontSize={isLastRow ? '17' : '14'}
                  fontWeight={isBloq || isLastRow ? '700' : '400'}
                  textAnchor="middle"
                  fill={fill}
                  fontFamily="'Courier New', Courier, monospace"
                >
                  {num}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Painel de informações abaixo do SVG
// ─────────────────────────────────────────────────────────────────────────────
function TrianguloInfo({
  triangulo,
  arcanos,
  bloqueiosFiltrados,
  abaAtiva,
}: {
  triangulo: TrianguloData;
  arcanos?: Record<number, ArcanoInfo>;
  bloqueiosFiltrados: Bloqueio[];
  abaAtiva: string;
}) {
  const arcanoInfo =
    triangulo.arcanoRegente != null
      ? (arcanos?.[triangulo.arcanoRegente] ?? null)
      : null;
  const regenteNumero = arcanoInfo?.numero ?? triangulo.arcanoRegente;
  const regenteNome =
    arcanoInfo?.nome ??
    (regenteNumero != null ? ARCANO_NOMES[reduceToArcano(regenteNumero)] : undefined);
  const regenteResumo =
    regenteNumero != null
      ? (ARCANO_RESUMO[regenteNumero]?.vibracao ??
          ARCANO_RESUMO[reduceToArcano(regenteNumero)]?.vibracao ??
          arcanoInfo?.descricao ??
          '')
      : '';
  const passageList = triangulo.arcanosDePassagem ?? [];
  const passageCount = passageList.length;
  const cycleYears =
    passageCount > 0
      ? (90 / passageCount).toFixed(1).replace('.', ',')
      : null;
  const arcanoTransito =
    triangulo.arcanoAtual != null && triangulo.arcanoAtual.numero != null
      ? {
          ...triangulo.arcanoAtual,
          numero: triangulo.arcanoAtual.numero,
        }
      : null;
  const hasArcanosSection =
    regenteNumero != null ||
    arcanoTransito != null ||
    (passageCount > 0 && cycleYears != null);

  return (
    <div className="space-y-6 pt-4 sm:pt-5 text-left">
      {/* Seção Bloqueios (acima de Arcanos, direto no card pai) */}
      <div className="space-y-4 text-left">
        <div className="space-y-2">
          <h3 className="font-cinzel font-bold text-[#e5e2e1] leading-snug break-words text-left">
            Bloqueios <span className="text-[#f2ca50]">= {bloqueiosFiltrados.length}</span>
          </h3>
          <p className="nm-card-text">
            Sequências de três ou mais números repetidos nas linhas deste triângulo que indicam pontos de tensão ou travamento vibracional.
          </p>
        </div>

        {bloqueiosFiltrados.length > 0 ? (
          <div className="space-y-3">
            {bloqueiosFiltrados.map((b, i) => (
              <BloqueioCard
                key={i}
                bloqueio={b}
                contagemNaAba={b.repeticoesPortriangulo?.[abaAtiva] ?? 1}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="nm-card-text !text-emerald-400 font-medium">
              ✓ Não possui bloqueios neste triângulo
            </p>
          </div>
        )}
      </div>

      {/* Seção Arcanos (abaixo de Bloqueios, no mesmo card pai) */}
      {hasArcanosSection && (
        <div className="space-y-4 pt-2 text-left">
          <div className="space-y-2">
            <h3 className="font-cinzel font-bold text-[#e5e2e1] leading-snug break-words text-left">
              Arcanos
            </h3>
            <p className="nm-card-text">
              Os Arcanos são as forças arquetípicas que regem os ciclos de evolução deste triângulo, revelando a vibração dominante da pirâmide e o capítulo cronológico que você atravessa no momento.
            </p>
          </div>

          {regenteNumero != null && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 overflow-hidden">
              <div className="w-full text-left p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold font-mono shrink-0 border text-purple-300 border-purple-500/30 bg-purple-500/20">
                  {regenteNumero}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-200 text-sm leading-snug">
                    Arcano Regente {regenteNumero}{regenteNome ? ` — ${regenteNome}` : ''}
                  </p>
                </div>
              </div>
              {regenteResumo && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/5">
                  <p className="nm-card-text pt-4">{regenteResumo}</p>
                </div>
              )}
            </div>
          )}

          {(arcanoTransito || (passageCount > 0 && cycleYears)) && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 overflow-hidden">
              {arcanoTransito && (
                <div className="w-full text-left p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold font-mono shrink-0 border text-purple-300 border-purple-500/30 bg-purple-500/20">
                    {arcanoTransito.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-200 text-sm leading-snug">
                      Arcano de Trânsito {arcanoTransito.numero} — {arcanoTransito.periodo} (Idade {arcanoTransito.idadeInicio} a {arcanoTransito.idadeFim})
                    </p>
                  </div>
                </div>
              )}

              <div className={`px-4 pb-4 space-y-4 ${arcanoTransito ? 'border-t border-white/5' : 'pt-4'}`}>
                {arcanoTransito && (
                  <p className="nm-card-text pt-4">
                    {getArcanoTransitoResumo(arcanoTransito.numero, arcanos)}
                  </p>
                )}

                {passageCount > 0 && cycleYears && (
                  <div className="rounded-lg p-3.5 border bg-purple-500/10 border-purple-500/20 space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-purple-300">
                        Sequência de Passagem (Cronologia)
                      </p>
                      <p className="text-xs text-purple-300/80 italic mt-0.5">
                        Duração de cada ciclo: ~{cycleYears} anos
                      </p>
                    </div>

                    <p className="nm-card-text">
                      Mapa cronológico da sua jornada evolutiva: cada círculo
                      representa um ciclo de ~{cycleYears} anos, destacando as
                      energias vivenciadas no passado (em cinza), o portal
                      vibracional ativo no presente (em roxo) e os ciclos que
                      florescerão no futuro (em dourado).
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {passageList.map((raw, idx) => {
                        let state: 'past' | 'present' | 'future' = 'future';
                        const currentIndice = triangulo.arcanoAtual?.indice;
                        if (currentIndice !== undefined) {
                          if (idx < currentIndice) state = 'past';
                          else if (idx === currentIndice) state = 'present';
                          else state = 'future';
                        } else if (arcanoTransito && raw === arcanoTransito.numero) {
                          state = 'present';
                        }

                        const isAtual = state === 'present';
                        const isPast = state === 'past';

                        return (
                          <span
                            key={idx}
                            title={`Arcano ${raw}`}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border ${
                              isAtual
                                ? 'bg-purple-500 text-white border-purple-500'
                                : isPast
                                  ? 'bg-[#F3F4F6]/10 text-gray-500 border-gray-600/50'
                                  : 'bg-[#FFFDF0]/10 text-[#f2ca50] border-[#D4AF37]/50'
                            }`}
                          >
                            {raw}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F3F4F6]/10 border border-gray-600/50" />
                        <span className="text-xs text-gray-400">
                          Ciclos já vivenciados (Passado)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-xs text-gray-400">
                          Momento ativo na sua vida (Presente)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFFDF0]/10 border border-[#D4AF37]/50" />
                        <span className="text-xs text-gray-400">
                          Ciclos futuros de evolução (Futuro)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card de bloqueio expandível
// ─────────────────────────────────────────────────────────────────────────────
function BloqueioCard({ bloqueio, contagemNaAba }: { bloqueio: Bloqueio; contagemNaAba: number }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 overflow-hidden">
      <button
        type="button"
        className="w-full text-left p-4 flex items-center justify-between gap-4"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold font-mono shrink-0 border text-red-300 border-red-500/30 bg-red-500/20">
            {bloqueio.codigo}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-200 text-sm leading-snug">
              {bloqueio.titulo}
              {contagemNaAba > 1 && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/25 text-red-300 border border-red-500/40 align-middle">
                  {contagemNaAba}×
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {bloqueio.triangulos.map((t, i) => {
                const count = bloqueio.repeticoesPortriangulo?.[t] ?? 1;
                return (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">
                    {TIPO_LABEL[t]?.label ?? t}{count > 1 ? ` (${count}×)` : ''}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <span className="text-[#D4AF37] shrink-0">{expandido ? '▲' : '▼'}</span>
      </button>

      {expandido && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          {(() => {
            let displayDesc = bloqueio.descricao;
            if (displayDesc.includes('O antídoto é')) {
              displayDesc = displayDesc.split('O antídoto é')[0].trim();
            }
            return (
              <p className="nm-card-text pt-4">{displayDesc}</p>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function TriangleVisualization({ vida, pessoal, social, destino, bloqueios, nome, productType, isFreeAnalysis, arcanos, descricaoDetalhada, onlyVida = false }: Props) {
  const tabs = ['vida', 'pessoal', 'social', 'destino'] as const;
  const [aba, setAba] = useState<typeof tabs[number]>('vida');

  const triangulosMap = { vida, pessoal, social, destino };
  const triangulo = triangulosMap[aba];
  const bloqueiosDaAba = bloqueios.filter(b => b.triangulos?.includes(aba));

  const NOME_COMPLETO: Record<string, string> = {
    pessoal: 'Triângulo Pessoal',
    social: 'Triângulo Social',
    destino: 'Triângulo do Destino',
  };

  const isLocked = isFreeAnalysis && aba !== 'vida';

  if (onlyVida) {
    const bloqueiosVida = bloqueios.filter(b => b.triangulos?.includes('vida'));
    return (
      <div className="space-y-5 text-left">
        <div className="space-y-2 text-left">
          <p className="nm-card-text">
            {descricaoDetalhada?.vida ?? getDescricao('vida', productType)}
          </p>
          <p className="text-xs text-[#e5e2e1]/65 leading-relaxed text-left">
            Entra diretamente no cálculo do Score Cabalístico; os triângulos Pessoal, Social e do Destino ficam completos no seu PDF.
          </p>
        </div>

        <div className="rounded-xl flex justify-center">
          <TrianguloSVG triangulo={vida} nome={nome} />
        </div>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2.5 px-2 pb-1 text-[13px]">
          {LEGENDA_VIDA.map(item => (
            <span key={item.label} className="inline-flex items-center gap-2 min-w-0">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ borderColor: item.stroke, borderWidth: 1.5, borderStyle: 'solid', background: item.bg }}
                aria-hidden="true"
              />
              <span className="text-[#e5e2e1] font-medium">{item.label}</span>
            </span>
          ))}
        </div>

        <TrianguloInfo triangulo={vida} arcanos={arcanos} bloqueiosFiltrados={bloqueiosVida} abaAtiva="vida" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legenda de cores */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400/60 inline-block" />
          Valores das letras
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-400/40 inline-block" />
          Reduções intermediárias
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-400/60 inline-block" />
          Arcano Regente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500/60 inline-block" />
          Bloqueio energético
        </span>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap justify-center gap-2 w-full">
        {tabs.map(t => {
          const info = TIPO_LABEL[t]!;
          const tri = triangulosMap[t];
          const temBloqueio = tri.sequenciasNegativas.length > 0;
          const locked = isFreeAnalysis && t !== 'vida';
          return (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={`
                flex-auto flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 min-w-[105px] sm:min-w-[130px] whitespace-nowrap
                ${aba === t
                  ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}
              `}
            >
              <span>{locked ? '🔒' : info.emoji}</span>
              <span>{info.label}</span>
              {temBloqueio && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" title="Bloqueio detectado" />
              )}
            </button>
          );
        })}
      </div>

      {/* Descrição da aba */}
      <div className="rounded-xl bg-white/[0.03] p-3 sm:p-5">
        <div className="mb-2">
          {aba === 'vida' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-2.5 py-0.5 rounded-full">
              ✦ Entra no cálculo do Score Cabalístico
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 rounded-full">
              ◈ Leitura complementar (sem dedução de pontos no score)
            </span>
          )}
        </div>
        <p className="nm-card-text">
          {descricaoDetalhada?.[aba] ?? getDescricao(aba, productType)}
        </p>
      </div>

      {/* Conteúdo: locked ou normal */}
      {isLocked ? (
        <div className="rounded-2xl bg-white/3 border border-[#bea5ff]/20 py-12 px-6 flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">🔒</span>
          <p className="text-gray-300 font-medium">
            {NOME_COMPLETO[aba]} disponível na Harmonização Completa
          </p>
          <p className="text-gray-500 text-sm max-w-sm">
            Este triângulo revela dimensões mais profundas da sua energia — leitura completa incluída no Nome Social.
          </p>
          <a
            href="/nome-social"
            className="mt-2 inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#f2ca50] transition-all duration-300 hover:scale-105"
          >
            ✦ Ver Harmonização Completa
          </a>
        </div>
      ) : (
        <>
          {/* SVG do triângulo */}
          <div className="rounded-xl flex justify-center">
            <TrianguloSVG triangulo={triangulo} nome={nome} />
          </div>

          {/* Arcano regente + bloqueios do triângulo selecionado */}
          <TrianguloInfo triangulo={triangulo} arcanos={arcanos} bloqueiosFiltrados={bloqueiosDaAba} abaAtiva={aba} />
        </>
      )}
    </div>
  );
}
