# Sistema de Score e Compatibilidade Vibracional

> **Documento de referência técnico** para a equipe de desenvolvimento.  
> Esta lógica e especificação de pesos são partilhadas por todos os 3 produtos principais: **Nome Social**, **Nome Bebê** e **Nome Empresa**.

---

## 1. Visão Geral

Cada nome candidato avaliado pelo motor passa por dois critérios combinados:

1.  **Score numérico (0–100)** — mede a fluidez vibracional global do nome candidato.
2.  **Tipo de Compatibilidade** — classifica a harmonia entre o número de Expressão do nome e o número de Destino da pessoa (calculado a partir da data de nascimento/fundação).

Ambos os critérios são calculados no backend em `src/backend/numerology/harmonization.ts` e `src/backend/numerology/score.ts`.

---

## 2. Faixas de Score Oficial

A paleta de cores e labels visuais do frontend baseia-se em 5 faixas estruturadas de score:

| Faixa | Classificação | Cor no UI | Tailwind Utility |
| :--- | :--- | :--- | :--- |
| **90–100** | ⭐ Excelente | Verde Esmeralda | `text-emerald-500` / `bg-emerald-500/5` |
| **70–89** | ✅ Bom | Verde Esmeralda | `text-emerald-500` / `bg-emerald-500/5` |
| **40–69** | 〜 Aceitável | Laranja/Âmbar | `text-amber-500` / `bg-amber-500/5` |
| **20–39** | ⚠ Não Recomendado | Vermelho Claro | `text-red-400` / `bg-red-500/5` |
| **0–19** | 🔴 Crítico | Vermelho Forte | `text-red-600` / `bg-red-950/10` |

---

## 3. Pesos de Score e Validação Cabalística

O score reflete a soma determinística de penalidades aplicadas a um teto de 100 pontos, respeitando rigorosamente a gravidade espiritual e material dos desvios segundo as maiores autoridades de **Numerologia Cabalística**:

*   **Bloqueios nos Triângulos (`-15` pontos por código único)**: Representa o bloqueio geométrico absoluto e estagnação da energia em uma das quatro pirâmides (Vida, Pessoal, Social ou Destino). É o padrão de maior atrito material e físico, impedindo o fluxo da jornada.
*   **Ocorrências Extras de Bloqueios (`-3` pontos)**: Desconto sutil para repetições do mesmo bloqueio além da primeira ocorrência em triângulos diferentes.
*   **Débitos Kármicos (`-12` pontos por débito)**: Dívidas estruturais e morais herdadas de vidas passadas. A severidade alta reflete os grandes desafios materiais/emocionais impostos por essas vibrações em trânsito.
*   **Compatibilidade de Expressão × Destino (`0`, `-5` ou `-15` pontos)**: Atrito direto entre a energia de manifestação cotidiana (Expressão) e a estrada maior da alma (Destino).
*   **Tendências Ocultas (`-2` pontos por tendência)**: Desequilíbrios comportamentais leves causados pelo acúmulo compulsivo de um mesmo número (≥ 4 ocorrências).
*   **Lições Kármicas (`-1` ponto por lição)**: Ausência de uma ferramenta energética primária no nome. Facilmente integrada e compensada sob a harmonização.

> 💡 **Nota sobre Débitos Fixos e Score Teto:** Débitos kármicos de nascimento (derivados do dia de nascimento e/ou Destino) são **imutáveis**. Nenhuma alteração de nome pode apagá-los. O motor de cálculo expressa isso subtraindo-os diretamente do teto de score possível da pessoa (`calcularScoreTeto`). Se uma pessoa possui 1 débito fixo, seu score teto máximo é **88**; se possui 2, é **76**.

---

## 4. Tipos de Compatibilidade Expressão × Destino

O motor de compatibilidade (`src/backend/numerology/harmonization.ts`) avalia a vibração resultante da redução com suporte a números mestres (**11** e **22**), classificando a compatibilidade em 3 estados principais:

| Estado (Código) | Label Exibido ao Usuário | Cor Visual | Desconto no Score | Critério Cabalístico Hebraico |
| :--- | :--- | :--- | :--- | :--- |
| **`favoravel`** | ✦ Vibração Favorável | 🟢 Verde (`sky-400`) | `0` pontos | **Ressonância Perfeita:** Expressão e Destino possuem vibração idêntica ou somam números de maestria (9, 11, 22). O nome flui com a missão. |
| **`neutro`** | ◎ Vibração Neutra | 🟡 Âmbar (`amber-400`) | `-5` pontos | **Afinidade Aceitável:** Diferença absoluta de 1 entre Expressão e Destino. Convivência tolerável, sem sinergia cósmica marcante. |
| **`desfavoravel`** | ⚠ Tensão Vibracional | 🔴 Vermelho (`red-400`) | `-15` pontos | **Tensão Crítica:** Relação desarmônica entre frequências. Atua como âncora e gera atrito no cotidiano. |

> ⚠️ **Copy Crítico:** É terminantemente proibido exibir o termo "incompatível" na interface pública voltada ao cliente. O label correto a apresentar é sempre **"Tensão Vibracional"**.

---

## 5. Fluxo Unificado: Formulários e Relatórios

O ecossistema do Nome Magnético garante unificação total entre as ferramentas e visualizações:

1.  **Formulário Padrão do Usuário Pago** (`/api/analyze.ts` -> `/app/resultado/[id]`): Processa candidatos do cliente e sugestões geradas por IA, escolhendo o Nome de Ouro (`melhorNome`).
2.  **Área do Analista** (`/pages/app/admin-analise.astro` -> `/api/admin/save-analysis.ts`): Dashboard exclusivo de admin, onde as consultas instantâneas usam a mesma mecânica determinística de cálculo e salvam o nome selecionado em `selectedNomeSocial`.
3.  **Coerência de Resultados (HTML × PDF)**: A extração do nome dinâmico exibido (`nomeExibido`) prioriza `selectedNomeSocial` (o nome social escolhido e salvo). Os componentes HTML (`NomeSocialResultado.astro`) e PDF (`NomeSocialPDF.tsx`) realizam todos os cálculos comparativos "Antes × Depois" em tempo de execução a partir dessa variável unificada, garantindo que os cards de bloqueios, débitos, lições e tendências combinem perfeitamente em todas as mídias.

---

## 6. Módulos de Referência do Motor

| Função / Componente | Arquivo |
| :--- | :--- |
| **Cálculo de Scores e Teto** | `src/backend/numerology/score.ts` |
| **Tabela de Harmonização Cabalística** | `src/backend/numerology/harmonization.ts` |
| **Cálculo dos 5 Números** | `src/backend/numerology/numbers.ts` |
| **Pirâmides e Bloqueios** | `src/backend/numerology/triangle.ts` |
| **Componente de Badge UI** | `src/frontend/components/app/CompatibilityBadge.tsx` |
| **Relatório Impresso PDF** | `src/frontend/components/pdf/NomeSocialPDF.tsx` |
| **Relatório Interativo HTML** | `src/frontend/components/app/resultado/NomeSocialResultado.astro` |
