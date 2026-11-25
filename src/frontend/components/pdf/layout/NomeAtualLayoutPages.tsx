/**
 * Páginas do PDF gratuito (análise do nome de nascimento) no layout base (DEV-332).
 * Mesmos blocos, títulos e tema dos PDFs pagos (DEV-322). Ver docs/architecture/dev-322-pdf-layout-base.md.
 */
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFPageHeader } from '../shared/PDFPageHeader';
import { PDFFooter } from '../shared/PDFFooter';
import { PDFSectionAnchor } from '../shared/PDFSectionAnchor';
import { PDFTriangleDetailsBlock, type PDFTriangleArcanoData } from '../shared/PDFTriangleDetailsBlock';
import { PDFComoChegamosSugestoes, PASSOS_NOTA_GRATUITO } from '../shared/PDFComoChegamosSugestoes';
import type { BloqueioData, DebitoData, LicaoData, TendenciaData } from '../shared/PDFKarmicBlock';
import type { Arquetipo } from '../../../../backend/numerology/archetypes';
import {
  DESTINO_DESC,
  EXPRESSAO_DESC,
  IMPRESSAO_DESC,
  MISSAO_DESC,
  MOTIVACAO_DESC,
  NUMERO_NOMES,
} from '../../../../backend/numerology/interpretations';
import { ArquetipoLayout, DebitosLayout, LicoesLayout, TendenciasLayout } from './KarmaLayoutBlocks';
import { Card, Chip, H1, H2, H3, H4, Nota, P, SeloParte } from './PDFLayoutBlocks';
import { COR_FIXA, faixaNotaPapel, rotuloCompatibilidade, type PdfLayoutTheme } from './pdfLayoutTheme';

export interface GratuitoLayoutProps {
  theme: PdfLayoutTheme;
  nomeNascimento: string;
  dataNascimento: string;
  numeros: { destino?: number | null; expressao?: number | null; motivacao?: number | null; impressao?: number | null; missao?: number | null };
  arquetipo: Arquetipo;
  tVida: PDFTriangleArcanoData | null | undefined;
  bloqueios: BloqueioData[];
  debitos: DebitoData[];
  licoes: LicaoData[];
  tendencias: TendenciaData[];
  frequencias: Record<string, number>;
  letras: string[];
  triCellSize: number;
  nota: number | null;
  potencialMax: number | null;
  compatibilidade: 'favoravel' | 'neutro' | 'desfavoravel' | null;
}

const pl = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

function estiloPagina(t: PdfLayoutTheme) {
  return StyleSheet.create({
    page: { backgroundColor: t.paginaFundo, paddingTop: 48, paddingBottom: 68, paddingHorizontal: 46, fontFamily: t.fonteTexto, color: t.tintaSuave },
  }).page;
}

const NUMEROS_META = [
  { k: 'destino', label: 'Destino', origem: 'data de nascimento', desc: DESTINO_DESC },
  { k: 'expressao', label: 'Expressão', origem: 'todas as letras', desc: EXPRESSAO_DESC },
  { k: 'motivacao', label: 'Motivação', origem: 'vogais', desc: MOTIVACAO_DESC },
  { k: 'impressao', label: 'Impressão', origem: 'consoantes', desc: IMPRESSAO_DESC },
  { k: 'missao', label: 'Missão', origem: 'Destino + Expressão', desc: MISSAO_DESC },
] as const;

