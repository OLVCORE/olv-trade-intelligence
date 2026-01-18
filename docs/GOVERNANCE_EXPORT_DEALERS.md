# 🔒 GOVERNANÇA — EXPORT DEALERS (B2B) — STRATEVO GLOBAL INTELLIGENCE

**Data de Criação:** 2026-01-18  
**Última Atualização:** 2026-01-18  
**Status:** 🔒 BLOQUEADO — Alterações apenas com autorização explícita

---

## 🎯 OBJETIVO CENTRAL

O módulo "Export Dealers (B2B)" é o **CÉREBRO** do STRATEVO Global Intelligence.
Ele deve operar com precisão cirúrgica, retornando apenas dealers/distribuidores/importadores B2B reais,
baseado em:

1. **HS Code/NCM** (classificação fiscal)
2. **Keywords do produto** (identidade comercial)
3. **Contexto de Uso Final** (OBRIGATÓRIO) — define utilidade, aplicação e cadeia econômica
4. **Países-alvo** (com universalização PT/EN/nativo)
5. **Perfil B2B** (distributor/wholesaler/dealer/importer/trading/supplier/reseller/agent)
6. **Bloqueio total** de marketplaces/portais/e-commerce/bases de dados
7. **Normalização multilíngue** (antes da busca) para reduzir lixo e aumentar assertividade

---

## 🚨 REGRAS ANTI-REGRESSÃO (IMUTÁVEIS)

### ❌ NUNCA FAZER

1. **NÃO remover filtros, bloqueios, validações, normalizadores**
2. **NÃO relaxar critérios** "para aumentar volume" — Qualidade > Quantidade
3. **NÃO criar placeholders, mocks, demo content**, "em construção", "tradução pendente"
4. **NÃO inventar dados** (países, decisores, Apollo IDs, etc.) — ver memória 11150029
5. **NÃO sobrescrever país correto** por país inferido incorretamente no scraping
6. **NÃO permitir busca sem uso final** — Hard Gate obrigatório
7. **NÃO permitir marketplaces/directories/datasources** — Bloqueio total
8. **NÃO generalizar keywords** (ex: "fitness equipment" quando uso final é Pilates específico)

### ✅ SEMPRE FAZER

1. **Validar uso final obrigatório** antes de qualquer busca
2. **Normalizar multilíngue** (PT/EN/nativo) antes de buscar
3. **Bloquear datasources** (ImportGenius, Panjiva, ImportKey, Tradebase, sitemaps, directories)
4. **Proteger país original** no scraping (só aceitar se válido)
5. **Reexecutar filtros** após scraping (scrapedText incluído)
6. **Valorizar uso final** no Fit Score (+30 obrigatório)
7. **Penalizar genérico** quando não há termos específicos do uso final

---

## 📋 ARQUIVOS CRÍTICOS (BLINDADOS)

### Frontend

- **`src/pages/ExportDealersPage.tsx`**
  - Orquestra busca multi-source
  - Normaliza países e keywords ANTES de buscar
  - Valida uso final obrigatório

- **`src/components/export/DealerDiscoveryForm.tsx`**
  - Formulário de entrada
  - Campos obrigatórios: HS Code, Países, **Uso Final**
  - Validação frontend: botão disabled se `usageInclude.length < 1`

### Services

- **`src/services/countryNormalizer.ts`**
  - Universalização PT/EN/nativo
  - Variações de busca
  - Denormalização para display

- **`src/services/languageNormalizer.ts`**
  - Normalização de texto (lowercase, remove acentos)
  - Expansão multilíngue de keywords/uso final

- **`src/services/usageContextClassifier.ts`**
  - Validação de uso final obrigatório
  - Bloqueio de uso excluído

- **`src/services/marketplaceBlocklist.ts`**
  - Lista de domínios bloqueados
  - Padrões de URL bloqueados
  - Sinais de e-commerce

- **`src/services/b2bClassifier.ts`**
  - Termos B2B (incluir)
  - Termos B2C (excluir)

- **`src/services/dealerToCompanyFlow.ts`**
  - Proteção de país no scraping
  - Revalidação final após scraping

### Edge Functions

- **`supabase/functions/discover-dealers-realtime/index.ts`**
  - Função principal de busca
  - Filtro `filterCompanyStrict` (R0-R9)
  - Cálculo de Fit Score

---

