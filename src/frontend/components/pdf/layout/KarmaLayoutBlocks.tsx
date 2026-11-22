/**
 * Blocos de bloqueios, débitos, lições, tendências e arquétipo no layout base (DEV-322).
 * Mesmo conteúdo dos blocos antigos (`shared/PDFKarmicBlock.tsx`, `PDFArquetipoDetailBlock.tsx`),
 * com o visual novo: cards por fundo, sem bordas de seção, cores pelo tema.
 * Os PDFs antigos (gratuito, empresa) seguem com os blocos antigos.
 */
import { View, Text } from '@react-pdf/renderer';
import type { BloqueioData, DebitoData, LicaoData, TendenciaData } from '../shared/PDFKarmicBlock';
import type { Arquetipo } from '../../../../backend/numerology/archetypes';
import { PDFSectionAnchor } from '../shared/PDFSectionAnchor';
import { Card, Chip, H2, H3, H4, Nota, P } from './PDFLayoutBlocks';
import { COR_FIXA, LAYOUT_THEME_PADRAO, type PdfLayoutTheme } from './pdfLayoutTheme';

type T = { theme?: PdfLayoutTheme };
const th = (t?: PdfLayoutTheme) => t ?? LAYOUT_THEME_PADRAO;

function Vazio({ children, theme }: { children: string } & T) {
  return (
    <Card theme={theme} alt>
      <P theme={theme} size={9}>{children}</P>
    </Card>
  );
}

export function BloqueiosLayout({ bloqueios, theme, isNomeSocial = true }: { bloqueios: BloqueioData[]; isNomeSocial?: boolean } & T) {
  const t = th(theme);
  if (bloqueios.length === 0) return <Vazio theme={t}>Nenhum bloqueio neste triângulo.</Vazio>;
  return (
    <View style={{ gap: 6 }}>
      {bloqueios.map((b, i) => {
        const titulo = isNomeSocial ? b.titulo.replace(new RegExp(`\\s*\\(${b.codigo}\\)\\s*`), '') : b.titulo;
        return (
          <Card key={i} theme={t} fundo={COR_FIXA.bloqueioFundo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <View style={{ backgroundColor: COR_FIXA.bloqueio, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 8, fontFamily: t.fonteTextoBold, color: '#FFFFFF' }}>{b.codigo}</Text>
              </View>
              <H4 theme={t} color={COR_FIXA.bloqueioTexto}>{titulo}</H4>
            </View>
            <P theme={t} size={9}>{b.descricao}</P>
          </Card>
        );
      })}
    </View>
  );
}

export function DebitosLayout({ debitos, theme }: { debitos: DebitoData[] } & T) {
  const t = th(theme);
  if (debitos.length === 0) return <Vazio theme={t}>Nenhum débito kármico encontrado.</Vazio>;
  return (
    <View style={{ gap: 6 }}>
      {debitos.map((d, i) => (
        <Card key={i} theme={t} alt={d.fixo === true}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <H4 theme={t}>{d.titulo}</H4>
            {d.fixo ? <Chip theme={t} fundo={COR_FIXA.igualFundo} cor={COR_FIXA.igualTexto}>Vem da data de nascimento</Chip> : null}
          </View>
          <P theme={t} size={9}>{d.descricao}</P>
          {d.fixo ? <Nota theme={t}>Ligado ao dia de nascimento ou ao Destino: nenhum nome muda este débito.</Nota> : null}
        </Card>
      ))}
    </View>
  );
}

export function LicoesLayout({ licoes, theme }: { licoes: LicaoData[] } & T) {
  const t = th(theme);
  if (licoes.length === 0) return <Vazio theme={t}>Nenhuma lição kármica: todos os números aparecem no nome.</Vazio>;
  return (
    <View style={{ gap: 6 }}>
      {licoes.map((l, i) => (
        <Card key={i} theme={t}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: t.fonteTitulo, fontSize: 18, color: t.destaqueTexto, minWidth: 16, lineHeight: 1 }}>{l.numero}</Text>
            <View style={{ flex: 1 }}>
              <H4 theme={t}>{l.titulo}</H4>
              <P theme={t} size={9}>{l.descricao}</P>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

export function TendenciasLayout({ tendencias, frequencias, theme }: { tendencias: TendenciaData[]; frequencias?: Record<string, number> | null } & T) {
  const t = th(theme);
  const entradas = Object.entries(frequencias ?? {})
    .map(([k, v]) => ({ num: Number(k), count: v }))
    .filter((e) => e.num >= 1 && e.num <= 8)
    .sort((a, b) => a.num - b.num);
  const max = Math.max(1, ...entradas.map((e) => e.count));
  return (
    <View style={{ gap: 6 }}>
      {entradas.length > 0 && (
        <Card theme={t} alt>
          <H3 theme={t}>Quantas vezes cada número aparece no nome</H3>
          <View style={{ gap: 3, marginTop: 4 }}>
            {entradas.map(({ num, count }) => {
              const excesso = count >= 4;
              return (
                <View key={num} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ width: 10, fontSize: 8.5, fontFamily: t.fonteTextoBold, color: t.tinta }}>{num}</Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: t.cardFundo, borderRadius: 3 }}>
                    <View style={{ width: `${(count / max) * 100}%`, height: 6, borderRadius: 3, backgroundColor: excesso ? COR_FIXA.arcano : t.destaque }} />
                  </View>
                  <Text style={{ width: 22, fontSize: 8, color: excesso ? COR_FIXA.arcanoTexto : t.apagado, fontFamily: excesso ? t.fonteTextoBold : t.fonteTexto }}>{count}x</Text>
                </View>
              );
            })}
          </View>
          <Nota theme={t}>Em roxo, os números que aparecem 4 vezes ou mais (tendência oculta).</Nota>
        </Card>
      )}
      {tendencias.length === 0 ? (
        <Vazio theme={t}>Nenhuma tendência oculta: nenhum número se repete em excesso.</Vazio>
      ) : (
        tendencias.map((td, i) => (
          <Card key={i} theme={t} fundo={COR_FIXA.arcanoFundo}>
            <H4 theme={t} color={COR_FIXA.arcanoTexto}>{`${td.titulo} · ${td.frequencia}x no nome`}</H4>
            <P theme={t} size={9}>{td.descricao}</P>
          </Card>
        ))
      )}
    </View>
  );
}

