# Manual de Deploy: Nome Magnético na VPS

Este é o guia completo para inicializar a VPS (Ubuntu/Debian) e manter o deploy contínuo através do GitHub Actions.

---

## Gate obrigatório: banco antes de deploy

Antes de qualquer deploy, siga a [validação de migrations TESTE → produção](docs/devops/dev253-database-predeploy-validation.md#gate-obrigatório-antes-de-qualquer-deploy). SQL deve passar no TESTE, ser promovido somente com autorização e ter catálogo/advisors conferidos em produção antes da tag. Não rode db push às cegas: o histórico atual tem versões heterogêneas. Testes, Astro check ou build com erro bloqueiam o deploy.

## Passo 1: Preparar a VPS pela Primeira Vez

Conecte-se na sua VPS via SSH como root:

```bash
ssh root@103.199.185.152
```

Caso seja um servidor virgem, copie e cole o instanciador `setup-vps.sh` da sua pasta `scripts/` direto nele:
```bash
nano /root/setup-vps.sh
```
*(Cole o conteúdo)*, depois salve e execute:
```bash
bash /root/setup-vps.sh
```

Esse comando garantirá que seu servidor tem o Node.js v20, o PM2 global, ferramentas Nginx e criará as pastas estruturais em `/var/www/webapp/nome-magnetico`.

### 1.1 Variáveis de Ambiente na VPS

Com o diretório base criado, crie o arquivo `.env` definitivo do servidor:
```bash
nano /var/www/webapp/nome-magnetico/.env
```

Esse arquivo persiste entre deploys e contém as chaves privadas (Supabase service role, Stripe, etc.). O `start.mjs` o carrega na inicialização do PM2.

---

## Passo 2: Configurar os Secrets do GitHub Actions

Acesse o repositório no GitHub → **Settings** > **Secrets and variables** > **Actions** → **New repository secret**:

- **Name**: `SSH_PRIVATE_KEY`
- **Secret**: Todo o conteúdo da chave privada SSH (de `-----BEGIN OPENSSH PRIVATE KEY-----` até o `END`).

Host, IP e porta já estão hardcoded no `deploy.yml` (`103.199.185.152`, porta `2222`).

---

## Passo 3: Fluxo de Deploy com Tags

O deploy **não** é acionado em todo push. Ele usa **tags de versão** para controlar quando o GitHub Action roda:

### Push normal (só atualiza o repositório, SEM deploy):
```bash
git add .
git commit -m "feat: minha alteração"
git push origin main
```

### Push de deploy (atualiza o repositório E aciona o GitHub Action):
```bash
git add .
git commit -m "feat: minha alteração"
git tag v1.2.0
git push origin main --tags
```

Ou em dois passos separados:
```bash
git push origin main         # sobe o código
git push origin v1.2.0       # sobe a tag → aciona o deploy
```

### Convenção de versões (semver):
- `v1.0.0` → primeiro deploy em produção
- `v1.0.1` → correção pequena (patch)
- `v1.1.0` → nova feature (minor)
- `v2.0.0` → mudança grande/breaking (major)

### O que o GitHub Action faz ao receber a tag:
1. Faz checkout do código na tag
2. Instala Node.js 20 e dependências
3. Injeta variáveis públicas no `.env` e executa `npm run build`
4. Envia `dist/`, `package.json`, `ecosystem.config.cjs` e `start.mjs` para a VPS via SCP
5. Na VPS: instala dependências de produção e faz `pm2 reload` (sem downtime)

---

## Passo 4: Configurar Nginx e SSL (HTTPS)

Dentro da pasta recebida pelo GitHub Actions, há o arquivo `scripts/nginx.conf`. Copie para o Nginx:

```bash
cp /var/www/webapp/nome-magnetico/scripts/nginx.conf /etc/nginx/sites-available/nomemagnetico.com.br
ln -s /etc/nginx/sites-available/nomemagnetico.com.br /etc/nginx/sites-enabled/
systemctl reload nginx
```

### Instalar Certificado SSL (HTTPS gratuito)
```bash
sudo apt install python3-certbot-nginx -y
sudo certbot --nginx -d nomemagnetico.com.br -d www.nomemagnetico.com.br
```

---

## Monitoramento e Diagnóstico

```bash
# Ver status das instâncias PM2:
pm2 list

# Ver logs em tempo real:
pm2 logs nome-magnetico

# Reiniciar manualmente (com reload zero-downtime):
pm2 reload ecosystem.config.cjs --update-env

# Ver logs do último deploy no GitHub:
# GitHub → repositório → aba "Actions"
```
