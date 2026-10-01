# Nginx — host `admin.nomemagnetico.com.br`

Nota para a Infra. Este arquivo não altera o Nginx da VPS. `scripts/nginx.conf` continua só com apex e `www` até a Infra confirmar o virtual host.

O app é o mesmo processo (PM2 em `127.0.0.1:4321`). O middleware separa ops pelo header `Host`.

## O que precisa existir

- DNS `admin.nomemagnetico.com.br` (A/CNAME, proxy Cloudflare coerente com `www`).
- Certificado que cubra `admin.nomemagnetico.com.br` (`certbot -d nomemagnetico.com.br -d www.nomemagnetico.com.br -d admin.nomemagnetico.com.br`, ou o fluxo que a Infra já usa).
- `proxy_set_header Host $host;` — o app não confia em `X-Forwarded-Host`.
- Porta `4321` só em localhost.

## Bloco sugerido

Espelha o servidor `www` de `scripts/nginx.conf`. Ajustar o caminho do certificado se o Certbot criar outro diretório.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name admin.nomemagnetico.com.br;
    return 301 https://admin.nomemagnetico.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.nomemagnetico.com.br;

    ssl_certificate /etc/letsencrypt/live/nomemagnetico.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nomemagnetico.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Sem este server block, o host admin não chega no app. O código já pode ser exercitado com `admin.localhost` ou `ADMIN_HOST_OVERRIDE`. Ver `docs/architecture/admin-ops.md`.
