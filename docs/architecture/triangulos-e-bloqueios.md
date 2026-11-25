# Triângulos Numerológicos e Bloqueios — Referência para Agentes

> **Decisão de produto e marketing (24/11/2026):** o cálculo principal é o **Triângulo da Vida**. Landing, anúncios, e-mails, FAQ, glossário e blog falam só dele e **nunca** em "4 triângulos". Os triângulos Pessoal, Social e Destino aparecem apenas como **leitura complementar, informação extra no PDF**. Regra de vocabulário: `docs/sops/copy-triangulos.md`.
>
> **Estado do código na mesma data:** `calcularTodosTriangulos` ainda calcula os 4 triângulos e `detectarBloqueios(todos)` ainda barra sugestões (Nome Social, Artístico e Bebê) com bloqueio em qualquer um deles. A nota v3 já desconta sequências só do Triângulo da Vida (`descontosSequenciasVida`). Alinhar o filtro e o PDF à decisão é a DEV-352. Até lá, a descrição técnica abaixo vale para o código; a copy segue a decisão.

## Os 4 Triângulos (referência técnica)

Cada análise calcula **4 triângulos independentes** a partir do nome completo e data de nascimento.
Eles revelam dimensões diferentes da mesma frequência vibracional.

| Triângulo | Modificador da linha base | Dimensão revelada |
|-----------|--------------------------|-------------------|
| **Vida** (básico) | valor da letra apenas | Aspectos gerais — base de qualquer mapa |
| **Pessoal** | letra + dia de nascimento (reduzido) | Vida íntima, reações emocionais internas |
| **Social** | letra + mês de nascimento (reduzido) | Influências externas, percepção do mundo |
| **Destino** | letra + (dia+mês reduzidos) | Resultados, missão, colheita dos esforços |

### Hierarquia de análise

1. **Triângulo da Vida** é o mais representativo — use-o como âncora principal.
2. **Bloqueios recorrentes** (mesmo código em 2+ triângulos) = ponto crítico de atenção.
3. **Bloqueio no Pessoal** = trava psicológica/emocional.
4. **Bloqueio no Social** = fator externo ou relacional impede o progresso.
5. **Bloqueio no Destino** = a colheita dos esforços está impedida — o mais grave.

---

## Construção de cada triângulo

1. **Linha base**: para cada letra do nome (sem espaços), calcular `calcularValor(letra)` e somar o modificador correspondente, reduzindo a 1 dígito.
2. **Reduções sucessivas**: cada linha seguinte é formada pela soma reduzida de pares adjacentes da linha anterior, até restar 1 número.
3. **Arcano Regente**: o número final (1 dígito) que governa a vibração do triângulo.
4. **Arcanos Dominantes**: concatenação dos pares da linha base (ex.: 3 e 5 → 35).
5. **Sequências Negativas (Bloqueios)**: 3 ou mais dígitos iguais consecutivos em qualquer linha.

---

## Bloqueios (Sequências Negativas)

### Os 9 códigos e seus significados

| Código | Título | Impacto principal |
|--------|--------|-------------------|
| 111 | Iniciação | Falta de coragem, inatividade, dependência |
| 222 | Associação | Timidez, indecisão, perda de autoestima |
| 333 | Expressão | Dificuldade de comunicação, incompreensão |
| 444 | Estruturação | Má remuneração, falta de reconhecimento profissional |
| 555 | Liberdade | Mudanças indesejadas, inconstância |
| 666 | Harmonia | Exploração, ciúme, dificuldade de responsabilidade |
| 777 | Conexão Espiritual | Isolamento, introspecção excessiva |
| 888 | Poder e Abundância | Lutas financeiras, oscilação extrema |
| 999 | Compaixão Universal | Perdas, dificuldade de desapego, rancor |

### Detecção

- Regex `/(\d)\1{2,}/g` em cada linha do triângulo.
- Sequências mais longas (`3333`, `44444`) são normalizadas: `charAt(0).repeat(3)` → `333`, `444`.
- `3333` = **1 ocorrência** de `333` (um run contíguo = um match).
- Visualmente no SVG: **apenas os 3 primeiros dígitos** são destacados com fundo vermelho.

---

## Múltiplos bloqueios e repetições

### Múltiplos bloqueios distintos num mesmo triângulo
Um triângulo pode conter vários bloqueios diferentes ao mesmo tempo (ex.: 111, 333, 777, 888, 999
no Triângulo do Destino). Isso é normal e deve ser lido de forma integrada, não isolada.

### Repetição do mesmo bloqueio no mesmo triângulo
O código `444` pode aparecer em linhas diferentes do mesmo triângulo (ex.: linha 0 e linha 3).
Isso indica **intensificação** do bloqueio naquela dimensão.

Estrutura de dados relevante:

```typescript
interface Bloqueio {
  codigo: string;           // "444"
  triangulos: string[];     // ["vida", "destino"] — em quais triângulos aparece
  repeticoesPortriangulo: Partial<Record<string, number>>;
  // ex.: { vida: 1, destino: 2 } → 444 aparece 1× na Vida e 2× no Destino
  totalOcorrencias: number; // soma = 3
}
```

O campo `contagemSequencias` em cada `Triangulo` registra quantas vezes cada código aparece
nas linhas daquele triângulo: `{ "444": 2, "111": 1 }`.

### Compatibilidade com análises antigas
Análises salvas antes desta implementação podem não ter `contagemSequencias` nem
`repeticoesPortriangulo`. Sempre trate esses campos como opcionais com fallback para `1`.

---

## Impacto no Score

```
score = 100
  - bloqueios.length × 15          // penalidade por código único detectado
  - ocorrenciasExtras × 3          // extra por repetição (totalOcorrencias - length)
  - debitosCarmicos × 12
  - tendenciasOcultas × 2
  - licoesCarmicas × 1
  - penalidade_compatibilidade     // 0 | -5 | -15
```

Exemplo: nome com 2 bloqueios únicos, sendo que 1 deles aparece 3× no Destino:
- `bloqueios = 2` → -30
- `totalOcorrencias = 2 + 3 = 5`, `ocorrenciasExtras = 5 - 2 = 3` → -9
- Score base (sem outros fatores): 61

---

## Cruzamento de dados entre triângulos

| Combinação | Interpretação |
|-----------|---------------|
| Mesmo bloqueio em Vida + Pessoal | Padrão enraizado na identidade e na psique |
| Mesmo bloqueio em Social + Destino | Fator externo impede a colheita; o ambiente reflete a limitação |
| Bloqueio isolado apenas no Destino | Esforços não se convertem em resultado — foco prioritário da harmonização |
| Bloqueios em todos os 4 triângulos | Frequência amplamente bloqueada — harmonização urgente |

---

## Módulo de referência

- Tipos e lógica: `src/backend/numerology/triangle.ts`
- Score: `src/backend/numerology/score.ts`
- Harmonização: `src/backend/numerology/harmonization.ts`
- UI: `src/frontend/components/app/TriangleVisualization.tsx`
- PDF: `src/backend/pdf/template.tsx`
