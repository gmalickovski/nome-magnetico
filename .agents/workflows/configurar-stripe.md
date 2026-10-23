> **Agentes:** leia primeiro [`AGENTS.md`](../../AGENTS.md) na raiz do repositório.


Você é um assistente de configuração do Stripe para o projeto Nome Magnético.

Execute os seguintes passos usando as ferramentas do MCP do Stripe:

## 1. Criar os 3 Produtos

Crie um produto para cada um abaixo (mode: test se a chave for sk_test_*, live se for sk_live_*):

- **Nome Social** — description: "Análise numerológica cabalística do seu nome com 4 triângulos, lições kármics e sugestões de nome sem bloqueios. Acesso por 6 meses."
- **Nome de Bebê** — description: "Análise numerológica para encontrar o nome ideal para seu filho, com ranking de compatibilidade e análise de bloqueios. Acesso por 6 meses."
- **Nome Empresarial** — description: "Análise da compatibilidade do nome da empresa com o Destino do fundador, evitando bloqueios de crescimento. Acesso por 6 meses."

## 2. Criar os Preços (one-time, BRL)

Para cada produto criado acima, criar um Price:
- **Nome Social**: unit_amount = 9700, currency = brl, type = one_time
- **Nome de Bebê**: unit_amount = 7700, currency = brl, type = one_time
- **Nome Empresarial**: unit_amount = 12700, currency = brl, type = one_time

## 3. Criar o Webhook Endpoint

Crie um webhook endpoint com os eventos:
- `checkout.session.completed`
- `payment_intent.payment_failed`

URL: pergunte ao usuário qual é a URL do servidor (ex: https://seudominio.com/api/stripe-webhook).
Se for ambiente de desenvolvimento, instrua a usar o Stripe CLI em vez de criar um endpoint fixo.

## 4. Exibir Resultado Final

Ao final, exiba na tela:

```
=== CONFIGURAÇÃO CONCLUÍDA ===

Adicione no arquivo .env:

STRIPE_PRICE_NOME_MAGNETICO=price_XXXXXXXXXXXXXXXX
STRIPE_PRICE_NOME_BEBE=price_YYYYYYYYYYYYYYYY
STRIPE_PRICE_NOME_EMPRESA=price_ZZZZZZZZZZZZZZZZ
STRIPE_WEBHOOK_SECRET=whsec_AAAAAAAAAAAAAAAAAAAA
```

Se o webhook foi criado via MCP, mostre o signing secret retornado.
Se for desenvolvimento local, instrua:
```bash
# Instalar Stripe CLI (Windows)
winget install Stripe.StripeCLI

# Login
stripe login

# Escutar e redirecionar para o servidor local
stripe listen --forward-to localhost:4321/api/stripe-webhook

# Simular pagamento bem-sucedido
stripe trigger checkout.session.completed
```
