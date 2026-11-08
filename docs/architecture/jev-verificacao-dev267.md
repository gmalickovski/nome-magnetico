# DEV-267 — verificação estática e mocks do JEV

Base inspecionada: 251a2c8e912c12ab4ac63f30f431e3509e095ef3, origin/main em 08/11/2026. Escopo autorizado no chat: somente mocks. Nenhuma chamada real JEV, Groq ou OpenAI; nenhuma alteração de implementação, produção, env ou PDFs nesta branch.

## Matriz de evidências

| Item | Resultado |
| --- | --- |
| SDK instalado | @typesafe-ai/sdk 0.7.0, package-lock.json e node_modules/@typesafe-ai/sdk/package.json |
| Configuração referenciada | TYPESAFE_API_KEY, resolvida por getEnvKey no provider; item NM-TESTE-JEV informado no cofre TESTE |
| Credencial JEV resolvida/validada | Não executado; os testes usam valor sintético e SDK substituído |
| Contrato mockado | 9 casos: sucesso, chave ausente, 401/402/403/429/500, timeout e resposta vazia |
| Rede nos novos testes | fetch bloqueado e contador de tentativas igual a zero |
| Chamada real comprovada | Não executada por decisão explícita do usuário |
| Uso/tokens/custo reais | Não medidos; não foi feita chamada externa pelos novos testes |

## Caminho e configuração existentes

- src/pages/api/decide-live.ts:143 recebe POST, valida dados com decideLiveSchema e calcula score, cinco números e os quatro triângulos antes de chamar InteractiveDecisionEngine em :245.
- src/shared/interactive-engine/engine.ts:49 chama runJevDecision. O JEV decide contexto/área/estilo; os cálculos numerológicos continuam determinísticos.
- src/shared/interactive-engine/providers/jev-provider.ts:65 instancia TypeSafeClient com model jev-latest, timeout de 1500 ms e maxRetries 0; usa systemOne com estado e perguntas tipadas.
- O SDK instalado usa https://api.typesafe.ai como endpoint padrão; TYPESAFE_BASE_URL pode sobrescrevê-lo (dist/index.mjs:904). O destino efetivo de um ambiente real não foi verificado.
- runJevDecision (:409): JEV → Groq structured → OpenAI structured → regras locais. Os fallbacks remotos dependem de chave presente e relato com pelo menos seis caracteres. Têm AbortController de 1800 ms e max_tokens 200 (:245). Uma falha JEV pode, portanto, causar consumo em outra conta.
- locateSignatureBoxWithJev (:455) usa jev-preview, timeout de 2500 ms e maxRetries 0; fora da cobertura dos novos mocks de decisão.
- providerUsed aparece no resultado e no log (:319; decide-live.ts:315 e :329). Os catch do roteamento não registram motivo sanitizado da falha. Não há medição de usage/tokens/custo no resultado atual.

## Achados antes de habilitar chamadas reais

1. **Autorização:** decide-live.ts:143 recebe somente request e não exige sessão, acesso ativo ou admin. O middleware público retorna next para chamadas sem cookie que não sejam páginas /app (src/middleware.ts:201–215). A rota pode alcançar o provider sem um gate local de autenticação/autorização. Não houve exploração ou teste contra produção. A finalidade de uma experiência gratuita não dispensa um limite server-side para chamadas pagas.
2. **LoopGuard:** não foi encontrado no caminho decide-live → engine → jev-provider. Isso diverge da regra do projeto de passar toda chamada IA pelo LoopGuard. Falta comprovar/implementar limite por sessão e proteção de consumo antes de habilitar chave real nesse caminho.
3. **Fallback e observabilidade:** não há kill switch explícito desse caminho; presença das chaves habilita a cadeia. Exceções são engolidas e o motivo não é observável. Provider efetivo deve ser distinguido de sucesso do JEV em qualquer prova futura.
4. **Contrato de saída:** o código faz casts de choices e usa noul/score diretamente. Os mocks demonstram fallback para uma resposta sem answers; não comprovam rejeição de todos os valores fora de domínio. Validar limites/enums e saída parcialmente malformada é trabalho posterior.
5. **Configuração:** este relatório não comprova que uma chave guardada funciona, que o projeto real é TESTE ou que sua cobrança é separada. Nenhuma leitura de valor JEV foi necessária.

## Reprodução

npx --yes tsx --experimental-test-module-mocks --test src/shared/interactive-engine/providers/jev-provider.mock.test.ts

Os testes substituem TypeSafeClient, limpam as três variáveis de provider, usam payload sintético e restauram globals/env ao terminar. O timeout é simulado por exceção; a duração real do SDK não é medida.

## Próxima etapa

Tratar autorização, LoopGuard, validação de saída e telemetria em mudança vinculada à DEV-267 antes de habilitar credencial. Continuar somente com mocks enquanto essa for a instrução do usuário. Qualquer teste real futuro precisa de confirmação de conta/destino, limite de chamadas/tokens/gasto, política de fallback e parada; não foi autorizado nesta execução.

## Validação desta branch

- 9/9 novos mocks aprovados.
- Suíte completa com ambiente TESTE: 476/477 aprovados; falha já reproduzida na base em motor.test.ts:106 (rótulo contextual do radar).
- Astro check: mesmo erro da base em resultado/[id].astro:20, AreaFoco não exportado.
- Build aprovado. Nenhuma chamada JEV real foi executada.
