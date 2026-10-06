# Importar promoções e cupons do HQ para o Nome Magnético

Issue: DEV-114.

O checkout, a landing e o resgate de trial leem as tabelas `promotions`, `access_codes` e `access_code_uses` no Supabase cloud do NM. `HQ_API_URL` e `HQ_INTERNAL_TOKEN` não são mais lidos em runtime.

## Ordem

1. Aplicar a migration `036_promotions_access_codes_parity.sql` no SQL Editor (o Dev aplica; este PR não aplica).
2. Conferir as versões em `supabase_migrations.schema_migrations`: a 035 de promoções/códigos já está aplicada; depois do passo 1 deve aparecer a 036.
3. Extrair do HQ só o SaaS deste produto (pooler VPS + banco HQ). Incluir o código de cupom de parceiro que já circula, se ainda estiver ativo.
4. Rodar um SQL no formato de `scripts/import-hq-promotions.example.sql` (idempotente). Sem colar dados reais no repositório.
5. Conferir contagens: promoções, códigos, usos.

## Regras de mapeamento

| HQ | NM |
|----|----|
| `promotions.id` | `promotions.legacy_hq_id` (UUID UNIQUE, chave de idempotência) |
| `access_codes.code` | `access_codes.code` (`ON CONFLICT (code)`) |
| `discount_amount_brl` / valor fixo | `discount_value` em **centavos**. Se o HQ estiver em reais, multiplicar por 100 na extração. |
| promoções ativas | `is_active`, `starts_at`, `ends_at` |
| usos de cupom/trial | `access_code_uses` |

O contrato público (`ActivePromotion.discountValue` de tipo `fixed` e `HqCouponValidation.discountAmountBrl`) continua em **reais**, como o HQ devolvia. A landing e o checkout não mudam de unidade.

## Depois do import

Não desligar o HQ, não tirar `.env` da VPS e não criar tag neste passo. Isso fica para o Infra depois do ok do Guilherme no PR de pagamento.
