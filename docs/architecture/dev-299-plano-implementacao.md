# DEV-299 — plano revisado de implementação

Revisado em 15/11/2026 a partir da issue e do plano do Antigravity, com autorização direta de Guilherme neste chat para implementar. A descrição antiga da issue ainda contém o bloqueio documental anterior. Não autoriza produção.

## Decisões confirmadas por Guilherme

- Preservar o conteúdo existente do PDF, acrescentar Mapa Vibracional e completar o índice. Mover somente as leituras completas de Pessoal, Social e Destino para os anexos; Vida continua principal.
- Cinco nomes manuais únicos por sessão de chat, separados das nove sugestões automáticas. Inválidos, duplicatas e falhas não consomem avaliação concluída.
- Essência, Harmonização, Nome Harmonizado e Anexos começam sempre em página nova, mesmo com espaço anterior. Regra permanente registrada em `AGENTS.md`.
- Mapa do PDF usa a mesma paleta dinâmica por score do HTML, harmonizado sempre por cima e preenchimento quase transparente (4%). Nascimento: linha pontilhada fina a 55% de opacidade e quadrados; assinatura: linha contínua forte e círculos. A cor nunca é forçada por papel: um manual de nota inferior continua com sua faixa real. Folga moderada acima/abaixo do SVG e dos rótulos, sem espaços excessivos.
- Continuar o PR #148 em draft. Sem migration, merge, tag, deploy ou IA paga.

## Auditoria e ajustes ao plano original

- Base conferida com `git fetch origin`: `origin/main` em `83ac304`, worktree em `c3b5b90`, apenas o commit vazio de abertura do PR. Nenhuma implementação anterior neste worktree.
- A branch original está vinculada ao worktree do Antigravity. O worktree atual usa `linear/dev-299-implementacao-codex`, continuando o mesmo PR remoto.
- A DEV-283 já substituiu `NomeSocialResultado.astro` pelo painel compartilhado em `/app/resultado/[id]`. Integração feita em `ChatSidebarSection`, nos painéis serializados do servidor e nos slides reais de `AppDashboard`.
- O glossário existente já oferece overlay global. Foi reaproveitado nos rótulos SVG e complementado por `GlossaryInlineTerm`, sem duplicar entradas existentes de Expressão ou triângulos.
- A cota não pode confiar em `manuaisJaAvaliados` enviado pelo cliente. A implementação usa sessões opacas mantidas no servidor, com contexto imutável, resultados e contagem próprios. Sessão desconhecida/expirada falha fechada; não é recriada silenciosamente.
- Sem persistência de quota nova: sessões duram até 24 h, ficam no worker emissor e deixam de avaliar se ele reiniciar ou se o pedido chegar a outro worker. Resultados locais/salvos continuam disponíveis. Persistência distribuída requer escopo de infraestrutura/dados separado.
- Novo helper de contexto preserva a ordem dos canais de uso e evita usar, num slide antigo sem contexto, o contexto de outra análise destacada.
- Exportação manual precisa aceitar nota inferior: o filtro de melhoria automática permanece para gerados e não elimina um manual escolhido.

## Fases implementadas

### B — Arquétipo

Card resumido com essência, duas qualidades e um ponto de atenção do catálogo existente. Dados resolvidos no servidor; React não importa o catálogo backend. Comparação de permanência com nascimento, troca acompanhando o painel/slide e ausência de valor inventado quando não há Expressão disponível.

### C — Glossário

Entradas canônicas para arquétipo, Mapa e cinco eixos. Prévia por hover/foco e clique/toque; link completo, Escape, clique fora, foco e posicionamento com limites de viewport. Corrigido conflito entre `position: relative` de `.nm-floating-card` e o posicionamento dos popovers. Deltas do Mapa expressos em pontos de índice.

### A — PDF

