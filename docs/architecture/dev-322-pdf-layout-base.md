# DEV-322 — Layout base dos PDFs (Nome Social, Artístico e Bebê)

Aprovado pelo Guilherme em 22/11/2026. Referência visual navegável: canvas privado
https://claude.ai/artifact/BTTH6mhL2Phan94tMkwD9H. Cópia dos arquivos em
[`pdf-layout-base/`](./pdf-layout-base/) (`.dc.html`, um por página, dados de exemplo).

Esta é a **base única** dos três PDFs pagos. O motor escolhe a variante pelo caminho
do chat (`perfilChat.motivo`): `dia_a_dia` → Nome Social, `artistico` → Nome Artístico,
`bebe` → Nome do Bebê. Mesma moldura e mesmos blocos; mudam a capa, o tom do texto e
alguns módulos.

## 1. Sistema de blocos (igual nos três)

| Bloco | Uso | Padrão |
| --- | --- | --- |
| Selo de parte | abre cada Parte, sempre em página nova | pílula escura, caixa alta |
| H1 | título da Parte | fonte de título 30 px, cor de destaque |
| H2 | seção | fonte de título 20 px |
| H3 | subtítulo de bloco | Inter 12 px caixa alta, 0,12em |
| H4 | título de card | Inter 14 px semibold |
| P / nota | leitura / legenda | Inter 14 px, 1,6 / 11 px |
| Card | leitura, destaque, bloqueio | sem linhas; fundo e espaço (regra NO-LINE) |
| Número em destaque | número + título curto | fonte de título 26–34 px |
| Selo (chip) | Melhorou, Igual, Pede atenção, compatibilidade | pílula |

Página: A4, margens 56/60/40 px, fundo `#FBF9F4`, cabeçalho (marca + contexto) e rodapé
(aviso de autoconhecimento + página).

## 2. Cores com regra fixa

- **Faixas da nota** (estrela, teia, nota e tudo ligado ao score): as mesmas de
  `getScoreTierVisual` (`src/frontend/components/landing/score-tier-visual.ts`).
  Forma usa `stroke`; texto no papel claro usa o tom escuro: 85–100 `#047857`,
  70–84 `#4D7C0F`, 50–69 `#A16207`, 30–49 `#C2410C`, 0–29 `#B91C1C`.
- **Estrela dupla**: externa = faixa do nome novo, interna = faixa do nascimento
  (igual a `ProductHarmonyStar`). `PDFDoubleStar` e `PDFMapaVibracional` já usam essas
  faixas: manter a lógica, trocar só o visual.
- **Bloqueio**: vermelho `#B3261E`, só para bloqueio real.
- **Arcanos**: roxo (`#6D4FC2`, fundo `#EDE6FF`). A **ponta de todo triângulo** (o
  arcano regente, `arcanoRegente = linhaAtual[0]` em `triangle.ts`) fica marcada em roxo.
- Antes/depois fora do score: cinza para o nascimento, cor de destaque para o novo.

## 3. Tema da marca (base do plano profissional)

Tudo que é visual vem de um objeto de tema (evoluir `shared/PDFTheme.ts`), nunca de
cores e fontes soltas nos componentes:

`marca` (nome, logo, contato), `destaque` (cor + tom de texto), `formatoCard`
(arredondado 16 / suave 6 / quadrado 0), `estiloCard` (preenchido / borda / só linha),
`fonteTitulo` (Cinzel, Playfair Display, Cormorant Garamond, Montserrat), `fonteTexto`
(Inter, Lato, Nunito, Source Sans 3), `capa` (escura / clara).

Fixo em qualquer tema: o cálculo, as faixas da nota, o vermelho de bloqueio e o aviso
de autoconhecimento. Página de referência: `Tema.dc.html`.

## 4. Nome Social (primeiro a implementar)

Ordem: Capa · Sumário · Resumo de 1 página · Como ler · Opções avaliadas ·
**Parte 1 Você hoje** (estrela, 5 números, arquétipo, Triângulo da Vida, lições,
tendências, débitos) · **Parte 2 O que muda para você** (veredito Melhorou/Igual/Pede
atenção, estrela comparativa, Mapa Vibracional em teia, "o que o nome não muda", tabela
antes e depois com frase por item, Saiu/Entrou/Continua) · **Parte 3 Seu nome novo**
(só números e arcanos que mudaram + Triângulo da Vida novo) · **Parte 4 Como usar**
(guia, como chegamos às sugestões, folha de treino) · **Anexos** (uma página por
dimensão: Pessoal, Social e Destino, nascimento e nome novo lado a lado; Ciclos do nome
com os arcanos de trânsito; consulta rápida dos arcanos). Meta: cerca de 30 páginas.

