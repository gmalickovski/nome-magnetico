import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createUserClient, supabase as globalSupabase } from '../../backend/db/supabase';
import { hasActiveSubscription } from '../../backend/db/subscriptions';
import { createAnalysis, updateAnalysis, saveMagneticNames, hasUsedFreeAnalysis } from '../../backend/db/analyses';
import { calcularTodosTriangulos, detectarBloqueios, todasSequenciasNegativas } from '../../backend/numerology/triangle';
import { calcularCincoNumeros } from '../../backend/numerology/numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, mapearFrequencias, calcularDebitosCarmicos } from '../../backend/numerology/karmic';
import { gerarNomesMagneticos } from '../../backend/numerology/suggestions';
import { generateAnalysis, generateSuggestions, generateBabyAnalysis, generateCompanyAnalysis, generateSocialAnalysis } from '../../backend/ai/brain';
import { calcularScore, calcularScoreTeto } from '../../backend/numerology/score';
import { avaliarCompatibilidade } from '../../backend/numerology/harmonization';
import { analisarNomesBebe } from '../../backend/numerology/products/nome-bebe';
import { analisarNomesEmpresa } from '../../backend/numerology/products/nome-empresa';
import { verificarDisponibilidadeNomes } from '../../backend/utils/availability';
import { analisarNomeSocial, analisarNomesSocial } from '../../backend/numerology/products/nome-social';
import type { ProductType } from '../../backend/payments/stripe';
import type { AnalysisProductType } from '../../backend/db/analyses';
import { notify } from '../../backend/notifications/notify';

const schema = z.object({
  nome_completo: z.string().min(2).max(150),
  data_nascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  product_type: z.enum(['nome_social', 'nome_bebe', 'nome_empresa', 'analise_gratuita']).default('nome_social'),
  // campos específicos nome_bebe
  sobrenome_familia: z.string().min(1).max(100).optional(),
  nomes_candidatos: z.array(z.string().min(2)).optional(),
  nome_pai: z.string().optional(),
  sobrenome_pai: z.string().optional(),
  ignorar_pai: z.boolean().optional(),
  nome_mae: z.string().optional(),
  sobrenome_mae: z.string().optional(),
  ignorar_mae: z.boolean().optional(),
  outros_sobrenomes: z.array(z.string()).optional(),
  genero_preferido: z.string().optional(),
  estilo_preferido: z.string().optional(),
  caracteristicas_desejadas: z.string().max(300).optional(),
  // campos específicos nome_empresa
  data_fundacao: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  ramo_atividade: z.string().optional(),
  descricao_negocio: z.string().optional(),
  nome_socio2: z.string().min(2).max(150).optional(),
  data_nascimento_socio2: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  // campos específicos nome_social (novo fluxo)
  objetivo_apresentacao: z.string().max(500).optional(),
  vibracoes_desejadas: z.string().max(300).optional(),
  contexto_uso: z.string().optional(),
  nome_social_principal: z.string().min(2).max(150).optional(),
  // flag de modo nome_bebe: indica que o nome já foi registrado em cartório
  nome_ja_escolhido: z.boolean().optional(),
  // análise gratuita (uma por usuário, sem subscription)
  is_free: z.boolean().optional(),
});

const AI_TIMEOUT_MS = 75_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = AI_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function buildSelectedSocialSummary({
  nomeNascimento,
  nomeSocial,
  score,
  bloqueios,
  compatibilidade,
}: {
  nomeNascimento: string;
  nomeSocial: string;
  score?: number | null;
  bloqueios: number;
  compatibilidade?: string | null;
}): string {
  const scoreText = score == null ? 'em calculo' : `${score}/100`;
  const bloqueioText = bloqueios === 1 ? '1 bloqueio ativo' : `${bloqueios} bloqueios ativos`;
  const compatText = compatibilidade ? `Compatibilidade: ${compatibilidade}.` : '';

  return [
    `# Relatorio do Nome Social: ${nomeSocial}`,
    '',
    `Esta analise foi recalculada a partir dos mesmos dados de nascimento de ${nomeNascimento}, usando ${nomeSocial} como nome principal avaliado.`,
    '',
    `Score numerologico: ${scoreText}.`,
    `Diagnostico de bloqueios: ${bloqueioText}.`,
    compatText,
    '',
    'O relatorio usa os quatro triangulos cabalisticos, os cinco numeros principais e os criterios formais de compatibilidade para comparar o nome social escolhido com a base de nascimento.',
  ].filter(Boolean).join('\n');
}

