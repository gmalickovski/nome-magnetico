# Analytics e Conversões de Pagamento

Última atualização: 2026-05-23

Este documento descreve a arquitetura de analytics do Nome Magnético para eventos de marketing, checkout, visualização do blog, testes gratuitos e conversões canônicas de pagamento confirmado.

---

## Objetivo

Medir as conversões com a maior precisão possível sem depender apenas do navegador do usuário. O evento canônico de receita (`purchase`) nasce no backend, após a confirmação real do pagamento pelo provedor (Stripe ou Asaas).

---

## Camadas de Medição

### 1. GA4 no Navegador
- **Layout Base:** `src/layouts/BaseLayout.astro`
- O script do Google Analytics 4 é carregado apenas após o consentimento de cookies (`nm-cookie-consent=all`). O ID público é injetado a partir da variável `PUBLIC_GA4_MEASUREMENT_ID`.
- Eventos client-side são gerenciados centralizadamente por: `src/frontend/lib/analytics.ts`

### 2. Eventos Client-side Implementados

| Evento | Tipo | Descrição | Parâmetros |
| :--- | :--- | :--- | :--- |
| `preliminary_analysis_submit` | Custom | Disparado quando o usuário preenche o formulário de análise ao vivo em `/analise-gratuita` e vê o score e triângulo inicial. | - |
| `analise_gratis_submit` | Custom | Disparado quando o usuário converte sua análise preliminar criando uma conta e iniciando a auto-geração do PDF. | - |
| `pdf_downloaded` | Custom | Disparado após o download de um PDF ser bem-sucedido na plataforma. | `produto`: `'analise_gratuita' \| 'nome_social' \| 'nome_bebe' \| 'nome_empresa'` |
| `begin_checkout` | Padrão GA4 | Disparado no início do checkout. Auxilia nos algoritmos de Smart Bidding do Google Ads. | `value`, `currency`, `items[]` |
| `blog_view` | Custom | Disparado ao acessar a home do blog `/blog`. | `categoria`: `'todos' \| slug_da_categoria` |
| `blog_article_view` | Custom | Disparado ao ler um artigo individual `/blog/slug`. | `article_title`, `article_slug` |
| `blog_cta_click` | Custom | Disparado quando o usuário clica em um link de CTA no box do artigo (redirecionando para compra ou teste gratuito). | `destination_url`, `origin_article` |
| `purchase_complete` | Custom | Indica retorno visual ao app após o checkout. Usado apenas para diagnóstico e UX (não para receita oficial). | `produto` |

---

## Exclusão de Tráfego de Administradores (Filtro Anti-Ruído)

Para evitar poluir os dados do Google Analytics com visualizações e testes feitos pela equipe interna e administradores, o sistema usa uma flag no `localStorage` do navegador:

1. Ao acessar o painel (`/app`), o sistema avalia via servidor se o perfil logado possui a role `'admin'`.
2. Se o usuário for administrador, o script grava no navegador a flag:
   `localStorage.setItem('nm-user-role', 'admin')`.
3. Se não for administrador (ou deslogar), a flag é removida.
4. O wrapper global `track()` em `src/frontend/lib/analytics.ts` verifica a existência da flag e, se ativa, **cancela o envio de qualquer evento** para o `window.gtag`.

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

## Guia de Configuração Manual do Google Analytics 4 (GA4)

Para visualizar e separar o tráfego conforme as necessidades descritas, siga este passo a passo dentro do painel do seu Google Analytics:

