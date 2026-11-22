/**
 * NomeBebeChatPDF — manual em PDF para os pais do caminho do bebê (DEV-330).
 *
 * Independente do `NomeBebePDF.tsx` legado. Segue as 7 páginas do layout base aprovado
 * (`docs/architecture/pdf-layout-base/Bebe*.dc.html`), com paleta pastel por sexo
 * (menina rosa, menino azul, indefinição neutro verde-menta/lavanda) e linguagem
 * acolhedora de tendências para os pais.
 *
 * Ordem das 7 páginas:
 *   1. Capa pastel
 *   2. Carta aos pais + Como usar este manual + Sobre o registro (sem prazos numéricos)
 *   3. Parte 1 · Quem está chegando (Destino + selo de dias se data prevista + estrela)
 *   4. Parte 2 · O nome (tabela comparativa + tira dos dias possíveis do parto se prevista)
 *   5. Parte 3 · Entender [nome] (6 cards com dica prática)
 *   6. Parte 4 · Crescer juntos (fases + qualidades para cultivar + caminho holístico + cores)
 *   7. Para guardar (primeira foto + história do nome + carta para quando crescer)
 */
import { Document, Page, View, Text, Svg, Circle, Path, Polygon, Text as SvgText } from '@react-pdf/renderer';
import { getScoreTierVisual } from '../landing/score-tier-visual';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT, formatDate } from './shared/PDFFonts';
import { normalizeBirthDateForNumerology } from './shared/pdfBirthDate';
import type { ProductPDFProps } from './shared/PDFTypes';
import { AVISO_AUTOCONHECIMENTO } from '../../../shared/legal';
import { calcularExpressao } from '../../../backend/numerology/numbers';
import {
  avaliarCandidatoLivre,
  candidatoOfertavel,
  NOTA_MINIMA_NOME_LIVRE,
  NOTA_MINIMA_NOME_NOVO,
} from '../../../backend/numerology/products/shared/avaliar-candidato';
import { gerarJanelaDatas } from '../../../backend/numerology/products/nome-bebe-chat/janela';
import {
  CORES_HARMONIA_BEBE,
  DESTINO_BEBE,
  EXPRESSAO_BEBE,
  FASES_BEBE,
  MISSAO_BEBE,
  MOTIVACAO_BEBE,
  QUALIDADE_LICAO_BEBE,
  adaptGeneroTextoBebe,
  chaveNumeroBebe,
  chaveSimplesBebe,
  pronomeBebe,
  textoConvivenciaPaisBebe,
} from '../../../backend/numerology/products/nome-bebe-chat/textos-pais';
import { avisoBebePorSituacao } from '../../../shared/interactive-engine/ramos/bebe';
import type { NomesBebePersistidos, NomeBebeItemPersistido } from '../../../shared/chat-analysis-persist';
import type { PerfilChatPersistido } from '../../../shared/interactive-engine/questionnaire-map';
import { COR_FIXA, faixaNotaPapel } from './layout/pdfLayoutTheme';

type TomSexo = 'menina' | 'menino' | 'indefinido';

interface PaletaBebe {
  fundo: string;
  suave: string;
  suave2: string;
  acento: string;
  texto: string;
  apagado: string;
  linha: string;
}

const PALETA_POR_SEXO: Record<TomSexo, PaletaBebe> = {
  menina: {
    fundo: '#FFF6F4',
    suave: '#FCE3E7',
    suave2: '#F3E9FB',
    acento: '#D98A99',
    texto: '#9E4A5B',
    apagado: '#8C6B70',
    linha: '#EADFDC',
  },
  menino: {
    fundo: '#F5F9FD',
    suave: '#DDEBF8',
    suave2: '#EAF5F0',
    acento: '#7FA8CE',
    texto: '#3F6E96',
    apagado: '#5F7487',
    linha: '#DCE6F0',
  },
  indefinido: {
    fundo: '#F6FAF7',
    suave: '#DDF0E6',
    suave2: '#EFE9FB',
    acento: '#86BBA2',
    texto: '#3F7A61',
    apagado: '#5E7468',
    linha: '#DCE8E1',
  },
};

const TINTA_BEBE = '#4A3A36';
const CORPO_BEBE = '#5C4B46';

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome.trim();
}

