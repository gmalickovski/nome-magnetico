#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

function reply(permission, agentMessage, userMessage) {
  const res = { permission };
  if (userMessage) res.user_message = userMessage;
  if (agentMessage) res.agent_message = agentMessage;
  process.stdout.write(JSON.stringify(res) + '\n');
  process.exit(0);
}

function deny(agentMessage, userMessage = 'Comando bloqueado pelas regras do repositório.') {
  reply('deny', agentMessage + ' Crie uma branch linear/ e abra um PR em draft para a main.', userMessage);
}

function allow() {
  reply('allow');
}

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf-8');
} catch {
  deny('Falha ao ler dados de entrada no stdin.');
}

if (!raw || !raw.trim()) {
  deny('Entrada vazia no hook guard-shell.');
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  deny('JSON inválido recebido no hook guard-shell.');
}

const command = typeof payload?.command === 'string' ? payload.command : '';
if (!command.trim()) {
  deny('Comando ausente ou inválido no payload.');
}

// Normaliza espaços múltiplos
const normalized = command.replace(/\s+/g, ' ').trim();

// 1. git push com destino main ou master
if (/\bgit\s+push\b/i.test(normalized)) {
  if (/(?:^|[\s:])(refs\/heads\/)?(main|master)(?:[\s;]|$)/i.test(normalized)) {
    deny('Push direto para as branches main ou master é estritamente proibido.');
  }

  // 2. git push com --force, -f ou --force-with-lease
  if (/(?:^|\s)(?:-f|--force|--force-with-lease)(?:[\s;]|$)/i.test(normalized)) {
    deny('Push com flag forçada (-f, --force ou --force-with-lease) é estritamente proibido.');
  }

  // 7b. git push --tags
  if (/(?:^|\s)--tags(?:[\s;]|$)/i.test(normalized)) {
    deny('Criação/push de tags deve ser feita exclusivamente via pipeline oficial por humanos.');
  }
}

// 3. git commit quando a branch atual é main ou master
if (/\bgit\s+commit\b/i.test(normalized)) {
  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (currentBranch === 'main' || currentBranch === 'master') {
      deny(`Commits diretos na branch '${currentBranch}' são proibidos.`);
    }
  } catch {
    // Se a checagem da branch falhar, permitir para não travar execuções legítimas sem git
  }
}

// 4. supabase db (qualquer subcomando) e supabase migration up
if (/\bsupabase\s+(?:db\b|migration\s+up\b)/i.test(normalized)) {
  deny('Comandos de mutação direta de banco de dados (supabase db / migration up) são proibidos para agentes.');
}

// 5. comando stripe (CLI) — regex (^|[;&|\s])stripe\s
if (/(?:^|[;&|\s])stripe\s/i.test(normalized)) {
  deny('Execução da CLI do Stripe é proibida para agentes.');
}

// 6. op (1Password CLI) quando o comando contém NM-PROD (case-insensitive)
if (/\bop(?:\.exe)?\s+/i.test(normalized) && /NM-PROD/i.test(normalized)) {
  deny('Acesso a segredos do item de produção NM-PROD via 1Password CLI é estritamente proibido.');
}

// 7a. gh pr merge
if (/\bgh\s+pr\s+merge\b/i.test(normalized)) {
  deny('Merge de PRs via CLI é proibido para agentes. Apenas humanos podem revisar e mesclar.');
}

// 7c. git tag
if (/\bgit\s+tag\b/i.test(normalized)) {
  deny('Criação de tags via git tag é proibida para agentes. Deploys são acionados apenas por humanos.');
}

allow();
