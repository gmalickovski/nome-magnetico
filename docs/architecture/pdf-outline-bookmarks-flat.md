# PDF — sumário vs outline (bookmarks)

## O que entregamos

- **Sumário (`PDFTableOfContents`)** com níveis 0/1/2 (recuo visual) e links internos `#id` com números de página (two-pass).
- **Bookmarks** via `PDFSectionAnchor` + prop `bookmark` do `@react-pdf/renderer`.

## Limite da engine

O tipo `Bookmark` exposto em `@react-pdf/types` é plano (`title`, `fit`, `expanded`) — **não há API de pai/filho** para outline hierárquico nativo no visualizador. Cada `bookmark` vira um item de primeiro nível no painel “Marcadores” do PDF.

Referência: `node_modules/@react-pdf/types/bookmark.d.ts`.

## Implicação

Recuo no sumário **≠** hierarquia no outline. Para navegação por assunto, use o sumário paginado; bookmarks listam seções principais e subassuntos como entradas irmãs.