function normalizar(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function saudacaoPais(mae: string | null, pai: string | null): {
  capaFeitoPor: string;
  cartaTitulo: string;
  assinaturaCarta: string;
} {
  const m = mae ? primeiroNome(mae) : null;
  const p = pai ? primeiroNome(pai) : null;
  if (m && p) {
    return {
      capaFeitoPor: `feito por ${m} e ${p}`,
      cartaTitulo: `Para ${m} e ${p}`,
      assinaturaCarta: `Com amor, ${m} e ${p}`,
    };
  }
  if (m) {
    return {
      capaFeitoPor: `feito com amor por ${m}`,
      cartaTitulo: `Para ${m}`,
      assinaturaCarta: `Com amor, ${m}`,
    };
  }
  if (p) {
    return {
      capaFeitoPor: `feito com amor por ${p}`,
      cartaTitulo: `Para ${p}`,
      assinaturaCarta: `Com amor, ${p}`,
    };
  }
  return {
    capaFeitoPor: 'feito com carinho para a família',
    cartaTitulo: 'Para a família',
    assinaturaCarta: 'Com amor, da sua família',
  };
}

function CabecalhoPastel({
  paleta,
  subtitulo,
}: {
  paleta: PaletaBebe;
  subtitulo: string;
}) {
  return (
    <View
      fixed
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <Text style={{ fontFamily: TITLE_FONT, fontSize: 10, letterSpacing: 1.8, color: paleta.texto }}>
        NOME MAGNÉTICO
      </Text>
      <Text style={{ fontFamily: BODY_FONT, fontSize: 8.5, color: paleta.apagado }}>
        {subtitulo}
      </Text>
    </View>
  );
}

function RodapePastel({
  paleta,
  notaRodape,
}: {
  paleta: PaletaBebe;
  notaRodape?: string;
}) {
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        bottom: 24,
        left: 46,
        right: 46,
        gap: 4,
      }}
    >
      <Text style={{ fontFamily: BODY_FONT, fontSize: 6.2, color: paleta.apagado, lineHeight: 1.3 }}>
        {AVISO_AUTOCONHECIMENTO}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: BODY_FONT, fontSize: 8, color: paleta.apagado }}>
          {notaRodape ?? 'Fala de tendências e qualidades, nunca de destino fechado.'}
        </Text>
        <Text
          style={{ fontFamily: BODY_FONT, fontSize: 8, color: paleta.apagado }}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </View>
    </View>
  );
}

function EstrelaBebe({
  score,
  destino,
  expressao,
  motivacao,
  missao,
  impressao,
}: {
  score: number;
  destino: number;
  expressao: number;
  motivacao: number;
  missao: number;
  impressao: number;
}) {
  const tier = getScoreTierVisual(score);
  const faixa = faixaNotaPapel(score);
  const cx = 150;
  const cy = 145;
  const rOut = 104;
  const rIn = 42;
  const pts: string[] = [];
  const pontas: Array<{ x: number; y: number; val: number }> = [];
  const valores = [destino, expressao, motivacao, missao, impressao];

  for (let i = 0; i < 5; i++) {
    const aOut = ((-90 + i * 72) * Math.PI) / 180;
    const xOut = cx + rOut * Math.cos(aOut);
    const yOut = cy + rOut * Math.sin(aOut);
    pts.push(`${xOut.toFixed(1)},${yOut.toFixed(1)}`);
    pontas.push({ x: xOut, y: yOut, val: valores[i]! });
    const aIn = ((-90 + 36 + i * 72) * Math.PI) / 180;
    pts.push(`${(cx + rIn * Math.cos(aIn)).toFixed(1)},${(cy + rIn * Math.sin(aIn)).toFixed(1)}`);
  }

  return (
    <Svg width={215} height={208} viewBox="0 0 300 290">
      <Polygon
        points={pts.join(' ')}
        fill={tier.stroke}
        fillOpacity={0.14}
        stroke={tier.stroke}
        strokeWidth={2.2}
      />
      {pontas.map((pt, idx) => (
        <Circle
          key={idx}
          cx={pt.x}
          cy={pt.y}
          r={17}
          fill="#FFFFFF"
          stroke={tier.stroke}
          strokeWidth={1.6}
        />
      ))}
      {pontas.map((pt, idx) => (
        <SvgText
          key={`t-${idx}`}
          x={pt.x}
          y={pt.y + 5.5}
          textAnchor="middle"
          fill={faixa.texto}
          style={{ fontFamily: TITLE_FONT, fontSize: 15 }}
        >
          {String(pt.val)}
        </SvgText>
      ))}
    </Svg>
  );
}

function getStarLabels(
  destino: number,
  expressao: number,
  motivacao: number,
  missao: number,
  impressao: number,
) {
  return `Topo: Destino ${destino} · Horário: Expressão ${expressao}, Motivação ${motivacao}, Missão ${missao}, Impressão ${impressao}.`;
}

