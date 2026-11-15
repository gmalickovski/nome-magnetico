# DEV-299 — contratos de PDF, contexto e avaliação manual

## Mapa e capítulos

`resolveRadarContext` é a fonte compartilhada de contexto do chat, da reabertura e do PDF. `radarVersion` e `radarSnapshot` são campos aditivos de `frequencias_numeros`; não exigem schema novo. O snapshot identifica nascimento e assinatura e guarda os cinco eixos efetivamente calculados. Nomes ou versão diferentes impedem seu reaproveitamento.

O Mapa usa `computeContextualRadarAxes`, sem alterar a nota global. Os valores são índices de 0 a 100, e o delta é uma diferença em pontos. Ausência de contexto usa o motor geral e é explicitada. `getScoreTierVisual` resolve a cor de cada série pelo score; a opacidade de 4% é compartilhada entre HTML e PDF. Nascimento é desenhado antes da assinatura, pontilhado, fino e com opacidade de linha a 55%; assinatura fica por cima com linha contínua mais forte. O PDF também distingue quadrado e círculo. O SVG reserva folga moderada entre parágrafo, rótulo superior, rótulos inferiores e legenda.

Essência, Harmonização, Nome Harmonizado e Anexos são capítulos com `<Page>` independentes. Não juntar capítulos para ocupar espaço sobrando. Âncoras de seção ficam no primeiro filho de cada capítulo; usar `PDFSectionAnchor`, pois IDs diretamente em uma `Page` que se estende podem apontar à última folha.

O sumário suporta níveis 0–3. Os seis triângulos complementares mantêm seus componentes/conteúdo e destinos; só a localização muda para Anexos → Leitura complementar dos triângulos. Vida continua nas duas leituras principais. O two-pass resolve as páginas; títulos também presentes no índice devem ser localizados nos testes pelo destino real do corpo, não pela primeira ocorrência textual.

## Cota manual e persistência

`POST /api/evaluate-name` recebe `action: start` para registrar o contexto validado e emitir um ID opaco vinculado ao usuário; `action: evaluate` aceita esse ID e um nome. Histórico/contador fornecido pelo navegador nunca define o saldo. Resultados únicos concluídos consomem uma das cinco avaliações; duplicata, entrada inválida e exceção não consomem. O cálculo síncrono não cede execução entre verificação e contagem.

As sessões são efêmeras: limite de 24 horas, até 1.000 sessões no worker e recusa de ID desconhecido, inclusive em reinício/outro worker. É uma cota por sessão, não por usuário/período e não distribuída. Reiniciar explicitamente a entrevista cria outra sessão; recarregar/retomar a mesma entrevista conserva seu ID. Para vários workers, é necessário encaminhar a sessão ao emissor ou aprovar persistência compartilhada antes de habilitar esse cenário.

Resultados manuais têm `origem: manual` e score real do painel v3. Salvar/exportar continua pelo fluxo existente, com `nomes_manuais` limitado a cinco e ranking somente dos nomes vistos no chat. O caminho de persistência aceita nota inferior para manual, mantém a regra de melhoria para geração automática e grava os resultados no JSON já existente. O popup de salvar/baixar é preservado.

Nenhum nome ou nascimento é enviado pelos novos eventos de analytics. Validações e testes usam fixtures fictícias; revisão editorial e smoke autenticado no ambiente TESTE continuam necessários antes de qualquer liberação humana.
