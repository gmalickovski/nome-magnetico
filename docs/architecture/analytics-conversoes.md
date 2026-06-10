# Analytics e Conversões de Pagamento

Última atualização: 2026-06-10 — novo fluxo email-first implementado

Este documento descreve a arquitetura de analytics do Nome Magnético para eventos de marketing, checkout, visualização do blog, testes gratuitos e conversões canônicas de pagamento confirmado.

---

## Objetivo

Medir as conversões com a maior precisão possível sem depender apenas do navegador do usuário. O evento canônico de receita (`purchase`) nasce no backend, após a confirmação real do pagamento pelo provedor (Stripe ou Asaas).

---

## Funil Principal (desde jun/2026 — fluxo email-first)

```
sessão
  → analise_gratis_submit   (form /analise-gratuita: nome + data + email → envia PDF por e-mail, sem cadastro)
  → [usuário lê análise no e-mail]
  → [opcional] cadastro na plataforma → área gratuita com score + PDF
  → begin_checkout           (padrão GA4 e-commerce — alimenta Smart Bidding)
  → purchase                 (server-side Measurement Protocol — fonte de verdade de receita)
```

### Mudança em relação ao fluxo anterior

Antes de jun/2026, o fluxo exigia criação de conta para acessar o PDF. O evento `preliminary_analysis_submit` era o topo de funil planejado (nunca chegou a ser implementado) e `analise_gratis_submit` disparava ao criar conta. Com o novo fluxo email-first:

- `analise_gratis_submit` passa a ser o **evento de captura de lead**: dispara quando o formulário nome+data+email é submetido com sucesso, sem necessidade de cadastro.
- `preliminary_analysis_submit` está **depreciado** — não há mais etapa de "preview" separada.
- A tabela `free_analyses_leads` no Supabase registra cada lead e o PDF gerado/enviado.

---

## Camadas de Medição

### 1. GA4 no Navegador
- **Layout Base:** `src/layouts/BaseLayout.astro`
- O script do Google Analytics 4 é carregado apenas após o consentimento de cookies (`nm-cookie-consent=all`). O ID público é injetado a partir da variável `PUBLIC_GA4_MEASUREMENT_ID`.
- Eventos client-side são gerenciados centralizadamente por: `src/frontend/lib/analytics.ts`

### 2. Eventos Client-side Implementados

| Evento | Tipo | Descrição | Parâmetros |
| :--- | :--- | :--- | :--- |
| `analise_gratis_submit` | Custom | **Lead capturado**: formulário email-first submetido com sucesso em `/analise-gratuita`. PDF enviado por e-mail sem cadastro. | — |
| `pdf_downloaded` | Custom | Disparado após o download de um PDF ser bem-sucedido na plataforma (área logada). | `produto`: `'analise_gratuita' \| 'nome_social' \| 'nome_bebe' \| 'nome_empresa'` |
| `begin_checkout` | Padrão GA4 | Disparado no início do checkout. Auxilia nos algoritmos de Smart Bidding do Google Ads. Disparado simultaneamente com `checkout_start`. | `produto`, `valor` |
| `checkout_start` | Custom | Evento interno de início de checkout (mantido para série histórica). Use `begin_checkout` para relatórios GA4. | `produto`, `preco`, `promocao`, `origem` |
| `blog_view` | Custom | Disparado ao acessar a home do blog `/blog`. | `categoria`: `'todos' \| slug_da_categoria` |
| `blog_article_view` | Custom | Disparado ao ler um artigo individual `/blog/slug`. | `article_title`, `article_slug` |
| `blog_cta_click` | Custom | Disparado quando o usuário clica em um link de CTA no box do artigo. | `destination_url`, `origin_article` |
| `purchase_complete` | Custom | Indica retorno visual ao app após o checkout. Usado apenas para diagnóstico e UX (não para receita oficial). | `produto` |
| `calculadora_submit` | Custom | Widget calculadora auxiliar em landing pages. Não é o evento principal de funil. | `origem` |
| `preliminary_analysis_submit` | **DEPRECATED** | Removido do fluxo em jun/2026. Nunca chegou a ser implementado no código de produção. | — |

> **Nota sobre eventos de blog:** `blog_view`, `blog_article_view` e `blog_cta_click` são disparados via `window.gtag` diretamente nos arquivos `.astro` (não via wrapper `track()`). Todos possuem guard de consentimento (`nm-cookie-consent=all`) e filtro anti-admin (`nm-user-role !== 'admin'`) desde jun/2026.

---

## Exclusão de Tráfego de Administradores (Filtro Anti-Ruído)

Para evitar poluir os dados do Google Analytics com visualizações e testes feitos pela equipe interna e administradores, o sistema usa uma flag no `localStorage` do navegador:

1. Ao acessar o painel (`/app`), o sistema avalia via servidor se o perfil logado possui a role `'admin'`.
2. Se o usuário for administrador, o script grava no navegador a flag:
   `localStorage.setItem('nm-user-role', 'admin')`.
3. Se não for administrador (ou deslogar), a flag é removida.
4. O wrapper global `track()` em `src/frontend/lib/analytics.ts` verifica a existência da flag e, se ativa, **cancela o envio de qualquer evento** para o `window.gtag`.
5. Os eventos de blog (disparados via `window.gtag` direto nos arquivos `.astro`) também verificam a flag manualmente antes de disparar.

---

## Conversão Canônica Server-side (Fonte da Verdade)

Para receita e conversão de pagamento confirmado, a fonte da verdade é o backend:
```text
Webhook Stripe/Asaas -> createSubscription -> trackPurchaseConfirmed -> GA4 purchase
```