// ── Resumo de 1 página ──────────────────────────────────────────────────────
export function PDFResumoGratuito(p: GratuitoLayoutProps) {
  const t = p.theme;
  const faixa = p.nota != null ? faixaNotaPapel(p.nota) : null;
  const bloqueiosVida = p.bloqueios.filter((b) => b.triangulos?.includes('vida')).length;
  const frases = [
    p.bloqueios.length === 0
      ? '1. O nome de nascimento não tem sequências repetidas nos 4 triângulos.'
      : `1. O nome de nascimento tem ${p.bloqueios.length} ${pl(p.bloqueios.length, 'sequência repetida', 'sequências repetidas')} nos 4 triângulos${bloqueiosVida > 0 ? `, ${bloqueiosVida} no Triângulo da Vida` : ''}.`,
    p.compatibilidade
      ? `2. A Expressão ${p.numeros.expressao ?? ''} e o Destino ${p.numeros.destino ?? ''} formam uma relação ${rotuloCompatibilidade(p.compatibilidade).toLowerCase()}.`
      : '2. A Expressão e o Destino aparecem na estrela dos 5 números.',
    p.potencialMax != null && p.nota != null && p.potencialMax > p.nota
      ? `3. Uma forma de assinar pode levar a nota até ${p.potencialMax}. Veja na última página.`
      : '3. A última página mostra o potencial da sua assinatura.',
  ];
  return (
    <Page size="A4" style={estiloPagina(t)}>
      <PDFSectionAnchor id="pdf-resumo" bookmark={{ title: 'Resumo em 1 página', fit: true }} />
      <PDFPageHeader subtitle={`${p.nomeNascimento} — Resumo`} />
      <View style={{ marginBottom: 12 }}>
        <H3 theme={t}>Seu mapa em 1 página</H3>
        <H1 theme={t}>{p.nomeNascimento}</H1>
        <P theme={t} size={9.5}>A leitura do seu nome de nascimento pela Numerologia Cabalística, com a data {p.dataNascimento}.</P>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <Card theme={t} style={{ flex: 1 }}>
          <Nota theme={t}>NOTA DO NOME</Nota>
          <Text style={{ fontFamily: t.fonteTitulo, fontSize: 24, color: faixa?.texto ?? t.tinta, marginTop: 4 }}>{p.nota ?? '—'}</Text>
          {faixa ? <Nota theme={t}>{faixa.rotulo}</Nota> : null}
        </Card>
        <Card theme={t} fundo={p.bloqueios.length > 0 ? COR_FIXA.bloqueioFundo : undefined} style={{ flex: 1 }}>
          <Nota theme={t}>BLOQUEIOS</Nota>
          <Text style={{ fontFamily: t.fonteTitulo, fontSize: 24, color: p.bloqueios.length > 0 ? COR_FIXA.bloqueioTexto : t.tinta, marginTop: 4 }}>{p.bloqueios.length}</Text>
          <Nota theme={t}>nos 4 triângulos</Nota>
        </Card>
        <Card theme={t} fundo={COR_FIXA.arcanoFundo} style={{ flex: 1 }}>
          <Nota theme={t}>COMPATIBILIDADE</Nota>
          <Text style={{ fontFamily: t.fonteTextoBold, fontSize: 12, color: COR_FIXA.arcanoTexto, marginTop: 6 }}>
            {p.compatibilidade ? rotuloCompatibilidade(p.compatibilidade) : '—'}
          </Text>
          <Nota theme={t}>Expressão × Destino</Nota>
        </Card>
      </View>

      <H2 theme={t}>Os 5 números</H2>
      <View style={{ gap: 5, marginBottom: 10 }}>
        {NUMEROS_META.map((m) => {
          const v = p.numeros[m.k] ?? null;
          return (
            <Card key={m.k} theme={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 }}>
              <Text style={{ width: 70, fontFamily: t.fonteTextoBold, fontSize: 9.5, color: t.tinta }}>{m.label}</Text>
              <Text style={{ width: 26, fontFamily: t.fonteTitulo, fontSize: 16, color: t.destaqueTexto, textAlign: 'center' }}>{v ?? '?'}</Text>
              <Text style={{ flex: 1, fontSize: 9, color: t.tintaSuave }}>{v != null ? (NUMERO_NOMES[v] ?? '') : ''} · {m.origem}</Text>
            </Card>
          );
        })}
      </View>

      <H2 theme={t}>O que isso quer dizer</H2>
      <View style={{ gap: 4 }}>
        {frases.map((f) => <P key={f} theme={t} size={9.5}>{f}</P>)}
      </View>

      <View style={{ marginTop: 'auto' }}>
        <Card theme={t} alt>
          <H4 theme={t}>Por onde seguir</H4>
          <P theme={t} size={9}>A Parte 1 detalha cada número, o arquétipo, o Triângulo da Vida e o campo kármico. No fim, veja o potencial da sua assinatura.</P>
        </Card>
      </View>
      <PDFFooter />
    </Page>
  );
}

