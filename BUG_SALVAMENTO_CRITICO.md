# 🚨 BUG CRÍTICO: SALVAMENTO NÃO ESTÁ FUNCIONANDO

## ❌ PROBLEMA:

1. **Decisores extraídos → Trocou de aba → PERDEU TUDO**
2. **Digital gerado → Trocou de aba → PERDEU TUDO**
3. **Barra de progresso avança ao clicar (errado) → Deve avançar ao SALVAR**
4. **Bolinhas verdes não aparecem**

---

## 🔍 INVESTIGAÇÃO:

### **FLUXO ATUAL (QUEBRADO):**

```
1. Usuário clica "Extrair Decisores"
   ↓
2. DecisorsContactsTab chama onDataChange(data)
   ↓
3. TOTVSCheckCard recebe em onDataChange
   ↓
4. Seta tabDataRef.current.decisors = data ✅
   ↓
5. Seta setUnsavedChanges({ decisors: true }) ✅
   ↓
6. Usuário troca de aba
   ↓
7. handleTabChange verifica unsavedChanges[activeTab]
   ↓
8. Se TRUE → Mostra alerta "Salvar ou Descartar" ✅
   ↓
9. Usuário clica "Salvar e Continuar"
   ↓
10. cancelTabChange() é chamado
   ↓
11. saveTab(activeTab) é chamado
   ↓
12. **AQUI ESTÁ O BUG!**
    - tabDataRef.current.decisors existe? ✅
    - Está sendo incluído no fullReport? ✅
    - Está sendo salvo no banco? ❌❌❌
```

---

## 🐛 CAUSA RAIZ:

**Linha 587-600 (TOTVSCheckCard.tsx):**

```typescript
const fullReport = {
  detection_report: data,
  decisors_report: tabDataRef.current.decisors, // ✅ Está aqui
  keywords_seo_report: tabDataRef.current.keywords,
  // ...
};

const { error } = await supabase
  .from('stc_verification_history')
  .update({ full_report: fullReport })
  .eq('id', stcHistoryId);
```

**POSSÍVEIS CAUSAS:**
1. ❌ `stcHistoryId` está null/undefined
2. ❌ `tabDataRef.current.decisors` está vazio no momento do save
3. ❌ UPDATE não está funcionando (constraints? schema?)
4. ❌ Error está sendo ignorado silenciosamente

---

## ✅ SOLUÇÃO PROPOSTA:

1. **Adicionar logs detalhados em saveTab()**
2. **Verificar se stcHistoryId existe antes de salvar**
3. **Logar erro se UPDATE falhar**
4. **Usar INSERT em vez de UPDATE se registro não existir**

---

## 🔥 PRÓXIMOS PASSOS:

1. Adicionar `console.log('[SAVE] fullReport:', fullReport)` antes do UPDATE
2. Adicionar `console.log('[SAVE] Error:', error)` depois do UPDATE
3. Adicionar `console.log('[SAVE] stcHistoryId:', stcHistoryId)` no início
4. Testar novamente e verificar os logs


