/**
 * NomeArtisticoPDF — documento PDF pago para o caminho "Criar um nome artístico" (DEV-329).
 *
 * Segue o layout base aprovado (`docs/architecture/pdf-layout-base/Art*.dc.html`) reaproveitando
 * integralmente `pdfLayoutTheme.ts` e `PDFLayoutBlocks.tsx`.
 *
 * Ordem das páginas:
 *   1. Capa palco (fundo escuro com holofote dourado e roxo)
 *   2. Resumo de 1 página
 *   3. Parte 1 · Você e sua área (perfil do chat + nome civil em resumo + tabela real de afinidade)
 *   4. Parte 2 · Seu nome artístico (próximos e totalmente novos com marcação do escolhido)
 *   5. Parte 3 · No palco (usos práticos + folha de treino + aviso informativo de contratos/INPI)
 *   6. Anexo · Mapa e Triângulo da Vida (estrela comparativa + arquétipo/arcano + pirâmide com ponta roxa)
 */
import { Document, Page, View, Text, Svg, Circle } from '@react-pdf/renderer';
import { PDFPageHeader } from './shared/PDFPageHeader';
import { PDFFooter } from './shared/PDFFooter';
import { PDFDoubleStar } from './shared/PDFDoubleStar';
import { TrianguloPiramideInline } from './shared/PDFMarkdownRenderer';
import { BODY_FONT, formatDate } from './shared/PDFFonts';
import { normalizeBirthDateForNumerology } from './shared/pdfBirthDate';
import type { ProductPDFProps } from './shared/PDFTypes';
import { calcularCincoNumeros } from '../../../backend/numerology/numbers';
import { calcularTodosTriangulos, detectarBloqueios } from '../../../backend/numerology/triangle';
import { avaliarNome } from '../../../backend/numerology/score';
import { reduzirNumero } from '../../../backend/numerology/core';
import { getArcano } from '../../../backend/numerology/arcanos';
import { getArquetipo } from '../../../backend/numerology/archetypes';
import {
  AFINIDADE_EXPRESSAO_POR_AREA,
  QUALIDADE_ARTISTICA_POR_EXPRESSAO,
  afinidadeExpressaoArea,
  explicarAfinidade,
} from '../../../backend/numerology/products/nome-artistico/afinidade-area';
import {
  AVISO_ARTISTICO_CONTRATOS_TEXT,
  labelAreaArtistica,
  labelDetalheArtistico,
  labelImagemArtistica,
  type AreaArtistica,
} from '../../../shared/interactive-engine/ramos/artistico';
import type {
  NomeArtisticoItemPersistido,
  NomesArtisticosPersistidos,
} from '../../../shared/chat-analysis-persist';
import type { PerfilChatPersistido } from '../../../shared/interactive-engine/questionnaire-map';
import {
  COR_FIXA,
  LAYOUT_THEME_PADRAO,
  faixaNotaPapel,
  type PdfLayoutTheme,
} from './layout/pdfLayoutTheme';
import { Card, Chip, H1, H2, H3, H4, Nota, P, SeloParte } from './layout/PDFLayoutBlocks';

export interface NomeArtisticoPDFProps extends ProductPDFProps {
  theme?: PdfLayoutTheme;
}

const GENERO_LABEL: Record<string, string> = {
  feminino: 'Feminina',
  masculino: 'Masculina',
  neutro: 'Neutra',
};

