import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { executeReprocessarAnalise } from '../src/tools/reprocessar.js';
import { executeReenviarPdf } from '../src/tools/reenviar-pdf.js';
import { InternalAppClient } from '../src/client/app-client.js';

describe('nm-mcp Tools Execution', () => {
  it('reprocessar_analise utiliza dry_run true por padrão', async () => {
    let calledParams: any = null;
    const mockClient = {
      reprocessLead: async (params: any) => {
        calledParams = params;
        return {
          ok: true,
          status: 'dry_run',
          leadId: params.leadId,
          emailMasked: 't***@example.com',
        };
      },
    } as unknown as InternalAppClient;

    const result = await executeReprocessarAnalise(
      { lead_id: 'a0000000-0000-0000-0000-000000000001' } as any,
      mockClient,
    );

    assert.equal(result.sucesso, true);
    assert.equal(result.status, 'dry_run');
    assert.equal(result.dry_run, true);
    assert.equal(calledParams.dryRun, true);
  });

  it('reenviar_pdf utiliza dry_run true por padrão', async () => {
    let calledParams: any = null;
    const mockClient = {
      resendPdf: async (params: any) => {
        calledParams = params;
        return {
          ok: true,
          status: 'dry_run',
          leadId: params.leadId,
          emailMasked: 'c***@example.com',
          hasPdf: true,
        };
      },
    } as unknown as InternalAppClient;

    const result = await executeReenviarPdf(
      { lead_id: 'c0000000-0000-0000-0000-000000000001' } as any,
      mockClient,
    );

    assert.equal(result.sucesso, true);
    assert.equal(result.status, 'dry_run');
    assert.equal(result.dry_run, true);
    assert.equal(calledParams.dryRun, true);
  });
});
