# Arquitetura — Área do Analista (General Analysis Area)

A **Área do Analista** é um painel exclusivo para administradores (`role === 'admin'`) projetado para permitir a criação, visualização e exportação de análises numerológicas personalizadas em tempo real. Ela foi construída com foco na máxima separação de conceitos para garantir que nenhuma modificação ou fluxo da Área do Analista afete as contas dos clientes comuns e o funcionamento padrão dos produtos.

---

## 1. Visão Geral e Objetivos

* **Sem Espera de IA**: Diferente do fluxo de clientes, que passa por processamento assíncrono de modelos de linguagem (Claude/Gemini) com tempo de espera, o painel do analista calcula a numerologia de forma instantânea localmente via CPU.
* **Multi-Produto (Tabs)**: Suporta em um único painel os três tipos de produtos:
  1. **Nome Social**: Análise pessoal detalhada.
  2. **Nome de Bebê**: Avaliação e ranking de múltiplos nomes baseados no sobrenome e data de nascimento do bebê.
  3. **Nome Empresarial**: Análise de compatibilidade de nomes com foco no sócio principal e fundação.
* **Feedback Gráfico Interativo**: Renderização em tempo real das pirâmides numerológicas (SVGs interativos dos 4 triângulos) e bloqueios na própria tela ao digitar (debounce de 300ms).
* **Independência de Produtos**: Toda análise gerada neste painel possui a flag `is_analyst_generated = true`, isolando-a completamente de buscas, limites ou logs de clientes normais.

---

## 2. Fluxo de Dados e Interações

```
                       [Painel do Analista (React Island)]
                                     |
           +-------------------------+-------------------------+
           | (Debounced input 300ms) | (Salvar Análise)        | (PDF Download)
           v                         v                         v
   [APIs Live calculo]        [/api/admin/save-analysis]   [/api/generate-pdf]
           |                         |                         |
   (Calcula numerologia      (Salva no DB c/ status       (Gera PDF do tipo
    instantânea na CPU)       'complete' + flag analista)   específico sob demanda)
```

---

## 3. Estrutura de Arquivos e Separação de Conceitos

Para garantir que o sistema legado e os produtos em produção continuem intactos, todos os arquivos novos e modificados seguem uma rígida separação:

### Roteamento e Páginas (Astro)
* **`src/pages/app/admin-analise.astro`**: Rota física da página. Possui verificação estrita server-side de `isAdmin`. Se o usuário não for administrador, é redirecionado imediatamente para `/app` sem expor scripts ou marcação.
* **`src/pages/app/analises/index.astro`**: Tela de listagem de análises do usuário. Foi modificada de forma sutil apenas para exibir uma badge `Analista` (em Mystical Purple `#bea5ff`) caso a análise tenha `is_analyst_generated === true`.
* **`src/pages/app/index.astro`**: Dashboard do usuário. Adiciona um card premium inferior com estilo "Celestial Alchemist" direcionando para `/app/admin-analise`, visível exclusivamente para administradores.

### Componentes de Interface (React Islands & UI)
* **`src/frontend/components/app/AdminGeneralAnalysis.tsx`**: O cérebro do frontend do painel. Gerencia estados de tabs, inputs, debounces, listagem e exclusão de relatórios recentes gerados pelo analista.
* **`src/frontend/components/app/MobileNavBar.astro`**: Barra de navegação móvel. Adicionada a aba "Analista" com o ícone correspondente, visível apenas para administradores.

### Endpoints da API (Backend & Astro API)
Todos os endpoints novos ficam isolados sob a pasta `src/pages/api/admin/` e verificam a role `'admin'` no Supabase:
* **`src/pages/api/admin/analyze-baby-live.ts`**: Calcula em tempo real o ranking de múltiplos nomes para bebês sem gravar no banco de dados.
* **`src/pages/api/admin/analyze-company-live.ts`**: Calcula em tempo real o ranking e bloqueios para empresas sem gravar no banco de dados.
* **`src/pages/api/admin/save-analysis.ts`**: Salva a análise final imediatamente no banco de dados com status `complete`, preenchendo todos os 4 triângulos, bloqueios e lições kármicas para permitir a geração instantânea do PDF.
* **`src/pages/api/admin/list-analyst-reports.ts`**: Lista os últimos 30 relatórios gerados por analistas no sistema.

