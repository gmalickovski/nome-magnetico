# Servidor MCP de Clientes e Parceiros do Nome Magnético (`nm-client-mcp`)

Este documento descreve a arquitetura, modelo de segurança, regras de compliance e guia de uso do **servidor MCP voltado para clientes e parceiros (`nm-client-mcp`)**, implementado na issue [DEV-208](https://linear.app/studio-mlk/issue/DEV-208/mcp-de-geracao-de-nomes-para-clientesparceiros-futuro).

---

## 1. Visão Geral e Arquitetura

O `nm-client-mcp` é um serviço isolado em Node.js (TypeScript) que implementa a especificação oficial Model Context Protocol (MCP) com transporte HTTP Streamable (Server-Sent Events / SSE).

Seu objetivo é permitir que agentes de atendimento ao cliente (como o bot de Suporte) e integrações de parceiros autorizados prestem assistência a **usuários compradores com assinatura ou compra ativa** (explicar pontuação, reavaliar candidatos a nome social e fornecer orientações de assinatura), com controle estrito de cota e isolamento absoluto de ferramentas administrativas.

```text
Agente de Suporte / Integração Parceiro
         │  (Bearer Token do Cliente/Compra)
         ▼
  [nm-client-mcp :8766] (127.0.0.1)
   ├── Rate Limiter & Token Auth (SHA-256)
   ├── Verificação de Cota e Assinatura Ativa ──► [client_mcp.verify_client_access]
   ├── Auditoria Append-Only ──────────────────► [client_mcp.mcp_client_audit]
   └── Execução Sanitizada ────────────────────► [POST /api/internal/client-mcp/*] (HMAC-SHA256) ──► App Principal
                                                       │
                                                       ▼
                                            Higienização e Compliance:
                                            - Zero pesos crus / fórmulas
                                            - Zero dados médicos / saúde
                                            - Zero menções a provedores de IA
                                            - "Tensão Vibracional" (nunca "incompatível")
                                            - Aviso Legal Obrigatório
```

### Premissas de Isolamento e Segurança
1. **Porta e Processo Independentes:** O `nm-client-mcp` escuta estritamente em `127.0.0.1:8766` (o MCP administrativo `nm-mcp` opera em `127.0.0.1:8765`).
2. **Zero Ferramentas Administrativas:** O cliente MCP não possui acesso nem carrega qualquer ferramenta de gestão interna (sem Stripe, sem lista de leads, sem reprocessamento de lote, sem cupons).
3. **Sem Acesso Direto de Escrita no Banco:** Toda alteração de estado e consulta é intermediada por RPC seguro no Postgres (`client_mcp.verify_client_access`) e endpoints Astro internos autenticados por HMAC-SHA256 (`/api/internal/client-mcp/*`).
4. **Validação de Assinatura Ativa:** Nenhuma consulta ou geração é realizada para usuários sem compra válida (`ends_at > now()` e `refunded_at IS NULL`).
5. **Cota Atômica por Compra:** Cada token possui limite de utilizações debitado atomicamente na transação da RPC. Quando a cota se esgota, retorna HTTP 429 (`QuotaExceeded`).

---

## 2. Regras Rígidas de Compliance e Higienização

O serviço aplica uma camada obrigatória de sanitização (`src/backend/client-mcp/sanitize.ts` e `nm-client-mcp/src/utils/sanitize.ts`):

1. **Proteção de Propriedade Intelectual (Fórmulas e Pesos):**
   - É estritamente proibido expor tabelas de dedução de pontos, pesos de bloqueios, penalidades de arcanos ou multiplicadores do algoritmo.
   - O cliente recebe apenas a pontuação final (0 a 100) e o nível de harmonia (`N5` a `N1`).
2. **Proteção de Saúde e Diagnósticos Médicos:**
   - Nenhum campo de `aspectoSaude`, correlações com órgãos ou alertas médicos da tradição cabalística é retornado ao cliente.
3. **Neutralidade de Infraestrutura:**
   - Nenhuma menção a provedores de inteligência artificial (Anthropic, Claude, Groq, OpenAI) ou menções ao Studio MLK é permitida nas saídas voltadas ao cliente.
4. **Linguagem Harmoniosa do Produto:**
   - O termo "incompatível" nunca é exibido ao cliente; substitui-se obrigatoriamente por **"Tensão Vibracional"**.
5. **Aviso Legal Obrigatório:**
   - Toda e qualquer resposta das ferramentas do cliente MCP inclui a seguinte declaração institucional:
   > *"Aviso Legal: O cálculo numerológico baseia-se em critérios formais e objetivos de harmonização de nomes. As interpretações têm finalidade de autoconhecimento e planejamento pessoal/profissional, não substituindo orientação médica, psicológica ou jurídica."*

---

## 3. Modelo de Banco de Dados (`046_client_mcp.sql`)

A infraestrutura no Supabase utiliza o schema isolado `client_mcp` com a role restrita `nm_client_mcp_bot` (`NOLOGIN`, `NOINHERIT`):

### Tabela `client_mcp.client_tokens`
- `id`: UUID da chave.
- `user_id`: Referência ao usuário comprador (`auth.users`).
- `subscription_id`: Referência à assinatura/compra ativa (`public.subscriptions`).
- `token_hash`: Hash SHA-256 do token do cliente (tokens em texto puro nunca são persistidos).
- `quota_limit`: Total de operações permitidas pelo plano/compra.
- `used_count`: Total de operações já consumidas.
- `expires_at`: Data limite de validade do token (alinhada à validade da compra).

### Função RPC `client_mcp.verify_client_access`
Executa em nível transacional no banco:
- Valida o hash do token.
- Verifica se a assinatura vinculada ainda é válida (`ends_at > now()` e `refunded_at IS NULL`).
- Confirma se a cota não foi excedida (`used_count + p_cost <= quota_limit`).
- Incrementa atomicamente `used_count` e registra na auditoria.

### Tabela `client_mcp.mcp_client_audit`
- Registro append-only com `token_id`, `user_id`, `tool_name`, `cost`, `status` e timestamp.
- Não armazena dados sensíveis nem PII em texto não mascarado.

---

## 4. Ferramentas Disponíveis no Servidor

| Ferramenta | Descrição | Parâmetros |
|---|---|---|
| `consultar_score_comprador` | Consulta a pontuação de harmonização, nível vibracional e compatibilidade de uma análise ativa do comprador. | `{ analysisId?: string }` |
| `gerar_analise_social` | Reavalia ou gera novas opções de harmonização de nome social com base no nome original, data de nascimento e lista de nomes candidatos. Debita cota da compra. | `{ nomeCompleto: string, dataNascimento: string, nomesCandidatos?: string[] }` |
| `explicar_score` | Fornece explicação pedagógica do nível vibracional e orientações práticas para a assinatura do cliente, sem revelar detalhes matemáticos do cálculo. | `{ score: number }` |

---

## 5. Endpoints Internos do App (`/api/internal/client-mcp/*`)

Os endpoints Astro que fornecem a computação numerológica são protegidos com autenticação **HMAC-SHA256**:

- `POST /api/internal/client-mcp/score`: Valida a assinatura do usuário e devolve o score higienizado com o aviso legal.
- `POST /api/internal/client-mcp/generate`: Executa `analisarNomesSocial`, formata os candidatos válidos e higieniza todas as propriedades antes de responder.
- `POST /api/internal/client-mcp/explain`: Retorna a interpretação descritiva do nível harmônico e as boas práticas de assinatura.

Cabeçalhos exigidos:
- `X-Internal-Signature`: `sha256=<hex>`
- `X-Internal-Timestamp`: Epoch em milissegundos (janela de tolerância de 5 minutos contra replay attacks).

---

## 6. Como Rodar e Testar Localmente

### Testes Unitários de Isolamento e Conformidade
```bash
# Executa todos os testes do client MCP (Auth, Quota, Isolation e Sanitização)
npm --prefix nm-client-mcp test

# Executa os testes de integração dos endpoints internos no app Astro
npm test -- src/pages/api/internal/client-mcp/client-endpoints.test.ts
```

### Inicialização do Servidor
```bash
# Compilar TypeScript
npm --prefix nm-client-mcp run build

# Executar serviço
npm --prefix nm-client-mcp start
```

O servidor iniciará em `http://127.0.0.1:8766/sse` aguardando requisições SSE com cabeçalho `Authorization: Bearer <client_token>`.