1. **Captura no Checkout:** Ao iniciar o checkout, o backend tenta ler o `client_id` do cookie `_ga` via `getGaClientIdFromRequest` e armazena nos metadados do Stripe ou Asaas.
2. **Confirmação no Webhook:** Quando o pagamento é confirmado, os webhooks em `/api/stripe-webhook` ou `/api/asaas-webhook` extraem esse `client_id` e chamam `trackPurchaseConfirmed` (`src/backend/analytics/ga4.ts`).
3. **Disparo GA4 Measurement Protocol:** É enviado um POST HTTPS com o evento recomendado `purchase` direto para os servidores do Google, garantindo 100% de registro das vendas mesmo que o usuário feche o navegador após pagar.

---

## Planilha Google Sheets — Relatório Semanal

**Arquivo:** "Relatório Semanal Google Analytics - Nome Magnético"  
**Drive:** `1Que6Gxb_THVOQmUZVQhmjuYpxl3Xx_St`  
**Atualização:** semanal (extensão nativa Google Analytics for Sheets)

### Abas configuradas

| Aba | Métricas | Filtro de eventos |
|---|---|---|
| `nm_dados_trafego` | sessions, pageViews por source/page | — |
| `nm_dados_vendas_produtos` | itemsPurchased, itemRevenue | `purchase` (implícito) |
| `nm_eventos_conversao` | eventCount por data+eventName | `analise_gratis_submit`, `pdf_downloaded` *(ver nota abaixo)* |
| `nm_blog_geral` (CTA) | eventCount por artigo origem/destino | `blog_view`, `blog_cta_click` |
| `nm_blog_geral` (artigos) | eventCount por título/slug | `blog_article_view` |
| `nm_blog_geral` (geral) | eventCount + purchaseRevenue | todos |

> **⚠️ Atenção (jun/2026):** A aba `nm_eventos_conversao` ainda contém `preliminary_analysis_submit` no filtro. Este evento nunca disparou e está depreciado no novo fluxo. Recomenda-se remover do filtro e substituir por `begin_checkout` para acompanhar o funil completo: `analise_gratis_submit → begin_checkout → purchase`.

### Filtro atualizado recomendado para `nm_eventos_conversao`

```json
{
  "filter": {
    "fieldName": "eventName",
    "inListFilter": {
      "values": [
        "analise_gratis_submit",
        "begin_checkout",
        "pdf_downloaded"
      ]
    }
  }
}
```

---

## Guia de Configuração Manual do Google Analytics 4 (GA4)

### Passo 1: Configurar a Exclusão de Acessos Administrativos por IP (Complementar)
Embora tenhamos o bloqueio de administradores logados via `localStorage`, é recomendável bloquear visualizações na Landing Page pública (antes do login) usando seu endereço de IP:
1. No GA4, vá em **Administrador** → **Fluxos de dados** → selecione o fluxo → **Definir as configurações da tag** → **Definir tráfego interno**.
2. Crie uma regra com seu IP público. Ative o filtro em **Filtros de dados**.

### Passo 2: Criar as Dimensões Personalizadas (Custom Dimensions)
Para ver os parâmetros dos eventos de blog nos relatórios:

| Nome da Dimensão | Parâmetro do Evento | Escopo |
| :--- | :--- | :--- |
| `Categoria do Blog` | `categoria` | Evento |
| `Título do Artigo` | `article_title` | Evento |
| `Slug do Artigo` | `article_slug` | Evento |
| `URL de Destino do CTA` | `destination_url` | Evento |
| `Artigo de Origem do CTA` | `origin_article` | Evento |
| `Produto` | `produto` | Evento |
| `Valor` | `valor` | Evento |

### Passo 3: Marcar os Eventos Principais como Conversão (Key Events)
1. Vá em **Administrador** → **Exibição de dados** → **Eventos**.
2. Marque como evento de conversão:
   - `analise_gratis_submit` — captura de lead via formulário email-first
   - `begin_checkout` — intenção de compra (Smart Bidding)
   - `purchase` — venda confirmada server-side

---

## Estratégia de Tráfego Pago: Facebook Conversions API (CAPI)

*(Não implementado — planejado para quando campanhas pagas forem ativadas)*

Fluxo via n8n (`N8N_WEBHOOK_TRANSACIONAL`):
1. Após confirmação de pagamento Stripe/Asaas, n8n envia evento `Purchase` para a Graph API do Facebook.
2. Usar `event_id = transaction_id` para deduplicação automática com o pixel do browser.
3. Hash SHA-256 de `email` e `telefone` no campo `user_data`.
4. Endpoint: `POST https://graph.facebook.com/v19.0/{PIXEL_ID}/events`

---

## Integração com Planilhas (Google Sheets) via GA4 API

Tabela de referência para queries na extensão:

| Métrica | Métricas na API | Dimensões | Filtro de Evento |
| :--- | :--- | :--- | :--- |
| Leads capturados (email-first) | `eventCount` | `date`, `eventName` | `eventName == analise_gratis_submit` |
| Entrada no checkout | `eventCount` | `date`, `eventName` | `eventName == begin_checkout` |
| Vendas (receita) | `eventCount`, `purchaseRevenue` | `date`, `eventName` | `eventName == purchase` |
| Downloads de PDF | `eventCount` | `date`, `eventName`, `customEvent:produto` | `eventName == pdf_downloaded` |
| Blog — acessos home | `eventCount` | `date`, `eventName` | `eventName == blog_view` |
| Blog — leituras de artigos | `eventCount` | `date`, `customEvent:article_title`, `customEvent:article_slug` | `eventName == blog_article_view` |
| Blog — cliques CTA | `eventCount` | `date`, `customEvent:origin_article`, `customEvent:destination_url` | `eventName == blog_cta_click` |

> Para dimensões customizadas, o prefixo `customEvent:` é obrigatório na API do GA4.
