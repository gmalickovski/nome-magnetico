-- Somente leitura: executar em TESTE e producao; todos os checks devem ser true.
SELECT jsonb_build_object(
'chat_table',to_regclass('public.chat_checkout_choices') IS NOT NULL,
'chat_rls',(SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.chat_checkout_choices')),
'anon_no_access',NOT has_table_privilege('anon','public.chat_checkout_choices','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
'authenticated_select_only',has_table_privilege('authenticated','public.chat_checkout_choices','SELECT') AND NOT has_table_privilege('authenticated','public.chat_checkout_choices','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
'service_crud',has_table_privilege('service_role','public.chat_checkout_choices','SELECT') AND has_table_privilege('service_role','public.chat_checkout_choices','INSERT') AND has_table_privilege('service_role','public.chat_checkout_choices','UPDATE') AND has_table_privilege('service_role','public.chat_checkout_choices','DELETE'),
'service_no_ddl_privileges',NOT has_table_privilege('service_role','public.chat_checkout_choices','TRUNCATE,REFERENCES,TRIGGER'),
'user_status_invoker',(SELECT coalesce(reloptions && ARRAY['security_invoker=true','security_invoker=on'],false) FROM pg_class WHERE oid='public.user_status'::regclass),
'private_admin_function',to_regprocedure('private.is_admin()') IS NOT NULL,
'rate_limit_table',to_regclass('public.public_analysis_rate_limits') IS NOT NULL,
'expected_indexes',(SELECT count(*)=7 FROM pg_indexes WHERE schemaname='public' AND indexname IN ('idx_chat_checkout_choices_user_id','idx_chat_checkout_choices_analysis_id','idx_blog_posts_category','idx_blog_posts_cover_published','idx_blog_posts_featured','client_messages_scheduled_idx','support_tickets_gmail_message_id_idx')),
'fk_and_check_parity',(SELECT count(*)=4 AND bool_and(convalidated) FROM pg_constraint WHERE connamespace='public'::regnamespace AND conname IN ('baby_name_inputs_genero_preferido_check','client_messages_template_id_fkey','client_messages_status_check','client_messages_target_type_check')),
'ticket_sequence',to_regclass('public.support_ticket_seq') IS NOT NULL,
'ticket_trigger',EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.support_tickets'::regclass AND tgname='tr_set_ticket_number' AND tgenabled='O' AND NOT tgisinternal),
'public_tables_rls',NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity)
) AS checks;
