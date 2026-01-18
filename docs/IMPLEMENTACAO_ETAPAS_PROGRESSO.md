# 🚀 IMPLEMENTAÇÃO — ETAPAS PROGRESSO

**Data:** 2026-01-18  
**Status:** ✅ ETAPAS 0-3 CONCLUÍDAS | ⏳ ETAPAS 4-8 EM ANDAMENTO

---

## ✅ ETAPAS CONCLUÍDAS

### ✅ ETAPA 0 — CHECKPOINT/INVENTÁRIO
- ✅ Documento de governança criado: `docs/GOVERNANCE_EXPORT_DEALERS.md`
- ✅ Markers de blindagem adicionados nos arquivos críticos
- ✅ Inventário completo de arquivos realizado

### ✅ ETAPA 1 — NORMALIZAÇÃO MULTILÍNGUE UNIVERSAL
- ✅ `src/services/languageNormalizer.ts` reforçado:
  - `normalizeText()` melhorado (validação de tipo, colapsa espaços)
  - `uniqueNonEmpty()` criado (remove vazios, trim, deduplica)
  - `expandKeywordsByLanguage()` criado (expansão multilíngue)
- ✅ `src/services/dictionaries/coreTerms.ts` criado:
  - Dicionários B2B, B2C, E-commerce, Data Source (PT/EN/ES)
  - Funções auxiliares `expandTerm()`, `isKnownTerm()`

### ✅ ETAPA 2 — IA SEARCH PLANNER
- ✅ `src/services/aiSearchPlanner.ts` criado:
  - Interface `SearchPlan` definida
  - Função `generateSearchPlan()` implementada com GPT-4o-mini
  - Cache em memória para evitar chamadas duplicadas
  - Prompt fixo e imutável para consistência
  - Validação obrigatória: uso final + (keywords OU HS Codes)

### ✅ ETAPA 3 — GATES DETERMINÍSTICOS
- ✅ Bloqueio de datasources/directories reforçado no Edge Function:
  - `importgenius`, `panjiva`, `importkey`, `tradebase`, `trademap`
  - `sitemap`, `sitemaps`, `directory`, `directories`
- ✅ `src/services/marketplaceBlocklist.ts` atualizado:
  - `BLOCKED_DATASOURCE_SIGNALS` criado
  - `hasDataSourceSignals()` criada
  - Domínios de datasources adicionados em `BLOCKED_DOMAINS`

---

## ⏳ ETAPAS EM ANDAMENTO

### ⏳ ETAPA 4 — EDGE FUNCTION (REFORÇO SEM REGRESSÃO)
- [ ] Integrar `hasDataSourceSignals()` no filtro final
- [ ] Adicionar logs controlados `[PLAN]`, `[FILTER]`
- [ ] Garantir que bloqueios de datasources estejam ativos

### ⏳ ETAPA 5 — SCRAPING (PROTEÇÃO DE PAÍS)
- [ ] Reforçar lógica de validação de país no `dealerToCompanyFlow.ts`
- [ ] Garantir que scraping não sobrescreve país incorretamente
- [ ] Reexecutar `filterCompanyStrict` após scraping

### ⏳ ETAPA 6 — FIT SCORE (BEST-IN-CLASS)
- [ ] Ajustar pesos no `calculateFitScore()`:
  - +30 uso final validado (OBRIGATÓRIO)
  - -40 sinais de genérico sem termos específicos
  - -100 datasource/marketplace/ecommerce
- [ ] Regra: sem uso final → Fit máximo = 45 → não exibir

### ⏳ ETAPA 7 — UI/FORM (BLINDAR VALIDAÇÃO)
- [ ] Integrar `aiSearchPlanner` no `ExportDealersPage.tsx`
- [ ] Adicionar preview do plano IA (collapsible)
- [ ] Garantir botão disabled se `usageInclude.length < 1`
- [ ] Mostrar chips mustInclude/mustExclude e idiomas

### ⏳ ETAPA 8 — TESTES
- [ ] Criar `docs/EXPORT_DEALERS_TESTS.md` com 4 cenários:
  1. PILATES (HS 950691, países ES)
  2. AVIAÇÃO (HS cap. 88 + uso "aerospace manufacturing")
  3. CONSTRUÇÃO (uso "structural construction / infrastructure")
  4. AGRO (uso "livestock feed additive / feed mill / aquaculture")
- [ ] Executar testes manuais
- [ ] Validar: lint, build, fluxo completo

---

## 📋 PRÓXIMOS PASSOS IMEDIATOS

1. **Integrar `aiSearchPlanner` no `ExportDealersPage.tsx`:**
   - Chamar `generateSearchPlan()` antes do loop de países
   - Combinar `mustIncludePhrases` e `mustExcludeTerms` com keywords/uso final
   - Passar `searchPlan` para a Edge Function (opcional, para logs)

2. **Adicionar preview do plano IA no formulário:**
   - Mostrar quando plano existir (collapsible)
   - Chips para mustInclude/mustExclude
   - Idiomas por país

3. **Ajustar Fit Score:**
   - Verificar `calculateFitScore()` no Edge Function
   - Aplicar novos pesos
   - Garantir bloqueio total se Fit < 45 sem uso final

4. **Testes finais:**
   - Validar 4 cenários
   - Executar lint/build
   - Teste manual completo

---

**FIM DO DOCUMENTO DE PROGRESSO**