// ── Como ler ────────────────────────────────────────────────────────────────
export function PDFComoLerGratuito({ theme: t, nomeNascimento }: { theme: PdfLayoutTheme; nomeNascimento: string }) {
  const quadros: Array<[string, string]> = [
    ['Número em destaque', 'O resultado do cálculo daquela leitura. O texto ao lado explica o que ele indica.'],
    ['Cor da nota', 'Verde 85 a 100, verde-limão 70 a 84, amarelo 50 a 69, laranja 30 a 49 e vermelho até 29. É a mesma regra do site.'],
    ['Bloqueio', 'Três ou mais números iguais lado a lado em um triângulo, marcados em vermelho.'],
    ['Arcano regente', 'O número da ponta do Triângulo da Vida, marcado em roxo.'],
  ];
  return (
    <Page size="A4" style={estiloPagina(t)}>
      <PDFSectionAnchor id="pdf-intro-leitura" bookmark={{ title: 'Como ler este relatório', fit: true }} />
      <PDFPageHeader subtitle={`${nomeNascimento} — Como ler`} />
      <H1 theme={t}>Como ler este relatório</H1>
      <View style={{ marginBottom: 10 }}>
        <P theme={t} size={9.5}>Uma ferramenta de autoconhecimento: organiza o cálculo do seu nome para você entender e decidir, sem prometer resultados.</P>
      </View>
      <H2 theme={t}>O mapa do documento</H2>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {[
          ['Parte 1 · Você hoje', 'Os números, o arquétipo, o Triângulo da Vida e o campo kármico do nome de nascimento.'],
          ['O que o mapa mostrou', 'O resumo dos pontos de atenção, em linguagem simples.'],
          ['Seu potencial', 'Até onde a nota pode chegar com outra forma de assinar.'],
        ].map(([a, b]) => (
          <Card key={a} theme={t} style={{ flex: 1 }}>
            <H3 theme={t}>{a}</H3>
            <P theme={t} size={8.5}>{b}</P>
          </Card>
        ))}
      </View>
      <H2 theme={t}>Como ler cada quadro</H2>
      <View style={{ gap: 6 }}>
        {quadros.map(([a, b]) => (
          <Card key={a} theme={t} alt>
            <H4 theme={t}>{a}</H4>
            <P theme={t} size={9}>{b}</P>
          </Card>
        ))}
      </View>
      <PDFFooter />
    </Page>
  );
}