export const POST: APIRoute = async ({ request, locals }) => {
  let user = (locals as any).user;
  let accessToken = (locals as any).accessToken;

  if (!user || !accessToken) {
    const authHeader = request.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (bearerToken) {
      const { data, error } = await globalSupabase.auth.getUser(bearerToken);
      const apps = data.user?.app_metadata?.apps as string[] | undefined;
      if (!error && data.user && (apps === undefined || apps.includes('nome_magnetico'))) {
        user = data.user;
        accessToken = bearerToken;
      }
    }
  }

  if (!user || !accessToken) {
    return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createUserClient(accessToken);

  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    nome_completo, data_nascimento, product_type,
    sobrenome_familia, nomes_candidatos,
    nome_pai, sobrenome_pai, ignorar_pai,
    nome_mae, sobrenome_mae, ignorar_mae,
    outros_sobrenomes,
    genero_preferido, estilo_preferido, caracteristicas_desejadas,
    data_fundacao, ramo_atividade, descricao_negocio,
    nome_socio2, data_nascimento_socio2,
    objetivo_apresentacao, vibracoes_desejadas, contexto_uso,
    nome_social_principal,
    nome_ja_escolhido,
    is_free,
  } = parsed.data;

  const { data: profile } = await supabase
    
    .from('profiles')
    .select('gender, role, email, nome, birth_name, birth_date')
    .eq('id', user.id)
    .single();


  const gender = profile?.gender || 'Neutro';
  const isAdmin = profile?.role === 'admin';

  const isGratuita = product_type === 'analise_gratuita' || is_free === true;

  // Verificar acesso
  if (isGratuita) {
    // Análise gratuita: verificar se já foi utilizada (admin e dev isentos para fins de teste)
    const jaUsou = await hasUsedFreeAnalysis(user.id);
    const isDev = import.meta.env.DEV;
    
    if (jaUsou && !isAdmin && !isDev) {
      return new Response(JSON.stringify({ error: 'Análise gratuita já utilizada. Acesse "Minhas Análises" para ver seu relatório.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // Análise paga: verificar subscription
    const hasAccess = await hasActiveSubscription(user.id, product_type as ProductType);
    if (!hasAccess && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Subscription inativa para este produto' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (product_type === 'nome_social' || isGratuita) {
    const parts = data_nascimento.split('/');
    const birthDateDb = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : data_nascimento;
    const shouldUpdateBirthProfile =
      profile?.birth_name !== nome_completo.trim() ||
      profile?.birth_date !== birthDateDb;

    if (shouldUpdateBirthProfile) {
      const { error: birthProfileError } = await supabase
        .from('profiles')
        .update({
          birth_name: nome_completo.trim(),
          birth_date: birthDateDb,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (birthProfileError) {
        console.warn('[analyze] falha ao salvar dados base do perfil:', birthProfileError.message);
      }
    }
  }

  // Criar análise no banco
  const analysisDisplayName =
    product_type === 'nome_social' && nome_social_principal
      ? nome_social_principal.trim()
      : nome_completo;

  const analysis = await createAnalysis({
    userId: user.id,
    productType: product_type as AnalysisProductType,
    nomeCompleto: analysisDisplayName,
    dataNascimento: data_nascimento,
    isFree: isGratuita,
  });

  // Processar em background (não bloqueia a resposta)
  (async () => {
    try {
      await updateAnalysis(analysis.id, { status: 'processing' });

      let analiseTexto: string;
      let marketingStats = {
        score: null as number | null,
        bloqueios: 0,
        licoesCarmicas: 0,
        tendenciasOcultas: 0,
        debitosCarmicos: 0,
      };

      if (product_type === 'nome_empresa') {
        // ── Produto: Nome da Empresa ──
        const candidatos = nomes_candidatos ?? [];

        const resultado = analisarNomesEmpresa(
          candidatos,
          nome_completo,
          data_nascimento,
          data_fundacao ?? null,
          nome_socio2,
          data_nascimento_socio2,
          ramo_atividade,
          descricao_negocio
        );

        // Enriquecer com disponibilidade digital (.com, .com.br, Instagram)
        try {
          const nomesParaVerificar = resultado.nomesCandidatos.map(a => a.nomeEmpresa);
          const disponibilidades = await verificarDisponibilidadeNomes(nomesParaVerificar);
          resultado.nomesCandidatos = resultado.nomesCandidatos.map(a => ({
            ...a,
            disponibilidade: disponibilidades.get(a.nomeEmpresa.toLowerCase()) ?? null,
          }));
          if (resultado.melhorNome) {
            resultado.melhorNome = {
              ...resultado.melhorNome,
              disponibilidade: disponibilidades.get(resultado.melhorNome.nomeEmpresa.toLowerCase()) ?? null,
            };
          }
        } catch {
          // Falha na verificação não deve bloquear a análise
        }

        // Calcular triângulos do melhor nome (mesmo padrão do nome_bebe)
        const melhorNomeEmpresaStr = resultado.melhorNome?.nomeEmpresa ?? null;
        const dataTriangulosEmpresa = data_fundacao ?? data_nascimento;
        const todosTriangulosEmpresa = melhorNomeEmpresaStr
          ? calcularTodosTriangulos(melhorNomeEmpresaStr, dataTriangulosEmpresa)
          : null;

        await updateAnalysis(analysis.id, {
          frequencias_numeros: resultado as unknown,
          numero_destino: resultado.destinoSocio,
          numero_missao: resultado.melhorNome?.missao ?? null,
          numero_impressao: resultado.melhorNome?.impressao ?? null,
          score: resultado.melhorNome?.score ?? null,
          triangulo_vida:    todosTriangulosEmpresa?.vida    as unknown ?? null,
          triangulo_pessoal: todosTriangulosEmpresa?.pessoal as unknown ?? null,
          triangulo_social:  todosTriangulosEmpresa?.social  as unknown ?? null,
          triangulo_destino: todosTriangulosEmpresa?.destino as unknown ?? null,
        });

        analiseTexto = await withTimeout(generateCompanyAnalysis(
          {
            resultado,
            ramoAtividade: ramo_atividade,
            descricaoNegocio: descricao_negocio,
          },
          user.id,
          analysis.id
        ));
      } else if (product_type === 'nome_bebe') {
        // ── Produto: Nome do Bebê ──
        const candidatos = nomes_candidatos ?? [];

        const sobrenomesValidos: string[] = [];
        if (outros_sobrenomes && outros_sobrenomes.length > 0) {
          sobrenomesValidos.push(...outros_sobrenomes);
        }
        if (!ignorar_mae && sobrenome_mae) {
          sobrenomesValidos.push(sobrenome_mae);
        }
        if (!ignorar_pai && sobrenome_pai) {
          sobrenomesValidos.push(sobrenome_pai);
        }
        
        // Fallback for legacy requests 
        if (sobrenomesValidos.length === 0 && sobrenome_familia) {
          sobrenomesValidos.push(sobrenome_familia);
        }
        if (sobrenomesValidos.length === 0 && !nome_ja_escolhido) {
          sobrenomesValidos.push(nome_completo.replace('(bebê) ', ''));
        }

        const resultado = analisarNomesBebe(candidatos, sobrenomesValidos, data_nascimento, genero_preferido, nome_ja_escolhido);

        const melhorNome = resultado.melhorNome;
        const cincoNums = melhorNome
          ? calcularCincoNumeros(melhorNome.nomeCompleto, data_nascimento)
          : null;
        const todosTriangulosBebe = melhorNome
          ? calcularTodosTriangulos(melhorNome.nomeCompleto, data_nascimento)
          : null;
        const freqMapBebe = melhorNome ? mapearFrequencias(melhorNome.nomeCompleto) : {};

        await updateAnalysis(analysis.id, {
          frequencias_numeros: { ranking: resultado, frequencias: freqMapBebe } as unknown,
          numero_expressao:    melhorNome?.expressao    ?? null,
          numero_destino:      resultado.destino,
          numero_motivacao:    melhorNome?.motivacao    ?? null,
          numero_missao:       melhorNome?.missao       ?? null,
          numero_impressao:    melhorNome?.impressao    ?? null,
          bloqueios:           (melhorNome?.bloqueios ?? []) as unknown[],
          triangulo_vida:      todosTriangulosBebe?.vida    as unknown ?? null,
          triangulo_pessoal:   todosTriangulosBebe?.pessoal as unknown ?? null,
          triangulo_social:    todosTriangulosBebe?.social  as unknown ?? null,
          triangulo_destino:   todosTriangulosBebe?.destino as unknown ?? null,
          licoes_carmicas:     (melhorNome?.licoesCarmicas ?? [])    as unknown[],
          tendencias_ocultas:  (melhorNome?.tendenciasOcultas ?? []) as unknown[],
          debitos_carmicos:    (melhorNome?.debitosCarmicos ?? [])   as unknown[],
          score: melhorNome?.score ?? null,
        });

        analiseTexto = await withTimeout(generateBabyAnalysis(
          {
            resultado,
            nomePai: nome_pai,
            nomeMae: nome_mae,
            generoPreferido: genero_preferido,
            estiloPreferido: estilo_preferido,
            caracteristicasDesejadas: caracteristicas_desejadas,
            nomeJaEscolhido: nome_ja_escolhido ?? false,
          },
          user.id,
          analysis.id
        ));
      } else if (product_type === 'nome_social' && !nome_ja_escolhido) {
        // ── Produto: Nome Social (novo fluxo) ──
        const candidatos = nomes_candidatos ?? [];

        const resultado = analisarNomesSocial(
          candidatos,
          nome_completo,
          data_nascimento,
          genero_preferido
        );

        if (nome_social_principal) {
          const principalNormalizado = nome_social_principal.trim().toLowerCase();
          const nomeEscolhido =
            resultado.nomesCandidatos.find(
              candidato => candidato.nomeCompleto.trim().toLowerCase() === principalNormalizado
            ) ?? analisarNomeSocial(nome_social_principal, data_nascimento, 'usuario');

          resultado.melhorNome = nomeEscolhido;
          resultado.nomesCandidatos = [
            nomeEscolhido,
            ...resultado.nomesCandidatos.filter(
              candidato => candidato.nomeCompleto.trim().toLowerCase() !== principalNormalizado
            ),
          ];
          resultado.top3 = resultado.nomesCandidatos
            .filter(candidato => candidato.nomeCompleto.trim().toLowerCase() !== principalNormalizado)
            .slice(0, 3);
        }

        const melhor = resultado.melhorNome;
        marketingStats = {
          score: melhor?.score ?? null,
          bloqueios: melhor?.bloqueios?.length ?? 0,
          licoesCarmicas: melhor?.licoesCarmicas?.length ?? 0,
          tendenciasOcultas: melhor?.tendenciasOcultas?.length ?? 0,
          debitosCarmicos: melhor?.debitosCarmicos?.length ?? 0,
        };
        const todosTriangulosSocial = melhor
          ? calcularTodosTriangulos(melhor.nomeCompleto, data_nascimento)
          : null;
        const freqMapSocial = melhor ? mapearFrequencias(melhor.nomeCompleto) : {};

        await updateAnalysis(analysis.id, {
          frequencias_numeros: {
            ranking: resultado,
            frequencias: freqMapSocial,
            selectedNomeSocial: nome_social_principal ? melhor?.nomeCompleto ?? nome_social_principal : null,
          } as unknown,
          numero_expressao:    melhor?.expressao    ?? null,
          numero_destino:      resultado.destino,
          numero_motivacao:    melhor?.motivacao    ?? null,
          numero_missao:       melhor?.missao       ?? null,
          numero_impressao:    melhor?.impressao    ?? null,
          bloqueios:           (melhor?.bloqueios   ?? []) as unknown[],
          triangulo_vida:      todosTriangulosSocial?.vida    as unknown ?? null,
          triangulo_pessoal:   todosTriangulosSocial?.pessoal as unknown ?? null,
          triangulo_social:    todosTriangulosSocial?.social  as unknown ?? null,
          triangulo_destino:   todosTriangulosSocial?.destino as unknown ?? null,
          licoes_carmicas:     (melhor?.licoesCarmicas    ?? []) as unknown[],
          tendencias_ocultas:  (melhor?.tendenciasOcultas ?? []) as unknown[],
          debitos_carmicos:    (melhor?.debitosCarmicos   ?? []) as unknown[],
          score: melhor?.score ?? null,
        });

        // Salvar inputs do formulário para histórico
        const parts = data_nascimento.split('/');
        const dataNascIso = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : data_nascimento;
        await supabase.from('social_name_inputs').insert({
          analysis_id: analysis.id,
          user_id: user.id,
          nome_nascimento: nome_completo,
          data_nascimento: dataNascIso,
          objetivo_apresentacao: objetivo_apresentacao ?? null,
          vibracoes_desejadas: vibracoes_desejadas ?? null,
          contexto_uso: contexto_uso ?? null,
          estilo_preferido: estilo_preferido ?? null,
          genero: genero_preferido ?? null,
          nomes_candidatos: candidatos,
        });

        if (nome_social_principal) {
          analiseTexto = buildSelectedSocialSummary({
            nomeNascimento: nome_completo,
            nomeSocial: melhor?.nomeCompleto ?? nome_social_principal,
            score: melhor?.score,
            bloqueios: melhor?.bloqueios?.length ?? 0,
            compatibilidade: melhor?.compatibilidade,
          });
        } else {
          analiseTexto = await withTimeout(generateSocialAnalysis(
            {
              resultado,
              nomeNascimento: nome_completo,
              objetivoApresentacao: objetivo_apresentacao,
              vibracoesDesejadas: vibracoes_desejadas,
              contextoUso: contexto_uso,
              estiloPreferido: estilo_preferido,
              genero: genero_preferido,
            },
            user.id,
            analysis.id
          ));
        }
      } else {
        // ── Produto: fallback genérico (não deve ocorrer com os 3 produtos definidos) ──
        const todosTriangulos = calcularTodosTriangulos(nome_completo, data_nascimento);
        const bloqueios = detectarBloqueios(todosTriangulos);
        const sequenciasNegativas = todasSequenciasNegativas(todosTriangulos);
        const cincoNumeros = calcularCincoNumeros(nome_completo, data_nascimento);

        const licoesCarmicas = detectarLicoesCarmicas(nome_completo);
        const tendenciasOcultas = detectarTendenciasOcultas(nome_completo);
        const frequenciasNumeros = mapearFrequencias(nome_completo);
        const debitosCarmicos = calcularDebitosCarmicos(
          data_nascimento,
          cincoNumeros.destino,
          cincoNumeros.motivacao,
          cincoNumeros.expressao
        );

        const arcanoRegente = todosTriangulos.vida.arcanoRegente;

        const compatibilidade = avaliarCompatibilidade(cincoNumeros.expressao, cincoNumeros.destino);
        const score = calcularScore({
          bloqueios: bloqueios.length,
          licoesCarmicas: licoesCarmicas.length,
          tendenciasOcultas: tendenciasOcultas.length,
          debitosCarmicos: debitosCarmicos.length,
          debitosCarmicoFixos: debitosCarmicos.filter(d => d.fixo).length,
          compatibilidade,
        });
        marketingStats = {
          score,
          bloqueios: bloqueios.length,
          licoesCarmicas: licoesCarmicas.length,
          tendenciasOcultas: tendenciasOcultas.length,
          debitosCarmicos: debitosCarmicos.length,
        };

        await updateAnalysis(analysis.id, {
          numero_expressao: cincoNumeros.expressao,
          numero_destino: cincoNumeros.destino,
          numero_motivacao: cincoNumeros.motivacao,
          numero_missao: cincoNumeros.missao,
          numero_impressao: cincoNumeros.impressao,
          arcano_regente: arcanoRegente,
          bloqueios: bloqueios as unknown[],
          triangulo_vida: todosTriangulos.vida as unknown,
          triangulo_pessoal: todosTriangulos.pessoal as unknown,
          triangulo_social: todosTriangulos.social as unknown,
          triangulo_destino: todosTriangulos.destino as unknown,
          licoes_carmicas: licoesCarmicas as unknown[],
          tendencias_ocultas: tendenciasOcultas as unknown[],
          debitos_carmicos: debitosCarmicos as unknown[],
          frequencias_numeros: frequenciasNumeros as unknown,
          score,
        });

        analiseTexto = await withTimeout(generateAnalysis(
          {
            nomeCompleto: nome_completo,
            dataNascimento: data_nascimento,
            cincoNumeros,
            arcanoRegente,
            todosTriangulos,
            bloqueios,
            licoesCarmicas,
            tendenciasOcultas,
            debitosCarmicos,
            gender,
            isCurrentNameAnalysis: !!nome_ja_escolhido || isGratuita,
            isFreeAnalysis: isGratuita,
          },
          user.id,
          analysis.id
        ));
        void sequenciasNegativas;
      }

      await updateAnalysis(analysis.id, {
        analise_texto: analiseTexto,
        status: 'complete',
        completed_at: new Date().toISOString(),
      });

      if (isGratuita) {
        const appUrl = process.env.APP_URL ?? 'https://nomemagnetico.com.br';
        const firstName = (profile?.nome || nome_completo || user.email || 'Cliente').split(' ')[0];
        await notify('marketing.free_analysis_completed', {
          email: profile?.email ?? user.email,
          firstName,
          userId: user.id,
          analysisId: analysis.id,
          analysisUrl: `${appUrl}/app/resultado/${analysis.id}`,
          productType: 'nome_social',
          productName: 'Nome Social',
          offerUrl: `${appUrl}/nome-social`,
          checkoutUrl: `${appUrl}/auth/cadastro?produto=nome_social`,
          score: marketingStats.score,
          nomeCompleto: nome_completo,
          bloqueios: marketingStats.bloqueios,
          licoesCarmicas: marketingStats.licoesCarmicas,
          tendenciasOcultas: marketingStats.tendenciasOcultas,
          debitosCarmicos: marketingStats.debitosCarmicos,
          source: 'free_analysis_completed',
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuota = errMsg.includes('QUOTA_EXCEEDED');
      const isTimeout = errMsg.includes('AI_TIMEOUT');
      console.error('[analyze] Erro ao processar:', isQuota ? 'QUOTA_EXCEEDED (Groq + OpenAI)' : err);
      await updateAnalysis(analysis.id, {
        status: 'error',
        error_message: isQuota || isTimeout
          ? 'Nosso sistema de análise está com alta demanda agora. Por favor, tente novamente em alguns minutos. 🙏'
          : 'Nao foi possivel concluir a analise agora. Tente novamente em alguns instantes.',
      });
    }
  })();

  return new Response(JSON.stringify({ analysisId: analysis.id }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