Arcano de trânsito só nos anexos: é leitura de momento (90 anos ÷ pares de letras,
cerca de 5 anos por fase), muda com o tamanho do nome e as fontes divergem na duração.
Sempre com "período aproximado".

### Passos de implementação

1. Tema: tokens do item 3 em `PDFTheme.ts` + paleta das faixas no papel.
2. Blocos base em `shared/`: moldura de página (cabeçalho e rodapé), selo de parte,
   estilos H1–H4/P, card por variante, número em destaque, selo.
3. Páginas novas na ordem acima, reaproveitando os cálculos atuais de `NomeSocialPDF`.
4. Triângulo: marcar a ponta em roxo em `TrianguloPiramideInline`.
5. Sumário e bookmarks (`pdfTocCatalog`) e testes (`pdf-dev266`, `pdfTocCatalog`).
6. Remover os blocos antigos que viraram espelho (Nome Social repetindo a Essência).

## 5. Nome Artístico (mesma base)

Capa "palco" (escura, dourado e roxo). Resumo · Como ler · **Parte 1 Você** (nome civil
em versão curta) · **Parte 2 Seu nome artístico** (nomes próximos e novos com etiqueta,
nota com as faixas, por que o número favorece a área escolhida) · **Parte 3 No palco**
(assinatura artística, redes, consistência de uso, card informativo de contratos e
documentos, sem orientação jurídica) · Anexos.

## 6. Nome do Bebê: um manual para os pais

Tom de carinho e cuidado, lúdico, falando com os pais. Sem previsões nem promessas e
sem saúde: qualidades para acolher e estimular.

- **Capa pastel** por sexo (rosa, azul, neutro verde-menta ou lavanda), formas suaves.
  O tema `nome_bebe` já existe em `PDFTheme.ts`.
- **Carta aos pais**: o que este manual é e como usar.
- **Resumo**: o nome escolhido, nota com as faixas, sem bloqueios.
- **Parte 1 Quem está chegando**: o Destino do bebê (data exata ou janela) em linguagem
  de pais.
- **Parte 2 O nome de vocês para ele(a)**: estrela, 5 números e Triângulo da Vida.
- **Parte 3 Os nomes que vocês pensaram**: comparação; nomes digitados pelos pais
  aparecem com o bloqueio, se houver (são análise, não sugestão).
- **Dias possíveis do parto** (só com data prevista): "bom em X dos Y dias".
- **Parte 4 Crescendo com o nome**: qualidades para estimular em cada fase (bebê,
  infância, adolescência) a partir de lições e tendências; apelidos; como contar a
  história do nome para a criança.
- **Entender o seu filho pelas energias do nome** (tendências, nunca destino fechado):
  - como ele(a) tende a se expressar (Expressão), o que o(a) motiva por dentro
    (Motivação) e como os outros tendem a percebê-lo(a) (Impressão);
  - como acolher em momentos difíceis e o que ajuda a acalmar, conforme o número;
  - como ele(a) tende a aprender e brincar, e que tipo de estímulo combina;
  - talentos para observar e incentivar, sem pressão;
  - como a energia do bebê conversa com a dos pais (Expressão dos pais × do bebê), em
    tom de convivência, sem rótulo de "compatível" ou "incompatível".
- **Caminho holístico para a família**: pequenos rituais de acolhimento do nome (dizer
  o nome com carinho, contar a história da escolha), ambiente da casa e cores que
  combinam com a vibração do nome, palavras-chave da família, e lições kármicas
  apresentadas como qualidades que os pais podem cultivar juntos.
- **Páginas de lembrança** (lúdicas): "a história do seu nome", carta para o filho ler
  no futuro, espaço para foto.
- **Aviso** sobre registro em cartório, sem prazos numéricos até confirmação jurídica.

## 7. Como o sistema escolhe

Ao gerar o PDF, `/api/analyze` lê `perfilChat.motivo` salvo em
`analyses.frequencias_numeros.perfilChat` e escolhe a variante. O caminho do bebê ainda
não salva o perfil na análise (pendência da DEV-326): resolver antes da variante Bebê.
