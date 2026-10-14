# MailerLite Email Marketing

## Objetivo

Usar o MailerLite como plataforma principal de email marketing para converter usuarios que concluem a analise gratuita em compradores do Nome Social.

O app Nome Magnetico nao deve gerenciar sequencias de email diretamente. Ele apenas dispara o evento para o n8n. O n8n normaliza os dados e envia/atualiza o subscriber no MailerLite. O MailerLite cuida da automacao, templates, metricas, descadastro e edicao visual dos emails.

## Arquitetura

```text
Nome Magnetico
  -> analise gratuita completa
  -> notify('marketing.free_analysis_completed')
  -> N8N_WEBHOOK_MARKETING
  -> n8n normaliza dados
  -> MailerLite cria/atualiza subscriber
  -> MailerLite dispara automacao
  -> compra Nome Social
  -> n8n/checkout atualiza subscriber como convertido
  -> campanha para
```

## Variavel de ambiente

No `.env` local e no `.env` do servidor:

```bash
N8N_WEBHOOK_MARKETING=https://n8n.studiomlk.com.br/webhook/nm-email-marketing
```

O path correto no n8n e `nm-email-marketing`. Nao usar `../nm-email-marketing`.

## Estrutura no MailerLite

Criar um grupo/lista:

```text
Nome Social - Analise Gratuita
```

Criar campos customizados:

```text
first_name
nome_completo
analysis_url
checkout_url
score
bloqueios
licoes_carmicas
tendencias_ocultas
debitos_carmicos
coupon_code
discount_label
coupon_expires_at
comprou_nome_social
```

## Evento recebido pelo n8n

O app envia o evento:

O app so dispara este evento quando `opt_in` e true.

```json
{
  "event": "marketing.free_analysis_completed",
  "payload": {
    "email": "cliente@email.com",
    "nome": "Cliente",
    "sobrenome": "da Silva",
    "analise_data": "2026-10-14",
    "analise_id": "uuid",
    "score": 72,
    "origem": "analise_gratis",
    "opt_in": true,
    "opt_in_data": "2026-10-14T18:04:05.000Z",
    "utm_source": "instagram",
    "utm_medium": "cpc",
    "utm_campaign": "analise-gratis"
  }
}
```

## Workflow no n8n

1. Webhook Trigger
   - Method: `POST`
   - Path: `nm-email-marketing`

2. Validar evento
   - Continuar apenas se `event == marketing.free_analysis_completed`.

3. Normalizar payload
   - Mapear `payload.nome` para `first_name` e `payload.sobrenome` para o sobrenome.
   - Mapear `payload.score`, `payload.analise_id`, `payload.analise_data` e os UTMs.

4. Criar ou atualizar subscriber no MailerLite
   - Email: `payload.email`
   - Grupo: `Nome Social - Analise Gratuita`
   - Campos customizados preenchidos.

5. Opcional: buscar cupom ativo no HQ
   - Preencher `coupon_code`, `discount_label`, `coupon_expires_at`.
   - Se nao houver cupom ativo, deixar os campos vazios.

## Automacao no MailerLite

### Email 1 - imediato

Gatilho: subscriber entrou no grupo `Nome Social - Analise Gratuita`.

Assunto sugerido:

```text
{$first_name}, sua analise gratuita revelou o proximo passo
```

Objetivo:

Converter enquanto o diagnostico esta fresco.

CTA:

```text
{$checkout_url}
```

### Email 2 - 24 horas depois

Antes de enviar:

- Se `comprou_nome_social` for verdadeiro, parar a automacao.
- Se nao comprou, enviar o email.

Assunto sugerido:

```text
{$first_name}, seu nome pode ter uma versao mais fluida
```

Objetivo:

Reforcar a diferenca entre o diagnostico gratuito e o plano de acao completo do Nome Social.

### Email 3 - 72 horas depois do primeiro email

Antes de enviar:

- Se `comprou_nome_social` for verdadeiro, parar a automacao.
- Se nao comprou, enviar com cupom.

Assunto sugerido:

```text
{$first_name}, seu cupom para o Nome Social esta ativo
```

Variaveis de cupom:

```text
{$coupon_code}
{$discount_label}
{$coupon_expires_at}
```

Objetivo:

Criar um incentivo final com condicao especial criada no HQ.

## Como parar a campanha apos compra

Quando o pagamento do Nome Social for confirmado, o n8n deve atualizar o subscriber no MailerLite:

```text
comprou_nome_social = true
```

Opcionalmente:

- remover do grupo `Nome Social - Analise Gratuita`;
- adicionar ao grupo `Clientes - Nome Social`;
- adicionar tag/campo `produto_ativo = nome_social`.

## Templates HTML

Templates criados no projeto:

```text
email-templates/marketing-free-analysis-upsell-01.html
email-templates/marketing-free-analysis-upsell-02.html
email-templates/marketing-free-analysis-upsell-03-coupon.html
```

Recomendacao pratica:

Recriar esses emails no editor visual do MailerLite usando a mesma copy e as mesmas variaveis, para facilitar ajustes futuros sem alterar codigo.

## Bloqueio de emails temporarios

O cadastro bloqueia dominios descartaveis comuns em:

```text
src/backend/security/disposableEmail.ts
```

O endpoint de cadastro usa esse bloqueio em:

```text
src/pages/api/auth/register.ts
```

Dominio incluido a partir do relatorio de analytics:

```text
temp-mail.org
```