function listaPt(itens: string[]): string {
  if (itens.length === 0) return '';
  if (itens.length === 1) return itens[0]!;
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

function normalizarNome(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function chaveExpressao(n: number | null): number {
  if (!n || n <= 0) return 1;
  const comMestres = reduzirNumero(n, true);
  return comMestres === 11 || comMestres === 22 ? comMestres : reduzirNumero(n, false);
}

function rotuloAfinidadeCurto(peso: number): string {
  if (peso >= 1) return 'Maior afinidade';
  if (peso >= 0.8) return 'Alta';
  if (peso >= 0.5) return 'Boa';
  return 'Neutra';
}

function rotuloAfinidadeDetalhe(peso: number): string {
  if (peso >= 1) return 'maior afinidade';
  if (peso >= 0.8) return 'alta afinidade';
  if (peso >= 0.5) return 'boa afinidade';
  return 'afinidade neutra';
}

function agrupamentoTabelaArea(areaKey: AreaArtistica): {
  maior: number[];
  alta: number[];
  boa: number[];
} {
  const tabela = AFINIDADE_EXPRESSAO_POR_AREA[areaKey] ?? AFINIDADE_EXPRESSAO_POR_AREA.outra;
  const entradas = Object.entries(tabela).map(([k, v]) => [Number(k), v ?? 0] as const);
  const ordena = (arr: number[]) => arr.sort((a, b) => a - b);
  return {
    maior: ordena(entradas.filter(([, v]) => v >= 1).map(([k]) => k)),
    alta: ordena(entradas.filter(([, v]) => v >= 0.8 && v < 1).map(([k]) => k)),
    boa: ordena(entradas.filter(([, v]) => v >= 0.5 && v < 0.8).map(([k]) => k)),
  };
}

function formatListaNumeros(nums: number[], sufixo: string): string {
  if (nums.length === 0) return 'Variações abertas';
  return `${listaPt(nums.map(String))}${sufixo}`;
}

const USOS_PALCO = [
  {
    titulo: 'Redes sociais',
    descricao: 'Use o mesmo nome em todas as redes e confira se o @ está livre antes de anunciar.',
  },
  {
    titulo: 'Consistência',
    descricao: 'Mesma grafia em capas, cartazes e créditos. Evite variar acentos e abreviações.',
  },
  {
    titulo: 'Apresentação',
    descricao: 'Diga o nome com calma no palco e nos vídeos: repetição ajuda o público a lembrar.',
  },
  {
    titulo: 'Antes de anunciar',
    descricao: 'Pesquise se outro artista ou marca já usa um nome igual ou parecido.',
  },
];

export function NomeArtisticoPDF({ analysis, theme = LAYOUT_THEME_PADRAO }: NomeArtisticoPDFProps) {
  const freqData = (analysis.frequencias_numeros as Record<string, unknown> | null) ?? {};
  const perfilChat = (freqData.perfilChat as PerfilChatPersistido | undefined) ?? {};
  const nomesSalvos = (freqData.nomesArtisticos as NomesArtisticosPersistidos | undefined) ?? null;

  const rankingObj = (freqData.ranking as { nomeNascimento?: string; dataNascimento?: string; melhorNome?: { nomeCompleto?: string } } | undefined) ?? {};
  const nomeCivil = (rankingObj.nomeNascimento?.trim() || analysis.nome_completo).trim();
  const dataNascBruta = rankingObj.dataNascimento ?? analysis.data_nascimento ?? '';
  const dataNascRaw = normalizeBirthDateForNumerology(dataNascBruta);
  const dataNascFormatada = formatDate(dataNascBruta) || dataNascRaw;

  const nomeArtistico = (
    nomesSalvos?.escolhido?.trim() ||
    (typeof freqData.selectedNomeSocial === 'string' ? freqData.selectedNomeSocial.trim() : '') ||
    rankingObj.melhorNome?.nomeCompleto?.trim() ||
    analysis.nome_completo
  ).trim();

  const areaId = (perfilChat.areaArtistica as AreaArtistica | undefined) ?? 'outra';
  const areaRotulo =
    areaId === 'outra'
      ? perfilChat.areaArtisticaOutro?.trim() || 'Artista'
      : labelAreaArtistica(areaId) ?? 'Artista';
  const areaLower = areaRotulo.toLowerCase();

  const detalhesLista = (perfilChat.detalheArtistico ?? [])
    .map((id) => labelDetalheArtistico(perfilChat.areaArtistica, id))
    .filter((v): v is string => Boolean(v));
  const detalhesTexto = detalhesLista.length > 0 ? detalhesLista.join(' · ') : 'Estilo livre';

  const imagensLista = (perfilChat.imagemArtistica ?? [])
    .map((id) => labelImagemArtistica(id))
    .filter((v): v is string => Boolean(v));
  const imagemTexto = imagensLista.length > 0 ? listaPt(imagensLista) : 'Autêntica';
  const personaTexto = perfilChat.generoPersona
    ? GENERO_LABEL[perfilChat.generoPersona] ?? perfilChat.generoPersona
    : 'Livre';

  const cincoCivil = calcularCincoNumeros(nomeCivil, dataNascRaw);
  const scoreCivil = avaliarNome(nomeCivil, dataNascRaw).score_v3;
  const faixaCivil = faixaNotaPapel(scoreCivil);

  const cincoArt = calcularCincoNumeros(nomeArtistico, dataNascRaw);
  const avaliacaoArt = avaliarNome(nomeArtistico, dataNascRaw);
  const scoreArt = avaliacaoArt.score_v3;
  const faixaArt = faixaNotaPapel(scoreArt);
  const expArtChave = chaveExpressao(cincoArt.expressao);
  const pesoAfinidadeArt = afinidadeExpressaoArea(expArtChave, areaId);

  const triangulosArt = calcularTodosTriangulos(nomeArtistico, dataNascRaw);
  const bloqueiosArt = detectarBloqueios(triangulosArt);
  const letrasArt = nomeArtistico
    .replace(/\s+/g, '')
    .replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .split('');
  const triCellSize = Math.min(18, Math.max(8, Math.floor(390 / Math.max(letrasArt.length, 1)) - 1));

  const proximosLista: NomeArtisticoItemPersistido[] = nomesSalvos?.proximos ?? [];
  const novosLista: NomeArtisticoItemPersistido[] = nomesSalvos?.novos ?? [];
  const escolhidoNorm = normalizarNome(nomeArtistico);

  const escolhidoEhNovo = novosLista.some((n) => normalizarNome(n.nome) === escolhidoNorm);
  const escolhidoEhProximo = proximosLista.some((n) => normalizarNome(n.nome) === escolhidoNorm);
  const tipoTitulo = escolhidoEhNovo
    ? 'Totalmente novo'
    : escolhidoEhProximo
      ? 'Próximo do seu nome'
      : 'Nome artístico';
  const tipoSub = escolhidoEhNovo
    ? 'não parte do nome civil'
    : escolhidoEhProximo
      ? 'mantém raízes do seu nome civil'
      : 'escolha do perfil artístico';

  const semOpcoesSalvas = proximosLista.length === 0 && novosLista.length === 0;
  const fallbackItem: NomeArtisticoItemPersistido = {
    nome: nomeArtistico,
    nota: scoreArt,
    expressao: expArtChave,
    afinidade: pesoAfinidadeArt,
    explicacao: explicarAfinidade(expArtChave, areaId, areaLower),
    secao: escolhidoEhProximo ? 'proximo' : 'novo',
  };
  const novosExibicao = semOpcoesSalvas && fallbackItem.secao === 'novo' ? [fallbackItem] : novosLista;
  const proximosExibicao = semOpcoesSalvas && fallbackItem.secao === 'proximo' ? [fallbackItem] : proximosLista;

  const niveisTabela = agrupamentoTabelaArea(areaId);
  const qualidadeExp = QUALIDADE_ARTISTICA_POR_EXPRESSAO[expArtChave] ?? 'presença e expressão no palco';
  const explicacaoArea = explicarAfinidade(expArtChave, areaId, areaLower);
  const arquetipoArt = getArquetipo(expArtChave);
  const arcanoRegenteVida = triangulosArt.vida?.arcanoRegente
    ? getArcano(triangulosArt.vida.arcanoRegente)
    : null;

  const pagePaperStyle = {
    backgroundColor: theme.paginaFundo,
    paddingTop: 48,
    paddingBottom: 68,
    paddingHorizontal: 46,
    fontFamily: BODY_FONT,
    color: theme.tintaSuave,
  };

  const capaSubtitulo = [
    areaRotulo,
    detalhesLista.length > 0 ? detalhesLista.join(' · ') : null,
    imagensLista.length > 0 ? `Imagem ${imagemTexto.toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Document
      title={`${theme.marca} — ${nomeArtistico}`}
      author="Nome Magnético"
    >
      {/* PÁGINA 1 · CAPA PALCO */}
      <Page
        size="A4"
        style={{
          backgroundColor: '#0E0D10',
          color: '#e5e2e1',
          paddingTop: 54,
          paddingBottom: 46,
          paddingHorizontal: 48,
          justifyContent: 'space-between',
          fontFamily: theme.fonteTexto,
        }}
      >
        {/* Holofote dourado e roxo ao fundo */}
        <View
          fixed
          style={{
            position: 'absolute',
            top: 90,
            left: 20,
            right: 20,
            alignItems: 'center',
          }}
        >
          <Svg width={540} height={540} viewBox="0 0 540 540">
            <Circle cx={270} cy={270} r={255} fill="#BEA5FF" fillOpacity={0.055} />
            <Circle cx={270} cy={270} r={190} fill="#F2CA50" fillOpacity={0.08} />
            <Circle cx={270} cy={270} r={120} fill="#F2CA50" fillOpacity={0.11} />
          </Svg>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 12, letterSpacing: 2.2, color: '#f2ca50' }}>
            {theme.marca}
          </Text>
          <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 8.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#bfb9ae' }}>
            NOME ARTÍSTICO
          </Text>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 9.5, letterSpacing: 3.2, textTransform: 'uppercase', color: '#d7c6ff', marginBottom: 16 }}>
            APRESENTANDO
          </Text>
          <Text
            style={{
              fontFamily: theme.fonteTitulo,
              fontSize: nomeArtistico.length > 22 ? 32 : 42,
              letterSpacing: 2.4,
              color: '#f2ca50',
              textAlign: 'center',
              lineHeight: 1.12,
              marginBottom: 18,
            }}
          >
            {nomeArtistico.toUpperCase()}
          </Text>
          <View style={{ width: 96, height: 1.5, backgroundColor: '#d4af37', opacity: 0.65, marginBottom: 18 }} />
          <Text style={{ fontFamily: theme.fonteTexto, fontSize: 11.5, color: '#d6d1c8', textAlign: 'center', marginBottom: 10 }}>
            {capaSubtitulo}
          </Text>
          <Text style={{ fontFamily: theme.fonteTexto, fontSize: 10, color: '#9c968b', textAlign: 'center' }}>
            Nome civil: {nomeCivil} · {dataNascFormatada}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
          <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, lineHeight: 1.5, color: '#9c968b', maxWidth: 340 }}>
            Ferramenta de autoconhecimento baseada na Numerologia Cabalística. Não é orientação jurídica: contratos e documentos seguem o nome civil.
          </Text>
          <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: '#9c968b' }}>
            nomemagnetico.com.br
          </Text>
        </View>
      </Page>

      {/* PÁGINA 2 · RESUMO DE 1 PÁGINA */}
      <Page size="A4" style={pagePaperStyle}>
        <PDFPageHeader brand={theme.marca} subtitle={`${nomeArtistico} · Resumo`} />

        <View style={{ marginBottom: 14 }}>
          <H3 theme={theme}>Seu nome artístico em 1 página</H3>
          <H1 theme={theme}>{nomeArtistico}</H1>
          <P theme={theme} size={9.5}>
            O nome escolhido para o palco, calculado com a sua data de nascimento e pensado para a sua área: {areaLower}, com imagem {imagemTexto.toLowerCase()}.
          </P>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Card theme={theme} style={{ flex: 1, padding: 14 }}>
            <Nota theme={theme}>NOTA DO NOME</Nota>
            <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 26, color: faixaArt.texto, marginTop: 4, marginBottom: 2 }}>
              {scoreArt}
            </Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: bloqueiosArt.length > 0 ? COR_FIXA.bloqueioTexto : faixaArt.texto }}>
              {faixaArt.rotulo} · {bloqueiosArt.length === 0 ? 'sem bloqueios' : `${bloqueiosArt.length} sequência(s)`}
            </Text>
          </Card>

          <Card theme={theme} fundo={COR_FIXA.arcanoFundo} style={{ flex: 1, padding: 14 }}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.arcanoTexto, letterSpacing: 0.9, textTransform: 'uppercase' }}>
              AFINIDADE COM A ÁREA
            </Text>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 13.5, color: '#2E1B6B', marginTop: 6, marginBottom: 3 }}>
              {rotuloAfinidadeCurto(pesoAfinidadeArt)}
            </Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: COR_FIXA.arcanoTexto, lineHeight: 1.35 }}>
              Expressão {expArtChave} para {areaLower}
            </Text>
          </Card>

          <Card theme={theme} alt style={{ flex: 1, padding: 14 }}>
            <Nota theme={theme}>TIPO</Nota>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 12.5, color: theme.tinta, marginTop: 6, marginBottom: 3 }}>
              {tipoTitulo}
            </Text>
            <Nota theme={theme}>{tipoSub}</Nota>
          </Card>
        </View>

        <View style={{ marginBottom: 16 }}>
          <H2 theme={theme}>O que isso quer dizer</H2>
          <View style={{ gap: 6 }}>
            <P theme={theme} size={9.5}>
              1. {nomeArtistico} {bloqueiosArt.length === 0 ? 'não apresenta bloqueios nos triângulos e combina' : 'foi calculado em conjunto'} com a sua data de nascimento.
            </P>
            <P theme={theme} size={9.5}>
              2. {explicacaoArea || `Este nome favorece ${qualidadeExp} para o seu trabalho como ${areaLower}.`}
            </P>
            <P theme={theme} size={9.5}>
              3. Nos contratos e documentos você continua sendo {nomeCivil}: o nome artístico convive com o nome civil.
            </P>
          </View>
        </View>

        <View>
          <H2 theme={theme}>As opções que você viu</H2>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Card theme={theme} style={{ flex: 1, padding: 12 }}>
              <H3 theme={theme}>Próximas do seu nome</H3>
              <P theme={theme} size={9}>
                {proximosLista.length > 0
                  ? proximosLista.map((p) => p.nome).join(' · ')
                  : 'Nenhuma variação próxima salva neste perfil.'}
              </P>
            </Card>
            <Card theme={theme} style={{ flex: 1, padding: 12 }}>
              <H3 theme={theme}>Totalmente novas</H3>
              <P theme={theme} size={9}>
                {novosLista.length > 0
                  ? novosLista.map((n) => n.nome).join(' · ')
                  : 'Nenhuma opção nova salva neste perfil.'}
              </P>
            </Card>
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* PÁGINA 3 · PARTE 1 · VOCÊ E SUA ÁREA */}
      <Page size="A4" style={pagePaperStyle}>
        <PDFPageHeader brand={theme.marca} subtitle={`${nomeArtistico} · Parte 1`} />

        <SeloParte theme={theme}>Parte 1 · Você e sua área</SeloParte>
        <H1 theme={theme}>Seu perfil artístico</H1>
        <View style={{ marginBottom: 12 }}>
          <P theme={theme} size={9.5}>
            O que você contou no chat. É a base para escolher e explicar os nomes.
          </P>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[
            { titulo: 'Área', valor: areaRotulo },
            { titulo: 'Estilo', valor: detalhesTexto },
            { titulo: 'Persona', valor: personaTexto },
            { titulo: 'Imagem', valor: imagemTexto },
          ].map((item) => (
            <Card key={item.titulo} theme={theme} style={{ flex: 1, padding: 10 }}>
              <H3 theme={theme}>{item.titulo}</H3>
              <H4 theme={theme}>{item.valor}</H4>
            </Card>
          ))}
        </View>

        <View style={{ marginBottom: 14 }}>
          <H2 theme={theme}>Seu nome civil, em resumo</H2>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            {[
              { rotulo: 'Destino', valor: cincoCivil.destino },
              { rotulo: 'Expressão', valor: cincoCivil.expressao },
              { rotulo: 'Motivação', valor: cincoCivil.motivacao },
              { rotulo: 'Impressão', valor: cincoCivil.impressao },
              { rotulo: 'Missão', valor: cincoCivil.missao },
            ].map((num) => (
              <Card key={num.rotulo} theme={theme} fundo={COR_FIXA.igualFundo} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6 }}>
                <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 18, color: COR_FIXA.igualTexto, marginBottom: 2 }}>
                  {num.valor ?? '—'}
                </Text>
                <Nota theme={theme}>{num.rotulo}</Nota>
              </Card>
            ))}
          </View>
          <Nota theme={theme}>
            {nomeCivil} · nota {scoreCivil} ({faixaCivil.rotulo}). O Destino {cincoCivil.destino} vem da data e é o mesmo com qualquer nome.
          </Nota>
        </View>

        <View>
          <H2 theme={theme}>Por que o número combina com a sua área</H2>
          <Card theme={theme} fundo={COR_FIXA.arcanoFundo} style={{ padding: 14, marginBottom: 10 }}>
            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 10.5, color: '#2E1B6B', marginBottom: 4 }}>
              Expressão {expArtChave} · {qualidadeExp}
            </Text>
            <Text style={{ fontFamily: theme.fonteTexto, fontSize: 9.2, color: '#2E1B6B', lineHeight: 1.5 }}>
              {explicacaoArea || `Este nome favorece ${qualidadeExp} no trabalho como ${areaLower}.`}
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <Card theme={theme} style={{ flex: 1, padding: 10 }}>
              <H3 theme={theme}>Maior afinidade</H3>
              <P theme={theme} size={8.5}>{formatListaNumeros(niveisTabela.maior, ` para ${areaLower}`)}</P>
            </Card>
            <Card theme={theme} style={{ flex: 1, padding: 10 }}>
              <H3 theme={theme}>Alta afinidade</H3>
              <P theme={theme} size={8.5}>{formatListaNumeros(niveisTabela.alta, '')}</P>
            </Card>
            <Card theme={theme} style={{ flex: 1, padding: 10 }}>
              <H3 theme={theme}>Boa afinidade</H3>
              <P theme={theme} size={8.5}>{formatListaNumeros(niveisTabela.boa, '')}</P>
            </Card>
          </View>
          <Nota theme={theme}>
            A afinidade só desempata: todo nome sugerido já passou pela regra de zero bloqueio e nota mínima.
          </Nota>
        </View>

        <PDFFooter />
      </Page>

      {/* PÁGINA 4 · PARTE 2 · SEU NOME ARTÍSTICO */}
      <Page size="A4" style={pagePaperStyle}>
        <PDFPageHeader brand={theme.marca} subtitle={`${nomeArtistico} · Parte 2`} />

        <SeloParte theme={theme}>Parte 2 · Seu nome artístico</SeloParte>
        <H1 theme={theme}>Próximos e totalmente novos</H1>
        <View style={{ marginBottom: 10 }}>
          <P theme={theme} size={9.2}>
            Todos sem bloqueio. Os próximos partem do seu nome civil (nota mínima 70). Os novos não partem dele e só entram com nota 80 ou mais, do mais perto de 100 para baixo.
          </P>
        </View>

        {[
          { titulo: 'Totalmente novos', itens: novosExibicao },
          { titulo: 'Próximos do seu nome', itens: proximosExibicao },
        ]
          .filter((g) => g.itens.length > 0)
          .map((grupo) => (
            <View key={grupo.titulo} style={{ marginBottom: 12 }}>
              <H2 theme={theme}>{grupo.titulo}</H2>
              <View style={{ gap: 6 }}>
                {grupo.itens.map((item) => {
                  const faixaItem = faixaNotaPapel(item.nota);
                  const ehEscolhido = normalizarNome(item.nome) === escolhidoNorm;
                  const expItem = chaveExpressao(item.expressao);
                  const pesoItem = item.afinidade ?? afinidadeExpressaoArea(expItem, areaId);
                  const textoCard = item.explicacao?.trim() || explicarAfinidade(expItem, areaId, areaLower);
                  return (
                    <Card key={`${grupo.titulo}-${item.nome}`} theme={theme} style={{ padding: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 11, color: theme.tinta }}>
                              {item.nome}
                            </Text>
                            {ehEscolhido && (
                              <Chip theme={theme} fundo={theme.tinta} cor="#F3E7C4">
                                Escolhido
                              </Chip>
                            )}
                          </View>
                          {textoCard ? <P theme={theme} size={8.5}>{textoCard}</P> : null}
                        </View>

                        <View style={{ width: 92, alignItems: 'flex-start' }}>
                          <Chip theme={theme} fundo={faixaItem.fundo} cor={faixaItem.texto}>
                            {item.nota} · {faixaItem.rotulo}
                          </Chip>
                        </View>

                        <View style={{ width: 108 }}>
                          <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: COR_FIXA.arcanoTexto }}>
                            Expressão {expItem} · {rotuloAfinidadeDetalhe(pesoItem)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>
          ))}

        <PDFFooter />
      </Page>

      {/* PÁGINA 5 · PARTE 3 · NO PALCO */}
      <Page size="A4" style={pagePaperStyle}>
        <PDFPageHeader brand={theme.marca} subtitle={`${nomeArtistico} · Parte 3`} />

        <SeloParte theme={theme}>Parte 3 · No palco</SeloParte>
        <H1 theme={theme}>Como usar o seu nome artístico</H1>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6, marginBottom: 14 }}>
          {USOS_PALCO.map((uso) => (
            <Card key={uso.titulo} theme={theme} style={{ width: '48.5%', padding: 12 }}>
              <H3 theme={theme}>{uso.titulo}</H3>
              <P theme={theme} size={8.8}>{uso.descricao}</P>
            </Card>
          ))}
        </View>

        <View style={{ marginBottom: 14 }}>
          <H2 theme={theme}>A assinatura artística</H2>
          <Card theme={theme} style={{ padding: 14 }}>
            <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 20, color: '#B8902B', opacity: 0.55, marginBottom: 12 }}>
              {nomeArtistico}
            </Text>
            <View style={{ height: 0.8, backgroundColor: '#E2DCCD', marginBottom: 22 }} />
            <View style={{ height: 0.8, backgroundColor: '#E2DCCD', marginBottom: 12 }} />
            <Nota theme={theme}>
              Legível, levemente ascendente e sem traços cortantes. Use a mesma forma em autógrafos, capas e redes.
            </Nota>
          </Card>
        </View>

        <Card theme={theme} alt style={{ padding: 14 }}>
          <H4 theme={theme}>Contratos e documentos (informativo)</H4>
          <P theme={theme} size={8.8}>{AVISO_ARTISTICO_CONTRATOS_TEXT}</P>
        </Card>

        <PDFFooter />
      </Page>

      {/* PÁGINA 6 · ANEXO · MAPA E TRIÂNGULO DA VIDA */}
      <Page size="A4" style={pagePaperStyle}>
        <PDFPageHeader brand={theme.marca} subtitle={`${nomeArtistico} · Anexo`} />

        <SeloParte theme={theme}>Anexo · Mapa e Triângulo da Vida</SeloParte>
        <H1 theme={theme}>{nomeArtistico}</H1>
        <View style={{ marginBottom: 10 }}>
          <P theme={theme} size={9}>
            Visão visual do nome artístico comparado ao nome civil ({nomeCivil}), seguida do Triângulo da Vida com o arcano regente na ponta.
          </P>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <Card theme={theme} style={{ flex: 1.25, alignItems: 'center', padding: 12 }}>
            <View style={{ alignSelf: 'flex-start', marginBottom: 4 }}>
              <H3 theme={theme}>Estrela comparativa</H3>
            </View>
            <PDFDoubleStar
              nascimento={{
                destino: cincoCivil.destino,
                expressao: cincoCivil.expressao,
                motivacao: cincoCivil.motivacao,
                missao: cincoCivil.missao,
                impressao: cincoCivil.impressao,
              }}
              harmonizado={{
                destino: cincoArt.destino,
                expressao: cincoArt.expressao,
                motivacao: cincoArt.motivacao,
                missao: cincoArt.missao,
                impressao: cincoArt.impressao,
              }}
              scoreNascimento={scoreCivil}
              scoreHarmonizado={scoreArt}
              svgWidth={210}
              compact
            />
            <Nota theme={theme}>
              Civil: {scoreCivil} ({faixaCivil.rotulo}) · Artístico: {scoreArt} ({faixaArt.rotulo})
            </Nota>
          </Card>

          <View style={{ flex: 1, gap: 8 }}>
            <Card theme={theme} fundo={COR_FIXA.arcanoFundo} style={{ padding: 12 }}>
              <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.arcanoTexto, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 3 }}>
                Arquétipo · Expressão {expArtChave}
              </Text>
              <Text style={{ fontFamily: theme.fonteTitulo, fontSize: 14, color: '#2E1B6B', marginBottom: 4 }}>
                {arquetipoArt.nome}
              </Text>
              <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: COR_FIXA.arcanoTexto, lineHeight: 1.45 }}>
                Essência: “{arquetipoArt.essencia}”
              </Text>
            </Card>

            {arcanoRegenteVida && (
              <Card theme={theme} fundo={COR_FIXA.arcanoFundo} style={{ padding: 12 }}>
                <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 7.5, color: COR_FIXA.arcanoTexto, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 3 }}>
                  Arcano regente · Triângulo da Vida
                </Text>
                <Text style={{ fontFamily: theme.fonteTextoBold, fontSize: 11, color: '#2E1B6B', marginBottom: 3 }}>
                  {arcanoRegenteVida.numero} · {arcanoRegenteVida.nome}
                </Text>
                <Text style={{ fontFamily: theme.fonteTexto, fontSize: 8.5, color: COR_FIXA.arcanoTexto, lineHeight: 1.4 }}>
                  {arcanoRegenteVida.palavraChave}
                </Text>
              </Card>
            )}
          </View>
        </View>

        <Card theme={theme} style={{ alignItems: 'center', padding: 14 }}>
          <View style={{ alignSelf: 'flex-start', marginBottom: 6 }}>
            <H3 theme={theme}>Triângulo da Vida · {nomeArtistico}</H3>
          </View>
          {triangulosArt.vida && (
            <TrianguloPiramideInline
              data={triangulosArt.vida}
              label=""
              cellSize={triCellSize}
              letras={letrasArt}
            />
          )}
          <Text
            style={{
              fontFamily: theme.fonteTextoBold,
              fontSize: 8.5,
              color: bloqueiosArt.length > 0 ? COR_FIXA.bloqueioTexto : '#047857',
              marginTop: 6,
            }}
          >
            {bloqueiosArt.length > 0
              ? `Bloqueios identificados: ${bloqueiosArt.map((b) => b.codigo).join(' · ')}`
              : 'Sem bloqueios nos 4 triângulos'}
          </Text>
        </Card>

        <PDFFooter />
      </Page>
    </Document>
  );
}
