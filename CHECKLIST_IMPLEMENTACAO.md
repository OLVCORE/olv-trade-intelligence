# ✅ CHECKLIST - O QUE ESTÁ IMPLEMENTADO vs O QUE FALTA

## ✅ IMPLEMENTADO (Sala Global de Alvos)

### Inteligência B2B
- [x] Busca Apollo.io com keywords customizadas
- [x] Busca Serper (30 portais B2B)
- [x] Busca Google API (fallback)
- [x] Filtros por tipos B2B (distributor, dealer, importer, wholesaler)
- [x] Exclusão de tipos B2C (gym, studio, school)
- [x] Busca por cargos (Procurement Manager, etc.)
- [x] Filtro de volume mínimo
- [x] Bloqueio de Facebook/Instagram/marketplaces
- [x] Normalização de nomes e domínios
- [x] Fit Score calculado
- [x] Seleção múltipla de empresas
- [x] Botão "Transferir para Base"

### Motor Trade
- [x] Busca em portais de trade data (ImportGenius, Panjiva, Volza, ImportKey, Eximpedia)
- [x] Busca por HS Codes
- [x] Filtros por países
- [x] Keywords customizadas
- [x] Identificação de importadores reais
- [x] Extração de nomes de empresas de dados de trade

### Transferência para Base
- [x] global_companies → companies
- [x] companies → icp_analysis_results (Quarentena)
- [x] Verificação de duplicatas
- [x] Feedback visual do progresso
- [x] Navegação para Quarentena ICP

### Produtos Genéricos
- [x] Campos vazios por padrão (sem hardcode Pilates)
- [x] Placeholders genéricos
- [x] Aceita qualquer produto/keyword

---

## ❌ FALTA IMPLEMENTAR

### 1. Enriquecimento Automático (CRÍTICO)
- [ ] Conectar `enrich-receita-federal` para empresas brasileiras
- [ ] Conectar `enrich-apollo-decisores` para empresas internacionais
- [ ] Iniciar enriquecimento automaticamente após transferência

**Arquivo:** `src/services/globalToCompanyFlow.ts` (linhas 277-282)
**Status:** TODO comentado

### 2. Panjiva Integration (FUTURO)
- [ ] Integração real com API Panjiva (quando disponível)
- [ ] Busca de dados históricos de importação
- [ ] Tracking de concorrentes
- [ ] Alertas de novos importadores

**Status:** Apenas busca via Serper (site:panjiva.com)

### 3. Limpeza de Registros (OPCIONAL)
- [ ] Botão para limpar registros antigos antes de nova busca
- [ ] Opção de manter histórico vs limpar tudo

**Arquivo:** `src/pages/GlobalTargetsPage.tsx` (linha 88 - comentado)

### 4. Melhorias de UX
- [ ] Botão "Selecionar todas" / "Desselecionar todas"
- [ ] Filtros avançados (por país, tipo, fit score)
- [ ] Export para CSV
- [ ] Paginação (atualmente mostra todas)

---

## 🔧 CORREÇÕES RECENTES

### ✅ Já Corrigido
- [x] Receita Federal removida para empresas internacionais
- [x] Fallback Pilates removido (agora genérico)
- [x] Motor Trade diferenciado de Inteligência B2B
- [x] Filtros de Facebook/Instagram implementados
- [x] Normalização de nomes e domínios

---

## 📊 RESUMO

**Implementado:** 90%
**Falta:** 10% (principalmente enriquecimento automático)

**Próxima ação prioritária:** Conectar enriquecimento automático (Receita Federal + Apollo)

