# SOP · Copy e marketing sobre os triângulos (24/11/2026)

**Decisão (Guilherme, 24/11/2026):** o Nome Magnético não vende mais "4 triângulos". O cálculo principal é o **Triângulo da Vida**. Os triângulos **Pessoal, Social e Destino** aparecem só como **leitura complementar, informação extra no PDF**.

## O que escrever

| Em vez de | Escreva |
| --- | --- |
| "4 triângulos", "os quatro triângulos" | "Triângulo da Vida" |
| "zero bloqueios nos 4 triângulos" | "zero bloqueios no Triângulo da Vida" |
| "análise dos 4 triângulos" | "Triângulo da Vida e leituras complementares no PDF" |
| "Vida, Pessoal, Social e Destino" como cálculo | "Triângulo da Vida (principal); Pessoal, Social e Destino como leitura complementar no PDF" |

- Pessoal, Social e Destino podem ser citados como **informação extra** do PDF, nunca como parte do cálculo da nota nem como requisito das sugestões.
- A nota de 0 a 100 parte do Triângulo da Vida (v3: `descontosSequenciasVida`).

## Onde vale

Landing, páginas de caminho, anúncios, e-mails (Brevo), FAQs (`faq_items`), glossário (`glossary_terms`), blog, metas de SEO, mockups da landing e textos de PDF voltados ao cliente.

Telas de resultado dentro do app (`NomeAtualResultado`, `NomeSocialResultado`, etc.) e textos geradas por IA ainda citam os 4 triângulos: tratar na DEV-352.

## Estado do código (para não prometer o que o motor não faz)

- `calcularTodosTriangulos` ainda calcula os 4.
- `detectarBloqueios(todos)` ainda barra sugestões com bloqueio em qualquer triângulo (Nome Social em `nome-social.ts`, Artístico e Bebê em `products/shared/avaliar-candidato.ts`).
- Se o filtro passar a olhar só o Triângulo da Vida, algumas sugestões hoje descartadas passarão a aparecer; a regra de qualidade (nota 80+ para nomes novos, 70+ para variações) continua.
- Alinhamento do motor, do PDF e do prompt da IA: **DEV-352**.

## Checagem antes de publicar copy

```bash
grep -rniE "4 tri[âa]ngulos|quatro tri[âa]ngulos" src docs
```