// ── Parte 1 · Você hoje ─────────────────────────────────────────────────────
export function PDFParte1Gratuito(p: GratuitoLayoutProps) {
  const t = p.theme;
  return (
    <Page size="A4" style={estiloPagina(t)}>
      <PDFSectionAnchor id="pdf-essencia" bookmark={{ title: 'Parte 1 · Você hoje', fit: true }} />
      <PDFPageHeader subtitle={`${p.nomeNascimento} — Parte 1 · Você hoje`} />
      <SeloParte theme={t}>Parte 1 · Você hoje</SeloParte>
      <View style={{ marginBottom: 10 }}>
        <H1 theme={t}>{p.nomeNascimento}</H1>
        <Nota theme={t}>Nome de nascimento · {p.dataNascimento}</Nota>
      </View>

      <View wrap={false} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <PDFSectionAnchor id="pdf-essencia-destino" bookmark={{ title: 'Destino', fit: true }} />
        <Card theme={t} fundo={COR_FIXA.arcanoFundo} style={{ width: 140, alignItems: 'center', justifyContent: 'center' }}>
          <H3 theme={t} color={COR_FIXA.arcanoTexto}>Destino</H3>
          <Text style={{ fontFamily: t.fonteTitulo, fontSize: 36, color: '#2E1B6B', lineHeight: 1 }}>{p.numeros.destino ?? '—'}</Text>
          <Nota theme={t}>vem da data de nascimento</Nota>
        </Card>
        <Card theme={t} style={{ flex: 1 }}>
          <H4 theme={t}>O que não muda com o nome</H4>
          <P theme={t} size={9}>O Destino é calculado pela data de nascimento e acompanha qualquer nome. Os outros quatro números vêm das letras e mudam conforme a forma de assinar.</P>
        </Card>
      </View>

      <PDFSectionAnchor id="pdf-essencia-expressao" bookmark={{ title: 'Os Números do Nome', fit: true }} />
      <H2 theme={t}>Os 5 números do seu nome</H2>
      <View style={{ gap: 6 }}>
        {NUMEROS_META.map((m) => {
          const v = p.numeros[m.k] ?? null;
          return (
            <Card key={m.k} theme={t} alt={m.k === 'destino'}>
              {m.k !== 'destino' && m.k !== 'expressao' ? <PDFSectionAnchor id={`pdf-essencia-${m.k}`} bookmark={{ title: m.label, fit: true }} /> : null}
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ width: 28, textAlign: 'center', fontFamily: t.fonteTitulo, fontSize: 20, color: t.destaqueTexto, lineHeight: 1 }}>{v ?? '?'}</Text>
                <View style={{ flex: 1 }}>
                  <H3 theme={t}>{`${m.label} · ${m.origem}`}</H3>
                  {v != null && NUMERO_NOMES[v] ? <H4 theme={t}>{NUMERO_NOMES[v]}</H4> : null}
                  <P theme={t} size={8.5}>{v != null ? (m.desc[v] ?? '') : ''}</P>
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      <ArquetipoLayout
        theme={t}
        arquetipo={p.arquetipo}
        expressao={p.numeros.expressao ?? 1}
        anchorId="pdf-essencia-arquetipo"
        bookmarkTitle="Arquétipo Vibracional (Nascimento)"
        titulo="Arquétipo Vibracional"
      />

      {p.tVida ? (
        <View break>
          <PDFSectionAnchor id="pdf-essencia-triangulo-vida" bookmark={{ title: 'Triângulo da Vida', fit: true }} />
          <H2 theme={t}>O Triângulo da Vida (Nascimento)</H2>
          <View style={{ marginBottom: 6 }}>
            <P theme={t} size={9}>Cada letra vira um número e os vizinhos são somados, linha a linha, até sobrar um só. Três ou mais números iguais lado a lado formam um bloqueio, em vermelho. A ponta, em roxo, é o arcano regente.</P>
          </View>
          <PDFTriangleDetailsBlock
            compact
            layoutTheme={t}
            data={p.tVida}
            triangulo="vida"
            pyramidLabel="TRIÂNGULO DA VIDA"
            cellSize={p.triCellSize}
            letras={p.letras}
            bloqueiosTitle="Bloqueios do Triângulo da Vida"
            arcanosTitle="Arcano regente do Triângulo da Vida"
            allBloqueios={p.bloqueios}
          />
        </View>
      ) : null}

      <View style={{ marginTop: 14 }}>
        <PDFSectionAnchor id="pdf-essencia-karma" bookmark={{ title: 'O Peso do Passado', fit: true }} />
        <H2 theme={t}>O campo kármico</H2>
        <View style={{ marginBottom: 6 }}>
          <P theme={t} size={9}>Débitos kármicos (padrões a equilibrar), lições kármicas (números ausentes, qualidades a desenvolver) e tendências ocultas (números em excesso).</P>
        </View>
        <PDFSectionAnchor id="pdf-essencia-debitos" bookmark={{ title: 'Débitos kármicos', fit: true }} />
        <View minPresenceAhead={110}><H3 theme={t}>Débitos kármicos</H3></View>
        <DebitosLayout theme={t} debitos={p.debitos} />
        <View style={{ height: 10 }} />
        <PDFSectionAnchor id="pdf-essencia-licoes" bookmark={{ title: 'Lições kármicas', fit: true }} />
        <View minPresenceAhead={110}><H3 theme={t}>Lições kármicas</H3></View>
        <LicoesLayout theme={t} licoes={p.licoes} />
        <View style={{ height: 10 }} />
        <PDFSectionAnchor id="pdf-essencia-tendencias" bookmark={{ title: 'Tendências ocultas', fit: true }} />
        <View minPresenceAhead={110}><H3 theme={t}>Tendências ocultas</H3></View>
        <TendenciasLayout theme={t} tendencias={p.tendencias} frequencias={p.frequencias} />
      </View>
      <PDFFooter />
    </Page>
  );
}

// ── O que este mapa mostrou + como chegamos à nota ──────────────────────────
export function PDFMapaMostrouGratuito(p: GratuitoLayoutProps) {
  const t = p.theme;
  const itens: Array<{ n: number; titulo: string; texto: string; fundo?: string; cor?: string }> = [
    { n: p.bloqueios.length, titulo: pl(p.bloqueios.length, 'bloqueio', 'bloqueios'), texto: 'Sequências repetidas nos 4 triângulos: pontos que pedem mais atenção.', fundo: p.bloqueios.length > 0 ? COR_FIXA.bloqueioFundo : undefined, cor: p.bloqueios.length > 0 ? COR_FIXA.bloqueioTexto : undefined },
    { n: p.debitos.length, titulo: pl(p.debitos.length, 'débito kármico', 'débitos kármicos'), texto: 'Padrões a equilibrar ao longo da vida. Os que vêm da data não mudam com o nome.' },
    { n: p.licoes.length, titulo: pl(p.licoes.length, 'lição kármica', 'lições kármicas'), texto: 'Números ausentes no nome: qualidades para desenvolver com prática.' },
    { n: p.tendencias.length, titulo: pl(p.tendencias.length, 'tendência oculta', 'tendências ocultas'), texto: 'Números em excesso: qualidades que pedem equilíbrio.', fundo: p.tendencias.length > 0 ? COR_FIXA.arcanoFundo : undefined, cor: p.tendencias.length > 0 ? COR_FIXA.arcanoTexto : undefined },
  ];
  return (
    <Page size="A4" style={estiloPagina(t)}>
      <PDFSectionAnchor id="pdf-mapa" bookmark={{ title: 'O que este mapa mostrou', fit: true }} />
      <PDFPageHeader subtitle={`${p.nomeNascimento} — O que este mapa mostrou`} />
      <H1 theme={t}>O que este mapa mostrou</H1>
      <View style={{ marginBottom: 10 }}>
        <P theme={t} size={9.5}>Os pontos de atenção do seu nome de nascimento, de forma resumida.</P>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {itens.map((i) => (
          <Card key={i.titulo} theme={t} fundo={i.fundo} style={{ width: '48.5%' }}>
            <Text style={{ fontFamily: t.fonteTitulo, fontSize: 22, color: i.cor ?? t.destaqueTexto }}>{i.n}</Text>
            <H4 theme={t} color={i.cor}>{i.titulo}</H4>
            <P theme={t} size={8.5}>{i.texto}</P>
          </Card>
        ))}
      </View>
      <Card theme={t} alt style={{ marginBottom: 14 }}>
        <P theme={t} size={9}>A numerologia cabalística descreve esses pontos como tensões do nome atual, não como diagnóstico. Outras formas de assinar podem mudar parte deles: a harmonização permite comparar nota, bloqueios e triângulos lado a lado, sem promessa de resultado.</P>
      </Card>

      <PDFSectionAnchor id="pdf-score" bookmark={{ title: 'Como chegamos à sua nota', fit: true }} />
      <H2 theme={t}>Como chegamos à sua nota</H2>
      <PDFComoChegamosSugestoes
        layoutTheme={t}
        passos={PASSOS_NOTA_GRATUITO}
        intro="O cálculo é matemático e sempre o mesmo para a mesma entrada: nada aqui é sorteado. Estes são os passos que levaram à sua nota."
      />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {[85, 70, 50, 30, 0].map((s) => {
          const f = faixaNotaPapel(s);
          return <Chip key={s} theme={t} fundo={f.fundo} cor={f.texto}>{`${s === 0 ? '0–29' : s === 30 ? '30–49' : s === 50 ? '50–69' : s === 70 ? '70–84' : '85–100'} · ${f.rotulo}`}</Chip>;
        })}
      </View>
      <PDFFooter />
    </Page>
  );
}