### Passo 1: Configurar a Exclusão de Acessos Administrativos por IP (Complementar)
Embora tenhamos o bloqueio de administradores logados via `localStorage`, é recomendável bloquear visualizações na Landing Page pública (antes do login) usando seu endereço de IP:
1. No GA4, vá em **Administrador** (ícone de engrenagem no canto inferior esquerdo).
2. Na coluna *Coleta e modificação de dados*, clique em **Fluxos de dados**.
3. Selecione o fluxo da sua Web Stream.
4. Role até o final e clique em **Definir as configurações da tag** (Configure tag settings).
5. Clique em **Mostrar tudo** (Show all) e selecione **Definir tráfego interno** (Define internal traffic).
6. Clique em **Criar**. Dê o nome de `Administradores`, defina a correspondência como "O endereço IP é igual a" e cole seu IP público (procure no Google por "meu ip" para descobrir). Salve.
7. Volte ao menu principal do Administrador, vá em **Filtros de dados** (abaixo de Fluxos de dados).
8. Você verá um filtro criado automaticamente chamado `Internal Traffic`. Clique nele e mude o status de *Testando* para **Ativo**. Salve.

### Passo 2: Criar as Dimensões Personalizadas (Custom Dimensions)
Para ver os parâmetros dos novos eventos do blog nos relatórios padrão do GA4, é preciso registrá-los:
1. Vá em **Administrador -> Exibição de dados -> Definições personalizadas** (Custom definitions).
2. Clique em **Criar dimensões personalizadas**.
3. Crie as seguintes dimensões (todas com escopo de **Evento**):

| Nome da Dimensão | Parâmetro do Evento | Descrição |
| :--- | :--- | :--- |
| `Categoria do Blog` | `categoria` | Categoria ativa na visualização do blog |
| `Título do Artigo` | `article_title` | Título do artigo lido no blog |
| `Slug do Artigo` | `article_slug` | Identificador único do artigo lido |
| `URL de Destino do CTA` | `destination_url` | URL de destino ao clicar em CTAs no blog |
| `Artigo de Origem do CTA`| `origin_article` | Artigo onde o clique de CTA aconteceu |

### Passo 3: Como Visualizar o Blog vs. Artigos Separadamente nos Relatórios
Com as configurações feitas, você pode criar relatórios dedicados:
1. Vá no menu esquerdo em **Gerar Relatórios** (Reports) -> **Engajamento** -> **Páginas e telas** (Pages and screens).
2. **Método 1 (Filtro por URL):** Na barra de pesquisa acima da tabela, digite `/blog`. O GA4 mostrará a linha `/blog` (home do blog) separada das linhas `/blog/nome-do-artigo` (artigos individuais).
3. **Método 2 (Filtro por Evento Customizado):** Vá em **Engajamento** -> **Eventos**.
   - O evento `blog_view` representa os acessos à página principal do Blog.
   - O evento `blog_article_view` representa acessos a artigos específicos.
   - O evento `blog_cta_click` mostra os cliques de conversão.
   - Você pode clicar em `blog_article_view` para ver quais artigos são os mais lidos através do parâmetro `article_title` que registramos!

### Passo 4: Marcar os Eventos Principais como Conversão (Key Events)
Para monitorar a saúde do negócio e integrar com o Google Ads:
1. Vá em **Administrador -> Exibição de dados -> Eventos**.
2. Na lista de eventos, encontre os seguintes eventos e marque a chave **Marcar como evento de conversão** (Mark as key event):
   - `preliminary_analysis_submit` (Usuários que fizeram o teste gratuito preliminar).
   - `analise_gratis_submit` (Usuários que geraram o PDF gratuito completo criando conta).
   - `purchase` (Vendas confirmadas server-side).

---

## Estratégia de Tráfego Pago: Facebook Conversions API (CAPI)

Para obter resultados extraordinários e ROI real nas campanhas de **Facebook Ads e Instagram Ads**, siga este guia para integrar a CAPI utilizando o seu ecossistema existente:

### O Fluxo Recomendado
Como você já possui webhooks transacionais robustos enviando atualizações de pagamento para o **n8n** (`N8N_WEBHOOK_TRANSACIONAL`), a implementação é extremamente rápida no backend:

1. **No painel do Gerenciador de Negócios do Facebook (Meta):**
   - Vá em *Configurações do Negócio -> Fontes de dados -> Pixels* (ou *Conjuntos de dados*).
   - Selecione seu pixel e clique em **Abrir no Gerenciador de Eventos**.
   - Vá na aba **Configurações**, role até *API de Conversões* e clique em **Gerar token de acesso**. Guarde este token de forma segura.
