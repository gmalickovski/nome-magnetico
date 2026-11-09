-- TESTE apenas: fixtures temporárias, sem persistência e sem envio.
BEGIN;
SET LOCAL statement_timeout = '15s';
CREATE TEMP TABLE profiles(id uuid PRIMARY KEY, is_test boolean);
CREATE TEMP TABLE subscriptions(id uuid PRIMARY KEY,user_id uuid,product_type text,payment_provider text,amount_paid numeric,refunded_at timestamptz,starts_at timestamptz,ends_at timestamptz);
CREATE TEMP TABLE analyses(id uuid PRIMARY KEY,user_id uuid,product_type text,status text,created_at timestamptz,updated_at timestamptz);
INSERT INTO profiles SELECT md5(i::text)::uuid,false FROM generate_series(1,20) i;
UPDATE profiles SET is_test=true WHERE id=md5('7')::uuid;
INSERT INTO subscriptions
 SELECT md5(('sub'||i)::text)::uuid,md5(i::text)::uuid,'nome_social','stripe',100,NULL,now()-interval '25 hours',now()+interval '10 days'
 FROM generate_series(1,9) i;
UPDATE subscriptions SET payment_provider='test' WHERE user_id=md5('2')::uuid;
UPDATE subscriptions SET amount_paid=0 WHERE user_id=md5('3')::uuid;
UPDATE subscriptions SET refunded_at=now() WHERE user_id=md5('4')::uuid;
UPDATE subscriptions SET ends_at=now()-interval '1 minute' WHERE user_id=md5('5')::uuid;
UPDATE subscriptions SET starts_at=now()-interval '23 hours' WHERE user_id=md5('6')::uuid;
INSERT INTO analyses VALUES
 (md5('a8')::uuid,md5('8')::uuid,'nome_social','complete',now()-interval '1 hour',now()),
 (md5('a9')::uuid,md5('9')::uuid,'nome_bebe','complete',now()-interval '1 hour',now()),
 (md5('a10')::uuid,md5('10')::uuid,'nome_social','error',now()-interval '2 days',now()-interval '59 minutes'),
 (md5('a11')::uuid,md5('11')::uuid,'nome_social','error',now()-interval '2 days',now()-interval '61 minutes'),
 (md5('a12')::uuid,md5('12')::uuid,'nome_social','processing',now()-interval '2 days',now()-interval '31 minutes'),
 (md5('a13')::uuid,md5('13')::uuid,'nome_social','processing',now()-interval '2 days',now()-interval '29 minutes'),
 (md5('a7')::uuid,md5('7')::uuid,'nome_social','error',now(),now());
CREATE TEMP TABLE actual AS
-- Executar apenas com credencial dedicada de leitura; nenhum dado de contato é selecionado.
WITH clock AS (SELECT now() AS at),
incidents AS (
 SELECT 'payment_without_analysis'::text AS kind, s.id AS entity_id,
        s.product_type, s.starts_at AS incident_at
 FROM pg_temp.subscriptions s
 JOIN pg_temp.profiles p ON p.id = s.user_id
 CROSS JOIN clock c
 WHERE s.product_type IN ('nome_magnetico','nome_social','nome_bebe','nome_empresa')
   AND s.payment_provider <> 'test' AND s.amount_paid > 0
   AND s.refunded_at IS NULL AND s.ends_at > c.at
   AND s.starts_at < c.at - interval '24 hours'
   AND p.is_test IS FALSE
   AND NOT EXISTS (
     SELECT 1 FROM pg_temp.analyses a
     WHERE a.user_id = s.user_id AND a.product_type = s.product_type
       AND a.created_at >= s.starts_at
   )
 UNION ALL
 SELECT CASE WHEN a.status = 'error' THEN 'analysis_error' ELSE 'analysis_stalled' END,
        a.id, a.product_type, a.updated_at
 FROM pg_temp.analyses a
 JOIN pg_temp.profiles p ON p.id = a.user_id
 CROSS JOIN clock c
 WHERE p.is_test IS FALSE
   AND a.product_type IN ('nome_magnetico','nome_social','nome_bebe','nome_empresa')
   AND ((a.status = 'error' AND a.updated_at >= c.at - interval '60 minutes')
     OR (a.status = 'processing' AND a.updated_at < c.at - interval '30 minutes'))
)
SELECT kind, entity_id, product_type, incident_at
FROM incidents
ORDER BY incident_at, kind, entity_id;

DO $verify$
BEGIN
 IF (SELECT count(*) FROM actual) <> 4
 OR NOT EXISTS (SELECT 1 FROM actual WHERE entity_id=md5('sub1')::uuid AND kind='payment_without_analysis')
 OR NOT EXISTS (SELECT 1 FROM actual WHERE entity_id=md5('sub9')::uuid AND kind='payment_without_analysis')
 OR NOT EXISTS (SELECT 1 FROM actual WHERE entity_id=md5('a10')::uuid AND kind='analysis_error')
 OR NOT EXISTS (SELECT 1 FROM actual WHERE entity_id=md5('a12')::uuid AND kind='analysis_stalled')
 THEN RAISE EXCEPTION 'DEV248 filter regression'; END IF;
END $verify$;
SELECT 'DEV248: all filter assertions passed; temporary fixtures rolled back' AS result;
ROLLBACK;
