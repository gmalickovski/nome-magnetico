import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '@/backend/db/supabase';

const RequestSchema = z.object({
  product_type: z.enum(['nome_social', 'nome_bebe', 'nome_empresa', 'analise_gratuita']),
  nome_completo: z.string().min(2),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_free: z.boolean(),
  live_calculated_data: z.any(),
  // Opcionais para Bebê
  nome_pai: z.string().optional().nullable(),
  nome_mae: z.string().optional().nullable(),
  sobrenome_familia: z.string().optional().nullable(),
  nomes_candidatos: z.array(z.string()).optional().nullable(),
  genero_preferido: z.string().optional().nullable(),
  estilo_preferido: z.string().optional().nullable(),
  nome_ja_escolhido: z.boolean().optional().nullable(),
  // Opcionais para Empresa
  nome_socio_principal: z.string().optional().nullable(),
  data_nascimento_socio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  data_fundacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  ramo_atividade: z.string().optional().nullable(),
  descricao_negocio: z.string().optional().nullable(),
});

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) {
    return json({ error: 'Não autorizado' }, 401);
  }

  // Verificar se o usuário é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return json({ error: 'Acesso restrito para administradores' }, 403);
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch (err: any) {
    return json({ error: 'Dados inválidos', details: err?.errors }, 400);
  }

  const { product_type, nome_completo, data_nascimento, is_free, live_calculated_data, sobrenome_familia } = body;

  try {
    // 1. Gerar o analise_texto específico para cada produto
    let analiseTexto = '';
    const firstName = nome_completo.split(' ')[0];

    if (product_type === 'nome_social' || product_type === 'analise_gratuita') {
      analiseTexto = `
# Relatorio do Nome Social: ${nome_completo}

[INTRO_NUMEROS]
A análise numerológica profissional para **${nome_completo}** foi calculada com precisão. Este relatório traz a harmonização completa da sua assinatura, equilibrando seus números principais de Expressão, Destino, Motivação, Missão e Impressão para sintonizar sua vida com abundância e realização.
[/INTRO_NUMEROS]

[INTRO_BLOQUEIOS]
Os triângulos cabalísticos de ${firstName} foram analisados minuciosamente. Conseguimos detectar e harmonizar bloqueios energéticos nas sequências numéricas dos 4 triângulos (Vida, Pessoal, Social e Destino), neutralizando as tensões acumuladas.
[/INTRO_BLOQUEIOS]

[INTRO_ARCANOS]
Os arcanos regentes revelam os ciclos de força e os trânsitos de passagem da sua jornada espiritual. Através da nova assinatura harmonizada, você passará a ressoar em perfeita vibração com as energias mais elevadas deste momento.
[/INTRO_ARCANOS]

[INTRO_DEBITOS]
Mapeamos e identificamos os débitos kármicos em sua raiz vibracional original. O trabalho de reequilíbrio energético e autoconhecimento permitirá a transmutação consciente desses aprendizados passados em força de realização no presente.
[/INTRO_DEBITOS]

[INTRO_LICOES]
As lições kármicas revelam quais vibrações ausentes no nome de nascimento representam aprendizados evolutivos fundamentais a serem integrados e ativados conscientemente em sua nova assinatura.
[/INTRO_LICOES]

[INTRO_TENDENCIAS]
As tendências ocultas foram identificadas no mapeamento vibracional original, indicando impulsos e excessos comportamentais repetitivos que devem ser dosados sob a nova assinatura equilibrada.
[/INTRO_TENDENCIAS]
`;
    } else if (product_type === 'nome_bebe') {
      analiseTexto = `
# Análise de Nome para Bebê

[INTRO_NUMEROS]
O relatório completo de análise de nome para bebê foi elaborado com extremo carinho e rigor técnico. Com base nos sobrenomes da família e na data de nascimento (real ou prevista), calculamos a compatibilidade de Expressão e Destino de cada candidato para revelar a assinatura ideal.
[/INTRO_NUMEROS]

[INTRO_BLOQUEIOS]
Analisamos todos os 4 triângulos numerológicos dos nomes sugeridos para seu bebê. A triagem minuciosa de bloqueios garante uma escolha limpa e harmônica, permitindo que a criança cresça com caminhos de comunicação, saúde e afetividade plenamente abertos.
[/INTRO_BLOQUEIOS]

[INTRO_ARCANOS]
Os arcanos de trânsito e o arcano regente da criança foram mapeados sob uma perspectiva luminosa, proporcionando uma âncora de segurança, vitalidade e pleno desenvolvimento vibracional para o futuro do seu bebê.
[/INTRO_ARCANOS]
`;
    } else if (product_type === 'nome_empresa') {
      analiseTexto = `
# Análise de Nome Empresarial

[INTRO_NUMEROS]
O mapeamento numerológico corporativo estruturado pelo analista avalia o alinhamento da sua nova marca com os números de destino do sócio principal. O objetivo é criar um nome altamente magnético e propício para o crescimento sustentável do negócio.
[/INTRO_NUMEROS]

[INTRO_BLOQUEIOS]
Todos os 4 triângulos empresariais dos nomes candidatos foram checados. Escolher um nome livre de bloqueios numéricos recorrentes neutraliza tensões de comunicação corporativa, perdas inesperadas ou instabilidades de marca.
[/INTRO_BLOQUEIOS]

[INTRO_ARCANOS]
Os arcanos de passagem e a regência do nome empresarial foram calculados para sintonizar a empresa com prosperidade, atração de clientes ideais e superação de crises em seus respectivos trânsitos temporais.
[/INTRO_ARCANOS]
`;
    }

    // 2. Mapear as colunas a salvar com base no live_calculated_data
    let numero_expressao: number | null = null;
    let numero_destino: number | null = null;
    let numero_motivacao: number | null = null;
    let numero_missao: number | null = null;
    let numero_impressao: number | null = null;
    let numero_personalidade: number | null = null;
    let score: number | null = null;
    let bloqueios: any[] = [];
    let triangulo_vida: any = null;
    let triangulo_pessoal: any = null;
    let triangulo_social: any = null;
    let triangulo_destino: any = null;
    let licoes_carmicas: any[] = [];
    let tendencias_ocultas: any[] = [];
    let debitos_carmicos: any[] = [];
    let frequencias_numeros: any = null;
    let arcano_regente: number | null = null;

    if (product_type === 'nome_social' || product_type === 'analise_gratuita') {
      const melhorNome = live_calculated_data?.melhorNome;
      numero_expressao = melhorNome?.expressao ?? null;
      numero_destino = live_calculated_data?.destino ?? null;
      numero_motivacao = melhorNome?.motivacao ?? null;
      numero_missao = melhorNome?.missao ?? null;
      numero_impressao = melhorNome?.impressao ?? null;
      score = melhorNome?.score ?? null;
      bloqueios = melhorNome?.bloqueios ?? [];
      triangulo_vida = melhorNome?.triangulos?.vida ?? null;
      triangulo_pessoal = melhorNome?.triangulos?.pessoal ?? null;
      triangulo_social = melhorNome?.triangulos?.social ?? null;
      triangulo_destino = melhorNome?.triangulos?.destino ?? null;
      licoes_carmicas = melhorNome?.licoesCarmicas ?? [];
      tendencias_ocultas = melhorNome?.tendenciasOcultas ?? [];
      debitos_carmicos = melhorNome?.debitosCarmicos ?? [];
      arcano_regente = triangulo_vida?.arcanoRegente ?? null;

      // Monta frequências
      const targetName = melhorNome?.nomeCompleto || nome_completo;
      const counts: Record<string, number> = {};
      const nomeLimpo = targetName.toUpperCase().replace(/[^A-ZÇ]/g, '');
      const mapValores: Record<string, number> = {
        A:1, I:1, Q:1, J:1, Y:1, B:2, K:2, R:2, C:3, G:3, L:3, S:3, D:4, M:4, T:4, X:4,
        E:5, H:5, N:5, U:6, V:6, W:6, Ç:6, O:7, Z:7, F:8, P:8
      };
      for (const char of nomeLimpo) {
        const val = mapValores[char];
        if (val) counts[val] = (counts[val] || 0) + 1;
      }
      frequencias_numeros = {
        ranking: live_calculated_data,
        frequencias: counts,
        selectedNomeSocial: melhorNome?.nomeCompleto ?? null
      };

    } else if (product_type === 'nome_bebe') {
      const melhorNome = live_calculated_data?.melhorNome;
      numero_expressao = melhorNome?.expressao ?? null;
      numero_destino = live_calculated_data?.destino ?? null;
      numero_motivacao = melhorNome?.motivacao ?? null;
      numero_missao = melhorNome?.missao ?? null;
      numero_impressao = melhorNome?.impressao ?? null;
      score = melhorNome?.score ?? null;
      bloqueios = melhorNome?.bloqueios ?? [];
      triangulo_vida = live_calculated_data?.melhorNomeTriangulos?.vida ?? null;
      triangulo_pessoal = live_calculated_data?.melhorNomeTriangulos?.pessoal ?? null;
      triangulo_social = live_calculated_data?.melhorNomeTriangulos?.social ?? null;
      triangulo_destino = live_calculated_data?.melhorNomeTriangulos?.destino ?? null;
      licoes_carmicas = melhorNome?.licoesCarmicas ?? [];
      tendencias_ocultas = melhorNome?.tendenciasOcultas ?? [];
      debitos_carmicos = melhorNome?.debitosCarmicos ?? [];
      arcano_regente = triangulo_vida?.arcanoRegente ?? null;

      // Estrutura esperada por NomeBebePDF.tsx: { ranking: live_calculated_data, frequencias }
      frequencias_numeros = { ranking: live_calculated_data, frequencias: {} };

    } else if (product_type === 'nome_empresa') {
      const melhorNome = live_calculated_data?.melhorNome;
      numero_destino = live_calculated_data?.destinoSocio ?? null;
      numero_missao = melhorNome?.missao ?? null;
      numero_impressao = melhorNome?.impressao ?? null;
      score = melhorNome?.score ?? null;
      bloqueios = melhorNome?.bloqueios ?? [];

      // Triângulos da empresa
      triangulo_vida = live_calculated_data?.melhorNomeTriangulos?.vida ?? null;
      triangulo_pessoal = live_calculated_data?.melhorNomeTriangulos?.pessoal ?? null;
      triangulo_social = live_calculated_data?.melhorNomeTriangulos?.social ?? null;
      triangulo_destino = live_calculated_data?.melhorNomeTriangulos?.destino ?? null;
      arcano_regente = triangulo_vida?.arcanoRegente ?? null;

      // Estrutura esperada por NomeEmpresaPDF.tsx: o resultado inteiro
      frequencias_numeros = live_calculated_data;
    }

    // 3. Salvar análise principal
    const { data: insertedAnalysis, error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        product_type: product_type === 'analise_gratuita' ? 'nome_social' : product_type,
        nome_completo,
        data_nascimento,
        status: 'complete',
        is_free: is_free || product_type === 'analise_gratuita',
        is_analyst_generated: true,
        numero_expressao,
        numero_destino,
        numero_motivacao,
        numero_missao,
        numero_impressao,
        numero_personalidade,
        score,
        bloqueios,
        triangulo_vida,
        triangulo_pessoal,
        triangulo_social,
        triangulo_destino,
        licoes_carmicas,
        tendencias_ocultas,
        debitos_carmicos,
        frequencias_numeros,
        arcano_regente,
        analise_texto: analiseTexto.trim(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    const newAnalysisId = insertedAnalysis.id;

    // 4. Salvar nomes de candidatos em magnetic_names para listagens e PDFs
    if (product_type === 'nome_social' && Array.isArray(live_calculated_data?.nomesCandidatos)) {
      const rows = live_calculated_data.nomesCandidatos.map((sug: any) => ({
        analysis_id: newAnalysisId,
        user_id: user.id,
        nome_sugerido: sug.nomeCompleto,
        numero_expressao: sug.expressao ?? null,
        numero_motivacao: sug.motivacao ?? null,
        numero_missao: sug.missao ?? null,
        numero_impressao: sug.impressao ?? null,
        tem_bloqueio: sug.temBloqueio || sug.bloqueios?.length > 0,
        score: sug.score ?? 0,
        justificativa: Array.isArray(sug.justificativa) ? sug.justificativa.join('; ') : sug.justificativa || null,
      }));

      if (rows.length > 0) {
        await supabase.from('magnetic_names').insert(rows);
      }
    }

    // 5. Salvar inputs específicos se for bebê ou empresa
    if (product_type === 'nome_bebe') {
      const parentName = sobrenome_familia || nome_completo.replace('(bebê) ', '');
      await supabase.from('baby_name_inputs').insert({
        analysis_id: newAnalysisId,
        user_id: user.id,
        nome_pai: body.nome_pai || null,
        nome_mae: body.nome_mae || null,
        sobrenome_familia: parentName,
        data_nascimento_bebe: data_nascimento,
        genero_preferido: body.genero_preferido || 'surpresa',
        estilo_preferido: body.estilo_preferido || 'espiritual',
        nomes_candidatos: body.nomes_candidatos || [],
      });
    } else if (product_type === 'nome_empresa') {
      await supabase.from('company_name_inputs').insert({
        analysis_id: newAnalysisId,
        user_id: user.id,
        nome_socio_principal: body.nome_socio_principal || nome_completo,
        data_nascimento_socio: body.data_nascimento_socio || null,
        data_fundacao: body.data_fundacao || null,
        ramo_atividade: body.ramo_atividade || '',
        descricao_negocio: body.descricao_negocio || '',
        nomes_candidatos: body.nomes_candidatos || [],
      });
    }

    return json({ success: true, analysisId: newAnalysisId });
  } catch (error: any) {
    console.error('[save-analysis] Falha ao salvar analise do analista:', error);
    return json({ error: 'Falha ao salvar análise no banco de dados', detail: error?.message }, 500);
  }
};
