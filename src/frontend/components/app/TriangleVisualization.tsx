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
  aspectoSaude: string;
  triangulos: string[];
  repeticoesPortriangulo?: Partial<Record<string, number>>;
  totalOcorrencias?: number;
}

interface ArcanoAtualInfo {
  numero: number | null;
  periodo: string;
  idadeInicio: number;
  idadeFim: number;
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
}

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

function reduceToArcano(n: number): number {
  if (!n || n <= 0) return 22;
  let v = n;
  while (v > 22) v = String(v).split('').reduce((a, d) => a + parseInt(d), 0);
  return v || 22;
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
    <div className="overflow-x-auto py-2 flex justify-center w-full">
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', maxWidth: `${largura}px` }}
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
  const arcanoInfo = triangulo.arcanoRegente != null
    ? (arcanos?.[triangulo.arcanoRegente] ?? null)
    : null;

  return (
    <div className="space-y-4 mt-4">
      {/* Arcano Regente — bloco expandido */}
      {arcanoInfo ? (
        <div className="rounded-xl bg-[#1a0533]/60 border border-purple-500/30 p-3 sm:p-5">
          <p className="text-[10px] text-purple-400 font-medium uppercase tracking-[0.15em] mb-3">
            Arcano Regente — {arcanoInfo.numero}: {arcanoInfo.nome}
          </p>
          <div className="inline-block px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/20 mb-4">
            <span className="text-sm font-medium text-purple-200">{arcanoInfo.palavraChave}</span>
          </div>
          <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1.5 font-medium">Vibração Dominante</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            {ARCANO_RESUMO[arcanoInfo.numero]?.vibracao ?? arcanoInfo.descricao}
          </p>
          <div className="rounded-lg bg-purple-900/30 border border-purple-500/20 p-3">
            <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1.5 font-medium">Desafio a Integrar</p>
            <p className="text-sm text-purple-200 italic leading-relaxed">
              {ARCANO_RESUMO[arcanoInfo.numero]?.desafio ?? arcanoInfo.desafio}
            </p>
          </div>
        </div>
      ) : triangulo.arcanoRegente != null ? (
        <div className="rounded-xl bg-white/5 border border-purple-500/20 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Arcano Regente</p>
          <p className="font-cinzel text-2xl font-bold text-purple-300">{triangulo.arcanoRegente}</p>
        </div>
      ) : null}

      {/* Arcano de Trânsito + Sequência de Passagem */}
      {triangulo.arcanoAtual?.numero != null && (
        <div className="rounded-xl bg-[#0d0d1a]/70 border border-purple-500/20 p-4">
          <p className="text-[10px] text-purple-400 font-medium uppercase tracking-[0.15em] mb-3">
            Arcano de Trânsito
          </p>
          <div className="flex items-start gap-3 mb-3">
            <span className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-400/40 flex items-center justify-center font-bold text-purple-200 text-sm shrink-0">
              {reduceToArcano(triangulo.arcanoAtual.numero)}
            </span>
            <div>
              <p className="text-sm text-gray-200 font-medium leading-snug">
                Arcano {reduceToArcano(triangulo.arcanoAtual.numero)} — {ARCANO_RESUMO[reduceToArcano(triangulo.arcanoAtual.numero)]?.vibracao.split('.')[0] ?? ''}
              </p>
              <p className="text-xs text-purple-400/70 mt-0.5">
                {triangulo.arcanoAtual.periodo} · Idade {triangulo.arcanoAtual.idadeInicio}–{triangulo.arcanoAtual.idadeFim}
              </p>
            </div>
          </div>

          {triangulo.arcanosDePassagem && triangulo.arcanosDePassagem.length > 0 && (
            <>
              <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-2 mt-1">
                Sequência de Passagem (Cronologia)
              </p>
              <p className="text-xs text-gray-400/80 italic mb-3">
                Duração de cada ciclo: ~{(90 / triangulo.arcanosDePassagem.length).toFixed(1).replace('.', ',')} anos
              </p>
              <p className="text-sm text-gray-300 leading-relaxed mb-4 text-justify">
                Os Arcanos de Passagem representam o mapa do tempo e a jornada evolutiva ao longo de toda a sua existência. Cada círculo abaixo corresponde a um ciclo vibracional de aproximadamente {(90 / triangulo.arcanosDePassagem.length).toFixed(1).replace('.', ',')} anos. Esta ordem cronológica descreve as energias que governaram o seu passado (em cinza), o portal vibracional ativo que você está atravessando no seu presente (em roxo) e as sementes do destino que florescerão no seu futuro (em dourado).
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {triangulo.arcanosDePassagem.map((raw, idx) => {
                  const reduced = reduceToArcano(raw);
                  
                  let state: 'past' | 'present' | 'future' = 'future';
                  const currentArcano = triangulo.arcanoAtual as any;
                  if (currentArcano && currentArcano.indice !== undefined) {
                    if (idx < currentArcano.indice) state = 'past';
                    else if (idx === currentArcano.indice) state = 'present';
                    else state = 'future';
                  } else if (triangulo.arcanoAtual?.numero) {
                    const isAtual = reduced === reduceToArcano(triangulo.arcanoAtual.numero);
                    if (isAtual) state = 'present';
                  }

                  const isAtual = state === 'present';
                  const isPast = state === 'past';

                  return (
                    <span
                      key={idx}
                      title={`Arcano ${reduced}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border ${
                        isAtual
                          ? 'bg-purple-500 text-white border-purple-500'
                          : isPast
                            ? 'bg-[#F3F4F6]/10 text-gray-500 border-gray-600/50'
                            : 'bg-[#FFFDF0]/10 text-[#f2ca50] border-[#D4AF37]/50'
                      }`}
                    >
                      {reduced}
                    </span>
                  );
                })}
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F3F4F6]/10 border border-gray-600/50" />
                  <span className="text-[10px] text-gray-400">Ciclos já vivenciados (Passado)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-[10px] text-gray-400">Momento ativo (Presente)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFFDF0]/10 border border-[#D4AF37]/50" />
                  <span className="text-[10px] text-gray-400">Ciclos futuros de evolução (Futuro)</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bloqueios do triângulo selecionado */}
      {bloqueiosFiltrados.length > 0 ? (
        <div className="space-y-3">
          {(() => {
            const totalOcorr = bloqueiosFiltrados.reduce(
              (sum, b) => sum + (b.repeticoesPortriangulo?.[abaAtiva] ?? 1),
              0
            );
            const temRepetidos = totalOcorr > bloqueiosFiltrados.length;
            return (
              <p className="text-xs text-red-400 font-medium uppercase tracking-[0.12em] px-1">
                ⚠ {bloqueiosFiltrados.length} bloqueio{bloqueiosFiltrados.length > 1 ? 's' : ''} neste triângulo
                {temRepetidos && (
                  <span className="ml-1 normal-case text-red-300 font-normal">
                    ({totalOcorr} ocorrências)
                  </span>
                )}
              </p>
            );
          })()}
          {bloqueiosFiltrados.map((b, i) => (
            <BloqueioCard key={i} bloqueio={b} contagemNaAba={b.repeticoesPortriangulo?.[abaAtiva] ?? 1} abaAtiva={abaAtiva} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-emerald-400">✓ Sem bloqueios neste triângulo</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card de bloqueio expandível
// ─────────────────────────────────────────────────────────────────────────────
function BloqueioCard({ bloqueio, contagemNaAba, abaAtiva }: { bloqueio: Bloqueio; contagemNaAba: number; abaAtiva: string }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-start justify-between gap-4"
        onClick={() => setExpandido(!expandido)}
      >
        <div>
          <span className="font-mono text-red-400 text-sm font-bold mr-1">{bloqueio.codigo}</span>
          {contagemNaAba > 1 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/25 text-red-300 border border-red-500/40 mr-2 align-middle">
              {contagemNaAba}×
            </span>
          )}
          <span className="text-gray-200 font-medium">{bloqueio.titulo}</span>
          <div className="flex flex-wrap gap-1 mt-1">
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
        <span className="text-[#D4AF37] shrink-0">{expandido ? '▲' : '▼'}</span>
      </button>

      {expandido && (
        <div className="px-4 pb-4 space-y-3 border-t border-red-500/10">
          {(() => {
            const interpretacao = obterInterpretacaoEspecifica(bloqueio.codigo, abaAtiva);
            let displayDesc = interpretacao ? `${bloqueio.descricao} ${interpretacao}` : bloqueio.descricao;
            if (displayDesc.includes('O antídoto é')) {
              displayDesc = displayDesc.split('O antídoto é')[0].trim();
            }
            return (
              <p className="text-gray-300 text-sm leading-relaxed pt-3">{displayDesc}</p>
            );
          })()}
          <div className="rounded-lg p-3 bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-400 uppercase tracking-wider mb-1">Aspecto de Saúde</p>
            <p className="text-yellow-200 text-sm">{bloqueio.aspectoSaude}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function TriangleVisualization({ vida, pessoal, social, destino, bloqueios, nome, productType, isFreeAnalysis, arcanos, descricaoDetalhada }: Props) {
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
                flex-auto flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 min-w-[130px] whitespace-nowrap
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
        <p className="text-sm text-gray-400 leading-relaxed">
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
