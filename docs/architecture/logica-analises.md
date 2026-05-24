================================================================================
NOME MAGNETICO — LOGICAS DE ANALISE E ESTRUTURA TECNICA DOS PRODUTOS
Ultima atualizacao: 2026-03-22
================================================================================

Este documento descreve a logica de analise numerologica implementada para cada
produto do sistema, o algoritmo de score, a estrutura de dados no banco e a
organizacao dos relatorios PDF/HTML.

## TABELA DE CONVERSAO LETRA -> NUMERO (CABALISTICA)

  1 = A, I, Q, J, Y
  2 = B, K, R
  3 = C, G, L, S
  4 = D, M, T, X
  5 = E, H, N
  6 = U, V, W, C (cedilha)
  7 = O, Z
  8 = F, P

Tratamento de acentos:
  - Agudo (´)  : +2 ao valor base da letra
  - Til   (~)  : +3 ao valor base da letra
  - Grave (`)  : x3 do valor base da letra

Numeros Masters: 11 e 22 NAO sao reduzidos nos contextos que usam masters.

Modulo: src/backend/numerology/numbers.ts


## OS 5 NUMEROS PRINCIPAIS

  Expressao       : todas as letras do nome completo
  Destino         : soma dos digitos da data de nascimento
  Motivacao/Alma  : apenas as vogais do nome
  Missao          : apenas as consoantes do nome
  Impressao       : primeiro nome (ou primeira palavra) — calcularPersonalidade()

Funcao: calcularCincoNumeros(nomeCompleto, dataNascimento)
Modulo: src/backend/numerology/numbers.ts


## OS 4 TRIANGULOS NUMEROLOGICOS

Triangulo        | Modificador linha base            | Dimensao revelada
-----------------+-----------------------------------+-------------------------
Vida (basico)    | valor da letra apenas             | Aspectos gerais de vida
Pessoal          | letra + dia de nasc. (reduzido)   | Vida intima, reacoes
Social           | letra + mes de nasc. (reduzido)   | Percepcao externa
Destino          | letra + (dia+mes reduzidos)        | Resultados, missao

Cada triangulo inclui: arcanoRegente, sequencias, bloqueios detectados.
Funcao: calcularTodosTriangulos(nomeCompleto, dataNascimento)
Modulo: src/backend/numerology/triangle.ts

Bloqueios sao detectados em TODOS os 4 triangulos e consolidados.
Funcao: detectarBloqueios(todosTriangulos)


## BLOQUEIOS ENERGETICOS (sequencia de 3+ iguais em qualquer triangulo)

  111 = Iniciacao          — identidade, novos comecos
  222 = Associacao         — relacionamentos, parcerias
  333 = Expressao          — comunicacao, criatividade
  444 = Estruturacao       — organizacao, burocracia, saude fisica
  555 = Liberdade          — mudancas, adaptacao
  666 = Harmonia           — familia, responsabilidade
  777 = Conexao Espiritual — fe, isolamento, praticidade
  888 = Poder e Abundancia — financas, poder, materialismo
  999 = Compaixao Universal— fechamento de ciclos, limites

Cada bloqueio contem: codigo, titulo, descricao, aspectoSaude, triangulos[]


## PADROES KARMICOS

Licoes Karmicas   : numeros 1-8 AUSENTES no nome -> qualidades a desenvolver
                    Funcao: detectarLicoesCarmicas(nomeCompleto)

Tendencias Ocultas: numero que aparece 4+ vezes no nome -> excesso da qualidade
                    Funcao: detectarTendenciasOcultas(nomeCompleto)

Mapa de Frequencias: contagem de cada numero (1-8) no nome
                    Funcao: mapearFrequencias(nomeCompleto)

Debitos Karmicos  : calculados de data de nasc. + Destino + Motivacao + Expressao
                    Numeros especiais antes da reducao: 13, 14, 16, 19
                    Funcao: calcularDebitosCarmicos(dataNasc, destino, motivacao, expressao)

Modulo: src/backend/numerology/karmic.ts


## ALGORITMO DE SCORE (0-100) — COMUM A TODOS OS PRODUTOS

  score = 100
    - (nBloqueios        x 15)
    - (nDebitosCarmicos  x 12)
    - (nTendenciasOcultas x 2)
    - (nLicoesCarmicas    x 1)
    - penalidade_compatibilidade

  Penalidade de compatibilidade Expressão × Destino:
    favoravel    (total/complementar) -> 0 pts
    neutro       (diferença de 1)     -> 5 pts
    desfavoravel (tensão vibracional) -> 15 pts

  Modulo: src/backend/numerology/score.ts
  Funcao: calcularScore({ bloqueios, licoesCarmicas, tendenciasOcultas, debitosCarmicos, compatibilidade })

  Compatibilidade:
    Modulo: src/backend/numerology/harmonization.ts
    Funcao: avaliarCompatibilidade(expressao, destino)


## 1. PRODUTO: NOME SOCIAL (nome_magnetico)

DESCRICAO
  Analisa o nome completo de nascimento do usuario, detecta bloqueios e padroes
  karmicos, e sugere variacoes do nome numerologicamente favoraveis.

INPUTS
  nome_completo    : string (nome de nascimento)
  data_nascimento  : string DD/MM/AAAA

PROCESSAMENTO
  1. calcularTodosTriangulos() -> 4 triangulos
  2. detectarBloqueios() -> bloqueios de todos os 4 triangulos
  3. calcularCincoNumeros() -> Expressao, Destino, Motivacao, Missao, Impressao
  4. detectarLicoesCarmicas() + detectarTendenciasOcultas() + mapearFrequencias()
  5. calcularDebitosCarmicos()
  6. avaliarCompatibilidade() + calcularScore()
  7. generateAnalysis() -> texto IA (LoopGuard, max 3 tentativas)
  8. gerarNomesMagneticos() -> candidatos sem bloqueios, compatibilidade total/complementar
  9. generateSuggestions() -> IA ranqueia sugestoes
  10. saveMagneticNames() -> salva no banco

SUGESTOES DE NOMES
  Criterios: sem bloqueios (ou menos que o original), compatibilidade
  total/complementar Expressao x Destino, criterios grafoscopicos formais
  (legibilidade, inclinacao ascendente, sem tracos cortantes).
  Modulo: src/backend/numerology/suggestions.ts

ESTRUTURA NO BANCO (tabela analyses)
  numero_expressao   : number
  numero_destino     : number
  numero_motivacao   : number
  numero_missao      : number
  numero_personalidade: number
  arcano_regente     : number
  bloqueios          : Bloqueio[]
  triangulo_vida     : TrianguloResult
  triangulo_pessoal  : TrianguloResult
  triangulo_social   : TrianguloResult
  triangulo_destino  : TrianguloResult
  licoes_carmicas    : LicaoKarmica[]
  tendencias_ocultas : TendenciaOculta[]
  debitos_carmicos   : DebitoKarmico[]
  frequencias_numeros: Record<number, number>   <- mapa direto { "1": 3, "2": 1, ... }
  score              : number
  analise_texto      : string (gerado por IA)

  Tabela magnetic_names (sugestoes):
    nome_sugerido, numero_expressao, motivacao, missao, tem_bloqueio, score, justificativa

ARQUIVOS RELEVANTES
  src/backend/numerology/numbers.ts
  src/backend/numerology/triangle.ts
  src/backend/numerology/karmic.ts
  src/backend/numerology/score.ts
  src/backend/numerology/harmonization.ts
  src/backend/numerology/suggestions.ts
  src/backend/ai/brain.ts          -> generateAnalysis, generateSuggestions, generateGuide
  src/backend/ai/prompts/          -> prompts por produto
  src/pages/api/analyze.ts         -> endpoint principal

RELATORIO PDF/HTML — ORDEM DAS SECOES

  Cabecalho    : nome analisado, score geral, 5 numeros principais
  Triangulos   : TriangleVisualization (4 abas: Vida, Pessoal, Social, Destino)
                 Bloqueios expansiveis com aspectoSaude
  Licoes Karmicas  : KarmicLessons — cards por numero ausente
  Tendencias Ocultas: HiddenTendencies — barra de frequencias 1-8
  Debitos Karmicos : KarmicDebts — cards por numero especial
  Frequencias  : mapa visual dos numeros no nome
  Compatibilidade: SignatureEvaluation — criterios objetivos da assinatura
  Nomes Sugeridos: lista com scores e justificativas
  Analise IA   : texto completo gerado pela IA


## 2. PRODUTO: NOME DE BEBE (nome_bebe)

DESCRICAO
  Analisa nomes candidatos para um bebe combinados com os sobrenomes da familia.
  Rankeia por score e aponta o melhor nome para a data de nascimento do bebe.

INPUTS
  nome_completo          : string (placeholder auth, ex: "(bebe) Silva")
  data_nascimento        : string DD/MM/AAAA (data do bebe)
  nomes_candidatos       : string[] (apenas primeiros nomes)
  sobrenome_familia      : string (legacy fallback)
  nome_pai/sobrenome_pai : string (opcional)
  nome_mae/sobrenome_mae : string (opcional)
  ignorar_pai/ignorar_mae: boolean (opcional)
  outros_sobrenomes      : string[] (opcional)
  genero_preferido       : string (masculino / feminino / neutro)
  estilo_preferido       : string (opcional)
  caracteristicas_desejadas: string max 300 (opcional)

LOGICA DE COMBINACOES DE SOBRENOME
  sobrenomesValidos = [
    ...outros_sobrenomes,
    sobrenome_mae (se !ignorar_mae),
    sobrenome_pai (se !ignorar_pai),
    sobrenome_familia (fallback)
  ]

  Para cada candidato, gera TODOS os subsets nao-vazios dos sobrenomesValidos.
  Ex: ["Silva", "Mendes"] -> "Nome Silva", "Nome Mendes", "Nome Silva Mendes"
  A combinacao com maior score representa aquele candidato no ranking.

SUGESTOES AUTOMATICAS (origemSugerida: 'ia')
  Threshold : melhorScore < 70
  Pool      : nomes pre-definidos por genero
  Algoritmo : score >= 70, ordenados por score desc
  Campo     : origemSugerida = 'usuario' | 'ia'

DESTINO DO BEBE
  Unico por data de nascimento. Nao varia entre candidatos.
  Usado para calcular compatibilidade Expressao x Destino de cada combinacao.

ESTRUTURA NO BANCO (tabela analyses)
  frequencias_numeros: {
    ranking: {
      destino    : number,
      melhorNome : AnaliseNomeBebe,
      ranking    : AnaliseNomeBebe[]
    }
  }
  <- ATENCAO: dados do bebe ficam dentro de .ranking (com wrapper)
  <- Diferente do nome_empresa que nao tem wrapper

  numero_expressao   : melhorNome.expressao
  numero_destino     : destino do bebe
  numero_motivacao   : melhorNome.motivacao
  numero_missao      : melhorNome.missao
  numero_personalidade: calcularCincoNumeros(melhorNome.nomeCompleto).personalidade
  bloqueios          : melhorNome.bloqueios
  triangulo_vida/pessoal/social/destino: calculados para o melhor nome
  licoes_carmicas    : melhorNome.licoesCarmicas
  tendencias_ocultas : melhorNome.tendenciasOcultas
  debitos_carmicos   : melhorNome.debitosCarmicos
  score              : melhorNome.score
  analise_texto      : string (gerado por IA)

INTERFACE AnaliseNomeBebe (cada item do ranking)
  nomeCompleto    : string  (nome + sobrenome)
  nomeBase        : string  (apenas o primeiro nome)
  sobrenome       : string
  expressao       : number
  motivacao       : number
  missao          : number
  impressao       : number  (calcularPersonalidade — primeiro nome)
  bloqueios       : Bloqueio[]
  licoesCarmicas  : LicaoKarmica[]
  tendenciasOcultas: TendenciaOculta[]
  debitosCarmicos : DebitoKarmico[]
  compatibilidade : string  (favoravel | neutro | desfavoravel)
  score           : number
  origemSugerida  : 'usuario' | 'ia'
  justificativa   : string[]

ARQUIVOS RELEVANTES
  src/backend/numerology/products/nome-bebe.ts
  src/backend/ai/prompts/baby-prompt.ts
  src/backend/ai/brain.ts          -> generateBabyAnalysis(params, userId, analysisId)
  src/frontend/components/app/BabyNameForm.tsx
  src/pages/app/resultado/[id].astro

RELATORIO PDF/HTML — ORDEM DAS SECOES

  Cabecalho    : nome escolhido, Score, Destino do Bebe (card separado),
                 4 numeros secundarios (Expressao, Motivacao, Missao, Impressao)
  Ranking      : tabela com todos os candidatos + sugestoes IA (badge "SUGESTAO")
                 score, 4 numeros, compatibilidade, bloqueios
  Triangulos   : 4 triangulos do melhor nome
  Licoes Karmicas + Debitos Karmicos do melhor nome
  Analise IA   : texto completo


## 3. PRODUTO: NOME DE EMPRESA (nome_empresa)

DESCRICAO
  Analisa nomes candidatos para uma empresa cruzando com a numerologia do socio
  principal (e opcional 2o socio). Sugestao automatica quando melhor score < 80.

INPUTS
  nome_completo          : string (nome do socio principal)
  data_nascimento        : string DD/MM/AAAA (socio principal)
  nomes_candidatos       : string[] (nomes candidatos da empresa)
  data_fundacao          : string DD/MM/AAAA (opcional)
  ramo_atividade         : string (opcional)
  descricao_negocio      : string (opcional)
  nome_socio2            : string (opcional, max 2 socios)
  data_nascimento_socio2 : string DD/MM/AAAA (opcional)

OS DOIS DESTINOS
  destinoSocio   = calcularDestino(dataNascimentoSocio)
  destinoEmpresa = calcularDestino(dataFundacao)  <- apenas se fornecida
  destinoSocio2  = calcularDestino(dataNascSocio2) <- apenas se fornecido

  ATENCAO: destinoSocio2 e usado apenas para analise verbal e exibicao no PDF.
  Nao afeta o calculo de score nem a compatibilidade dos candidatos.

OS 5 NUMEROS DA EMPRESA (para cada candidato)
  Expressao   : todas as letras do nome da empresa
  Motivacao   : apenas vogais
  Missao      : apenas consoantes
  Impressao   : PRIMEIRA PALAVRA do nome (calcularPersonalidade(nomeEmpresa))
  Compat Socio: avaliarCompatibilidade(expressao, destinoSocio)
  Compat Empresa: avaliarCompatibilidade(expressao, destinoEmpresa)  <- se aplicavel

ALGORITMO DE SCORE DA EMPRESA
  score = 100
    - (nBloqueios        x 15)
    - (nDebitosCarmicos  x 12)
    - (nTendenciasOcultas x 2)
    - (nLicoesCarmicas    x 1)
    - penalidade_compat_socio
    - penalidade_compat_empresa / 2   <- penalidade secundaria (impacto reduzido)

  Penalidade extra: Tendencia Oculta do numero 8 (materialismo) = +5 pts

SUGESTOES AUTOMATICAS (origemSugerida: 'ia')
  Threshold  : melhorScoreUsuario < 80
  Pool       : 64 nomes empresariais brandaveis (NOMES_EMPRESA_POOL)
  Algoritmo  : 2 passes
    1a passagem: score >= 80 + compatibilidade total/complementar com destinoSocio
    2a passagem (fallback): score >= 75 (sem restricao de compatibilidade)
  Campo      : origemSugerida = 'usuario' | 'ia'

ESTRUTURA NO BANCO (tabela analyses)
  frequencias_numeros: {  <- dados DIRETO, sem wrapper .ranking
    nomeSocioPrincipal   : string,
    dataNascimentoSocio  : string,
    destinoSocio         : number,
    destinoEmpresa       : number | null,
    nomeSocio2           : string | undefined,
    dataNascimentoSocio2 : string | undefined,
    destinoSocio2        : number | undefined,
    nomesCandidatos      : AnaliseNomeEmpresa[],
    melhorNome           : AnaliseNomeEmpresa | null
  }
  <- ATENCAO: NAO tem wrapper .ranking — diferente do nome_bebe

  numero_destino      : destinoSocio
  numero_personalidade: melhorNome.impressao
  score               : melhorNome.score
  analise_texto       : string (gerado por IA)

  NOTA: triangulo_vida/pessoal/social/destino sao salvos se disponiveis
  (calculados para o melhorNome quando presente).

INTERFACE AnaliseNomeEmpresa (cada item do ranking / nomesCandidatos)
  nomeEmpresa           : string
  expressao             : number
  motivacao             : number
  missao                : number
  impressao             : number  (primeira palavra — calcularPersonalidade)
  compatibilidadeSocio  : string  (favoravel | neutro | desfavoravel)
  compatibilidadeEmpresa: string | undefined  (so se data_fundacao presente)
  bloqueios             : Bloqueio[]
  temBloqueio           : boolean
  licoesCarmicas        : LicaoKarmica[]
  tendenciasOcultas     : TendenciaOculta[]
  debitosCarmicos       : DebitoKarmico[]
  score                 : number
  origemSugerida        : 'usuario' | 'ia'
  justificativa         : string[]

INTERFACE ResultadoNomeEmpresa
  nomeSocioPrincipal    : string
  dataNascimentoSocio   : string
  dataFundacao          : string | null
  destinoSocio          : number
  destinoEmpresa        : number | null
  nomeSocio2            : string | undefined
  dataNascimentoSocio2  : string | undefined
  destinoSocio2         : number | undefined
  nomesCandidatos       : AnaliseNomeEmpresa[]
  melhorNome            : AnaliseNomeEmpresa | null

ARQUIVOS RELEVANTES
  src/backend/numerology/products/nome-empresa.ts
  src/backend/ai/prompts/company-prompt.ts
  src/backend/ai/brain.ts          -> generateCompanyAnalysis(params, userId, analysisId)
  src/frontend/components/app/CompanyNameForm.tsx  (suporta ate 2 socios)
  src/pages/app/resultado/[id].astro

RELATORIO PDF/HTML — ORDEM DAS SECOES

  Cabecalho    : nome da empresa, Score, Destino do Socio (card),
                 Destino do 2o Socio (card separado, se presente),
                 Destino da Empresa (card separado, se data_fundacao presente),
                 4 numeros: Expressao, Motivacao, Missao, Impressao
  Socios       : "Perfil dos Socios & Destinos" — cards com cada destino
  Karma        : "Karma Empresarial" — Debitos Karmicos e Licoes Karmicas
                 baseados no melhorNome (afetam a energia da empresa)
  Ranking      : todos os candidatos + sugestoes IA (badge "SUGESTAO IA")
                 score, 4 numeros, compatibilidade(s), bloqueios
  Triangulos   : 4 triangulos do melhor nome (pagina separada no PDF)
  Analise IA   : texto completo (9 secoes: Magnetismo, Sinergia, Impressao da
                 Marca, Fluxo de Caixa, Mapeamento de Riscos, Identidade Visual,
                 Calendario de Ativacao, Direcionamento Estrategico, Proximos Passos)


## COMO DISTINGUIR O PRODUTO NO BANCO (FRONTEND)

  analysis.product_type === 'nome_magnetico'
    frequencias_numeros = Record<number, number>  (mapa letra->frequencia)
    -> verificar: !freqData?.ranking && !freqData?.nomesCandidatos

  analysis.product_type === 'nome_bebe'
    frequencias_numeros = { ranking: ResultadoNomeBebe }
    -> acessar como: freqData?.ranking  (com wrapper)

  analysis.product_type === 'nome_empresa'
    frequencias_numeros = ResultadoNomeEmpresa  (sem wrapper)
    -> acessar como: freqData?.nomesCandidatos, freqData?.melhorNome
    -> verificar: freqData?.nomesCandidatos != null


## BANCO DE DADOS — ESTRUTURA COMPLETA (tabela analyses)

  id                   : uuid (PK)
  user_id              : uuid (FK auth.users)
  product_type         : 'nome_magnetico' | 'nome_bebe' | 'nome_empresa'
  status               : 'pending' | 'processing' | 'complete' | 'error'
  nome_completo        : string  (nome do usuario/socio principal/placeholder bebe)
  data_nascimento      : string  (data do usuario/bebe/socio)
  created_at           : timestamptz
  completed_at         : timestamptz
  error_message        : string

  -- Numeros calculados (salvos individualmente para queries rapidas)
  numero_expressao     : integer
  numero_destino       : integer
  numero_motivacao     : integer
  numero_missao        : integer
  numero_personalidade : integer  (impressao para empresa/bebe, personalidade para social)
  arcano_regente       : integer  (apenas nome_magnetico)
  score                : integer

  -- Dados estruturados (JSONB)
  frequencias_numeros  : jsonb  (estrutura difere por produto — ver acima)
  bloqueios            : jsonb[]
  triangulo_vida       : jsonb
  triangulo_pessoal    : jsonb
  triangulo_social     : jsonb
  triangulo_destino    : jsonb
  licoes_carmicas      : jsonb[]
  tendencias_ocultas   : jsonb[]
  debitos_carmicos     : jsonb[]

  -- Campos de harmonizacao (apenas nome_magnetico)
  nome_harmonizado     : string
  expressao_harmonizada: integer

  -- Texto da analise
  analise_texto        : text  (markdown gerado pela IA)

  -- Tabela magnetic_names (apenas nome_magnetico)
  analysis_id, user_id, nome_sugerido, numero_expressao,
  motivacao, missao, tem_bloqueio, score, justificativa


## BANCO DE DADOS — OUTRAS TABELAS RELEVANTES

  profiles
    id, email, nome_completo, gender, role ('user' | 'admin')

  subscriptions
    id, user_id, product_type, stripe_session_id
    starts_at, ends_at, is_active (computed)
    metadata JSONB (dados extras do produto)

  ai_config
    provider, model, temperature, max_tokens (editavel em /admin/ia)

  ai_usage
    user_id, analysis_id, tokens_used, provider, created_at
    (LoopGuard: max 50k tokens por sessao de usuario)

  support_tickets + support_messages
    tickets: id, user_id, assunto, status, created_at
    messages: id, ticket_id, author_type, conteudo, created_at

  faq_categories + faq_items
    FAQ editavel pelo admin em /admin/faq


## FLUXO GERAL DE PROCESSAMENTO (todos os produtos)

  1. POST /api/analyze { product_type, nome_completo, data_nascimento, ...campos }
  2. Verificar autenticacao (JWT) + subscription ativa para o product_type
  3. createAnalysis() -> status: "pending" -> retorna { analysisId } imediatamente
  4. Background task (nao bloqueia resposta):
     a. updateAnalysis() -> status: "processing"
     b. Calculos numerologicos especificos do produto
     c. updateAnalysis() -> salvar todos os dados calculados
     d. generateXxxAnalysis() -> texto IA via LoopGuard (max 3 tentativas)
     e. updateAnalysis() -> analise_texto, status: "complete"
  5. Frontend faz polling (GET /api/analyses/:id) ate status === "complete"
  6. Exibe relatorio HTML + botao de download PDF

  Em caso de erro:
     updateAnalysis({ status: 'error', error_message: mensagem })


## REGRAS DE TERMINOLOGIA (IMPORTANTE)

  - Sempre usar "Karmico/Karmica" com acento: Debitos Karmicos, Licoes Karmicas
  - Sempre iniciar expressoes numerologicas com letra maiuscula:
      Expressao, Destino, Motivacao, Missao, Impressao, Personalidade,
      Debitos Karmicos, Licoes Karmicas, Tendencias Ocultas, Arcano Regente
  - NUNCA mencionar radiestesia, pendulo ou tecnicas radiestesicas
  - NUNCA usar apenas letras maiusculas em titulos — sempre usar Headers (##)
  - A analise SEMPRE usa os 4 triangulos (nao so o Triangulo da Vida)

================================================================================

