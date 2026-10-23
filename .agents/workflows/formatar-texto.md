> **Agentes:** leia primeiro [`AGENTS.md`](../../AGENTS.md) na raiz do repositório.


# Skill: /formatar-texto

Documentação dos padrões de formatação adotados para os textos gerados por IA no projeto Nome Magnético.

---

## Padrões de Referência

Baseados em Word / Google Docs / WCAG:

| Elemento     | HTML (Tailwind prose)                                          | PDF (react-pdf)                        |
|--------------|---------------------------------------------------------------|----------------------------------------|
| H1 `#`       | font-cinzel, text-2xl, text-[#D4AF37], mt-10 mb-4            | 20px, gold, mt=20 mb=10               |
| H2 `##`      | font-cinzel, text-xl, text-[#D4AF37], mt-10 mb-4             | 15px, gold, mt=14 mb=7                |
| H3 `###`     | font-cinzel, text-lg, text-purple-400, mt-7 mb-3             | 12px, purple #a78bfa, mt=10 mb=5      |
| H4 `####`    | font-inter, text-base, text-amber-400, mt-5 mb-2             | 10px, amber #F59E0B, mt=6 mb=3        |
| Parágrafo    | text-gray-300, leading-relaxed, mb-5                         | 10px, lineHeight 1.75, mb=8           |
| Item de lista| text-gray-300, leading-relaxed, mb-2                         | 9px, marginBottom=5                   |
| Emoticons H2 | Permitido (nativo)                                           | Removidos — regex emoji antes de render|

---

## Checklist de Formatação para Prompts de IA

- [ ] Usar `#` apenas para o título principal do documento
- [ ] Usar `## ✨ N. Título` para cada seção principal (com emoticon)
- [ ] Usar `### Subtítulo` para subseções
- [ ] NUNCA usar texto TODO MAIÚSCULO como heading
- [ ] Linha em branco antes e depois de cada heading
- [ ] Linha em branco entre todos os parágrafos consecutivos
- [ ] Parágrafos com no máximo 4 linhas
- [ ] Segunda pessoa em todo o texto: "você", "seu", "sua", "teu", "tua"
- [ ] Nome próprio do usuário pelo menos uma vez por seção
- [ ] Negrito `**` em conceitos-chave, números e insights

---

## Exemplo de Saída Correta

```markdown
# Análise Numerológica de Maria Silva

## ✨ 1. Perfil Energético Geral

Maria, seu nome carrega uma vibração extraordinária de **Expressão 6**, que revela...

A combinação do seu **Destino 3** com a Expressão cria uma harmonia rara que...

## 🔮 2. Os 5 Números — Sua Identidade Numerológica

### Expressão (6)

O número **6** representa amor, responsabilidade e beleza. Para você, Maria, isso se manifesta...

### Destino (3)

Seu **Destino 3** é o número da comunicação criativa e da alegria de viver...
```

---

## Como Verificar a Formatação

1. Abrir `/app/resultado/[id]` — confirmar hierarquia visual:
   - H1: dourado, Cinzel, grande
   - H2: dourado, Cinzel, menor
   - H3: roxo (#c084fc), Cinzel
   - H4: âmbar, Inter
   - Parágrafos com respiro (mb-5)

2. Baixar PDF — confirmar:
   - Página dos 4 Triângulos (grade 2×2 com pirâmides)
   - Gráfico de frequências (barras horizontais douradas)
   - Hierarquia de tamanhos: H1=20px, H2=15px, H3=12px, H4=10px
   - Sem emoticons no corpo do PDF
   - Seção de Conclusão em card com borda dourada
   - Folha de treino de assinatura como **última página**: nome em letra de forma, instruções técnicas (sem cruzar traços, inclinação ascendente, etc.) e 14 linhas de caderno

3. Confirmar segunda pessoa: "você", "seu", "sua" no texto gerado

4. Confirmar seção `## 🌟 6. Conclusão` com apanhado geral

---

## Arquivos do Projeto Envolvidos

| Arquivo | Papel |
|---------|-------|
| `src/utils/textFormatter.ts` | Normalização robusta do Markdown pós-IA |
| `src/backend/ai/prompts/system-kabbalistic.ts` | Diretrizes globais de formato + tom |
| `src/backend/ai/prompts/analysis-prompt.ts` | Prompt análise pessoal + seção conclusão |
| `src/backend/ai/prompts/suggestions-prompt.ts` | Regras de formatação para sugestões |
| `src/backend/ai/prompts/guide-prompt.ts` | Regras de formatação para guia |
| `src/pages/app/resultado/[id].astro` | Classes Tailwind prose para HTML |
| `src/frontend/components/pdf/AnalysePDF.tsx` | Estilos PDF + TriangulosPDF + FrequencyChart + Conclusão |
| `src/pages/api/generate-pdf.ts` | Endpoint que passa dados para o PDF |
