# ✅ HOTFIX BUNDLE — HF-STACK-1 Implementado

**Commit:** `efd061f`  
**Data:** 2025-11-05  
**Status:** 🟢 COMPLETO (Parcial: A+B+D, pendente: C)

---

## 📊 RESUMO DOS HOTFIXES

### ✅ HF-STACK-1.A — Discovery Manual-Only + Query Otimizada

**Problema:**
- Discovery automático consumia créditos sem controle
- Query incluía CNPJ → viés para diretórios/agregadores
- Resultados contaminados com econodata, cnpj.biz, serasa, etc.

**Solução:**
1. ✅ Respeita `SAFE_MODE` e `DISABLE_AUTO_DISCOVERY`
2. ✅ Query SEM CNPJ, focada em "site oficial" + TLDs corporativos
3. ✅ Blocklist de 11 agregadores conhecidos
4. ✅ Filtro aplicado ANTES do ranking

**Arquivos modificados:**
- `src/components/icp/tabs/KeywordsSEOTabEnhanced.tsx` (+3 linhas)
- `src/components/icp/tabs/discovery/deterministicDiscovery.ts` (+42 linhas)

**Queries novas:**
```
1. "{razaoSocial}" "site oficial"
2. "{razaoSocial}" site:*.com.br -econodata.com.br -cnpj.biz -cnpj.ws ...
3. "{razaoSocial}" (site:.com OR site:.com.br) -econodata -cnpj.biz ...
4. "{razaoSocial}" (site:linkedin.com OR site:instagram.com OR ...)
```

**Blocklist:**
```
econodata.com.br, cnpj.biz, cnpj.ws, serasa.com.br, 
guiadeempresas, escavador.com, telelistas.net, 
economia.uol.com.br, biz.yahoo.com, dun-bradstreet, 
empresascnpj.com
```

---

### ✅ HF-STACK-1.B — Bloqueio de Navegação com Alterações Não Salvas

**Problema:**
- Usuário podia sair/recarregar página com dados não salvos
- Perda de análises processadas (desperdício de créditos)

**Solução:**
1. ✅ `useBeforeUnload` com callback condicional
2. ✅ Prompt nativo do navegador quando `hasDirty = true`
3. ✅ Integrado com sistema de `unsavedChanges` existente

**Arquivos modificados:**
- `src/components/totvs/TOTVSCheckCard.tsx` (+10 linhas)

**Código adicionado:**
```typescript
const hasDirty = Object.values(unsavedChanges).some(v => v === true);
useBeforeUnload(
  useCallback((e) => {
    if (!hasDirty) return;
    e.preventDefault();
    e.returnValue = '';
  }, [hasDirty])
);
```

**Comportamento:**
- Se tiver alterações não salvas → Navegador mostra aviso
- Se tudo salvo → Navegação livre

---

### ✅ HF-STACK-1.D — UI Bug Fix (`<p>` dentro de `<p>`)

**Problema:**
- `AlertDialogDescription` com `<p>` aninhados
- Warnings no console do navegador
- Possível problema de acessibilidade

**Solução:**
1. ✅ Convertido todos `<p>` internos para `<div>`
2. ✅ Estrutura semântica correta (conforme Radix UI spec)

**Arquivos modificados:**
- `src/components/totvs/TOTVSCheckCard.tsx` (+10 linhas modificadas)

**Antes:**
```tsx
<AlertDialogDescription>
  <p>Texto 1</p>
  <div>
    <p>Texto aninhado</p>
  </div>
</AlertDialogDescription>
```

**Depois:**
```tsx
<AlertDialogDescription>
  <div>Texto 1</div>
  <div>
    <div>Texto aninhado</div>
  </div>
</AlertDialogDescription>
```

---

## ⏳ PENDENTE: HF-STACK-1.C — Migrar REST → supabase-js

**Status:** ⚠️ NÃO IMPLEMENTADO (requer análise de hooks)

**Motivo:**
- Não foram encontrados erros 400/406 ativos
- `useReportAutosave` já usa supabase-js corretamente
- Requer auditoria de outros hooks (useSTCHistory, etc.)

**Próximo passo:**
- Identificar hooks que ainda usam fetch manual
- Migrar para supabase-js
- Emitir SPEC separada se necessário

---

## 📋 ARQUIVOS MODIFICADOS

```
src/components/icp/tabs/KeywordsSEOTabEnhanced.tsx     (+3 linhas)
src/components/icp/tabs/discovery/deterministicDiscovery.ts (+42 linhas)
src/components/totvs/TOTVSCheckCard.tsx                 (+20 linhas)
```

**Total:** +65 linhas, -26 removidas

---

## ✅ VALIDAÇÃO

### Discovery Manual-Only

1. **Com SAFE_MODE=1:**
   - Clicar em "Descobrir Website" mostra toast de aviso
   - Nenhuma chamada a Serper
   - Console: `[SAFE] ⏸️ Auto discovery desabilitado`

2. **Sem SAFE_MODE:**
   - Discovery executa normalmente
   - Query sem CNPJ (mais limpa)
   - Resultados filtrados (sem agregadores)

### Bloqueio de Navegação

1. **Com alterações não salvas:**
   - Tentar recarregar (F5) → Navegador mostra aviso
   - Tentar fechar aba → Navegador mostra aviso
   - Confirmação necessária para sair

2. **Com tudo salvo:**
   - Navegação livre
   - Sem prompts

### UI Bug

1. **Console:**
   - Sem warnings de `<p>` aninhados
   - Estrutura HTML válida

2. **Acessibilidade:**
   - AlertDialog segue spec Radix UI
   - Semântica correta

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Testar com SAFE_MODE ativo**
2. ✅ **Validar discovery manual-only**
3. ✅ **Testar bloqueio de navegação**
4. ✅ **Verificar console sem warnings**
5. ⚠️ **HF-STACK-1.C** (pendente - migração REST → supabase-js)

---

## 🏁 STATUS FINAL

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  ✅ HF-STACK-1 (A+B+D) — IMPLEMENTADO                     ║
║                                                            ║
║  📦 Commit: efd061f                                       ║
║  📊 3 arquivos modificados (+65/-26 linhas)               ║
║  🛡️ Discovery protegido por SAFE MODE                    ║
║  🔒 Navegação bloqueada com dirty state                  ║
║  🎨 UI bug corrigido (p dentro de p)                     ║
║  ⏳ HF-C pendente (migração supabase-js)                 ║
║                                                            ║
║  ⏭️  Próximo: Validar + implementar HF-C                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

**Data:** 2025-11-05  
**Status:** 🟢 Parcial (3/4 hotfixes completos)  
**Próximo:** HF-STACK-1.C (migração REST para supabase-js)

