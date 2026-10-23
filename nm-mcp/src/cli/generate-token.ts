import { randomBytes, createHash } from 'node:crypto';

export function generateToken(): { token: string; hash: string } {
  const bytes = randomBytes(32);
  const token = `nm_admin_${bytes.toString('hex')}`;
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

function runCli(): void {
  const agentName = process.argv[2]?.trim() || 'novo_agente';
  const { token, hash } = generateToken();

  console.log('='.repeat(65));
  console.log(`NOVO TOKEN MCP GERADO PARA: ${agentName}`);
  console.log('='.repeat(65));
  console.log('\n[ATENÇÃO] O token abaixo é exibido APENAS UMA VEZ. Guarde com segurança:\n');
  console.log(`Bearer Token: ${token}`);
  console.log('\nHash SHA-256 para configuração (.env / MCP_TOKENS_JSON):\n');
  console.log(`Hash: ${hash}`);
  console.log('\nExemplo de configuração JSON:');
  console.log(
    JSON.stringify(
      [
        {
          agent: agentName,
          token_hash: hash,
          scopes: ['read', 'reprocess', 'resend'],
          is_active: true,
        },
      ],
      null,
      2,
    ),
  );
  console.log('='.repeat(65));
}

if (process.argv[1]?.includes('generate-token')) {
  runCli();
}
