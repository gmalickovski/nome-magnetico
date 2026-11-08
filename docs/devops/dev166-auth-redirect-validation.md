# DEV-166 — Validação de redirects Supabase

Data: 2026-11-08. Base: 4ee44edead04178b23175f24454a261819552723.

Produção auditada pela API oficial de configuração Auth, sem alterar produção. Site URL: https://www.nomemagnetico.com.br; redirects permitem os hosts canônicos www e sem www. APP_URL da aplicação usa www. Templates de confirmação, recuperação e magic link renderizam os callbacks corretos no host www. Links sem www encontrados são do rodapé de suporte.

TESTE corrigido via PATCH oficial: site_url http://localhost:4321; uri_allow_list http://localhost:4321/**,http://127.0.0.1:4321/**. Estado anterior: localhost:3000 e lista vazia. HTTP 200 e leitura posterior confirmaram os valores. Templates permaneceram intactos. Backup privado no servidor, fora do Git.

Validação sintética: confirmação /auth/confirmar-email; recuperação /auth/nova-senha; magic link /auth/confirmar-email. TokenHash preservado. TESTE aceita os callbacks 4321 e rejeita localhost:3000, produção e domínio externo. Nenhum e-mail enviado; nenhum token real gerado. Não substitui teste E2E de cadastro/recuperação com caixa de entrada autorizada.

Local: definir APP_URL=http://localhost:4321 no processo e usar npm run dev:1p com credenciais TESTE. Rollback de configuração TESTE: restaurar site_url e uri_allow_list do backup privado. Sem mudança de schema, deploy ou produção.
