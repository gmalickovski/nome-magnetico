# SOP: Configuração da Análise Gratuita e Envio de PDF pelo Supabase

Este documento orienta sobre a ativação e configuração da funcionalidade de análise gratuita que gera e envia o dossiê PDF diretamente por e-mail (usando AWS SES SMTP via Supabase Edge Functions).

---

## 1. Banco de Dados (PostgreSQL Migration)

A tabela `public.free_analyses_leads` armazena os dados do lead e o arquivo PDF codificado em Base64. Esta tabela é necessária para que o backend envie a análise e para que a Edge Function do Deno acesse o arquivo.

### Como aplicar a migração:
1. Abra o painel do **Supabase Cloud**.
2. Vá para **SQL Editor** (Editor de SQL).
3. Abra um novo arquivo de query (New Query).
4. Copie todo o conteúdo do arquivo de migração local [031_free_analyses_leads.sql](file:///c:/Dev/nome-magnetico/supabase/migrations/031_free_analyses_leads.sql).
5. Cole no editor do Supabase e clique em **Run** (Executar).

---

## 2. Configuração de Secrets na Edge Function

A Edge Function `send-free-pdf` envia e-mails usando o servidor SMTP da AWS SES configurado para o projeto. Ela precisa de acesso a chaves e credenciais seguras.

### Configurar no Painel do Supabase:
1. Vá em **Project Settings** (Configurações do Projeto) > **Edge Functions**.
2. Na seção **Secrets**, clique em **Add Secret** e adicione as seguintes variáveis:
   - `SMTP_HOST`: O host SMTP do Amazon SES (ex: `email-smtp.us-east-1.amazonaws.com`).
   - `SMTP_PORT`: A porta SMTP do SES (ex: `465` para SSL ou `587` para TLS).
   - `SMTP_USER`: O usuário de credenciais SMTP do SES.
   - `SMTP_PASS`: A senha de credenciais SMTP do SES.
   - `SMTP_FROM`: O remetente do e-mail (ex: `contato@nomemagnetico.com.br`).
   - `SUPABASE_URL`: (Geralmente pré-configurado, mas certifique-se que aponta para o projeto correto).
   - `SUPABASE_SERVICE_ROLE_KEY`: (Geralmente pré-configurado, chave service role para que a function possa ler a tabela de leads).

### Configurar via CLI (Alternativa):
Se preferir usar o terminal com a CLI vinculada:
```bash
npx supabase secrets set SMTP_HOST="seu-host" SMTP_PORT="sua-porta" SMTP_USER="seu-user" SMTP_PASS="sua-senha" SMTP_FROM="contato@nomemagnetico.com.br" --project-ref bhxneaeuhybtucmbmpvg
```

---

## 3. Deploy da Edge Function (Status do Projeto)

A Edge Function `send-free-pdf` foi desenvolvida em Deno e já está em execução na nuvem do Supabase.

Caso queira fazer novas alterações no código da function (`supabase/functions/send-free-pdf/index.ts`) e subir uma nova versão, execute:
```bash
npx supabase functions deploy send-free-pdf --project-ref bhxneaeuhybtucmbmpvg --no-verify-jwt --use-api
```

*Nota: O parâmetro `--use-api` é importante caso a máquina local não tenha o Docker rodando, pois delega o bundle e build à infraestrutura do Supabase.*

---

## 4. Funcionamento Técnico do Fluxo

1. O visitante preenche o formulário na página de análise gratuita (`/analise-gratuita`).
2. O formulário dispara uma chamada POST para `/api/teste-bloqueio`.
3. O endpoint realiza os cálculos numerológicos completos locais e monta o PDF (`NomeAtualPDF`).
4. O PDF é codificado em Base64 e salvo em `public.free_analyses_leads` com o status `processing`.
5. O backend chama imediatamente a Edge Function `send-free-pdf` passando o `leadId` no body.
6. A Edge Function baixa o lead, decodifica o PDF, monta o layout de e-mail celestial e despacha o e-mail via AWS SES.
7. O status é atualizado para `complete`.
