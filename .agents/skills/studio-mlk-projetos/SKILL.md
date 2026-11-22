---
name: studio-mlk-projetos
description: Inicia ou retoma trabalho em projetos da Studio MLK. Use em sessões novas do Nome Magnético para recuperar o contexto no Notion, encontrar a issue no Linear e registrar o resultado.
---

# Iniciar e retomar projetos da Studio MLK

Ao iniciar uma sessão, consulte a skill **Iniciar e retomar projetos da Studio MLK** na biblioteca **Skills da Studio MLK** do Notion. Use as instruções locais quando a biblioteca estiver indisponível.

## Quando usar

Use na primeira mensagem de trabalho de uma nova sessão da Studio MLK e ao mudar de projeto. A sessão começa pela consulta. Crie ou atualize registros quando o pedido exigir avançar o trabalho.

## 1. Encontrar o projeto e entender o ponto de partida

1. Consulte o Brain-Memo no escopo `studio-mlk` quando a conexão estiver disponível. Leia o `AGENTS.md` do vault e as instruções relevantes do repositório ou da área. Reaproveite o acesso existente.
2. Abra a base **Projetos Studio MLK**. Procure pelo nome, alias, cliente ou URL informados. Confira se o resultado é a ficha principal ou uma frente ligada pelo campo **Projeto principal**.
3. Na ficha principal, leia o objetivo, o ciclo de vida, o status, a decisão mais recente, o próximo passo e os vínculos relevantes. Abra a frente ou o briefing da demanda. Use a documentação vinculada quando ela for necessária para entender a mudança.
4. Se a busca confirmar ausência e Guilherme pedir para iniciar ou cadastrar o projeto, crie uma ficha na base principal com nome, tipo e objetivo. Se persistir dúvida entre projetos ou frentes que mudaria o destino do trabalho, faça uma única pergunta objetiva.

## 2. Encontrar a issue certa

1. Para desenvolvimento, abra o **Link Linear** da ficha principal e verifique o projeto e o time no Linear. Procure primeiro o **Link Linear** da frente ou uma issue informada. Depois pesquise no projeto por título, objetivo e termos da melhoria. Confira estado, critérios de aceite e trabalho já vinculado.
2. Reutilize uma issue ativa quando ela cobrir a mesma entrega. Se ela estiver concluída, confira o resultado e decida se o pedido é uma verificação da entrega ou uma melhoria diferente. Se houver duas issues plausíveis, apresente apenas as opções que mudam a execução.
3. Crie uma issue se a implementação estiver autorizada, a entrega for nova e o destino estiver confirmado. Use o time **Desenvolvimento** neste workspace ou o time documentado no repositório. Inclua objetivo, critérios verificáveis e o link da frente ou do briefing no Notion. Ideias e consultas ficam em preparo até haver pedido de execução. Se a criação tiver resultado incerto, pesquise antes de repetir.
4. Use as etapas técnicas do [$slate](../slate/SKILL.md) quando a demanda envolver um repositório. Parta da identificação de projeto e issue já verificada. Confira as conexões do Linear e do forge, sincronize com a base remota e reaproveite a branch, worktree e PR/MR da issue existentes. Siga as instruções do repositório para preparar e validar a entrega. Na revisão, preserve a distinção entre validar, enviar para revisão e fazer merge.

## 3. Vincular e registrar o resultado

1. Ao iniciar a execução, reaproveite a frente existente no Notion ou crie uma frente para a entrega. Preencha **Projeto principal** e **Link Linear** na frente. Na issue, vincule a página da frente ou do briefing. Preserve na ficha principal o link para o projeto do Linear.
2. Ao concluir ou interromper uma etapa de execução, atualize a própria frente no Notion com o que foi feito, a evidência ou teste, o status real e o próximo passo ou bloqueio. Use os links da issue e da entrega para referências técnicas. Atualize a issue no Linear com o andamento técnico quando couber. Altere o **Ciclo de vida** da ficha principal quando a mudança for do projeto como um todo.
3. Confira os links dos dois lados. Se uma atualização falhar, registre qual vínculo ficou pendente e confira o registro existente antes de repetir a ação. Termine a sessão com o link da ficha ou frente, o identificador da issue e o próximo passo real quando houver.
