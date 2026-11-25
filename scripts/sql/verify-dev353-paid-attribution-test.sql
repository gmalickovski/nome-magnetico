begin;

do $$
declare
  visitor uuid := gen_random_uuid();
  checkout uuid;
  expired_checkout uuid;
  lease uuid := gen_random_uuid();
  second_lease uuid := gen_random_uuid();
  order_ref text := 'dev353_fixture_' || gen_random_uuid();
  now_at timestamptz := statement_timestamp();
  context jsonb;
  touch jsonb := '{"channel":"google_ads","campaign_id":"101","utm_source":"google","utm_medium":"cpc","gclid":"test_gclid"}';
  ga jsonb := '{"client_id":"111.222","session_id":1795600000}';
begin
  if has_table_privilege('anon', 'public.nm_paid_visitors', 'SELECT')
      or has_function_privilege('authenticated', 'public.nm_paid_checkout_snapshot(uuid)', 'EXECUTE') then
    raise exception 'permissão inesperada de cliente';
  end if;
  perform public.nm_paid_update_visitor(visitor, false, false, touch, ga);
  if public.nm_paid_checkout_snapshot(visitor) is not null then
    raise exception 'recusa gerou snapshot';
  end if;
  perform public.nm_paid_update_visitor(visitor, true, true, touch, null);
  perform public.nm_paid_update_visitor(visitor, null, null, jsonb_set(touch, '{campaign_id}', '"202"'), ga);
  select public.nm_paid_checkout_snapshot(visitor) into checkout;
  context := public.nm_paid_delivery_context(checkout, now_at + interval '2 days');
  if context#>>'{click,touch,campaign_id}' is distinct from '101'
      or context#>>'{ga,client_id}' is distinct from '111.222' then
    raise exception 'primeiro clique/identidade não persistiram no Pix tardio';
  end if;
  if public.nm_paid_delivery_context(checkout, now_at + interval '7 days')->>'click' is not null then
    raise exception 'clique fora da janela de sete dias';
  end if;
  perform public.nm_enqueue_purchase(order_ref, checkout, now_at, '{"fixture":true}');
  perform public.nm_enqueue_purchase(order_ref, checkout, now_at, '{"fixture":true}');
  if (select count(*) from public.nm_claim_purchase_deliveries(lease, order_ref)) <> 2
      or (select count(*) from public.nm_claim_purchase_deliveries(second_lease, order_ref)) <> 0 then
    raise exception 'reentrega ou lease duplicaram destinos';
  end if;
  update public.nm_purchase_deliveries
    set lease_id = null, lease_until = null, finished_at = now_at, outcome = 'sent'
    where order_id = order_ref and destination = 'ga4';
  update public.nm_purchase_deliveries
    set lease_id = null, lease_until = null, due_at = now_at
    where order_id = order_ref and destination = 'posthog';
  if (select array_agg(destination) from public.nm_claim_purchase_deliveries(second_lease, order_ref)) is distinct from array['posthog'] then
    raise exception 'reenvio repetiu destino concluído';
  end if;
  perform public.nm_paid_update_visitor(visitor, true, false, null, null);
  perform public.nm_paid_update_visitor(visitor, true, true, touch, ga);
  if public.nm_paid_delivery_context(checkout, now_at + interval '2 days') is not null then
    raise exception 'reaceite reativou consentimento de um pedido antigo';
  end if;

  select public.nm_paid_checkout_snapshot(visitor) into expired_checkout;
  delete from public.nm_paid_checkouts where id = expired_checkout;
  perform public.nm_enqueue_purchase(order_ref || '_expired', expired_checkout, now_at, '{}');
  if (select count(*) from public.nm_purchase_deliveries where order_id = order_ref || '_expired' and checkout_id is null) <> 2 then
    raise exception 'checkout expirado impede registro de compra';
  end if;
end;
$$;

select 'DEV-353 · consentimento, janela, fila e revogação verificados' as result;
rollback;