### Banco de Dados e Camada de Acesso
* **`030_add_is_analyst_generated_to_analyses.sql`**: Migration que adiciona a coluna `is_analyst_generated` (BOOLEAN, default `FALSE`) e seu respectivo índice parcial para buscas rápidas.
* **`src/backend/db/analyses.ts`**: Atualização dos tipos e interfaces de `Analysis` para suportar o novo campo sem quebrar consultas anteriores.

---

## 4. Integração do PDF e Preparação para o Futuro

### Comportamento Atual (Reuso)
No momento inicial, para evitar retrabalho e manter o design premium das análises, os PDFs gerados reutilizam os mesmos templates de alta fidelidade já existentes:
* **`nome_social`** → Reutiliza `NomeSocialPDF.tsx`
* **`nome_bebe`** → Reutiliza `NomeBebePDF.tsx`
* **`nome_empresa`** → Reutiliza `NomeEmpresaPDF.tsx`

Ao passar as propriedades formatadas com exatidão na API `save-analysis.ts`, o renderizador `/api/generate-pdf?id={id}` gera o arquivo PDF perfeitamente sem requerer nenhuma alteração nos arquivos de template originais.

### Preparação para o Futuro (Isolação Completa)
A arquitetura foi desenhada para facilitar a separação total dos templates no futuro sem quebras:
1. **Identificação no Banco**: O campo `is_analyst_generated` permite filtrar e redirecionar templates na própria API de PDF.
2. **Template Dedicado**: Se no futuro o analista precisar de um layout diferente do cliente final, basta duplicar/criar um novo arquivo na pasta `src/frontend/components/pdf/` (ex: `AnalystNomeSocialPDF.tsx`) e atualizar a seleção condicional em `src/pages/api/generate-pdf.ts`:
   ```typescript
   const PDFComponent = analysis.is_analyst_generated
     ? AnalystNomeSocialPDF // Novo template específico para analista
     : NomeSocialPDF;       // Template original do cliente
   ```
   Dessa forma, nenhuma alteração afeta a renderização do PDF que o cliente final pagou para receber.

---

## 5. Diretrizes de Segurança

* **Nunca remova a verificação de role**: Qualquer endpoint sob `/api/admin/` deve sempre validar se o `user.id` corresponde a um perfil com `role === 'admin'`.
* **Relação de Usuário**: As análises geradas pelo analista ficam salvas no banco de dados associadas ao `user_id` do próprio administrador logado, garantindo o cumprimento de regras de RLS (Row Level Security) sem expor dados de terceiros.

---

## 6. Layout Estrutural e Otimização Mobile

Para acomodar as necessidades operacionais dos administradores em telas de diversos tamanhos, a Área do Analista utiliza um design system customizado (`noPadding`) isolado do fluxo de scroll global do `AppLayout`.

A interface do componente React (`AdminGeneralAnalysis.tsx`) é orquestrada em 4 containers lógicos:

1. **Header (Container 1)**: Ocupa o topo em largura total, não é afetado por scroll na versão Desktop.
2. **Abas / Navegação (Container 2)**: Barra horizontal para seleção de produtos. Aplica uma animação fluida (retração de altura) quando detecta rolagem descendente, focando no conteúdo de resultados.
3. **Formulário (Container 3 - Esquerdo)**: 
   - No **Desktop**, fica permanentemente fixado à esquerda ocupando 100% da altura disponível, com seu próprio scroll-bar customizado (caso os campos transbordem).
   - No **Mobile**, ele adota uma propriedade dinâmica. Se a tela estiver no topo, os campos ficam totalmente visíveis empilhados sobre os resultados. Se o scroll descer, o formulário colapsa numa barra *sticky* (apenas título e botão Editar), liberando a área de leitura no celular.
4. **Resultados (Container 4 - Direito)**: A única região do painel que rola livremente na visualização de tela cheia. O evento de scroll deste painel dispara as animações de ocultar/mostrar elementos dos Containers 2 e 3.
