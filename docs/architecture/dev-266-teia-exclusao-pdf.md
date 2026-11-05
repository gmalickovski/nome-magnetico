# DEV-266 — Teia no PDF: exclusão deliberada

**Status:** bloqueado neste pacote (PR DEV-266).

## Contexto

A Marca pediu paridade com o gráfico que o usuário chama de «teia» no **resumo real** do app. A auditoria offline (SHA `251a2c8`) mapeou três superfícies distintas:

1. Quatro triângulos / pirâmides (`TriangleVisualization`) — já presentes nos PDFs.
2. Estrela de cinco números (`ProductHarmonyStar` / `PDFDoubleStar`) — presente no PDF pago.
3. **Candidato não confirmado:** «Mapa de Alinhamento Vibracional» (`ReadingRadar` + `computeContextualRadarAxes`).

Sem captura do componente exato no DOM de produção e cadeia de props validada, **não incluir** radar/mapa no PDF neste PR.

## Próximo passo (fora deste escopo)

Confirmar com screenshot + props do resumo app se a teia = item 3 ou outro; só então especificar render PDF (provavelmente SVG estático ou rasterização controlada).