export function ArquetipoLayout({
  arquetipo,
  expressao,
  anchorId,
  bookmarkTitle,
  titulo,
  theme,
}: { arquetipo: Arquetipo; expressao: number; anchorId: string; bookmarkTitle: string; titulo: string } & T) {
  const t = th(theme);
  return (
    <View style={{ marginTop: 10 }}>
      <PDFSectionAnchor id={anchorId} bookmark={{ title: bookmarkTitle, fit: true }} />
      <H2 theme={t}>{titulo}</H2>
      <Card theme={t} fundo={COR_FIXA.arcanoFundo} style={{ marginBottom: 6 }}>
        <H3 theme={t} color={COR_FIXA.arcanoTexto}>{`Expressão ${expressao} · arquétipo`}</H3>
        <Text style={{ fontFamily: t.fonteTitulo, fontSize: 18, color: '#2E1B6B', marginBottom: 2 }}>{arquetipo.nome}</Text>
        {arquetipo.essencia ? <P theme={t} size={9} color={COR_FIXA.arcanoTexto}>{`“${arquetipo.essencia}”`}</P> : null}
      </Card>
      {arquetipo.descricao ? <View style={{ marginBottom: 6 }}><P theme={t} size={9}>{arquetipo.descricao}</P></View> : null}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Card theme={t} style={{ flex: 1 }}>
          <H3 theme={t}>Quando flui bem</H3>
          {(arquetipo.expressaoPositiva ?? []).map((x: string, i: number) => <P key={i} theme={t} size={8.5}>{`· ${x}`}</P>)}
        </Card>
        <Card theme={t} alt style={{ flex: 1 }}>
          <H3 theme={t}>Pede atenção</H3>
          {(arquetipo.expressaoSombra ?? []).map((x: string, i: number) => <P key={i} theme={t} size={8.5}>{`· ${x}`}</P>)}
        </Card>
      </View>
    </View>
  );
}
