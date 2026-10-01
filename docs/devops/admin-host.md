# Host admin.nomemagnetico.com.br

O painel staff da fatia 1 do DEV-40 usa o mesmo processo Node do SaaS (porta `4321`). O Nginx só acrescenta um `server_name`. Aplicar na VPS muda produção: precisa da aprovação do Guilherme.

Arquivo de referência: `scripts/nginx-admin.conf`.

## Setup

1. Confirmar que o app atual responde em `127.0.0.1:4321`.
2. Criar o DNS de `admin.nomemagnetico.com.br` para o mesmo IP da VPS. Proxy Cloudflare, se houver, no mesmo modo do `www`.
3. Emitir certificado só desse host, sem reutilizar o certificado de `www` se ele não tiver o SAN:

   ```bash
   sudo certbot certonly --nginx -d admin.nomemagnetico.com.br
   ```

4. Publicar `scripts/nginx-admin.conf` em `sites-available`, habilitar o site e recarregar:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. O `www` já envia `Strict-Transport-Security` com `includeSubDomains`. O admin precisa de HTTPS válido antes de receber tráfego, senão o browser que já visitou o `www` recusa HTTP nesse subdomínio.
6. Entrar em `https://admin.nomemagnetico.com.br/login` com um perfil `profiles.role = admin`.

O bloco faz `proxy_set_header Host $host`. O app usa esse header para separar o painel do site. Não encaminhar `X-Forwarded-Host` do cliente.

## Rollback

1. Remover o site do `sites-enabled` e recarregar o Nginx. O processo do SaaS não muda.
2. O DNS pode continuar apontando; sem o server block a requisição cai no server default e não deve entregar `/ops` no host público.
3. Cookies `nm-ops-*` ficam só no host admin. Apagar o server block encerra o acesso ao painel sem mexer na sessão do cliente em `www`.

## Rotina

- Staff entra por `admin.nomemagnetico.com.br`, não pelo HQ e não por `/admin` no `www`.
- Conta sem `role = admin` não recebe sessão.
- A Área do Analista permanece em `www.nomemagnetico.com.br/app/admin-analise`.
- Local: `npm run dev` e abrir `/ops/login` no host local. Para simular o host admin, usar `admin.localhost` no `/etc/hosts` ou o header `Host: admin.localhost`.
