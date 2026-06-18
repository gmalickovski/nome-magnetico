# Landing Page Hero Animations ("The Celestial Alchemist")

Documentação dos novos componentes de animação interativos e automáticos criados para as seções Hero do produto **Nome Magnético**.

## Componentes Criados

### 1. `HeroScoreAnimation`
- **Caminho:** [HeroScoreAnimation.tsx](file:///c:/Dev/nome-magnetico/src/frontend/components/landing/HeroScoreAnimation.tsx)
- **Local:** Página Principal (`src/pages/index.astro` via `HeroSection.tsx`)
- **Propósito:** Demonstrar a variação de pontuação (score 0–100) baseada no alinhamento numerológico do nome e na remoção de bloqueios.
- **Visual:** Um seletor de nomes com botões de rádio estilizados e um gráfico circular animado com SVG. Conta com auto-play (4.5s) que pausa ao clique do usuário para manter controle interativo total.

### 2. `HeroNomeSocial`
- **Caminho:** [HeroNomeSocial.tsx](file:///c:/Dev/nome-magnetico/src/frontend/components/landing/HeroNomeSocial.tsx)
- **Local:** Página do Nome Social (`src/pages/nome-social.astro`)
- **Propósito:** Mostrar visualmente o conceito de transmutação de um nome com bloqueios ("Antes") para um nome magnético livre de tensões ("Depois").
- **Visual:** Cartões lado a lado que mudam de opacidade e destaque conforme o estágio atual da transmutação (Antes -> Alquimia -> Depois).

### 3. `HeroNomeBebe`
- **Caminho:** [HeroNomeBebe.tsx](file:///c:/Dev/nome-magnetico/src/frontend/components/landing/HeroNomeBebe.tsx)
- **Local:** Página do Nome de Bebê (`src/pages/nome-bebe.astro`)
- **Propósito:** Ilustrar a escolha de um "Nome de Ouro" a partir de uma lista de candidatos compatíveis com a data de nascimento e sobrenome.
- **Visual:** Cartões empilhados em gradiente coral/dourado que se alternam com transições de realce e exibição do tier de pontuação e detalhes de bloqueio.

### 4. `HeroNomeEmpresa`
- **Caminho:** [HeroNomeEmpresa.tsx](file:///c:/Dev/nome-magnetico/src/frontend/components/landing/HeroNomeEmpresa.tsx)
- **Local:** Página do Nome Empresarial (`src/pages/nome-empresarial.astro`)
- **Propósito:** Ilustrar a compatibilidade estratégica e societária usando dimensões de numerologia corporativa.
- **Visual:** Um gráfico radar/pentágono construído inteiramente em SVG puro que contrasta a área vibracional distorcida de um nome inadequado com a área expandida e harmônica do nome sugerido.

## Diretrizes de Estilo e Performance
- **Zero Dependências de Animação:** Construído inteiramente com transições nativas do React e CSS do Tailwind.
- **Princípio NO-LINE:** Sem bordas sólidas para demarcação de seções, utilizando empilhamento de camadas de fundo, transparência e sombras suaves (`shadow-black`).
- **Ritmo Meditativo:** Transições e incrementos com duração de `800ms` a `1000ms`, garantindo ritmo calmo e fluido alinhado com a proposta celestial do produto.