## 🔄 ORDEM DO PIPELINE (IMUTÁVEL)

```
1. VALIDAÇÃO INICIAL (Frontend)
   ├─ HS Code existe?
   ├─ Países selecionados?
   └─ Uso Final obrigatório existe? → SE NÃO: ABORTAR

2. NORMALIZAÇÃO (Frontend)
   ├─ Normalizar países (PT/EN/nativo)
   ├─ Normalizar keywords (lowercase, remove acentos)
   └─ Expandir multilíngue (PT/EN/nativo)

3. SEARCH PLANNING (IA - Opcional)
   ├─ Gerar mustIncludePhrases
   ├─ Gerar mustExcludeTerms
   └─ Gerar queryTemplates por idioma

4. BUSCA (Edge Function)
   ├─ Apollo Search
   ├─ Serper Search
   └─ Google API Search

5. FILTROS DETERMINÍSTICOS (Edge Function)
   ├─ R0: Uso final obrigatório
   ├─ R1: URL parse
   ├─ R2: Bloquear marketplace/ecommerce
   ├─ R3: Bloquear datasources/directories
   ├─ R4: Normalizar fullText
   ├─ R5: Bloquear B2C
   ├─ R6: Exigir B2B
   ├─ R7: Exigir keyword do produto
   ├─ R8: Exigir uso final (include + exclude)
   └─ R9: Validar país

6. SCRAPING (Opcional)
   ├─ Extrair dados do website
   ├─ Validar país scraped (só aceitar se válido)
   └─ Reexecutar filterCompanyStrict com scrapedText

7. FIT SCORE (Edge Function)
   ├─ +20: HS compatível
   ├─ +25: Keyword específica
   ├─ +30: Uso final validado (OBRIGATÓRIO)
   ├─ +15: B2B match
   ├─ +10: País válido
   ├─ -40: Genérico sem termos específicos
   └─ -100: Datasource/marketplace/ecommerce

8. RESULTADO FINAL
   └─ Apenas empresas com Fit > 0 e todos os gates passados
```

---

## 🧪 CHECKLIST DE TESTES (OBRIGATÓRIO)

Antes de commitar, validar:

- [ ] Lint: `npm run lint` — Sem erros
- [ ] Build: `npm run build` — Sem erros
- [ ] Teste manual `/export-dealers`:
  - [ ] Botão disabled sem uso final
  - [ ] Validação erro ao tentar buscar sem uso final
  - [ ] Preview do plano IA aparece (se IA habilitada)
  - [ ] Resultados bloqueiam marketplaces
  - [ ] Resultados bloqueiam datasources
  - [ ] Resultados contêm keywords
  - [ ] Resultados contêm uso final
  - [ ] Países exibidos em português
  - [ ] Scraping não sobrescreve país incorretamente

### Cenários de Teste

1. **PILATES (HS 950691, países ES)**
   - Deve bloquear: Falabella, ImportGenius, Panjiva, "collections/fitness-equipment", sitemaps
   - Deve incluir: "equipamento pilates", "reformer", "distribuidor", "mayorista"

2. **AVIAÇÃO (HS cap. 88 + uso "aerospace manufacturing")**
   - Deve bloquear: hobby drones, retail aviation
   - Deve incluir: "aerospace component", "aviation equipment", "distributor"

3. **CONSTRUÇÃO (uso "structural construction / infrastructure")**
   - Deve bloquear: DIY, home improvement stores
   - Deve incluir: "construction equipment", "infrastructure", "distributor"

4. **AGRO (uso "livestock feed additive / feed mill / aquaculture")**
   - Deve bloquear: garden center, pet shop, retail
   - Deve incluir: "feed mill", "aquaculture", "distributor"

---

## 📝 HISTÓRICO DE ALTERAÇÕES

| Data | Versão | Alteração | Autor |
|------|--------|-----------|-------|
| 2026-01-18 | 1.0.0 | Criação do documento de governança | System |

---

## ⚠️ ALERTAS

- **Este documento é BLOQUEADO**. Alterações apenas com autorização explícita do Product Owner.
- **Qualquer alteração que toque em trecho blindado:** PARAR e apontar arquivo + linha antes de alterar.
- **Após cada alteração:** rodar lint/build e validar manualmente no `/export-dealers`.

---

**FIM DO DOCUMENTO DE GOVERNANÇA**