2. **No seu Workflow do n8n (`N8N_WEBHOOK_TRANSACIONAL`):**
   - Crie um novo nó do tipo **HTTP Request** conectado imediatamente após a confirmação de sucesso de pagamento do Stripe/Asaas.
   - Configure a chamada POST para a API do Facebook Graph:
     `POST https://graph.facebook.com/v19.0/{PIXEL_ID}/events`
   - No corpo do JSON (Body), envie o payload padrão:
     ```json
     {
       "data": [
         {
           "event_name": "Purchase",
           "event_time": {timestamp_do_evento},
           "event_id": "id_unico_transacao",
           "user_data": {
             "em": "{email_do_cliente_criptografado_em_sha256}",
             "ph": "{telefone_do_cliente_criptografado_em_sha256}",
             "client_ip_address": "{ip_do_cliente}",
             "client_user_agent": "{user_agent_do_cliente}"
           },
           "custom_data": {
             "currency": "BRL",
             "value": 47.90
           },
           "action_source": "website"
         }
       ],
       "access_token": "SEU_TOKEN_DE_ACESSO_GERADO"
     }
     ```
3. **Deduplicação Automática:** Enviar o mesmo `event_id` (que pode ser o ID do pagamento do Stripe/Asaas) tanto no pixel do navegador quanto na API de conversões do n8n. O Facebook cruzará os dados automaticamente e descartará duplicatas, mantendo a atribuição 100% precisa mesmo se o pixel do navegador falhar.

---

## Integração com Planilhas (Google Sheets) via GA4 API

Se você usa extensões no Google Sheets para importar dados do Analytics automaticamente (como *Google Analytics for Sheets* ou *GA4 Reports Builder*), utilize a seguinte tabela de correspondência exata de **Métricas**, **Dimensões** e **Filtros** da API do GA4 para extrair suas novas métricas:

### Tabela de Parâmetros da API do GA4 para o Google Sheets

| Métrica Solicitada | Nome da Métrica na API (`Metrics`) | Dimensões na API (`Dimensions`) | Filtro de Evento (`Filters`) |
| :--- | :--- | :--- | :--- |
| **Aprovação de Pagamento (Vendas)** | `eventCount` (ou `purchaseRevenue` para receita) | `date`, `eventName` | `eventName == purchase` |
| **Teste Preliminar Gratuito** | `eventCount` | `date`, `eventName` | `eventName == preliminary_analysis_submit` |
| **Geração de Análise Completa** | `eventCount` | `date`, `eventName` | `eventName == analise_gratis_submit` |
| **Downloads Totais de PDF** | `eventCount` | `date`, `eventName` | `eventName == pdf_downloaded` |
| **Download de PDF Gratuito** | `eventCount` | `date`, `eventName`, `customEvent:produto` | `eventName == pdf_downloaded` E `customEvent:produto == analise_gratuita` |
| **Acessos ao Blog (Home)** | `eventCount` (ou `screenPageViews`) | `date`, `eventName` | `eventName == blog_view` |
| **Leituras de Artigos do Blog** | `eventCount` (ou `screenPageViews`) | `date`, `customEvent:article_title`, `customEvent:article_slug` | `eventName == blog_article_view` |
| **Cliques de Conversão no Blog (CTAs)** | `eventCount` | `date`, `customEvent:origin_article`, `customEvent:destination_url` | `eventName == blog_cta_click` |

> [!NOTE]
> Para dimensões customizadas, o prefixo `customEvent:` é obrigatório na API do GA4 para mapear o parâmetro enviado no evento. Certifique-se de ter criado a Dimensão Personalizada correspondente no console do GA4 (conforme o Passo 2 do guia manual) antes de tentar puxá-la no Google Sheets, caso contrário a API retornará um erro de campo inexistente.
