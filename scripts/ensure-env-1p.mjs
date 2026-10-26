import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

if (!existsSync('.env') && existsSync('.env.1password')) {
  console.log('[env:1p] .env não encontrado neste worktree. Injetando via 1Password CLI...');
  execSync('op inject -i .env.1password -o .env --force', { stdio: 'inherit' });
}