export function NomeBebeChatPDF({ analysis }: ProductPDFProps) {
  const freqData = (analysis.frequencias_numeros as Record<string, unknown> | null) ?? {};
  const perfilChat = (freqData.perfilChat as PerfilChatPersistido | undefined) ?? {};
  const nomesSalvos = (freqData.nomesBebe as NomesBebePersistidos | undefined) ?? null;

  const sexoRaw = perfilChat.bebeSexo;
  const sexo: TomSexo = sexoRaw === 'menina' || sexoRaw === 'menino' ? sexoRaw : 'indefinido';
  const paleta = PALETA_POR_SEXO[sexo];
  const pr = pronomeBebe(sexo);

  const nomeEscolhido = (
    nomesSalvos?.escolhido?.trim() ||
    (typeof freqData.selectedNomeSocial === 'string' ? freqData.selectedNomeSocial.trim() : '') ||
    perfilChat.bebeNomeRegistrado?.trim() ||
    analysis.nome_completo
  ).trim();
  const primeiro = primeiroNome(nomeEscolhido);

  const mae = perfilChat.bebeMae?.trim() || null;
  const pai = perfilChat.bebePai?.trim() || null;
  const paisTexto = saudacaoPais(mae, pai);

  const dataBruta = perfilChat.bebeData?.trim() || formatDate(analysis.data_nascimento) || '';
  const dataRaw = normalizeBirthDateForNumerology(dataBruta);
  const dataDisplay = formatDate(dataBruta) || dataRaw;

  const isDataPrevista =
    perfilChat.bebeSituacao === 'nao_nasceu' && perfilChat.bebeDataTipo === 'prevista';
  const avisoSituacao = avisoBebePorSituacao(perfilChat.bebeSituacao);
  const textoRegistro =
    avisoSituacao ||
    'As regras de registro e de mudança de nome são do cartório da sua cidade. Confirme sempre no cartório ou com um advogado de sua confiança antes do registro.';

  const av = avaliarCandidatoLivre(nomeEscolhido, dataRaw);
  const faixaEscolhido = faixaNotaPapel(av.score);
  const destChave = chaveNumeroBebe(av.destino);
  const expChave = chaveNumeroBebe(av.expressao);
  const motChave = chaveNumeroBebe(av.motivacao);
  const misChave = chaveNumeroBebe(av.missao);
  const expSimples = chaveSimplesBebe(av.expressao);

  const destinoCopy = DESTINO_BEBE[destChave] ?? DESTINO_BEBE[1]!;
  const expressaoCopy = EXPRESSAO_BEBE[expChave] ?? EXPRESSAO_BEBE[1]!;
  const motivacaoCopy = MOTIVACAO_BEBE[motChave] ?? MOTIVACAO_BEBE[1]!;
  const missaoCopy = MISSAO_BEBE[misChave] ?? MISSAO_BEBE[1]!;
  const fases = FASES_BEBE[expSimples] ?? FASES_BEBE[1]!;
  const coresHarmonia = CORES_HARMONIA_BEBE[expSimples] ?? CORES_HARMONIA_BEBE[6]!;

  // Expressão dos pais (para o card "Vocês e [nome]").
  const expressaoPais = [mae, pai]
    .filter((n): n is string => Boolean(n))
    .map((n) => calcularExpressao(n));
  const convivencia = textoConvivenciaPaisBebe(expressaoPais, av.expressao, av.destino, primeiro);

  // Lições kármicas como qualidades positivas para cultivar juntos.
  const licoesLista = av.licoesCarmicas
    .map((l) => QUALIDADE_LICAO_BEBE[l.numero])
    .filter((x): x is string => Boolean(x));

  // Janela de 29 dias (SOMENTE quando data prevista).
  const seusSalvos = nomesSalvos?.seusNomes ?? [];
  const sugestoesSalvas = nomesSalvos?.sugestoes ?? [];
  const ehSugestaoEscolhida = sugestoesSalvas.some((s) => normalizar(s.nome) === normalizar(nomeEscolhido));
  const notaMinimaStrip = ehSugestaoEscolhida ? NOTA_MINIMA_NOME_NOVO : NOTA_MINIMA_NOME_LIVRE;

  const janelaDatas = isDataPrevista ? gerarJanelaDatas(dataRaw) : null;
  const tiraDias = janelaDatas
    ? janelaDatas.datas.map((d, idx) => {
        const delta = idx - Math.floor(janelaDatas.datas.length / 2);
        const avDia = avaliarCandidatoLivre(nomeEscolhido, d);
        const bom = candidatoOfertavel(avDia, notaMinimaStrip);
        return {
          rotulo: delta === 0 ? '0' : delta > 0 ? `+${delta}` : String(delta),
          centro: delta === 0,
          bom,
        };
      })
    : [];

  const diasBonsContados = tiraDias.filter((d) => d.bom).length;
  const diasTotaisContados = tiraDias.length;

  // Tabela comparativa (Parte 2 · O nome)
  interface LinhaComparativaBebe {
    nome: string;
    origem: string;
    nota: number;
    bloqueios: string[];
    diasTexto: string;
  }

  const linhasTabela: LinhaComparativaBebe[] = [];
  const vistosTabela = new Set<string>();
  const adicionaLinha = (item: NomeBebeItemPersistido, origemPadrao: string) => {
    const k = normalizar(item.nome);
    if (vistosTabela.has(k)) return;
    vistosTabela.add(k);
    const avLinha =
      item.bloqueios.length > 0 || item.nota > 0
        ? item
        : (() => {
            const c = avaliarCandidatoLivre(item.nome, dataRaw);
            return {
              ...item,
              nota: c.score,
              bloqueios: c.bloqueios.map((b) => b.codigo),
            };
          })();
    const diasText = isDataPrevista
      ? item.diasBons != null && item.diasTotal != null
        ? `Bom em ${item.diasBons} de ${item.diasTotal}`
        : `${diasBonsContados} de ${diasTotaisContados}`
      : avLinha.bloqueios.length > 0
        ? 'Com atenção'
        : 'Sem bloqueios';
    linhasTabela.push({
      nome: item.nome,
      origem: k === normalizar(nomeEscolhido) ? 'Escolhido' : origemPadrao,
      nota: avLinha.nota,
      bloqueios: avLinha.bloqueios,
      diasTexto: diasText,
    });
  };

  // Escolhido sempre em primeiro
  const escolhidoSalvo = [...seusSalvos, ...sugestoesSalvas].find(
    (s) => normalizar(s.nome) === normalizar(nomeEscolhido),
  );
  if (escolhidoSalvo) {
    adicionaLinha(escolhidoSalvo, 'Escolhido');
  } else {
    linhasTabela.push({
      nome: nomeEscolhido,
      origem: 'Escolhido',
      nota: av.score,
      bloqueios: av.bloqueios.map((b) => b.codigo),
      diasTexto: isDataPrevista
        ? `Bom em ${diasBonsContados} de ${diasTotaisContados}`
        : av.temBloqueio
          ? 'Com atenção'
          : 'Sem bloqueios',
    });
    vistosTabela.add(normalizar(nomeEscolhido));
  }

  for (const s of seusSalvos.slice(0, 4)) adicionaLinha(s, 'Vocês pensaram');
  for (const s of sugestoesSalvas.slice(0, 4)) adicionaLinha(s, 'Sugestão');

  const pageStyle = {
    backgroundColor: paleta.fundo,
    paddingTop: 44,
    paddingBottom: 62,
    paddingHorizontal: 46,
    fontFamily: BODY_FONT,
    color: CORPO_BEBE,
  };

  const tagParte = (txt: string) => (
    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
      <View style={{ backgroundColor: paleta.texto, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
        <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8, letterSpacing: 1.3, textTransform: 'uppercase', color: '#FFFFFF' }}>
          {txt}
        </Text>
      </View>
    </View>
  );

  const cardsEntender = [
    {
      num: av.expressao,
      titulo: `Como ${pr.elaEle} se expressa`,
      base: 'Expressão',
      texto: adaptGeneroTextoBebe(expressaoCopy.comoExpressa, sexo),
      dica: adaptGeneroTextoBebe(expressaoCopy.dicaExpressao, sexo),
    },
    {
      num: av.motivacao,
      titulo: 'O que move por dentro',
      base: 'Motivação',
      texto: adaptGeneroTextoBebe(motivacaoCopy.movePorDentro, sexo),
      dica: adaptGeneroTextoBebe(motivacaoCopy.dicaMove, sexo),
    },
    {
      num: av.motivacao,
      titulo: 'Como acolher',
      base: 'Motivação',
      texto: adaptGeneroTextoBebe(motivacaoCopy.comoAcolher, sexo),
      dica: adaptGeneroTextoBebe(motivacaoCopy.dicaAcolher, sexo),
    },
    {
      num: av.expressao,
      titulo: 'Como aprende e brinca',
      base: 'Expressão',
      texto: adaptGeneroTextoBebe(expressaoCopy.comoAprende, sexo),
      dica: adaptGeneroTextoBebe(expressaoCopy.dicaAprende, sexo),
    },
    {
      num: av.missao,
      titulo: 'Talentos para incentivar',
      base: 'Missão',
      texto: adaptGeneroTextoBebe(missaoCopy.talentos, sexo),
      dica: adaptGeneroTextoBebe(missaoCopy.dicaTalentos, sexo),
    },
    {
      num: av.destino,
      titulo: `Vocês e ${primeiro}`,
      base: 'Convivência em família',
      texto: convivencia.texto,
      dica: convivencia.dica,
    },
  ];

  const holistico = [
    {
      titulo: 'Acolher o nome',
      texto: `Digam o nome ${primeiro} com carinho nos primeiros dias e contem para ${pr.elaEle} por que o escolheram.`,
    },
    {
      titulo: 'Ambiente da casa',
      texto: `Um cantinho calmo, luz suave e objetos simples que ${pr.elaEle} possa explorar com tranquilidade.`,
    },
    {
      titulo: 'Palavras da família',
      texto: 'Escolham três palavras para guiar a casa: por exemplo, carinho, alegria e coragem.',
    },
    {
      titulo: 'Um ritual seu',
      texto: 'Uma canção, uma frase antes de dormir ou um gesto simples só de vocês.',
    },
  ];

  const pillDataCapa = isDataPrevista
    ? `Data prevista: ${dataDisplay} · calculado para os dias possíveis do parto`
    : `Data de nascimento: ${dataDisplay}`;

  return (
    <Document title={`Nome Magnético — ${nomeEscolhido}`} author="Nome Magnético">
      {/* PÁGINA 1 · CAPA PASTEL */}
      <Page
        size="A4"
        style={{
          backgroundColor: paleta.fundo,
          paddingTop: 52,
          paddingBottom: 44,
          paddingHorizontal: 46,
          justifyContent: 'space-between',
          fontFamily: BODY_FONT,
        }}
      >
        <View fixed style={{ position: 'absolute', top: -70, right: -80 }}>
          <Svg width={280} height={280} viewBox="0 0 280 280">
            <Circle cx={140} cy={140} r={140} fill={paleta.suave} />
          </Svg>
        </View>
        <View fixed style={{ position: 'absolute', bottom: -60, left: -70 }}>
          <Svg width={230} height={230} viewBox="0 0 230 230">
            <Circle cx={115} cy={115} r={115} fill={paleta.suave2} />
          </Svg>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 12, letterSpacing: 2, color: paleta.texto }}>
            NOME MAGNÉTICO
          </Text>
          <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8.5, letterSpacing: 1.3, textTransform: 'uppercase', color: paleta.apagado }}>
            Manual para os pais
          </Text>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
          <Svg width={118} height={118} viewBox="0 0 150 150" style={{ marginBottom: 18 }}>
            <Circle cx={75} cy={75} r={66} fill="#FFFFFF" fillOpacity={0.78} />
            <Path
              d="M75 108 C 40 84, 36 56, 56 48 C 66 44, 72 50, 75 56 C 78 50, 84 44, 94 48 C 114 56, 110 84, 75 108 Z"
              fill={paleta.acento}
              fillOpacity={0.88}
            />
            <Circle cx={112} cy={40} r={5} fill={paleta.acento} fillOpacity={0.55} />
            <Circle cx={36} cy={104} r={4} fill={paleta.acento} fillOpacity={0.45} />
          </Svg>

          <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: paleta.texto, marginBottom: 10 }}>
            O nome de
          </Text>
          <Text
            style={{
              fontFamily: TITLE_FONT,
              fontSize: nomeEscolhido.length > 22 ? 28 : 35,
              letterSpacing: 1.4,
              color: TINTA_BEBE,
              textAlign: 'center',
              lineHeight: 1.15,
              marginBottom: 14,
            }}
          >
            {nomeEscolhido}
          </Text>
          <Text
            style={{
              fontFamily: BODY_FONT,
              fontSize: 12.5,
              color: '#6B5A55',
              textAlign: 'center',
              lineHeight: 1.55,
              maxWidth: 380,
              marginBottom: 18,
            }}
          >
            Um manual de amor para receber você, {paisTexto.capaFeitoPor}.
          </Text>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 7 }}>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 9.5, color: paleta.texto }}>
              {pillDataCapa}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18 }}>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 8.5, color: '#7A6A65', lineHeight: 1.5, maxWidth: 340 }}>
            Ferramenta de autoconhecimento baseada na Numerologia Cabalística. Fala de tendências e qualidades, nunca de destino fechado.
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 8.5, color: '#7A6A65' }}>
            nomemagnetico.com.br
          </Text>
        </View>
      </Page>

      {/* PÁGINA 2 · CARTA AOS PAIS */}
      <Page size="A4" style={pageStyle}>
        <CabecalhoPastel paleta={paleta} subtitulo={`${primeiro} · Carta aos pais`} />

        <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, letterSpacing: 0.8, color: paleta.texto, marginBottom: 12 }}>
          {paisTexto.cartaTitulo}
        </Text>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, gap: 9, marginBottom: 16 }}>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 10, lineHeight: 1.6, color: CORPO_BEBE }}>
            Escolher um nome é um dos primeiros gestos de cuidado com {pr.umFilho}. É o som que {pr.elaEle} vai ouvir milhares de vezes, dito com carinho por quem ama.
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 10, lineHeight: 1.6, color: CORPO_BEBE }}>
            Este manual reúne o que a Numerologia Cabalística mostra sobre o nome {nomeEscolhido}: as qualidades que convida a florescer, como {pr.elaEle} tende a se expressar e o que pode ajudar vocês no dia a dia.
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 10, lineHeight: 1.6, color: CORPO_BEBE }}>
            Nada aqui é destino fechado. São pistas para observar, acolher e conversar. Quem {primeiro} vai ser, mostra para vocês aos poucos.
          </Text>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 12, color: paleta.texto, marginTop: 2 }}>
            Com carinho, Nome Magnético
          </Text>
        </View>

        <Text style={{ fontFamily: TITLE_FONT, fontSize: 14, color: TINTA_BEBE, marginBottom: 8 }}>
          Como usar este manual
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {[
            { t: '1 · Quem está chegando', d: 'O que a data revela, em linguagem simples.' },
            { t: '2 · O nome', d: 'O escolhido e a comparação com os que vocês pensaram.' },
            { t: `3 · Entender ${primeiro}`, d: `Como ${pr.elaEle} tende a se expressar, aprender e ser acolhid${sexo === 'menino' ? 'o' : 'a'}.` },
            { t: '4 · Crescer juntos', d: 'Qualidades para estimular, rituais e páginas para guardar.' },
          ].map((g) => (
            <View key={g.t} style={{ width: '48.5%', backgroundColor: paleta.suave, borderRadius: 16, padding: 12 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8.5, letterSpacing: 0.9, textTransform: 'uppercase', color: paleta.texto, marginBottom: 3 }}>
                {g.t}
              </Text>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 9, lineHeight: 1.5, color: CORPO_BEBE }}>
                {g.d}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 13 }}>
          <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 9.5, color: TINTA_BEBE, marginBottom: 3 }}>
            Sobre o registro
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 8.8, lineHeight: 1.5, color: CORPO_BEBE }}>
            {textoRegistro}
          </Text>
        </View>

        <RodapePastel paleta={paleta} />
      </Page>

      {/* PÁGINA 3 · PARTE 1 · QUEM ESTÁ CHEGANDO */}
      <Page size="A4" style={pageStyle}>
        <CabecalhoPastel paleta={paleta} subtitulo={`${primeiro} · Parte 1`} />

        {tagParte('Parte 1 · Quem está chegando')}
        <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, letterSpacing: 0.8, color: paleta.texto, marginBottom: 6 }}>
          O caminho de {primeiro}
        </Text>
        <Text style={{ fontFamily: BODY_FONT, fontSize: 9.8, lineHeight: 1.55, color: CORPO_BEBE, marginBottom: 14 }}>
          O Destino vem da data de nascimento e não muda com o nome. Ele mostra o tipo de caminho que {primeiro} tende a trilhar. O nome escolhido conversa com esse caminho.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: paleta.suave, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: TITLE_FONT, fontSize: 24, color: paleta.texto }}>{destChave}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', color: paleta.texto, marginBottom: 2 }}>
                Destino {destChave}
              </Text>
              <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 10.5, color: TINTA_BEBE, marginBottom: 3 }}>
                {destinoCopy.titulo}
              </Text>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 9, lineHeight: 1.45, color: CORPO_BEBE }}>
                {destinoCopy.resumo}
              </Text>
            </View>
          </View>

          {isDataPrevista && (
            <View style={{ width: 165, backgroundColor: '#D1FAE5', borderRadius: 18, padding: 14, justifyContent: 'center' }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8, letterSpacing: 0.9, textTransform: 'uppercase', color: '#047857', marginBottom: 3 }}>
                Dias possíveis do parto
              </Text>
              <Text style={{ fontFamily: TITLE_FONT, fontSize: 20, color: '#047857', marginBottom: 2 }}>
                {diasBonsContados} de {diasTotaisContados}
              </Text>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 8.5, color: '#047857' }}>
                dias em que o nome fica bom
              </Text>
            </View>
          )}
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <EstrelaBebe
            score={av.score}
            destino={av.destino}
            expressao={av.expressao}
            motivacao={av.motivacao}
            missao={av.missao}
            impressao={av.impressao}
          />
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: paleta.texto }}>
              A estrela do nome
            </Text>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 9.2, lineHeight: 1.5, color: CORPO_BEBE }}>
              No topo, o Destino. Em sentido horário: como {pr.elaEle} tende a se expressar, o que move por dentro, o propósito e a primeira impressão.
            </Text>
            <View style={{ backgroundColor: faixaEscolhido.fundo, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8.5, color: faixaEscolhido.texto }}>
                Nota {av.score} · {faixaEscolhido.rotulo} · {av.temBloqueio ? `${av.bloqueios.length} bloqueio(s)` : 'sem bloqueios'}
              </Text>
            </View>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 8, color: paleta.apagado, lineHeight: 1.4 }}>
              {getStarLabels(av.destino, av.expressao, av.motivacao, av.missao, av.impressao)}
            </Text>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 8, color: paleta.apagado }}>
              A cor da estrela segue a faixa da nota, a mesma do site.
            </Text>
          </View>
        </View>

        <RodapePastel paleta={paleta} />
      </Page>

      {/* PÁGINA 4 · PARTE 2 · O NOME */}
      <Page size="A4" style={pageStyle}>
        <CabecalhoPastel paleta={paleta} subtitulo={`${primeiro} · Parte 2`} />

        {tagParte('Parte 2 · O nome')}
        <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, letterSpacing: 0.8, color: paleta.texto, marginBottom: 6 }}>
          {nomeEscolhido}
        </Text>
        <Text style={{ fontFamily: BODY_FONT, fontSize: 9.5, lineHeight: 1.5, color: CORPO_BEBE, marginBottom: 12 }}>
          O nome escolhido, lado a lado com os nomes que vocês pensaram e com as sugestões. Os nomes digitados aparecem como são: se houver bloqueio, avisamos com transparência.
        </Text>

        <View style={{ marginBottom: 14, gap: 5 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 2 }}>
            <Text style={{ flex: 1, fontFamily: BODY_FONT_BOLD, fontSize: 7.5, letterSpacing: 0.9, textTransform: 'uppercase', color: paleta.apagado }}>Nome</Text>
            <Text style={{ width: 92, fontFamily: BODY_FONT_BOLD, fontSize: 7.5, letterSpacing: 0.9, textTransform: 'uppercase', color: paleta.apagado }}>Origem</Text>
            <Text style={{ width: 66, fontFamily: BODY_FONT_BOLD, fontSize: 7.5, letterSpacing: 0.9, textTransform: 'uppercase', color: paleta.apagado }}>Nota</Text>
            <Text style={{ width: 102, fontFamily: BODY_FONT_BOLD, fontSize: 7.5, letterSpacing: 0.9, textTransform: 'uppercase', color: paleta.apagado }}>
              {isDataPrevista ? 'Dias bons' : 'Leitura'}
            </Text>
          </View>

          {linhasTabela.slice(0, 6).map((linha) => {
            const faixaL = faixaNotaPapel(linha.nota);
            const temBloqueio = linha.bloqueios.length > 0;
            return (
              <View
                key={linha.nome}
                wrap={false}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 9.5, color: TINTA_BEBE }}>
                    {linha.nome}
                  </Text>
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 8, color: temBloqueio ? COR_FIXA.bloqueioTexto : '#6B5A55', marginTop: 1 }}>
                    {temBloqueio ? `Tem bloqueio: ${linha.bloqueios.join(', ')}` : `${faixaL.rotulo} · sem bloqueio`}
                  </Text>
                </View>
                <Text style={{ width: 92, fontFamily: BODY_FONT, fontSize: 8.5, color: '#6B5A55' }}>
                  {linha.origem}
                </Text>
                <View style={{ width: 66, alignItems: 'flex-start' }}>
                  <View style={{ backgroundColor: faixaL.fundo, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8.5, color: faixaL.texto }}>
                      {linha.nota}
                    </Text>
                  </View>
                </View>
                <Text style={{ width: 102, fontFamily: BODY_FONT, fontSize: 8.5, color: CORPO_BEBE }}>
                  {linha.diasTexto}
                </Text>
              </View>
            );
          })}
        </View>

        {isDataPrevista ? (
          <View>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 13.5, color: TINTA_BEBE, marginBottom: 4 }}>
              Os dias possíveis do parto
            </Text>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 9, lineHeight: 1.45, color: CORPO_BEBE, marginBottom: 8 }}>
              Cada quadrado é um dia da janela em volta da data prevista. Verde: o nome fica bom naquele dia. Quando {primeiro} nascer, recalculem com a data real em um toque.
            </Text>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {tiraDias.map((d) => (
                  <View
                    key={d.rotulo}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      backgroundColor: d.centro ? paleta.texto : d.bom ? '#D1FAE5' : '#F1ECEA',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: BODY_FONT_BOLD,
                        fontSize: 8,
                        color: d.centro ? '#FFFFFF' : d.bom ? '#047857' : '#8C7B76',
                      }}
                    >
                      {d.rotulo}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: '#D1FAE5' }} />
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 8, color: '#6B5A55' }}>Bom nesse dia</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: '#F1ECEA' }} />
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 8, color: '#6B5A55' }}>Pede atenção nesse dia</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: paleta.texto }} />
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 8, color: '#6B5A55' }}>Data prevista</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: paleta.suave, borderRadius: 16, padding: 14 }}>
            <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 9.5, color: paleta.texto, marginBottom: 3 }}>
              Leitura para a data informada ({dataDisplay})
            </Text>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 9, lineHeight: 1.5, color: CORPO_BEBE }}>
              Como a data já está definida, todos os números e triângulos deste manual refletem exatamente esse dia de nascimento, sem variação de janela.
            </Text>
          </View>
        )}

        <RodapePastel paleta={paleta} />
      </Page>

      {/* PÁGINA 5 · PARTE 3 · ENTENDER [NOME] */}
      <Page size="A4" style={pageStyle}>
        <CabecalhoPastel paleta={paleta} subtitulo={`${primeiro} · Parte 3`} />

        {tagParte(`Parte 3 · Entender ${primeiro}`)}
        <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, letterSpacing: 0.8, color: paleta.texto, marginBottom: 5 }}>
          As energias do nome
        </Text>
        <Text style={{ fontFamily: BODY_FONT, fontSize: 9.5, lineHeight: 1.5, color: CORPO_BEBE, marginBottom: 12 }}>
          Tendências que o nome convida a florescer. Observem, acolham e deixem {primeiro} mostrar quem é. Cada criança é única.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {cardsEntender.map((card) => (
            <View
              key={card.titulo}
              wrap={false}
              style={{
                width: '48.5%',
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 12,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: paleta.suave,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: TITLE_FONT, fontSize: 12, color: paleta.texto }}>{card.num}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8.5, letterSpacing: 0.7, textTransform: 'uppercase', color: paleta.texto }}>
                    {card.titulo}
                  </Text>
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 7.5, color: paleta.apagado }}>
                    {card.base}
                  </Text>
                </View>
              </View>

              <Text style={{ fontFamily: BODY_FONT, fontSize: 8.8, lineHeight: 1.45, color: CORPO_BEBE }}>
                {card.texto}
              </Text>

              <View style={{ backgroundColor: paleta.suave, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 }}>
                <Text style={{ fontFamily: BODY_FONT, fontSize: 8.2, lineHeight: 1.4, color: CORPO_BEBE }}>
                  {card.dica}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <RodapePastel paleta={paleta} notaRodape="Tendências, nunca rótulos." />
      </Page>

      {/* PÁGINA 6 · PARTE 4 · CRESCER JUNTOS */}
      <Page size="A4" style={pageStyle}>
        <CabecalhoPastel paleta={paleta} subtitulo={`${primeiro} · Parte 4`} />

        {tagParte('Parte 4 · Crescer juntos')}
        <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, letterSpacing: 0.8, color: paleta.texto, marginBottom: 12 }}>
          Crescendo com o nome
        </Text>

        <View style={{ flexDirection: 'row', gap: 9, marginBottom: 12 }}>
          {[
            { t: 'Bebê', d: adaptGeneroTextoBebe(fases.bebe, sexo) },
            { t: 'Infância', d: adaptGeneroTextoBebe(fases.infancia, sexo) },
            { t: 'Adolescência', d: adaptGeneroTextoBebe(fases.adolescencia, sexo) },
          ].map((f) => (
            <View key={f.t} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', color: paleta.texto, marginBottom: 4 }}>
                {f.t}
              </Text>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 8.8, lineHeight: 1.48, color: CORPO_BEBE }}>
                {f.d}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: paleta.suave, borderRadius: 16, padding: 13, marginBottom: 14 }}>
          <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 9.5, color: TINTA_BEBE, marginBottom: 3 }}>
            Qualidades para cultivar juntos
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 9, lineHeight: 1.5, color: CORPO_BEBE }}>
            {licoesLista.length > 0
              ? `O nome não traz diretamente ${licoesLista.join(', ')}. Isso não é falta: são qualidades bonitas para a família estimular aos poucos no dia a dia.`
              : `Todos os números principais já aparecem no nome ${primeiro}: a família pode estimular essas forças em equilíbrio com leveza e presença.`}
          </Text>
        </View>

        <Text style={{ fontFamily: TITLE_FONT, fontSize: 14, color: TINTA_BEBE, marginBottom: 8 }}>
          Caminho holístico para a família
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {holistico.map((h) => (
            <View key={h.titulo} style={{ width: '48.5%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12 }}>
              <Text style={{ fontFamily: BODY_FONT_BOLD, fontSize: 9.5, color: paleta.texto, marginBottom: 3 }}>
                {h.titulo}
              </Text>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 8.8, lineHeight: 1.48, color: CORPO_BEBE }}>
                {h.texto}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 9, color: '#6B5A55' }}>
            Cores que combinam com o nome:
          </Text>
          {coresHarmonia.map((hex, i) => (
            <View key={i} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: hex }} />
          ))}
        </View>

        <RodapePastel paleta={paleta} notaRodape="Sugestões de autoconhecimento em família." />
      </Page>

      {/* PÁGINA 7 · PARA GUARDAR */}
      <Page size="A4" style={pageStyle}>
        <CabecalhoPastel paleta={paleta} subtitulo={`${primeiro} · Para guardar`} />

        <Text style={{ fontFamily: TITLE_FONT, fontSize: 22, letterSpacing: 0.8, color: paleta.texto, marginBottom: 14 }}>
          Para guardar
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
          <View
            style={{
              width: 175,
              height: 175,
              borderRadius: 20,
              backgroundColor: paleta.suave,
              padding: 2,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 18,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
              }}
            >
              <Text style={{ fontFamily: BODY_FONT, fontSize: 9.5, color: paleta.apagado, textAlign: 'center', lineHeight: 1.5 }}>
                Espaço para a{'\n'}primeira foto
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 }}>
            <Text style={{ fontFamily: TITLE_FONT, fontSize: 13.5, color: TINTA_BEBE, marginBottom: 8 }}>
              A história do seu nome
            </Text>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 9.2, color: CORPO_BEBE, marginBottom: 14 }}>
              Por que escolhemos {primeiro}:
            </Text>
            {[0, 1, 2, 3].map((idx) => (
              <View key={idx} style={{ height: 0.8, backgroundColor: paleta.linha, marginBottom: 22 }} />
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18 }}>
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 14, color: paleta.texto, marginBottom: 8 }}>
            Uma carta para você ler quando crescer
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 9.5, color: CORPO_BEBE, marginBottom: 18 }}>
            {pr.queridaQuerido} {primeiro},
          </Text>
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <View key={idx} style={{ height: 0.8, backgroundColor: paleta.linha, marginBottom: 24 }} />
          ))}
          <Text style={{ fontFamily: TITLE_FONT, fontSize: 11.5, color: paleta.texto, textAlign: 'right', marginTop: 6 }}>
            {paisTexto.assinaturaCarta}
          </Text>
        </View>

        <RodapePastel paleta={paleta} notaRodape="Imprima e preencha à mão." />
      </Page>
    </Document>
  );
}
