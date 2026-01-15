# 📋 RESUMO: Renomeação STC → SCI (Em Progresso)

## ✅ CONCLUÍDO

### **1. Componente SimpleTOTVSCheckDialog → StrategicIntelligenceDialog**
- ✅ Interface renomeada: `SimpleTOTVSCheckDialogProps` → `StrategicIntelligenceDialogProps`
- ✅ Função renomeada: `SimpleTOTVSCheckDialog` → `StrategicIntelligenceDialog`
- ✅ Títulos atualizados:
  - "Verificação TOTVS" → "Dossiê Estratégico de Prospecção Internacional"
  - "Relatório completo de detecção TOTVS" → "Strategic Commercial Intelligence Report"
- ✅ Imports atualizados em:
  - `src/pages/CompaniesManagementPage.tsx`
  - `src/components/leads-pool/PoolRowActions.tsx`

### **2. QuarantineRowActions - Labels e Tooltips**
- ✅ Label: "Simple TOTVS Check (STC)" → "SCI - Strategic Intelligence"
- ✅ Tooltip título: "⭐ STC - TOTVS Checker" → "⭐ SCI - Strategic Commercial Intelligence (Prioritário)"
- ✅ Tooltip descrição: Atualizada para descrever 47 fontes globais
- ✅ Variável: `enrichingAction === 'TOTVS Check'` → `enrichingAction === 'Strategic Intelligence'`

---

## 🔄 EM PROGRESSO

### **3. Atualizar ICPQuarantine.tsx**
- [ ] Procurar referências a `onEnrichTotvsCheck`
- [ ] Atualizar handlers relacionados
- [ ] Atualizar labels e mensagens

### **4. ProductAnalysisCard (TOTVSCheckCard)**
- [ ] Renomear função `TOTVSCheckCard` → `StrategicIntelligenceCard`
- [ ] Atualizar títulos e descrições
- [ ] Atualizar logs e mensagens

### **5. Hooks**
- [ ] `useSimpleProductCheck` → `useStrategicIntelligence`
- [ ] Atualizar referências à edge function: `simple-totvs-check` → `strategic-intelligence-check`

### **6. Menus e Sidebar**
- [ ] `AppSidebar.tsx` - Atualizar labels do menu
- [ ] Todas as referências a "STC" ou "TOTVS Check" nos menus

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Renomear componente `SimpleTOTVSCheckDialog` → `StrategicIntelligenceDialog`
2. ✅ Atualizar labels em `QuarantineRowActions`
3. ⏳ Atualizar `ICPQuarantine.tsx` (handlers e referências)
4. ⏳ Renomear `ProductAnalysisCard` (função `TOTVSCheckCard`)
5. ⏳ Renomear hooks (`useSimpleProductCheck`)
6. ⏳ Atualizar menus (`AppSidebar.tsx`)
7. ⏳ Atualizar ABA 1 (título e conteúdo)

---

**Status:** 🚧 Em progresso (40% completo)