Mapa comparativo sob o mesmo contexto salvo, tabela de índices/deltas e ressalvas. Snapshot e versão do Mapa persistidos no JSON existente; snapshot só é reutilizado para os mesmos nomes e versão. Fallback geral explícito sem contexto. Índice em quatro níveis com destinos reais; Conclusão e ranking condicionais. Capítulos em `<Page>` próprios. Pirâmides, descrições, arcanos e bloqueios complementares preservados nos anexos. Arquétipo resumido também nas informações principais, mantendo anexo detalhado.

### D — Avaliar este nome

Campo opcional e contador separado junto às sugestões. API com sessão, acesso ativo, validação Zod, origem, limites de payload e titularidade quando há análise salva. Mesmo painel determinístico v3, sem LLM, inclusive nota inferior. Dedupe mantém resultado/proveniência existente. Comparação por nota com empate gerado antes de manual; exportação mantém a ordem cumulativa dos nomes vistos. Cota/resultado no servidor sem `await` entre consulta, cálculo e contabilização. Sincronização entre abas do mesmo chat por evento de storage, sem polling. Proveniência no chat, HTML, dashboard e PDF.

## Verificação e entrega

- Suíte completa: `npm test`; tipos: `npx astro check`; produção: `npm run build`.
- Testes novos: validação, duplicata/falha sem consumo, concorrência, acesso/titularidade, expiração, salvamento de manual com nota inferior, proveniência, contexto/snapshot e capítulos em páginas novas.
- Fixtures locais fictícias: PDF contextual e PDF legado com nome longo/acentos. Conferir destinos, fontes, sumário, corte de rótulos e ordem dos triângulos.
- Navegador real: card do dashboard, permanência, foco/link/Escape e viewport de 390 px; sem overflow horizontal na fixture.
- Pendentes para aceite de produto: revisão editorial/copy de Chico e smoke autenticado em TESTE do fluxo completo. Nenhum cliente real, banco de produção ou chamada de IA foi usado na validação local.
- Rollback: reverter os commits desta DEV-299; não há migration ou alteração de infraestrutura.

## Evidências de validação local

- `npm test`: 623 testes aprovados, zero falhas.
- Confirmação após os últimos ajustes: 15 testes focados de API, sessão manual, contexto e PDF aprovados.
- `npx astro check`: zero erros e zero warnings (hints legados).
- `npm run build`: concluído. A execução final usou permissões de leitura fora do sandbox, após EPERM local na varredura do Tailwind.
- Detector Impeccable: nenhum apontamento.
- Poppler/pypdf instalados somente em pasta temporária do worktree. Chave fictícia de Stripe somente no processo dos testes para atender importação de mocks; nenhum pagamento real.
- PDFs renderizados/inspecionados: manual inferior (42 contra 73), sugestão real do motor (94 contra 73) e nome longo/acentuado sem contexto. Sem corte superior no Mapa; camada selecionada por cima, preenchimentos a 4% e capítulo novo em página nova.
- Navegador real: prévia com dados fictícios, foco no link do glossário e Escape com retorno ao termo; viewport de 390 × 844, popover dentro da tela e sem overflow horizontal.

## Ajustes finais solicitados durante a revisão

- Tabela abaixo do Mapa: ganho verde com `+`, perda vermelha com `-`, igualdade dourada sem sinal. A cor acompanha a diferença, sem mudar os valores calculados.
- Folha de continuação do sumário aceita 26 entradas, enquanto a primeira mantém 22. O índice completo de 45 entradas cabe em duas páginas; teste real evita terceira folha com uma linha.
- PDF completo fictício entregue para revisão: 59 páginas, três opções reais do motor em sessão de exemplo, assinatura Alêxandra (94) contra nascimento Alexandra Mendes Vale (73), conclusão fictícia e anexos completos. 47 destinos nomeados e 45 links internos, sem destino ausente. Arquivo de revisão em `output/pdf/DEV-299-analise-ficticia-completa.pdf`, fora do código versionado.
